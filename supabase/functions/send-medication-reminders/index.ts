import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── VAPID helper ────────────────────────────────────────────────────────────────

function base64UrlDecode(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64.padEnd(b64.length + (4 - (b64.length % 4)) % 4, "=");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

function base64UrlEncode(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function buildVapidJwt(audience: string, privateKeyB64u: string): Promise<string> {
  const header  = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = base64UrlEncode(new TextEncoder().encode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: "mailto:support@livewithms.com",
  })));

  const keyData  = base64UrlDecode(privateKeyB64u);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", keyData,
    { name: "ECDSA", namedCurve: "P-256" },
    false, ["sign"],
  );

  const data = new TextEncoder().encode(`${header}.${payload}`);
  const sig  = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, cryptoKey, data);
  return `${header}.${payload}.${base64UrlEncode(sig)}`;
}

async function sendPushMessage(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
): Promise<{ ok: boolean; status: number }> {
  const url      = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const jwt      = await buildVapidJwt(audience, vapidPrivateKey);

  const res = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: `vapid t=${jwt},k=${vapidPublicKey}`,
      "Content-Type": "application/octet-stream",
      TTL: "86400",
    },
    body: new TextEncoder().encode(payload),
  });

  return { ok: res.ok, status: res.status };
}

// ── Handler ─────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const vapidPublicKey  = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Current UTC hour as "HH:00"
    const now = new Date();
    const currentHour = String(now.getUTCHours()).padStart(2, "0");
    const matchTime = `${currentHour}:00`;

    // Find all active medications with a reminder_time matching this hour
    const { data: meds, error: medsError } = await supabase
      .from("medications")
      .select("id, name, dosage, user_id, reminder_time")
      .eq("active", true)
      .eq("reminder_time", matchTime);

    if (medsError) throw medsError;
    if (!meds || meds.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No medication reminders due this hour" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group medications by user_id
    const medsByUser = new Map<string, typeof meds>();
    for (const med of meds) {
      const existing = medsByUser.get(med.user_id) || [];
      existing.push(med);
      medsByUser.set(med.user_id, existing);
    }

    // Get today's date for checking if already logged
    const todayStr = now.toISOString().split("T")[0];

    let sent = 0, failed = 0;
    const staleEndpoints: string[] = [];

    for (const [userId, userMeds] of medsByUser) {
      // Check which meds haven't been logged today
      const medIds = userMeds.map((m) => m.id);
      const { data: logs } = await supabase
        .from("medication_logs")
        .select("medication_id")
        .eq("user_id", userId)
        .eq("date", todayStr)
        .in("medication_id", medIds);

      const loggedIds = new Set((logs || []).map((l) => l.medication_id));
      const unloggedMeds = userMeds.filter((m) => !loggedIds.has(m.id));

      if (unloggedMeds.length === 0) continue;

      // Get user's push subscriptions
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", userId);

      if (!subs || subs.length === 0) continue;

      // Build notification message
      const medNames = unloggedMeds.map((m) => m.name).join(", ");
      const body = unloggedMeds.length === 1
        ? `Time to take ${medNames}${unloggedMeds[0].dosage ? ` (${unloggedMeds[0].dosage})` : ""}`
        : `Time to take: ${medNames}`;

      const notification = JSON.stringify({
        title: "💊 Medication Reminder",
        body,
        icon: "/pwa-192.png",
        badge: "/pwa-192.png",
        url: "/today",
      });

      // Send to all user's subscriptions
      await Promise.all(subs.map(async (sub) => {
        try {
          const { ok, status } = await sendPushMessage(sub, notification, vapidPublicKey, vapidPrivateKey);
          if (ok) {
            sent++;
          } else {
            failed++;
            if (status === 410) staleEndpoints.push(sub.endpoint);
          }
        } catch {
          failed++;
        }
      }));
    }

    // Clean up stale endpoints
    if (staleEndpoints.length > 0) {
      await supabase.from("push_subscriptions")
        .delete()
        .in("endpoint", staleEndpoints);
    }

    return new Response(JSON.stringify({ sent, failed, hour: matchTime, medsChecked: meds.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
