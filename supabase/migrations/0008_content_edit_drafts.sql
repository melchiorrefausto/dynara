create table if not exists public.content_edit_drafts (
  id uuid primary key default gen_random_uuid(),
  manifest_id text not null references public.manifests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  app_id text not null,
  page_url text not null,
  page_path text not null,
  blocks jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists content_edit_drafts_user_status_idx
  on public.content_edit_drafts (user_id, status, submitted_at desc);

alter table public.content_edit_drafts enable row level security;

drop policy if exists "content edit drafts owner read" on public.content_edit_drafts;
create policy "content edit drafts owner read"
on public.content_edit_drafts
for select
using ((select auth.uid()) = user_id);

drop policy if exists "content edit drafts owner update" on public.content_edit_drafts;
create policy "content edit drafts owner update"
on public.content_edit_drafts
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "content edit drafts owner delete" on public.content_edit_drafts;
create policy "content edit drafts owner delete"
on public.content_edit_drafts
for delete
using ((select auth.uid()) = user_id);

create or replace function public.submit_content_edit_draft(
  p_app_id text,
  p_edit_password text,
  p_page_url text,
  p_page_path text,
  p_blocks jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_manifest public.manifests%rowtype;
  draft_id uuid;
begin
  if coalesce(trim(p_app_id), '') = '' then
    raise exception 'Missing app id';
  end if;

  if coalesce(trim(p_edit_password), '') = '' then
    raise exception 'Missing edit password';
  end if;

  if jsonb_typeof(p_blocks) <> 'array' or jsonb_array_length(p_blocks) = 0 then
    raise exception 'No content blocks submitted';
  end if;

  select *
    into target_manifest
    from public.manifests
   where (app_id = p_app_id or slug = p_app_id or name = p_app_id)
     and edit_key_hash = encode(digest(p_edit_password, 'sha256'), 'hex')
   order by updated_at desc
   limit 1;

  if target_manifest.id is null then
    raise exception 'Invalid edit password';
  end if;

  insert into public.content_edit_drafts (
    manifest_id,
    user_id,
    app_id,
    page_url,
    page_path,
    blocks
  )
  values (
    target_manifest.id,
    target_manifest.user_id,
    coalesce(target_manifest.app_id, target_manifest.slug, target_manifest.name),
    left(p_page_url, 2048),
    left(p_page_path, 512),
    p_blocks
  )
  returning id into draft_id;

  return draft_id;
end;
$$;

grant execute on function public.submit_content_edit_draft(text, text, text, text, jsonb) to anon, authenticated;
