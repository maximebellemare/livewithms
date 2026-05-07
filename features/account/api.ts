import env from "../../lib/env";
import { supabase } from "../../lib/supabase/client";

export const accountApi = {
  async deleteMyAccount() {
    if (!env.isSupabaseConfigured) {
      throw new Error("Account deletion is unavailable in mock mode.");
    }

    const { data, error } = await supabase.functions.invoke("account-management", {
      body: { action: "delete" },
    });

    if (error || !data?.success) {
      throw error ?? new Error("Failed to delete account");
    }

    return data;
  },
};
