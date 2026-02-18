import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifyToken(userId: string, token: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  // Decode URL-safe base64 token back to bytes
  const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const sigBytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
  return crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(userId));
}

function htmlPage(success: boolean, message: string): Response {
  const icon = success ? "✅" : "❌";
  const color = success ? "#16a34a" : "#dc2626";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${success ? "Unsubscribed" : "Error"} · LiveWithMS</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #faf9f7;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .card {
      background: #fff;
      border-radius: 1rem;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      padding: 2.5rem 2rem;
      max-width: 420px;
      width: 100%;
      text-align: center;
    }
    .icon { font-size: 3rem; margin-bottom: 1rem; }
    h1 { font-size: 1.4rem; font-weight: 700; color: #1a1a1a; margin-bottom: 0.5rem; }
    p { font-size: 0.95rem; color: #666; line-height: 1.6; margin-bottom: 1.5rem; }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      background: ${color}18;
      color: ${color};
      margin-bottom: 1.5rem;
    }
    a.btn {
      display: inline-block;
      background: #E8751A;
      color: #fff;
      text-decoration: none;
      padding: 0.65rem 1.5rem;
      border-radius: 0.6rem;
      font-size: 0.9rem;
      font-weight: 600;
    }
    .footer { margin-top: 1.5rem; font-size: 0.75rem; color: #aaa; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <div class="badge">Weekly Email Digest</div>
    <h1>${success ? "You've been unsubscribed" : "Invalid link"}</h1>
    <p>${message}</p>
    <a class="btn" href="https://ec19680f-c56d-4490-a8e2-513706eacd00.lovableproject.com/profile">
      Open LiveWithMS
    </a>
    <p class="footer">LiveWithMS · Not medical advice</p>
  </div>
</body>
</html>`;
  return new Response(html, {
    status: success ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const uid = url.searchParams.get("uid");
    const token = url.searchParams.get("token");

    if (!uid || !token) {
      return htmlPage(false, "This unsubscribe link is missing required parameters. Please use the link from your email.");
    }

    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const valid = await verifyToken(uid, token, secret);

    if (!valid) {
      return htmlPage(false, "This unsubscribe link is invalid or has been tampered with. Please use the original link from your email.");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      secret
    );

    const { error } = await supabase
      .from("profiles")
      .update({ weekly_digest_enabled: false })
      .eq("user_id", uid);

    if (error) throw error;

    return htmlPage(true, "You won't receive the weekly symptom digest anymore. You can re-enable it anytime from your Profile settings in the app.");
  } catch (e) {
    console.error("unsubscribe error:", e);
    return htmlPage(false, "Something went wrong. Please try again or disable the digest from your Profile settings in the app.");
  }
});
