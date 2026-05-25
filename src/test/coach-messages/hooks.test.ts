import { describe, expect, it } from "vitest";
import { mergeCoachMessages } from "../../../features/coach-messages/hooks";
import type { CoachChatMessage } from "../../../features/coach-messages/types";

function makeMessage(id: string, role: CoachChatMessage["role"], content: string): CoachChatMessage {
  return {
    id,
    user_id: "user-1",
    role,
    content,
    created_at: "2026-05-22T10:00:00.000Z",
  };
}

describe("coach message helpers", () => {
  it("merges returned coach messages without duplicating existing ids", () => {
    const existing = [
      makeMessage("1", "user", "Hello"),
      makeMessage("2", "assistant", "Hi there"),
    ];

    const result = mergeCoachMessages(existing, [
      makeMessage("2", "assistant", "Hi there"),
      makeMessage("3", "user", "Help me think through what's stressing me"),
      makeMessage("4", "assistant", "Let's sort through the main pressure first."),
    ]);

    expect(result.map((message) => message.id)).toEqual(["1", "2", "3", "4"]);
  });
});
