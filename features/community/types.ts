export type CommunityCategoryId =
  | "symptoms-daily-life"
  | "treatments-medications"
  | "work-productivity"
  | "mental-emotional-health"
  | "exercise-wellness"
  | "community-support"
  | "app_suggestions";

export type CommunityPostType =
  | "question"
  | "experience"
  | "practical_tip"
  | "feature_idea"
  | "bug_report"
  | "improvement"
  | "general_feedback";
export type CommunityReactionType = "heart" | "helpful" | "support" | "thanks";

export type CommunityReactionSummary = {
  reaction_type: CommunityReactionType;
  count: number;
  reactedByMe: boolean;
};

export type CommunityActivityType = "reply" | "reaction" | "post";

export type CommunityActivityItem = {
  id: string;
  type: CommunityActivityType;
  created_at: string;
  postId: string;
  postTitle: string;
  category: CommunityCategoryId;
  actorDisplayName: string;
  preview: string;
};

export type CommunityActivitySummary = {
  unreadCount: number;
  newReplies: CommunityActivityItem[];
  recentActivity: CommunityActivityItem[];
};

export type CommunityPost = {
  id: string;
  user_id: string;
  display_name: string;
  title: string;
  body: string;
  category: CommunityCategoryId;
  post_type: CommunityPostType;
  created_at: string;
  updated_at: string;
  hidden: boolean;
  report_count: number;
  replyCount: number;
  reactions: CommunityReactionSummary[];
  isStarter?: boolean;
};

export type CommunityComment = {
  id: string;
  post_id: string;
  user_id: string;
  display_name: string;
  body: string;
  created_at: string;
  hidden: boolean;
  report_count: number;
  reactions: CommunityReactionSummary[];
  isStarter?: boolean;
};

export type CommunityUsage = {
  postsToday: number;
  commentsToday: number;
};

export type CommunityBlock = {
  id: string;
  blocker_user_id: string;
  blocked_user_id: string;
  created_at: string;
};

export type CommunityReportReason =
  | "spam"
  | "harassment"
  | "offensive_content"
  | "misinformation"
  | "other";
