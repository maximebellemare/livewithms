import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const KLAVIYO_BASE = "https://a.klaviyo.com/api";
const KLAVIYO_REVISION = "2024-10-15";

async function klaviyoPost(path: string, body: unknown, apiKey: string, allow409 = false) {
  const res = await fetch(`${KLAVIYO_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Klaviyo-API-Key ${apiKey}`,
      "Content-Type": "application/json",
      revision: KLAVIYO_REVISION,
      accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok && !(allow409 && res.status === 409)) {
    throw new Error(`Klaviyo ${path} [${res.status}]: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth ────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;

    // ── Secrets ──────────────────────────────────────────────
    const KLAVIYO_API_KEY = Deno.env.get("KLAVIYO_API_KEY");
    if (!KLAVIYO_API_KEY) throw new Error("KLAVIYO_API_KEY is not configured");

    // ── Payload ──────────────────────────────────────────────
    const { recipientEmail, pdfBase64, fileName, reportPeriod } = await req.json();
    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: "recipientEmail is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!pdfBase64) {
      return new Response(JSON.stringify({ error: "pdfBase64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeFileName = fileName ?? "LiveWithMS-Report.pdf";
    const period = reportPeriod ?? "recent period";

    // ── Upload PDF to storage ────────────────────────────────
    // Decode base64 to bytes
    const binaryStr = atob(pdfBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Use service role client to upload (storage RLS requires auth.uid match on folder)
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const storagePath = `${userId}/${safeFileName}`;

    const { error: uploadError } = await serviceClient.storage
      .from("reports")
      .upload(storagePath, bytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Get public URL for the uploaded PDF
    const { data: urlData } = serviceClient.storage
      .from("reports")
      .getPublicUrl(storagePath);

    const pdfUrl = urlData.publicUrl;

    // ── Upsert Klaviyo profile ───────────────────────────────
    await klaviyoPost("/profiles/", {
      data: {
        type: "profile",
        attributes: { email: recipientEmail },
      },
    }, KLAVIYO_API_KEY, true);

    // ── Fire Klaviyo "Send Report" event → triggers flow ─────
    // Create a flow in Klaviyo triggered by the "Send Report" metric
    // that emails the doctor with the PDF download link.
    await klaviyoPost("/events/", {
      data: {
        type: "event",
        attributes: {
          time: new Date().toISOString(),
          metric: {
            data: { type: "metric", attributes: { name: "Send Report" } },
          },
          profile: {
            data: { type: "profile", attributes: { email: recipientEmail } },
          },
          properties: {
            patient_email: userEmail,
            report_period: period,
            pdf_url: pdfUrl,
            file_name: safeFileName,
            report_title: `MS Health Report – ${period}`,
          },
        },
      },
    }, KLAVIYO_API_KEY);

    return new Response(
      JSON.stringify({ success: true, recipientEmail, pdfUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-report error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
