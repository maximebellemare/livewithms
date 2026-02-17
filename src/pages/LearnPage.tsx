import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Bookmark, BookmarkCheck } from "lucide-react";

const articles = [
  { id: "1", category: "Understanding MS", title: "What is Multiple Sclerosis?", summary: "A clear overview of MS, how it affects the nervous system, and the different types.", readTime: "5 min" },
  { id: "2", category: "Symptoms", title: "Managing Fatigue in MS", summary: "Practical strategies for conserving energy and managing MS-related fatigue.", readTime: "4 min" },
  { id: "3", category: "Medications", title: "Understanding DMTs", summary: "An overview of disease-modifying therapies and how they work.", readTime: "6 min" },
  { id: "4", category: "Lifestyle", title: "Sleep & MS", summary: "Why sleep matters and tips for improving your sleep quality with MS.", readTime: "3 min" },
  { id: "5", category: "Exercise", title: "Safe Exercise with MS", summary: "Low-impact exercises that can help with mobility, strength, and mood.", readTime: "4 min" },
  { id: "6", category: "Lifestyle", title: "Heat Sensitivity Tips", summary: "How to manage heat sensitivity and stay cool during warm months.", readTime: "3 min" },
  { id: "7", category: "Supplements", title: "Vitamin D & MS", summary: "What the research says about vitamin D and its role in MS management.", readTime: "5 min" },
  { id: "8", category: "Symptoms", title: "Coping with Brain Fog", summary: "Cognitive strategies and tools to help manage brain fog.", readTime: "4 min" },
];

const categories = ["All", ...Array.from(new Set(articles.map((a) => a.category)))];

const LearnPage = () => {
  const [filter, setFilter] = useState("All");
  const [bookmarks, setBookmarks] = useState<string[]>(() =>
    JSON.parse(localStorage.getItem("ms-bookmarks") || "[]")
  );

  const toggleBookmark = (id: string) => {
    const updated = bookmarks.includes(id)
      ? bookmarks.filter((b) => b !== id)
      : [...bookmarks, id];
    setBookmarks(updated);
    localStorage.setItem("ms-bookmarks", JSON.stringify(updated));
  };

  const filtered = filter === "All" ? articles : articles.filter((a) => a.category === filter);

  return (
    <>
      <PageHeader title="Learn" subtitle="Evidence-based MS education" />
      <div className="mx-auto max-w-lg px-4 py-4">
        {/* Category filters */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
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

        {/* Articles */}
        <div className="space-y-3 animate-fade-in">
          {filtered.map((article) => (
            <div key={article.id} className="rounded-xl bg-card p-4 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-primary">
                    {article.category}
                  </span>
                  <h3 className="mt-0.5 text-sm font-semibold text-foreground">{article.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{article.summary}</p>
                  <p className="mt-2 text-[10px] text-muted-foreground">{article.readTime} read</p>
                </div>
                <button
                  onClick={() => toggleBookmark(article.id)}
                  className="tap-highlight-none flex-shrink-0 p-1 text-muted-foreground transition-colors hover:text-primary"
                >
                  {bookmarks.includes(article.id) ? (
                    <BookmarkCheck className="h-4 w-4 text-primary" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default LearnPage;
