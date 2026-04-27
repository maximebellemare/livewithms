import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { checkinsApi } from "./api";
import type { DailyCheckIn, DailyCheckInInput } from "./types";

export function useTodaysCheckIn(userId?: string, date?: string) {
  return useQuery({
    queryKey: ["daily-checkin", userId, date],
    queryFn: () => {
      if (!userId) {
        throw new Error("Missing user id for today's check-in query");
      }

      if (!date) {
        throw new Error("Missing date for today's check-in query");
      }

      return checkinsApi.getTodaysCheckIn(userId, date);
    },
    enabled: !!userId && !!date,
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
}

export function useSaveDailyCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      date,
      input,
    }: {
      userId: string;
      date: string;
      input: DailyCheckInInput;
    }) => checkinsApi.upsertDailyCheckIn(userId, date, input),
    onSuccess: (data, variables) => {
      queryClient.setQueryData<DailyCheckIn | null>(
        ["daily-checkin", variables.userId, variables.date],
        data,
      );
    },
  });
}
