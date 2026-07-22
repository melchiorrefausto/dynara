alter table public.manifests
  add column if not exists logo_url text,
  add column if not exists widget_enabled boolean not null default false,
  add column if not exists widget_position text not null default 'bottom-right'
    check (widget_position in ('bottom-right', 'bottom-left'));
