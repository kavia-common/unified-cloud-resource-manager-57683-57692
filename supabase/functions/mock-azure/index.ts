import { serve } from "https://deno.land/std/http/server.ts";

/**
 * Mock Azure Edge Function
 * - GET /inventory -> returns VMs + Storage accounts with daily cost and status
 * - GET /costs -> returns month total and breakdown by service
 * - POST /action/start or /action/stop -> echoes a message (placeholder)
 */
serve(async (req) => {
  const url = new URL(req.url);

  if (url.pathname === "/inventory") {
    // Two VM entries + two Storage entries with daily cost estimates
    const data = [
      { id: "vm-az-001", type: "VM", status: "running", cost: 9.3 },
      { id: "vm-az-002", type: "VM", status: "stopped", cost: 0.0 },
      { id: "st-acc-01", type: "Storage", status: "active", cost: 1.8 },
      { id: "st-acc-02", type: "Storage", status: "active", cost: 2.4 },
    ];
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (url.pathname === "/costs") {
    const payload = {
      month: "2025-09",
      total: 13.5,
      breakdown: { VM: 9.3, Storage: 4.2 },
    };
    return new Response(JSON.stringify(payload), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (url.pathname === "/action/start") {
    const body = await req.json().catch(() => ({}));
    return new Response(
      JSON.stringify({ message: "Azure resource started", id: body.id || "vm-az-001" }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  if (url.pathname === "/action/stop") {
    const body = await req.json().catch(() => ({}));
    return new Response(
      JSON.stringify({ message: "Azure resource stopped", id: body.id || "vm-az-001" }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  if (url.pathname === "/action/scale") {
    const body = await req.json().catch(() => ({}));
    return new Response(
      JSON.stringify({
        message: "Azure resource scaled",
        id: body.id || "vm-az-001",
        size: body.size || "medium",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response("Not Found", { status: 404 });
});
