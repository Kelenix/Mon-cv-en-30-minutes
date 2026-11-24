#!/usr/bin/env bash
# Remplit les secrets techniques vides de deploy/.env (créé depuis .env.example au besoin) :
# mots de passe, secret JWT et clés Supabase signées avec lui, sel des adresses IP, jeton des
# tâches planifiées. Ne remplace jamais une valeur déjà présente : relançable sans risque.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env ] || { cp .env.example .env; echo "deploy/.env créé depuis .env.example"; }
chmod 600 .env

get() { grep -E "^$1=" .env | tail -n 1 | cut -d= -f2-; }
set_value() {
  if [ -z "$(get "$1")" ]; then
    sed -i "s|^$1=.*|$1=$2|" .env
    echo "  $1 généré"
  fi
}
random_hex() { openssl rand -hex "$1"; }
base64url() { openssl base64 -A | tr '+/' '-_' | tr -d '='; }

# Clé d'API Supabase : jeton JWT (HS256) du rôle donné, valable 10 ans.
api_key() {
  local now header payload signature
  now=$(date +%s)
  header=$(printf '{"alg":"HS256","typ":"JWT"}' | base64url)
  payload=$(printf '{"role":"%s","iss":"supabase","iat":%s,"exp":%s}' "$1" "$now" $((now + 315360000)) | base64url)
  signature=$(printf '%s' "$header.$payload" | openssl dgst -sha256 -hmac "$2" -binary | base64url)
  printf '%s.%s.%s' "$header" "$payload" "$signature"
}

echo "Secrets de deploy/.env :"
if [ -z "$(get JWT_SECRET)" ]; then
  # Nouveau secret JWT : les clés signées avec l'ancien ne seraient plus valides.
  sed -i "s|^SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=|; s|^SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=|" .env
  set_value JWT_SECRET "$(random_hex 32)"
fi
jwt_secret=$(get JWT_SECRET)
set_value POSTGRES_PASSWORD "$(random_hex 24)"
set_value SUPABASE_ANON_KEY "$(api_key anon "$jwt_secret")"
set_value SUPABASE_SERVICE_ROLE_KEY "$(api_key service_role "$jwt_secret")"
set_value IP_HASH_SALT "$(random_hex 32)"
set_value CRON_SECRET "$(random_hex 32)"
echo "Terminé. Compléter ensuite les autres valeurs de deploy/.env (docs/deployment.md)."
