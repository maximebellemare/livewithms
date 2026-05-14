import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coachPlansApi } from "./api";
import type { CoachPlan, CoachPlanInput } from "./types";

export function useCoachPlan(userId?: string, date?: string) {
  return useQuery({
    queryKey: ["coach-plan", userId, date],
    queryFn: () => {
      if (!userId) {
        throw new Error("Missing user id for coach plan query.");
      }

      if (!date) {
        throw new Error("Missing date for coach plan query.");
      }

      return coachPlansApi.getCoachPlanByDate(userId, date);
    },
    enabled: !!userId && !!date,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
}

export function useSaveCoachPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      date,
      input,
    }: {
      userId: string;
      date: string;
      input: CoachPlanInput;
    }) => coachPlansApi.upsertCoachPlan(userId, date, input),
    onSuccess: (data, variables) => {
      queryClient.setQueryData<CoachPlan | null>(
        ["coach-plan", variables.userId, variables.date],
        data,
      );
    },
  });
}
