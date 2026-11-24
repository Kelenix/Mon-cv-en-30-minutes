#!/usr/bin/env bash
# Préparation du VPS (Ubuntu), une seule fois, en root, le DNS du domaine déjà en place
# (docs/deployment.md, étape 4) : bash setup-vps.sh DOMAINE [E-MAIL pour Let's Encrypt].
# Mises à jour de sécurité automatiques, pare-feu, fail2ban, Docker, mémoire d'échange,
# utilisateur « deploy », dossiers, tâches planifiées (sauvegarde, rétention des comptes), et
# nginx avec certbot devant le site (ADR-044) : HTTPS de DOMAINE, www.DOMAINE et api.DOMAINE.
# Relançable. Sur un serveur qui héberge déjà d'autres sites (Docker présent) : ni mise à jour
# générale (elle redémarrerait leurs services), ni changement des règles de connexion SSH.
set -euo pipefail
[ "$(id -u)" -eq 0 ] || { echo "À lancer en root : sudo bash $0 DOMAINE" >&2; exit 1; }
DOMAIN=${1:?Usage : bash setup-vps.sh DOMAINE [E-MAIL]}
ACME_EMAIL=${2:-}

DEPLOY_USER=deploy
APP_DIR=/opt/mon-cv
export DEBIAN_FRONTEND=noninteractive
in_service=false
command -v docker >/dev/null && in_service=true

echo "▶ Paquets du système"
apt-get update -q
$in_service || apt-get upgrade -yq -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold
# --no-upgrade : les paquets déjà présents (nginx d'autres sites…) ne sont pas redémarrés.
apt-get install -yq --no-upgrade ca-certificates curl git openssl ufw fail2ban \
  unattended-upgrades nginx certbot python3-certbot-nginx
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "▶ Docker"
if ! command -v docker >/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    >/etc/apt/sources.list.d/docker.list
  apt-get update -q
  apt-get install -yq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker

echo "▶ Pare-feu : SSH, HTTP et HTTPS seulement"
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "▶ Mémoire d'échange (construction du site)"
if ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >>/etc/fstab
fi

echo "▶ Utilisateur $DEPLOY_USER"
id "$DEPLOY_USER" >/dev/null 2>&1 || adduser --disabled-password --gecos "" "$DEPLOY_USER"
usermod -aG docker "$DEPLOY_USER"
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
keys="/home/$DEPLOY_USER/.ssh/authorized_keys"
if [ -s /root/.ssh/authorized_keys ] && [ ! -s "$keys" ]; then
  install -m 600 -o "$DEPLOY_USER" -g "$DEPLOY_USER" /root/.ssh/authorized_keys "$keys"
fi
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP_DIR"
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" /var/backups/mon-cv

echo "▶ SSH : connexion par clé uniquement"
if $in_service; then
  echo "  Serveur déjà en service : règles SSH inchangées (docs/deployment.md, étape 4)."
elif [ -s "$keys" ]; then
  # Lu en premier (la première valeur l'emporte, avant 50-cloud-init.conf de l'hébergeur).
  cat >/etc/ssh/sshd_config.d/00-mon-cv.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
EOF
  sshd -t
  systemctl reload ssh
else
  echo "  ⚠ Aucune clé SSH pour $DEPLOY_USER : connexion par mot de passe laissée active."
  echo "    Ajouter une clé (docs/deployment.md, étape 2) puis relancer ce script."
fi

echo "▶ Tâches planifiées (heure UTC, journal : journalctl -t mon-cv)"
cat >/etc/cron.d/mon-cv <<EOF
# Mon CV en 30 Secondes (deploy/scripts) : sauvegarde des données puis rétention des comptes.
SHELL=/bin/bash
15 3 * * * $DEPLOY_USER $APP_DIR/deploy/scripts/backup.sh 2>&1 | logger -t mon-cv
30 4 * * * $DEPLOY_USER $APP_DIR/deploy/scripts/cron-retention.sh 2>&1 | logger -t mon-cv
EOF
chmod 644 /etc/cron.d/mon-cv

echo "▶ nginx et HTTPS : $DOMAIN, www.$DOMAIN, api.$DOMAIN"
site=/etc/nginx/sites-available/mon-cv
# Écrit une seule fois : certbot y ajoute ensuite HTTPS et la redirection depuis HTTP.
if [ ! -e "$site" ]; then
  cat >"$site" <<NGINX
# Mon CV en 30 Secondes (deploy/scripts/setup-vps.sh, ADR-044) : tout vers le proxy Caddy du
# site (127.0.0.1:8180), qui aiguille vers le site et l'API Supabase.
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN api.$DOMAIN;
    client_max_body_size 12m;

    location / {
        proxy_pass http://127.0.0.1:8180;
        proxy_http_version 1.1;
        # Cookies de session Supabase volumineux.
        proxy_buffer_size 32k;
        proxy_buffers 8 32k;
        proxy_busy_buffers_size 64k;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX
  ln -sf "$site" /etc/nginx/sites-enabled/mon-cv
fi
nginx -t
systemctl reload nginx
account=(--register-unsafely-without-email)
[ -z "$ACME_EMAIL" ] || account=(-m "$ACME_EMAIL")
certbot --nginx --redirect --non-interactive --agree-tos --keep-until-expiring "${account[@]}" \
  -d "$DOMAIN" -d "www.$DOMAIN" -d "api.$DOMAIN"

echo "✔ Serveur prêt. Suite : docs/deployment.md, étape 5 (en tant que $DEPLOY_USER)."
