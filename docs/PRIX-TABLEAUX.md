# Tarifs tableaux — source client (Omar, WhatsApp 04/09/2026 01h31–01h35)

Prix en dirhams, par tableau, selon le format et le type d'encadrement.

## Formats carrés

| Format | Faux cadre | Caisse américaine |
|---|---:|---:|
| 80 × 80 cm | 350 DH | 580 DH |
| 100 × 100 cm | 460 DH | 750 DH |
| 120 × 120 cm | 750 DH | 970 DH |

Écart caisse américaine → faux cadre : +230 DH (80), +290 DH (100), +220 DH (120).

## Formats rectangulaires

⚠️ **Manquants.** Le message du client s'arrête sur
« ---------------- les prix pour tableau rectangulaire » sans la suite.
À réclamer avant de mettre les tableaux rectangulaires en ligne
(`Tableau.jpeg`, `Tableau rectangulaire.jpeg`, les diptyques et triptyques).

## Conséquence sur le catalogue

`Product` (src/types.ts) n'a qu'un seul champ `price` : il ne sait pas porter
6 combinaisons format × encadrement. Deux options au moment de l'intégration :

1. **Une fiche par tableau, prix = le plus petit format** (350 DH), les autres
   formats listés dans la description et repris dans le message WhatsApp.
   Aucun changement de code, mais le panier ne connaît pas le format choisi.
2. **Ajouter des variantes** au type `Product` (`variants: { size, frame, price }[]`),
   plus un sélecteur sur la fiche produit et la variante retenue dans le panier.
   C'est la bonne solution si le client vend vraiment les 6 déclinaisons.

À trancher avec le client.
