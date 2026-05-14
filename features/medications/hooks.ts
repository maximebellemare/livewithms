import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { medicationsApi } from "./api";
import type { MedicationInput } from "./types";

export function useMedications(userId?: string) {
  return useQuery({
    queryKey: ["medications", userId],
    queryFn: () => {
      if (!userId) {
        throw new Error("Missing user id for medications query.");
      }

      return medicationsApi.listMedications(userId);
    },
    enabled: !!userId,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: false,
  });
}

export function useCreateMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: string;
      input: MedicationInput;
    }) => medicationsApi.createMedication(userId, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["medications", variables.userId],
        refetchType: "all",
      });
    },
  });
}
