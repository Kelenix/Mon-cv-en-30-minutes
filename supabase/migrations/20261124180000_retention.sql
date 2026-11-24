-- Inc-13 — Rétention des comptes inactifs (US-40, ADR-014, docs/architecture.md §9) : la tâche
-- quotidienne du site avertit à 3 ans d'inactivité moins 30 jours, puis supprime 30 jours après
-- l'avertissement. Une connexion remet le compteur à zéro (`touch_last_seen`). Les comptes
-- abonnés (essai, actif, paiement en retard) ne sont jamais concernés.

-- Réserve les comptes à avertir et renvoie leurs coordonnées : chaque compte n'est réservé
-- qu'une fois, même si la tâche est relancée ou tourne deux fois en même temps (US-40 c.5).
create function public.claim_retention_warnings(p_limit int default 200)
returns table (user_id uuid, email text, first_name text, locale public.app_locale)
language sql
security definer
set search_path = ''
as $$
  with due as (
    select p.id
    from public.profiles p
    where p.retention_warning_sent_at is null
      and p.last_seen_at < now() - (interval '3 years' - interval '30 days')
      and not exists (
        select 1 from public.subscriptions s
        where s.user_id = p.id and s.status in ('trialing', 'active', 'past_due')
      )
    order by p.last_seen_at
    limit p_limit
    for update of p skip locked
  )
  update public.profiles p
  set retention_warning_sent_at = now()
  from due
  join auth.users u on u.id = due.id
  where p.id = due.id
  returning p.id, u.email::text, p.first_name, p.locale;
$$;

-- Comptes avertis depuis 30 jours, toujours inactifs et sans abonnement : à supprimer (c.2).
create function public.retention_deletions_due(p_limit int default 200)
returns table (user_id uuid, stripe_customer_id text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.stripe_customer_id
  from public.profiles p
  where p.retention_warning_sent_at < now() - interval '30 days'
    and p.last_seen_at < now() - interval '3 years'
    and not exists (
      select 1 from public.subscriptions s
      where s.user_id = p.id and s.status in ('trialing', 'active', 'past_due')
    )
  order by p.retention_warning_sent_at
  limit p_limit;
$$;

revoke execute on function public.claim_retention_warnings(int) from public, anon, authenticated;
revoke execute on function public.retention_deletions_due(int) from public, anon, authenticated;
grant execute on function public.claim_retention_warnings(int) to service_role;
grant execute on function public.retention_deletions_due(int) to service_role;
