import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Trash2, BarChart3, Heart, CalendarClock, HelpCircle, Trash, Search, Pencil, Check, X } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

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
    await supabase.from("coach_messages").delete().eq("session_id", id);
    await supabase.from("coach_sessions").delete().eq("id", id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const startRename = (e: React.MouseEvent, s: CoachSession) => {
    e.stopPropagation();
    setEditingId(s.id);
    setEditTitle(s.title || "");
  };

  const confirmRename = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingId) return;
    const trimmed = editTitle.trim() || "Untitled conversation";
    await supabase.from("coach_sessions").update({ title: trimmed }).eq("id", editingId);
    setSessions((prev) => prev.map((s) => s.id === editingId ? { ...s, title: trimmed } : s));
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
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

  const filteredSessions = sessions.filter((s) => {
    const matchesMode = !modeFilter || s.mode === modeFilter;
    const matchesSearch = !search || (s.title || "").toLowerCase().includes(search.toLowerCase());
    return matchesMode && matchesSearch;
  });

  const allModes = [...new Set(sessions.map((s) => s.mode))];

  return (
    <div className="px-4 pb-6 space-y-2">
      {/* Search & filter bar */}
      <div className="space-y-2 pb-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {allModes.length > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setModeFilter(null)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                !modeFilter
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {allModes.map((m) => {
              const Icon = modeIcons[m] || MessageSquare;
              return (
                <button
                  key={m}
                  onClick={() => setModeFilter(modeFilter === m ? null : m)}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    modeFilter === m
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {modeLabels[m] || m}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {filteredSessions.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">No matching conversations</p>
      ) : (
        filteredSessions.map((s, i) => {
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
              {editingId === s.id ? (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmRename(e as unknown as React.MouseEvent);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 min-w-0 rounded-lg border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button onClick={confirmRename} className="flex h-6 w-6 items-center justify-center rounded-md text-primary hover:bg-primary/10 transition-colors" aria-label="Save">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={cancelRename} className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent transition-colors" aria-label="Cancel">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground truncate">
                    {s.title || "Untitled conversation"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {modeLabels[s.mode] || s.mode} · {formatDistanceToNow(new Date(s.updated_at), { addSuffix: true })}
                  </p>
                </>
              )}
            </div>
            {editingId !== s.id && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={(e) => startRename(e, s)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                  aria-label="Rename conversation"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => deleteSession(e, s.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </motion.button>
        );
      })
      )}


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
