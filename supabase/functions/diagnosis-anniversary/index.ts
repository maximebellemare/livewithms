import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get today's month and day
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // Find profiles where diagnosis_date matches today's month/day
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("user_id, display_name, diagnosis_date")
      .not("diagnosis_date", "is", null);

    if (error) throw error;

    const matchingProfiles = (profiles ?? []).filter((p: any) => {
      if (!p.diagnosis_date) return false;
      const dx = new Date(p.diagnosis_date + "T00:00:00");
      return dx.getMonth() + 1 === month && dx.getDate() === day;
    });

    console.log(`Found ${matchingProfiles.length} profiles with diagnosis anniversary today`);

    // Create in-app notifications for each
    for (const p of matchingProfiles) {
      const dxYear = new Date(p.diagnosis_date + "T00:00:00").getFullYear();
      const years = today.getFullYear() - dxYear;

      await supabase.from("notifications").insert({
        user_id: p.user_id,
        type: "anniversary",
        title: `🎗️ It's your ${years}-year diagnosis anniversary`,
        body: `Today marks ${years} year${years !== 1 ? "s" : ""} since your diagnosis. You're stronger than you know. 💪`,
      });
    }

    return new Response(
      JSON.stringify({ sent: matchingProfiles.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
