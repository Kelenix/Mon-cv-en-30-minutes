#!/usr/bin/env bash
# Restaure une sauvegarde de backup.sh sur une base NEUVE : la base actuelle est effacée, recréée,
# les migrations repassent, puis les données sont rechargées. À n'utiliser qu'en cas de perte de
# la base ou de déménagement vers un nouveau serveur (docs/deployment.md).
source "$(dirname "$0")/lib.sh"

file=${1:?"Usage : scripts/restore.sh /var/backups/mon-cv/donnees-AAAAMMJJ-HHMMSS.sql.gz"}
[ -f "$file" ] || { echo "Fichier introuvable : $file" >&2; exit 1; }
gzip -t "$file"

echo "La base actuelle sera EFFACÉE et remplacée par $file."
read -r -p "Tape RESTAURER pour confirmer : " answer
[ "$answer" = "RESTAURER" ] || { echo "Annulé."; exit 1; }

docker compose stop app auth rest
docker compose rm -f -s db
docker volume rm mon-cv_db_data
docker compose up -d --wait db auth rest
./scripts/migrate.sh
# Déclencheurs et contraintes suspendus le temps du chargement (données déjà cohérentes).
{
  echo "set session_replication_role = replica;"
  gunzip -c "$file"
} | PSQL_USER=supabase_admin db_psql --single-transaction -o /dev/null -f -
docker compose up -d --no-build --wait app
./scripts/smoke-test.sh
echo "✔ Sauvegarde restaurée"
