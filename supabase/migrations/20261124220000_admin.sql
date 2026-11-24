-- Inc-14 — Espace d'administration (ADR-040) : données collectées pour les statistiques
-- (pays à l'inscription, visites anonymes, moyens de paiement, paiements d'abonnement),
-- journaux (actions d'administration, tâches du site) et fonctions de lecture réservées au
-- serveur. Aucune table n'est lisible par les visiteurs ni par les comptes.

-- 1. Revenus et coûts gardés, anonymisés, après la suppression d'un compte : ni nom, ni e-mail,
-- ni contenu ; seulement montant, produit, date (et coût de l'IA).
alter table public.purchases alter column user_id drop not null;
alter table public.purchases drop constraint purchases_user_id_fkey;
alter table public.purchases add constraint purchases_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete set null;

alter table public.ai_operations alter column user_id drop not null;
alter table public.ai_operations drop constraint ai_operations_user_id_fkey;
alter table public.ai_operations add constraint ai_operations_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete set null;

create index ai_operations_created_idx on public.ai_operations (created_at);
create index purchases_created_idx on public.purchases (created_at);
create index profiles_created_idx on public.profiles (created_at);

-- 2. Moyen de paiement utilisé (carte, Apple Pay, Google Pay, PayPal, prélèvement SEPA…).
alter table public.purchases
  add column payment_method text check (char_length(payment_method) <= 40);
alter table public.subscriptions
  add column payment_method text check (char_length(payment_method) <= 40);

-- 3. Paiements des abonnements (factures payées), pour le suivi des revenus.
create table public.subscription_invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  stripe_invoice_id text not null unique,
  plan public.plan_tier,
  billing_interval public.billing_interval,
  amount_cents int not null check (amount_cents >= 0),
  currency text not null default 'eur',
  payment_method text check (char_length(payment_method) <= 40),
  paid_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index subscription_invoices_paid_idx on public.subscription_invoices (paid_at);

-- 4. Pays du compte, déduit de l'adresse IP à la première connexion (l'adresse n'est pas gardée).
alter table public.profiles
  add column signup_country text check (signup_country ~ '^[A-Z]{2}$');

-- 5. Visites : compteurs anonymes par jour, canal, source et pays ; aucun cookie, aucune
-- adresse IP, aucun lien avec un compte. Gardés 25 mois.
create table public.site_visits (
  day date not null,
  channel text not null check (channel in ('direct', 'search', 'social', 'referral', 'campaign')),
  source text not null check (char_length(source) between 1 and 60),
  country text not null check (country ~ '^[A-Z]{2}$'),
  visits int not null default 0 check (visits >= 0),
  primary key (day, channel, source, country)
);

create function public.record_visit(p_channel text, p_source text, p_country text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.site_visits as v (day, channel, source, country, visits)
  values ((now() at time zone 'Europe/Paris')::date, p_channel, p_source, p_country, 1)
  on conflict (day, channel, source, country) do update set visits = v.visits + 1;
$$;

-- 6. Crédits offerts par l'administration (geste commercial, dédommagement).
alter type public.ledger_reason add value 'admin_grant';

-- 7. Journal des actions d'administration (qui, quoi, sur quel compte), gardé un an.
create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_email text not null,
  action text not null check (char_length(action) <= 40),
  target_user_id uuid,
  target_email text,
  details jsonb not null default '{}' check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default now()
);

create index admin_audit_log_created_idx on public.admin_audit_log (created_at desc);

-- 8. Exécutions des tâches planifiées du site (rétention), gardées 90 jours.
create table public.job_runs (
  id bigint generated always as identity primary key,
  job text not null check (char_length(job) <= 40),
  ok boolean not null,
  details jsonb not null default '{}' check (jsonb_typeof(details) = 'object'),
  finished_at timestamptz not null default now()
);

create index job_runs_job_finished_idx on public.job_runs (job, finished_at desc);

alter table public.subscription_invoices enable row level security;
alter table public.site_visits enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.job_runs enable row level security;
revoke all on table public.subscription_invoices, public.site_visits,
  public.admin_audit_log, public.job_runs from anon, authenticated;

-- 9. Lectures de l'administration : réservées au serveur, après vérification de l'administrateur.

-- Séries quotidiennes (jour de Paris) sur les p_days derniers jours.
create function public.admin_daily(p_days int)
returns table (
  day date,
  signups int,
  cvs int,
  ai_operations int,
  ai_failed int,
  ai_cost_micros bigint,
  revenue_cents bigint,
  visits int
)
language sql
stable
security definer
set search_path = ''
as $$
  with bounds as (
    select (now() at time zone 'Europe/Paris')::date as today,
           (now() at time zone 'Europe/Paris')::date - (least(greatest(p_days, 1), 366) - 1) as first_day
  ),
  days as (
    select generate_series(b.first_day, b.today, interval '1 day')::date as day from bounds b
  ),
  since as (select (b.first_day::timestamp at time zone 'Europe/Paris') as ts from bounds b),
  s as (
    select (p.created_at at time zone 'Europe/Paris')::date as day, count(*) as n
    from public.profiles p where p.created_at >= (select ts from since) group by 1
  ),
  c as (
    select (v.created_at at time zone 'Europe/Paris')::date as day, count(*) as n
    from public.cvs v where v.created_at >= (select ts from since) group by 1
  ),
  a as (
    select (o.created_at at time zone 'Europe/Paris')::date as day,
           count(*) as n,
           count(*) filter (where o.status = 'failed') as failed,
           coalesce(sum(o.cost_usd_micros), 0) as cost
    from public.ai_operations o where o.created_at >= (select ts from since) group by 1
  ),
  r as (
    select x.day, sum(x.amount) as amount from (
      select (p.created_at at time zone 'Europe/Paris')::date as day, p.amount_cents as amount
      from public.purchases p where p.created_at >= (select ts from since)
      union all
      select (i.paid_at at time zone 'Europe/Paris')::date, i.amount_cents
      from public.subscription_invoices i where i.paid_at >= (select ts from since)
    ) x group by 1
  ),
  v as (
    select sv.day, sum(sv.visits) as n from public.site_visits sv
    where sv.day >= (select first_day from bounds) group by 1
  )
  select d.day,
         coalesce(s.n, 0)::int, coalesce(c.n, 0)::int,
         coalesce(a.n, 0)::int, coalesce(a.failed, 0)::int, coalesce(a.cost, 0)::bigint,
         coalesce(r.amount, 0)::bigint, coalesce(v.n, 0)::int
  from days d
  left join s on s.day = d.day
  left join c on c.day = d.day
  left join a on a.day = d.day
  left join r on r.day = d.day
  left join v on v.day = d.day
  order by d.day;
$$;

-- Chiffres clés et répartitions sur les p_days derniers jours.
create function public.admin_summary(p_days int)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with since as (
    select now() - make_interval(days => least(greatest(p_days, 1), 366)) as ts
  ),
  month_start as (
    select (date_trunc('month', now() at time zone 'Europe/Paris') at time zone 'Europe/Paris') as ts
  ),
  revenue as (
    select p.created_at as at, p.amount_cents as amount, p.product::text as item,
           coalesce(p.payment_method, 'inconnu') as method
    from public.purchases p
    union all
    select i.paid_at, i.amount_cents, 'abonnement_' || coalesce(i.plan::text, 'inconnu'),
           coalesce(i.payment_method, 'inconnu')
    from public.subscription_invoices i
  ),
  google_users as (
    select distinct i.user_id from auth.identities i where i.provider = 'google'
  )
  select jsonb_build_object(
    'users', jsonb_build_object(
      'total', (select count(*) from public.profiles),
      'new', (select count(*) from public.profiles p where p.created_at >= (select ts from since)),
      'active7', (select count(*) from public.profiles p where p.last_seen_at >= now() - interval '7 days'),
      'active30', (select count(*) from public.profiles p where p.last_seen_at >= now() - interval '30 days'),
      'banned', (select count(*) from auth.users u where u.banned_until > now()),
      'adsRemoved', (select count(*) from public.profiles p where p.ads_removed_at is not null)
    ),
    'subscriptions', jsonb_build_object(
      'byPlan', coalesce((
        select jsonb_agg(jsonb_build_object('plan', x.plan, 'interval', x.billing_interval, 'status', x.status, 'count', x.n))
        from (
          select s.plan, s.billing_interval, s.status, count(*) as n
          from public.subscriptions s
          where s.status in ('trialing', 'active', 'past_due')
          group by 1, 2, 3
        ) x
      ), '[]'::jsonb),
      'canceled', (
        select count(*) from public.subscriptions s
        where s.status = 'canceled' and s.updated_at >= (select ts from since)
      )
    ),
    'revenue', jsonb_build_object(
      'period', (select coalesce(sum(r.amount), 0) from revenue r where r.at >= (select ts from since)),
      'month', (select coalesce(sum(r.amount), 0) from revenue r where r.at >= (select ts from month_start)),
      'total', (select coalesce(sum(r.amount), 0) from revenue r),
      'payments', (select count(*) from revenue r where r.at >= (select ts from since)),
      'byItem', coalesce((
        select jsonb_agg(jsonb_build_object('key', x.item, 'amount', x.amount, 'count', x.n) order by x.amount desc)
        from (select r.item, sum(r.amount) as amount, count(*) as n from revenue r
              where r.at >= (select ts from since) group by 1) x
      ), '[]'::jsonb),
      'byMethod', coalesce((
        select jsonb_agg(jsonb_build_object('key', x.method, 'amount', x.amount, 'count', x.n) order by x.n desc)
        from (select r.method, sum(r.amount) as amount, count(*) as n from revenue r
              where r.at >= (select ts from since) group by 1) x
      ), '[]'::jsonb)
    ),
    'credits', jsonb_build_object(
      'included', (select coalesce(sum(w.included_balance), 0) from public.credit_wallets w),
      'purchased', (select coalesce(sum(w.purchased_balance), 0) from public.credit_wallets w),
      'byReason', coalesce((
        select jsonb_agg(jsonb_build_object('key', x.reason, 'credits', x.total, 'count', x.n) order by abs(x.total) desc)
        from (select l.reason::text as reason, sum(l.delta) as total, count(*) as n
              from public.credit_ledger l where l.created_at >= (select ts from since) group by 1) x
      ), '[]'::jsonb)
    ),
    'content', jsonb_build_object(
      'cvs', (select count(*) from public.cvs),
      'cvsPeriod', (select count(*) from public.cvs v where v.created_at >= (select ts from since)),
      'generationsByKind', coalesce((
        select jsonb_agg(jsonb_build_object('key', x.kind, 'count', x.n) order by x.n desc)
        from (select g.kind::text as kind, count(*) as n from public.generations g
              where g.created_at >= (select ts from since) group by 1) x
      ), '[]'::jsonb)
    ),
    'ai', jsonb_build_object(
      'byKind', coalesce((
        select jsonb_agg(jsonb_build_object(
          'key', x.kind, 'count', x.n, 'failed', x.failed, 'free', x.free,
          'avgMs', x.avg_ms, 'costMicros', x.cost, 'inputTokens', x.input_tokens,
          'outputTokens', x.output_tokens
        ) order by x.n desc)
        from (
          select o.kind::text as kind, count(*) as n,
                 count(*) filter (where o.status = 'failed') as failed,
                 count(*) filter (where o.was_free) as free,
                 round(avg(o.duration_ms) filter (where o.status = 'succeeded')) as avg_ms,
                 coalesce(sum(o.cost_usd_micros), 0) as cost,
                 coalesce(sum(o.input_tokens), 0) as input_tokens,
                 coalesce(sum(o.output_tokens), 0) as output_tokens
          from public.ai_operations o where o.created_at >= (select ts from since)
          group by 1
        ) x
      ), '[]'::jsonb),
      'errors', coalesce((
        select jsonb_agg(jsonb_build_object('key', x.code, 'count', x.n) order by x.n desc)
        from (select coalesce(o.error_code, 'inconnue') as code, count(*) as n
              from public.ai_operations o
              where o.status = 'failed' and o.created_at >= (select ts from since)
              group by 1) x
      ), '[]'::jsonb)
    ),
    'audience', jsonb_build_object(
      'signupCountries', coalesce((
        select jsonb_agg(jsonb_build_object('key', x.country, 'count', x.n) order by x.n desc)
        from (select coalesce(p.signup_country, 'inconnu') as country, count(*) as n
              from public.profiles p where p.created_at >= (select ts from since) group by 1) x
      ), '[]'::jsonb),
      'signupLocales', coalesce((
        select jsonb_agg(jsonb_build_object('key', x.locale, 'count', x.n) order by x.n desc)
        from (select p.locale::text as locale, count(*) as n
              from public.profiles p where p.created_at >= (select ts from since) group by 1) x
      ), '[]'::jsonb),
      'signupMethods', jsonb_build_object(
        'google', (select count(*) from public.profiles p
                   where p.created_at >= (select ts from since)
                     and p.id in (select g.user_id from google_users g)),
        'email', (select count(*) from public.profiles p
                  where p.created_at >= (select ts from since)
                    and p.id not in (select g.user_id from google_users g))
      ),
      'visitChannels', coalesce((
        select jsonb_agg(jsonb_build_object('key', x.channel, 'count', x.n) order by x.n desc)
        from (select v.channel, sum(v.visits) as n from public.site_visits v
              where v.day >= ((select ts from since) at time zone 'Europe/Paris')::date group by 1) x
      ), '[]'::jsonb),
      'visitSources', coalesce((
        select jsonb_agg(jsonb_build_object('key', x.source, 'channel', x.channel, 'count', x.n) order by x.n desc)
        from (select v.source, v.channel, sum(v.visits) as n from public.site_visits v
              where v.day >= ((select ts from since) at time zone 'Europe/Paris')::date
              group by 1, 2 order by 3 desc limit 15) x
      ), '[]'::jsonb),
      'visitCountries', coalesce((
        select jsonb_agg(jsonb_build_object('key', x.country, 'count', x.n) order by x.n desc)
        from (select v.country, sum(v.visits) as n from public.site_visits v
              where v.day >= ((select ts from since) at time zone 'Europe/Paris')::date
              group by 1 order by 2 desc limit 15) x
      ), '[]'::jsonb)
    )
  );
$$;

-- Liste des comptes (recherche par e-mail ou nom, filtre par formule), page par page.
create function public.admin_users(p_search text, p_plan text, p_limit int, p_offset int)
returns table (
  id uuid,
  email text,
  first_name text,
  last_name text,
  locale public.app_locale,
  country text,
  created_at timestamptz,
  last_seen_at timestamptz,
  plan public.plan_tier,
  subscription_status public.subscription_status,
  credits int,
  cvs int,
  spent_cents bigint,
  banned boolean,
  total bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, u.email::text, p.first_name, p.last_name, p.locale, p.signup_country,
         p.created_at, p.last_seen_at, s.plan, s.status,
         coalesce(w.included_balance + w.purchased_balance, 0),
         (select count(*) from public.cvs v where v.user_id = p.id)::int,
         coalesce((select sum(x.amount_cents) from public.purchases x where x.user_id = p.id), 0)
           + coalesce((select sum(i.amount_cents) from public.subscription_invoices i where i.user_id = p.id), 0),
         coalesce(u.banned_until > now(), false),
         count(*) over ()
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.subscriptions s on s.user_id = p.id
  left join public.credit_wallets w on w.user_id = p.id
  where (
      coalesce(p_search, '') = ''
      or u.email ilike '%' || p_search || '%'
      or (coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')) ilike '%' || p_search || '%'
    )
    and (
      coalesce(p_plan, '') = ''
      or (p_plan = 'none' and (s.status is null or s.status not in ('trialing', 'active', 'past_due')))
      or (s.plan::text = p_plan and s.status in ('trialing', 'active', 'past_due'))
    )
  order by p.created_at desc
  limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
$$;

-- Fiche d'un compte : profil, connexion, abonnement, crédits, achats, contenus (titres seulement).
create function public.admin_user_detail(p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p.id,
    'email', u.email,
    'firstName', p.first_name,
    'lastName', p.last_name,
    'phone', p.phone,
    'city', p.city,
    'locale', p.locale,
    'country', p.signup_country,
    'createdAt', p.created_at,
    'lastSeenAt', p.last_seen_at,
    'lastSignInAt', u.last_sign_in_at,
    'bannedUntil', u.banned_until,
    'providers', coalesce((select jsonb_agg(distinct i.provider) from auth.identities i where i.user_id = p.id), '[]'::jsonb),
    'freeGenerationUsedAt', p.free_generation_used_at,
    'trialUsedAt', p.trial_used_at,
    'adsRemovedAt', p.ads_removed_at,
    'retentionWarningSentAt', p.retention_warning_sent_at,
    'stripeCustomer', p.stripe_customer_id is not null,
    'wallet', (select jsonb_build_object('included', w.included_balance, 'purchased', w.purchased_balance)
               from public.credit_wallets w where w.user_id = p.id),
    'subscription', (select jsonb_build_object(
                       'plan', s.plan, 'interval', s.billing_interval, 'status', s.status,
                       'currentPeriodEnd', s.current_period_end, 'cancelAtPeriodEnd', s.cancel_at_period_end,
                       'trialEndsAt', s.trial_ends_at, 'paymentMethod', s.payment_method, 'since', s.created_at)
                     from public.subscriptions s where s.user_id = p.id),
    'payments', coalesce((
      select jsonb_agg(y.x order by y.at desc) from (
        select jsonb_build_object('at', pu.created_at, 'item', pu.product, 'amount', pu.amount_cents,
                                  'method', pu.payment_method) as x, pu.created_at as at
        from public.purchases pu where pu.user_id = p.id
        union all
        select jsonb_build_object('at', i.paid_at, 'item', 'abonnement_' || coalesce(i.plan::text, 'inconnu'),
                                  'amount', i.amount_cents, 'method', i.payment_method), i.paid_at
        from public.subscription_invoices i where i.user_id = p.id
      ) y(x, at)
    ), '[]'::jsonb),
    'ledger', coalesce((
      select jsonb_agg(jsonb_build_object('at', l.created_at, 'bucket', l.bucket, 'delta', l.delta, 'reason', l.reason)
                       order by l.created_at desc)
      from (select * from public.credit_ledger l2 where l2.user_id = p.id order by l2.created_at desc limit 30) l
    ), '[]'::jsonb),
    'cvs', coalesce((
      select jsonb_agg(jsonb_build_object('title', v.title, 'language', v.language, 'createdAt', v.created_at,
                                          'pro', v.pro_unlocked_at is not null) order by v.created_at desc)
      from public.cvs v where v.user_id = p.id
    ), '[]'::jsonb),
    'aiOperations', coalesce((
      select jsonb_agg(jsonb_build_object('at', o.created_at, 'kind', o.kind, 'status', o.status,
                                          'credits', o.credits_charged, 'free', o.was_free,
                                          'costMicros', o.cost_usd_micros, 'error', o.error_code)
                       order by o.created_at desc)
      from (select * from public.ai_operations o2 where o2.user_id = p.id order by o2.created_at desc limit 30) o
    ), '[]'::jsonb)
  )
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.id = p_user_id;
$$;

-- État de la base et des tâches planifiées.
create function public.admin_system()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'databaseBytes', pg_database_size(current_database()),
    'postgresVersion', current_setting('server_version'),
    'tables', coalesce((
      select jsonb_agg(jsonb_build_object('name', c.relname, 'rows', greatest(c.reltuples, 0)::bigint,
                                          'bytes', pg_total_relation_size(c.oid)) order by c.relname)
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
    ), '[]'::jsonb),
    'migration', (select max(m.version) from supabase_migrations.schema_migrations m),
    'cronJobs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', j.jobname, 'schedule', j.schedule, 'active', j.active,
        'lastStatus', r.status, 'lastStart', r.start_time, 'lastEnd', r.end_time,
        'lastMessage', left(r.return_message, 200)
      ) order by j.jobname)
      from cron.job j
      left join lateral (
        select d.status, d.start_time, d.end_time, d.return_message
        from cron.job_run_details d where d.jobid = j.jobid
        order by d.start_time desc limit 1
      ) r on true
    ), '[]'::jsonb),
    'jobRuns', coalesce((
      select jsonb_agg(jsonb_build_object('job', x.job, 'ok', x.ok, 'details', x.details, 'at', x.finished_at))
      from (select distinct on (jr.job) jr.job, jr.ok, jr.details, jr.finished_at
            from public.job_runs jr order by jr.job, jr.finished_at desc) x
    ), '[]'::jsonb),
    'lastStripeEvent', (select max(e.created_at) from public.stripe_events e),
    'aiFailed24h', (select count(*) from public.ai_operations o
                    where o.status = 'failed' and o.created_at >= now() - interval '24 hours'),
    'aiPending', (select count(*) from public.ai_operations o where o.status = 'pending'),
    'aiLast24h', (select count(*) from public.ai_operations o where o.created_at >= now() - interval '24 hours')
  );
$$;

revoke execute on function
  public.record_visit(text, text, text),
  public.admin_daily(int),
  public.admin_summary(int),
  public.admin_users(text, text, int, int),
  public.admin_user_detail(uuid),
  public.admin_system()
from public, anon, authenticated;
grant execute on function
  public.record_visit(text, text, text),
  public.admin_daily(int),
  public.admin_summary(int),
  public.admin_users(text, text, int, int),
  public.admin_user_detail(uuid),
  public.admin_system()
to service_role;

-- Maintenance quotidienne : en plus, visites gardées 25 mois, journaux des tâches 90 jours et
-- journal d'administration un an.
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
