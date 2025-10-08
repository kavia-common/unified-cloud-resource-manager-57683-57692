# Supabase Integration Guide

This project uses Supabase for Auth, Postgres, and Edge Functions. It includes multiple Edge Functions (link-account, recommendations, automation-enforcer, mock-aws/azure/gcp, queue-processor) and a unified, safe frontend client.

## Environment Variables (frontend)
Set via orchestrator (do not commit `.env`):
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_KEY

Note: These must be configured in the react_frontend_dashboard container environment. If they are missing, the frontend will not crash; it will use a safe no-op client and render informative empty states.

## Frontend client (Single Source of Truth, no-throw)
- File: react_frontend_dashboard/src/lib/supabaseClient.ts
- Export: named export getSupabaseClient()
- Usage:
  - import { getSupabaseClient } from '../lib/supabaseClient';
  - const supabase = getSupabaseClient(); // Always returns a client; when env is missing, it returns a guarded no-op client and logs once.

Behavior:
- Never throws if env vars are missing.
- Returns a stable singleton Supabase client when configured.
- Returns a guarded no-op client if not configured (queries resolve to { data: [], error: null }).
- Logs a one-time warning in development for missing envs.

Avoid:
- Multiple client files or mixed import paths. Do not import from src/supabase/client or services/supabaseClient.js. Always use src/lib/supabaseClient.

## Edge Functions
Paths:
- supabase/functions/link-account/index.ts
- supabase/functions/recommendations/index.ts
- supabase/functions/automation-enforcer/index.ts
- supabase/functions/mock-aws|mock-azure|mock-gcp/index.ts
- supabase/functions/queue-processor/index.ts

Auth:
- Functions expect Authorization: Bearer <Supabase JWT>.
- The frontend can get the access token from supabase.auth.getSession() when configured.

Edge Functions Base URL:
- ${REACT_APP_SUPABASE_URL}/functions/v1/<function-name>

## Required Tables (examples)
Ensure you create tables like cloud_accounts, cloud_credentials, activity_log with appropriate RLS policies. Example snippets are available in supabase/schema.sql.

RLS recommendations:
- Users should see only their own cloud_accounts.
- cloud_credentials must be restricted to backend processes only.
- activity_log can be scoped to user or used for admin views, based on requirements.

## Scheduling (cron)
Use Supabase Scheduled Triggers for automation:
- recommendations: every 6 hours
- automation-enforcer: every 10 minutes
- queue-processor: every 2–5 minutes

## CORS and Auth Redirects
- Add your app’s origin (dev and preview) to Supabase project Allowed Origins (CORS).
- When wiring signup flows: use the deployment’s SITE_URL value as the email redirect target.

## Troubleshooting
- Missing envs: The UI should not crash. You will see a single console warning; components render empty states.
- 401 Unauthorized: Ensure the user is signed in and Authorization header is present. Check AuthContext/session wiring.
- 404 Edge Function: Verify deploy with `supabase functions deploy <name>` and the URL format is correct.
- Network/CORS: Verify REACT_APP_SUPABASE_URL and allowed origins.

## Frontend integration touchpoints
- Services use the single client getter: import { getSupabaseClient } from 'src/lib/supabaseClient';
- Recommendations service (src/services/recommendations.ts) queries tables with safe try/catch and emits non-intrusive warnings.
- TopRecommendations component is resilient to double-mount and stale responses; it preserves the last good data and avoids flicker.
