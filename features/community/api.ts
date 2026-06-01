import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase/client";
import env from "../../lib/env";
import type {
  CommunityActivityItem,
  CommunityActivitySummary,
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
          parent_id: string | null;
          title: string | null;
          body: string;
          category: CommunityCategoryId;
          post_type: CommunityPostType;
          created_at: string;
          updated_at: string;
          is_hidden: boolean;
        };
        Insert: {
          user_id: string;
          parent_id?: string | null;
          title?: string | null;
          body: string;
          category: CommunityCategoryId;
          post_type?: CommunityPostType;
        };
        Update: never;
        Relationships: [];
      };
      community_reports: {
        Row: {
          id: string;
          reporter_user_id: string;
          post_id: string | null;
          reported_user_id: string | null;
          reason: CommunityReportReason;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          reporter_user_id: string;
          post_id?: string | null;
          reported_user_id?: string | null;
          reason: CommunityReportReason;
          notes?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      community_blocks: {
        Row: CommunityBlock;
        Insert: {
          blocker_user_id: string;
          blocked_user_id: string;
        };
        Update: never;
        Relationships: [];
      };
      community_reactions: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          reaction: CommunityReactionType;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          reaction: CommunityReactionType;
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
let hasLoggedMissingCommunitySchema = false;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function assertUuid(value: string, label: string) {
  if (UUID_PATTERN.test(value)) {
    return;
  }

  throw new Error(`${label} is not ready yet. Please refresh Community and try again.`);
}

function logMissingCommunitySchema(error: unknown) {
  const details = getSupabaseErrorDetails(error);
  const combined = `${details.message} ${details.details ?? ""} ${details.hint ?? ""}`.toLowerCase();
  if (
    !hasLoggedMissingCommunitySchema &&
    (details.code === "PGRST205" || details.code === "PGRST204") &&
    combined.includes("community_posts")
  ) {
    hasLoggedMissingCommunitySchema = true;
    console.error("[community] missing community schema — apply migration", details);
  }
}

export async function fetchCommunityPosts(category?: CommunityCategoryId | "all", userId?: string | null): Promise<CommunityPost[]> {
  if (!env.isSupabaseConfigured) {
    return [];
  }

  let query = db
    .from("community_posts")
    .select("id,user_id,parent_id,title,body,category,post_type,created_at,updated_at,is_hidden")
    .eq("is_hidden", false)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .limit(40);

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) {
    logMissingCommunitySchema(error);
    throw error;
  }

  const posts = ((data ?? []) as Array<
    Omit<CommunityPost, "hidden" | "replyCount" | "reactions"> & {
      parent_id?: string | null;
      is_hidden?: boolean;
    }
  >).map((post) => ({
    id: post.id,
    user_id: post.user_id,
    display_name: "Community member",
    title: post.title ?? "Untitled thread",
    body: post.body,
    category: post.category,
    post_type: post.post_type,
    created_at: post.created_at,
    updated_at: post.updated_at,
    hidden: Boolean(post.is_hidden),
    report_count: 0,
    replyCount: 0,
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

  const { data: replies, error: repliesError } = await db
    .from("community_posts")
    .select("parent_id")
    .in("parent_id", postIds)
    .eq("is_hidden", false);

  if (repliesError) {
    logMissingCommunitySchema(repliesError);
    throw repliesError;
  }

  const replyCounts = new Map<string, number>();
  for (const reply of replies ?? []) {
    if (!reply.parent_id) {
      continue;
    }
    replyCounts.set(reply.parent_id, (replyCounts.get(reply.parent_id) ?? 0) + 1);
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

  assertUuid(postId, "Community thread");

  const { data, error } = await db
    .from("community_posts")
    .select("id,user_id,parent_id,body,created_at,is_hidden")
    .eq("parent_id", postId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: true })
    .limit(80);

  if (error) {
    logMissingCommunitySchema(error);
    throw error;
  }

  const comments = ((data ?? []) as Array<
    Omit<CommunityComment, "hidden" | "reactions"> & {
      parent_id?: string | null;
      is_hidden?: boolean;
    }
  >).map((comment) => ({
    id: comment.id,
    post_id: comment.parent_id ?? postId,
    user_id: comment.user_id,
    display_name: "Community member",
    body: comment.body,
    created_at: comment.created_at,
    hidden: Boolean(comment.is_hidden),
    report_count: 0,
    reactions: [],
  }));
  const profileNames = await fetchCommunityProfileNames(comments.map((comment) => comment.user_id));
  const commentsWithNames = comments.map((comment) => ({
    ...comment,
    display_name: profileNames.get(comment.user_id) ?? comment.display_name,
  }));

  const reactionMap = await fetchReactionSummaries({
    postIds: commentsWithNames.map((comment) => comment.id),
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
      .is("parent_id", null)
      .gte("created_at", since),
    db
      .from("community_posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("parent_id", "is", null)
      .gte("created_at", since),
  ]);

  if (postsError) {
    logMissingCommunitySchema(postsError);
    return { postsToday: 0, commentsToday: 0 };
  }
  if (commentsError) {
    logMissingCommunitySchema(commentsError);
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
    .eq("blocker_user_id", userId);

  if (error) {
    logMissingCommunitySchema(error);
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

  const { data, error } = await db
    .from("community_posts")
    .insert({
      user_id: input.userId,
      title: input.title,
      body: input.body,
      category: input.category,
      post_type: input.postType,
      parent_id: null,
    })
    .select("id,user_id,parent_id,title,body,category,post_type,created_at,updated_at,is_hidden")
    .single();

  if (error) {
    logMissingCommunitySchema(error);
    console.error("[community] create thread failed", {
      error,
      ...getSupabaseErrorDetails(error),
      userId: input.userId,
      category: input.category,
      postType: input.postType,
    });
    throw error;
  }

  return {
    id: data.id,
    user_id: data.user_id,
    display_name: sanitizeDisplayName(input.displayName),
    title: data.title ?? "Untitled thread",
    body: data.body,
    category: data.category,
    post_type: data.post_type,
    created_at: data.created_at,
    updated_at: data.updated_at,
    hidden: Boolean(data.is_hidden),
    report_count: 0,
    replyCount: 0,
    reactions: [],
  } satisfies CommunityPost;
}

export async function createCommunityComment(input: {
  postId: string;
  userId: string;
  displayName: string;
  category: CommunityCategoryId;
  body: string;
}) {
  assertConfigured();
  assertUuid(input.postId, "Community thread");

  const { data, error } = await db
    .from("community_posts")
    .insert({
      user_id: input.userId,
      parent_id: input.postId,
      category: input.category,
      body: input.body,
    })
    .select("id,user_id,parent_id,body,created_at,updated_at,is_hidden")
    .single();

  if (error) {
    logMissingCommunitySchema(error);
    console.error("[community] add reply failed", {
      error,
      ...getSupabaseErrorDetails(error),
      userId: input.userId,
      postId: input.postId,
    });
    throw error;
  }

  return {
    id: data.id,
    post_id: data.parent_id ?? input.postId,
    user_id: data.user_id,
    display_name: sanitizeDisplayName(input.displayName),
    body: data.body,
    created_at: data.created_at,
    hidden: Boolean(data.is_hidden),
    report_count: 0,
    reactions: [],
  } satisfies CommunityComment;
}

export async function fetchCommunityActivity(input: {
  userId: string;
  lastSeenAt?: string | null;
  recentCategories?: CommunityCategoryId[];
}): Promise<CommunityActivitySummary> {
  if (!env.isSupabaseConfigured || !input.userId) {
    return { unreadCount: 0, newReplies: [], recentActivity: [] };
  }

  const lastSeenAt = input.lastSeenAt ?? new Date(0).toISOString();
  const { data: ownPosts, error: ownPostsError } = await db
    .from("community_posts")
    .select("id,title,category")
    .eq("user_id", input.userId)
    .eq("is_hidden", false)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .limit(40);

  if (ownPostsError) {
    logMissingCommunitySchema(ownPostsError);
    throw ownPostsError;
  }

  const { data: ownComments, error: ownCommentsError } = await db
    .from("community_posts")
    .select("id,parent_id")
    .eq("user_id", input.userId)
    .eq("is_hidden", false)
    .not("parent_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(80);

  if (ownCommentsError) {
    logMissingCommunitySchema(ownCommentsError);
    throw ownCommentsError;
  }

  const ownPostMap = new Map((ownPosts ?? []).map((post) => [post.id, post]));
  const ownPostIds = Array.from(ownPostMap.keys());
  const ownCommentIds = (ownComments ?? []).map((comment) => comment.id);

  const replyRows = ownPostIds.length
    ? await db
        .from("community_posts")
        .select("id,parent_id,user_id,body,created_at")
        .in("parent_id", ownPostIds)
        .eq("is_hidden", false)
        .gt("created_at", lastSeenAt)
        .neq("user_id", input.userId)
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: [], error: null };

  if (replyRows.error) {
    logMissingCommunitySchema(replyRows.error);
    throw replyRows.error;
  }

  const postReactionRows = ownPostIds.length
    ? await db
        .from("community_reactions")
        .select("id,user_id,post_id,reaction,created_at")
        .in("post_id", ownPostIds)
        .gt("created_at", lastSeenAt)
        .neq("user_id", input.userId)
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: [], error: null };

  if (postReactionRows.error) {
    logMissingCommunitySchema(postReactionRows.error);
    throw postReactionRows.error;
  }

  const commentReactionRows = ownCommentIds.length
    ? await db
        .from("community_reactions")
        .select("id,user_id,post_id,reaction,created_at")
        .in("post_id", ownCommentIds)
        .gt("created_at", lastSeenAt)
        .neq("user_id", input.userId)
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: [], error: null };

  if (commentReactionRows.error) {
    logMissingCommunitySchema(commentReactionRows.error);
    throw commentReactionRows.error;
  }

  const recentCategories = (input.recentCategories ?? []).filter(Boolean);
  const recentPostRows = recentCategories.length
    ? await db
        .from("community_posts")
        .select("id,user_id,title,body,category,created_at")
        .in("category", recentCategories)
        .eq("is_hidden", false)
        .is("parent_id", null)
        .gt("created_at", lastSeenAt)
        .neq("user_id", input.userId)
        .order("created_at", { ascending: false })
        .limit(10)
    : { data: [], error: null };

  if (recentPostRows.error) {
    logMissingCommunitySchema(recentPostRows.error);
    throw recentPostRows.error;
  }

  const actorIds = new Set<string>();
  for (const row of replyRows.data ?? []) actorIds.add(row.user_id);
  for (const row of postReactionRows.data ?? []) actorIds.add(row.user_id);
  for (const row of commentReactionRows.data ?? []) actorIds.add(row.user_id);
  for (const row of recentPostRows.data ?? []) actorIds.add(row.user_id);
  const actorNames = await fetchCommunityProfileNames(Array.from(actorIds));

  const replies: CommunityActivityItem[] = (replyRows.data ?? []).map((row) => {
    const post = ownPostMap.get(row.parent_id ?? "");
    return {
      id: `reply:${row.id}`,
      type: "reply",
      created_at: row.created_at,
      postId: row.parent_id ?? "",
      postTitle: post?.title ?? "Your thread",
      category: post?.category ?? "community-support",
      actorDisplayName: actorNames.get(row.user_id) ?? "Community member",
      preview: previewCommunityText(row.body),
    };
  });

  const commentPostIds = Array.from(new Set((ownComments ?? []).map((comment) => comment.parent_id).filter(Boolean)));
  const commentPosts = commentPostIds.length
    ? await db.from("community_posts").select("id,title,category").in("id", commentPostIds).eq("is_hidden", false)
    : { data: [], error: null };

  if (commentPosts.error) {
    logMissingCommunitySchema(commentPosts.error);
    throw commentPosts.error;
  }

  const commentPostMap = new Map((commentPosts.data ?? []).map((post) => [post.id, post]));
  const ownCommentPostMap = new Map(
    (ownComments ?? [])
      .filter((comment) => Boolean(comment.parent_id))
      .map((comment) => [comment.id, comment.parent_id as string]),
  );

  const reactions: CommunityActivityItem[] = [
    ...(postReactionRows.data ?? []).map((row) => {
      const post = ownPostMap.get(row.post_id ?? "");
      return {
        id: `post-reaction:${row.id}`,
        type: "reaction" as const,
        created_at: row.created_at,
        postId: row.post_id ?? "",
        postTitle: post?.title ?? "Your thread",
        category: post?.category ?? "community-support",
        actorDisplayName: actorNames.get(row.user_id) ?? "Community member",
        preview: `Reacted with ${row.reaction}.`,
      };
    }),
    ...(commentReactionRows.data ?? []).map((row) => {
      const postId = ownCommentPostMap.get(row.post_id ?? "") ?? "";
      const post = commentPostMap.get(postId);
      return {
        id: `comment-reaction:${row.id}`,
        type: "reaction" as const,
        created_at: row.created_at,
        postId,
        postTitle: post?.title ?? "A thread you replied to",
        category: post?.category ?? "community-support",
        actorDisplayName: actorNames.get(row.user_id) ?? "Community member",
        preview: `Reacted to your reply with ${row.reaction}.`,
      };
    }),
  ];

  const recentPosts: CommunityActivityItem[] = (recentPostRows.data ?? []).map((row) => ({
    id: `post:${row.id}`,
    type: "post",
    created_at: row.created_at,
    postId: row.id,
    postTitle: row.title,
    category: row.category,
    actorDisplayName: actorNames.get(row.user_id) ?? "Community member",
    preview: previewCommunityText(row.body),
  }));

  const recentActivity = [...replies, ...reactions, ...recentPosts]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, 8);

  return {
    unreadCount: recentActivity.length,
    newReplies: replies.slice(0, 5),
    recentActivity,
  };
}

export async function toggleCommunityReaction(input: {
  userId: string;
  postId?: string;
  commentId?: string;
  reactionType: CommunityReactionType;
}) {
  assertConfigured();

  const targetId = input.postId ?? input.commentId;
  if (!targetId) {
    throw new Error("Reaction target is required.");
  }
  assertUuid(targetId, "Community post");
  const reactionDebug = {
    tableName: "community_reactions",
    postId: targetId,
    userId: input.userId,
    reaction: input.reactionType,
    isUuid: UUID_PATTERN.test(targetId),
  };

  if (__DEV__) {
    console.log("[community] reaction attempt", reactionDebug);
  }

  const { data: existing, error: existingError } = await db
    .from("community_reactions")
    .select("id,reaction")
    .eq("user_id", input.userId)
    .eq("post_id", targetId)
    .maybeSingle();

  if (existingError) {
    logMissingCommunitySchema(existingError);
    console.error("[community] reaction failed", {
      error: existingError,
      ...getSupabaseErrorDetails(existingError),
      userId: input.userId,
      postId: input.postId,
      commentId: input.commentId,
      reactionType: input.reactionType,
      phase: "lookup",
      ...reactionDebug,
    });
    throw existingError;
  }

  if (existing) {
    const { error: deleteError, data: deleteData } = await db
      .from("community_reactions")
      .delete()
      .eq("id", existing.id)
      .select("id");
    if (deleteError) {
      console.error("[community] reaction failed", {
        error: deleteError,
        ...getSupabaseErrorDetails(deleteError),
        userId: input.userId,
        postId: input.postId,
        commentId: input.commentId,
        reactionType: input.reactionType,
        phase: "delete-existing",
        ...reactionDebug,
      });
      throw deleteError;
    }
    if (__DEV__) {
      console.log("[community] reaction delete response", {
        ...reactionDebug,
        existingReaction: existing.reaction,
        data: deleteData,
      });
    }
    if (existing.reaction === input.reactionType) {
      return;
    }
  }

  const insertPayload = {
    user_id: input.userId,
    post_id: targetId,
    reaction: input.reactionType,
  };
  const { error, data } = await db
    .from("community_reactions")
    .insert(insertPayload)
    .select("id,post_id,user_id,reaction");

  if (error) {
    logMissingCommunitySchema(error);
    console.error("[community] reaction failed", {
      error,
      ...getSupabaseErrorDetails(error),
      userId: input.userId,
      postId: input.postId,
      commentId: input.commentId,
      reactionType: input.reactionType,
      phase: "insert",
      insertPayload,
      data,
      ...reactionDebug,
    });
    throw error;
  }

  if (__DEV__) {
    console.log("[community] reaction insert response", {
      ...reactionDebug,
      insertPayload,
      data,
    });
  }
}

async function fetchReactionSummaries(input: {
  postIds?: string[];
  userId?: string | null;
}): Promise<Map<string, CommunityReactionSummary[]>> {
  const ids = input.postIds ?? [];
  if (!env.isSupabaseConfigured || ids.length === 0) {
    return new Map();
  }

  const { data, error } = await db
    .from("community_reactions")
    .select("user_id,post_id,reaction")
    .in("post_id", ids);

  if (error) {
    return new Map();
  }

  const grouped = new Map<string, Map<CommunityReactionType, CommunityReactionSummary>>();
  for (const reaction of data ?? []) {
    const targetId = reaction.post_id;
    if (!targetId) {
      continue;
    }
    const target = grouped.get(targetId) ?? new Map<CommunityReactionType, CommunityReactionSummary>();
    const summary = target.get(reaction.reaction) ?? {
      reaction_type: reaction.reaction,
      count: 0,
      reactedByMe: false,
    };
    summary.count += 1;
    summary.reactedByMe = summary.reactedByMe || reaction.user_id === input.userId;
    target.set(reaction.reaction, summary);
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

function previewCommunityText(body: string) {
  const compact = body.trim().replace(/\s+/g, " ");
  return compact.length > 90 ? `${compact.slice(0, 90).trim()}...` : compact;
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
  reportedUserId: string;
  reason: CommunityReportReason;
  notes?: string;
}) {
  assertConfigured();
  assertUuid(input.postId, "Community post");
  assertUuid(input.reportedUserId, "Community author");

  const { error } = await db.from("community_reports").insert({
    reporter_user_id: input.reporterId,
    post_id: input.postId,
    reported_user_id: input.reportedUserId,
    reason: input.reason,
    notes: input.notes?.trim() ? input.notes.trim() : null,
  });

  if (error) {
    logMissingCommunitySchema(error);
    console.error("[community] report failed", {
      error,
      ...getSupabaseErrorDetails(error),
      reporterId: input.reporterId,
      postId: input.postId,
      reason: input.reason,
    });
    throw error;
  }
}

export async function reportCommunityComment(input: {
  reporterId: string;
  commentId: string;
  reportedUserId: string;
  reason: CommunityReportReason;
  notes?: string;
}) {
  assertConfigured();
  assertUuid(input.commentId, "Community reply");
  assertUuid(input.reportedUserId, "Community author");

  const { error } = await db.from("community_reports").insert({
    reporter_user_id: input.reporterId,
    post_id: input.commentId,
    reported_user_id: input.reportedUserId,
    reason: input.reason,
    notes: input.notes?.trim() ? input.notes.trim() : null,
  });

  if (error) {
    logMissingCommunitySchema(error);
    console.error("[community] report failed", {
      error,
      ...getSupabaseErrorDetails(error),
      reporterId: input.reporterId,
      commentId: input.commentId,
      reason: input.reason,
    });
    throw error;
  }
}

export async function blockCommunityUser(input: {
  blockerId: string;
  blockedUserId: string;
}) {
  assertConfigured();
  assertUuid(input.blockedUserId, "Community author");

  const { error } = await db.from("community_blocks").insert({
    blocker_user_id: input.blockerId,
    blocked_user_id: input.blockedUserId,
  });

  if (error) {
    const details = getSupabaseErrorDetails(error);
    if (details.code === "23505") {
      return;
    }
    logMissingCommunitySchema(error);
    console.error("[community] block failed", {
      error,
      ...details,
      blockerId: input.blockerId,
      blockedUserId: input.blockedUserId,
    });
    throw error;
  }
}

export async function hideCommunityPost(input: {
  postId: string;
  userId: string;
}) {
  assertConfigured();
  assertUuid(input.postId, "Community post");

  const rpcPromise = db.rpc("soft_delete_community_post", {
    target_post_id: input.postId,
  });
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Delete timed out")), 8000);
  });

  const result = await Promise.race([rpcPromise, timeoutPromise]);

  if (__DEV__) {
    console.log("[community-delete-step]", "delete rpc returned", {
      data: result.data,
      error: result.error,
      postId: input.postId,
      userId: input.userId,
    });
  }

  const { error, data } = result;

  if (error) {
    logMissingCommunitySchema(error);
    console.error("[community] delete failed", {
      error,
      ...getSupabaseErrorDetails(error),
      postId: input.postId,
      userId: input.userId,
    });
    throw error;
  }

  return Boolean(data);
}
