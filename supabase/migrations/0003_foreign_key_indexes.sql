create index if not exists sync_events_user_id_idx on public.sync_events (user_id);
create index if not exists sync_events_workspace_id_idx on public.sync_events (workspace_id);
create index if not exists workspaces_user_id_idx on public.workspaces (user_id);
