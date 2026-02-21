import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Calendar, Trophy, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

/* ── Badge definitions (shared with BadgesPage) ── */
const BADGE_DEFS = [
  { id: "log-3", emoji: "⚡", name: "3-Day Logger", category: "logging" },
  { id: "log-7", emoji: "🔥", name: "Week Warrior", category: "logging" },
  { id: "log-14", emoji: "⭐", name: "Fortnight Focus", category: "logging" },
  { id: "log-30", emoji: "🏆", name: "Monthly Master", category: "logging" },
  { id: "week-2", emoji: "📊", name: "2-Week Goal", category: "weekly" },
  { id: "week-4", emoji: "🗓️", name: "Monthly Rhythm", category: "weekly" },
  { id: "week-8", emoji: "💫", name: "2-Month Flow", category: "weekly" },
  { id: "med-7", emoji: "💊", name: "Med Week", category: "medication" },
  { id: "med-14", emoji: "💉", name: "Med Fortnight", category: "medication" },
  { id: "med-30", emoji: "🏅", name: "Med Month", category: "medication" },
  { id: "med-60", emoji: "💎", name: "Med Diamond", category: "medication" },
  { id: "med-90", emoji: "👑", name: "Med Royalty", category: "medication" },
  { id: "relapse-30", emoji: "🛡️", name: "30 Days Strong", category: "relapse" },
  { id: "relapse-60", emoji: "💪", name: "60 Days Strong", category: "relapse" },
  { id: "relapse-90", emoji: "🌟", name: "90 Days Strong", category: "relapse" },
];

const CATEGORY_LABELS: Record<string, string> = {
  logging: "📝 Daily Logging",
  weekly: "📊 Weekly Goals",
  medication: "💊 Medication",
  relapse: "🛡️ Relapse-Free",
};

interface Props {
  userId: string | null;
  displayName: string;
  avatarUrl: string | null;
  badgeCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function useUserPublicBadges(userId: string | null) {
  return useQuery({
    queryKey: ["user-public-badges", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_public_badges", {
        target_user_id: userId!,
      });
      if (error) throw error;
      return (data ?? []) as { badge_id: string; earned_at: string }[];
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
}

function useUserJoinDate(userId: string | null) {
  return useQuery({
    queryKey: ["user-join-date", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_join_date", {
        target_user_id: userId!,
      });
      if (error) throw error;
      return data as string | null;
    },
    enabled: !!userId,
    staleTime: 300_000,
  });
}

const UserProfileDialog = ({ userId, displayName, avatarUrl, badgeCount, open, onOpenChange }: Props) => {
  const { data: badges = [], isLoading: badgesLoading } = useUserPublicBadges(open ? userId : null);
  const { data: joinDate, isLoading: joinLoading } = useUserJoinDate(open ? userId : null);

  const earnedSet = new Set(badges.map((b) => b.badge_id));
  const earnedAtMap = new Map(badges.map((b) => [b.badge_id, b.earned_at]));
  const categories = ["logging", "weekly", "medication", "relapse"] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 via-accent/20 to-secondary/30 px-6 pt-6 pb-4">
          <DialogHeader className="items-center space-y-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-16 w-16 rounded-full object-cover border-2 border-primary/30"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary/15 flex items-center justify-center text-2xl font-bold text-primary">
                {(displayName || "?")[0].toUpperCase()}
              </div>
            )}
            <DialogTitle className="text-lg font-bold text-foreground">{displayName}</DialogTitle>
          </DialogHeader>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-6 mt-3">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{badgeCount}</p>
              <p className="text-[10px] text-muted-foreground">Badges</p>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="text-center">
              {joinLoading ? (
                <div className="h-5 w-16 rounded bg-secondary/50 animate-pulse" />
              ) : joinDate ? (
                <>
                  <p className="text-sm font-semibold text-foreground">
                    {format(new Date(joinDate), "MMM yyyy")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Joined</p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">—</p>
              )}
            </div>
          </div>
        </div>

        {/* Badge collection */}
        <div className="px-5 pb-5 pt-3 space-y-4 max-h-[50vh] overflow-y-auto">
          {badgesLoading ? (
            <div className="grid grid-cols-5 gap-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-secondary/50 animate-pulse" />
              ))}
            </div>
          ) : (
            categories.map((cat) => {
              const catBadges = BADGE_DEFS.filter((b) => b.category === cat);
              const catEarned = catBadges.filter((b) => earnedSet.has(b.id)).length;

              return (
                <div key={cat} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {CATEGORY_LABELS[cat]}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {catEarned}/{catBadges.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {catBadges.map((badge, i) => {
                      const earned = earnedSet.has(badge.id);
                      const earnedAt = earnedAtMap.get(badge.id);
                      return (
                        <motion.div
                          key={badge.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.03, type: "spring", stiffness: 300, damping: 24 }}
                          title={`${badge.name}${earnedAt ? ` — ${format(new Date(earnedAt), "MMM d, yyyy")}` : ""}`}
                          className={`flex flex-col items-center gap-0.5 rounded-xl p-2 min-w-[3.2rem] transition-all ${
                            earned
                              ? "bg-primary/5 border border-primary/20"
                              : "bg-secondary/40 opacity-40 grayscale"
                          }`}
                        >
                          <span className="text-xl">{badge.emoji}</span>
                          {!earned && <Lock className="h-2.5 w-2.5 text-muted-foreground" />}
                          {earned && earnedAt && (
                            <span className="text-[8px] text-primary/70 font-medium">
                              {format(new Date(earnedAt), "MMM d")}
                            </span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileDialog;
