# Cross-Cloud Resource Manager — React Dashboard

This frontend provides a minimalist "Pure White" dashboard for managing resources across AWS and Azure (with room for GCP). It uses Supabase for authentication and can call Edge Functions when configured.

Key features:
- Supabase authentication (email/password)
- Connect cloud accounts (AWS/Azure)
- Inventory with resource operations (start/stop/scale)
- Costs analytics and breakdown
- AI/ML recommendations
- Rule-based automation
- Activity tracking

Environment variables (set via orchestrator, do not commit .env):
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_KEY

Directory overview:
- src/lib/supabaseClient.js — Supabase client (PUBLIC_INTERFACE)
- src/context/AuthContext.jsx — Auth provider (PUBLIC_INTERFACE)
- src/components/ui/* — Reusable minimalist UI components
- src/features/auth/* — AuthGate + Login
- src/features/* — App features (overview, inventory, costs, recommendations, automation, activity, settings, profile)
- src/theme.css — Pure White theme and layout styles
- src/App.js — Auth-enabled layout composition and routing

Notes:
- SignUp emailRedirectTo uses window.location.origin.
- Integrate your Edge Functions at /functions/v1/* (backend) for live data.
- UI is responsive, with cards, tables, modals, and charts (Recharts).
