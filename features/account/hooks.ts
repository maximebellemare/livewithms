import { useMutation } from "@tanstack/react-query";
import { accountApi } from "./api";

export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => accountApi.deleteMyAccount(),
  });
}
