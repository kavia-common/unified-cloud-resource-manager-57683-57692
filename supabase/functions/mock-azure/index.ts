//
// Placeholder Edge Function for Mock Azure
// This file is intentionally minimal and ready for future implementation.
//
// Notes:
// - This function will simulate Azure operations for local development/testing.
// - Replace with actual logic or HTTP handlers as needed.
// - Ensure Supabase CLI is configured when deploying Edge Functions.
//
// PUBLIC_INTERFACE
export default function handler() {
  /** Placeholder export for mock Azure Edge Function. */
  return new Response(JSON.stringify({ provider: "azure", status: "ok", message: "mock-azure placeholder" }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}
