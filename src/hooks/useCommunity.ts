import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/* ─── Types ─────────────────────────────────────────────── */
export interface Channel {
  id: string;
  name: string;
  emoji: string;
  category: string;
  description: string | null;
  sort_order: number;
  is_locked: boolean;
  created_at: string;
}

export interface Post {
  id: string;
  channel_id: string;
  user_id: string;
  display_name: string;
  title: string;
  body: string;
  is_pinned: boolean;
  is_hidden: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  display_name: string;
  body: string;
  is_hidden: boolean;
  created_at: string;
}

/* ─── Channels ──────────────────────────────────────────── */
export const useChannels = () => {
  return useQuery({
    queryKey: ["community-channels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_channels")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Channel[];
    },
  });
};

/* ─── Trending Posts (top reacted across all channels) ──── */
export const useTrendingPosts = (limit = 5) => {
  return useQuery({
    queryKey: ["community-trending-posts", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_posts")
        .select("*")
        .eq("is_hidden", false)
        .order("likes_count", { ascending: false })
        .order("comments_count", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as Post[];
    },
  });
};

/* ─── Posts ──────────────────────────────────────────────── */
export const usePosts = (channelId: string | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!channelId) return;
    const channel = supabase
      .channel(`posts-${channelId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_posts", filter: `channel_id=eq.${channelId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["community-posts", channelId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [channelId, queryClient]);

  return useQuery({
    queryKey: ["community-posts", channelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_posts")
        .select("*")
        .eq("channel_id", channelId!)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Post[];
    },
    enabled: !!channelId,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (post: { channel_id: string; user_id: string; display_name: string; title: string; body: string }) => {
      const { data, error } = await supabase
        .from("community_posts")
        .insert(post)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["community-posts", vars.channel_id] });
    },
  });
};

export const useEditPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, title, body }: { postId: string; title: string; body: string }) => {
      const { error } = await supabase
        .from("community_posts")
        .update({ title, body })
        .eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("community_posts")
        .delete()
        .eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    },
  });
};

/* ─── Comments ──────────────────────────────────────────── */
export const useComments = (postId: string | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!postId) return;
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_comments", filter: `post_id=eq.${postId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["community-comments", postId] });
          queryClient.invalidateQueries({ queryKey: ["community-posts"] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [postId, queryClient]);

  return useQuery({
    queryKey: ["community-comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_comments")
        .select("*")
        .eq("post_id", postId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Comment[];
    },
    enabled: !!postId,
  });
};

export const useEditComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, body }: { commentId: string; body: string }) => {
      const { error } = await supabase
        .from("community_comments")
        .update({ body })
        .eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-comments"] });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("community_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-comments"] });
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    },
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (comment: { post_id: string; user_id: string; display_name: string; body: string }) => {
      const { data, error } = await supabase
        .from("community_comments")
        .insert(comment)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["community-comments", vars.post_id] });
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    },
  });
};

/* ─── Reactions (emoji) ──────────────────────────────────── */

/** Returns { heart: 3, thumbsup: 1, _my: ["heart"] } */
export const useReactions = (postId: string | null, commentId: string | null) => {
  const { user } = useAuth();
  const targetKey = postId ? ["post", postId] : ["comment", commentId];
  return useQuery({
    queryKey: ["community-reactions", ...targetKey, user?.id],
    queryFn: async () => {
      let query = supabase.from("community_likes").select("reaction_type, user_id");
      if (postId) query = query.eq("post_id", postId);
      if (commentId) query = query.eq("comment_id", commentId);
      const { data, error } = await query;
      if (error) throw error;
      const counts: Record<string, any> = {};
      const my: string[] = [];
      for (const row of data ?? []) {
        const rt = (row as any).reaction_type ?? "heart";
        counts[rt] = (counts[rt] ?? 0) + 1;
        if ((row as any).user_id === user?.id) my.push(rt);
      }
      counts._my = my;
      return counts as Record<string, any>;
    },
    enabled: !!(postId || commentId),
  });
};

/** Legacy hook — still used by PostCard for the simple heart check */
export const usePostLikes = (postId: string | null) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["community-likes", postId, user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("community_likes")
        .select("id")
        .eq("post_id", postId!)
        .eq("user_id", user!.id) as any)
        .eq("reaction_type", "heart")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!postId && !!user,
  });
};

export const useToggleReaction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      postId, commentId, reactionType, isReacted,
    }: { postId: string | null; commentId: string | null; reactionType: string; isReacted: boolean }) => {
      if (isReacted) {
        let query = supabase
          .from("community_likes")
          .delete()
          .eq("user_id", user!.id);
        if (postId) query = query.eq("post_id", postId);
        if (commentId) query = query.eq("comment_id", commentId);
        const { error } = await (query as any).eq("reaction_type", reactionType);
        if (error) throw error;
      } else {
        const row: any = { user_id: user!.id, reaction_type: reactionType };
        if (postId) row.post_id = postId;
        if (commentId) row.comment_id = commentId;
        const { error } = await supabase.from("community_likes").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-reactions"] });
      queryClient.invalidateQueries({ queryKey: ["community-likes"] });
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    },
  });
};

export const useToggleLike = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (isLiked) {
        const { error } = await (supabase
          .from("community_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user!.id) as any)
          .eq("reaction_type", "heart");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("community_likes")
          .insert({ post_id: postId, user_id: user!.id, reaction_type: "heart" } as any);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["community-likes", vars.postId] });
      queryClient.invalidateQueries({ queryKey: ["community-reactions"] });
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    },
  });
};

/* ─── Reports ───────────────────────────────────────────── */
export const useCreateReport = () => {
  return useMutation({
    mutationFn: async (report: { reporter_id: string; post_id?: string; comment_id?: string; reason: string }) => {
      const { error } = await supabase
        .from("community_reports")
        .insert(report);
      if (error) throw error;
    },
  });
};

/* ─── Moderation ────────────────────────────────────────── */
export const useUserRoles = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data.map((r: any) => r.role as string);
    },
    enabled: !!user,
  });
};

export const useHidePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, hidden }: { postId: string; hidden: boolean }) => {
      const { error } = await supabase
        .from("community_posts")
        .update({ is_hidden: hidden })
        .eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    },
  });
};

export const useHideComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, hidden }: { commentId: string; hidden: boolean }) => {
      const { error } = await supabase
        .from("community_comments")
        .update({ is_hidden: hidden })
        .eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-comments"] });
    },
  });
};

/* ─── Pending reports (for mods) ────────────────────────── */
export const usePendingReports = () => {
  return useQuery({
    queryKey: ["community-reports-pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_reports")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useResolveReport = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: string }) => {
      const { error } = await supabase
        .from("community_reports")
        .update({ status, resolved_by: user!.id, resolved_at: new Date().toISOString() })
        .eq("id", reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-reports-pending"] });
    },
  });
};

/* ─── Display name ──────────────────────────────────────── */
export const useDisplayName = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["display-name", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return (data?.display_name as string) || "Anonymous";
    },
    enabled: !!user,
  });
};
