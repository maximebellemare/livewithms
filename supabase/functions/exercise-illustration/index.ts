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
    const filePath = `${slug}.png`;

    // Check cache first
    const { data: existing } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    if (existing?.publicUrl) {
      // Verify the file actually exists by doing a HEAD request
      const headRes = await fetch(existing.publicUrl, { method: "HEAD" });
      if (headRes.ok) {
        console.log("exercise-illustration cache-hit", slug);
        return new Response(
          JSON.stringify({ imageUrl: existing.publicUrl, cached: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Generate illustration using Lovable AI
    const mgLabel = muscle_group || "full body";
    const prompt = `Create a clean, simple fitness illustration showing a person performing the exercise "${name}". 
The exercise targets ${mgLabel}. 
Style: minimal flat illustration, white background, single person shown from the side in the key position of the movement. 
Use soft muted colors (blues, greens, warm skin tones). 
No text, no labels, no equipment brand names. 
The person should have a neutral, inclusive appearance.
Show proper form clearly.`;

    console.log("exercise-illustration generating", slug);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
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

      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ imageUrl: null, error: "Rate limited, try again shortly" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ imageUrl: null, error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI generation failed: ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const imageDataUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageDataUrl) {
      console.error("exercise-illustration no-image-in-response");
      return new Response(JSON.stringify({ imageUrl: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract base64 data and upload to storage
    const base64Match = imageDataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      console.error("exercise-illustration invalid-data-url");
      return new Response(JSON.stringify({ imageUrl: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageBytes = Uint8Array.from(atob(base64Match[2]), (c) => c.charCodeAt(0));
    const contentType = `image/${base64Match[1]}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, imageBytes, { contentType, upsert: true });

    if (uploadError) {
      console.error("exercise-illustration upload-error", uploadError.message);
      // Return the data URL directly as fallback
      return new Response(JSON.stringify({ imageUrl: imageDataUrl, cached: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    const publicUrl = publicUrlData?.publicUrl;

    console.log("exercise-illustration generated-and-cached", slug);

    return new Response(
      JSON.stringify({ imageUrl: publicUrl || imageDataUrl, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("exercise-illustration error:", e);
    return new Response(
      JSON.stringify({ imageUrl: null, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
