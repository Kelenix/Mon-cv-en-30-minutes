-- Inc-3 — Crédits et droits : portefeuilles, journal des mouvements, opérations IA, fonctions de
-- débit et de remise (docs/data-model.md §3 à §5, US-07 à US-09, NFR-08).

create type public.credit_bucket as enum ('included', 'purchased');

create type public.ledger_reason as enum (
  'ai_operation',
  'ai_refund',
  'pack_purchase',
  'rewarded_ad',
  'trial_grant',
  'monthly_grant',
  'upgrade_grant',
  'included_expiry',
  'subscription_end'
);

create type public.ai_operation_kind as enum (
  'generate_cv',
  'improve_experience',
  'improve_summary',
  'adapt_to_job',
  'linkedin',
  'cover_letter',
  'interview',
  'interview_feedback'
);

create type public.ai_operation_status as enum ('pending', 'succeeded', 'failed');

-- Soldes : crédits inclus (remis chaque mois par l'abonnement) et crédits achetés.
create table public.credit_wallets (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  included_balance int not null default 0 check (included_balance >= 0),
  purchased_balance int not null default 0 check (purchased_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger credit_wallets_set_updated_at
  before update on public.credit_wallets
  for each row execute function public.set_updated_at();

-- Opérations IA : journal sans le contenu (coûts, durée, idempotence par request_id).
create table public.ai_operations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  request_id uuid not null,
  kind public.ai_operation_kind not null,
  status public.ai_operation_status not null default 'pending',
  credits_charged int not null default 0 check (credits_charged >= 0),
  was_free boolean not null default false,
  model text,
  input_tokens int,
  output_tokens int,
  cache_read_tokens int,
  cost_usd_micros bigint,
  duration_ms int,
  error_code text,
  ip_hash text,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  unique (user_id, request_id)
);

create index ai_operations_user_created_idx on public.ai_operations (user_id, created_at desc);
create index ai_operations_free_ip_idx on public.ai_operations (ip_hash, created_at) where was_free;

-- Journal des mouvements : ajout seul. La clé vers les achats (purchases) arrive à l'Inc-6.
create table public.credit_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  bucket public.credit_bucket not null,
  delta int not null check (delta <> 0),
  reason public.ledger_reason not null,
  operation_id uuid references public.ai_operations (id) on delete set null,
  purchase_id uuid,
  created_at timestamptz not null default now()
);

create index credit_ledger_user_created_idx on public.credit_ledger (user_id, created_at desc);
create index credit_ledger_operation_idx on public.credit_ledger (operation_id);

create function public.prevent_ledger_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'LEDGER_IMMUTABLE';
end;
$$;

revoke execute on function public.prevent_ledger_update() from public, anon, authenticated;

create trigger credit_ledger_immutable
  before update on public.credit_ledger
  for each row execute function public.prevent_ledger_update();

-- Accès : chacun lit son solde et son journal ; aucune écriture directe. Les opérations IA ne
-- sont lisibles que par le serveur.
alter table public.credit_wallets enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.ai_operations enable row level security;

revoke all on table public.credit_wallets, public.credit_ledger, public.ai_operations
  from anon, authenticated;
grant select on table public.credit_wallets, public.credit_ledger to authenticated;

create policy credit_wallets_select_own on public.credit_wallets
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy credit_ledger_select_own on public.credit_ledger
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Débit d'une opération IA : verrou sur l'opération puis sur le portefeuille (aucun double débit,
-- solde jamais négatif) ; crédits inclus d'abord si la matrice des droits le permet.
create function public.spend_credits(
  p_user_id uuid,
  p_operation_id uuid,
  p_cost int,
  p_allow_included boolean
)
returns table (included_balance int, purchased_balance int)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_included int;
  v_purchased int;
  v_from_included int;
  v_from_purchased int;
begin
  if p_cost <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  perform 1 from public.ai_operations
  where id = p_operation_id and user_id = p_user_id
  for update;
  if not found then
    raise exception 'OPERATION_NOT_FOUND';
  end if;

  select w.included_balance, w.purchased_balance into v_included, v_purchased
  from public.credit_wallets w
  where w.user_id = p_user_id
  for update;
  if not found then
    raise exception 'WALLET_NOT_FOUND';
  end if;

  -- Opération déjà débitée : rien de plus (rejeu ou double clic).
  if exists (
    select 1 from public.credit_ledger l
    where l.operation_id = p_operation_id and l.reason = 'ai_operation'
  ) then
    return query select v_included, v_purchased;
    return;
  end if;

  v_from_included := case when p_allow_included then least(v_included, p_cost) else 0 end;
  v_from_purchased := p_cost - v_from_included;
  if v_from_purchased > v_purchased then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  update public.credit_wallets w
  set included_balance = w.included_balance - v_from_included,
      purchased_balance = w.purchased_balance - v_from_purchased
  where w.user_id = p_user_id;

  if v_from_included > 0 then
    insert into public.credit_ledger (user_id, bucket, delta, reason, operation_id)
    values (p_user_id, 'included', -v_from_included, 'ai_operation', p_operation_id);
  end if;
  if v_from_purchased > 0 then
    insert into public.credit_ledger (user_id, bucket, delta, reason, operation_id)
    values (p_user_id, 'purchased', -v_from_purchased, 'ai_operation', p_operation_id);
  end if;

  update public.ai_operations set credits_charged = p_cost where id = p_operation_id;

  return query select v_included - v_from_included, v_purchased - v_from_purchased;
end;
$$;

-- Remboursement d'une opération échouée : une seule fois, dans les soldes d'origine.
create function public.refund_operation(p_operation_id uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_included int;
  v_purchased int;
begin
  select o.user_id into v_user_id
  from public.ai_operations o
  where o.id = p_operation_id
  for update;
  if not found then
    raise exception 'OPERATION_NOT_FOUND';
  end if;

  if exists (
    select 1 from public.credit_ledger l
    where l.operation_id = p_operation_id and l.reason = 'ai_refund'
  ) then
    return 0;
  end if;

  select
    coalesce(-sum(l.delta) filter (where l.bucket = 'included'), 0),
    coalesce(-sum(l.delta) filter (where l.bucket = 'purchased'), 0)
  into v_included, v_purchased
  from public.credit_ledger l
  where l.operation_id = p_operation_id and l.reason = 'ai_operation';

  if v_included + v_purchased = 0 then
    return 0;
  end if;

  update public.credit_wallets w
  set included_balance = w.included_balance + v_included,
      purchased_balance = w.purchased_balance + v_purchased
  where w.user_id = v_user_id;

  if v_included > 0 then
    insert into public.credit_ledger (user_id, bucket, delta, reason, operation_id)
    values (v_user_id, 'included', v_included, 'ai_refund', p_operation_id);
  end if;
  if v_purchased > 0 then
    insert into public.credit_ledger (user_id, bucket, delta, reason, operation_id)
    values (v_user_id, 'purchased', v_purchased, 'ai_refund', p_operation_id);
  end if;

  return v_included + v_purchased;
end;
$$;

-- Ajout de crédits (pack acheté, vidéo récompensée…).
create function public.grant_credits(
  p_user_id uuid,
  p_bucket public.credit_bucket,
  p_amount int,
  p_reason public.ledger_reason,
  p_purchase_id uuid default null
)
returns table (included_balance int, purchased_balance int)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_amount <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  perform 1 from public.credit_wallets w where w.user_id = p_user_id for update;
  if not found then
    raise exception 'WALLET_NOT_FOUND';
  end if;

  update public.credit_wallets w
  set included_balance = w.included_balance + case when p_bucket = 'included' then p_amount else 0 end,
      purchased_balance = w.purchased_balance + case when p_bucket = 'purchased' then p_amount else 0 end
  where w.user_id = p_user_id;

  insert into public.credit_ledger (user_id, bucket, delta, reason, purchase_id)
  values (p_user_id, p_bucket, p_amount, p_reason, p_purchase_id);

  return query
  select w.included_balance, w.purchased_balance
  from public.credit_wallets w
  where w.user_id = p_user_id;
end;
$$;

-- Remise du solde inclus au quota de la formule (essai, remise mensuelle, montée de formule) ou à
-- zéro (fin d'abonnement) : le reste expire, sans report (ADR-004).
create function public.set_included_credits(
  p_user_id uuid,
  p_amount int,
  p_reason public.ledger_reason
)
returns table (included_balance int, purchased_balance int)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current int;
begin
  if p_amount < 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  select w.included_balance into v_current
  from public.credit_wallets w
  where w.user_id = p_user_id
  for update;
  if not found then
    raise exception 'WALLET_NOT_FOUND';
  end if;

  if v_current > 0 then
    insert into public.credit_ledger (user_id, bucket, delta, reason)
    values (
      p_user_id,
      'included',
      -v_current,
      case when p_reason = 'subscription_end' then 'subscription_end' else 'included_expiry' end::public.ledger_reason
    );
  end if;
  if p_amount > 0 then
    insert into public.credit_ledger (user_id, bucket, delta, reason)
    values (p_user_id, 'included', p_amount, p_reason);
  end if;

  update public.credit_wallets w set included_balance = p_amount where w.user_id = p_user_id;

  return query
  select w.included_balance, w.purchased_balance
  from public.credit_wallets w
  where w.user_id = p_user_id;
end;
$$;

revoke execute on function
  public.spend_credits(uuid, uuid, int, boolean),
  public.refund_operation(uuid),
  public.grant_credits(uuid, public.credit_bucket, int, public.ledger_reason, uuid),
  public.set_included_credits(uuid, int, public.ledger_reason)
from public, anon, authenticated;

grant execute on function
  public.spend_credits(uuid, uuid, int, boolean),
  public.refund_operation(uuid),
  public.grant_credits(uuid, public.credit_bucket, int, public.ledger_reason, uuid),
  public.set_included_credits(uuid, int, public.ledger_reason)
to service_role;

-- Inscription : profil et portefeuille vide (complète la fonction de l'Inc-2).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_locale text := new.raw_user_meta_data ->> 'locale';
begin
  insert into public.profiles (id, locale)
  values (
    new.id,
    case
      when requested_locale in ('fr', 'en', 'it', 'es', 'de') then requested_locale::public.app_locale
      else 'en'::public.app_locale
    end
  );
  insert into public.credit_wallets (user_id) values (new.id);
  return new;
end;
$$;

-- Comptes créés avant cette migration.
insert into public.credit_wallets (user_id)
select p.id from public.profiles p
on conflict (user_id) do nothing;
