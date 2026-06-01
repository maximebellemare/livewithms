import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import AppButton from "../../../../components/ui/AppButton";
import AppScreen from "../../../../components/ui/AppScreen";
import AppText from "../../../../components/ui/AppText";
import { colors, radii, shadows, spacing } from "../../../../components/ui/design";
import {
  blockCommunityUser,
  createCommunityComment,
  createCommunityPost,
  fetchCommunityBlockedUserIds,
  fetchCommunityComments,
  fetchCommunityProfile,
  fetchCommunityPosts,
  fetchCommunityUsage,
  hideCommunityPost,
  reportCommunityComment,
  reportCommunityPost,
  toggleCommunityReaction,
  upsertCommunityProfile,
} from "../../../../features/community/api";
import { rememberCommunityCategory, useCommunityActivity } from "../../../../features/community/activity";
import {
  COMMUNITY_CATEGORIES,
  COMMUNITY_REACTIONS,
  COMMUNITY_REPORT_REASONS,
  COMMUNITY_STARTER_POSTS,
  FREE_DAILY_COMMUNITY_COMMENT_LIMIT,
  FREE_DAILY_COMMUNITY_POST_LIMIT,
  getCommunityPostTypesForCategory,
  getCommunityCategoryLabel,
  getDefaultCommunityPostType,
  getCommunityPostTypeLabel,
} from "../../../../features/community/constants";
import type {
  CommunityActivityItem,
  CommunityCategoryId,
  CommunityComment,
  CommunityPost,
  CommunityPostType,
  CommunityReactionSummary,
  CommunityReactionType,
  CommunityReportReason,
  CommunityUsage,
} from "../../../../features/community/types";
import { useAuth } from "../../../../features/auth/hooks";
import { useGrowthState } from "../../../../features/growth/hooks";
import { usePremium } from "../../../../features/premium/hooks";

type CommunityFilter = CommunityCategoryId | null;
type ModerationTarget =
  | { kind: "post"; post: CommunityPost }
  | { kind: "comment"; comment: CommunityComment };

const TITLE_LIMIT = 120;
const BODY_LIMIT = 2000;
const COMMENT_LIMIT = 1200;
const REPORT_NOTES_LIMIT = 500;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COMMUNITY_LIST_ROUTE = "/community";

function safeTrim(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isUuid(value: string | null | undefined) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isOwnedByCurrentUser(postUserId: string | null | undefined, currentUserId: string | null | undefined) {
  return typeof postUserId === "string" && typeof currentUserId === "string" && postUserId === currentUserId;
}

function dedupeThreads(threads: CommunityPost[]) {
  return Array.from(new Map(threads.map((thread) => [thread.id, thread])).values());
}

function dedupeComments(replies: CommunityComment[]) {
  return Array.from(new Map(replies.map((reply) => [reply.id, reply])).values());
}

function isStarterDemoPost(post: CommunityPost | null | undefined) {
  return false;
}

function isStarterDemoComment(comment: CommunityComment | null | undefined) {
  return false;
}

function canInteractWithPost(post: CommunityPost | null | undefined) {
  return Boolean(post && !isStarterDemoPost(post) && isUuid(post.id));
}

function canInteractWithComment(comment: CommunityComment | null | undefined) {
  return Boolean(comment && !isStarterDemoComment(comment) && isUuid(comment.id));
}

function timeAgo(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function previewText(body: string) {
  const compact = safeTrim(body).replace(/\s+/g, " ");
  return compact.length > 130 ? `${compact.slice(0, 130).trim()}...` : compact;
}

function buildOptimisticReactions(
  reactions: CommunityReactionSummary[],
  reactionType: CommunityReactionType,
) {
  const byType = new Map(
    reactions.map((reaction) => [
      reaction.reaction_type,
      {
        ...reaction,
      },
    ]),
  );
  const activeReaction = reactions.find((reaction) => reaction.reactedByMe);

  if (activeReaction?.reaction_type === reactionType) {
    const current = byType.get(reactionType);
    if (current) {
      const nextCount = Math.max(0, current.count - 1);
      if (nextCount === 0) {
        byType.delete(reactionType);
      } else {
        byType.set(reactionType, {
          ...current,
          count: nextCount,
          reactedByMe: false,
        });
      }
    }
  } else {
    if (activeReaction) {
      const currentActive = byType.get(activeReaction.reaction_type);
      if (currentActive) {
        const nextCount = Math.max(0, currentActive.count - 1);
        if (nextCount === 0) {
          byType.delete(activeReaction.reaction_type);
        } else {
          byType.set(activeReaction.reaction_type, {
            ...currentActive,
            count: nextCount,
            reactedByMe: false,
          });
        }
      }
    }

    const current = byType.get(reactionType);
    if (current) {
      byType.set(reactionType, {
        ...current,
        count: current.count + 1,
        reactedByMe: true,
      });
    } else {
      byType.set(reactionType, {
        reaction_type: reactionType,
        count: 1,
        reactedByMe: true,
      });
    }
  }

  return COMMUNITY_REACTIONS
    .map((reaction) => byType.get(reaction.id))
    .filter((reaction): reaction is CommunityReactionSummary => Boolean(reaction && reaction.count > 0));
}

function getSafeDisplayName(profileDisplayName?: string | null) {
  const possibleName = [profileDisplayName].find((name) => safeTrim(name).length > 0);
  const safeName = safeTrim(possibleName);
  if (!safeName || safeName.includes("@")) {
    return "Community member";
  }
  return safeName.slice(0, 32);
}

export default function CommunityScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const premium = usePremium();
  const growth = useGrowthState();
  const [selectedCategory, setSelectedCategory] = useState<CommunityFilter>(null);
  const [posts, setPosts] = useState<CommunityPost[]>(COMMUNITY_STARTER_POSTS);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [usage, setUsage] = useState<CommunityUsage>({ postsToday: 0, commentsToday: 0 });
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [deletingReplyId, setDeletingReplyId] = useState<string | null>(null);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [postType, setPostType] = useState<CommunityPostType>("question");
  const [composerCategory, setComposerCategory] = useState<CommunityCategoryId>("symptoms-daily-life");
  const [commentBody, setCommentBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [moderationTarget, setModerationTarget] = useState<ModerationTarget | null>(null);
  const [reportReason, setReportReason] = useState<CommunityReportReason>("spam");
  const [reportNotes, setReportNotes] = useState("");
  const [savingReport, setSavingReport] = useState(false);
  const [blockingAuthor, setBlockingAuthor] = useState(false);
  const [publishState, setPublishState] = useState<"idle" | "posting" | "success" | "error">("idle");
  const [recentlyPublishedPostId, setRecentlyPublishedPostId] = useState<string | null>(null);
  const publishFeedbackScale = useRef(new Animated.Value(0.96)).current;
  const publishFeedbackOpacity = useRef(new Animated.Value(0)).current;

  const hasPremiumAccess = premium.hasPremiumAccess;
  const {
    summary: communityActivitySummary,
    refresh: refreshCommunityActivity,
    markSeen: markCommunityActivityAsSeen,
  } = useCommunityActivity(user?.id);
  const freePostLimitReached = !hasPremiumAccess && usage.postsToday >= FREE_DAILY_COMMUNITY_POST_LIMIT;
  const freeCommentLimitReached = !hasPremiumAccess && usage.commentsToday >= FREE_DAILY_COMMUNITY_COMMENT_LIMIT;
  const displayName = useMemo(() => getSafeDisplayName(profileDisplayName), [profileDisplayName]);

  const forceReturnToCommunityList = useCallback((reason: "reply-delete" | "thread-delete") => {
    const route = `${COMMUNITY_LIST_ROUTE}?refresh=${Date.now().toString()}`;
    if (__DEV__) {
      console.log("[community-delete-step]", "navigation called", { reason, route });
    }
    setSelectedPost(null);
    setComments([]);
    router.replace(route as never);
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    setProfileDisplayName(null);

    if (!user?.id) {
      return () => {
        cancelled = true;
      };
    }

    fetchCommunityProfile(user.id)
      .then((communityProfile) => {
        if (!cancelled) {
          setProfileDisplayName(communityProfile?.display_name ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProfileDisplayName(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const animatePublishSuccess = useCallback(() => {
    publishFeedbackScale.setValue(0.96);
    publishFeedbackOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(publishFeedbackScale, {
        toValue: 1,
        friction: 8,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.timing(publishFeedbackOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [publishFeedbackOpacity, publishFeedbackScale]);

  const loadCommunity = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "initial") {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const [nextPosts, nextUsage, nextBlockedUserIds] = await Promise.all([
          fetchCommunityPosts(undefined, user?.id),
          user?.id ? fetchCommunityUsage(user.id) : Promise.resolve({ postsToday: 0, commentsToday: 0 }),
          user?.id ? fetchCommunityBlockedUserIds(user.id) : Promise.resolve([]),
        ]);
        const nextBlockedSet = new Set(nextBlockedUserIds);
        const visiblePosts = nextPosts.filter((post) => !nextBlockedSet.has(post.user_id));
        setBlockedUserIds(nextBlockedSet);
        setPosts(dedupeThreads(visiblePosts.length > 0 ? visiblePosts : COMMUNITY_STARTER_POSTS));
        setUsage(nextUsage);
        setMessage(null);
        setLoadFailed(false);
      } catch {
        setPosts(COMMUNITY_STARTER_POSTS);
        setLoadFailed(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id],
  );

  useFocusEffect(
    useCallback(() => {
      void loadCommunity("initial");
      void (async () => {
        await refreshCommunityActivity();
        await markCommunityActivityAsSeen();
      })();
    }, [loadCommunity, markCommunityActivityAsSeen, refreshCommunityActivity]),
  );

  const openPost = useCallback(
    async (post: CommunityPost) => {
      setSelectedPost(post);
      setComments([]);
      if (user?.id) {
        await rememberCommunityCategory(user.id, post.category);
      }
      try {
      const nextComments = await fetchCommunityComments(post.id, user?.id);
        const visibleComments = dedupeComments(
          nextComments.filter((comment) => !blockedUserIds.has(comment.user_id)),
        );
        setComments(visibleComments);
        setSelectedPost((current) =>
          current && current.id === post.id
            ? { ...current, replyCount: visibleComments.length }
            : current,
        );
      } catch {
        setMessage("Replies could not load right now.");
      }
    },
    [blockedUserIds, user?.id],
  );

  const openActivityItem = useCallback(async (item: CommunityActivityItem) => {
    const matchingPost = posts.find((post) => post.id === item.postId);
    if (matchingPost) {
      await openPost(matchingPost);
      return;
    }

    const refreshedPosts = await fetchCommunityPosts(undefined, user?.id);
    const refreshedMatch = refreshedPosts.find((post) => post.id === item.postId);
    if (refreshedMatch) {
      setPosts(dedupeThreads(refreshedPosts.length > 0 ? refreshedPosts : COMMUNITY_STARTER_POSTS));
      await openPost(refreshedMatch);
      return;
    }

    setMessage("That activity could not open right now.");
  }, [openPost, posts, user?.id]);

  const resetComposer = useCallback(() => {
    const nextCategory = selectedCategory ?? "symptoms-daily-life";
    setTitle("");
    setBody("");
    setPostType(getDefaultCommunityPostType(nextCategory));
    setComposerCategory(nextCategory);
    setShowComposer(false);
    setPublishState("idle");
  }, [selectedCategory]);

  const submitPost = useCallback(async () => {
    if (!user?.id || savingPost) {
      return;
    }
    if (displayName === "Community member") {
      setNameDraft("");
      setShowNamePrompt(true);
      return;
    }
    const trimmedTitle = safeTrim(title);
    const trimmedBody = safeTrim(body);
    if (!trimmedTitle || !trimmedBody) {
      setMessage("Add a title and a short post before sharing.");
      return;
    }
    if (freePostLimitReached) {
      setMessage("Free community posting is limited today. Premium includes more posting room.");
      return;
    }

    setSavingPost(true);
    setPublishState("posting");
    setMessage("Publishing...");
    try {
      const createdPost = await createCommunityPost({
        userId: user.id,
        displayName,
        title: trimmedTitle,
        body: trimmedBody,
        category: composerCategory,
        postType,
      });
      resetComposer();
      setPosts((current) => [createdPost, ...current.filter((post) => post.id !== createdPost.id)]);
      setSelectedCategory(createdPost.category);
      setSelectedPost(createdPost);
      setComments([]);
      setRecentlyPublishedPostId(createdPost.id);
      setPublishState("success");
      setMessage("Thread published ✓");
      void growth.recordEvent("community_post_created", {
        category: createdPost.category,
        postType: createdPost.post_type,
      });
      animatePublishSuccess();
      void loadCommunity("refresh");
    } catch (error) {
      if (__DEV__) {
        console.error("[community] create thread failed", error);
      }
      setPublishState("error");
      setMessage("Thread could not be published. Please try again.");
    } finally {
      setSavingPost(false);
    }
  }, [
    body,
    composerCategory,
    freePostLimitReached,
    loadCommunity,
    postType,
    resetComposer,
    savingPost,
    title,
    user?.id,
    displayName,
    animatePublishSuccess,
    growth,
  ]);

  const submitComment = useCallback(async () => {
    if (!user?.id || !selectedPost || savingComment) {
      return;
    }
    if (displayName === "Community member") {
      setNameDraft("");
      setMessage("Choose a community name before replying.");
      setShowNamePrompt(true);
      return;
    }
    const trimmedBody = safeTrim(commentBody);
    if (!trimmedBody) {
      setMessage("Write a short reply before posting.");
      return;
    }
    if (freeCommentLimitReached) {
      setMessage("Free replies are limited today. Premium includes more posting room.");
      return;
    }

    setSavingComment(true);
    setMessage("Posting reply...");
    try {
      const createdComment = await createCommunityComment({
        postId: selectedPost.id,
        userId: user.id,
        displayName,
        category: selectedPost.category,
        body: trimmedBody,
      });
      setCommentBody("");
      setComments((current) => [...current, createdComment]);
      setSelectedPost((current) =>
        current && current.id === selectedPost.id
          ? { ...current, replyCount: current.replyCount + 1 }
          : current,
      );
      setPosts((current) =>
        current.map((post) =>
          post.id === selectedPost.id
            ? {
                ...post,
                replyCount: post.replyCount + 1,
              }
            : post,
        ),
      );
      setMessage("Reply posted ✓");
      void loadCommunity("refresh");
    } catch (error) {
      if (__DEV__) {
        console.error("[community] add reply failed", error);
      }
      setMessage("Reply could not be posted. Please try again.");
    } finally {
      setSavingComment(false);
    }
  }, [
    commentBody,
    freeCommentLimitReached,
    loadCommunity,
    savingComment,
    selectedPost,
    user?.id,
    displayName,
  ]);

  const saveCommunityNameFromPrompt = useCallback(async () => {
    if (!user?.id || savingName) {
      return;
    }

    const displayNameDraft = safeTrim(nameDraft);
    if (!displayNameDraft) {
      setMessage("Choose a community name.");
      return;
    }
    if (displayNameDraft.includes("@")) {
      setMessage("Use a name that does not include an email address.");
      return;
    }

    setSavingName(true);
    try {
      const communityProfile = await upsertCommunityProfile({
        userId: user.id,
        displayName: displayNameDraft,
      });
      setProfileDisplayName(communityProfile.display_name ?? displayNameDraft);
      setShowNamePrompt(false);
      setNameDraft("");
      setMessage("Community name saved. You can post or reply now.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Community name could not be saved right now.");
    } finally {
      setSavingName(false);
    }
  }, [nameDraft, savingName, user?.id]);

  const openReportModal = useCallback((target: ModerationTarget) => {
    setModerationTarget(target);
    setReportReason("spam");
    setReportNotes("");
    setShowReportModal(true);
  }, []);

  const openBlockModal = useCallback((target: ModerationTarget) => {
    setModerationTarget(target);
    setShowBlockModal(true);
  }, []);

  const closeReportModal = useCallback(() => {
    if (savingReport) {
      return;
    }
    setShowReportModal(false);
    setModerationTarget(null);
    setReportReason("spam");
    setReportNotes("");
  }, [savingReport]);

  const closeBlockModal = useCallback(() => {
    if (blockingAuthor) {
      return;
    }
    setShowBlockModal(false);
    setModerationTarget(null);
  }, [blockingAuthor]);

  const reactToPost = useCallback(
    async (post: CommunityPost, reactionType: CommunityReactionType) => {
      if (!user?.id) {
        setMessage("Sign in to react.");
        return;
      }

      const previousReactions = post.reactions;
      const nextReactions = buildOptimisticReactions(previousReactions, reactionType);
      setPosts((current) =>
        current.map((item) => (item.id === post.id ? { ...item, reactions: nextReactions } : item)),
      );
      if (selectedPost?.id === post.id) {
        setSelectedPost((current) => (current ? { ...current, reactions: nextReactions } : current));
      }

      try {
        await toggleCommunityReaction({ userId: user.id, postId: post.id, reactionType });
      } catch (error) {
        if (__DEV__) {
          console.error("[community] reaction failed", error);
        }
        setPosts((current) =>
          current.map((item) => (item.id === post.id ? { ...item, reactions: previousReactions } : item)),
        );
        if (selectedPost?.id === post.id) {
          setSelectedPost((current) => (current ? { ...current, reactions: previousReactions } : current));
        }
        setMessage("Reaction could not be saved.");
      }
    },
    [selectedPost?.id, user?.id],
  );

  const reactToComment = useCallback(
    async (comment: CommunityComment, reactionType: CommunityReactionType) => {
      if (!user?.id || !selectedPost) {
        setMessage("Sign in to react.");
        return;
      }

      const previousReactions = comment.reactions;
      const nextReactions = buildOptimisticReactions(previousReactions, reactionType);
      setComments((current) =>
        current.map((item) => (item.id === comment.id ? { ...item, reactions: nextReactions } : item)),
      );

      try {
        await toggleCommunityReaction({ userId: user.id, commentId: comment.id, reactionType });
      } catch (error) {
        if (__DEV__) {
          console.error("[community] reaction failed", error);
        }
        setComments((current) =>
          current.map((item) => (item.id === comment.id ? { ...item, reactions: previousReactions } : item)),
        );
        setMessage("Reaction could not be saved.");
      }
    },
    [selectedPost, user?.id],
  );

  const reportPost = useCallback(
    (post: CommunityPost) => {
      if (!user?.id) {
        setMessage("Sign in to report community content.");
        return;
      }
      openReportModal({ kind: "post", post });
    },
    [openReportModal, user?.id],
  );

  const reportComment = useCallback(
    (comment: CommunityComment) => {
      if (!user?.id) {
        setMessage("Sign in to report community content.");
        return;
      }
      openReportModal({ kind: "comment", comment });
    },
    [openReportModal, user?.id],
  );

  const submitReport = useCallback(async () => {
    if (!user?.id || !moderationTarget || savingReport) {
      return;
    }

    setSavingReport(true);
    setMessage("Submitting report...");
    try {
      if (moderationTarget.kind === "post") {
        await reportCommunityPost({
          reporterId: user.id,
          postId: moderationTarget.post.id,
          reportedUserId: moderationTarget.post.user_id,
          reason: reportReason,
          notes: reportNotes,
        });
      } else {
        await reportCommunityComment({
          reporterId: user.id,
          commentId: moderationTarget.comment.id,
          reportedUserId: moderationTarget.comment.user_id,
          reason: reportReason,
          notes: reportNotes,
        });
      }
      setShowReportModal(false);
      setModerationTarget(null);
      setReportNotes("");
      setReportReason("spam");
      setMessage("Report submitted ✓");
    } catch (error) {
      if (__DEV__) {
        console.error("[community] report failed", error);
      }
      const maybeError = error as { code?: unknown };
      if (maybeError?.code === "23505") {
        setShowReportModal(false);
        setModerationTarget(null);
        setReportNotes("");
        setReportReason("spam");
        setMessage("Report submitted ✓");
      } else {
        setMessage("Report could not be submitted.");
      }
    } finally {
      setSavingReport(false);
    }
  }, [moderationTarget, reportNotes, reportReason, savingReport, user?.id]);

  const confirmBlockAuthor = useCallback(async () => {
    if (!user?.id || !moderationTarget || blockingAuthor) {
      return;
    }

    const blockedUserId =
      moderationTarget.kind === "post" ? moderationTarget.post.user_id : moderationTarget.comment.user_id;

    setBlockingAuthor(true);
    setMessage("Blocking author...");
    try {
      await blockCommunityUser({
        blockerId: user.id,
        blockedUserId,
      });
      setBlockedUserIds((current) => new Set([...current, blockedUserId]));
      setPosts((current) => current.filter((post) => post.user_id !== blockedUserId));
      setComments((current) => current.filter((comment) => comment.user_id !== blockedUserId));
      if (selectedPost?.user_id === blockedUserId) {
        setSelectedPost(null);
      }
      setShowBlockModal(false);
      setModerationTarget(null);
      setMessage("Author blocked ✓");
    } catch (error) {
      if (__DEV__) {
        console.error("[community] block failed", error);
      }
      setMessage("Author could not be blocked.");
    } finally {
      setBlockingAuthor(false);
    }
  }, [blockingAuthor, moderationTarget, selectedPost?.user_id, user?.id]);

  const deletePost = useCallback(
    (post: CommunityPost) => {
      if (!user?.id || !isOwnedByCurrentUser(post.user_id, user.id)) {
        setMessage("You can only delete your own posts.");
        return;
      }

      if (__DEV__) {
        console.log("[community] delete ownership", {
          postId: post.id,
          postUserId: post.user_id,
          currentUserId: user.id,
        });
      }

      Alert.alert("Delete this post?", "This will hide the thread from Community.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                if (__DEV__) {
                  console.log("[community-delete-step]", "delete tapped", { kind: "thread", postId: post.id });
                }
                setDeletingThreadId(post.id);
                setMessage("Delete tapped");
                if (__DEV__) {
                  console.log("[community-delete-step]", "delete rpc started", { kind: "thread", postId: post.id });
                }
                setMessage("Delete RPC started");
                const didDelete = await hideCommunityPost({ postId: post.id, userId: user.id });
                if (!didDelete) {
                  setMessage("You can only delete your own posts.");
                  return;
                }
                if (__DEV__) {
                  console.log("[community-delete-step]", "rpc success", { kind: "thread", postId: post.id });
                }
                setPosts((current) => current.filter((item) => item.id !== post.id));
                setSelectedPost(null);
                setComments([]);
                setMessage("Thread deleted ✓");
                void loadCommunity("refresh");
                if (__DEV__) {
                  console.log("[community-delete-step]", "navigating away", { kind: "thread", postId: post.id });
                }
                setMessage("Navigating away");
                forceReturnToCommunityList("thread-delete");
              } catch (error) {
                if (__DEV__) {
                  console.error("[community] delete failed", error);
                }
                setMessage(
                  error instanceof Error && error.message === "Delete timed out"
                    ? "Delete is taking too long. Please try again."
                    : "Could not delete. Please try again.",
                );
              } finally {
                setDeletingThreadId((current) => (current === post.id ? null : current));
              }
            })();
          },
        },
      ]);
    },
    [forceReturnToCommunityList, loadCommunity, user?.id],
  );

  const deleteComment = useCallback(
    (comment: CommunityComment) => {
      if (!user?.id || !selectedPost || !isOwnedByCurrentUser(comment.user_id, user.id)) {
        setMessage("You can only delete your own posts.");
        return;
      }

      if (__DEV__) {
        console.log("[community] delete ownership", {
          postId: comment.id,
          postUserId: comment.user_id,
          currentUserId: user.id,
        });
      }

      Alert.alert("Delete this post?", "This will hide your reply from the thread.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                if (__DEV__) {
                  console.log("[community-delete-step]", "delete tapped", { kind: "reply", postId: comment.id });
                }
                setDeletingReplyId(comment.id);
                setMessage("Delete tapped");
                if (__DEV__) {
                  console.log("[community-delete-step]", "delete rpc started", { kind: "reply", postId: comment.id });
                }
                setMessage("Delete RPC started");
                const didDelete = await hideCommunityPost({ postId: comment.id, userId: user.id });
                if (!didDelete) {
                  setMessage("You can only delete your own posts.");
                  return;
                }
                if (__DEV__) {
                  console.log("[community-delete-step]", "rpc success", { kind: "reply", postId: comment.id });
                  console.log("[community] DELETE_SUCCESS", {
                    deletedReplyId: comment.id,
                  });
                }
                setComments((current) => current.filter((item) => item.id !== comment.id));
                setSelectedPost((current) =>
                  current ? { ...current, replyCount: Math.max(0, current.replyCount - 1) } : current,
                );
                setPosts((current) =>
                  current.map((post) =>
                    post.id === selectedPost.id
                      ? { ...post, replyCount: Math.max(0, post.replyCount - 1) }
                      : post,
                  ),
                );
                setMessage("Reply deleted ✓");
                void loadCommunity("refresh");
              } catch (error) {
                if (__DEV__) {
                  console.error("[community] delete failed", error);
                }
                setMessage(
                  error instanceof Error && error.message === "Delete timed out"
                    ? "Delete is taking too long. Please try again."
                    : "Could not delete. Please try again.",
                );
              } finally {
                setDeletingReplyId((current) => (current === comment.id ? null : current));
              }
            })();
          },
        },
      ]);
    },
    [loadCommunity, selectedPost, user?.id],
  );

  const categoryCounts = useMemo(() => {
    const counts = new Map<CommunityCategoryId, number>();
    for (const post of COMMUNITY_STARTER_POSTS) {
      counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
    }
    for (const post of posts) {
      if (post.isStarter) {
        continue;
      }
      counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
    }
    return counts;
  }, [posts]);
  const visiblePosts = useMemo(() => dedupeThreads(posts.filter((post) => !post.hidden)), [posts]);
  const visibleComments = useMemo(() => dedupeComments(comments.filter((comment) => !comment.hidden)), [comments]);
  const categoryLatestActivity = useMemo(() => {
    const latest = new Map<CommunityCategoryId, string>();
    for (const post of visiblePosts) {
      const current = latest.get(post.category);
      if (!current || new Date(post.created_at).getTime() > new Date(current).getTime()) {
        latest.set(post.category, post.created_at);
      }
    }
    return latest;
  }, [visiblePosts]);
  const selectedCategoryDetails = selectedCategory
    ? COMMUNITY_CATEGORIES.find((category) => category.id === selectedCategory) ?? null
    : null;
  const categoryThreads = useMemo(
    () => (selectedCategory ? visiblePosts.filter((post) => post.category === selectedCategory) : []),
    [selectedCategory, visiblePosts],
  );
  const recentThreads = useMemo(() => visiblePosts.slice(0, 5), [visiblePosts]);

  useEffect(() => {
    if (!__DEV__ || !selectedPost) {
      return;
    }

    console.log(
      "[community] ACTUAL_RENDERED_REPLIES",
      visibleComments.map((reply) => ({
        id: reply.id,
        is_hidden: reply.hidden,
        parent_id: reply.post_id,
        body: reply.body,
      })),
    );
  }, [selectedPost, visibleComments]);

  return (
    <AppScreen title="Community" subtitle="Practical questions, lived experience, and calm support from people who understand MS.">
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadCommunity("refresh")} />}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.guidelinesCard}>
          <View style={styles.guidelinesHeader}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />
            <AppText style={styles.guidelinesTitle}>Community guidelines</AppText>
          </View>
          <AppText style={styles.guidelinesText}>
            Share experience, not medical instructions. Be respectful. Avoid fear-based claims. Talk with a medical professional for medical decisions.
          </AppText>
        </View>

        {message ? <AppText style={styles.message}>{message}</AppText> : null}
        {publishState === "success" && selectedPost && recentlyPublishedPostId === selectedPost.id ? (
          <Animated.View
            style={[
              styles.publishSuccessCard,
              {
                opacity: publishFeedbackOpacity,
                transform: [{ scale: publishFeedbackScale }],
              },
            ]}
          >
            <View style={styles.publishSuccessHeader}>
              <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
              <AppText style={styles.publishSuccessTitle}>Post published ✓</AppText>
            </View>
            <AppText style={styles.publishSuccessBody}>Your thread is live and visible in Community now.</AppText>
          </Animated.View>
        ) : null}
        {loadFailed && posts.length === 0 ? (
          <View style={styles.errorCard}>
            <AppText style={styles.emptyTitle}>Community could not load right now.</AppText>
            <AppButton label="Try again" variant="secondary" onPress={() => void loadCommunity("refresh")} />
          </View>
        ) : null}

        {!selectedPost && !selectedCategory ? (
          <View style={styles.categoryOverview}>
            <View>
              <AppText style={styles.sectionTitle}>Forum categories</AppText>
              <AppText style={styles.sectionSubtitle}>Choose a category to read threads or ask a question.</AppText>
            </View>
            <View style={styles.categoryGrid}>
              {COMMUNITY_CATEGORIES.map((category) => (
                <Pressable
                  key={category.id}
                  accessibilityRole="button"
                  onPress={() => {
                    setSelectedCategory(category.id);
                    setComposerCategory(category.id);
                    setPostType(getDefaultCommunityPostType(category.id));
                    if (user?.id) {
                      void rememberCommunityCategory(user.id, category.id);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.categoryCard,
                    selectedCategory === category.id && styles.categoryCardSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText style={styles.categoryCardTitle}>{category.label}</AppText>
                  <AppText style={styles.categoryCardDescription}>{category.description}</AppText>
                  <AppText style={styles.categoryCardMeta}>
                    {categoryCounts.get(category.id) ?? 0} threads • Latest {timeAgo(categoryLatestActivity.get(category.id) ?? new Date().toISOString())}
                  </AppText>
                </Pressable>
              ))}
            </View>
            <View style={styles.section}>
              {communityActivitySummary.newReplies.length > 0 ? (
                <View style={styles.section}>
                  <AppText style={styles.sectionTitle}>New replies</AppText>
                  {communityActivitySummary.newReplies.map((item) => (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      onPress={() => void openActivityItem(item)}
                      style={({ pressed }) => [styles.activityCard, pressed && styles.pressed]}
                    >
                      <View style={styles.activityTopRow}>
                        <AppText style={styles.activityTypePill}>Reply</AppText>
                        <AppText style={styles.metaText}>{timeAgo(item.created_at)}</AppText>
                      </View>
                      <AppText style={styles.activityTitle}>{item.postTitle}</AppText>
                      <AppText style={styles.activityBody}>{item.actorDisplayName}: {item.preview}</AppText>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <AppText style={styles.sectionTitle}>{loadFailed ? "Starter discussions" : "Recent activity"}</AppText>
              {communityActivitySummary.recentActivity.length > 0 ? (
                communityActivitySummary.recentActivity.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() => void openActivityItem(item)}
                    style={({ pressed }) => [styles.activityCard, pressed && styles.pressed]}
                  >
                    <View style={styles.activityTopRow}>
                      <AppText style={styles.activityTypePill}>
                        {item.type === "reaction" ? "Reaction" : item.type === "reply" ? "Reply" : "New post"}
                      </AppText>
                      <AppText style={styles.metaText}>{timeAgo(item.created_at)}</AppText>
                    </View>
                    <AppText style={styles.activityTitle}>{item.postTitle}</AppText>
                    <AppText style={styles.activityBody}>{item.actorDisplayName}: {item.preview}</AppText>
                  </Pressable>
                ))
              ) : (
                recentThreads.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    canInteract={canInteractWithPost(post)}
                    onPress={() => void openPost(post)}
                    onReact={(reactionType) => void reactToPost(post, reactionType)}
                    onReport={() => reportPost(post)}
                  />
                ))
              )}
            </View>
          </View>
        ) : null}

        {selectedPost ? (
          <View style={styles.section}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setSelectedPost(null);
                setComments([]);
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={18} color={colors.accent} />
              <AppText style={styles.backButtonText}>Back to posts</AppText>
            </Pressable>
            <PostDetailCard
              post={selectedPost}
              canInteract={canInteractWithPost(selectedPost)}
              canDelete={isOwnedByCurrentUser(selectedPost.user_id, user?.id) && canInteractWithPost(selectedPost)}
              showPostedJustNow={publishState === "success" && recentlyPublishedPostId === selectedPost.id}
              onReact={(reactionType) => void reactToPost(selectedPost, reactionType)}
              onReport={() => {
                reportPost(selectedPost);
              }}
              onBlock={() => {
                if (selectedPost.user_id === user?.id) {
                  setMessage("You cannot block your own posts.");
                  return;
                }
                openBlockModal({ kind: "post", post: selectedPost });
              }}
              onDelete={() => deletePost(selectedPost)}
            />
            <View style={styles.replyHeader}>
              <AppText style={styles.sectionTitle}>Replies</AppText>
              <View style={styles.replyHeaderMeta}>
                {(deletingReplyId || deletingThreadId) ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : null}
                <AppText style={styles.metaText}>{visibleComments.length}</AppText>
              </View>
            </View>
            {visibleComments.length === 0 ? (
              <View style={styles.emptyCard}>
                <AppText style={styles.emptyTitle}>No replies yet.</AppText>
                <AppText style={styles.emptyText}>Share a practical response if you have one.</AppText>
              </View>
            ) : (
              visibleComments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  canInteract={canInteractWithComment(comment)}
                  canDelete={isOwnedByCurrentUser(comment.user_id, user?.id) && canInteractWithComment(comment)}
                  onReact={(reactionType) => void reactToComment(comment, reactionType)}
                  onReport={() => {
                    reportComment(comment);
                  }}
                  onBlock={() => {
                    if (comment.user_id === user?.id) {
                      setMessage("You cannot block your own posts.");
                      return;
                    }
                    openBlockModal({ kind: "comment", comment });
                  }}
                  onDelete={() => deleteComment(comment)}
                />
              ))
            )}
            {isAuthenticated ? (
              <View style={styles.composerCard}>
                <AppText style={styles.composerLabel}>Add a reply</AppText>
                <TextInput
                  value={commentBody}
                  onChangeText={setCommentBody}
                  placeholder="Share experience or a practical idea..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  maxLength={COMMENT_LIMIT}
                  style={[styles.input, styles.bodyInput]}
                  textAlignVertical="top"
                />
                <View style={styles.limitRow}>
                  <AppText style={styles.limitText}>{commentBody.length}/{COMMENT_LIMIT}</AppText>
                  {!hasPremiumAccess ? (
                    <AppText style={styles.limitText}>
                      {Math.max(0, FREE_DAILY_COMMUNITY_COMMENT_LIMIT - usage.commentsToday)} free replies left today
                    </AppText>
                  ) : null}
                </View>
                <AppButton
                  label={savingComment ? "Posting reply..." : "Add reply"}
                  onPress={submitComment}
                  disabled={!safeTrim(commentBody) || savingComment || freeCommentLimitReached}
                />
                {freeCommentLimitReached ? (
                  <AppButton label="View Premium" variant="secondary" onPress={() => router.push("/premium")} />
                ) : null}
              </View>
            ) : null}
          </View>
        ) : selectedCategoryDetails ? (
          <View style={styles.section}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setSelectedCategory(null);
                setShowComposer(false);
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={18} color={colors.accent} />
              <AppText style={styles.backButtonText}>Back to categories</AppText>
            </Pressable>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderCopy}>
                <AppText style={styles.sectionTitle}>{selectedCategoryDetails.label}</AppText>
                <AppText style={styles.sectionSubtitle}>{selectedCategoryDetails.description}</AppText>
              </View>
            </View>
            <AppButton
              label={selectedCategoryDetails.id === "app_suggestions" ? "Suggest an Improvement" : "New Thread"}
              onPress={() => {
                setShowComposer((value) => !value);
                setComposerCategory(selectedCategoryDetails.id);
                setPostType(getDefaultCommunityPostType(selectedCategoryDetails.id));
              }}
            />

            {showComposer ? (
              <View style={styles.composerCard}>
                <AppText style={styles.composerLabel}>{composerCategory === "app_suggestions" ? "Type" : "Post type"}</AppText>
                <View style={styles.chipWrap}>
                  {getCommunityPostTypesForCategory(composerCategory).map((type) => (
                    <CategoryChip
                      key={type.id}
                      label={type.label}
                      selected={postType === type.id}
                      onPress={() => setPostType(type.id)}
                    />
                  ))}
                </View>
                <AppText style={styles.composerLabel}>Title</AppText>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="What would you like to ask or share?"
                  placeholderTextColor={colors.textMuted}
                  maxLength={TITLE_LIMIT}
                  style={styles.input}
                />
                <AppText style={styles.composerLabel}>Details</AppText>
                <TextInput
                  value={body}
                  onChangeText={setBody}
                  placeholder="Keep it practical. Avoid medication instructions or diagnosis requests."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  maxLength={BODY_LIMIT}
                  style={[styles.input, styles.bodyInput]}
                  textAlignVertical="top"
                />
                <View style={styles.limitRow}>
                  <AppText style={styles.limitText}>{title.length}/{TITLE_LIMIT} title</AppText>
                  <AppText style={styles.limitText}>{body.length}/{BODY_LIMIT} post</AppText>
                </View>
                {!hasPremiumAccess ? (
                  <AppText style={styles.limitText}>
                    {Math.max(0, FREE_DAILY_COMMUNITY_POST_LIMIT - usage.postsToday)} free post left today
                  </AppText>
                ) : null}
                <View style={styles.buttonStack}>
                  <AppButton
                    label={savingPost ? "Publishing..." : "Post Thread"}
                    onPress={submitPost}
                    disabled={!safeTrim(title) || !safeTrim(body) || savingPost || freePostLimitReached}
                  />
                  <AppButton label="Cancel" variant="secondary" onPress={resetComposer} />
                  {freePostLimitReached ? (
                    <AppButton label="View Premium" variant="secondary" onPress={() => router.push("/premium")} />
                  ) : null}
                </View>
              </View>
            ) : null}

            {loading && categoryThreads.length === 0 ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color={colors.accent} />
                <AppText style={styles.emptyText}>Loading community...</AppText>
              </View>
            ) : categoryThreads.length === 0 ? (
              <View style={styles.emptyCard}>
                <AppText style={styles.emptyTitle}>No posts here yet.</AppText>
                <AppText style={styles.emptyText}>Start with a practical question or something that helped.</AppText>
              </View>
            ) : (
              categoryThreads.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  canInteract={canInteractWithPost(post)}
                  onPress={() => void openPost(post)}
                  onReact={(reactionType) => void reactToPost(post, reactionType)}
                  onReport={() => reportPost(post)}
                />
              ))
            )}
          </View>
        ) : null}

        <AppText style={styles.footerCopy}>Community posts are shared experiences, not medical advice.</AppText>
      </ScrollView>
      <Modal
        visible={showReportModal}
        transparent
        animationType="fade"
        onRequestClose={closeReportModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.nameModal}>
            <AppText style={styles.sectionTitle}>Why are you reporting this?</AppText>
            <AppText style={styles.sectionSubtitle}>Choose the closest reason. Reports help keep Community safe.</AppText>
            <View style={styles.chipWrap}>
              {COMMUNITY_REPORT_REASONS.map((reason) => (
                <CategoryChip
                  key={reason.id}
                  label={reason.label}
                  selected={reportReason === reason.id}
                  onPress={() => setReportReason(reason.id)}
                />
              ))}
            </View>
            <AppText style={styles.composerLabel}>Additional details</AppText>
            <TextInput
              value={reportNotes}
              onChangeText={setReportNotes}
              placeholder="Optional details"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={REPORT_NOTES_LIMIT}
              style={[styles.input, styles.reportNotesInput]}
              textAlignVertical="top"
            />
            <AppText style={styles.limitText}>{reportNotes.length}/{REPORT_NOTES_LIMIT}</AppText>
            <View style={styles.buttonStack}>
              <AppButton
                label={savingReport ? "Submitting..." : "Submit Report"}
                onPress={submitReport}
                disabled={savingReport}
              />
              <AppButton label="Cancel" variant="secondary" onPress={closeReportModal} disabled={savingReport} />
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showBlockModal}
        transparent
        animationType="fade"
        onRequestClose={closeBlockModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.nameModal}>
            <AppText style={styles.sectionTitle}>Block author?</AppText>
            <AppText style={styles.sectionSubtitle}>
              Hide future posts and replies from this user?
            </AppText>
            <View style={styles.blockSummaryCard}>
              <AuthorRow
                displayName={
                  moderationTarget?.kind === "post"
                    ? moderationTarget.post.display_name
                    : moderationTarget?.kind === "comment"
                      ? moderationTarget.comment.display_name
                      : "Community member"
                }
              />
            </View>
            <View style={styles.buttonStack}>
              <AppButton
                label={blockingAuthor ? "Blocking..." : "Block"}
                onPress={confirmBlockAuthor}
                disabled={blockingAuthor}
              />
              <AppButton label="Cancel" variant="secondary" onPress={closeBlockModal} disabled={blockingAuthor} />
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showNamePrompt}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNamePrompt(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.nameModal}>
            <AppText style={styles.sectionTitle}>Choose a community name</AppText>
            <AppText style={styles.sectionSubtitle}>This is the name shown on your community posts.</AppText>
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={32}
              placeholder="Community name"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <View style={styles.buttonStack}>
              <AppButton
                label={savingName ? "Saving..." : "Save community name"}
                onPress={saveCommunityNameFromPrompt}
                disabled={savingName || !safeTrim(nameDraft)}
              />
              <AppButton label="Cancel" variant="secondary" onPress={() => setShowNamePrompt(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

function CategoryChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.categoryChip, selected && styles.categoryChipSelected, pressed && styles.pressed]}
    >
      <AppText style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>{label}</AppText>
    </Pressable>
  );
}

function PostCard({
  post,
  canInteract,
  onPress,
  onReact,
  onReport,
}: {
  post: CommunityPost;
  canInteract: boolean;
  onPress: () => void;
  onReact: (reactionType: CommunityReactionType) => void;
  onReport: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.postCard, pressed && styles.pressed]}>
      <View style={styles.postTopRow}>
        <AppText style={styles.typePill}>{getCommunityPostTypeLabel(post.post_type)}</AppText>
        <AppText style={styles.metaText}>{timeAgo(post.created_at)}</AppText>
      </View>
      <AuthorRow displayName={post.display_name} />
      <AppText style={styles.postTitle}>{post.title}</AppText>
      <AppText style={styles.postPreview}>{previewText(post.body)}</AppText>
      {canInteract ? <ReactionBar reactions={post.reactions} onReact={onReact} /> : null}
      <View style={styles.postMetaRow}>
        <AppText style={styles.metaText}>{getCommunityCategoryLabel(post.category)}</AppText>
        <AppText style={styles.metaText}>{post.replyCount} replies</AppText>
        {canInteract ? (
          <Pressable
            accessibilityRole="button"
            onPress={(event) => {
              event.stopPropagation();
              onReport();
            }}
            hitSlop={8}
          >
            <AppText style={styles.reportText}>Report</AppText>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

function PostDetailCard({
  post,
  canInteract,
  canDelete,
  showPostedJustNow = false,
  onReact,
  onReport,
  onBlock,
  onDelete,
}: {
  post: CommunityPost;
  canInteract: boolean;
  canDelete: boolean;
  showPostedJustNow?: boolean;
  onReact: (reactionType: CommunityReactionType) => void;
  onReport: () => void;
  onBlock: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.detailCard}>
      <View style={styles.postTopRow}>
        <AppText style={styles.typePill}>{getCommunityPostTypeLabel(post.post_type)}</AppText>
        <AppText style={styles.metaText}>{showPostedJustNow ? "Posted just now" : timeAgo(post.created_at)}</AppText>
      </View>
      <AuthorRow displayName={post.display_name} />
      <AppText style={styles.detailTitle}>{post.title}</AppText>
      {showPostedJustNow ? (
        <View style={styles.justNowRow}>
          <Ionicons name="checkmark-circle" size={14} color={colors.accent} />
          <AppText style={styles.justNowText}>Posted just now</AppText>
        </View>
      ) : null}
      <AppText style={styles.detailBody}>{post.body}</AppText>
      {canInteract ? <ReactionBar reactions={post.reactions} onReact={onReact} /> : null}
      <View style={styles.postMetaRow}>
        <AppText style={styles.metaText}>{getCommunityCategoryLabel(post.category)}</AppText>
        {canInteract ? (
          <>
            <Pressable accessibilityRole="button" onPress={onReport} hitSlop={8}>
              <AppText style={styles.reportText}>Report</AppText>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onBlock} hitSlop={8}>
              <AppText style={styles.reportText}>Block author</AppText>
            </Pressable>
          </>
        ) : null}
        {canDelete ? (
          <Pressable accessibilityRole="button" onPress={onDelete} hitSlop={8}>
            <AppText style={styles.reportText}>Delete</AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function CommentCard({
  comment,
  canInteract,
  canDelete,
  onReact,
  onReport,
  onBlock,
  onDelete,
}: {
  comment: CommunityComment;
  canInteract: boolean;
  canDelete: boolean;
  onReact: (reactionType: CommunityReactionType) => void;
  onReport: () => void;
  onBlock: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.commentCard}>
      <View style={styles.postTopRow}>
        <AuthorRow displayName={comment.display_name} compact />
        <AppText style={styles.metaText}>{timeAgo(comment.created_at)}</AppText>
      </View>
      <AppText style={styles.commentBody}>{comment.body}</AppText>
      {canInteract ? <ReactionBar reactions={comment.reactions} onReact={onReact} /> : null}
      <View style={styles.commentActions}>
        {canInteract ? (
          <>
            <Pressable accessibilityRole="button" onPress={onReport} hitSlop={8}>
              <AppText style={styles.reportText}>Report</AppText>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onBlock} hitSlop={8}>
              <AppText style={styles.reportText}>Block</AppText>
            </Pressable>
          </>
        ) : null}
        {canDelete ? (
          <Pressable accessibilityRole="button" onPress={onDelete} hitSlop={8}>
            <AppText style={styles.reportText}>Delete</AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function AuthorRow({ displayName, compact = false }: { displayName: string; compact?: boolean }) {
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CM";

  return (
    <View style={styles.authorRow}>
      <View style={[styles.avatar, compact && styles.avatarCompact]}>
        <AppText style={[styles.avatarText, compact && styles.avatarTextCompact]}>{initials}</AppText>
      </View>
      <AppText style={styles.authorName}>{displayName || "Community member"}</AppText>
    </View>
  );
}

function ReactionBar({
  reactions,
  onReact,
}: {
  reactions: CommunityReactionSummary[];
  onReact: (reactionType: CommunityReactionType) => void;
}) {
  const reactionMap = new Map(reactions.map((reaction) => [reaction.reaction_type, reaction]));

  return (
    <View style={styles.reactionRow}>
      {COMMUNITY_REACTIONS.map((reaction) => {
        const summary = reactionMap.get(reaction.id);
        const active = Boolean(summary?.reactedByMe);
        return (
          <Pressable
            key={reaction.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={reaction.label}
            onPress={() => onReact(reaction.id)}
            style={({ pressed }) => [
              styles.reactionButton,
              active && styles.reactionButtonActive,
              pressed && styles.pressed,
            ]}
          >
            <AppText style={[styles.reactionText, active && styles.reactionTextActive]}>
              {reaction.emoji} {summary?.count ?? 0}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.screenX,
    paddingBottom: 120,
    gap: 16,
  },
  guidelinesCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.compactCardPadding,
    gap: 10,
    ...shadows.soft,
  },
  guidelinesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  guidelinesTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: colors.text,
  },
  guidelinesText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textBody,
  },
  categoryRow: {
    gap: 8,
    paddingRight: 18,
  },
  categoryChip: {
    minHeight: 42,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: "center",
  },
  categoryChipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  categoryChipText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: colors.textMuted,
  },
  categoryChipTextSelected: {
    color: colors.accent,
  },
  categoryOverview: {
    gap: 12,
  },
  categoryGrid: {
    gap: 10,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.compactCardPadding,
    gap: 6,
    ...shadows.soft,
  },
  categoryCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  categoryCardTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: colors.text,
  },
  categoryCardDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textBody,
  },
  categoryCardMeta: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    color: colors.textMuted,
  },
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.compactCardPadding,
    gap: 6,
    ...shadows.soft,
  },
  activityTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  activityTypePill: {
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: colors.accent,
  },
  activityTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: colors.text,
  },
  activityBody: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textBody,
  },
  message: {
    borderRadius: radii.card,
    backgroundColor: colors.surfaceAccent,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  publishSuccessCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
    ...shadows.soft,
  },
  publishSuccessHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  publishSuccessTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: colors.text,
  },
  publishSuccessBody: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textBody,
  },
  section: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
  },
  sectionHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  composerCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.cardLarge,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
    gap: 12,
    ...shadows.soft,
  },
  composerLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: colors.text,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
  },
  bodyInput: {
    minHeight: 116,
  },
  reportNotesInput: {
    minHeight: 100,
  },
  limitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  limitText: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  buttonStack: {
    gap: 10,
  },
  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
    alignItems: "center",
    gap: 10,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
    gap: 6,
  },
  errorCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.compactCardPadding,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: colors.text,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  postCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
    gap: 10,
    ...shadows.soft,
  },
  postTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCompact: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    color: colors.accent,
  },
  avatarTextCompact: {
    fontSize: 10,
    lineHeight: 14,
  },
  authorName: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: colors.text,
  },
  typePill: {
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: colors.accent,
  },
  postTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: colors.text,
  },
  postPreview: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textBody,
  },
  postMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  reactionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  reactionButton: {
    minHeight: 36,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 10,
    paddingVertical: 7,
    justifyContent: "center",
  },
  reactionButtonActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  reactionText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: colors.text,
  },
  reactionTextActive: {
    color: colors.accent,
  },
  metaText: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  reportText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    color: colors.textMuted,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    minHeight: 44,
  },
  backButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: colors.accent,
  },
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.cardLarge,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
    gap: 12,
    ...shadows.soft,
  },
  detailTitle: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "700",
    color: colors.text,
  },
  detailBody: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textBody,
  },
  justNowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  justNowText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    color: colors.accent,
  },
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  replyHeaderMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  commentCard: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.compactCardPadding,
    gap: 8,
  },
  commentBody: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textBody,
  },
  commentActions: {
    flexDirection: "row",
    gap: 14,
  },
  footerCopy: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    paddingHorizontal: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(31, 41, 55, 0.28)",
    justifyContent: "center",
    padding: 20,
  },
  nameModal: {
    backgroundColor: colors.surface,
    borderRadius: radii.cardLarge,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
    gap: 14,
    ...shadows.soft,
  },
  blockSummaryCard: {
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceWarm,
    padding: 12,
  },
  pressed: {
    opacity: 0.82,
  },
});
