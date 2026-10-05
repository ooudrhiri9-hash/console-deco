#!/usr/bin/env bash
# Republie le site a partir de la base, sans toucher au code ni a l'API :
#
#   /srv/maisondeco/deploy/publish.sh
#
# C'est ce que lance le bouton « Publier le site » de /admin (routes/publish.js).
# Une piece creee dans /admin n'a pas de page tant que le site n'est pas
# reconstruit ; les prix et les textes, eux, se mettent a jour sans build.
#
# Pas de git pull ni de pm2 reload, contrairement a deploy.sh : le script est
# lance par l'API elle-meme, qui ne doit pas se redemarrer sous ses pieds.
set -euo pipefail

APP=/srv/maisondeco
WEB=/var/www/maisondeco

# Meme verrou que deploy.sh : deux builds en meme temps sur 1 vCPU, c'est deux
# builds lents, et deux rsync qui se marchent dessus.
exec 9>/tmp/maisondeco-build.lock
if ! flock -n 9; then
  echo "Une publication ou un deploiement est deja en cours."
  exit 75
fi

echo "==> Site"
cd "$APP/frontend"
npm run build:live

echo "==> Publication"
mkdir -p "$WEB"
rsync -a --delete "$APP/frontend/out/" "$WEB/"

echo "==> Fait — https://maisondeco.ma"
