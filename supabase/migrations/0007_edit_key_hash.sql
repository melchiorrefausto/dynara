alter table public.manifests
  add column if not exists edit_key_hash text;
