#!/usr/bin/env bash
# Mise en ligne d'une nouvelle version, a lancer SUR le VPS :
#
#   /srv/maisondeco/deploy/deploy.sh
#
# Enchaine : recuperation du code, dependances, redemarrage de l'API,
# reconstruction du site, publication atomique dans /var/www/maisondeco.
set -euo pipefail

APP=/srv/maisondeco
WEB=/var/www/maisondeco

cd "$APP"

echo "==> Code"
git pull --ff-only

echo "==> API"
cd "$APP/backend"
npm ci --omit=dev
# --update-env relit .env : un mot de passe change prend effet ici.
pm2 reload maisondeco-api --update-env || pm2 start "$APP/deploy/ecosystem.config.cjs"

# L'API doit repondre avant le build : sync-catalogue --strict interroge
# /api/catalogue et echoue si la reponse ne vient pas.
echo "==> Attente de l'API"
for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:4400/health >/dev/null; then break; fi
  if [ "$i" = 30 ]; then echo "API muette sur 127.0.0.1:4400 — voir pm2 logs maisondeco-api"; exit 1; fi
  sleep 1
done

echo "==> Site"
cd "$APP/frontend"
npm ci
# build:live = sync --strict : plutot echouer que publier un catalogue perime.
npm run build:live

echo "==> Publication"
# --delete retire les pages supprimees ; le rsync est assez court pour qu'aucun
# visiteur ne tombe sur un dossier a moitie ecrit.
mkdir -p "$WEB"
rsync -a --delete "$APP/frontend/out/" "$WEB/"

echo "==> Fait — https://maisondeco.ma"
