import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BUCKET = "exercise-illustrations";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function generateAndUploadSequence(
  supabase: any,
  apiKey: string,
  slug: string,
  prompt: string
): Promise<string | null> {
  const filePath = `${slug}-sequence.png`;

  // Check cache
  const { data: existing } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  if (existing?.publicUrl) {
    const headRes = await fetch(existing.publicUrl, { method: "HEAD" });
    if (headRes.ok) {
      console.log(`exercise-illustration cache-hit ${slug}-sequence`);
      return existing.publicUrl;
    }
  }

  console.log(`exercise-illustration generating ${slug}-sequence`);

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });

  if (!aiRes.ok) {
    const errText = await aiRes.text();
    console.error("AI gateway error:", aiRes.status, errText);

    if (aiRes.status === 429) throw new Error("Rate limited, try again shortly");
    if (aiRes.status === 402) throw new Error("AI credits exhausted");
    throw new Error(`AI generation failed: ${aiRes.status}`);
  }

  const aiData = await aiRes.json();
  const imageDataUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!imageDataUrl) return null;

  const base64Match = imageDataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!base64Match) return null;

  const imageBytes = Uint8Array.from(atob(base64Match[2]), (c) => c.charCodeAt(0));
  const contentType = `image/${base64Match[1]}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, imageBytes, { contentType, upsert: true });

  if (uploadError) {
    console.error("upload error:", uploadError.message);
    return imageDataUrl; // fallback
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return publicUrlData?.publicUrl || imageDataUrl;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name, muscle_group } = await req.json();
    if (!name || typeof name !== "string") throw new Error("Exercise name is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const slug = slugify(name);
    const mgLabel = muscle_group || "full body";

    const prompt = `Create a clean 2-panel instructional fitness illustration for the exercise "${name}" targeting ${mgLabel}.
Layout requirements:
- LEFT panel: starting position
- RIGHT panel: end/peak position
- Use the exact SAME person, same outfit, same camera angle, and same setting in both panels
- Show clear body movement progression from left to right
- Add a simple subtle arrow between panels to indicate motion direction
Style:
- minimal flat illustration
- white background
- side view preferred
- soft muted colors (blues, greens, warm skin tones)
- no text, no labels, no logos
- proper and safe form, inclusive neutral appearance.`;

    const sequenceUrl = await generateAndUploadSequence(supabase, LOVABLE_API_KEY, slug, prompt);

    console.log("exercise-illustration done", slug, { sequence: !!sequenceUrl });

    return new Response(
      JSON.stringify({
        sequenceUrl,
        startUrl: null,
        endUrl: null,
        cached: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("exercise-illustration error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    const status = message.includes("Rate limited") ? 429 : message.includes("credits") ? 402 : 500;

    return new Response(
      JSON.stringify({ sequenceUrl: null, startUrl: null, endUrl: null, error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
