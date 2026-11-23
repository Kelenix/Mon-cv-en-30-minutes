-- Inc-7 — Contenus générés conservés avec un CV (H20) et fin commune des opérations IA
-- (docs/data-model.md §3 à §5, US-25 à US-27).

create type public.generation_kind as enum (
  'summary_variants',
  'job_adaptation',
  'linkedin',
  'cover_letter',
  'interview'
);

create table public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  cv_id uuid not null references public.cvs (id) on delete cascade,
  kind public.generation_kind not null,
  language public.app_locale not null,
  input jsonb not null default '{}' check (jsonb_typeof(input) = 'object'),
  output jsonb not null check (
    jsonb_typeof(output) = 'object' and octet_length(output::text) <= 65536
  ),
  operation_id uuid references public.ai_operations (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index generations_cv_created_idx on public.generations (cv_id, created_at desc);
create index generations_user_idx on public.generations (user_id);

create trigger generations_set_updated_at
  before update on public.generations
  for each row execute function public.set_updated_at();

-- Accès : chacun lit ses contenus et corrige leur texte ; création par le serveur après une
-- opération réussie, suppression avec le CV.
alter table public.generations enable row level security;

revoke all on table public.generations from anon, authenticated;
grant select on table public.generations to authenticated;
grant update (output) on table public.generations to authenticated;

create policy generations_select_own on public.generations
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy generations_update_own on public.generations
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Fin réussie d'une opération IA (hors génération de CV) : coûts journalisés et, s'il y en a
-- un, contenu conservé avec le CV, en une seule transaction. Renvoie l'identifiant du contenu.
create function public.complete_ai_operation(
  p_operation_id uuid,
  p_model text,
  p_input_tokens int,
  p_output_tokens int,
  p_cache_read_tokens int,
  p_cost_usd_micros bigint,
  p_duration_ms int,
  p_cv_id uuid default null,
  p_kind public.generation_kind default null,
  p_language public.app_locale default null,
  p_input jsonb default '{}',
  p_output jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_operation public.ai_operations%rowtype;
  v_generation_id uuid;
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

  if p_kind is not null then
    -- Le CV doit appartenir au compte de l'opération.
    perform 1 from public.cvs c where c.id = p_cv_id and c.user_id = v_operation.user_id;
    if not found then
      raise exception 'NOT_FOUND';
    end if;
    insert into public.generations (user_id, cv_id, kind, language, input, output, operation_id)
    values (v_operation.user_id, p_cv_id, p_kind, p_language, p_input, p_output, p_operation_id)
    returning id into v_generation_id;
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

  return v_generation_id;
end;
$$;

revoke execute on function public.complete_ai_operation(
  uuid, text, int, int, int, bigint, int, uuid, public.generation_kind, public.app_locale, jsonb, jsonb
) from public, anon, authenticated;

grant execute on function public.complete_ai_operation(
  uuid, text, int, int, int, bigint, int, uuid, public.generation_kind, public.app_locale, jsonb, jsonb
) to service_role;
