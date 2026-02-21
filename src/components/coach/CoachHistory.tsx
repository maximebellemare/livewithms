import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Trash2, BarChart3, Heart, CalendarClock, HelpCircle, Trash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { CoachMode } from "@/hooks/useCoach";
import { formatDistanceToNow } from "date-fns";

interface CoachSession {
  id: string;
  mode: string;
  title: string | null;
  updated_at: string;
}

interface CoachHistoryProps {
  onSelectSession: (id: string, mode: CoachMode) => void;
}

const modeIcons: Record<string, typeof Heart> = {
  data: BarChart3,
  emotional: Heart,
  planning: CalendarClock,
  guidance: HelpCircle,
};

const modeLabels: Record<string, string> = {
  data: "Data",
  emotional: "Feelings",
  planning: "Planning",
  guidance: "Guide",
};

const CoachHistory = ({ onSelectSession }: CoachHistoryProps) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<CoachSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const fetchSessions = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("coach_sessions")
      .select("id, mode, title, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(30);

    setSessions((data as CoachSession[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Delete messages first, then session
    await supabase.from("coach_messages").delete().eq("session_id", id);
    await supabase.from("coach_sessions").delete().eq("id", id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const clearAllSessions = async () => {
    if (!user) return;
    const ids = sessions.map((s) => s.id);
    await supabase.from("coach_messages").delete().in("session_id", ids);
    await supabase.from("coach_sessions").delete().in("id", ids);
    setSessions([]);
    setConfirmClearAll(false);
  };

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-secondary/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center mb-3">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No conversations yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Start a new chat above to see it here</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-6 space-y-2">
      {sessions.map((s, i) => {
        const Icon = modeIcons[s.mode] || MessageSquare;
        return (
          <motion.button
            key={s.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.2 }}
            onClick={() => onSelectSession(s.id, s.mode as CoachMode)}
            className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 text-left hover:border-primary/30 transition-all active:scale-[0.98] group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {s.title || "Untitled conversation"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {modeLabels[s.mode] || s.mode} · {formatDistanceToNow(new Date(s.updated_at), { addSuffix: true })}
              </p>
            </div>
            <button
              onClick={(e) => deleteSession(e, s.id)}
              className="opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              aria-label="Delete conversation"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </motion.button>
        );
      })}

      {/* Clear All */}
      {confirmClearAll ? (
        <div className="flex items-center justify-center gap-2 pt-2">
          <span className="text-xs text-muted-foreground">Delete all conversations?</span>
          <button
            onClick={clearAllSessions}
            className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
          >
            Confirm
          </button>
          <button
            onClick={() => setConfirmClearAll(false)}
            className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmClearAll(true)}
          className="flex items-center justify-center gap-1.5 w-full rounded-xl py-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors mt-1"
        >
          <Trash className="h-3.5 w-3.5" />
          Clear All History
        </button>
      )}
    </div>
  );
};

export default CoachHistory;
