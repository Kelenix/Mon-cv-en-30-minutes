-- Inc-10 — Historique des CV (US-31, H22) : un remplacement ne fait jamais grossir l'historique,
-- il reste donc possible au-delà du nombre de CV de la formule (ancien abonné Pro qui garde tous
-- ses CV après une descente de formule, US-31 c.4).

create or replace function public.complete_cv_generation(
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
    -- Remplacement : le nombre de CV ne change pas, quel que soit le plafond.
    delete from public.cvs c where c.id = p_replace_cv_id and c.user_id = v_operation.user_id;
    if not found then
      raise exception 'NOT_FOUND';
    end if;
  elsif p_cv_limit is not null and (
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
