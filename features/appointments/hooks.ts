import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appointmentsApi } from "./api";
import type { AppointmentInput } from "./types";

export function useAppointments(userId?: string) {
  return useQuery({
    queryKey: ["appointments", userId],
    queryFn: () => {
      if (!userId) {
        throw new Error("Missing user id for appointments query.");
      }

      return appointmentsApi.listAppointments(userId);
    },
    enabled: !!userId,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: string;
      input: AppointmentInput;
    }) => appointmentsApi.createAppointment(userId, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["appointments", variables.userId],
        refetchType: "all",
      });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      appointmentId,
      input,
    }: {
      userId: string;
      appointmentId: string;
      input: AppointmentInput;
    }) => appointmentsApi.updateAppointment(userId, appointmentId, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["appointments", variables.userId],
        refetchType: "all",
      });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      appointmentId,
    }: {
      userId: string;
      appointmentId: string;
    }) => appointmentsApi.deleteAppointment(userId, appointmentId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["appointments", variables.userId],
        refetchType: "all",
      });
    },
  });
}
