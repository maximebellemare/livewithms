import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAffiliateDashboard, fetchAffiliateDetail, markCommissionPaid, saveAffiliate } from "./api";
import type { AffiliateFormInput } from "./types";

export function useAffiliateDashboard(enabled = true) {
  return useQuery({
    queryKey: ["affiliate-admin-dashboard"],
    enabled,
    staleTime: 60 * 1000,
    queryFn: fetchAffiliateDashboard,
  });
}

export function useAffiliateDetail(affiliateId?: string, enabled = true) {
  return useQuery({
    queryKey: ["affiliate-admin-detail", affiliateId],
    enabled: enabled && Boolean(affiliateId),
    staleTime: 60 * 1000,
    queryFn: () => {
      if (!affiliateId) {
        throw new Error("Missing affiliate id");
      }

      return fetchAffiliateDetail(affiliateId);
    },
  });
}

export function useSaveAffiliate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AffiliateFormInput) => saveAffiliate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["affiliate-admin-dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["affiliate-admin-detail"] });
    },
  });
}

export function useMarkCommissionPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markCommissionPaid,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["affiliate-admin-dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["affiliate-admin-detail"] });
    },
  });
}
