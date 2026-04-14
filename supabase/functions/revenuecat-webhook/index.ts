import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const REVENUECAT_WEBHOOK_SECRET = Deno.env.get("REVENUECAT_WEBHOOK_SECRET") ?? "";

serve(async (req) => {
  // Verify authorization
  const authHeader = req.headers.get("Authorization");
  if (REVENUECAT_WEBHOOK_SECRET && authHeader !== REVENUECAT_WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await req.json();
  const event = payload.event;

  if (!event) {
    return new Response("No event", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const appUserId = event.app_user_id;
  const eventType = event.type;
  const expiresAt = event.expiration_at_ms
    ? new Date(event.expiration_at_ms).toISOString()
    : null;

  console.log(`[revenuecat-webhook] event=${eventType} user=${appUserId} expires=${expiresAt}`);

  const premiumEvents = [
    "INITIAL_PURCHASE",
    "RENEWAL",
    "PRODUCT_CHANGE",
    "UNCANCELLATION",
    "SUBSCRIPTION_EXTENDED",
    "TEMPORARY_ENTITLEMENT_GRANT",
  ];

  const revokeEvents = [
    "EXPIRATION",
    "BILLING_ISSUE",
  ];

  if (premiumEvents.includes(eventType)) {
    await supabase
      .from("profiles")
      .update({
        is_premium: true,
        premium_until: expiresAt,
      })
      .eq("user_id", appUserId);
  } else if (revokeEvents.includes(eventType)) {
    await supabase
      .from("profiles")
      .update({
        is_premium: false,
        premium_until: expiresAt,
      })
      .eq("user_id", appUserId);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
