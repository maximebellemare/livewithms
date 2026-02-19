import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ArticleRecommendation {
  id: string;
  reason: string;
}

export const useArticleRecommendations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["article-recommendations", user?.id],
    enabled: !!user,
    staleTime: 1000 * 60 * 30, // 30 min cache
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("article-recommendations");

      if (error) {
        console.error("Recommendation error:", error);
        return [];
      }

      return (data?.recommendations ?? []) as ArticleRecommendation[];
    },
  });
};
