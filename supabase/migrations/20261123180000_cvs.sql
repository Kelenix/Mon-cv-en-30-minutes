-- Inc-4 — CV générés par l'IA : table, accès, et fonctions qui encadrent une génération
-- (docs/data-model.md §3 à §5, docs/system-design.md §6.1, US-10 à US-15).

create table public.cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- Génération qui a produit le CV : un rejeu de la même demande retrouve le même CV.
  operation_id uuid unique references public.ai_operations (id) on delete set null,
  title text not null check (char_length(title) between 1 and 120),
  language public.app_locale not null,
  answers jsonb not null check (jsonb_typeof(answers) = 'object'),
  content jsonb not null check (
    jsonb_typeof(content) = 'object' and octet_length(content::text) <= 65536
  ),
  pro_unlocked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cvs_user_updated_idx on public.cvs (user_id, updated_at desc, id desc);

create trigger cvs_set_updated_at
  before update on public.cvs
  for each row execute function public.set_updated_at();

-- Accès : chacun lit, corrige (titre et contenu seulement) et supprime ses propres CV. La création
-- passe par le serveur après une génération réussie (pas de CV sans génération).
alter table public.cvs enable row level security;

revoke all on table public.cvs from anon, authenticated;
grant select, delete on table public.cvs to authenticated;
grant update (title, content) on table public.cvs to authenticated;

create policy cvs_select_own on public.cvs
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy cvs_update_own on public.cvs
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy cvs_delete_own on public.cvs
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Début d'une opération IA, sous verrou du portefeuille (les opérations d'un compte passent une
-- à une) : rejeu, limite par minute, gratuité de la première génération (plafond par adresse IP,
-- H27), puis débit. Une erreur annule tout : aucune opération ni aucun débit ne reste.
create function public.begin_ai_operation(
  p_user_id uuid,
  p_request_id uuid,
  p_kind public.ai_operation_kind,
  p_cost int,
  p_allow_included boolean,
  p_try_free boolean,
  p_rate_limit int,
  p_free_ip_limit int,
  -- Adresse IP hachée (null : inconnue, plafond par IP non appliqué).
  p_ip_hash text default null
)
returns table (
  operation_id uuid,
  status public.ai_operation_status,
  was_free boolean,
  created boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_operation public.ai_operations%rowtype;
  v_free boolean := false;
begin
  perform 1 from public.credit_wallets w where w.user_id = p_user_id for update;
  if not found then
    raise exception 'WALLET_NOT_FOUND';
  end if;

  -- Même demande (double clic, rejeu) : l'opération existante, sans nouveau débit.
  select * into v_operation
  from public.ai_operations o
  where o.user_id = p_user_id and o.request_id = p_request_id;
  if found then
    return query select v_operation.id, v_operation.status, v_operation.was_free, false;
    return;
  end if;

  if (
    select count(*) from public.ai_operations o
    where o.user_id = p_user_id and o.created_at > now() - interval '1 minute'
  ) >= p_rate_limit then
    raise exception 'RATE_LIMITED';
  end if;

  if p_try_free and exists (
    select 1 from public.profiles p
    where p.id = p_user_id and p.free_generation_used_at is null
  ) then
    -- Une génération gratuite déjà en cours : on attend son issue plutôt que de débiter.
    if exists (
      select 1 from public.ai_operations o
      where o.user_id = p_user_id and o.was_free and o.status = 'pending'
        and o.created_at > now() - interval '5 minutes'
    ) then
      raise exception 'RATE_LIMITED';
    end if;
    if p_ip_hash is not null and (
      select count(*) from public.ai_operations o
      where o.ip_hash = p_ip_hash and o.was_free and o.status <> 'failed'
        and o.created_at > now() - interval '1 day'
    ) >= p_free_ip_limit then
      raise exception 'FREE_LIMIT_REACHED';
    end if;
    v_free := true;
  end if;

  insert into public.ai_operations (user_id, request_id, kind, was_free, ip_hash)
  values (p_user_id, p_request_id, p_kind, v_free, p_ip_hash)
  returning * into v_operation;

  if not v_free then
    perform public.spend_credits(p_user_id, v_operation.id, p_cost, p_allow_included);
  end if;

  return query select v_operation.id, v_operation.status, v_operation.was_free, true;
end;
$$;

-- Fin réussie d'une génération de CV : enregistre le CV (en remplaçant celui choisi, H22),
-- consomme la gratuité et journalise les coûts, en une seule transaction.
create function public.complete_cv_generation(
  p_operation_id uuid,
  p_title text,
  p_language public.app_locale,
  p_answers jsonb,
  p_content jsonb,
  p_model text,
  p_input_tokens int,
  p_output_tokens int,
  p_cache_read_tokens int,
  p_cost_usd_micros bigint,
  p_duration_ms int,
  -- CV à remplacer (H22) et nombre de CV conservés par la formule (null : illimité).
  p_replace_cv_id uuid default null,
  p_cv_limit int default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_operation public.ai_operations%rowtype;
  v_cv_id uuid;
begin
  select * into v_operation
  from public.ai_operations o
  where o.id = p_operation_id
  for update;
  if not found then
    raise exception 'OPERATION_NOT_FOUND';
  end if;
  if v_operation.status <> 'pending' then
    raise exception 'OPERATION_NOT_PENDING';
  end if;

  perform 1 from public.credit_wallets w where w.user_id = v_operation.user_id for update;

  if p_replace_cv_id is not null then
    delete from public.cvs c where c.id = p_replace_cv_id and c.user_id = v_operation.user_id;
    if not found then
      raise exception 'NOT_FOUND';
    end if;
  end if;

  if p_cv_limit is not null and (
    select count(*) from public.cvs c where c.user_id = v_operation.user_id
  ) >= p_cv_limit then
    raise exception 'CV_LIMIT_REACHED';
  end if;

  insert into public.cvs (user_id, operation_id, title, language, answers, content)
  values (v_operation.user_id, p_operation_id, p_title, p_language, p_answers, p_content)
  returning id into v_cv_id;

  if v_operation.was_free then
    update public.profiles p
    set free_generation_used_at = now()
    where p.id = v_operation.user_id and p.free_generation_used_at is null;
  end if;

  update public.ai_operations o
  set status = 'succeeded',
      model = p_model,
      input_tokens = p_input_tokens,
      output_tokens = p_output_tokens,
      cache_read_tokens = p_cache_read_tokens,
      cost_usd_micros = p_cost_usd_micros,
      duration_ms = p_duration_ms,
      finished_at = now()
  where o.id = p_operation_id;

  return v_cv_id;
end;
$$;

-- Échec d'une opération IA : crédits rendus (une seule fois) et cause journalisée. Renvoie le
-- nombre de crédits rendus.
create function public.fail_ai_operation(
  p_operation_id uuid,
  p_error_code text,
  p_model text default null,
  p_input_tokens int default null,
  p_output_tokens int default null,
  p_cache_read_tokens int default null,
  p_cost_usd_micros bigint default null,
  p_duration_ms int default null
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.ai_operation_status;
  v_refunded int;
begin
  select o.status into v_status
  from public.ai_operations o
  where o.id = p_operation_id
  for update;
  if not found then
    raise exception 'OPERATION_NOT_FOUND';
  end if;
  if v_status <> 'pending' then
    return 0;
  end if;

  v_refunded := public.refund_operation(p_operation_id);

  update public.ai_operations o
  set status = 'failed',
      error_code = p_error_code,
      model = p_model,
      input_tokens = p_input_tokens,
      output_tokens = p_output_tokens,
      cache_read_tokens = p_cache_read_tokens,
      cost_usd_micros = p_cost_usd_micros,
      duration_ms = p_duration_ms,
      finished_at = now()
  where o.id = p_operation_id;

  return v_refunded;
end;
$$;

revoke execute on function
  public.begin_ai_operation(uuid, uuid, public.ai_operation_kind, int, boolean, boolean, int, int, text),
  public.complete_cv_generation(uuid, text, public.app_locale, jsonb, jsonb, text, int, int, int, bigint, int, uuid, int),
  public.fail_ai_operation(uuid, text, text, int, int, int, bigint, int)
from public, anon, authenticated;

grant execute on function
  public.begin_ai_operation(uuid, uuid, public.ai_operation_kind, int, boolean, boolean, int, int, text),
  public.complete_cv_generation(uuid, text, public.app_locale, jsonb, jsonb, text, int, int, int, bigint, int, uuid, int),
  public.fail_ai_operation(uuid, text, text, int, int, int, bigint, int)
to service_role;
