import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, BarChart3, Heart, CalendarClock, HelpCircle, Trash, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { CoachMode } from "@/hooks/useCoach";
import SwipeableSessionItem from "./SwipeableSessionItem";

interface CoachSession {
  id: string;
  mode: string;
  title: string | null;
  updated_at: string;
  is_pinned: boolean;
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
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const fetchSessions = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("coach_sessions")
      .select("id, mode, title, updated_at, is_pinned")
      .eq("user_id", user.id)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(30);

    setSessions((data as CoachSession[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  const deleteSession = async (id: string) => {
    setPendingDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    await supabase.from("coach_messages").delete().eq("session_id", id);
    await supabase.from("coach_sessions").delete().eq("id", id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const startRename = (s: { id: string; title: string | null }) => {
    setEditingId(s.id);
    setEditTitle(s.title || "");
  };

  const confirmRename = async () => {
    if (!editingId) return;
    const trimmed = editTitle.trim() || "Untitled conversation";
    await supabase.from("coach_sessions").update({ title: trimmed }).eq("id", editingId);
    setSessions((prev) => prev.map((s) => s.id === editingId ? { ...s, title: trimmed } : s));
    setEditingId(null);
  };

  const cancelRename = () => {
    setEditingId(null);
  };

  const togglePin = async (id: string, currentlyPinned: boolean) => {
    await supabase.from("coach_sessions").update({ is_pinned: !currentlyPinned }).eq("id", id);
    setSessions((prev) => {
      const updated = prev.map((s) => s.id === id ? { ...s, is_pinned: !currentlyPinned } : s);
      return updated.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
    });
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
        filteredSessions.map((s, i) => (
          <SwipeableSessionItem
            key={s.id}
            session={s}
            index={i}
            onSelect={onSelectSession}
            onDelete={deleteSession}
            onTogglePin={togglePin}
            onStartRename={startRename}
            isEditing={editingId === s.id}
            editTitle={editTitle}
            onEditTitleChange={setEditTitle}
            onConfirmRename={confirmRename}
            onCancelRename={cancelRename}
          />
        ))
      )}
      {filteredSessions.length > 0 && !localStorage.getItem("hint_coach_swipe_used") && (
        <p className="text-[10px] text-muted-foreground/40 text-center pt-1 animate-fade-in">
          Swipe left or hold to manage conversations
        </p>
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

      {/* Delete confirmation dialog */}
      <AnimatePresence>
        {pendingDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm px-6"
            onClick={() => setPendingDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs rounded-2xl border border-border bg-card p-5 shadow-lg space-y-3"
            >
              <p className="text-sm font-semibold text-foreground">Delete conversation?</p>
              <p className="text-xs text-muted-foreground">This will permanently remove this conversation and all its messages.</p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setPendingDeleteId(null)}
                  className="flex-1 rounded-xl bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 rounded-xl bg-destructive px-3 py-2 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoachHistory;
