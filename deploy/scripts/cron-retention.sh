#!/usr/bin/env bash
# Tâche quotidienne de rétention des comptes inactifs (US-40), planifiée par setup-vps.sh :
# appelle le site depuis son propre conteneur avec CRON_SECRET (adresse fermée au public).
source "$(dirname "$0")/lib.sh"

docker compose exec -T app node -e '
fetch("http://127.0.0.1:3000/api/cron/retention", {
  method: "POST",
  headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
}).then(
  async (response) => {
    console.log(response.status, await response.text());
    process.exit(response.ok ? 0 : 1);
  },
  (error) => {
    console.error(error.message);
    process.exit(1);
  },
);'
