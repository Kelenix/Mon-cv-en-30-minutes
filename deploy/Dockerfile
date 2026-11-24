# syntax=docker/dockerfile:1
# Image du site (Next.js en serveur autonome) pour le VPS (ADR-038, docs/deployment.md).
# Construite sur le serveur par deploy/scripts/deploy.sh. Le build ne reçoit que des valeurs
# publiques (adresses, publicités, informations légales affichées) ; les clés secrètes ne sont
# fournies qu'au démarrage du conteneur.

FROM node:24.22.3-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
# Sans scripts d'installation : ni hook Git, ni binaire de la CLI Supabase (inutiles ici).
RUN npm ci --ignore-scripts --no-audit --no-fund

FROM base AS build
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG GOOGLE_AUTH_ENABLED
ARG TURNSTILE_SITE_KEY
ARG ADS_MODE
ARG ADS_PUBLISHER_ID
ARG ADS_NETWORK_CODE
ARG ADS_REMOVAL_ENABLED
ARG LEGAL_COMPANY_NAME
ARG LEGAL_FORM
ARG LEGAL_REGISTRATION
ARG LEGAL_ADDRESS
ARG LEGAL_EMAIL
ARG LEGAL_PUBLISHER
ARG LEGAL_VAT_NUMBER
ARG LEGAL_HOSTING
ARG LEGAL_MEDIATOR
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Les clés Supabase ne servent pas au build (aucun appel) : valeurs factices.
RUN NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=build SUPABASE_SECRET_KEY=build npm run build

FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "server.js"]
