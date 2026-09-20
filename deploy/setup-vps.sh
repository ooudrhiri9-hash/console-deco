#!/usr/bin/env bash
# Premiere installation du VPS Hostinger (Ubuntu 26.04, KVM 1).
# A lancer une seule fois, en root :
#
#   bash setup-vps.sh
#
# Installe Nginx, Node 22, PM2, certbot et le pare-feu ; cree l'utilisateur qui
# fera tourner l'API et clone le depot. Ne touche ni au DNS, ni au certificat,
# ni aux variables d'environnement : ces trois etapes restent manuelles et sont
# decrites dans docs/DEPLOIEMENT-VPS.md.
set -euo pipefail

REPO=${REPO:-https://github.com/ooudrhiri9-hash/console-deco.git}
USER_APP=deco
APP=/srv/maisondeco
WEB=/var/www/maisondeco

[ "$(id -u)" = 0 ] || { echo "A lancer en root."; exit 1; }

echo "==> Paquets"
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get -y upgrade
apt-get -y install nginx git curl rsync ufw fail2ban unattended-upgrades \
                   certbot python3-certbot-nginx

echo "==> Node"
# Ubuntu 26.04 (resolute) livre Node 22 dans ses propres depots, et NodeSource
# ne publie pas de depot pour cette version : on prend celui de la distribution
# des qu'il est assez recent, NodeSource seulement pour les Ubuntu plus anciens.
if ! command -v node >/dev/null; then
  CANDIDATE=$(apt-cache policy nodejs | awk '/Candidate:/{print $2}' | cut -d. -f1)
  if [ "${CANDIDATE:-0}" -ge 20 ] 2>/dev/null; then
    apt-get -y install nodejs npm
  else
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get -y install nodejs
  fi
fi
command -v npm >/dev/null || apt-get -y install npm
node -v
npm -v

echo "==> PM2"
npm install -g pm2

echo "==> Swap"
# 4 Go de RAM suffisent au quotidien, mais `next build` sur 1 vCPU aime avoir
# un filet. Sans swap, un build peut se faire tuer par l'OOM killer.
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Utilisateur $USER_APP"
# L'API ne tourne pas en root : une faille dans Express ne doit pas donner la
# machine entiere.
id -u "$USER_APP" >/dev/null 2>&1 || useradd -m -d "$APP" -s /bin/bash "$USER_APP"
mkdir -p "$APP" "$WEB" /var/log/maisondeco
chown -R "$USER_APP":"$USER_APP" "$APP" /var/log/maisondeco
chown -R "$USER_APP":www-data "$WEB"
chmod 755 "$WEB"

echo "==> Depot"
if [ ! -d "$APP/.git" ]; then
  sudo -u "$USER_APP" git clone "$REPO" "$APP"
else
  echo "  deja clone."
fi

echo "==> Nginx"
if [ -f "$APP/deploy/nginx-maisondeco.conf" ]; then
  cp "$APP/deploy/nginx-maisondeco.conf" /etc/nginx/sites-available/maisondeco
  ln -sf /etc/nginx/sites-available/maisondeco /etc/nginx/sites-enabled/maisondeco
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx
fi

echo "==> Pare-feu"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status

echo "==> SSH par cle uniquement"
# La cle a ete deposee au moment de la creation du VPS ; on ferme le mot de
# passe, qui est ce que les robots essaient toute la journee.
sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh || systemctl restart sshd

cat <<'NEXT'

==> Installe. Il reste, dans cet ordre :

  1. DNS : enregistrements A de maisondeco.ma et www vers l'IP de ce VPS.
  2. MongoDB Atlas : ajouter l'IP du VPS dans Network Access.
  3. Variables : creer /srv/maisondeco/backend/.env et frontend/.env.local
     (contenu dans docs/DEPLOIEMENT-VPS.md).
  4. Certificat : certbot --nginx -d maisondeco.ma -d www.maisondeco.ma
  5. Premier deploiement : sudo -u deco /srv/maisondeco/deploy/deploy.sh

NEXT
