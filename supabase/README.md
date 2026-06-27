# Supabase

Apply migrations in the Supabase SQL editor or with the Supabase CLI.

```bash
supabase db push
```

The first migration creates:

- `profiles`
- `workspaces`
- `connected_apps`
- `connector_accounts`
- `sync_events`

All tables have row-level security enabled and are scoped to `auth.uid()`.
