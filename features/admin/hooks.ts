import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase/client";

type UntypedSupabaseClient = {
  from: (table: string) => {
    select: (query: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: { is_admin?: boolean | null } | null; error: unknown }>;
      };
    };
  };
};

const adminSupabase = supabase as unknown as UntypedSupabaseClient;

export function useIsAdmin(userId?: string) {
  return useQuery({
    queryKey: ["admin-role", userId],
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!userId) {
        return false;
      }

      const { data, error } = await adminSupabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("[admin] role lookup failed", {
          userId,
          error,
        });
        throw error;
      }

      return data?.is_admin === true;
    },
  });
}
