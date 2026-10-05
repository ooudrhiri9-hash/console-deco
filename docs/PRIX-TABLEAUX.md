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

Source : capture du 01/10/2026 (`prix-tableaux-rectangulaires.jpeg`,
envoyée sous le nom « dimensions rectangulaire »). Elle remplace la grille du
29/09 (50 × 75 → 80 × 150 cm, 430 → 1 350 DH). Un prix par format, sans choix
d'encadrement.

| Format | Prix |
|---|---:|
| 60 × 60 cm | 450 DH |
| 80 × 80 cm | 580 DH |
| 100 × 100 cm | 750 DH |
| 120 × 120 cm | 950 DH |
| 160 × 60 cm | à confirmer — pas sur le site tant qu'il n'a pas de prix |

Ils valent pour la famille `tableaux-rectangulaires`. La grille vit dans
**`formats-tableaux-rectangulaires.json`** et suit le même chemin que celle
des consoles (voir `PRIX-CONSOLES.md`) : `npm run import:catalogue` la pose sur
chaque pièce de la famille (450 DH, puis +130, +300, +500), et
`node scripts/set-console-formats.mjs` la recopie dans la base.

Faux cadre (05/10/2026, `prix-tableaux-rectangulaires-faux-cadre.jpeg`) : la
grille ci-dessus devient celle de la caisse américaine, et le faux cadre
passe en premier.

| Format | Faux cadre | Caisse américaine |
|---|---:|---:|
| 60 × 60 cm | 250 DH | 450 DH |
| 80 × 80 cm | 390 DH | 580 DH |
| 100 × 100 cm | 490 DH | 750 DH |
| 120 × 120 cm | 770 DH | 950 DH |

### La famille `tableaux` aussi (01/10/2026)

Sur demande, les tableaux de la famille générale prennent l'ancienne grille
rectangulaire (50 × 75 → 80 × 150 cm, 430 → 1 350 DH),
dans **`formats-tableaux.json`**, plus un second choix sans effet sur le prix :
**couleur du cadre caisse américaine** — doré, noir, blanc, beige, argenté,
marron, bleu marine. Les pièces TAB-001 à TAB-005 la portent. La grille des
formats carrés ci-dessus n'est donc plus appliquée sur le site.

#### Faux cadre (05/10/2026)

Source : capture `prix-tableaux-faux-cadre.jpeg` (« Avec faux cadre -
tableaux »). Les tableaux gagnent un choix **Encadrement** : faux cadre ou
caisse américaine. Les prix ci-dessus restent ceux de la caisse américaine.

| Format | Faux cadre | Caisse américaine |
|---|---:|---:|
| 50 × 75 cm | 230 DH | 430 DH |
| 60 × 100 cm | 380 DH | 589 DH |
| 80 × 120 cm | 460 DH | 750 DH |
| 80 × 140 cm | 730 DH | 949 DH |
| 80 × 150 cm | 950 DH | 1 350 DH |

Dans `formats-tableaux.json`, les formats portent les prix faux cadre et la
caisse américaine un supplément par format (`extraBySize` : +200, +209,
+290, +219, +400). Faux cadre est la valeur par défaut, la fiche s'ouvre
donc à 230 DH. Les pastilles de couleur du cadre et la photo encadrée
restent affichées quel que soit l'encadrement (demande du 05/10/2026).

Les deux premières pièces (TBR-001 Bestiaire, TBR-002 Fête au château) sont
photographiées en carré ; l'atelier les peint au format choisi. La photo
du Bestiaire portait la cote « 120 × 120 cm » : `prepare-media.mjs` la coupe.

## Trios (`tableaux-trio`)

Source : capture du 01/10/2026 (`prix-tableaux-trio.jpeg`). Prix des trois
toiles ensemble, selon le format de chacune :

| Format de chaque toile | Prix du trio |
|---|---:|
| 50 × 75 cm | 980 DH |
| 60 × 100 cm | 1 604 DH |
| 80 × 120 cm | 1 970 DH |

Grille dans **`formats-tableaux-trio.json`**, avec la même couleur de cadre
caisse américaine que les tableaux, sans supplément. Pièces TRI-001 à TRI-004.

Faux cadre (05/10/2026, `prix-tableaux-trio-faux-cadre.jpeg`) :

| Format de chaque toile | Faux cadre | Caisse américaine |
|---|---:|---:|
| 50 × 75 cm | 630 DH | 980 DH |
| 60 × 100 cm | 1 030 DH | 1 604 DH |
| 80 × 120 cm | 1 250 DH | 1 970 DH |

## Duos (`tableaux-duo`)

Source : capture du 01/10/2026 (`prix-tableaux-duo.jpeg`). L'en-tête de la
capture dit « Prix du trio », reste de la grille précédente : ce sont les prix
des deux toiles ensemble.

| Format de chaque toile | Prix du duo |
|---|---:|
| 50 × 75 cm | 730 DH |
| 60 × 100 cm | 1 050 DH |
| 80 × 120 cm | 1 350 DH |

Grille dans **`formats-tableaux-duo.json`**, avec la couleur du cadre caisse
américaine. Pièces DUO-001 et DUO-002. `image-duo-3.jpeg` n'est pas publiée :
une personne y accroche la toile, et l'œuvre est signée d'un autre artiste.

Faux cadre (05/10/2026, `prix-tableaux-duo-faux-cadre.jpeg`) :

| Format de chaque toile | Faux cadre | Caisse américaine |
|---|---:|---:|
| 50 × 75 cm | 398 DH | 730 DH |
| 60 × 100 cm | 730 DH | 1 050 DH |
| 80 × 120 cm | 880 DH | 1 350 DH |

Comme pour les tableaux : choix **Encadrement**, faux cadre par défaut,
caisse américaine en supplément par format (`extraBySize`), couleur du cadre
toujours affichée. Vaut aussi pour les trios et les tableaux
rectangulaires (ces derniers n'ont pas de choix de couleur).

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
