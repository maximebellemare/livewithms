export type CoachMessageRole = "user" | "assistant";
export type CoachMode = "reflect" | "calm" | "practical" | "encouragement";

export type CoachChatMessage = {
  id: string;
  user_id: string;
  role: CoachMessageRole;
  content: string;
  created_at: string;
};

export type CoachContext = {
  fatigue: number | null;
  mood: number | null;
  stress: number | null;
  sleep_hours: number | null;
  recent_reflection: string | null;
};

export type SendCoachMessageInput = {
  message: string;
  context: CoachContext;
  mode: CoachMode;
};

export type SendCoachMessageResult = {
  userMessage: CoachChatMessage;
  assistantMessage: CoachChatMessage;
  safetyMode: "normal" | "medical-boundary" | "crisis";
};
