-- Inc-6 — Paiements : abonnements, achats uniques, événements Stripe, remise mensuelle et
-- maintenance planifiées (docs/data-model.md §3 à §5, docs/system-design.md §6.2 et §6.3,
-- US-18 à US-23).

create type public.plan_tier as enum ('essential', 'pro', 'premium');
create type public.billing_interval as enum ('month', 'year');
create type public.subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'unpaid',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'paused'
);
create type public.subscription_source as enum ('stripe', 'app_store', 'play_store');
create type public.purchase_product as enum (
  'credits_5',
  'credits_15',
  'credits_40',
  'cv_pro',
  'ads_removal'
);

-- Abonnement courant (au plus un par compte), miroir de l'état Stripe.
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  source public.subscription_source not null default 'stripe',
  provider_subscription_id text not null unique,
  plan public.plan_tier not null,
  billing_interval public.billing_interval not null,
  status public.subscription_status not null,
  monthly_credits int not null check (monthly_credits > 0),
  trial_ends_at timestamptz,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  next_credit_grant_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_next_grant_idx on public.subscriptions (next_credit_grant_at)
  where status in ('active', 'past_due');

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- Achats uniques. Le CV d'un CV Pro peut ensuite être remplacé ou supprimé (H22) : la règle
-- « CV obligatoire » est donc vérifiée à l'achat, pas par une contrainte.
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product public.purchase_product not null,
  cv_id uuid references public.cvs (id) on delete set null,
  stripe_checkout_session_id text not null unique,
  amount_cents int not null check (amount_cents >= 0),
  currency text not null default 'eur',
  terms_accepted_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index purchases_user_idx on public.purchases (user_id, created_at desc);

alter table public.credit_ledger
  add constraint credit_ledger_purchase_fk
  foreign key (purchase_id) references public.purchases (id) on delete set null;

-- Événements Stripe déjà traités (idempotence des webhooks), purgés après 90 jours.
create table public.stripe_events (
  id text primary key,
  type text not null,
  created_at timestamptz not null default now()
);

-- Accès : chacun lit son abonnement et ses achats ; seule l'application serveur écrit.
alter table public.subscriptions enable row level security;
alter table public.purchases enable row level security;
alter table public.stripe_events enable row level security;

revoke all on table public.subscriptions, public.purchases, public.stripe_events
  from anon, authenticated;
grant select on table public.subscriptions, public.purchases to authenticated;

create policy subscriptions_select_own on public.subscriptions
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy purchases_select_own on public.purchases
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Achat confirmé par Stripe : enregistré une seule fois par session de paiement (US-18 c.2),
-- puis crédits ajoutés, CV débloqué ou publicités retirées. Renvoie faux si déjà traité.
create function public.fulfill_purchase(
  p_user_id uuid,
  p_product public.purchase_product,
  p_session_id text,
  p_amount_cents int,
  p_currency text,
  p_terms_accepted_at timestamptz,
  p_credits int default 0,
  p_cv_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_purchase_id uuid;
begin
  if p_product = 'cv_pro' and p_cv_id is null then
    raise exception 'CV_REQUIRED';
  end if;

  insert into public.purchases (
    user_id, product, cv_id, stripe_checkout_session_id, amount_cents, currency,
    terms_accepted_at
  )
  values (
    p_user_id, p_product, p_cv_id, p_session_id, p_amount_cents, p_currency,
    p_terms_accepted_at
  )
  on conflict (stripe_checkout_session_id) do nothing
  returning id into v_purchase_id;

  if v_purchase_id is null then
    return false;
  end if;

  if p_product = 'cv_pro' then
    update public.cvs c
    set pro_unlocked_at = coalesce(c.pro_unlocked_at, now())
    where c.id = p_cv_id and c.user_id = p_user_id;
  elsif p_product = 'ads_removal' then
    update public.profiles p
    set ads_removed_at = coalesce(p.ads_removed_at, now())
    where p.id = p_user_id;
  else
    perform public.grant_credits(p_user_id, 'purchased', p_credits, 'pack_purchase', v_purchase_id);
  end if;

  return true;
end;
$$;

-- État d'un abonnement relu chez Stripe (ordre des événements indifférent) : formule, période,
-- crédits inclus (essai, début, montée immédiate H25, fin) et date de la prochaine remise.
create function public.sync_subscription(
  p_user_id uuid,
  p_provider_subscription_id text,
  p_plan public.plan_tier,
  p_interval public.billing_interval,
  p_status public.subscription_status,
  p_monthly_credits int,
  p_trial_credits int,
  p_current_period_end timestamptz,
  p_cancel_at_period_end boolean,
  p_trial_ends_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_previous public.subscriptions%rowtype;
  v_entitled boolean := p_status in ('trialing', 'active', 'past_due');
  v_was_entitled boolean := false;
  v_same boolean := false;
  v_next_grant timestamptz;
begin
  perform 1 from public.credit_wallets w where w.user_id = p_user_id for update;
  if not found then
    raise exception 'WALLET_NOT_FOUND';
  end if;

  select * into v_previous from public.subscriptions s where s.user_id = p_user_id for update;
  if found then
    v_was_entitled := v_previous.status in ('trialing', 'active', 'past_due');
    v_same := v_previous.provider_subscription_id = p_provider_subscription_id;
    -- Événement tardif d'un ancien abonnement terminé : l'abonnement courant ne change pas.
    if not v_same and v_was_entitled and not v_entitled then
      return;
    end if;
    if v_same then
      v_next_grant := v_previous.next_credit_grant_at;
    end if;
  end if;

  if p_status = 'trialing' then
    if not (v_same and v_previous.status = 'trialing') then
      perform public.set_included_credits(p_user_id, p_trial_credits, 'trial_grant');
    end if;
    update public.profiles p
    set trial_used_at = coalesce(p.trial_used_at, now())
    where p.id = p_user_id;
    v_next_grant := null;
  elsif v_entitled then
    if not (v_same and v_was_entitled) or v_previous.status = 'trialing' then
      -- Début de l'abonnement payant ou fin de l'essai : quota de la formule.
      perform public.set_included_credits(p_user_id, p_monthly_credits, 'monthly_grant');
      v_next_grant := now() + interval '1 month';
    elsif p_monthly_credits > v_previous.monthly_credits then
      perform public.set_included_credits(p_user_id, p_monthly_credits, 'upgrade_grant');
    end if;
  else
    if v_was_entitled then
      -- Fin de l'abonnement : crédits inclus perdus, crédits achetés conservés (H24).
      perform public.set_included_credits(p_user_id, 0, 'subscription_end');
    end if;
    v_next_grant := null;
  end if;

  insert into public.subscriptions (
    user_id, provider_subscription_id, plan, billing_interval, status, monthly_credits,
    trial_ends_at, current_period_end, cancel_at_period_end, next_credit_grant_at
  )
  values (
    p_user_id, p_provider_subscription_id, p_plan, p_interval, p_status, p_monthly_credits,
    p_trial_ends_at, p_current_period_end, p_cancel_at_period_end, v_next_grant
  )
  on conflict (user_id) do update set
    provider_subscription_id = excluded.provider_subscription_id,
    plan = excluded.plan,
    billing_interval = excluded.billing_interval,
    status = excluded.status,
    monthly_credits = excluded.monthly_credits,
    trial_ends_at = excluded.trial_ends_at,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = excluded.cancel_at_period_end,
    next_credit_grant_at = excluded.next_credit_grant_at;
end;
$$;

-- Remise mensuelle (US-23) : abonnements dont la remise est due, y compris les annuels ; la
-- date suivante avance d'un mois, donc une relance ne remet rien de plus.
create function public.run_monthly_grants()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subscription public.subscriptions%rowtype;
  v_next timestamptz;
  v_count int := 0;
begin
  for v_subscription in
    select * from public.subscriptions s
    where s.status in ('active', 'past_due') and s.next_credit_grant_at <= now()
    for update skip locked
  loop
    perform public.set_included_credits(
      v_subscription.user_id, v_subscription.monthly_credits, 'monthly_grant'
    );
    v_next := v_subscription.next_credit_grant_at + interval '1 month';
    while v_next <= now() loop
      v_next := v_next + interval '1 month';
    end loop;
    update public.subscriptions s set next_credit_grant_at = v_next where s.id = v_subscription.id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- Maintenance quotidienne : IP hachées de plus de 30 jours, événements Stripe de plus de
-- 90 jours, opérations IA restées « en cours » (arrêt brutal du serveur) remboursées.
create function public.run_daily_maintenance()
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

  for v_operation_id in
    select o.id from public.ai_operations o
    where o.status = 'pending' and o.created_at < now() - interval '15 minutes'
  loop
    perform public.fail_ai_operation(v_operation_id, 'STALE');
  end loop;
end;
$$;

revoke execute on function
  public.fulfill_purchase(uuid, public.purchase_product, text, int, text, timestamptz, int, uuid),
  public.sync_subscription(uuid, text, public.plan_tier, public.billing_interval, public.subscription_status, int, int, timestamptz, boolean, timestamptz),
  public.run_monthly_grants(),
  public.run_daily_maintenance()
from public, anon, authenticated;

grant execute on function
  public.fulfill_purchase(uuid, public.purchase_product, text, int, text, timestamptz, int, uuid),
  public.sync_subscription(uuid, text, public.plan_tier, public.billing_interval, public.subscription_status, int, int, timestamptz, boolean, timestamptz),
  public.run_monthly_grants(),
  public.run_daily_maintenance()
to service_role;

-- Planification (heure UTC) : remise mensuelle toutes les heures, maintenance chaque nuit.
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule('monthly-credit-grants', '0 * * * *', 'select public.run_monthly_grants()');
select cron.schedule('daily-maintenance', '0 3 * * *', 'select public.run_daily_maintenance()');
