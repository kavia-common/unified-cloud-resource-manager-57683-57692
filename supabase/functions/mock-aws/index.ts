import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  const url = new URL(req.url);

  if (url.pathname === "/inventory") {
    return new Response(JSON.stringify([
      { id: "i-12345", type: "EC2", status: "running", cost: 12.5 },
      { id: "db-001", type: "RDS", status: "stopped", cost: 4.2 }
    ]), { headers: { "Content-Type": "application/json" }});
  }

  if (url.pathname === "/costs") {
    return new Response(JSON.stringify({
      month: "2025-09",
      total: 16.7,
      breakdown: { EC2: 12.5, RDS: 4.2 }
    }), { headers: { "Content-Type": "application/json" }});
  }

  if (url.pathname === "/action/start") {
    const body = await req.json().catch(() => ({}));
    return new Response(JSON.stringify({ message: "Resource started", id: body.id || "i-12345" }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  if (url.pathname === "/action/stop") {
    const body = await req.json().catch(() => ({}));
    return new Response(JSON.stringify({ message: "Resource stopped", id: body.id || "i-12345" }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Not Found", { status: 404 });
});

