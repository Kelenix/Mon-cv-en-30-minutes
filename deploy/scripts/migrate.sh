#!/usr/bin/env bash
# Applique, dans l'ordre, les migrations de supabase/migrations pas encore passées, chacune dans
# une transaction (tout ou rien). Journal compatible avec la CLI Supabase.
source "$(dirname "$0")/lib.sh"

db_psql -c "create schema if not exists supabase_migrations;
  create table if not exists supabase_migrations.schema_migrations (
    version text primary key, statements text[], name text
  );"
applied=$(db_psql -At -c "select version from supabase_migrations.schema_migrations")

count=0
for file in ../supabase/migrations/*.sql; do
  name=$(basename "$file" .sql)
  version=${name%%_*}
  grep -qx "$version" <<<"$applied" && continue
  echo "▶ Migration $name"
  {
    cat "$file"
    printf "\ninsert into supabase_migrations.schema_migrations (version, name) values ('%s', '%s');\n" \
      "$version" "${name#*_}"
  } | db_psql --single-transaction -o /dev/null -f -
  count=$((count + 1))
done
echo "Migrations appliquées : $count"
