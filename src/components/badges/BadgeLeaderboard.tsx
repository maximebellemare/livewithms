import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Trophy, Crown, Medal, Award, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { useBadgeLeaderboard } from "@/hooks/useBadgeLeaderboard";
import { useAuth } from "@/hooks/useAuth";

const RANK_STYLES: Record<number, { icon: typeof Trophy; color: string }> = {
  1: { icon: Crown, color: "text-yellow-500" },
  2: { icon: Medal, color: "text-gray-400" },
  3: { icon: Award, color: "text-amber-600" },
};

const BadgeLeaderboard = () => {
  const { data: entries = [], isLoading } = useBadgeLeaderboard();
  const { user } = useAuth();
  const celebratedRef = useRef(false);

  const isMe = (uid: string) => uid === user?.id;

  // Confetti when user first appears on leaderboard
  useEffect(() => {
    if (isLoading || entries.length === 0 || !user || celebratedRef.current) return;

    const myEntry = entries.find((e) => e.user_id === user.id);
    if (!myEntry || myEntry.previous_rank != null) return;

    // User is new on the leaderboard — check session to avoid repeat
    const key = "leaderboard-confetti-fired";
    if (sessionStorage.getItem(key)) return;

    celebratedRef.current = true;
    sessionStorage.setItem(key, "1");

    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#E8751A", "#FFB347", "#FFDAB9", "#4CAF50", "#42A5F5"],
        disableForReducedMotion: true,
      });
    }, 600);
  }, [isLoading, entries, user]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Trophy className="h-4 w-4 text-primary" />
          Community Leaderboard
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-card/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl bg-card p-6 text-center space-y-2">
        <Trophy className="h-6 w-6 text-muted-foreground mx-auto" />
        <p className="text-sm font-semibold text-foreground">No badges earned yet</p>
        <p className="text-xs text-muted-foreground">Be the first to appear on the leaderboard!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Trophy className="h-4 w-4 text-primary" />
        Community Leaderboard
      </div>

      <div className="rounded-2xl bg-card shadow-soft overflow-hidden divide-y divide-border/50">
        {entries.map((entry, i) => {
          const rank = i + 1;
          const rankMeta = RANK_STYLES[rank];
          const RankIcon = rankMeta?.icon;
          const isCompletionist = entry.badge_count >= 15;
          const highlighted = isMe(entry.user_id);

          // Rank change calculation
          const prevRank = entry.previous_rank;
          const rankChange = prevRank != null ? prevRank - rank : null;
          const isNew = prevRank == null;

          return (
            <motion.div
              key={entry.user_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 24 }}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                highlighted ? "bg-primary/5" : ""
              }`}
            >
              {/* Rank */}
              <div className="w-6 flex-shrink-0 text-center">
                {RankIcon ? (
                  <RankIcon className={`h-4 w-4 mx-auto ${rankMeta.color}`} />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">{rank}</span>
                )}
              </div>

              {/* Avatar */}
              {entry.avatar_url ? (
                <img
                  src={entry.avatar_url}
                  alt={entry.display_name}
                  className="h-7 w-7 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary flex-shrink-0">
                  {(entry.display_name || "?")[0].toUpperCase()}
                </div>
              )}

              {/* Name & badge count */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${highlighted ? "text-primary" : "text-foreground"}`}>
                  {entry.display_name}
                  {highlighted && <span className="text-[10px] text-muted-foreground ml-1">(you)</span>}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {entry.badge_count} badge{entry.badge_count !== 1 ? "s" : ""} earned
                  {isCompletionist && " 🌈"}
                </p>
              </div>

              {/* Weekly rank change */}
              <div className="flex-shrink-0 w-10 flex items-center justify-center">
                {isNew ? (
                  <span className="flex items-center gap-0.5 text-[10px] font-semibold text-primary">
                    <Sparkles className="h-3 w-3" /> new
                  </span>
                ) : rankChange != null && rankChange > 0 ? (
                  <span className="flex items-center gap-0.5 text-[10px] font-semibold text-green-600 dark:text-green-400">
                    <TrendingUp className="h-3 w-3" /> +{rankChange}
                  </span>
                ) : rankChange != null && rankChange < 0 ? (
                  <span className="flex items-center gap-0.5 text-[10px] font-semibold text-destructive">
                    <TrendingDown className="h-3 w-3" /> {rankChange}
                  </span>
                ) : (
                  <Minus className="h-3 w-3 text-muted-foreground" />
                )}
              </div>

              {/* Badge count pill */}
              <div className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                isCompletionist
                  ? "bg-gradient-to-r from-primary/20 to-accent/20 text-primary border border-primary/30"
                  : "bg-secondary text-foreground"
              }`}>
                {entry.badge_count}/{15}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default BadgeLeaderboard;
