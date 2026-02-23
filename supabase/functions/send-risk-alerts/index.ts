import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── VAPID helpers (shared with send-push-notifications) ──

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
    "pkcs8", keyData,
    { name: "ECDSA", namedCurve: "P-256" },
    false, ["sign"],
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

// ── Risk computation (mirrors frontend computeRisk.ts) ──

type RiskLevel = "low" | "moderate" | "elevated" | "high";

function riskAvg(vals: (number | null | undefined)[]): number | null {
  const v = vals.filter((x): x is number => typeof x === "number");
  return v.length >= 2 ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

function riskTrend(recent: (number | null | undefined)[], older: (number | null | undefined)[]): number | null {
  const r = riskAvg(recent);
  const o = riskAvg(older);
  return (r !== null && o !== null) ? r - o : null;
}

// deno-lint-ignore no-explicit-any
function computeRiskScore(recent: any[], older: any[]): { level: RiskLevel; score: number; factors: string[] } {
  const factors: string[] = [];
  let score = 0;

  const worseHigher = [
    { key: "fatigue", label: "Fatigue", weight: 15 },
    { key: "pain", label: "Pain", weight: 12 },
    { key: "brain_fog", label: "Brain fog", weight: 10 },
    { key: "spasticity", label: "Spasticity", weight: 12 },
    { key: "stress", label: "Stress", weight: 10 },
  ];
  const betterHigher = [
    { key: "mood", label: "Mood", weight: 8 },
    { key: "mobility", label: "Mobility", weight: 10 },
  ];

  for (const { key, label, weight } of worseHigher) {
    const t = riskTrend(recent.map((e) => e[key]), older.map((e) => e[key]));
    if (t !== null && t > 1) {
      score += Math.min(weight, (t / 3) * weight);
      factors.push(`${label} trending up`);
    }
    const ra = riskAvg(recent.map((e) => e[key]));
    if (ra !== null && ra >= 7) {
      score += weight * 0.4;
      factors.push(`${label} consistently high`);
    }
  }
  for (const { key, label, weight } of betterHigher) {
    const t = riskTrend(recent.map((e) => e[key]), older.map((e) => e[key]));
    if (t !== null && t < -1) {
      score += Math.min(weight, (Math.abs(t) / 3) * weight);
      factors.push(`${label} declining`);
    }
  }

  const recentSleep = riskAvg(recent.map((e) => e.sleep_hours));
  const olderSleep = riskAvg(older.map((e) => e.sleep_hours));
  if (recentSleep !== null && recentSleep < 6) {
    score += 8;
    factors.push("Sleep low");
  } else if (recentSleep !== null && olderSleep !== null && recentSleep < olderSleep - 1) {
    score += 5;
    factors.push("Sleep declining");
  }

  const worseningCount = factors.filter((f) => f.includes("trending") || f.includes("declining")).length;
  if (worseningCount >= 3) score += 10;

  score = Math.min(100, Math.round(score));
  const level: RiskLevel = score >= 60 ? "high" : score >= 35 ? "elevated" : score >= 15 ? "moderate" : "low";
  return { level, score, factors: [...new Set(factors)].slice(0, 3) };
}

// ── Handler ──

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

    // Get ALL users (for score persistence) — push alerts only for push-enabled users
    const { data: allUsers, error: usersErr } = await supabase
      .from("profiles")
      .select("user_id, notify_push_enabled");

    if (usersErr) throw usersErr;
    if (!allUsers || allUsers.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No users" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000).toISOString().slice(0, 10);
    const midpoint = new Date(now.getTime() - 6 * 86400000).toISOString().slice(0, 10);

    let sent = 0;
    let skipped = 0;
    let lowRisk = 0;
    const staleEndpoints: string[] = [];

    for (const { user_id, notify_push_enabled } of allUsers) {
      try {
        // Check if we already alerted this user today
        const alertKey = `risk_push_${user_id}_${todayStr}`;

        // Fetch 14 days of entries
        const { data: entries } = await supabase
          .from("daily_entries")
          .select("date, fatigue, pain, brain_fog, mood, mobility, sleep_hours, spasticity, stress")
          .eq("user_id", user_id)
          .gte("date", fourteenDaysAgo)
          .lte("date", todayStr)
          .order("date", { ascending: true });

        if (!entries || entries.length < 4) {
          skipped++;
          continue;
        }

        const recent = entries.filter((e) => e.date > midpoint);
        const older = entries.filter((e) => e.date <= midpoint);

        if (recent.length < 2 || older.length < 2) {
          skipped++;
          continue;
        }

        const risk = computeRiskScore(recent, older);

        // Persist the weekly risk score (upsert by user + week_start)
        const weekEnd = todayStr;
        const weekStart = new Date(now.getTime() - 6 * 86400000).toISOString().slice(0, 10);
        await supabase.from("risk_scores").upsert(
          {
            user_id,
            week_start: weekStart,
            week_end: weekEnd,
            score: risk.score,
            level: risk.level,
            factors: risk.factors,
          },
          { onConflict: "user_id,week_start" }
        );

        if (risk.level !== "high" && risk.level !== "elevated") {
          lowRisk++;
          continue;
        }

        // Skip push notifications if user has them disabled
        if (!notify_push_enabled) {
          continue;
        }

        // Get push subscriptions for this user
        const { data: subs } = await supabase
          .from("push_subscriptions")
          .select("endpoint, p256dh, auth")
          .eq("user_id", user_id);

        if (!subs || subs.length === 0) {
          skipped++;
          continue;
        }

        // Check if we already sent a risk alert notification today for this user
        const { data: recentNotifs } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", user_id)
          .eq("type", "risk_alert")
          .gte("created_at", `${todayStr}T00:00:00Z`)
          .limit(1);

        if (recentNotifs && recentNotifs.length > 0) {
          skipped++;
          continue;
        }

        const isHigh = risk.level === "high";
        const title = isHigh ? "🔴 High relapse risk detected" : "🔶 Elevated relapse risk";
        const body = isHigh
          ? `Score: ${risk.score}/100. ${risk.factors.slice(0, 2).join(", ")}. Consider contacting your neurologist.`
          : `Score: ${risk.score}/100. ${risk.factors.slice(0, 2).join(", ")}. Keep monitoring closely.`;

        const notification = JSON.stringify({
          title,
          body,
          icon: "/pwa-192.png",
          badge: "/pwa-192.png",
          url: "/risk-history",
        });

        // Send to all subscriptions for this user
        for (const sub of subs) {
          try {
            const { ok, status } = await sendPushMessage(sub, notification, vapidPublicKey, vapidPrivateKey);
            if (ok) {
              sent++;
            } else if (status === 410) {
              staleEndpoints.push(sub.endpoint);
            }
          } catch {
            // Individual push failure, continue
          }
        }

        // Record an in-app notification too (throttle = 1/day via the check above)
        await supabase.from("notifications").insert({
          user_id,
          type: "risk_alert",
          title,
          body,
        });

      } catch (e) {
        console.error(`Risk alert error for ${user_id}:`, e);
        skipped++;
      }
    }

    // Clean up stale subscriptions
    if (staleEndpoints.length > 0) {
      await supabase.from("push_subscriptions").delete().in("endpoint", staleEndpoints);
    }

    console.log(`[risk-alerts] sent=${sent}, skipped=${skipped}, lowRisk=${lowRisk}`);

    return new Response(JSON.stringify({ sent, skipped, low_risk: lowRisk }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("send-risk-alerts error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
