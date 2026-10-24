import csv, os, sys

OUT = os.path.dirname(os.path.abspath(__file__))
os.makedirs(OUT, exist_ok=True)

CAMP = "Search | Consoles | Casablanca | FR"
URL = "https://maisondeco.ma/produits/consoles/"
BUDGET = "150"      # MAD / jour
CPC_CAP = "4"       # MAD, plafond du CPC en "Maximiser les clics"

# ---------------------------------------------------------------- ad groups
# name -> (keywords phrase+exact, path1, path2)
groups = {
    "Console Entree": (["console entree", "console d'entree", "console pour entree",
                        "meuble entree", "meuble d'entree", "meuble entree maison",
                        "meuble entree design", "meuble d'entree moderne",
                        "console hall d'entree", "meuble pour entree"], "consoles", "entree"),
    "Console Design": (["console design", "console moderne", "console de luxe",
                        "console luxe", "console decorative", "console decoration",
                        "console bois", "console en bois", "console bois et metal",
                        "console salon", "console pour salon", "console derriere canape",
                        "table console", "table console design", "console murale"], "consoles", "design"),
    "Console Artisanale": (["console artisanale", "console peinte", "console peinte a la main",
                            "meuble peint a la main", "meuble peint", "console marocaine",
                            "meuble marocain moderne", "meuble artisanal maroc",
                            "console berbere", "meuble d'art", "console art deco",
                            "console originale"], "consoles", "fait-main"),
    "Console Rangement": (["console avec rangement", "console avec portes", "console 2 portes",
                           "console avec placard", "meuble d'entree avec rangement",
                           "buffet entree", "buffet design", "buffet moderne",
                           "buffet salon moderne", "bahut design", "enfilade design",
                           "commode design"], "consoles", "rangement"),
    "Console Sur Mesure": (["console sur mesure", "meuble entree sur mesure",
                            "meuble sur mesure maroc", "meuble sur mesure casablanca",
                            "console 140 cm", "console 150 cm", "console 160 cm",
                            "grande console", "console longue"], "consoles", "sur-mesure"),
    "Console Casablanca": (["console casablanca", "console entree casablanca",
                            "console design casablanca", "meuble entree casablanca",
                            "meuble design casablanca", "magasin meuble design casablanca",
                            "console maroc", "meuble entree maroc", "console prix maroc",
                            "console en ligne maroc", "acheter console entree",
                            "prix console entree"], "consoles", "casablanca"),
}

# ---------------------------------------------------------------- ad copy
common_h = [
    "Peintes à la main au Maroc",
    "Livraison gratuite au Maroc",
    "Paiement à la livraison",
    "À partir de 3 550 DH",
    "Série limitée, 26 modèles",
    "Dimensions sur mesure",
    "Maison Déco Casablanca",
    "Caisson bois, pieds métal",
    "Commandez en ligne",
    "Pièce unique pour l'entrée",
]
specific_h = {
    "Console Entree": ["Console d'Entrée Design", "Meuble d'Entrée Artisanal",
                       "La Console Qui Pose l'Entrée", "Consoles d'Entrée Uniques",
                       "Habillez Votre Entrée"],
    "Console Design": ["Console Design Fait Main", "Console Moderne en Bois",
                       "Consoles Design au Maroc", "Mobilier d'Art Contemporain",
                       "Une Console Qui Se Remarque"],
    "Console Artisanale": ["Console Peinte à la Main", "Console Artisanale Maroc",
                           "Fabriquée dans Notre Atelier", "Mobilier d'Art Marocain",
                           "Motifs Berbères & Abstraits"],
    "Console Rangement": ["Console avec Rangement", "Console 2 Portes Décorée",
                          "Buffet Design Peint Main", "Rangement Élégant Entrée",
                          "Façade Peinte, Portes Cachées"],
    "Console Sur Mesure": ["Console sur Mesure", "Adaptée à Vos Mesures",
                           "140, 150 ou 160 cm", "Devis Gratuit sur WhatsApp",
                           "Meuble sur Mesure Maroc"],
    "Console Casablanca": ["Console Design à Casablanca", "Livraison Offerte à Casablanca",
                           "Meuble d'Entrée Casablanca", "Achetez Votre Console",
                           "Consoles Artisanales Maroc"],
}
descs = {
    "_common": [
        "Consoles peintes à la main dans notre atelier au Maroc. 140, 150 ou 160 cm.",
        "Livraison gratuite partout au Maroc, emballage renforcé. Payez à la réception.",
        "26 modèles en série limitée : visages, arcs, damier, motifs berbères. Dès 3 550 DH.",
    ],
    "Console Entree": "La première chose que l'on voit en entrant. Choisissez la vôtre en ligne.",
    "Console Design": "Caisson bois, décor peint, piètement métal noir. Une console qui suffit seule.",
    "Console Artisanale": "Artisanat marocain contemporain : chaque façade est peinte pièce par pièce.",
    "Console Rangement": "Deux portes cachées dans le dessin : rangement discret, façade spectaculaire.",
    "Console Sur Mesure": "Une autre dimension ? Nous adaptons la console à votre mur. Devis WhatsApp.",
    "Console Casablanca": "Livrée gratuitement chez vous à Casablanca. Vous payez à la réception.",
}

# ---------------------------------------------------------------- negatives
negatives_phrase = [
    # jeux video
    "ps5", "ps4", "ps3", "ps2", "playstation", "play station", "xbox", "nintendo", "switch",
    "wii", "sega", "psp", "steam deck", "jeux", "jeu", "jeux video", "jeu video", "game",
    "games", "gaming", "gamer", "manette", "joystick", "retro", "retrogaming", "arcade",
    "fifa", "gta", "console portable", "console de jeu", "console de jeux", "sony",
    "microsoft", "jumia", "electroplanet", "virgin", "derb ghallef",
    # voiture
    "voiture", "auto", "centrale", "accoudoir", "tableau de bord", "clio", "dacia",
    "golf", "peugeot", "moto",
    # audio / informatique
    "mixage", "table de mixage", "dj", "audio", "sono", "son", "lumiere", "eclairage",
    "dmx", "yamaha", "behringer", "pioneer", "windows", "linux", "terminal", "cmd",
    "ligne de commande", "javascript", "chrome", "log", "developpeur", "search console",
    "google console", "play console", "aws", "firebase", "cloud", "admin", "serveur",
    "minecraft", "steam", "code", "ssh", "powershell",
    # occasion / prix bas / concurrents grand public
    "occasion", "d'occasion", "seconde main", "avito", "gratuit", "gratuite",
    "pas cher", "moins cher", "solde", "soldes", "ikea", "kitea", "marjane", "bricoma",
    "mr bricolage", "aswak", "leroy merlin", "maisons du monde", "but", "conforama",
    "amazon", "aliexpress", "temu", "shein",
    # bricolage / info
    "diy", "fabriquer", "fabrication maison", "tuto", "tutoriel", "comment", "plan",
    "plans", "pdf", "dessin", "coloriage", "image", "images", "photo", "photos", "png",
    "wallpaper", "pinterest", "idee", "idees", "definition", "c'est quoi", "wikipedia",
    # emploi / formation
    "emploi", "recrutement", "offre d'emploi", "stage", "salaire", "formation", "cours",
    "menuisier", "menuiserie", "atelier menuiserie", "grossiste", "en gros", "location",
    "louer", "reparation", "repair",
    # produits hors gamme
    "extensible", "pliante", "pliable", "verre", "plexiglass", "plexiglas", "miroir",
    "marbre", "fer forge", "rotin", "enfant", "bebe", "jouet", "maquillage", "coiffeuse",
    "bureau", "lit", "chevet", "tv", "television", "meuble tv", "cuisine", "salle de bain",
    "jardin", "exterieur", "pvc", "plastique",
    # hors Maroc
    "france", "paris", "belgique", "algerie", "tunisie", "dubai", "canada", "usa",
]
negatives_exact = ["console", "consoles", "buffet", "commode", "meuble", "bahut"]

# ---------------------------------------------------------------- checks
def chk(s, n, what):
    if len(s) > n:
        sys.exit(f"TOO LONG ({len(s)}>{n}) {what}: {s}")

for g, (kws, p1, p2) in groups.items():
    chk(p1, 15, "path1"); chk(p2, 15, "path2")
    hs = specific_h[g] + common_h
    assert len(hs) == 15 and len(set(hs)) == 15, g
    for h in hs: chk(h, 30, "headline")
    for d in descs["_common"] + [descs[g]]: chk(d, 90, "desc")
# a negative must not block a positive keyword (phrase negative = word sequence)
for g, (kws, _, _) in groups.items():
    for k in kws:
        for n in negatives_phrase:
            if f" {n} " in f" {k} ":
                sys.exit(f"NEGATIVE '{n}' blocks keyword '{k}'")

# ---------------------------------------------------------------- write
def write(name, header, rows):
    with open(os.path.join(OUT, name), "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f); w.writerow(header); w.writerows(rows)

# 1. campaign + ad groups
write("1-campagne-et-groupes.csv",
      ["Campaign", "Campaign Type", "Networks", "Budget", "Budget type", "Bid Strategy Type",
       "Maximum CPC bid limit", "Languages", "Campaign Status", "Ad Group", "Max CPC", "Ad Group Status"],
      [[CAMP, "Search", "Google search", BUDGET, "Daily", "Maximize clicks", CPC_CAP, "fr;ar", "Paused", "", "", ""]]
      + [[CAMP, "", "", "", "", "", "", "", "", g, "", "Enabled"] for g in groups])

# 2. location
write("2-ciblage-geographique.csv", ["Campaign", "Location"], [[CAMP, f"{c}, Casablanca-Settat, Morocco"]
       for c in ("Casablanca", "Bouskoura", "Dar Bouazza", "Mohammedia")])

# 3. keywords (phrase + exact) and negatives
rows = []
for g, (kws, _, _) in groups.items():
    for k in kws:
        rows.append([CAMP, g, k, "Phrase", "Enabled"])
        rows.append([CAMP, g, k, "Exact", "Enabled"])
for n in negatives_phrase:
    rows.append([CAMP, "", n, "Campaign Negative Phrase", ""])
for n in negatives_exact:
    rows.append([CAMP, "", n, "Campaign Negative Exact", ""])
write("3-mots-cles-et-negatifs.csv", ["Campaign", "Ad Group", "Keyword", "Criterion Type", "Status"], rows)

# 4. responsive search ads
hdr = ["Campaign", "Ad Group", "Ad type"] + [f"Headline {i}" for i in range(1, 16)] \
      + [f"Description {i}" for i in range(1, 5)] + ["Path 1", "Path 2", "Final URL", "Status"]
rows = []
for g, (kws, p1, p2) in groups.items():
    hs = specific_h[g] + common_h
    ds = [descs[g]] + descs["_common"]
    rows.append([CAMP, g, "Responsive search ad"] + hs + ds + [p1, p2, URL, "Enabled"])
write("4-annonces-rsa.csv", hdr, rows)

# 5. assets (sitelinks / callouts / snippets) — also listed in the guide for manual entry
sl = [
    ("Ensemble console+tableau", "La console et son tableau assortis", "Un mur complet en une commande",
     "https://maisondeco.ma/produits/ensembles-console-tableau/"),
    ("Tables basses design", "Bois, métal, finitions à la main", "Assorties à nos consoles",
     "https://maisondeco.ma/produits/tables-basses/"),
    ("Tableaux peints main", "Abstrait, calligraphie, zellige", "Formats uniques, duo et trio",
     "https://maisondeco.ma/produits/tableaux/"),
    ("Notre atelier au Maroc", "Mobilier d'art fait à la main", "Découvrez notre savoir-faire",
     "https://maisondeco.ma/a-propos/"),
    ("Contact & devis WhatsApp", "Une question sur une console ?", "Réponse du lundi au samedi",
     "https://maisondeco.ma/contact/"),
    ("Tout le catalogue", "Consoles, tables, tableaux", "Livraison gratuite au Maroc",
     "https://maisondeco.ma/produits/"),
]
for t, d1, d2, _ in sl:
    chk(t, 25, "sitelink"); chk(d1, 35, "sl desc"); chk(d2, 35, "sl desc")
write("5a-liens-annexes.csv", ["Campaign", "Link Text", "Description Line 1", "Description Line 2", "Final URL"],
      [[CAMP, *s] for s in sl])
callouts = ["Livraison gratuite", "Paiement à la livraison", "Fait main au Maroc", "Série limitée",
            "Sur mesure possible", "Emballage renforcé", "Devis sur WhatsApp", "Dès 3 550 DH"]
for c in callouts: chk(c, 25, "callout")
write("5b-accroches.csv", ["Campaign", "Callout text"], [[CAMP, c] for c in callouts])
snip = ["Visages", "Arcs", "Damier", "Motifs berbères", "Calligraphie", "Arcades", "Patine", "Demi-lunes"]
for s in snip: chk(s, 25, "snippet")
write("5c-extraits-structures.csv", ["Campaign", "Header", "Snippet Values"], [[CAMP, "Styles", ";".join(snip)]])

kw_total = sum(len(v[0]) for v in groups.values())
print("ok", len(groups), "ad groups,", kw_total, "keywords x2 match types,",
      len(negatives_phrase) + len(negatives_exact), "negatives")
