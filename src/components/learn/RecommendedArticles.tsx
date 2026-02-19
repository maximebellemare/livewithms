import { Sparkles } from "lucide-react";
import { useArticleRecommendations } from "@/hooks/useArticleRecommendations";
import type { LearnArticle } from "@/hooks/useLearnArticles";
import { Skeleton } from "@/components/ui/skeleton";

interface RecommendedArticlesProps {
  articles: LearnArticle[];
  onSelect: (articleId: string) => void;
}

const RecommendedArticles = ({ articles, onSelect }: RecommendedArticlesProps) => {
  const { data: recommendations = [], isLoading, isError } = useArticleRecommendations();

  if (isError || (!isLoading && recommendations.length === 0)) return null;

  if (isLoading) {
    return (
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recommended for You</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="flex-shrink-0 w-44 h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const recArticles = recommendations
    .map((rec) => {
      const article = articles.find((a) => a.id === rec.id);
      return article ? { ...article, reason: rec.reason } : null;
    })
    .filter(Boolean) as (LearnArticle & { reason: string })[];

  if (recArticles.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recommended for You</h2>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {recArticles.map((article) => (
          <button
            key={article.id}
            onClick={() => onSelect(article.id)}
            className="tap-highlight-none flex-shrink-0 w-44 rounded-xl bg-card p-3 text-left shadow-soft hover:ring-1 hover:ring-primary/30 transition-all"
          >
            <span className="text-[9px] font-medium uppercase tracking-wider text-primary">{article.category}</span>
            <p className="mt-0.5 text-xs font-semibold text-foreground line-clamp-2">{article.title}</p>
            <p className="mt-1 text-[10px] text-muted-foreground line-clamp-2">{article.reason}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecommendedArticles;
