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

Réglé : la fiche sait porter les 6 combinaisons. Saisie dans `/admin/`, fiche
du tableau, section « Choix proposés » :

1. **Prix de la pièce** : `350` (le plus petit format, faux cadre).
2. Bouton **Formats (3 tailles)**, affichage « Format », valeurs
   `80 × 80 cm` +0, `100 × 100 cm` +110, `120 × 120 cm` +400.
3. Bouton **Faux cadre / caisse américaine** (affichage « Cadre »). Dans le
   tableau « Supplément selon le format » de la caisse américaine :
   80 × 80 → 230, 100 × 100 → 290, 120 × 120 → 220.

La fiche affiche alors chaque format avec son prix (350 / 460 / 750, ou
580 / 750 / 970 en caisse américaine), et l'API recalcule le même prix à la
commande.
