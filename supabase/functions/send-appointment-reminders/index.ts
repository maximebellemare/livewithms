import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── VAPID helpers (reused from medication reminders) ────────────────────────

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
  const header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = base64UrlEncode(new TextEncoder().encode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: "mailto:valmontmarketing@gmail.com",
  })));
  const keyData = base64UrlDecode(privateKeyB64u);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", keyData, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"],
  );
  const data = new TextEncoder().encode(`${header}.${payload}`);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, cryptoKey, data);
  return `${header}.${payload}.${base64UrlEncode(sig)}`;
}

async function sendPushMessage(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
): Promise<{ ok: boolean; status: number }> {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const jwt = await buildVapidJwt(audience, vapidPrivateKey);
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

// ── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
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

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();

    // Tomorrow's date string
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    let sent = 0, failed = 0;
    const staleEndpoints: string[] = [];

    // ── 1-day-before reminders ──────────────────────────────────────────────
    // Check for appointments tomorrow with reminder = '1d' or 'both', not yet sent
    const { data: dayAppts } = await supabase
      .from("appointments")
      .select("id, title, type, date, time, user_id")
      .eq("date", tomorrowStr)
      .eq("reminder_day_sent", false)
      .or("reminder.eq.1d,reminder.eq.both");

    if (dayAppts && dayAppts.length > 0) {
      for (const appt of dayAppts) {
        const { data: subs } = await supabase
          .from("push_subscriptions")
          .select("endpoint, p256dh, auth")
          .eq("user_id", appt.user_id);

        if (subs && subs.length > 0) {
          const timeStr = appt.time ? ` at ${formatTime12(appt.time)}` : "";
          const notification = JSON.stringify({
            title: "📅 Appointment Tomorrow",
            body: `${appt.title}${timeStr}`,
            icon: "/pwa-192.png",
            badge: "/pwa-192.png",
            url: "/appointments",
          });

          for (const sub of subs) {
            try {
              const { ok, status } = await sendPushMessage(sub, notification, vapidPublicKey, vapidPrivateKey);
              if (ok) sent++; else { failed++; if (status === 410) staleEndpoints.push(sub.endpoint); }
            } catch { failed++; }
          }
        }

        // Mark as sent
        await supabase.from("appointments").update({ reminder_day_sent: true }).eq("id", appt.id);
      }
    }

    // ── 1-hour-before reminders ─────────────────────────────────────────────
    // Check for appointments today with a time within the next hour, not yet sent
    const { data: hourAppts } = await supabase
      .from("appointments")
      .select("id, title, type, date, time, user_id")
      .eq("date", todayStr)
      .eq("reminder_hour_sent", false)
      .not("time", "is", null)
      .or("reminder.eq.1h,reminder.eq.both");

    if (hourAppts && hourAppts.length > 0) {
      for (const appt of hourAppts) {
        if (!appt.time) continue;
        const [apptH, apptM] = appt.time.split(":").map(Number);
        // Check if appointment is roughly 1 hour from now (within 30-90 min window)
        const apptMinutes = apptH * 60 + apptM;
        const nowMinutes = currentHour * 60 + currentMinute;
        const diff = apptMinutes - nowMinutes;

        if (diff >= 30 && diff <= 90) {
          const { data: subs } = await supabase
            .from("push_subscriptions")
            .select("endpoint, p256dh, auth")
            .eq("user_id", appt.user_id);

          if (subs && subs.length > 0) {
            const notification = JSON.stringify({
              title: "⏰ Appointment in ~1 hour",
              body: `${appt.title} at ${formatTime12(appt.time)}`,
              icon: "/pwa-192.png",
              badge: "/pwa-192.png",
              url: "/appointments",
            });

            for (const sub of subs) {
              try {
                const { ok, status } = await sendPushMessage(sub, notification, vapidPublicKey, vapidPrivateKey);
                if (ok) sent++; else { failed++; if (status === 410) staleEndpoints.push(sub.endpoint); }
              } catch { failed++; }
            }
          }

          await supabase.from("appointments").update({ reminder_hour_sent: true }).eq("id", appt.id);
        }
      }
    }

    // Clean up stale endpoints
    if (staleEndpoints.length > 0) {
      await supabase.from("push_subscriptions").delete().in("endpoint", staleEndpoints);
    }

    return new Response(JSON.stringify({ sent, failed, dayChecked: dayAppts?.length ?? 0, hourChecked: hourAppts?.length ?? 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function formatTime12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}
