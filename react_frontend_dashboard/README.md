# Cross-Cloud Resource Manager — React Dashboard

Minimalist Pure White dashboard powered by React and Supabase Auth.
Implements: Auth, cloud onboarding, inventory, costs, lifecycle actions, recommendations, automation, and activity history.

Setup
- Copy .env.example to .env and set:
  - REACT_APP_SUPABASE_URL
  - REACT_APP_SUPABASE_KEY  (public anon key)
- Install dependencies:
  - npm ci (preferred in CI) or npm install
- Start the development server:
  - npm run start:dev (pins port 3000) or npm start
    - This runs: react-scripts start (as defined in package.json "scripts.start")

Troubleshooting
- If the preview shows a blank screen or 404 for /static/js/bundle.js:
  - Ensure the dev server is running on the same port your preview proxy expects (commonly 3000).
  - If CRA prompts that port 3000 is in use and switches ports, your preview may still target 3000 and fail to load assets.
  - Fix: stop other services on 3000 or run `npm run start:dev` to force CRA to port 3000. Alternatively, update the preview to the new port.
- If the preview shows a blank screen or auth fails:
  - Ensure .env variables are set and the app was restarted after changes.
  - Check browser console for [Supabase] Missing configuration warnings.
  - Verify imports of supabaseClient resolve to src/services/supabaseClient.js.
- If npm start reports “Missing script 'start'”:
  - Ensure package.json contains:
    {
      "scripts": {
        "start": "react-scripts start"
      }
    }
  - Reinstall dependencies: rm -rf node_modules && npm ci

Architecture
- Supabase Auth for authentication (email/password)
- Edge Functions and APIs (backend) accessed over HTTPS when available
- Sidebar + topbar layout with tabbed sections
- Reusable UI components (cards, panels, tables, modals)
- Modular features: Overview, Inventory, Costs, Recommendations, Automation, Activity, Settings, Profile

Security
- Do not commit secrets. Use environment variables and Supabase RLS policies.
