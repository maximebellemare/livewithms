import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { careNotesApi } from "./api";
import type { CareNoteInput } from "./types";

export function useCareNotes(userId?: string) {
  return useQuery({
    queryKey: ["care-notes", userId],
    queryFn: () => {
      if (!userId) {
        throw new Error("Missing user id for care notes query.");
      }

      return careNotesApi.listCareNotes(userId);
    },
    enabled: !!userId,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: false,
  });
}

export function useCreateCareNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: string;
      input: CareNoteInput;
    }) => careNotesApi.createCareNote(userId, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["care-notes", variables.userId],
        refetchType: "all",
      });
    },
  });
}

export function useUpdateCareNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      noteId,
      input,
    }: {
      userId: string;
      noteId: string;
      input: CareNoteInput;
    }) => careNotesApi.updateCareNote(userId, noteId, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["care-notes", variables.userId],
        refetchType: "all",
      });
    },
  });
}

export function useDeleteCareNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      noteId,
    }: {
      userId: string;
      noteId: string;
    }) => careNotesApi.deleteCareNote(userId, noteId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["care-notes", variables.userId],
        refetchType: "all",
      });
    },
  });
}
