import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileApi, type ProfileUpdateInput } from "./api";
import type { Profile } from "./types";

export function useMyProfile(userId?: string, enabled = true) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => {
      if (!userId) {
        throw new Error("Missing user id for profile query");
      }

      return profileApi.getMyProfile(userId);
    },
    enabled: enabled && !!userId,
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
}

export function useSaveProfileStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, input }: { userId: string; input: ProfileUpdateInput }) => {
      return profileApi.updateMyProfile(userId, input);
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData<Profile | undefined>(["profile", variables.userId], data);
      queryClient.invalidateQueries({ queryKey: ["profile", variables.userId] });
    },
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, input }: { userId: string; input: ProfileUpdateInput }) => {
      return profileApi.updateMyProfile(userId, input);
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData<Profile | undefined>(["profile", variables.userId], data);
      queryClient.invalidateQueries({ queryKey: ["profile", variables.userId] });
    },
  });
}
