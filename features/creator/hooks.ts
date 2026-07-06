import { useQuery } from "@tanstack/react-query";
import { fetchCreatorAccess, fetchCreatorDashboard } from "./api";

export function useCreatorAccess(userId?: string | null, email?: string | null) {
  return useQuery({
    queryKey: ["creator-access", userId, email?.toLowerCase() ?? ""],
    enabled: Boolean(userId && email),
    staleTime: 5 * 60 * 1000,
    queryFn: () => fetchCreatorAccess(userId, email),
  });
}

export function useCreatorDashboard(userId?: string | null, email?: string | null) {
  return useQuery({
    queryKey: ["creator-dashboard", userId, email?.toLowerCase() ?? ""],
    enabled: Boolean(userId && email),
    staleTime: 60 * 1000,
    queryFn: () => fetchCreatorDashboard(userId, email),
  });
}
