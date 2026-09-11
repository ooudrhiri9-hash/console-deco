# ATELIER OMAR — site vitrine & boutique

Mobilier d'art et tableaux, fabriqués au Maroc.
Site statique bilingue (FR/EN) avec catalogue, panier et commande en paiement à la livraison.

---

## Stack et pourquoi

| Choix | Raison |
|---|---|
| **Next.js 16, App Router, `output: 'export'`** | Génère du HTML pur. Se dépose tel quel dans `public_html` d'un hébergement mutualisé cPanel — pas de Node à faire tourner, pas de coût serveur, temps de réponse minimal. |
| **CSS pur avec tokens** | Aucun framework UI. Le poids CSS reste sous 20 ko et le design ne dépend pas d'une version de Tailwind/Bootstrap à maintenir dans 3 ans. |
| **Catalogue figé au build, puis rafraîchi dans le navigateur** | `npm run sync` écrit `src/data/catalogue.json`, embarqué dans le HTML statique : c'est ce que Google indexe et ce qui s'affiche en premier. `LiveCatalogue` relit ensuite `/api/catalogue` et corrige prix, stock, textes et liste des pièces — une modification de l'admin est visible sans reconstruction, et le site reste lisible si l'API tombe. |
| **API Express séparée (`../backend`)** | Commandes, messages et back-office ont besoin d'écrire quelque part. L'API vit sur son propre hébergement Node ; le site reste statique. |
| **WhatsApp en canal principal** | C'est par là que les clients marocains confirment réellement une commande. Chaque fiche produit et le tunnel de commande génèrent un message pré-rempli. |

---

## Démarrer

```bash
npm install
npm run dev            # http://localhost:3000
npm run build          # génère out/  (export statique)
```

Prévisualiser exactement ce qui sera mis en ligne :

```bash
npm run build
node scripts/serve-out.mjs 4321   # http://localhost:4321
```

---

## Structure

```
src/
  config/api.ts         ← adresse de l'API (NEXT_PUBLIC_API_URL)
  config/site.ts        ← marque et coordonnées : valeurs de secours, l'admin fait foi
  data/catalogue.json   ← instantané de l'API, écrit par `npm run sync` (GÉNÉRÉ)
  data/categories.ts    ← les 5 familles — repli hors ligne si l'instantané est vide
  data/products.ts      ← catalogue de repli hors ligne (GÉNÉRÉ à l'origine du CSV)
  admin/                ← client API, coquille et types du back-office
  app/(admin)/admin/    ← back-office : tableau de bord, pièces, commandes, messages, réglages
  i18n/                 ← locales + tous les textes d'interface FR/EN
  lib/routes.ts         ← URLs traduites + bascule FR/EN
  lib/seo.tsx           ← metadata, canonical, hreflang, JSON-LD
  components/           ← header, footer, cartes, panier, formulaires
  views/                ← le corps de chaque page, partagé entre FR et EN
  app/(fr)/             ← routes françaises, à la racine   (/produits/…)
  app/(en)/en/          ← routes anglaises, sous /en       (/en/products/…)
public/
  .htaccess             ← HTTPS, 404, cache, compression, en-têtes de sécurité
  media/products/       ← photos produits
```

Deux `layout.tsx` racines (un par langue) : c'est ce qui permet d'avoir le
français **à la racine** (`/produits/`) et l'anglais sous `/en/`, chacun avec
son propre `<html lang>`, sans redirection ni middleware — impossible autrement
en export statique.

---

## Mettre le catalogue à jour

Le catalogue se modifie dans le back-office (`/admin/`), pas dans le code. Prix,
stock, textes, photos et nouvelles pièces apparaissent dès que le visiteur
recharge la page. Reconstruire reste nécessaire pour donner sa **vraie page** à
une pièce nouvelle (d'ici là ses cartes pointent vers `/produits/piece/?slug=…`)
et pour le référencement :

```bash
npm run build      # sync + next build + postbuild
```

`npm run build` commence par interroger l'API. Si elle ne répond pas, le dernier
instantané est conservé et le build continue — utile en avion, dangereux en
production : utilisez `npm run build:live`, qui échoue plutôt que de publier des
données périmées.

```bash
npm run sync             # rafraîchit src/data/catalogue.json seulement
npm run build:live       # build qui refuse de démarrer sans API
```

> `src/data/catalogue.json` est **généré**. `src/data/products.ts` et
> `src/data/categories.ts` ne servent plus que de repli hors ligne : la base de
> l'API fait foi depuis la mise en place du back-office.

---

## Mise en ligne (cPanel / Hostinger)

```bash
npm run build:live
```

Puis envoyer **tout le contenu de `out/`** (y compris `.htaccess`) dans
`public_html/`. Le dossier `out/admin/` en fait partie : c'est le back-office.

⚠️ Ne pas zipper avec `Compress-Archive` de PowerShell : il écrit des chemins
avec des antislash que l'extracteur Linux de cPanel ne sait pas lire. Utiliser :

```powershell
tar.exe -a -c -f site.zip -C out .
```

Avant le premier envoi, `NEXT_PUBLIC_API_URL` (dans `.env.local`) doit pointer
sur l'API en production : la valeur est **figée dans le HTML au moment du build**.
Le domaine du site doit lui aussi figurer dans `ALLOWED_ORIGINS` côté API, sinon
le navigateur bloque commandes et messages.

Après le premier envoi :

- ouvrir `https://<domaine>/admin/` et se connecter ;
- passer une commande test et la retrouver dans le back-office ;
- envoyer un message depuis `/contact/` et le retrouver dans « Messages » ;
- soumettre `https://<domaine>/sitemap.xml` dans Google Search Console.

---

## Ce qui reste à brancher

Tout est regroupé dans `docs/CLIENT-CHECKLIST.md`. En résumé : le vrai nom de
marque, les coordonnées, les photos, et le catalogue réel.
