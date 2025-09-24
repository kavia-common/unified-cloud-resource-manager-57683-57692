# Cross-Cloud Resource Manager — React Dashboard

Minimalist Pure White dashboard powered by React and Supabase Auth.
Implements: Auth, cloud onboarding, inventory, costs, lifecycle actions, recommendations, automation, and activity history.

Setup
- Copy .env.example to .env and set:
  - REACT_APP_SUPABASE_URL
  - REACT_APP_SUPABASE_KEY  (public anon key)
- npm install
- npm start

Troubleshooting
- If the preview shows a blank screen or auth fails:
  - Ensure .env variables are set and the app was restarted after changes.
  - Check browser console for [Supabase] Missing configuration warnings.
  - Verify imports of supabaseClient resolve to src/services/supabaseClient.js.

Architecture
- Supabase Auth for authentication (email/password)
- Edge Functions and APIs (backend) accessed over HTTPS when available
- Sidebar + topbar layout with tabbed sections
- Reusable UI components (cards, panels, tables, modals)
- Modular features: Overview, Inventory, Costs, Recommendations, Automation, Activity, Settings, Profile

Security
- Do not commit secrets. Use environment variables and Supabase RLS policies.
