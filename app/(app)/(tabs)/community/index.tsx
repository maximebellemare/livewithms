import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  reportCommunityComment,
  reportCommunityPost,
  toggleCommunityReaction,
  upsertCommunityProfile,
} from "../../../../features/community/api";
import {
  COMMUNITY_CATEGORIES,
  COMMUNITY_REACTIONS,
  COMMUNITY_REPORT_REASONS,
  COMMUNITY_STARTER_COMMENTS,
  COMMUNITY_STARTER_POSTS,
  FREE_DAILY_COMMUNITY_COMMENT_LIMIT,
  FREE_DAILY_COMMUNITY_POST_LIMIT,
  getCommunityPostTypesForCategory,
  getCommunityCategoryLabel,
  getDefaultCommunityPostType,
  getCommunityPostTypeLabel,
} from "../../../../features/community/constants";
import type {
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
import { usePremium } from "../../../../features/premium/hooks";

type CommunityFilter = CommunityCategoryId | null;

const TITLE_LIMIT = 120;
const BODY_LIMIT = 2000;
const COMMENT_LIMIT = 1200;

function safeTrim(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

  const hasPremiumAccess = premium.hasPremiumAccess;
  const freePostLimitReached = !hasPremiumAccess && usage.postsToday >= FREE_DAILY_COMMUNITY_POST_LIMIT;
  const freeCommentLimitReached = !hasPremiumAccess && usage.commentsToday >= FREE_DAILY_COMMUNITY_COMMENT_LIMIT;
  const displayName = useMemo(() => getSafeDisplayName(profileDisplayName), [profileDisplayName]);

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
        const visibleTitles = new Set(visiblePosts.map((post) => safeTrim(post.title).toLowerCase()));
        const starterPosts = COMMUNITY_STARTER_POSTS.filter((post) => !visibleTitles.has(safeTrim(post.title).toLowerCase()));
        setBlockedUserIds(nextBlockedSet);
        setPosts([...visiblePosts, ...starterPosts]);
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
    }, [loadCommunity]),
  );

  const openPost = useCallback(
    async (post: CommunityPost) => {
      setSelectedPost(post);
      setComments([]);
      if (post.isStarter) {
        setComments(COMMUNITY_STARTER_COMMENTS[post.id] ?? []);
        return;
      }
      try {
        const nextComments = await fetchCommunityComments(post.id, user?.id);
        setComments(nextComments.filter((comment) => !blockedUserIds.has(comment.user_id)));
      } catch {
        setMessage("Replies could not load right now.");
      }
    },
    [blockedUserIds, user?.id],
  );

  const resetComposer = useCallback(() => {
    const nextCategory = selectedCategory ?? "symptoms-daily-life";
    setTitle("");
    setBody("");
    setPostType(getDefaultCommunityPostType(nextCategory));
    setComposerCategory(nextCategory);
    setShowComposer(false);
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
    try {
      await createCommunityPost({
        userId: user.id,
        displayName,
        title: trimmedTitle,
        body: trimmedBody,
        category: composerCategory,
        postType,
      });
      resetComposer();
      await loadCommunity("refresh");
      setMessage("Post shared.");
    } catch {
      setMessage("Post could not be shared right now.");
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
  ]);

  const submitComment = useCallback(async () => {
    if (!user?.id || !selectedPost || savingComment) {
      return;
    }
    if (displayName === "Community member") {
      setNameDraft("");
      setShowNamePrompt(true);
      return;
    }
    const trimmedBody = safeTrim(commentBody);
    if (!trimmedBody) {
      return;
    }
    if (freeCommentLimitReached) {
      setMessage("Free replies are limited today. Premium includes more posting room.");
      return;
    }

    setSavingComment(true);
    try {
      await createCommunityComment({
        postId: selectedPost.id,
        userId: user.id,
        displayName,
        body: trimmedBody,
      });
      setCommentBody("");
      const nextComments = await fetchCommunityComments(selectedPost.id, user?.id);
      setComments(nextComments.filter((comment) => !blockedUserIds.has(comment.user_id)));
      await loadCommunity("refresh");
      setMessage("Reply added.");
    } catch {
      setMessage("Reply could not be shared right now.");
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
    blockedUserIds,
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

  const refreshThreadComments = useCallback(
    async (post: CommunityPost) => {
      if (post.isStarter) {
        setComments(COMMUNITY_STARTER_COMMENTS[post.id] ?? []);
        return;
      }
      const nextComments = await fetchCommunityComments(post.id, user?.id);
      setComments(nextComments.filter((comment) => !blockedUserIds.has(comment.user_id)));
    },
    [blockedUserIds, user?.id],
  );

  const reactToPost = useCallback(
    async (post: CommunityPost, reactionType: CommunityReactionType) => {
      if (!user?.id) {
        setMessage("Sign in to react.");
        return;
      }
      if (post.isStarter) {
        setMessage("Starter threads are read-only. Open a new thread to react or reply.");
        return;
      }

      try {
        await toggleCommunityReaction({ userId: user.id, postId: post.id, reactionType });
        const nextPosts = await fetchCommunityPosts(undefined, user.id);
        const nextPost = nextPosts.find((item) => item.id === post.id);
        if (nextPost) {
          setPosts((current) => current.map((item) => (item.id === nextPost.id ? nextPost : item)));
          if (selectedPost?.id === nextPost.id) {
            setSelectedPost(nextPost);
          }
        }
      } catch {
        setMessage("Reaction could not update right now.");
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
      if (comment.isStarter) {
        setMessage("Starter replies are read-only.");
        return;
      }

      try {
        await toggleCommunityReaction({ userId: user.id, commentId: comment.id, reactionType });
        await refreshThreadComments(selectedPost);
      } catch {
        setMessage("Reaction could not update right now.");
      }
    },
    [refreshThreadComments, selectedPost, user?.id],
  );

  const blockAuthor = useCallback(
    (blockedUserId: string) => {
      if (!user?.id) {
        setMessage("Sign in to block a community author.");
        return;
      }
      if (blockedUserId === user.id) {
        setMessage("You cannot block your own posts.");
        return;
      }

      Alert.alert(
        "Block author",
        "Posts and replies from this author will be hidden for you.",
        [
          {
            text: "Block author",
            style: "destructive",
            onPress: async () => {
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
                setMessage("Author blocked.");
              } catch {
                setMessage("Author could not be blocked right now.");
              }
            },
          },
          { text: "Cancel", style: "cancel" },
        ],
      );
    },
    [selectedPost?.user_id, user?.id],
  );

  const reportPost = useCallback(
    (post: CommunityPost) => {
      if (!user?.id) {
        setMessage("Sign in to report community content.");
        return;
      }

      Alert.alert(
        "Report post",
        "Choose the closest reason. Reports help keep Community safe.",
        [
          ...COMMUNITY_REPORT_REASONS.map((reason) => ({
            text: reason.label,
            onPress: async () => {
              try {
                await reportCommunityPost({
                  reporterId: user.id,
                  postId: post.id,
                  reason: reason.id as CommunityReportReason,
                });
                setMessage("Report sent.");
              } catch {
                setMessage("Report could not be sent right now.");
              }
            },
          })),
          { text: "Cancel", style: "cancel" as const },
        ],
      );
    },
    [user?.id],
  );

  const reportComment = useCallback(
    (comment: CommunityComment) => {
      if (!user?.id) {
        setMessage("Sign in to report community content.");
        return;
      }

      Alert.alert(
        "Report reply",
        "Choose the closest reason. Reports help keep Community safe.",
        [
          ...COMMUNITY_REPORT_REASONS.map((reason) => ({
            text: reason.label,
            onPress: async () => {
              try {
                await reportCommunityComment({
                  reporterId: user.id,
                  commentId: comment.id,
                  reason: reason.id as CommunityReportReason,
                });
                setMessage("Report sent.");
              } catch {
                setMessage("Report could not be sent right now.");
              }
            },
          })),
          { text: "Cancel", style: "cancel" as const },
        ],
      );
    },
    [user?.id],
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
  const categoryLatestActivity = useMemo(() => {
    const latest = new Map<CommunityCategoryId, string>();
    for (const post of posts) {
      const current = latest.get(post.category);
      if (!current || new Date(post.created_at).getTime() > new Date(current).getTime()) {
        latest.set(post.category, post.created_at);
      }
    }
    return latest;
  }, [posts]);
  const selectedCategoryDetails = selectedCategory
    ? COMMUNITY_CATEGORIES.find((category) => category.id === selectedCategory) ?? null
    : null;
  const categoryThreads = useMemo(
    () => (selectedCategory ? posts.filter((post) => post.category === selectedCategory) : []),
    [posts, selectedCategory],
  );
  const recentThreads = useMemo(() => posts.slice(0, 5), [posts]);

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
              <AppText style={styles.sectionTitle}>{loadFailed ? "Starter discussions" : "Recent activity"}</AppText>
              {recentThreads.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPress={() => void openPost(post)}
                  onReact={(reactionType) => void reactToPost(post, reactionType)}
                  onReport={() => {
                    if (post.isStarter) {
                      setMessage("Starter discussions are curated by LiveWithMS.");
                      return;
                    }
                    reportPost(post);
                  }}
                />
              ))}
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
              onReact={(reactionType) => void reactToPost(selectedPost, reactionType)}
              onReport={() => {
                if (selectedPost.isStarter) {
                  setMessage("Starter discussions are curated by LiveWithMS.");
                  return;
                }
                reportPost(selectedPost);
              }}
              onBlock={() => {
                if (selectedPost.isStarter) {
                  setMessage("Starter discussions are curated by LiveWithMS.");
                  return;
                }
                blockAuthor(selectedPost.user_id);
              }}
            />
            <View style={styles.replyHeader}>
              <AppText style={styles.sectionTitle}>Replies</AppText>
              <AppText style={styles.metaText}>{comments.length}</AppText>
            </View>
            {comments.length === 0 ? (
              <View style={styles.emptyCard}>
                <AppText style={styles.emptyTitle}>No replies yet.</AppText>
                <AppText style={styles.emptyText}>Share a practical response if you have one.</AppText>
              </View>
            ) : (
              comments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  onReact={(reactionType) => void reactToComment(comment, reactionType)}
                  onReport={() => {
                    if (comment.isStarter) {
                      setMessage("Starter replies are curated by LiveWithMS.");
                      return;
                    }
                    reportComment(comment);
                  }}
                  onBlock={() => {
                    if (comment.isStarter) {
                      setMessage("Starter replies are curated by LiveWithMS.");
                      return;
                    }
                    blockAuthor(comment.user_id);
                  }}
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
                  label={savingComment ? "Adding..." : "Add reply"}
                  onPress={submitComment}
                  disabled={!safeTrim(commentBody) || savingComment || freeCommentLimitReached || Boolean(selectedPost.isStarter)}
                />
                {selectedPost.isStarter ? (
                  <AppText style={styles.limitText}>Starter threads are read-only. Open a new thread to continue this topic.</AppText>
                ) : null}
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
                    label={savingPost ? "Posting..." : "Post Thread"}
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

            {loading ? (
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
                  onPress={() => void openPost(post)}
                  onReact={(reactionType) => void reactToPost(post, reactionType)}
                  onReport={() => {
                    if (post.isStarter) {
                      setMessage("Starter discussions are curated by LiveWithMS.");
                      return;
                    }
                    reportPost(post);
                  }}
                />
              ))
            )}
          </View>
        ) : null}

        <AppText style={styles.footerCopy}>Community posts are shared experiences, not medical advice.</AppText>
      </ScrollView>
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
  onPress,
  onReact,
  onReport,
}: {
  post: CommunityPost;
  onPress: () => void;
  onReact: (reactionType: CommunityReactionType) => void;
  onReport: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.postCard, pressed && styles.pressed]}>
      <View style={styles.postTopRow}>
        <AppText style={styles.typePill}>{post.isStarter ? "Starter thread" : getCommunityPostTypeLabel(post.post_type)}</AppText>
        <AppText style={styles.metaText}>{timeAgo(post.created_at)}</AppText>
      </View>
      <AuthorRow displayName={post.display_name} />
      <AppText style={styles.postTitle}>{post.title}</AppText>
      <AppText style={styles.postPreview}>{previewText(post.body)}</AppText>
      <ReactionBar reactions={post.reactions} onReact={onReact} />
      <View style={styles.postMetaRow}>
        <AppText style={styles.metaText}>{getCommunityCategoryLabel(post.category)}</AppText>
        <AppText style={styles.metaText}>{post.replyCount} replies</AppText>
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
      </View>
    </Pressable>
  );
}

function PostDetailCard({
  post,
  onReact,
  onReport,
  onBlock,
}: {
  post: CommunityPost;
  onReact: (reactionType: CommunityReactionType) => void;
  onReport: () => void;
  onBlock: () => void;
}) {
  return (
    <View style={styles.detailCard}>
      <View style={styles.postTopRow}>
        <AppText style={styles.typePill}>{post.isStarter ? "Starter thread" : getCommunityPostTypeLabel(post.post_type)}</AppText>
        <AppText style={styles.metaText}>{timeAgo(post.created_at)}</AppText>
      </View>
      <AuthorRow displayName={post.display_name} />
      <AppText style={styles.detailTitle}>{post.title}</AppText>
      <AppText style={styles.detailBody}>{post.body}</AppText>
      <ReactionBar reactions={post.reactions} onReact={onReact} />
      <View style={styles.postMetaRow}>
        <AppText style={styles.metaText}>{getCommunityCategoryLabel(post.category)}</AppText>
        <Pressable accessibilityRole="button" onPress={onReport} hitSlop={8}>
          <AppText style={styles.reportText}>Report</AppText>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onBlock} hitSlop={8}>
          <AppText style={styles.reportText}>Block author</AppText>
        </Pressable>
      </View>
    </View>
  );
}

function CommentCard({
  comment,
  onReact,
  onReport,
  onBlock,
}: {
  comment: CommunityComment;
  onReact: (reactionType: CommunityReactionType) => void;
  onReport: () => void;
  onBlock: () => void;
}) {
  return (
    <View style={styles.commentCard}>
      <View style={styles.postTopRow}>
        <AuthorRow displayName={comment.display_name} compact />
        <AppText style={styles.metaText}>{timeAgo(comment.created_at)}</AppText>
      </View>
      <AppText style={styles.commentBody}>{comment.body}</AppText>
      <ReactionBar reactions={comment.reactions} onReact={onReact} />
      <View style={styles.commentActions}>
        <Pressable accessibilityRole="button" onPress={onReport} hitSlop={8}>
          <AppText style={styles.reportText}>Report</AppText>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onBlock} hitSlop={8}>
          <AppText style={styles.reportText}>Block</AppText>
        </Pressable>
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
            accessibilityLabel={reaction.label}
            onPress={() => onReact(reaction.id)}
            style={({ pressed }) => [
              styles.reactionButton,
              active && styles.reactionButtonActive,
              pressed && styles.pressed,
            ]}
          >
            <AppText style={styles.reactionText}>
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
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  pressed: {
    opacity: 0.82,
  },
});
