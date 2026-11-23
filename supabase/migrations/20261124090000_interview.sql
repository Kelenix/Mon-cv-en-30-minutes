-- Inc-9 — Simulation d'entretien (US-30, docs/data-model.md §5) : retour gratuit sur les
-- réponses, conservé avec la simulation ; seuls la version LinkedIn et la lettre se corrigent.

-- Début d'une opération IA : inchangé, sauf qu'une opération sans coût (retour d'entretien)
-- est journalisée et limitée comme les autres, sans débit.
create or replace function public.begin_ai_operation(
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
  if p_cost < 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

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

  if not v_free and p_cost > 0 then
    perform public.spend_credits(p_user_id, v_operation.id, p_cost, p_allow_included);
  end if;

  return query select v_operation.id, v_operation.status, v_operation.was_free, true;
end;
$$;

-- Fin réussie d'un retour d'entretien : réponses et retour enregistrés avec la simulation, coûts
-- journalisés, en une seule transaction. Un seul retour par simulation : les réponses ne sont
-- écrites que par le serveur (colonne `input`, non modifiable par l'utilisateur).
create function public.complete_interview_feedback(
  p_operation_id uuid,
  p_model text,
  p_input_tokens int,
  p_output_tokens int,
  p_cache_read_tokens int,
  p_cost_usd_micros bigint,
  p_duration_ms int,
  p_generation_id uuid,
  p_answers jsonb,
  p_feedback jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_operation public.ai_operations%rowtype;
  v_input jsonb;
begin
  if jsonb_typeof(p_answers) <> 'array' or jsonb_typeof(p_feedback) <> 'array' then
    raise exception 'INVALID_INPUT';
  end if;

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

  select g.input into v_input
  from public.generations g
  where g.id = p_generation_id
    and g.user_id = v_operation.user_id
    and g.kind = 'interview'
  for update;
  if not found then
    raise exception 'NOT_FOUND';
  end if;
  if v_input ? 'answers' then
    raise exception 'CONFLICT';
  end if;

  update public.generations g
  set input = g.input || jsonb_build_object('answers', p_answers),
      output = g.output || jsonb_build_object('feedback', p_feedback)
  where g.id = p_generation_id;

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
end;
$$;

revoke execute on function public.complete_interview_feedback(
  uuid, text, int, int, int, bigint, int, uuid, jsonb, jsonb
) from public, anon, authenticated;

grant execute on function public.complete_interview_feedback(
  uuid, text, int, int, int, bigint, int, uuid, jsonb, jsonb
) to service_role;

-- Correction directe limitée aux textes faits pour être modifiés (H21) : l'adaptation, les
-- accroches et les simulations restent telles que produites (le serveur les relit).
drop policy generations_update_own on public.generations;

create policy generations_update_own on public.generations
  for update to authenticated
  using ((select auth.uid()) = user_id and kind in ('linkedin', 'cover_letter'))
  with check ((select auth.uid()) = user_id and kind in ('linkedin', 'cover_letter'));
