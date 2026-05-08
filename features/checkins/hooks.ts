import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { checkinsApi } from "./api";
import type { DailyCheckIn, DailyCheckInInput } from "./types";

function mergeCheckInIntoHistory(
  existing: DailyCheckIn[] | undefined,
  nextItem: DailyCheckIn,
  limit?: number,
) {
  const nextItems = (existing ?? []).filter((item) => item.date !== nextItem.date);
  nextItems.push(nextItem);
  nextItems.sort((a, b) => b.date.localeCompare(a.date));

  return typeof limit === "number" ? nextItems.slice(0, limit) : nextItems;
}

export function useCheckInByDate(userId?: string, date?: string) {
  return useQuery({
    queryKey: ["daily-checkin", userId, date],
    queryFn: () => {
      if (!userId) {
        throw new Error("Missing user id for check-in query");
      }

      if (!date) {
        throw new Error("Missing date for check-in query");
      }

      return checkinsApi.getDailyCheckInByDate(userId, date);
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

export function useTodaysCheckIn(userId?: string, date?: string) {
  return useCheckInByDate(userId, date);
}

export function useCheckInHistory(userId?: string, limit = 30) {
  return useQuery({
    queryKey: ["daily-checkins", userId, limit],
    queryFn: () => {
      if (!userId) {
        throw new Error("Missing user id for check-in history query");
      }

      return checkinsApi.listDailyCheckIns(userId, limit);
    },
    enabled: !!userId,
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
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

      queryClient.setQueryData<DailyCheckIn[]>(
        ["daily-checkins", variables.userId, 30],
        (existing) => mergeCheckInIntoHistory(existing, data, 30),
      );

      queryClient.setQueryData<DailyCheckIn[]>(
        ["daily-checkins", variables.userId, 7],
        (existing) => mergeCheckInIntoHistory(existing, data, 7),
      );

      queryClient.setQueriesData<DailyCheckIn[] | undefined>(
        {
          queryKey: ["daily-checkins", variables.userId],
        },
        (existing) => mergeCheckInIntoHistory(existing, data),
      );

      void queryClient.invalidateQueries({
        queryKey: ["daily-checkins", variables.userId],
        refetchType: "all",
      });
    },
  });
}
