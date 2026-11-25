-- Inc-15 — Photo facultative d'un CV (ADR-050, US-45) : une par CV, en JPEG recadré dans le
-- navigateur (au plus 300 Ko), lisible et modifiable par son seul propriétaire, supprimée avec
-- le CV (et donc avec le compte).

create table public.cv_photos (
  cv_id uuid primary key references public.cvs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  image bytea not null check (octet_length(image) between 1 and 307200),
  updated_at timestamptz not null default now()
);

create trigger cv_photos_set_updated_at
  before update on public.cv_photos
  for each row execute function public.set_updated_at();

alter table public.cv_photos enable row level security;

revoke all on table public.cv_photos from anon, authenticated;
grant select, insert, update, delete on table public.cv_photos to authenticated;

-- Le propriétaire de la photo est celui du CV : impossible d'en poser une sur le CV d'un autre.
create policy cv_photos_select_own on public.cv_photos
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy cv_photos_insert_own on public.cv_photos
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.cvs
      where cvs.id = cv_id and cvs.user_id = (select auth.uid())
    )
  );

create policy cv_photos_update_own on public.cv_photos
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy cv_photos_delete_own on public.cv_photos
  for delete to authenticated
  using ((select auth.uid()) = user_id);
