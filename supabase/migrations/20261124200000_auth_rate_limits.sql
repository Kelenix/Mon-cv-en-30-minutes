-- Inc-13 — Protection contre les robots à la connexion (ADR-039) : nombre de demandes de code
-- et d'essais de code par adresse IP et par adresse e-mail, toutes deux hachées avec le sel
-- secret du serveur (aucune donnée en clair). Toutes les demandes d'authentification passent par
-- le serveur du site : les limites de GoTrue ne voient qu'une seule adresse.

create table public.rate_limit_events (
  key text not null check (char_length(key) <= 200),
  created_at timestamptz not null default now()
);

create index rate_limit_events_key_idx on public.rate_limit_events (key, created_at);

-- Aucun accès pour les visiteurs et les comptes : seule la fonction ci-dessous y écrit.
alter table public.rate_limit_events enable row level security;
revoke all on table public.rate_limit_events from anon, authenticated;

-- Compte une demande pour la clé et dit si elle est permise (au plus p_limit dans la fenêtre).
-- Verrou par clé : deux demandes simultanées ne dépassent pas la limite.
create function public.consume_rate_limit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_key, 0));
  if (
    select count(*) from public.rate_limit_events e
    where e.key = p_key
      and e.created_at > now() - make_interval(secs => p_window_seconds)
  ) >= p_limit then
    return false;
  end if;
  insert into public.rate_limit_events (key) values (p_key);
  return true;
end;
$$;

revoke execute on function public.consume_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, int, int) to service_role;

-- Maintenance quotidienne : en plus, compteurs de plus d'un jour supprimés.
create or replace function public.run_daily_maintenance()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_operation_id uuid;
begin
  update public.ai_operations o
  set ip_hash = null
  where o.ip_hash is not null and o.created_at < now() - interval '30 days';

  delete from public.stripe_events e where e.created_at < now() - interval '90 days';

  delete from public.reward_tokens t where t.created_at < now() - interval '30 days';

  delete from public.rate_limit_events e where e.created_at < now() - interval '1 day';

  for v_operation_id in
    select o.id from public.ai_operations o
    where o.status = 'pending' and o.created_at < now() - interval '15 minutes'
  loop
    perform public.fail_ai_operation(v_operation_id, 'STALE');
  end loop;
end;
$$;
