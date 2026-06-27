create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  preferences jsonb not null default '{"autoSaveGenerated": true, "showSuggestions": true, "theme": "light"}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  mode text not null default 'custom',
  schema jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.connected_apps (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  name text not null,
  status text not null default 'available' check (status in ('available', 'connected', 'syncing')),
  last_sync_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists public.connector_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_account_id text,
  access_token_ciphertext text,
  refresh_token_ciphertext text,
  scopes text[] not null default '{}',
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists public.sync_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  workspace_id text references public.workspaces(id) on delete set null,
  status text not null check (status in ('queued', 'running', 'completed', 'failed')),
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

drop trigger if exists connected_apps_set_updated_at on public.connected_apps;
create trigger connected_apps_set_updated_at
before update on public.connected_apps
for each row execute function public.set_updated_at();

drop trigger if exists connector_accounts_set_updated_at on public.connector_accounts;
create trigger connector_accounts_set_updated_at
before update on public.connector_accounts
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.connected_apps enable row level security;
alter table public.connector_accounts enable row level security;
alter table public.sync_events enable row level security;

drop policy if exists "profiles owner access" on public.profiles;
create policy "profiles owner access"
on public.profiles
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "workspaces owner access" on public.workspaces;
create policy "workspaces owner access"
on public.workspaces
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "connected apps owner access" on public.connected_apps;
create policy "connected apps owner access"
on public.connected_apps
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "connector accounts owner access" on public.connector_accounts;
create policy "connector accounts owner access"
on public.connector_accounts
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "sync events owner access" on public.sync_events;
create policy "sync events owner access"
on public.sync_events
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
