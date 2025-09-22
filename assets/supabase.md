# Supabase Integration Guide — Account Linking Edge Function

This project uses Supabase for Auth, Postgres, and Edge Functions. A dedicated Edge Function `link-account` securely handles cloud account linking for AWS, Azure, and GCP.

## Environment Variables (frontend)
Set via orchestrator (do not commit `.env`):
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_KEY

## Edge Function: link-account
Path: supabase/functions/link-account/index.ts

Purpose:
- Accept credential payloads from the frontend.
- Validate and store minimal metadata in `cloud_accounts`.
- Store sensitive credentials into `cloud_credentials`.
- Emit audit entries to `activity_log`.

Auth:
- Requires Authorization: Bearer <Supabase JWT> (handled by supabase-js on the frontend).
- The function extracts the user id (`sub`) from JWT claims.

Provider payloads:
- AWS: { access_key_id, secret_access_key, account_id }
- Azure: { tenant_id, client_id, client_secret, subscription_id }
- GCP: { service_account_json } // full JSON string

Response:
- 200: { message, account: { id, provider, name, account_id, status, metadata } }
- 4xx/5xx: { error }

## Required Tables (create in Supabase)
Example SQL (adjust as needed and add RLS policies):

```sql
-- cloud_accounts: minimal metadata only
create table if not exists public.cloud_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  provider text not null check (provider in ('AWS','AZURE','GCP')),
  name text not null,
  account_id text not null,
  status text not null default 'connected',
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- cloud_credentials: sensitive payload
create table if not exists public.cloud_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  cloud_account_id uuid references public.cloud_accounts(id) on delete cascade,
  provider text not null check (provider in ('AWS','AZURE','GCP')),
  secret jsonb not null,
  created_at timestamptz not null default now()
);

-- activity_log: audit
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid,
  type text,
  summary text,
  status text,
  created_at timestamptz not null default now()
);
```

RLS:
- Enable RLS and add policies to allow users to see only their own `cloud_accounts` rows.
- Keep `cloud_credentials` fully restricted; only backend processes should access it.

## Deployment
Use the Supabase CLI:
- supabase functions deploy link-account
- supabase functions deploy mock-aws
- supabase functions deploy mock-azure
- supabase functions deploy mock-gcp

Make sure the function has access to:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (recommended) or ANON key for PostgREST writes

Supabase config automatically injects these into the Edge environment when deployed.

## Frontend Usage
lib/linkAccountApi.js exports:

- linkCloudAccount({ provider, name, credentials })

Profile.jsx uses this to send credentials securely. No sensitive data is inserted directly from the client into tables.
