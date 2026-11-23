-- Inc-11 — Vidéos récompensées (US-35, H26, docs/data-model.md §3) : un jeton à usage unique
-- émis par le serveur avant l'annonce, échangé contre 1 crédit acheté à la fin, 3 par jour au plus.

create table public.reward_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '15 minutes',
  redeemed_at timestamptz
);

create index reward_tokens_user_created_idx on public.reward_tokens (user_id, created_at);

-- Réservée au serveur : aucun accès direct (RLS sans policy, aucun privilège).
alter table public.reward_tokens enable row level security;
revoke all on table public.reward_tokens from anon, authenticated;

-- Crédits gagnés sur 24 heures glissantes.
create function public.rewarded_credits_today(p_user_id uuid)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from public.reward_tokens t
  where t.user_id = p_user_id and t.redeemed_at > now() - interval '1 day';
$$;

-- Émet un jeton avant l'annonce ; refusé une fois le plafond du jour atteint, ou si trop de
-- jetons ont été demandés (annonces lancées puis abandonnées en boucle).
create function public.issue_reward_token(p_user_id uuid, p_daily_limit int)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token uuid;
begin
  perform 1 from public.credit_wallets w where w.user_id = p_user_id for update;
  if not found then
    raise exception 'WALLET_NOT_FOUND';
  end if;
  if public.rewarded_credits_today(p_user_id) >= p_daily_limit or (
    select count(*) from public.reward_tokens t
    where t.user_id = p_user_id and t.created_at > now() - interval '1 day'
  ) >= p_daily_limit * 10 then
    raise exception 'RATE_LIMITED';
  end if;

  insert into public.reward_tokens (user_id) values (p_user_id) returning id into v_token;
  return v_token;
end;
$$;

-- Échange un jeton contre 1 crédit acheté, une seule fois, avant son expiration et au moins
-- 5 secondes après son émission (durée minimale d'une annonce). Renvoie le solde acheté.
create function public.redeem_reward_token(p_user_id uuid, p_token uuid, p_daily_limit int)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token public.reward_tokens%rowtype;
  v_purchased int;
begin
  perform 1 from public.credit_wallets w where w.user_id = p_user_id for update;
  if not found then
    raise exception 'WALLET_NOT_FOUND';
  end if;

  select * into v_token
  from public.reward_tokens t
  where t.id = p_token and t.user_id = p_user_id
  for update;
  if not found
    or v_token.redeemed_at is not null
    or v_token.expires_at < now()
    or v_token.created_at > now() - interval '5 seconds' then
    raise exception 'CONFLICT';
  end if;
  if public.rewarded_credits_today(p_user_id) >= p_daily_limit then
    raise exception 'RATE_LIMITED';
  end if;

  update public.reward_tokens t set redeemed_at = now() where t.id = p_token;
  select g.purchased_balance into v_purchased
  from public.grant_credits(p_user_id, 'purchased', 1, 'rewarded_ad') g;
  return v_purchased;
end;
$$;

revoke execute on function
  public.rewarded_credits_today(uuid),
  public.issue_reward_token(uuid, int),
  public.redeem_reward_token(uuid, uuid, int)
from public, anon, authenticated;

grant execute on function
  public.rewarded_credits_today(uuid),
  public.issue_reward_token(uuid, int),
  public.redeem_reward_token(uuid, uuid, int)
to service_role;

-- Maintenance quotidienne : en plus, jetons de vidéo de plus de 30 jours supprimés.
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

  for v_operation_id in
    select o.id from public.ai_operations o
    where o.status = 'pending' and o.created_at < now() - interval '15 minutes'
  loop
    perform public.fail_ai_operation(v_operation_id, 'STALE');
  end loop;
end;
$$;
