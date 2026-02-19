import { useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { Bookmark, BookmarkCheck, ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { useLearnArticles, useLearnBookmarkIds, useToggleLearnBookmark } from "@/hooks/useLearnArticles";
import { Skeleton } from "@/components/ui/skeleton";

const LearnPage = () => {
  const [filter, setFilter] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [search, setSearch] = useState("");

  const { data: articles = [], isLoading } = useLearnArticles();
  const { data: bookmarkIds = new Set<string>() } = useLearnBookmarkIds();
  const toggleBookmark = useToggleLearnBookmark();

  const categories = ["All", ...Array.from(new Set(articles.map((a) => a.category)))];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return articles
      .filter((a) => filter === "All" || a.category === filter)
      .filter((a) => !showBookmarked || bookmarkIds.has(a.id))
      .filter((a) => !q || a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));
  }, [articles, filter, showBookmarked, bookmarkIds, search]);

  return (
    <>
      <PageHeader title="Learn" subtitle="Evidence-based MS education" />
      <div className="mx-auto max-w-lg px-4 py-4">
        {/* Search bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category filters */}
        <div className="mb-3 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`tap-highlight-none flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                filter === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Saved toggle */}
        <button
          onClick={() => setShowBookmarked((v) => !v)}
          className={`mb-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
            showBookmarked
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          <BookmarkCheck className="h-3.5 w-3.5" />
          Saved
        </button>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="py-12 text-center">
            <Bookmark className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {showBookmarked ? "No saved articles yet" : "No articles in this category"}
            </p>
          </div>
        )}

        {/* Articles */}
        <div className="space-y-3 animate-fade-in">
          {filtered.map((article) => {
            const isExpanded = expandedId === article.id;
            const isBookmarked = bookmarkIds.has(article.id);

            return (
              <div key={article.id} className="rounded-xl bg-card shadow-soft overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : article.id)}
                  className="tap-highlight-none w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-primary">
                        {article.category}
                      </span>
                      <h3 className="mt-0.5 text-sm font-semibold text-foreground">{article.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{article.summary}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{article.read_time} read</span>
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <div
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark.mutate({ articleId: article.id, isBookmarked });
                      }}
                      className="tap-highlight-none flex-shrink-0 p-1 text-muted-foreground transition-colors hover:text-primary"
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded body */}
                {isExpanded && (
                  <div className="border-t border-border px-4 py-4">
                    <article className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-p:text-muted-foreground">
                      {article.body.split("\n\n").map((block, i) => {
                        if (block.startsWith("## "))
                          return <h2 key={i} className="mt-4 mb-2 text-sm font-semibold text-foreground">{block.slice(3)}</h2>;
                        if (block.startsWith("**") && block.endsWith("**"))
                          return <p key={i} className="font-semibold text-xs text-foreground">{block.slice(2, -2)}</p>;
                        // Handle lists
                        if (block.startsWith("- ") || block.startsWith("1. ")) {
                          const items = block.split("\n").filter(Boolean);
                          return (
                            <ul key={i} className="my-2 space-y-1 text-xs text-muted-foreground">
                              {items.map((item, j) => (
                                <li key={j} className="ml-4 list-disc">{item.replace(/^[-\d]+[.)]\s*/, "")}</li>
                              ))}
                            </ul>
                          );
                        }
                        // Bold inline
                        const parts = block.split(/(\*\*[^*]+\*\*)/g);
                        return (
                          <p key={i} className="my-2 text-xs leading-relaxed text-muted-foreground">
                            {parts.map((part, j) =>
                              part.startsWith("**") && part.endsWith("**") ? (
                                <strong key={j} className="text-foreground">{part.slice(2, -2)}</strong>
                              ) : (
                                <span key={j}>{part}</span>
                              )
                            )}
                          </p>
                        );
                      })}
                    </article>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default LearnPage;
