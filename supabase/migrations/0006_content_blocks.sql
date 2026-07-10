alter table public.manifests
  add column if not exists content_blocks jsonb not null default '[]'::jsonb;
