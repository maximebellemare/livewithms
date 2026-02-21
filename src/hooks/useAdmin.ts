import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/* ─── Admin role check ──────────────────────────────────── */
export const useIsAdmin = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin");
      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },
    enabled: !!user,
  });
};

/* ─── Articles (admin: all, including unpublished) ──────── */
export const useAdminArticles = () =>
  useQuery({
    queryKey: ["admin-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learn_articles")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

export const useUpsertArticle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (article: {
      id?: string;
      title: string;
      summary: string;
      body: string;
      category: string;
      read_time: string;
      published: boolean;
      sort_order: number;
    }) => {
      if (article.id) {
        const { id, ...rest } = article;
        const { error } = await supabase
          .from("learn_articles")
          .update(rest)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("learn_articles")
          .insert(article);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-articles"] }),
  });
};

export const useDeleteArticle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("learn_articles")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-articles"] }),
  });
};

/* ─── Users list (profiles + roles) ─────────────────────── */
export const useAdminUsers = () =>
  useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, created_at, ms_type")
        .order("created_at", { ascending: false });
      if (pErr) throw pErr;

      const { data: roles, error: rErr } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rErr) throw rErr;

      const roleMap: Record<string, string[]> = {};
      for (const r of roles ?? []) {
        if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
        roleMap[r.user_id].push(r.role);
      }

      return (profiles ?? []).map((p) => ({
        ...p,
        roles: roleMap[p.user_id] ?? [],
      }));
    },
  });

/* ─── Role management ───────────────────────────────────── */
export const useToggleRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role, action }: { userId: string; role: "moderator"; action: "add" | "remove" }) => {
      if (action === "add") {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
};

/* ─── All reports (admin view) ──────────────────────────── */
export const useAdminReports = () =>
  useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

/* ─── Coach feedback stats (admin) ──────────────────────── */
export const useCoachFeedbackStats = () =>
  useQuery({
    queryKey: ["admin-coach-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_coach_feedback_stats");
      if (error) throw error;
      return data as {
        session_id: string;
        session_title: string;
        session_mode: string;
        user_display_name: string;
        thumbs_up: number;
        thumbs_down: number;
        session_created_at: string;
      }[];
    },
  });
