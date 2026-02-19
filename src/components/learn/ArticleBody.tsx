import { useRef, useState, useCallback, useEffect } from "react";

interface ArticleBodyProps {
  body: string;
}

const ArticleBody = ({ body }: ArticleBodyProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const max = scrollHeight - clientHeight;
    const current = max > 0 ? Math.min(1, scrollTop / max) : 1;
    setProgress((prev) => Math.max(prev, current));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // If content fits without scroll, mark as fully read
    if (el.scrollHeight <= el.clientHeight) setProgress(1);
  }, []);

  return (
    <div className="border-t border-border">
      {/* Progress bar */}
      <div className="h-1 w-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-150 ease-out rounded-r-full"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="max-h-[60vh] overflow-y-auto px-4 py-4 scrollbar-none"
      >
        <article className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-p:text-muted-foreground">
          {body.split("\n\n").map((block, i) => {
            if (block.startsWith("## "))
              return <h2 key={i} className="mt-4 mb-2 text-sm font-semibold text-foreground">{block.slice(3)}</h2>;
            if (block.startsWith("**") && block.endsWith("**"))
              return <p key={i} className="font-semibold text-xs text-foreground">{block.slice(2, -2)}</p>;
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

        {/* Reading complete indicator */}
        {progress >= 0.95 && (
          <p className="mt-3 text-center text-[10px] font-medium text-primary animate-fade-in">
            ✓ Finished reading
          </p>
        )}
      </div>
    </div>
  );
};

export default ArticleBody;
