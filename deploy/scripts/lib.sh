# shellcheck shell=bash
# Fonctions communes des scripts du VPS (sourcé, jamais lancé seul).
# Chaque script se place dans deploy/, où Docker Compose lit docker-compose.yml et .env.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

[ -f .env ] || {
  echo "deploy/.env manquant : copier deploy/.env.example puis lancer scripts/generate-secrets.sh" >&2
  exit 1
}

# Valeur d'une variable de deploy/.env (sans exécuter le fichier).
env_get() {
  grep -E "^$1=" .env | tail -n 1 | cut -d= -f2- | sed -E "s/^'(.*)'$/\1/; s/^\"(.*)\"$/\1/"
}

# psql dans le conteneur de la base, avec le mot de passe du conteneur (jamais sur la ligne de
# commande de l'hôte). Rôle : postgres, ou celui de PSQL_USER.
db_psql() {
  docker compose exec -T -e PSQL_USER="${PSQL_USER:-postgres}" \
    -e PGOPTIONS="-c client_min_messages=warning" db sh -c \
    'PGPASSWORD="$POSTGRES_PASSWORD" exec psql -X -q -v ON_ERROR_STOP=1 -h localhost -U "$PSQL_USER" -d postgres "$@"' \
    psql "$@"
}
