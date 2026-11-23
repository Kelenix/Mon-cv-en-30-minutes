-- Inc-2 — Comptes : profils, RLS, déclencheurs (docs/data-model.md §3 à §5).

create type public.app_locale as enum ('fr', 'en', 'it', 'es', 'de');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text check (char_length(first_name) between 1 and 60),
  last_name text check (char_length(last_name) between 1 and 60),
  phone text check (char_length(phone) <= 30),
  city text check (char_length(city) <= 80),
  locale public.app_locale not null default 'en',
  stripe_customer_id text unique,
  free_generation_used_at timestamptz,
  trial_used_at timestamptz,
  ads_removed_at timestamptz,
  interstitial_shown_at timestamptz,
  last_seen_at timestamptz not null default now(),
  retention_warning_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Un profil par compte ; l''e-mail reste dans auth.users.';

-- Rétention des comptes inactifs (US-40).
create index profiles_last_seen_at_idx on public.profiles (last_seen_at);

-- Accès : lecture de son profil ; modification limitée aux colonnes saisies par l'utilisateur.
-- Création par déclencheur, suppression avec le compte (cascade depuis auth.users).
alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (first_name, last_name, phone, city, locale) on table public.profiles to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Mise à jour automatique de `updated_at`.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Création du profil à l'inscription. Le prénom et le nom ne sont pas recopiés : l'utilisateur
-- les confirme à sa première connexion, pré-remplis avec Google (US-04, ADR-022). La langue vient
-- des métadonnées envoyées avec la demande de code.
create function public.handle_new_user()
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
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Dernière activité du compte appelant, écrite au plus une fois par jour (rétention, US-40).
create function public.touch_last_seen()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles
  set last_seen_at = now(), retention_warning_sent_at = null
  where id = (select auth.uid())
    and last_seen_at < now() - interval '1 day';
$$;

revoke execute on function public.touch_last_seen() from public, anon;
grant execute on function public.touch_last_seen() to authenticated;
