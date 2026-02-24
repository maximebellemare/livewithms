import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { useLongPress } from "./sparkline/useLongPress";
import { toast } from "sonner";

interface PillProps {
  id: string;
  emoji: string;
  avg: number | null;
  colorFn: (v: number) => string;
  unit: string;
  onScrollTo: (key: string) => void;
  onUnpin: (key: string) => void;
}

interface SortablePinnedPillProps extends PillProps {
  index: number;
}

function PillContent({ id, emoji, avg, colorFn, unit, onScrollTo, onUnpin }: PillProps) {
  const lp = useLongPress(
    () => onScrollTo(id),
    () => { onUnpin(id); toast(`${emoji} ${id.charAt(0).toUpperCase() + id.slice(1)} unpinned`, { duration: 2000 }); },
    500,
  );
  return (
    <button
      className={`flex items-center gap-1.5 active:scale-95 transition-all ${lp.isPressing ? "opacity-60 scale-95" : ""}`}
      {...lp}
    >
      <span className="text-xs">{emoji}</span>
      <span
        className="text-sm font-bold leading-none"
        style={{ color: avg !== null ? colorFn(avg) : "hsl(var(--muted-foreground))" }}
      >
        {avg !== null ? avg.toFixed(1) : "—"}
      </span>
      <span className="text-[9px] text-muted-foreground">{unit}</span>
    </button>
  );
}

export default function SortablePinnedPill({
  id,
  emoji,
  avg,
  colorFn,
  unit,
  index,
  onScrollTo,
  onUnpin,
}: SortablePinnedPillProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={
        isDragging
          ? { opacity: 1, scale: 1.1, rotate: [0, -2, 2, -1, 0] }
          : { opacity: 1, scale: 1, rotate: 0 }
      }
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
      transition={
        isDragging
          ? { rotate: { duration: 0.3, ease: "easeInOut" }, scale: { duration: 0.15 } }
          : { type: "spring", stiffness: 400, damping: 20, delay: index * 0.06 }
      }
      className={`flex items-center gap-1.5 rounded-full bg-secondary/60 pl-1.5 pr-1.5 py-1.5 flex-shrink-0 transition-shadow duration-150 ${
        isDragging ? "shadow-lg ring-1 ring-primary/30" : ""
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none p-0.5 text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
        aria-label={`Drag to reorder ${id}`}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <circle cx="3" cy="2" r="1" />
          <circle cx="7" cy="2" r="1" />
          <circle cx="3" cy="5" r="1" />
          <circle cx="7" cy="5" r="1" />
          <circle cx="3" cy="8" r="1" />
          <circle cx="7" cy="8" r="1" />
        </svg>
      </button>
      <PillContent id={id} emoji={emoji} avg={avg} colorFn={colorFn} unit={unit} onScrollTo={onScrollTo} onUnpin={onUnpin} />
      <button
        onClick={() => onUnpin(id)}
        className="ml-0.5 rounded-full hover:bg-muted/60 active:scale-90 transition-all p-0.5 text-muted-foreground/50 hover:text-foreground"
        aria-label={`Unpin ${id}`}
      >
        <span className="text-[10px] leading-none">✕</span>
      </button>
    </motion.div>
  );
}
