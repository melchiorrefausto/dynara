alter table public.manifests
  add column if not exists app_id text,
  add column if not exists version text not null default '1.0.0',
  add column if not exists surfaces jsonb not null default '[]'::jsonb,
  add column if not exists design_system jsonb not null default '{"source":"manual","version":"1.0.0","tokens":[],"componentRefs":[]}'::jsonb,
  add column if not exists constraints jsonb not null default '[]'::jsonb,
  add column if not exists profiles jsonb not null default '[]'::jsonb;

update public.manifests
set app_id = coalesce(app_id, slug)
where app_id is null;

alter table public.manifests
  alter column app_id set not null;

create index if not exists manifests_app_id_idx on public.manifests (app_id);

create table if not exists public.interface_profiles (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  manifest_id text not null references public.manifests(id) on delete cascade,
  name text not null,
  profile jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, manifest_id, name)
);

drop trigger if exists interface_profiles_set_updated_at on public.interface_profiles;
create trigger interface_profiles_set_updated_at
before update on public.interface_profiles
for each row execute function public.set_updated_at();

alter table public.interface_profiles enable row level security;

create index if not exists interface_profiles_user_manifest_idx on public.interface_profiles (user_id, manifest_id);

drop policy if exists "interface profiles owner access" on public.interface_profiles;
create policy "interface profiles owner access"
on public.interface_profiles
for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
