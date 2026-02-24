import { useEffect, useRef, useState, useCallback } from "react";

interface ScrollDotsProps {
  containerRef: React.RefObject<HTMLDivElement>;
  count: number;
}

export default function ScrollDots({ containerRef, count }: ScrollDotsProps) {
  const [active, setActive] = useState(0);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || count <= 1) return;
    const ratio = el.scrollLeft / (el.scrollWidth - el.clientWidth);
    setActive(Math.round(ratio * (count - 1)));
  }, [containerRef, count]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [containerRef, handleScroll]);

  return (
    <div className="flex justify-center gap-1.5 pt-1.5 sm:hidden">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="block rounded-full transition-all duration-200"
          style={{
            width: i === active ? 16 : 6,
            height: 6,
            backgroundColor:
              i === active
                ? "hsl(var(--primary))"
                : "hsl(var(--muted-foreground) / 0.25)",
          }}
        />
      ))}
    </div>
  );
}
