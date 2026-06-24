import type { CoachMode } from "../coach-messages/types";

type CoachChatRouteInput = {
  autostart?: boolean;
  message?: string | null;
  messageId?: string | null;
  mode?: CoachMode | null;
  title?: string | null;
};

export function buildCoachChatHref(input: CoachChatRouteInput = {}) {
  const params = new URLSearchParams();

  if (input.autostart) {
    params.set("autostart", "1");
  }
  if (input.message?.trim()) {
    params.set("message", input.message.trim());
  }
  if (input.messageId?.trim()) {
    params.set("messageId", input.messageId.trim());
  }
  if (input.mode) {
    params.set("mode", input.mode);
  }
  if (input.title?.trim()) {
    params.set("title", input.title.trim());
  }

  const query = params.toString();
  return query.length > 0 ? `/coach-chat?${query}` : "/coach-chat";
}
