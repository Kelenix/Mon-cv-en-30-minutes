#!/usr/bin/env bash
# Met en ligne une version du dépôt : origin/main par défaut, sinon un commit ou une étiquette
# (argument, ou commande SSH du déploiement automatique). Étapes : code récupéré, image du site
# construite, services Supabase démarrés, migrations, nouveau site, vérification ; en cas d'échec,
# la version précédente est remise en ligne. Le site reste servi pendant la construction.
source "$(dirname "$0")/lib.sh"

main() {
  local ref=${1:-${SSH_ORIGINAL_COMMAND:-origin/main}}
  if ! [[ "$ref" =~ ^([0-9a-f]{7,40}|origin/main|v[0-9][0-9.]*)$ ]]; then
    echo "Version refusée : « $ref » (commit, origin/main ou vX.Y.Z)" >&2
    exit 1
  fi

  git -C .. fetch --quiet --prune --tags origin
  git -C .. checkout --quiet --detach "$ref"
  local sha
  sha=$(git -C .. rev-parse --short=12 HEAD)
  echo "▶ Version $sha ($ref)"

  APP_TAG=$sha docker compose build app

  docker compose up -d --wait db auth rest caddy
  # Nouvelle configuration du proxy prise en compte sans coupure.
  docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile
  ./scripts/migrate.sh

  local previous
  previous=$(docker image inspect --format '{{.Id}}' mon-cv-app:current 2>/dev/null || true)
  docker tag "mon-cv-app:$sha" mon-cv-app:current
  if docker compose up -d --no-build --wait --wait-timeout 180 app && ./scripts/smoke-test.sh; then
    echo "$sha $(date -u +%FT%TZ)" >>.deployments
    # Cinq dernières images du site gardées pour un retour arrière rapide.
    docker image ls mon-cv-app --format '{{.Tag}}' | grep -vx current | tail -n +6 |
      xargs -r -I{} docker image rm "mon-cv-app:{}" >/dev/null
    docker builder prune -f --filter until=168h >/dev/null
    echo "✔ Version $sha en ligne"
  else
    echo "✖ Échec de la mise en ligne de $sha" >&2
    if [ -n "$previous" ]; then
      docker tag "$previous" mon-cv-app:current
      docker compose up -d --no-build app
      echo "↩ Image précédente remise en ligne" >&2
    fi
    echo "Cause : docker compose logs app ; une variable de deploy/.env à corriger vaut aussi pour l'image précédente." >&2
    exit 1
  fi
}

# Tout le script est lu avant de s'exécuter : `git checkout` peut le modifier sans risque.
main "$@"
