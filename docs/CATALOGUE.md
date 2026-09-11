# Colonnes du fichier catalogue

Modèle prêt à remplir : `catalogue-template.csv`.
Enregistrer le fichier de travail sous `docs/catalogue.csv`, puis :

```bash
npm run import:catalogue -- --check   # contrôle
npm run import:catalogue              # génère src/data/products.ts
npm run build
```

Le fichier doit être en **UTF-8**. Excel : *Enregistrer sous → CSV UTF-8*.
Le séparateur peut être `,` ou `;`.

## Colonnes

| Colonne | Obligatoire | Détail |
|---|---|---|
| `id` | **oui** | Référence / SKU. Visible par le client sur la fiche et dans les commandes. **Ne jamais la réutiliser ni la changer** : elle identifie le produit dans le panier des visiteurs. Ex. `CNS-001`. |
| `slug` | non | Fin de l'URL. Laisser vide : il est déduit du nom FR (accents retirés). À ne plus modifier une fois le produit en ligne, sinon le lien meurt. |
| `category` | **oui** | `consoles`, `console-tableau`, `tables-basses`, `tables-appoint` ou `tableaux`. Les orthographes courantes sont acceptées (`table basse`, `tableau`, `console tableau`…). |
| `name_fr` | **oui** | Nom affiché en français. |
| `name_en` | non | Nom anglais. Vide → le nom français est réutilisé. |
| `short_fr` / `short_en` | recommandé | Une phrase. Sert sur les cartes du catalogue, dans la meta description Google et dans le message WhatsApp. |
| `description_fr` / `description_en` | recommandé | Description complète. **Laisser une ligne vide entre deux paragraphes** (dans Excel : Alt+Entrée deux fois). |
| `price` | **oui** | En dirhams, nombre seul : `4900`. Mettre `0` affiche « Prix sur demande ». |
| `compare_at_price` | non | Prix barré. Doit être **supérieur** au prix, sinon aucun badge promo n'apparaît. |
| `images` | recommandé | Noms de fichiers séparés par `\|` : `console-1.webp\|console-2.webp`. Les fichiers vont dans `public/media/products/`. Un chemin commençant par `/` est pris tel quel. Vide → cadre de remplacement à la marque. |
| `width` / `depth` / `height` | recommandé | En centimètres, nombres seuls. Affichés « 120 × 35 × 80 cm ». |
| `materials_fr` / `materials_en` | recommandé | Ex. « Noyer massif, laiton brossé ». |
| `finish_fr` / `finish_en` | non | Ex. « Huile naturelle mate ». |
| `colors_fr` / `colors_en` | non | Séparés par `\|` : `Noyer\|Laiton`. |
| `in_stock` | non | `oui` / `non`. Par défaut `oui`. |
| `made_to_order` | non | `oui` affiche « Fabriqué sur commande » au lieu de « En stock ». |
| `lead_time_days` | non | Délai en jours, affiché à côté de « Fabriqué sur commande ». |
| `featured` | non | `oui` fait remonter la pièce dans « Pièces du moment » sur l'accueil. |

## Contrôles au moment de l'import

L'import **s'arrête sans rien écrire** si :

- un `id` est vide ou en double ;
- deux produits produisent le même `slug` ;
- une `category` est inconnue ;
- un `name_fr` est vide.

Il **avertit sans bloquer** si un prix vaut 0, si un prix barré est incohérent,
ou si un produit n'a aucune photo.
