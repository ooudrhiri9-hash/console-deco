# Tarifs consoles — source client (WhatsApp 23/09/2026)

Toutes les consoles partagent le même caisson — 38 cm de profondeur, 85 cm de
caisson sur 15 cm de pieds, 100 cm au total (plans techniques des trois
Damier) — et se vendent en trois largeurs :

| Format | Prix |
|---|---:|
| 140 × 38 × 100 cm | 3 550 DH |
| 150 × 38 × 100 cm | 4 450 DH |
| 160 × 38 × 100 cm | 5 350 DH |

La grille vit dans **`formats-consoles.json`**, et nulle part ailleurs :

- `npm run import:catalogue` la pose sur chaque pièce de la famille `consoles`
  de `src/data/products.ts` : prix de la pièce = le plus petit format,
  supplément de chaque format = son prix moins celui-là (+0, +900, +1 800) ;
- `node scripts/set-console-formats.mjs` (dans `backend/`) recopie ces prix et
  ces formats dans la base, c'est-à-dire sur le site en ligne.

Changer un tarif : modifier le JSON, relancer les deux commandes. Le « Sur
mesure » de la fiche reste ouvert pour toute autre dimension, en devis.
