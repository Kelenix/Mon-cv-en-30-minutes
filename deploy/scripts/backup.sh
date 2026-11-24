#!/usr/bin/env bash
# Sauvegarde quotidienne (planifiée par setup-vps.sh) des données des comptes, CV, crédits et
# paiements : fichier compressé dans /var/backups/mon-cv, gardé 14 jours. La structure de la base
# se reconstruit avec les migrations (restauration : scripts/restore.sh).
source "$(dirname "$0")/lib.sh"

dir=${BACKUP_DIR:-/var/backups/mon-cv}
keep_days=${BACKUP_KEEP_DAYS:-14}
mkdir -p "$dir"
file="$dir/donnees-$(date -u +%Y%m%d-%H%M%S).sql.gz"
trap 'rm -f "$file.tmp"' EXIT

docker compose exec -T db sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" exec pg_dump -h localhost \
  -U supabase_admin -d postgres --data-only --schema=public --schema=auth \
  --exclude-table=auth.schema_migrations' | gzip >"$file.tmp"
mv "$file.tmp" "$file"
chmod 600 "$file"
find "$dir" -name 'donnees-*.sql.gz' -mtime +"$keep_days" -delete
echo "Sauvegarde : $file ($(du -h "$file" | cut -f1))"
