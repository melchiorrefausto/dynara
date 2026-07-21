-- Diagnostic: checks whether every table/column/index/function introduced by
-- migrations 0001-0008 actually exists in this database. Run in the Supabase
-- SQL Editor and share the output — any row with ok = false means that
-- migration (or part of it) was never applied.
select migration, check_name, ok
from (
  values
    ('0001', 'table public.profiles', (to_regclass('public.profiles') is not null)),
    ('0001', 'table public.workspaces', (to_regclass('public.workspaces') is not null)),
    ('0001', 'table public.connected_apps', (to_regclass('public.connected_apps') is not null)),
    ('0001', 'table public.connector_accounts', (to_regclass('public.connector_accounts') is not null)),
    ('0001', 'table public.sync_events', (to_regclass('public.sync_events') is not null)),
    ('0001', 'function public.set_updated_at', (to_regprocedure('public.set_updated_at()') is not null)),

    ('0002', 'set_updated_at has empty search_path (security fix)', (
      exists (
        select 1 from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = 'set_updated_at'
          and p.proconfig is not null and 'search_path=' = any(p.proconfig)
      )
    )),

    ('0003', 'index sync_events_user_id_idx', (to_regclass('public.sync_events_user_id_idx') is not null)),
    ('0003', 'index sync_events_workspace_id_idx', (to_regclass('public.sync_events_workspace_id_idx') is not null)),
    ('0003', 'index workspaces_user_id_idx', (to_regclass('public.workspaces_user_id_idx') is not null)),

    ('0004', 'table public.manifests', (to_regclass('public.manifests') is not null)),
    ('0004', 'index manifests_user_id_idx', (to_regclass('public.manifests_user_id_idx') is not null)),

    ('0005', 'column manifests.app_id', (exists (select 1 from information_schema.columns where table_schema='public' and table_name='manifests' and column_name='app_id'))),
    ('0005', 'column manifests.version', (exists (select 1 from information_schema.columns where table_schema='public' and table_name='manifests' and column_name='version'))),
    ('0005', 'column manifests.surfaces', (exists (select 1 from information_schema.columns where table_schema='public' and table_name='manifests' and column_name='surfaces'))),
    ('0005', 'column manifests.design_system', (exists (select 1 from information_schema.columns where table_schema='public' and table_name='manifests' and column_name='design_system'))),
    ('0005', 'column manifests.constraints', (exists (select 1 from information_schema.columns where table_schema='public' and table_name='manifests' and column_name='constraints'))),
    ('0005', 'column manifests.profiles', (exists (select 1 from information_schema.columns where table_schema='public' and table_name='manifests' and column_name='profiles'))),
    ('0005', 'index manifests_app_id_idx', (to_regclass('public.manifests_app_id_idx') is not null)),
    ('0005', 'table public.interface_profiles', (to_regclass('public.interface_profiles') is not null)),

    ('0006', 'column manifests.content_blocks', (exists (select 1 from information_schema.columns where table_schema='public' and table_name='manifests' and column_name='content_blocks'))),

    ('0007', 'column manifests.edit_key_hash', (exists (select 1 from information_schema.columns where table_schema='public' and table_name='manifests' and column_name='edit_key_hash'))),

    ('0008', 'table public.content_edit_drafts', (to_regclass('public.content_edit_drafts') is not null)),
    ('0008', 'function public.submit_content_edit_draft', (to_regprocedure('public.submit_content_edit_draft(text,text,text,text,jsonb)') is not null))
) as checks(migration, check_name, ok)
order by migration, check_name;
