import type {
  CommunityCategoryId,
  CommunityComment,
  CommunityPost,
  CommunityPostType,
  CommunityReactionType,
  CommunityReportReason,
} from "./types";

const COMMUNITY_SYSTEM_USER_ID = "10000000-0000-4000-8000-000000000100";

export const COMMUNITY_CATEGORIES: Array<{
  id: CommunityCategoryId;
  label: string;
  description: string;
}> = [
  {
    id: "symptoms-daily-life",
    label: "Symptoms & Daily Life",
    description: "Fatigue, brain fog, sensory overload, sleep, and daily routines.",
  },
  {
    id: "treatments-medications",
    label: "Treatments & Medications",
    description: "Experiences, side effects, appointments, and care questions.",
  },
  {
    id: "work-productivity",
    label: "Work & Productivity",
    description: "Workdays, pacing, planning, and reducing cognitive load.",
  },
  {
    id: "mental-emotional-health",
    label: "Mental & Emotional Health",
    description: "Stress, mood, identity changes, and practical coping.",
  },
  {
    id: "exercise-wellness",
    label: "Exercise & Wellness",
    description: "Movement, sleep, nutrition, hydration, and recovery routines.",
  },
  {
    id: "community-support",
    label: "Community Support",
    description: "Introductions, practical tips, and questions that do not fit elsewhere.",
  },
  {
    id: "app_suggestions",
    label: "App Suggestions",
    description: "Share feature ideas, improvements, and feedback for LiveWithMS.",
  },
];

export const STANDARD_COMMUNITY_POST_TYPES: Array<{
  id: CommunityPostType;
  label: string;
}> = [
  { id: "question", label: "Question" },
  { id: "experience", label: "Experience" },
  { id: "practical_tip", label: "Practical tip" },
];

export const COMMUNITY_SUGGESTION_TYPES: Array<{
  id: CommunityPostType;
  label: string;
}> = [
  { id: "feature_idea", label: "Feature idea" },
  { id: "bug_report", label: "Bug report" },
  { id: "improvement", label: "Improvement" },
  { id: "general_feedback", label: "General feedback" },
];

export const COMMUNITY_POST_TYPES = [...STANDARD_COMMUNITY_POST_TYPES, ...COMMUNITY_SUGGESTION_TYPES];

export const COMMUNITY_REPORT_REASONS: Array<{
  id: CommunityReportReason;
  label: string;
}> = [
  { id: "spam", label: "Spam" },
  { id: "harassment", label: "Harassment" },
  { id: "offensive_content", label: "Offensive content" },
  { id: "misinformation", label: "Misinformation" },
  { id: "other", label: "Other" },
];

export const FREE_DAILY_COMMUNITY_POST_LIMIT = 1;
export const FREE_DAILY_COMMUNITY_COMMENT_LIMIT = 3;

export const COMMUNITY_REACTIONS: Array<{
  id: CommunityReactionType;
  emoji: string;
  label: string;
}> = [
  { id: "heart", emoji: "❤️", label: "Heart" },
  { id: "helpful", emoji: "👍", label: "Helpful" },
  { id: "support", emoji: "🤝", label: "Support" },
  { id: "thanks", emoji: "🙏", label: "Thanks" },
];

export const COMMUNITY_STARTER_POSTS: CommunityPost[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    user_id: COMMUNITY_SYSTEM_USER_ID,
    display_name: "LiveWithMS",
    title: "How do you manage brain fog during workdays?",
    body: "I’m looking for practical ways to get through work tasks when focus drops. What helps you reduce mental load without making the day more complicated?",
    category: "work-productivity",
    post_type: "question",
    created_at: "2026-05-24T13:00:00.000Z",
    updated_at: "2026-05-24T13:00:00.000Z",
    hidden: false,
    report_count: 0,
    replyCount: 3,
    reactions: starterReactions({ heart: 5, thanks: 2, helpful: 4 }),
    isStarter: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    user_id: COMMUNITY_SYSTEM_USER_ID,
    display_name: "LiveWithMS",
    title: "What helps your fatigue the most?",
    body: "Not looking for a cure, just practical things that make fatigue easier to manage day to day. What has been worth keeping in your routine?",
    category: "symptoms-daily-life",
    post_type: "question",
    created_at: "2026-05-23T18:25:00.000Z",
    updated_at: "2026-05-23T18:25:00.000Z",
    hidden: false,
    report_count: 0,
    replyCount: 3,
    reactions: starterReactions({ heart: 6, thanks: 3, support: 4 }),
    isStarter: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    user_id: COMMUNITY_SYSTEM_USER_ID,
    display_name: "LiveWithMS",
    title: "How do you prepare for appointments?",
    body: "I forget things once I’m in the room. What do you bring or write down ahead of time so the appointment is easier to use well?",
    category: "treatments-medications",
    post_type: "question",
    created_at: "2026-05-22T15:10:00.000Z",
    updated_at: "2026-05-22T15:10:00.000Z",
    hidden: false,
    report_count: 0,
    replyCount: 3,
    reactions: starterReactions({ thanks: 5, helpful: 3 }),
    isStarter: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    user_id: COMMUNITY_SYSTEM_USER_ID,
    display_name: "LiveWithMS",
    title: "Anyone else feel overstimulated easily?",
    body: "Busy spaces, noise, and multiple conversations can make symptoms feel harder to manage. What helps you lower stimulation before it builds too much?",
    category: "mental-emotional-health",
    post_type: "experience",
    created_at: "2026-05-21T20:15:00.000Z",
    updated_at: "2026-05-21T20:15:00.000Z",
    hidden: false,
    report_count: 0,
    replyCount: 2,
    reactions: starterReactions({ heart: 4, support: 5 }),
    isStarter: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    user_id: COMMUNITY_SYSTEM_USER_ID,
    display_name: "LiveWithMS",
    title: "Small heat-sensitivity strategies that actually help",
    body: "Warm days can change what feels possible. What practical adjustments help you keep plans realistic when heat is a factor?",
    category: "symptoms-daily-life",
    post_type: "practical_tip",
    created_at: "2026-05-20T12:40:00.000Z",
    updated_at: "2026-05-20T12:40:00.000Z",
    hidden: false,
    report_count: 0,
    replyCount: 2,
    reactions: starterReactions({ thanks: 3, helpful: 4 }),
    isStarter: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000006",
    user_id: COMMUNITY_SYSTEM_USER_ID,
    display_name: "LiveWithMS",
    title: "Movement ideas for lower-energy days",
    body: "What kinds of movement still feel manageable when energy is limited? I’m interested in low-pressure options that do not turn into a full routine.",
    category: "exercise-wellness",
    post_type: "question",
    created_at: "2026-05-19T16:30:00.000Z",
    updated_at: "2026-05-19T16:30:00.000Z",
    hidden: false,
    report_count: 0,
    replyCount: 2,
    reactions: starterReactions({ heart: 3, thanks: 2 }),
    isStarter: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000007",
    user_id: COMMUNITY_SYSTEM_USER_ID,
    display_name: "LiveWithMS",
    title: "What would have helped you early on?",
    body: "For people farther along: what practical information or routines would have helped in the first months after diagnosis?",
    category: "community-support",
    post_type: "question",
    created_at: "2026-05-18T14:45:00.000Z",
    updated_at: "2026-05-18T14:45:00.000Z",
    hidden: false,
    report_count: 0,
    replyCount: 2,
    reactions: starterReactions({ heart: 4, thanks: 3 }),
    isStarter: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000008",
    user_id: COMMUNITY_SYSTEM_USER_ID,
    display_name: "LiveWithMS",
    title: "Tracking side effects without overthinking it",
    body: "How do you keep track of possible medication side effects in a way that is useful for appointments but not stressful every day?",
    category: "treatments-medications",
    post_type: "question",
    created_at: "2026-05-17T11:20:00.000Z",
    updated_at: "2026-05-17T11:20:00.000Z",
    hidden: false,
    report_count: 0,
    replyCount: 2,
    reactions: starterReactions({ thanks: 4, helpful: 2 }),
    isStarter: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000009",
    user_id: COMMUNITY_SYSTEM_USER_ID,
    display_name: "LiveWithMS",
    title: "What feature would help you most?",
    body: "If LiveWithMS could make one part of daily tracking, planning, or care organization easier, what would be most useful?",
    category: "app_suggestions",
    post_type: "feature_idea",
    created_at: "2026-05-24T10:15:00.000Z",
    updated_at: "2026-05-24T10:15:00.000Z",
    hidden: false,
    report_count: 0,
    replyCount: 2,
    reactions: starterReactions({ helpful: 6, support: 3 }),
    isStarter: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000010",
    user_id: COMMUNITY_SYSTEM_USER_ID,
    display_name: "LiveWithMS",
    title: "What should we improve next?",
    body: "Which part of the app would feel more useful with a clearer flow, better wording, or less friction?",
    category: "app_suggestions",
    post_type: "improvement",
    created_at: "2026-05-23T09:30:00.000Z",
    updated_at: "2026-05-23T09:30:00.000Z",
    hidden: false,
    report_count: 0,
    replyCount: 2,
    reactions: starterReactions({ helpful: 4, heart: 2, support: 4 }),
    isStarter: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000011",
    user_id: COMMUNITY_SYSTEM_USER_ID,
    display_name: "LiveWithMS",
    title: "What feels confusing in the app?",
    body: "If anything takes extra effort to understand, this is a good place to name it. Short, specific examples are helpful.",
    category: "app_suggestions",
    post_type: "general_feedback",
    created_at: "2026-05-22T08:50:00.000Z",
    updated_at: "2026-05-22T08:50:00.000Z",
    hidden: false,
    report_count: 0,
    replyCount: 2,
    reactions: starterReactions({ thanks: 3, helpful: 3 }),
    isStarter: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000012",
    user_id: COMMUNITY_SYSTEM_USER_ID,
    display_name: "LiveWithMS",
    title: "What would make tracking easier?",
    body: "What would reduce the effort of checking in, noticing patterns, or bringing useful notes to appointments?",
    category: "app_suggestions",
    post_type: "feature_idea",
    created_at: "2026-05-21T12:05:00.000Z",
    updated_at: "2026-05-21T12:05:00.000Z",
    hidden: false,
    report_count: 0,
    replyCount: 2,
    reactions: starterReactions({ helpful: 5, support: 2 }),
    isStarter: true,
  },
];

export const COMMUNITY_STARTER_COMMENTS: Record<string, CommunityComment[]> = {
  "10000000-0000-4000-8000-000000000001": [
    starterComment("10000000-0000-4000-8000-000000000001", 1, "I write the next step on paper, not the whole task. It keeps me from rereading the same thing over and over."),
    starterComment("10000000-0000-4000-8000-000000000001", 2, "Reducing tabs helps me. One document, one note, one timer if I need it."),
    starterComment("10000000-0000-4000-8000-000000000001", 3, "I try to schedule the thinking-heavy part earlier and keep admin tasks for later if possible."),
  ],
  "10000000-0000-4000-8000-000000000002": [
    starterComment("10000000-0000-4000-8000-000000000002", 1, "Planning around my actual energy instead of my ideal energy has helped the most."),
    starterComment("10000000-0000-4000-8000-000000000002", 2, "I keep a short list of tasks that can be done seated. It helps on days when standing is the problem."),
    starterComment("10000000-0000-4000-8000-000000000002", 3, "Earlier rest works better for me than waiting until I’m already wiped out."),
  ],
  "10000000-0000-4000-8000-000000000003": [
    starterComment("10000000-0000-4000-8000-000000000003", 1, "I bring three bullets: what changed, what I’m worried about, and what I need a decision on."),
    starterComment("10000000-0000-4000-8000-000000000003", 2, "Medication changes go in a separate note so I don’t lose them inside symptom details."),
    starterComment("10000000-0000-4000-8000-000000000003", 3, "I ask at the start if I can check my notes. That makes it easier to use them."),
  ],
  "10000000-0000-4000-8000-000000000004": [
    starterComment("10000000-0000-4000-8000-000000000004", 1, "I leave earlier than I used to. It is easier to recover from a shorter outing than from pushing too long."),
    starterComment("10000000-0000-4000-8000-000000000004", 2, "Noise-cancelling earbuds help in stores, even without music."),
  ],
  "10000000-0000-4000-8000-000000000005": [
    starterComment("10000000-0000-4000-8000-000000000005", 1, "I move errands to the morning when I can and keep the afternoon simpler."),
    starterComment("10000000-0000-4000-8000-000000000005", 2, "Cooling towels and shade breaks help, but the biggest thing is making plans smaller."),
  ],
  "10000000-0000-4000-8000-000000000006": [
    starterComment("10000000-0000-4000-8000-000000000006", 1, "Stretching while seated is easier for me to start than a full walk."),
    starterComment("10000000-0000-4000-8000-000000000006", 2, "I count gentle movement as movement. That lowered the pressure and made it more consistent."),
  ],
  "10000000-0000-4000-8000-000000000007": [
    starterComment("10000000-0000-4000-8000-000000000007", 1, "I wish I had tracked questions between appointments. I forgot them when things felt rushed."),
    starterComment("10000000-0000-4000-8000-000000000007", 2, "Finding a simple symptom log helped me explain changes without trying to remember everything."),
  ],
  "10000000-0000-4000-8000-000000000008": [
    starterComment("10000000-0000-4000-8000-000000000008", 1, "I note date, symptom, and whether anything else was different that day. Short notes are easier to keep up with."),
    starterComment("10000000-0000-4000-8000-000000000008", 2, "I separate side effects from medication decisions. The note is just information to bring to my provider."),
  ],
  "10000000-0000-4000-8000-000000000009": [
    starterComment("10000000-0000-4000-8000-000000000009", 1, "A simple way to pin appointment questions would help me. I forget which note I wrote them in."),
    starterComment("10000000-0000-4000-8000-000000000009", 2, "More shortcuts for low-energy days would be useful, especially when I do not want to navigate much."),
  ],
  "10000000-0000-4000-8000-000000000010": [
    starterComment("10000000-0000-4000-8000-000000000010", 1, "I would like clearer saved summaries from tools so I can find them later."),
    starterComment("10000000-0000-4000-8000-000000000010", 2, "Anything that makes the Community easier to scan would help."),
  ],
  "10000000-0000-4000-8000-000000000011": [
    starterComment("10000000-0000-4000-8000-000000000011", 1, "Sometimes I am not sure where a tool result goes after I finish it."),
    starterComment("10000000-0000-4000-8000-000000000011", 2, "The difference between Programs and Coach could be clearer."),
  ],
  "10000000-0000-4000-8000-000000000012": [
    starterComment("10000000-0000-4000-8000-000000000012", 1, "Fewer taps for the daily check-in would help on brain fog days."),
    starterComment("10000000-0000-4000-8000-000000000012", 2, "I would use tracking more if I could add one short note without opening a full form."),
  ],
};

function starterComment(postId: string, index: number, body: string): CommunityComment {
  return {
    id: `20000000-0000-4000-8000-${postId.slice(-11)}${String(index).padStart(1, "0")}`,
    post_id: postId,
    user_id: COMMUNITY_SYSTEM_USER_ID,
    display_name: "LiveWithMS",
    body,
    created_at: "2026-05-24T12:00:00.000Z",
    hidden: false,
    report_count: 0,
    reactions: [],
    isStarter: true,
  };
}

function starterReactions(counts: Partial<Record<CommunityReactionType, number>>) {
  return COMMUNITY_REACTIONS.map((reaction) => ({
    reaction_type: reaction.id,
    count: counts[reaction.id] ?? 0,
    reactedByMe: false,
  })).filter((reaction) => reaction.count > 0);
}

export function getCommunityCategoryLabel(category: CommunityCategoryId) {
  return COMMUNITY_CATEGORIES.find((item) => item.id === category)?.label ?? "Community";
}

export function getCommunityPostTypeLabel(type: CommunityPostType) {
  return COMMUNITY_POST_TYPES.find((item) => item.id === type)?.label ?? "Post";
}

export function getCommunityPostTypesForCategory(category: CommunityCategoryId) {
  return category === "app_suggestions" ? COMMUNITY_SUGGESTION_TYPES : STANDARD_COMMUNITY_POST_TYPES;
}

export function getDefaultCommunityPostType(category: CommunityCategoryId): CommunityPostType {
  return category === "app_suggestions" ? "feature_idea" : "question";
}
