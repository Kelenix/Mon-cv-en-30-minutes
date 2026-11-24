#!/usr/bin/env bash
# Préparation d'un VPS Ubuntu 24.04 neuf, une seule fois, en root (docs/deployment.md, étape 3) :
# mises à jour de sécurité automatiques, pare-feu, protection SSH, Docker, mémoire d'échange,
# utilisateur « deploy », dossiers et tâches planifiées (sauvegarde, rétention des comptes).
set -euo pipefail
[ "$(id -u)" -eq 0 ] || { echo "À lancer en root : sudo bash $0" >&2; exit 1; }

DEPLOY_USER=deploy
APP_DIR=/opt/mon-cv
export DEBIAN_FRONTEND=noninteractive

echo "▶ Mises à jour du système"
apt-get update -q
apt-get upgrade -yq -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold
apt-get install -yq ca-certificates curl git openssl ufw fail2ban unattended-upgrades
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
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
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
if [ -s "$keys" ]; then
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

echo "✔ Serveur prêt. Suite : docs/deployment.md, étape 4 (en tant que $DEPLOY_USER)."
