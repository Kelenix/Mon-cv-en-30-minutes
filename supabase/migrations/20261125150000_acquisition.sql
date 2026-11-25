-- Plan d'acquisition (ADR-052) : provenance des comptes, des CV et des achats en compteurs
-- anonymes, lettre de motivation offerte, parrainage.

-- 1. Compteurs par jour, canal et source, sans aucun lien avec un compte. Gardés 25 mois.
create table public.acquisition_counts (
  day date not null,
  channel text not null check (channel in ('direct', 'search', 'social', 'referral', 'campaign')),
  source text not null check (source ~ '^[a-z0-9._-]{1,60}$'),
  event text not null check (event in ('signup', 'cv', 'trial', 'purchase')),
  count int not null default 0 check (count >= 0),
  amount_cents bigint not null default 0 check (amount_cents >= 0),
  primary key (day, channel, source, event)
);

-- Provenance d'un paiement en cours : effacée dès que le paiement est compté, ou après 2 jours.
create table public.acquisition_checkouts (
  stripe_checkout_session_id text primary key check (char_length(stripe_checkout_session_id) <= 255),
  channel text not null check (channel in ('direct', 'search', 'social', 'referral', 'campaign')),
  source text not null check (source ~ '^[a-z0-9._-]{1,60}$'),
  created_at timestamptz not null default now()
);

alter table public.acquisition_counts enable row level security;
alter table public.acquisition_checkouts enable row level security;
revoke all on table public.acquisition_counts, public.acquisition_checkouts from anon, authenticated;

create function public.record_acquisition(
  p_channel text,
  p_source text,
  p_event text,
  p_amount_cents bigint default 0
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.acquisition_counts as a (day, channel, source, event, count, amount_cents)
  values ((now() at time zone 'Europe/Paris')::date, p_channel, p_source, p_event, 1,
          greatest(coalesce(p_amount_cents, 0), 0))
  on conflict (day, channel, source, event) do update
  set count = a.count + 1, amount_cents = a.amount_cents + excluded.amount_cents;
$$;

-- Paiement confirmé : compté une seule fois (essai s'il est gratuit), puis provenance effacée.
create function public.record_acquisition_checkout(p_session_id text, p_amount_cents bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_channel text;
  v_source text;
begin
  delete from public.acquisition_checkouts c
  where c.stripe_checkout_session_id = p_session_id
  returning c.channel, c.source into v_channel, v_source;
  if found then
    perform public.record_acquisition(
      v_channel, v_source,
      case when coalesce(p_amount_cents, 0) > 0 then 'purchase' else 'trial' end,
      p_amount_cents
    );
  end if;
end;
$$;

-- 2. Première connexion, pour compter une inscription une seule fois. Les comptes existants
-- sont considérés comme déjà comptés.
alter table public.profiles add column first_sign_in_at timestamptz;
update public.profiles set first_sign_in_at = created_at;

-- 3. Lettre de motivation offerte, une par compte.
alter table public.profiles add column free_letter_used_at timestamptz;

-- 4. Parrainage : code personnel, lien parrain-filleul, crédits au premier CV du filleul.
alter type public.ledger_reason add value 'referral';

alter table public.profiles
  add column referral_code text unique check (referral_code ~ '^[a-z0-9]{8}$');

create table public.referrals (
  referee_id uuid primary key references public.profiles (id) on delete cascade,
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  rewarded_at timestamptz,
  referrer_rewarded boolean not null default false,
  check (referee_id <> referrer_id)
);

create index referrals_referrer_idx on public.referrals (referrer_id, rewarded_at);

-- Le parrain voit ses filleuls (sans leur identité) ; tout le reste passe par le serveur.
alter table public.referrals enable row level security;
revoke all on table public.referrals from anon, authenticated;
grant select on table public.referrals to authenticated;

create policy referrals_select_referrer on public.referrals
  for select to authenticated
  using ((select auth.uid()) = referrer_id);

-- Code personnel, créé à la première demande.
create function public.ensure_referral_code(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
begin
  select p.referral_code into v_code from public.profiles p where p.id = p_user_id;
  if not found then
    raise exception 'NOT_FOUND';
  end if;
  while v_code is null loop
    begin
      update public.profiles p
      set referral_code = substr(md5(gen_random_uuid()::text), 1, 8)
      where p.id = p_user_id and p.referral_code is null
      returning p.referral_code into v_code;
      if v_code is null then
        select p.referral_code into v_code from public.profiles p where p.id = p_user_id;
      end if;
    exception when unique_violation or check_violation then
      v_code := null;
    end;
  end loop;
  return v_code;
end;
$$;

-- Compte neuf arrivé par une invitation : lien noté une fois, jamais avec soi-même.
create function public.attach_referral(p_referee_id uuid, p_code text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_referrer uuid;
begin
  select p.id into v_referrer from public.profiles p where p.referral_code = lower(p_code);
  if v_referrer is null or v_referrer = p_referee_id then
    return false;
  end if;
  insert into public.referrals (referee_id, referrer_id)
  values (p_referee_id, v_referrer)
  on conflict (referee_id) do nothing;
  return found;
end;
$$;

-- Premier CV du filleul : p_credits crédits (achetés : ils n'expirent pas) pour chacun, une seule
-- fois. Au-delà de p_monthly_cap filleuls récompensés en 30 jours, seul le filleul est récompensé.
create function public.reward_referral(p_referee_id uuid, p_credits int, p_monthly_cap int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_referrer uuid;
  v_referrer_rewarded boolean;
begin
  select r.referrer_id into v_referrer
  from public.referrals r
  where r.referee_id = p_referee_id and r.rewarded_at is null
  for update;
  if v_referrer is null then
    return false;
  end if;

  -- Sérialise les récompenses d'un même parrain pour respecter le plafond.
  perform 1 from public.profiles p where p.id = v_referrer for update;
  v_referrer_rewarded := (
    select count(*) from public.referrals r
    where r.referrer_id = v_referrer
      and r.referrer_rewarded
      and r.rewarded_at >= now() - interval '30 days'
  ) < p_monthly_cap;

  perform public.grant_credits(p_referee_id, 'purchased', p_credits, 'referral');
  if v_referrer_rewarded then
    perform public.grant_credits(v_referrer, 'purchased', p_credits, 'referral');
  end if;

  update public.referrals r
  set rewarded_at = now(), referrer_rewarded = v_referrer_rewarded
  where r.referee_id = p_referee_id;
  return true;
end;
$$;

revoke execute on function
  public.record_acquisition(text, text, text, bigint),
  public.record_acquisition_checkout(text, bigint),
  public.ensure_referral_code(uuid),
  public.attach_referral(uuid, text),
  public.reward_referral(uuid, int, int)
from public, anon, authenticated;
grant execute on function
  public.record_acquisition(text, text, text, bigint),
  public.record_acquisition_checkout(text, bigint),
  public.ensure_referral_code(uuid),
  public.attach_referral(uuid, text),
  public.reward_referral(uuid, int, int)
to service_role;

-- 5. Lecture de l'administration : visites, inscriptions, CV, essais et achats par source.
create function public.admin_acquisition(p_days int)
returns table (
  channel text,
  source text,
  visits bigint,
  signups bigint,
  cvs bigint,
  trials bigint,
  purchases bigint,
  revenue_cents bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with first_day as (
    select (now() at time zone 'Europe/Paris')::date - (least(greatest(p_days, 1), 366) - 1) as day
  ),
  v as (
    select sv.channel, sv.source, sum(sv.visits)::bigint as n
    from public.site_visits sv
    where sv.day >= (select f.day from first_day f)
    group by 1, 2
  ),
  a as (
    select ac.channel, ac.source,
           coalesce(sum(ac.count) filter (where ac.event = 'signup'), 0)::bigint as signups,
           coalesce(sum(ac.count) filter (where ac.event = 'cv'), 0)::bigint as cvs,
           coalesce(sum(ac.count) filter (where ac.event = 'trial'), 0)::bigint as trials,
           coalesce(sum(ac.count) filter (where ac.event = 'purchase'), 0)::bigint as purchases,
           coalesce(sum(ac.amount_cents) filter (where ac.event = 'purchase'), 0)::bigint as revenue
    from public.acquisition_counts ac
    where ac.day >= (select f.day from first_day f)
    group by 1, 2
  )
  select coalesce(v.channel, a.channel), coalesce(v.source, a.source),
         coalesce(v.n, 0), coalesce(a.signups, 0), coalesce(a.cvs, 0),
         coalesce(a.trials, 0), coalesce(a.purchases, 0), coalesce(a.revenue, 0)
  from v
  full join a on a.channel = v.channel and a.source = v.source
  order by coalesce(a.revenue, 0) desc, coalesce(a.signups, 0) desc, coalesce(v.n, 0) desc
  limit 50;
$$;

revoke execute on function public.admin_acquisition(int) from public, anon, authenticated;
grant execute on function public.admin_acquisition(int) to service_role;

-- 6. Maintenance quotidienne : en plus, compteurs d'acquisition gardés 25 mois et provenances
-- de paiements abandonnés effacées après 2 jours.
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

  delete from public.site_visits v where v.day < current_date - interval '25 months';

  delete from public.acquisition_counts a where a.day < current_date - interval '25 months';

  delete from public.acquisition_checkouts c where c.created_at < now() - interval '2 days';

  delete from public.job_runs r where r.finished_at < now() - interval '90 days';

  delete from public.admin_audit_log l where l.created_at < now() - interval '1 year';

  -- Opération restée en cours d'un compte supprimé depuis : rien à rembourser.
  update public.ai_operations o
  set status = 'failed', error_code = 'STALE', finished_at = now()
  where o.status = 'pending' and o.user_id is null
    and o.created_at < now() - interval '15 minutes';

  for v_operation_id in
    select o.id from public.ai_operations o
    where o.status = 'pending' and o.user_id is not null
      and o.created_at < now() - interval '15 minutes'
  loop
    perform public.fail_ai_operation(v_operation_id, 'STALE');
  end loop;
end;
$$;
