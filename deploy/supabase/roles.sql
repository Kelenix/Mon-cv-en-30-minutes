-- Exécuté une seule fois, à la création de la base (script d'initialisation de l'image
-- supabase/postgres) : mots de passe des rôles utilisés par les services, comme Supabase en local.
\set pgpass `echo "$POSTGRES_PASSWORD"`

ALTER USER postgres WITH PASSWORD :'pgpass';
ALTER USER authenticator WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin WITH PASSWORD :'pgpass';
