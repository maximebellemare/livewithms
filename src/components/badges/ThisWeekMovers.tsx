import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { useBadgeLeaderboard } from "@/hooks/useBadgeLeaderboard";

const ThisWeekMovers = () => {
  const { data: entries = [], isLoading } = useBadgeLeaderboard();

  if (isLoading || entries.length === 0) return null;

  // Compute movers
  const movers = entries
    .map((entry, i) => {
      const rank = i + 1;
      const prevRank = entry.previous_rank;
      const isNew = prevRank == null;
      const change = prevRank != null ? prevRank - rank : null;
      return { ...entry, rank, change, isNew };
    })
    .filter((e) => e.isNew || (e.change != null && e.change !== 0));

  if (movers.length === 0) return null;

  // Sort: biggest climbers first, then new entries, then biggest drops
  const climbers = movers.filter((m) => m.change != null && m.change > 0).sort((a, b) => (b.change ?? 0) - (a.change ?? 0));
  const newEntries = movers.filter((m) => m.isNew);
  const fallers = movers.filter((m) => m.change != null && m.change < 0).sort((a, b) => (a.change ?? 0) - (b.change ?? 0));

  const sorted = [...climbers, ...newEntries, ...fallers].slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-base space-y-3"
    >
      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        This Week's Movers
      </p>

      <div className="space-y-2">
        {sorted.map((mover) => (
          <div
            key={mover.user_id}
            className="flex items-center gap-2.5 rounded-xl bg-secondary/50 px-3 py-2"
          >
            {/* Avatar */}
            {mover.avatar_url ? (
              <img
                src={mover.avatar_url}
                alt={mover.display_name}
                className="h-6 w-6 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                {(mover.display_name || "?")[0].toUpperCase()}
              </div>
            )}

            {/* Name */}
            <span className="text-xs font-semibold text-foreground truncate flex-1">
              {mover.display_name}
            </span>

            {/* Change indicator */}
            {mover.isNew ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                <Sparkles className="h-3 w-3" /> New
              </span>
            ) : mover.change != null && mover.change > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-600 dark:text-green-400">
                <TrendingUp className="h-3 w-3" /> +{mover.change}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                <TrendingDown className="h-3 w-3" /> {mover.change}
              </span>
            )}

            {/* Current rank */}
            <span className="text-[10px] text-muted-foreground font-medium w-6 text-right">
              #{mover.rank}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default ThisWeekMovers;
