import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { checkinsApi } from "./api";
import type { DailyCheckIn, DailyCheckInInput } from "./types";

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

      queryClient.setQueriesData<DailyCheckIn[] | undefined>(
        {
          queryKey: ["daily-checkins", variables.userId],
        },
        (existing) => {
          if (!existing) {
            return existing;
          }

          const nextItems = existing.filter((item) => item.date !== data.date);
          nextItems.push(data);
          nextItems.sort((a, b) => b.date.localeCompare(a.date));

          return nextItems;
        },
      );

      void queryClient.invalidateQueries({
        queryKey: ["daily-checkins", variables.userId],
      });
    },
  });
}
