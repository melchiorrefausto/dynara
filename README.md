# Dynara

Dynara is a Next.js SaaS app for generating schema-driven adaptive workspaces.

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and add your Supabase keys.

```bash
cp .env.example .env.local
```

## Supabase setup

Apply the SQL in `supabase/migrations/0001_dashboard_persistence.sql` to enable persistent workspaces,
connected app state, connector accounts, and sync events.

## Connector setup

Figma OAuth requires a Figma OAuth app with a redirect URL such as:

```text
http://localhost:3000/api/connectors/figma/callback
```

Add `FIGMA_CLIENT_ID` and `FIGMA_CLIENT_SECRET` to `.env.local` once the OAuth app is created.
The app currently requests `current_user:read`, `file_content:read`, `library_assets:read`, and
`library_content:read`.
