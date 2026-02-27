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

async function generateAndUpload(
  supabase: any,
  apiKey: string,
  slug: string,
  suffix: string,
  prompt: string
): Promise<string | null> {
  const filePath = `${slug}-${suffix}.png`;

  // Check cache
  const { data: existing } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  if (existing?.publicUrl) {
    const headRes = await fetch(existing.publicUrl, { method: "HEAD" });
    if (headRes.ok) {
      console.log(`exercise-illustration cache-hit ${slug}-${suffix}`);
      return existing.publicUrl;
    }
  }

  console.log(`exercise-illustration generating ${slug}-${suffix}`);

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
    console.error(`AI gateway error (${suffix}):`, aiRes.status, errText);
    return null;
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
    console.error(`upload error (${suffix}):`, uploadError.message);
    return imageDataUrl; // fallback to data URL
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

    const baseStyle = `Style: minimal flat illustration, white background, single person shown from the side. Use soft muted colors (blues, greens, warm skin tones). No text, no labels, no equipment brand names. The person should have a neutral, inclusive appearance. Show proper form clearly.`;

    const startPrompt = `Create a clean, simple fitness illustration showing a person in the STARTING POSITION of the exercise "${name}". The exercise targets ${mgLabel}. The person should be in the ready/initial position before the movement begins. ${baseStyle}`;

    const endPrompt = `Create a clean, simple fitness illustration showing a person in the END/PEAK POSITION of the exercise "${name}". The exercise targets ${mgLabel}. The person should be at the peak of the movement (e.g. fully squatted, arm fully curled, etc). ${baseStyle}`;

    // Generate both images in parallel
    const [startUrl, endUrl] = await Promise.all([
      generateAndUpload(supabase, LOVABLE_API_KEY, slug, "start", startPrompt),
      generateAndUpload(supabase, LOVABLE_API_KEY, slug, "end", endPrompt),
    ]);

    console.log("exercise-illustration done", slug, { start: !!startUrl, end: !!endUrl });

    return new Response(
      JSON.stringify({ startUrl, endUrl, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("exercise-illustration error:", e);

    const status = e instanceof Error && e.message.includes("Rate") ? 429 : 500;
    return new Response(
      JSON.stringify({ startUrl: null, endUrl: null, error: e instanceof Error ? e.message : "Unknown error" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
