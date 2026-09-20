# Maison Déco — boutique + back-office

Mobilier d'art et tableaux, fabriqués au Maroc. Deux applications, un seul projet.

```
frontend/   Next.js 16, export statique FR/EN  → servi par Nginx sur le VPS
backend/    API Express + MongoDB Atlas        → process Node sous PM2, même VPS
deploy/     Nginx, PM2, scripts d'installation et de déploiement
docs/       catalogue de départ (CSV) et notes client
```

## Comment les deux se parlent

| Moment | Qui appelle quoi |
|---|---|
| Build du site | `npm run build` lit `GET /api/catalogue` et fige produits, familles et réglages dans `frontend/src/data/catalogue.json`. |
| Visite d'une page | Le HTML construit s'affiche tout de suite, puis **un seul appel à `GET /api/catalogue`** rafraîchit prix, stock, textes, photos et liste des pièces. Si l'API ne répond pas, la page garde ce qu'elle affichait. |
| Commande | Le navigateur poste sur `POST /api/orders`. Les prix sont **relus dans la base** : le panier ne fixe pas le prix. |
| Message de contact | `POST /api/messages`. |
| Back-office `/admin/` | Pages statiques, vides au chargement, qui lisent et écrivent via `/api/admin/*` avec un jeton JWT. |

Conséquence à retenir : **une modification faite dans `/admin/` est visible dès
que le visiteur recharge la page**, sans reconstruction. L'API met sa réponse en
cache 30 s (`stale-while-revalidate` 5 min) : un visiteur déjà venu peut voir
quelques minutes de retard, jamais davantage.

Ce qui demande quand même `npm run build` :

- la **page dédiée** d'une pièce nouvelle — en attendant, ses cartes pointent
  vers `/produits/piece/?slug=…`, une fiche rendue dans le navigateur ;
- le **référencement** : titre, description, `sitemap.xml` et données
  structurées sont écrits au build ;
- les **coordonnées et réglages** affichés dans l'en-tête et le pied de page.

## Démarrer en local

```bash
# 1. l'API
cd backend
cp .env.example .env.local     # renseigner AUTH_SECRET et ADMIN_PASSWORD
npm install
npm run seed                   # crée l'administrateur + le catalogue de départ
npm run dev                    # http://localhost:4400

# 2. le site
cd ../frontend
npm install
npm run dev                    # http://localhost:3000  (back-office : /admin/)
```

`frontend/.env.local` doit contenir l'adresse de l'API :

```
NEXT_PUBLIC_API_URL=http://localhost:4400
```

Pour voir exactement ce qui sera publié :

```bash
cd frontend
npm run build
node scripts/serve-out.mjs 4321   # http://localhost:4321
```

## Mise en ligne

Cible actuelle : **un VPS Hostinger (KVM 1, Ubuntu 24.04)**, un seul domaine —
`maisondeco.ma`. Nginx sert l'export statique et transmet `/api` et `/uploads`
au process Node tenu par PM2 ; la base reste chez MongoDB Atlas.

La procédure complète, de la création du VPS au premier déploiement, est dans
**[docs/DEPLOIEMENT-VPS.md](docs/DEPLOIEMENT-VPS.md)**. En résumé :

```bash
# une seule fois, en root sur le VPS
REPO=https://github.com/…/….git bash deploy/setup-vps.sh
certbot --nginx -d maisondeco.ma -d www.maisondeco.ma

# à chaque mise à jour
/srv/maisondeco/deploy/deploy.sh
```

Les fichiers correspondants vivent dans `deploy/` : configuration Nginx,
déclaration PM2, script d'installation, script de déploiement.

L'adresse de l'API est figée dans le HTML au moment du build : la changer impose
un nouveau build, jamais un simple réglage sur le serveur. Sur le VPS elle vaut
`https://maisondeco.ma`, l'API étant derrière le même domaine.

## Points d'attention

- **Photos envoyées depuis l'admin** : sur le VPS elles restent dans
  `backend/uploads/`, que le disque persistant et `.gitignore` gardent d'un
  déploiement à l'autre — Cloudinary n'est plus nécessaire. `CLOUDINARY_URL`
  reste utile sur un hébergeur au disque éphémère.
- **Les adresses des pages ne bougent pas** quand on renomme une pièce : le slug
  est fixé à la création, pour ne casser aucun lien déjà indexé.
- **`frontend/src/data/products.ts` et `categories.ts`** ne sont plus la source
  du catalogue, seulement un repli si l'instantané est vide.
