#!/usr/bin/env bash
# Vérifie le site en ligne depuis le serveur : pages, sonde, API Supabase protégée par sa clé,
# adresse des tâches planifiées fermée au public. Code de sortie non nul au premier échec.
source "$(dirname "$0")/lib.sh"

domain=$(env_get DOMAIN)
api=$(env_get SUPABASE_DOMAIN)
anon_key=$(env_get SUPABASE_ANON_KEY)
service_key=$(env_get SUPABASE_SERVICE_ROLE_KEY)

# Requêtes envoyées au proxy du serveur lui-même, sans dépendre du DNS.
request() {
  local host=$1
  shift
  # SMOKE_CURL_OPTS : options supplémentaires (ex. -k pour une répétition locale).
  # shellcheck disable=SC2086
  curl -sS -o /dev/null -w '%{http_code}' --max-time 20 \
    --resolve "$host:443:127.0.0.1" ${SMOKE_CURL_OPTS:-} "$@"
}

failed=0
check() {
  local label=$1 expected=$2 status
  shift 2
  status=$(request "$@" || true)
  if [ "$status" = "$expected" ]; then
    echo "  ✔ $label ($status)"
  else
    echo "  ✖ $label : $status au lieu de $expected"
    failed=1
  fi
}

echo "Vérification de https://$domain :"
check "Sonde du site" 200 "$domain" "https://$domain/api/health"
check "Accueil" 200 "$domain" "https://$domain/fr"
check "Tarifs" 200 "$domain" "https://$domain/fr/tarifs"
check "Tâches planifiées fermées au public" 404 "$domain" -X POST "https://$domain/api/cron/retention"
check "Authentification" 200 "$api" -H "apikey: $anon_key" "https://$api/auth/v1/health"
check "Base de données (clé du serveur)" 200 "$api" -H "apikey: $service_key" \
  -H "Authorization: Bearer $service_key" "https://$api/rest/v1/profiles?select=id&limit=1"
check "Profils fermés sans session" 401 "$api" -H "apikey: $anon_key" \
  -H "Authorization: Bearer $anon_key" "https://$api/rest/v1/profiles?select=id&limit=1"
check "API refusée sans clé" 401 "$api" "https://$api/rest/v1/profiles"
exit "$failed"
