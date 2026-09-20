# Mise en ligne sur un VPS Hostinger (KVM 1)

> Machine en service : `152.239.118.147`, Ubuntu 26.04 LTS, 1 vCPU, 3,8 Go de
> RAM, 48 Go de disque. Accès : `ssh maisondeco-root` (root) et `ssh maisondeco`
> (utilisateur applicatif), déclarés dans `~/.ssh/config`.

Tout tient sur une seule machine et un seul domaine : Nginx sert le site
statique et transmet `/api` au process Node. La base reste chez MongoDB Atlas.

```
                  maisondeco.ma  (443, certificat Let's Encrypt)
                            |
                          Nginx
            /                            \
 /var/www/maisondeco                127.0.0.1:4400
 export Next (HTML, CSS,            API Express sous PM2
 images, sitemap)                   /api/*, /uploads/*, /health
                                             |
                                    MongoDB Atlas (hors VPS)
```

Ce que le VPS change par rapport à l'ancienne cible (Render + hébergement
mutualisé) :

| | Avant | Sur le VPS |
|---|---|---|
| Adresse de l'API | domaine séparé | même domaine, `/api` |
| CORS | indispensable | toujours renseigné, mais plus de domaine croisé |
| Photos de `/admin` | perdues au déploiement sans Cloudinary | gardées sur le disque, dans `backend/uploads/` |
| Réveil du service | ~50 s sur le plan gratuit Render | aucun, le process tourne en continu |
| Publication du site | zip envoyé dans `public_html/` | `deploy.sh` sur le serveur |

---

## Avant de commencer

1. **Le VPS existe** et vous avez son adresse IP (panneau Hostinger → VPS).
2. **DNS** : chez le registrar de `maisondeco.ma`, deux enregistrements `A`
   vers cette IP — un pour `maisondeco.ma`, un pour `www`. Comptez de quelques
   minutes à quelques heures de propagation ; le certificat HTTPS ne peut pas
   être délivré avant.
3. **MongoDB Atlas** : *Network Access* → ajouter l'IP du VPS. Sans cela l'API
   démarre mais ne répond jamais sur `/api/catalogue`.
4. **Clé SSH** déposée à la création du VPS. Test :

   ```powershell
   ssh root@VOTRE_IP
   ```

---

## 1. Installation de la machine

Depuis le VPS, récupérez le script d'installation et lancez-le :

```bash
ssh root@VOTRE_IP
curl -fsSL https://raw.githubusercontent.com/ooudrhiri9-hash/console-deco/main/deploy/setup-vps.sh -o setup-vps.sh
bash setup-vps.sh
```

Le dépôt visé est `ooudrhiri9-hash/console-deco`, branche `main`. S'il est
privé, `curl` renverra une page d'erreur : clonez-le alors à la main (clé de
déploiement GitHub, ou jeton) dans `/srv/maisondeco`, puis lancez
`bash /srv/maisondeco/deploy/setup-vps.sh`.

Le dépôt est public, donc le clone se fait sans clé. `main` est la branche
suivie par défaut ; `BRANCH=<autre>` permet d'en viser une autre, et
`deploy.sh` fait ensuite ses `git pull` sur celle qui est en place.

Le script installe Nginx, Node 22 (dépôts Ubuntu), PM2, certbot, le pare-feu
UFW et fail2ban,
ajoute 2 Go de swap, crée l'utilisateur **`deco`** qui fera tourner l'API — pas
root, de home `/home/deco` — et clone le dépôt dans `/srv/maisondeco`.

> Il coupe aussi l'authentification SSH par mot de passe. Vérifiez que votre clé
> fonctionne **avant** de fermer la session en cours.

---

## 2. Variables d'environnement

Deux fichiers, aucun des deux n'est dans le dépôt (`.gitignore` les couvre).

### `/srv/maisondeco/backend/.env`

```bash
sudo -u deco nano /srv/maisondeco/backend/.env
```

```ini
# Base — la chaîne de connexion Atlas, mot de passe compris.
MONGODB_URI=mongodb+srv://utilisateur:motdepasse@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=atelier_omar

# Signature des jetons d'administration. Générer avec : openssl rand -hex 32
AUTH_SECRET=

# Compte administrateur — utilisé uniquement par `npm run seed`.
ADMIN_EMAIL=admin@maisondeco.ma
ADMIN_PASSWORD=

# Réseau. Le site appelle l'API depuis la même origine, mais un POST envoie
# quand même un en-tête Origin : les deux formes doivent figurer ici.
PORT=4400
ALLOWED_ORIGINS=https://maisondeco.ma,https://www.maisondeco.ma
PUBLIC_URL=https://maisondeco.ma

# Cloudinary devient facultatif : le disque du VPS est persistant, les photos
# envoyées depuis /admin survivent aux déploiements dans backend/uploads/.
CLOUDINARY_URL=
CLOUDINARY_FOLDER=atelier-omar/produits
```

```bash
sudo -u deco chmod 600 /srv/maisondeco/backend/.env
```

### `/srv/maisondeco/frontend/.env.local`

```ini
# Figé dans le HTML au moment du build. Le changer impose un nouveau build.
NEXT_PUBLIC_API_URL=https://maisondeco.ma
```

---

## 3. Démarrer l'API

```bash
sudo -iu deco bash -c 'cd /srv/maisondeco/backend && npm ci --omit=dev'

# Seulement si la base Atlas est vide : crée l'administrateur et le catalogue.
sudo -iu deco bash -c 'cd /srv/maisondeco/backend && npm run seed'

sudo -iu deco pm2 start /srv/maisondeco/deploy/ecosystem.config.cjs
sudo -iu deco pm2 save
pm2 startup systemd -u deco --hp /home/deco   # installe le service de demarrage
```

> `-i` n'est pas décoratif : `sudo -u deco` sans lui garde `/root` comme
> répertoire courant, que `deco` ne peut pas lire, et le lancement de Node
> échoue sur un `spawn /usr/bin/node EACCES` déroutant.

Vérification :

```bash
curl -s http://127.0.0.1:4400/health
```

`{"ok":true,...}` attendu. En cas de silence : `sudo -iu deco pm2 logs maisondeco-api`,
ou `tail /var/log/maisondeco/api-error.log`.

---

## 4. Nginx et certificat HTTPS

La configuration a été posée par le script d'installation
(`deploy/nginx-maisondeco.conf` → `/etc/nginx/sites-available/maisondeco`).
Une fois le DNS propagé :

```bash
certbot --nginx -d maisondeco.ma -d www.maisondeco.ma
```

Certbot ajoute lui-même le bloc `443` et la redirection depuis le port 80, puis
installe un renouvellement automatique (`systemctl list-timers | grep certbot`).

> Conséquence : le fichier sur le serveur ne ressemble plus à celui du dépôt.
> Si vous modifiez `deploy/nginx-maisondeco.conf` plus tard, recopiez-le puis
> relancez `certbot --nginx` pour réinstaller le bloc TLS.

---

## 5. Premier déploiement du site

```bash
sudo -iu deco /srv/maisondeco/deploy/deploy.sh
```

Le script récupère le code, met à jour l'API, attend qu'elle réponde,
reconstruit le site (`npm run build:live`, qui **échoue** plutôt que de publier
un catalogue périmé) et copie `frontend/out/` dans `/var/www/maisondeco`.

Sur 1 vCPU, compter deux à trois minutes pour le build.

---

## 6. Vérifications

| À vérifier | Comment |
|---|---|
| Le site répond en HTTPS | `https://maisondeco.ma` |
| L'API passe par Nginx | `https://maisondeco.ma/health` → `originAllowed` non `false` |
| Le catalogue est vivant | changer un prix dans `/admin`, recharger une fiche |
| Le back-office | `https://maisondeco.ma/admin/` |
| Une commande part | passer une commande de test, la voir dans `/admin/commandes` |
| Une photo envoyée reste | téléverser depuis `/admin`, relancer `deploy.sh`, vérifier qu'elle s'affiche |

**Les réglages en base l'emportent sur le code.** La base contenait encore
`https://atelier-omar.ma` : la valeur a été corrigée en `https://maisondeco.ma`
le 20/09/2026, sans quoi le build aurait figé des canonicals et un `sitemap.xml`
pointant sur l'ancien domaine. Toute reprise depuis une sauvegarde ancienne
ramènera le problème — vérifier `/admin → Réglages` après une restauration.

Reste en attente dans ces mêmes réglages : `email`, toujours à
`contact@atelier-omar.ma`, une adresse qui n'existe pas.

---

## 7. Les fois suivantes

```bash
ssh deco@VOTRE_IP
/srv/maisondeco/deploy/deploy.sh
```

Rappel utile : une modification faite dans `/admin` (prix, stock, textes,
photos) est visible **sans déploiement**, au rechargement de la page. Le build
n'est nécessaire que pour la page dédiée d'une pièce nouvelle, le référencement
(titres, sitemap, données structurées) et les coordonnées de l'en-tête et du
pied de page.

---

## 8. Sauvegardes

- **Base** : Atlas sauvegarde le cluster. Un export manuel avant une grosse
  manipulation : `mongodump --uri="$MONGODB_URI" --out=/srv/maisondeco/backup-$(date +%F)`.
- **Photos** : `backend/uploads/` n'est pas dans le dépôt. À récupérer
  régulièrement — par exemple, depuis votre poste :
  `rsync -az deco@VOTRE_IP:/srv/maisondeco/backend/uploads/ ./sauvegarde-photos/`
- **Snapshots Hostinger** : un instantané de la machine entière avant chaque
  changement d'infrastructure (panneau VPS → Snapshots).

---

## 9. Dépannage

| Symptôme | Cause la plus fréquente |
|---|---|
| `502 Bad Gateway` sur `/api` | le process est tombé : `sudo -iu deco pm2 logs maisondeco-api` |
| Le site s'affiche, mais prix et stock ne bougent jamais | l'API ne répond pas ; `curl https://maisondeco.ma/health` |
| Commande ou message refusé sans erreur claire | domaine absent de `ALLOWED_ORIGINS`, puis `pm2 reload maisondeco-api --update-env` |
| `/admin` déconnecte aussitôt | `AUTH_SECRET` vide ou modifié — les jetons émis avant deviennent invalides |
| Catalogue vide après un build | `build:live` n'a pas pu lire `/api/catalogue` ; vérifier l'IP du VPS dans Atlas *Network Access* |
| Photos absentes après déploiement | `PUBLIC_URL` incorrect : les URLs d'images sont construites avec |
| `404` sur une page qui existe | build non publié : relancer `deploy.sh`, vérifier `/var/www/maisondeco` |
| Certificat non délivré | DNS pas encore propagé, ou port 80 fermé (`ufw status`) |

---

## 10. Éteindre l'ancienne API Render

Le VPS remplace Render : `render.yaml` a été retiré du dépôt. Supprimer le
fichier n'arrête pas le service — **il faut le suspendre ou le supprimer depuis
le tableau de bord Render**, sinon deux API écrivent la même base Atlas et le
catalogue a deux sources de vérité.

Dans l'ordre :

1. Le site du VPS répond et passe les vérifications de la section 6.
2. Tableau de bord Render → le service `atelier-omar-api` → *Suspend*
   (réversible) puis, une fois quelques jours passés sans incident, *Delete*.
3. Retirer l'IP de Render de *Network Access* dans Atlas : seule celle du VPS
   doit rester.

À vérifier avant de supprimer : qu'aucune photo produit ne pointe encore vers
`…onrender.com/uploads/…`. Dans l'instantané du dernier build, toutes les images
sont en `/media/products/…`, donc servies par le site lui-même — mais un contrôle
dans `/admin → Produits` coûte une minute et évite des images cassées.
