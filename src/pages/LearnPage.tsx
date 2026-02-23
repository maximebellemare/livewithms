import { useState, useMemo, useEffect, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SEOHead from "@/components/SEOHead";
import AnimatedList, { listItemVariants } from "@/components/AnimatedList";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import PageHeader from "@/components/PageHeader";
import { Bookmark, BookmarkCheck, CheckCircle2, ChevronDown, ChevronUp, Search, X, Clock, EyeOff, CircleCheckBig, Trophy, BookOpen, PlayCircle } from "lucide-react";
import { useLearnArticles, useLearnBookmarkIds, useToggleLearnBookmark, useLearnReads, useMarkArticleRead } from "@/hooks/useLearnArticles";
import { Skeleton } from "@/components/ui/skeleton";
import ArticleBody from "@/components/learn/ArticleBody";
import RecommendedArticles from "@/components/learn/RecommendedArticles";
import { useLearnProgress } from "@/hooks/useLearnProgress";

const LearnPage = () => {
  const [filter, setFilter] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [showUnread, setShowUnread] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [search, setSearch] = useState("");
  const articleRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToArticle = (id: string) => {
    setExpandedId(id);
    markRead.mutate(id);
    // Wait for expansion render, then scroll into view
    requestAnimationFrame(() => {
      setTimeout(() => {
        articleRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    });
  };

  const { data: articles = [], isLoading } = useLearnArticles();
  const { data: bookmarkIds = new Set<string>() } = useLearnBookmarkIds();
  const toggleBookmark = useToggleLearnBookmark();
  const { data: recentReads = [] } = useLearnReads();
  const markRead = useMarkArticleRead();
  const { data: progressMap = {} } = useLearnProgress();
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: articles.length };
    articles.forEach((a) => { counts[a.category] = (counts[a.category] || 0) + 1; });
    return counts;
  }, [articles]);
  const categories = ["All", ...Array.from(new Set(articles.map((a) => a.category))).sort((a, b) => a.localeCompare(b))];

  const readArticleIds = useMemo(() => new Set(recentReads.map((r) => r.article_id)), [recentReads]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return articles
      .filter((a) => filter === "All" || a.category === filter)
      .filter((a) => !showBookmarked || bookmarkIds.has(a.id))
      .filter((a) => !showUnread || !readArticleIds.has(a.id))
      .filter((a) => !showCompleted || (progressMap[a.id] ?? 0) >= 1)
      .filter((a) => !q || a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));
  }, [articles, filter, showBookmarked, showUnread, showCompleted, bookmarkIds, readArticleIds, progressMap, search]);

  const continueReading = useMemo(() => 
    articles.filter((a) => {
      const p = progressMap[a.id] ?? 0;
      return p > 0 && p < 1;
    }).sort((a, b) => (progressMap[b.id] ?? 0) - (progressMap[a.id] ?? 0)),
    [articles, progressMap]
  );

  const completedCount = useMemo(() => articles.filter((a) => (progressMap[a.id] ?? 0) >= 1).length, [articles, progressMap]);
  const totalCount = articles.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allCompleted = totalCount > 0 && completedCount === totalCount;
  const hasCelebrated = useRef(false);

  useEffect(() => {
    if (allCompleted && !hasCelebrated.current) {
      hasCelebrated.current = true;
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  }, [allCompleted]);

  return (
    <>
      <SEOHead title="Learn" description="Evidence-based articles and resources about living with multiple sclerosis." />
      <PageHeader title="Learn" subtitle="Evidence-based MS education" showBack />
      <div className="mx-auto max-w-lg px-4 py-4">
        {/* Learning progress summary */}
        {!isLoading && totalCount > 0 && (
          <div data-tour="learn-progress" className={`mb-4 rounded-xl p-4 shadow-soft transition-all ${allCompleted ? "bg-primary/10 ring-1 ring-primary/30" : "bg-card"}`}>
            <div className="flex items-center justify-between mb-2">
              {allCompleted ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
                  <Trophy className="h-4 w-4" />
                  All Complete!
                </span>
              ) : (
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Progress</span>
              )}
              <span className="text-xs font-semibold text-primary">{completedCount}/{totalCount} completed</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${allCompleted ? "bg-primary" : "bg-primary"}`}
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            {allCompleted && (
              <p className="mt-2 text-xs text-primary/80 animate-fade-in">
                🎉 Amazing! You've completed every article. Keep learning and growing!
              </p>
            )}
          </div>
        )}

        {/* Continue Reading */}
        {!isLoading && !search && filter === "All" && continueReading.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <h2 className="text-xs font-semibold text-primary uppercase tracking-wider">Continue Reading</h2>
            </div>
            <div className="space-y-2">
              {continueReading.slice(0, 3).map((article) => {
                const progress = progressMap[article.id] ?? 0;
                const mins = parseInt(article.read_time) || 0;
                const remaining = Math.ceil(mins * (1 - progress));
                return (
                  <button
                    key={article.id}
                    onClick={() => scrollToArticle(article.id)}
                    className="tap-highlight-none w-full rounded-xl bg-card p-3 text-left shadow-soft hover:ring-1 hover:ring-primary/30 transition-all relative overflow-hidden"
                  >
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary">
                      <div className="h-full bg-primary/60 rounded-br-xl transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-medium uppercase tracking-wider text-primary">{article.category}</span>
                        <p className="text-xs font-semibold text-foreground line-clamp-1">{article.title}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] font-semibold text-primary">{Math.round(progress * 100)}%</span>
                          {remaining > 0 && <p className="text-[9px] text-muted-foreground">{remaining} min left</p>}
                        </div>
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/15 text-primary">
                          <PlayCircle className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
        <div data-tour="learn-filters" className="mb-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full rounded-xl bg-card">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  <span className="flex items-center justify-between w-full gap-2">
                    <span>{cat}</span>
                    <span className="text-muted-foreground text-xs">{categoryCounts[cat] ?? 0}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter toggles */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setShowBookmarked((v) => !v)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              showBookmarked
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            <BookmarkCheck className="h-3.5 w-3.5" />
            Saved
          </button>
          <button
            onClick={() => setShowUnread((v) => !v)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              showUnread
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            <EyeOff className="h-3.5 w-3.5" />
            Unread
          </button>
          <button
            onClick={() => setShowCompleted((v) => !v)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              showCompleted
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            <CircleCheckBig className="h-3.5 w-3.5" />
            Completed
          </button>
        </div>

        {/* Recommended for you */}
        {!isLoading && !search && filter === "All" && !showBookmarked && !showUnread && (
          <RecommendedArticles
            articles={articles}
            onSelect={(id) => scrollToArticle(id)}
          />
        )}

        {/* Recently read */}
        {!isLoading && !search && filter === "All" && !showBookmarked && recentReads.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recently Read</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {recentReads.slice(0, 6).map((read) => {
                const article = articles.find((a) => a.id === read.article_id);
                if (!article) return null;
                return (
                  <button
                    key={read.article_id}
                    onClick={() => scrollToArticle(article.id)}
                    className="tap-highlight-none flex-shrink-0 w-36 rounded-xl bg-card p-3 text-left shadow-soft hover:ring-1 hover:ring-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-medium uppercase tracking-wider text-primary">{article.category}</span>
                      {Date.now() - new Date(article.created_at).getTime() < 14 * 86400000 && (
                        <span className="rounded-full bg-accent px-1 py-px text-[8px] font-semibold text-accent-foreground">New</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs font-semibold text-foreground line-clamp-2">{article.title}</p>
                    {(() => {
                      const progress = progressMap[article.id] ?? 0;
                      const mins = parseInt(article.read_time) || 0;
                      const remaining = Math.ceil(mins * (1 - progress));
                      if (progress > 0 && progress < 1 && remaining > 0) {
                        return <p className="mt-1 text-[10px] font-medium text-primary">{remaining} min left</p>;
                      }
                      return <p className="mt-1 text-[10px] text-muted-foreground">{article.read_time}</p>;
                    })()}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
              {showBookmarked ? "No saved articles yet" : showUnread ? "You've read all the articles!" : "No articles in this category"}
            </p>
          </div>
        )}

        {/* Articles */}
        <div data-tour="learn-articles">
        <AnimatedList className="space-y-3">
          {filtered.map((article) => {
            const isExpanded = expandedId === article.id;
            const isBookmarked = bookmarkIds.has(article.id);

            return (
              <motion.div key={article.id} ref={(el) => { articleRefs.current[article.id] = el; }} variants={listItemVariants} whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }} className="rounded-xl bg-card shadow-soft overflow-hidden relative">
                {/* Progress bar at bottom of card (when collapsed and has progress) */}
                {!isExpanded && (progressMap[article.id] ?? 0) > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary">
                    <div
                      className="h-full bg-primary/60 transition-all rounded-br-xl"
                      style={{ width: `${Math.min((progressMap[article.id] ?? 0) * 100, 100)}%` }}
                    />
                  </div>
                )}
                {/* Header */}
                <button
                  onClick={() => {
                    const willExpand = !isExpanded;
                    setExpandedId(willExpand ? article.id : null);
                    if (willExpand) markRead.mutate(article.id);
                  }}
                  className="tap-highlight-none w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-primary">
                          {article.category}
                        </span>
                        {Date.now() - new Date(article.created_at).getTime() < 14 * 86400000 && (
                          <span className="inline-flex items-center rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-semibold text-accent-foreground">
                            New
                          </span>
                        )}
                        {(progressMap[article.id] ?? 0) >= 1 && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                            <CheckCircle2 className="h-3 w-3" />
                            Done
                          </span>
                        )}
                      </div>
                      <h3 className="mt-0.5 text-sm font-semibold text-foreground">{article.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{article.summary}</p>
                      <div className="mt-2 flex items-center gap-2">
                        {(() => {
                          const progress = progressMap[article.id] ?? 0;
                          const mins = parseInt(article.read_time) || 0;
                          const remaining = Math.ceil(mins * (1 - progress));
                          if (progress > 0 && progress < 1 && remaining > 0) {
                            return <span className="text-[10px] font-medium text-primary">{remaining} min left</span>;
                          }
                          return <span className="text-[10px] text-muted-foreground">{article.read_time} read</span>;
                        })()}
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
                {isExpanded && <ArticleBody body={article.body} articleId={article.id} initialProgress={progressMap[article.id] ?? 0} />}
              </motion.div>
            );
          })}
        </AnimatedList>
        </div>
      </div>
    </>
  );
};

export default LearnPage;
