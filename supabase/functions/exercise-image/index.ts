import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name } = await req.json();
    if (!name) throw new Error("Exercise name is required");

    const apiKey = Deno.env.get("EXERCISEDB_API_KEY");
    if (!apiKey) throw new Error("EXERCISEDB_API_KEY not configured");

    // Search ExerciseDB by name
    const searchTerm = name.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
    const url = `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(searchTerm)}?limit=5&offset=0`;

    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
      },
    });

    if (!res.ok) {
      // Fallback: try with simplified name (first two words)
      const simplified = searchTerm.split(" ").slice(0, 2).join(" ");
      const fallbackUrl = `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(simplified)}?limit=5&offset=0`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
        },
      });
      if (!fallbackRes.ok) {
        return new Response(JSON.stringify({ gifUrl: null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const fallbackData = await fallbackRes.json();
      const gif = fallbackData?.[0]?.gifUrl || null;
      return new Response(JSON.stringify({ gifUrl: gif, name: fallbackData?.[0]?.name }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();

    // Try to find best match
    const lowerName = name.toLowerCase();
    const exact = data.find((e: any) => e.name?.toLowerCase() === lowerName);
    const partial = data.find((e: any) => lowerName.includes(e.name?.toLowerCase()) || e.name?.toLowerCase().includes(lowerName));
    const best = exact || partial || data[0];

    return new Response(JSON.stringify({ gifUrl: best?.gifUrl || null, name: best?.name }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("exercise-image error:", e);
    return new Response(JSON.stringify({ gifUrl: null, error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
