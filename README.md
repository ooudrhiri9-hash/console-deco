# Atelier Omar — boutique + back-office

Mobilier d'art et tableaux, fabriqués au Maroc. Deux applications, un seul projet.

```
frontend/   Next.js 16, export statique FR/EN  → hébergement mutualisé (cPanel/Hostinger)
backend/    API Express + JSON ou MongoDB      → hébergement Node (Render, VPS, cPanel Node)
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

1. **API d'abord.** `render.yaml` à la racine décrit le service : sur Render,
   *New → Blueprint*, choisir ce dépôt, et remplir les variables qu'il réclame —
   `MONGODB_URI`, `ALLOWED_ORIGINS` (le domaine du site, sinon le navigateur
   bloque commandes et messages), `PUBLIC_URL`, `CLOUDINARY_URL`. `AUTH_SECRET`
   est généré par Render. La base contenant déjà le catalogue et le compte
   administrateur, `npm run seed` n'est pas nécessaire.
   Sur le plan gratuit le service s'endort après 15 min : la première visite
   attend ~50 s. La boutique reste lisible pendant ce temps (elle affiche
   l'instantané du build), mais une commande passée pile à ce moment attend.
2. **Site ensuite.** Mettre `NEXT_PUBLIC_API_URL` sur l'API en production, puis
   `npm run build:live` et envoyer `out/` dans `public_html/`.

L'adresse de l'API est figée dans le HTML au moment du build : la changer impose
un nouveau build, jamais un simple réglage sur le serveur.

⚠️ Ne pas zipper avec `Compress-Archive` de PowerShell (chemins en antislash,
illisibles par l'extracteur de cPanel). Utiliser `tar.exe -a -c -f site.zip -C out .`

## Points d'attention

- **Photos envoyées depuis l'admin** : avec `CLOUDINARY_URL` renseigné elles
  partent chez Cloudinary (dossier `atelier-omar/produits`) et survivent à un
  déploiement, même sur un hébergeur au disque éphémère. Sans cette variable
  elles restent dans `backend/uploads/`, ce qui ne convient qu'au développement.
- **Les adresses des pages ne bougent pas** quand on renomme une pièce : le slug
  est fixé à la création, pour ne casser aucun lien déjà indexé.
- **`frontend/src/data/products.ts` et `categories.ts`** ne sont plus la source
  du catalogue, seulement un repli si l'instantané est vide.
