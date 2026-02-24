import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { Pin, PinOff, Pencil, Trash2, MessageSquare, BarChart3, Heart, CalendarClock, HelpCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { CoachMode } from "@/hooks/useCoach";

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

interface SwipeableSessionItemProps {
  session: {
    id: string;
    mode: string;
    title: string | null;
    updated_at: string;
    is_pinned: boolean;
  };
  index: number;
  onSelect: (id: string, mode: CoachMode) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, currentlyPinned: boolean) => void;
  onStartRename: (session: { id: string; title: string | null }) => void;
  isEditing: boolean;
  editTitle: string;
  onEditTitleChange: (val: string) => void;
  onConfirmRename: () => void;
  onCancelRename: () => void;
}

const SWIPE_THRESHOLD = 60;
const ACTION_WIDTH = 156; // 3 buttons × 52px

const SwipeableSessionItem = ({
  session: s,
  index: i,
  onSelect,
  onDelete,
  onTogglePin,
  onStartRename,
  isEditing,
  editTitle,
  onEditTitleChange,
  onConfirmRename,
  onCancelRename,
}: SwipeableSessionItemProps) => {
  const Icon = modeIcons[s.mode] || MessageSquare;
  const x = useMotionValue(0);
  const [swiped, setSwiped] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Background action buttons opacity based on drag
  const actionsOpacity = useTransform(x, [-ACTION_WIDTH, -SWIPE_THRESHOLD, 0], [1, 0.6, 0]);

  // Long-press to reveal actions
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDragging = useRef(false);

  const triggerHaptic = () => {
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const handlePointerDown = () => {
    isDragging.current = false;
    longPressTimer.current = setTimeout(() => {
      if (!isDragging.current && !swiped) {
        triggerHaptic();
        animate(x, -ACTION_WIDTH, { type: "spring", stiffness: 300, damping: 30 });
        setSwiped(true);
        localStorage.setItem("hint_coach_swipe_used", "1");
      }
    }, 500);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDragStart = () => {
    isDragging.current = true;
    handlePointerUp();
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) {
      triggerHaptic();
      animate(x, -ACTION_WIDTH, { type: "spring", stiffness: 300, damping: 30 });
      setSwiped(true);
      localStorage.setItem("hint_coach_swipe_used", "1");
    } else {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
      setSwiped(false);
    }
  };

  const closeSwipe = () => {
    animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
    setSwiped(false);
  };

  const handleAction = (action: () => void) => {
    action();
    closeSwipe();
  };

  return (
    <motion.div
      key={s.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.03, duration: 0.2 }}
      ref={containerRef}
      className="relative overflow-hidden rounded-xl"
    >
      {/* Action buttons behind the card */}
      <motion.div
        className="absolute inset-y-0 right-0 flex items-stretch"
        style={{ opacity: actionsOpacity }}
      >
        <button
          onClick={() => handleAction(() => onTogglePin(s.id, s.is_pinned))}
          className={`flex w-[52px] items-center justify-center transition-colors ${
            s.is_pinned
              ? "bg-primary/20 text-primary"
              : "bg-accent text-foreground"
          }`}
          aria-label={s.is_pinned ? "Unpin" : "Pin"}
        >
          {s.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
        </button>
        <button
          onClick={() => handleAction(() => onStartRename(s))}
          className="flex w-[52px] items-center justify-center bg-secondary text-foreground"
          aria-label="Rename"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleAction(() => onDelete(s.id))}
          className="flex w-[52px] items-center justify-center bg-destructive text-destructive-foreground"
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </motion.div>

      {/* Draggable card */}
      <motion.button
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -ACTION_WIDTH, right: 0 }}
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={() => {
          if (swiped) {
            closeSwipe();
          } else {
            onSelect(s.id, s.mode as CoachMode);
          }
        }}
        className={`relative w-full flex items-center gap-3 rounded-xl border bg-card p-3.5 text-left hover:border-primary/30 transition-colors active:scale-[0.98] group ${
          s.is_pinned ? "border-primary/40" : "border-border"
        }`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                autoFocus
                value={editTitle}
                onChange={(e) => onEditTitleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onConfirmRename();
                  if (e.key === "Escape") onCancelRename();
                }}
                className="flex-1 min-w-0 rounded-lg border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={(e) => { e.stopPropagation(); onConfirmRename(); }}
                className="flex h-6 w-6 items-center justify-center rounded-md text-primary hover:bg-primary/10 transition-colors"
                aria-label="Save"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onCancelRename(); }}
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent transition-colors"
                aria-label="Cancel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                {s.is_pinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
                {s.title || "Untitled conversation"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {modeLabels[s.mode] || s.mode} · {formatDistanceToNow(new Date(s.updated_at), { addSuffix: true })}
              </p>
            </>
          )}
        </div>
        {/* Desktop hover buttons (hidden on touch) */}
        {!isEditing && (
          <div className="hidden md:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
            <button
              onClick={(e) => { e.stopPropagation(); onTogglePin(s.id, s.is_pinned); }}
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                s.is_pinned ? "text-primary hover:text-muted-foreground" : "text-muted-foreground hover:text-primary"
              } hover:bg-accent`}
              aria-label={s.is_pinned ? "Unpin conversation" : "Pin conversation"}
            >
              {s.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onStartRename(s); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              aria-label="Rename conversation"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              aria-label="Delete conversation"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </motion.button>
    </motion.div>
  );
};

export default SwipeableSessionItem;
