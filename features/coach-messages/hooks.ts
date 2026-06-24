import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coachMessagesApi } from "./api";
import type { CoachChatMessage, SendCoachMessageInput } from "./types";

export function mergeCoachMessages(
  existing: CoachChatMessage[] | undefined,
  nextMessages: CoachChatMessage[],
) {
  const merged = [...(existing ?? [])];
  const knownIds = new Set(merged.map((message) => message.id));

  for (const message of nextMessages) {
    if (!knownIds.has(message.id)) {
      merged.push(message);
      knownIds.add(message.id);
    }
  }

  return merged;
}

export function useCoachMessages(userId?: string) {
  return useQuery({
    queryKey: ["coach-messages", userId],
    queryFn: () => {
      if (!userId) {
        throw new Error("Missing user id for coach messages query");
      }

      return coachMessagesApi.listCoachMessages(userId);
    },
    enabled: !!userId,
    retry: false,
    staleTime: 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: false,
  });
}

export function useSendCoachMessage(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendCoachMessageInput) => coachMessagesApi.sendCoachMessage(input),
    onMutate: async (input) => {
      if (!userId) {
        return { optimisticId: null as string | null };
      }

      const optimisticId = `optimistic-user-${Date.now()}`;
      queryClient.setQueryData<CoachChatMessage[]>(
        ["coach-messages", userId],
        (existing) =>
          mergeCoachMessages(existing, [
            {
              id: optimisticId,
              user_id: userId,
              role: "user",
              content: input.message,
              created_at: new Date().toISOString(),
            },
          ]),
      );

      console.log("[coach] message appended locally", {
        userId,
        optimisticId,
        contentLength: input.message.length,
        mode: input.mode,
      });

      return { optimisticId };
    },
    onSuccess: (data, _variables, context) => {
      if (!userId) {
        return;
      }

      console.log("[coach] assistant response received", {
        userId,
        optimisticId: context?.optimisticId ?? null,
        userMessageId: data.userMessage.id,
        assistantMessageId: data.assistantMessage.id,
      });

      queryClient.setQueryData<CoachChatMessage[]>(
        ["coach-messages", userId],
        (existing) =>
          mergeCoachMessages(
            (existing ?? []).filter((message) => message.id !== context?.optimisticId),
            [data.userMessage, data.assistantMessage],
          ),
      );

      console.log("[coach] assistant message inserted", {
        userId,
        assistantMessageId: data.assistantMessage.id,
      });
    },
    onError: (error, _variables, context) => {
      if (!userId || !context?.optimisticId) {
        return;
      }

      queryClient.setQueryData<CoachChatMessage[]>(
        ["coach-messages", userId],
        (existing) => (existing ?? []).filter((message) => message.id !== context.optimisticId),
      );

      console.error("[coach] assistant response failed", {
        userId,
        optimisticId: context.optimisticId,
        error: error instanceof Error ? error.message : String(error),
      });
    },
  });
}
