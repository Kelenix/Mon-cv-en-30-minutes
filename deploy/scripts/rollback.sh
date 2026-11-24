#!/usr/bin/env bash
# Retour rapide à une version déjà déployée (image du site gardée sur le serveur) : la précédente
# par défaut, ou celle donnée en argument (voir deploy/.deployments). Les migrations ne sont pas
# annulées ; pour revenir aussi sur la configuration du serveur : scripts/deploy.sh <commit>.
source "$(dirname "$0")/lib.sh"

current=$(tail -n 1 .deployments | cut -d' ' -f1)
target=${1:-$(cut -d' ' -f1 .deployments | grep -vx "$current" | tail -n 1)}
[ -n "$target" ] || { echo "Aucune version précédente connue" >&2; exit 1; }
docker image inspect "mon-cv-app:$target" >/dev/null || {
  echo "Image de $target absente : lancer scripts/deploy.sh $target" >&2
  exit 1
}

docker tag "mon-cv-app:$target" mon-cv-app:current
docker compose up -d --no-build --wait app
./scripts/smoke-test.sh
echo "$target $(date -u +%FT%TZ) retour" >>.deployments
echo "✔ Version $target remise en ligne"
