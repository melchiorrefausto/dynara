-- Fix mutable search_path on set_updated_at (security)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Fix RLS init plan: wrap auth.uid() in (select ...) to evaluate once per query, not per row
drop policy if exists "profiles owner access" on public.profiles;
create policy "profiles owner access"
on public.profiles
for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "workspaces owner access" on public.workspaces;
create policy "workspaces owner access"
on public.workspaces
for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "connected apps owner access" on public.connected_apps;
create policy "connected apps owner access"
on public.connected_apps
for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "connector accounts owner access" on public.connector_accounts;
create policy "connector accounts owner access"
on public.connector_accounts
for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "sync events owner access" on public.sync_events;
create policy "sync events owner access"
on public.sync_events
for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
