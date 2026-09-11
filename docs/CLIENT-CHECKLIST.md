# Ce dont j'ai besoin pour finir le site

Le site est **construit et fonctionnel** : navigation, catalogue, fiches produit,
panier, commande, contact, FR/EN, SEO. Le catalogue de démonstration a été
remplacé par vos vraies pièces le 04/09/2026. Ce qui manque encore est listé
ci-dessous — les prix en premier.

---

## 1. Identité — bloquant pour la mise en ligne

Tout se saisit dans le back-office, page **Réglages** (`/admin/reglages/`).
Aucun fichier à modifier.

| À fournir | Actuellement | Utilisé pour |
|---|---|---|
| Nom de marque exact | `ATELIER OMAR` *(placeholder)* | Logo texte, titres, e-mails, données structurées |
| Nom de domaine définitif | `atelier-omar.ma` *(placeholder)* | URLs canoniques, sitemap, partages WhatsApp |
| Numéro de téléphone | `+212 6 65 20 24 95` *(placeholder)* | Bouton appel, pied de page |
| Numéro WhatsApp | idem | Tous les boutons WhatsApp et messages pré-remplis |
| Adresse e-mail | `contact@atelier-omar.ma` | Formulaires, réception des commandes |
| Adresse de l'atelier / showroom | vide | Pied de page, page contact, référencement local |
| Instagram / Facebook / TikTok | liens génériques | Pied de page, données structurées |
| Horaires réels | `Lundi – Samedi, 9h – 19h` | Page contact |
| Seuil de livraison offerte | `1500 DH` | Bandeau haut + barre de progression du panier |

> Les commandes et les messages n'arrivent plus par e-mail : ils s'affichent
> dans le back-office, pages **Commandes** et **Messages**.

## 2. Le catalogue — 27 pièces en ligne, sans prix

Les photos WhatsApp ont été dépouillées et intégrées : **26 consoles et
1 table basse**, avec nom FR/EN, résumé, description, matériaux, finition et
coloris. Source éditable : `docs/catalogue.csv` (Excel → *CSV UTF-8*), puis
`npm run import:catalogue`.

**Bloquant : il manque tous les prix.** Aucune liste de prix consoles ou tables
n'a été fournie, donc les 27 fiches affichent « Prix sur demande » et le panier
compte 0 DH. Il suffit de remplir la colonne `price` du CSV et de relancer
l'import.

À confirmer également :

- **« Fabriqué sur commande »** est affiché sur les 27 pièces, sans délai. Si
  certaines sont en stock, mettre `made_to_order` à `non` ; si elles sont bien
  sur commande, donner le délai en jours (`lead_time_days`).
- **Dimensions** : seules 5 pièces en ont, celles dont vous avez envoyé le plan
  ou la cote (Damier 140 / 150 / 160, Motifs africains 1 m 60, table basse
  120 × 60 × 35). Les 22 autres n'affichent aucune dimension.
- **Trois familles restent vides** : console + tableau, table d'appoint,
  tableau. Leur page affiche « Cette collection sera bientôt en ligne ».
- **Tableaux** : 4 photos sont prêtes mais non publiées — voir
  `docs/PRIX-TABLEAUX.md`. Les prix des formats carrés sont connus, ceux des
  formats rectangulaires manquent, et les 4 photos sont toutes rectangulaires.

## 3. Les photos

**Fait** : 40 visuels produits en WebP 800 × 1000, dans
`public/media/products/`, générés depuis vos envois par
`node scripts/prepare-media.mjs` (ce script garde la trace du fichier d'origine
de chaque photo). 11 pièces ont 2 ou 3 vues, les autres une seule.

Restent à fournir :

- **1 photo d'ambiance pour chaque famille**. Consoles et tables basses
  utilisent pour l'instant une photo produit ; les 3 familles vides n'ont rien.
- **1 photo pour la bannière d'accueil** (paysage, 2000 px de large) ;
- **1 photo pour la page « À propos »** (l'atelier, les mains au travail) ;
- **1 image de partage 1200 × 630** → remplace `public/og-default.png`. C'est
  l'image qui s'affiche quand quelqu'un colle le lien du site dans WhatsApp.
- **2 à 4 vues par pièce** dans l'idéal : 16 des 27 fiches n'ont qu'une photo.

## 4. Les textes « À propos »

La page raconte aujourd'hui une histoire plausible mais inventée
(`src/views/AboutView.tsx`, signalé en commentaire). À remplacer par le vrai
récit : année de création, où est l'atelier, combien d'artisans, ce que vous
faites qui n'est pas fait ailleurs.

## 5. Points à trancher

1. **Livraison** — montant réel ? forfait unique, ou par ville ? Le tunnel
   affiche pour l'instant « calculée à la confirmation », ce qui est honnête
   mais fait perdre des commandes. Un montant affiché convertit mieux.
2. **Retours** — le site n'a pas encore de page CGV / retours / mentions
   légales. C'est une obligation légale et un facteur de confiance ; à écrire
   dès que la politique commerciale est fixée.
3. **Paiement en ligne** — non branché (choix retenu : paiement à la livraison).
   Si le CMI est souhaité plus tard, le tunnel est prêt à l'accueillir.
4. **Avis clients** — les trois concurrents en affichent tous. Dès que vous avez
   des avis réels, on ajoute une section (et le balisage `AggregateRating` qui
   fait apparaître les étoiles dans Google).

---

## Ce qui est déjà fait

- 5 familles de produits, avec URL et texte propres à chacune, en FR et EN
- 27 pièces réelles en ligne (26 consoles + 1 table basse) et leurs 40 photos
- fiches produit complètes (galerie, prix, promo, stock, spécifications, sur-mesure)
- panier persistant, tunnel de commande, paiement à la livraison
- commande envoyée par e-mail **et** journalisée en CSV, plus WhatsApp pré-rempli
- formulaire de contact
- SEO : titres et descriptions uniques, canoniques, hreflang FR/EN, sitemap,
  robots.txt, données structurées (Organization, Product, ItemList, fil d'Ariane)
- HTTPS forcé, 404 personnalisée, cache et compression via `.htaccess`
- responsive, menu mobile, lien d'évitement clavier
