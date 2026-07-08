create table if not exists public.manifests (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  name text not null,
  color text not null default '#7c3aed',
  panels jsonb not null default '[]'::jsonb,
  views jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);

drop trigger if exists manifests_set_updated_at on public.manifests;
create trigger manifests_set_updated_at
before update on public.manifests
for each row execute function public.set_updated_at();

alter table public.manifests enable row level security;

create index if not exists manifests_user_id_idx on public.manifests (user_id);

drop policy if exists "manifests owner access" on public.manifests;
create policy "manifests owner access"
on public.manifests
for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
