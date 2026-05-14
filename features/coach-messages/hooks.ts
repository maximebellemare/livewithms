import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coachMessagesApi } from "./api";
import type { CoachChatMessage, SendCoachMessageInput } from "./types";

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
    onSuccess: (data) => {
      if (!userId) {
        return;
      }

      queryClient.setQueryData<CoachChatMessage[]>(
        ["coach-messages", userId],
        (existing) => [...(existing ?? []), data.userMessage, data.assistantMessage],
      );
    },
  });
}
