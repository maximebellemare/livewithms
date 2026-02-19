import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action } = await req.json();

    if (action === "export") {
      // Fetch all user data
      const tables = [
        "profiles",
        "daily_entries",
        "medications",
        "medication_logs",
        "appointments",
        "notifications",
        "community_posts",
        "community_comments",
        "community_bookmarks",
        "community_likes",
        "report_history",
        "push_subscriptions",
      ];

      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      const exportData: Record<string, unknown[]> = {};

      for (const table of tables) {
        const { data } = await adminClient
          .from(table)
          .select("*")
          .eq("user_id", user.id);
        if (data && data.length > 0) {
          exportData[table] = data;
        }
      }

      exportData["account"] = [{ email: user.email, created_at: user.created_at }];

      return new Response(JSON.stringify({ success: true, data: exportData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const adminClient = createClient(supabaseUrl, serviceRoleKey);

      // Delete user data from all tables (cascade will handle some)
      const tables = [
        "push_subscriptions",
        "report_history",
        "community_bookmarks",
        "community_likes",
        "community_comments",
        "community_posts",
        "notifications",
        "medication_logs",
        "medications",
        "appointments",
        "daily_entries",
        "user_roles",
        "profiles",
      ];

      for (const table of tables) {
        await adminClient.from(table).delete().eq("user_id", user.id);
      }

      // Delete the auth user
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.error("Failed to delete auth user:", deleteError);
        return new Response(
          JSON.stringify({ error: "Failed to delete account" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
