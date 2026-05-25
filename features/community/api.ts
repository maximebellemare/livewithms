import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase/client";
import env from "../../lib/env";
import type {
  CommunityCategoryId,
  CommunityBlock,
  CommunityComment,
  CommunityPost,
  CommunityPostType,
  CommunityReactionSummary,
  CommunityReactionType,
  CommunityReportReason,
  CommunityUsage,
} from "./types";

type CommunityDatabase = {
  public: {
    Tables: {
      community_posts: {
        Row: {
          id: string;
          user_id: string;
          display_name: string;
          title: string;
          body: string;
          category: CommunityCategoryId;
          post_type: CommunityPostType;
          suggestion_type: CommunityPostType | null;
          created_at: string;
          updated_at: string;
          is_hidden: boolean;
          report_count: number;
          reaction_count: number;
          comments_count: number;
        };
        Insert: {
          user_id: string;
          display_name: string;
          title: string;
          body: string;
          category: CommunityCategoryId;
          post_type: CommunityPostType;
          suggestion_type?: CommunityPostType | null;
        };
        Update: never;
        Relationships: [];
      };
      community_comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          display_name: string;
          body: string;
          created_at: string;
          is_hidden: boolean;
          report_count: number;
        };
        Insert: {
          post_id: string;
          user_id: string;
          display_name: string;
          body: string;
        };
        Update: never;
        Relationships: [];
      };
      community_reports: {
        Row: {
          id: string;
          reporter_id: string;
          post_id: string | null;
          comment_id: string | null;
          reason: CommunityReportReason;
          created_at: string;
        };
        Insert: {
          reporter_id: string;
          post_id?: string | null;
          comment_id?: string | null;
          reason: CommunityReportReason;
        };
        Update: never;
        Relationships: [];
      };
      community_blocks: {
        Row: CommunityBlock;
        Insert: {
          blocker_id: string;
          blocked_user_id: string;
        };
        Update: never;
        Relationships: [];
      };
      community_reactions: {
        Row: {
          id: string;
          user_id: string;
          post_id: string | null;
          comment_id: string | null;
          reaction_type: CommunityReactionType;
          created_at: string;
        };
        Insert: {
          user_id: string;
          post_id?: string | null;
          comment_id?: string | null;
          reaction_type: CommunityReactionType;
        };
        Update: never;
        Relationships: [];
      };
      profiles: {
        Row: {
          user_id: string;
          display_name: string | null;
          updated_at: string | null;
        };
        Insert: {
          user_id: string;
          display_name?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          display_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const db = supabase as unknown as SupabaseClient<CommunityDatabase>;

export type CommunityProfile = CommunityDatabase["public"]["Tables"]["profiles"]["Row"];

function todayStartIso() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

function assertConfigured() {
  if (!env.isSupabaseConfigured) {
    throw new Error("Community requires Supabase.");
  }
}

export async function fetchCommunityPosts(category?: CommunityCategoryId | "all", userId?: string | null): Promise<CommunityPost[]> {
  if (!env.isSupabaseConfigured) {
    return [];
  }

  let query = db
    .from("community_posts")
    .select("id,user_id,display_name,title,body,category,post_type,created_at,updated_at,is_hidden,report_count,comments_count")
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(40);

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  const posts = ((data ?? []) as Array<
    Omit<CommunityPost, "hidden" | "replyCount" | "reactions"> & {
      is_hidden?: boolean;
      comments_count?: number;
    }
  >).map((post) => ({
    id: post.id,
    user_id: post.user_id,
    display_name: sanitizeDisplayName(post.display_name),
    title: post.title,
    body: post.body,
    category: post.category,
    post_type: post.post_type,
    created_at: post.created_at,
    updated_at: post.updated_at,
    hidden: Boolean(post.is_hidden),
    report_count: post.report_count ?? 0,
    replyCount: post.comments_count ?? 0,
    reactions: [],
  }));
  const profileNames = await fetchCommunityProfileNames(posts.map((post) => post.user_id));
  const postsWithNames = posts.map((post) => ({
    ...post,
    display_name: profileNames.get(post.user_id) ?? post.display_name,
  }));
  const postIds = postsWithNames.map((post) => post.id);
  if (postIds.length === 0) {
    return [];
  }

  const { data: comments, error: commentsError } = await db
    .from("community_comments")
    .select("post_id")
    .in("post_id", postIds)
    .eq("is_hidden", false);

  if (commentsError) {
    throw commentsError;
  }

  const replyCounts = new Map<string, number>();
  for (const comment of comments ?? []) {
    replyCounts.set(comment.post_id, (replyCounts.get(comment.post_id) ?? 0) + 1);
  }

  const reactionMap = await fetchReactionSummaries({
    postIds,
    userId,
  });

  return postsWithNames.map((post) => ({
    ...post,
    replyCount: replyCounts.get(post.id) ?? 0,
    reactions: reactionMap.get(post.id) ?? [],
  }));
}

export async function fetchCommunityComments(postId: string, userId?: string | null): Promise<CommunityComment[]> {
  if (!env.isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await db
    .from("community_comments")
    .select("id,post_id,user_id,display_name,body,created_at,is_hidden,report_count")
    .eq("post_id", postId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: true })
    .limit(80);

  if (error) {
    throw error;
  }

  const comments = ((data ?? []) as Array<Omit<CommunityComment, "hidden" | "reactions"> & { is_hidden?: boolean }>).map((comment) => ({
    id: comment.id,
    post_id: comment.post_id,
    user_id: comment.user_id,
    display_name: sanitizeDisplayName(comment.display_name),
    body: comment.body,
    created_at: comment.created_at,
    hidden: Boolean(comment.is_hidden),
    report_count: comment.report_count ?? 0,
    reactions: [],
  }));
  const profileNames = await fetchCommunityProfileNames(comments.map((comment) => comment.user_id));
  const commentsWithNames = comments.map((comment) => ({
    ...comment,
    display_name: profileNames.get(comment.user_id) ?? comment.display_name,
  }));

  const reactionMap = await fetchReactionSummaries({
    commentIds: commentsWithNames.map((comment) => comment.id),
    userId,
  });

  return commentsWithNames.map((comment) => ({
    ...comment,
    reactions: reactionMap.get(comment.id) ?? [],
  }));
}

export async function fetchCommunityProfile(userId: string): Promise<CommunityProfile | null> {
  if (!env.isSupabaseConfigured || !userId) {
    return null;
  }

  const { data, error } = await db
    .from("profiles")
    .select("user_id,display_name,updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    const details = getSupabaseErrorDetails(error);
    console.error("[community] community profile lookup failed", details);
    return null;
  }

  return data ?? null;
}

export async function upsertCommunityProfile(input: {
  userId: string;
  displayName: string;
}): Promise<CommunityProfile> {
  assertConfigured();

  const displayName = cleanOptionalDisplayName(input.displayName);
  if (!displayName) {
    throw new Error("Choose a community name.");
  }

  const payload = {
    user_id: input.userId,
    display_name: displayName,
    updated_at: new Date().toISOString(),
  };

  const { data, error, status, statusText } = await db
    .from("profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("user_id,display_name,updated_at")
    .maybeSingle();

  if (error) {
    const details = getSupabaseErrorDetails(error);
    console.error("[community] community profile save failed", {
      data,
      error,
      status,
      statusText,
      ...details,
    });

    if (isNetworkFailure(error)) {
      throw createCommunityProfileError("Network connection failed. Check your connection and try again.", error);
    }

    throw createCommunityProfileError("Community name could not be updated. Please try again.", error);
  }

  if (!data) {
    throw new Error("Community name could not be updated. Please try again.");
  }

  return data;
}

export async function fetchCommunityUsage(userId: string): Promise<CommunityUsage> {
  if (!env.isSupabaseConfigured) {
    return { postsToday: 0, commentsToday: 0 };
  }

  const since = todayStartIso();
  const [{ count: postsToday, error: postsError }, { count: commentsToday, error: commentsError }] = await Promise.all([
    db
      .from("community_posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", since),
    db
      .from("community_comments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", since),
  ]);

  if (postsError) {
    return { postsToday: 0, commentsToday: 0 };
  }
  if (commentsError) {
    return { postsToday: 0, commentsToday: 0 };
  }

  return {
    postsToday: postsToday ?? 0,
    commentsToday: commentsToday ?? 0,
  };
}

export async function fetchCommunityBlockedUserIds(userId: string): Promise<string[]> {
  if (!env.isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await db
    .from("community_blocks")
    .select("blocked_user_id")
    .eq("blocker_id", userId);

  if (error) {
    return [];
  }

  return (data ?? []).map((row) => row.blocked_user_id);
}

export async function createCommunityPost(input: {
  userId: string;
  displayName: string;
  title: string;
  body: string;
  category: CommunityCategoryId;
  postType: CommunityPostType;
}) {
  assertConfigured();

  const { error } = await db.from("community_posts").insert({
    user_id: input.userId,
    display_name: sanitizeDisplayName(input.displayName),
    title: input.title,
    body: input.body,
    category: input.category,
    post_type: input.postType,
    suggestion_type: input.category === "app_suggestions" ? input.postType : null,
  });

  if (error) {
    throw error;
  }
}

export async function createCommunityComment(input: {
  postId: string;
  userId: string;
  displayName: string;
  body: string;
}) {
  assertConfigured();

  const { error } = await db.from("community_comments").insert({
    post_id: input.postId,
    user_id: input.userId,
    display_name: sanitizeDisplayName(input.displayName),
    body: input.body,
  });

  if (error) {
    throw error;
  }
}

export async function toggleCommunityReaction(input: {
  userId: string;
  postId?: string;
  commentId?: string;
  reactionType: CommunityReactionType;
}) {
  assertConfigured();

  const targetColumn = input.postId ? "post_id" : "comment_id";
  const targetId = input.postId ?? input.commentId;
  if (!targetId) {
    throw new Error("Reaction target is required.");
  }

  const { data: existing, error: existingError } = await db
    .from("community_reactions")
    .select("id,reaction_type")
    .eq("user_id", input.userId)
    .eq(targetColumn, targetId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    const { error: deleteError } = await db.from("community_reactions").delete().eq("id", existing.id);
    if (deleteError) {
      throw deleteError;
    }
    if (existing.reaction_type === input.reactionType) {
      return;
    }
  }

  const { error } = await db.from("community_reactions").insert({
    user_id: input.userId,
    post_id: input.postId ?? null,
    comment_id: input.commentId ?? null,
    reaction_type: input.reactionType,
  });

  if (error) {
    throw error;
  }
}

async function fetchReactionSummaries(input: {
  postIds?: string[];
  commentIds?: string[];
  userId?: string | null;
}): Promise<Map<string, CommunityReactionSummary[]>> {
  const ids = input.postIds?.length ? input.postIds : input.commentIds ?? [];
  if (!env.isSupabaseConfigured || ids.length === 0) {
    return new Map();
  }

  const targetColumn = input.postIds?.length ? "post_id" : "comment_id";
  const { data, error } = await db
    .from("community_reactions")
    .select("user_id,post_id,comment_id,reaction_type")
    .in(targetColumn, ids);

  if (error) {
    return new Map();
  }

  const grouped = new Map<string, Map<CommunityReactionType, CommunityReactionSummary>>();
  for (const reaction of data ?? []) {
    const targetId = reaction.post_id ?? reaction.comment_id;
    if (!targetId) {
      continue;
    }
    const target = grouped.get(targetId) ?? new Map<CommunityReactionType, CommunityReactionSummary>();
    const summary = target.get(reaction.reaction_type) ?? {
      reaction_type: reaction.reaction_type,
      count: 0,
      reactedByMe: false,
    };
    summary.count += 1;
    summary.reactedByMe = summary.reactedByMe || reaction.user_id === input.userId;
    target.set(reaction.reaction_type, summary);
    grouped.set(targetId, target);
  }

  return new Map([...grouped.entries()].map(([targetId, reactions]) => [targetId, [...reactions.values()]]));
}

function sanitizeDisplayName(name: string | null | undefined) {
  const trimmed = name?.trim();
  if (!trimmed || trimmed.includes("@")) {
    return "Community member";
  }
  return trimmed.slice(0, 32);
}

async function fetchCommunityProfileNames(userIds: string[]): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(userIds.filter((userId) => typeof userId === "string" && userId.length > 0))];
  if (!env.isSupabaseConfigured || uniqueIds.length === 0) {
    return new Map();
  }

  const { data, error } = await db
    .from("profiles")
    .select("user_id,display_name")
    .in("user_id", uniqueIds);

  if (error) {
    return new Map();
  }

  return new Map(
    (data ?? []).map((profile) => [
      profile.user_id,
      sanitizeDisplayName(profile.display_name || "Community member"),
    ]),
  );
}

function cleanOptionalDisplayName(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const displayName = value.trim();
  if (!displayName || displayName.includes("@")) {
    return null;
  }

  return displayName.slice(0, 32);
}

function getSupabaseErrorDetails(error: unknown) {
  const maybeError = error as {
    message?: unknown;
    code?: unknown;
    details?: unknown;
    hint?: unknown;
  };

  return {
    message: typeof maybeError?.message === "string" ? maybeError.message : "Unknown error",
    code: typeof maybeError?.code === "string" ? maybeError.code : undefined,
    details: typeof maybeError?.details === "string" ? maybeError.details : undefined,
    hint: typeof maybeError?.hint === "string" ? maybeError.hint : undefined,
  };
}

function isNetworkFailure(error: unknown) {
  const details = getSupabaseErrorDetails(error);
  const combined = `${details.message} ${details.details ?? ""} ${details.hint ?? ""}`.toLowerCase();
  return combined.includes("network request failed") || combined.includes("failed to fetch") || combined.includes("networkerror");
}

function createCommunityProfileError(message: string, error?: unknown) {
  const details = error ? getSupabaseErrorDetails(error) : null;
  const saveError = new Error(message) as Error & {
    code?: string;
    details?: string;
    hint?: string;
    cause?: unknown;
  };

  if (details) {
    saveError.code = details.code;
    saveError.details = details.details;
    saveError.hint = details.hint;
    saveError.cause = error;
  }

  return saveError;
}

export async function reportCommunityPost(input: {
  reporterId: string;
  postId: string;
  reason: CommunityReportReason;
}) {
  assertConfigured();

  const { error } = await db.from("community_reports").insert({
    reporter_id: input.reporterId,
    post_id: input.postId,
    reason: input.reason,
  });

  if (error) {
    throw error;
  }
}

export async function reportCommunityComment(input: {
  reporterId: string;
  commentId: string;
  reason: CommunityReportReason;
}) {
  assertConfigured();

  const { error } = await db.from("community_reports").insert({
    reporter_id: input.reporterId,
    comment_id: input.commentId,
    reason: input.reason,
  });

  if (error) {
    throw error;
  }
}

export async function blockCommunityUser(input: {
  blockerId: string;
  blockedUserId: string;
}) {
  assertConfigured();

  const { error } = await db.from("community_blocks").insert({
    blocker_id: input.blockerId,
    blocked_user_id: input.blockedUserId,
  });

  if (error) {
    throw error;
  }
}
