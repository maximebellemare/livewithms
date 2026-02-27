import { useState, useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Check, Minus, Plus, Trash2 } from "lucide-react";

interface SwipeableActivityRowProps {
  activity: {
    id: string;
    name: string;
    spoon_cost: number;
    completed: boolean;
  };
  onToggle: () => void;
  onDelete: () => void;
  onUpdateCost: (cost: number) => void;
  editingCostId: string | null;
  setEditingCostId: (id: string | null) => void;
}

const SWIPE_THRESHOLD = -80;

export default function SwipeableActivityRow({
  activity,
  onToggle,
  onDelete,
  onUpdateCost,
  editingCostId,
  setEditingCostId,
}: SwipeableActivityRowProps) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-100, -60, 0], [1, 0.8, 0]);
  const deleteScale = useTransform(x, [-100, -60, 0], [1, 0.8, 0.5]);
  const [swiped, setSwiped] = useState(false);

  const handleDragEnd = useCallback(
    (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
      if (info.offset.x < SWIPE_THRESHOLD || info.velocity.x < -500) {
        // Animate out and delete
        animate(x, -300, { duration: 0.2 }).then(() => onDelete());
      } else {
        animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
        setSwiped(false);
      }
    },
    [onDelete, x]
  );

  const isEditing = editingCostId === activity.id;

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Delete background */}
      <motion.div
        className="absolute inset-0 flex items-center justify-end px-4 bg-destructive rounded-lg"
        style={{ opacity: deleteOpacity }}
      >
        <motion.div style={{ scale: deleteScale }} className="flex items-center gap-1.5 text-destructive-foreground">
          <Trash2 className="h-4 w-4" />
          <span className="text-xs font-medium">Delete</span>
        </motion.div>
      </motion.div>

      {/* Swipeable row */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        className={`relative flex items-center gap-3 px-3 py-2.5 transition-colors ${
          activity.completed ? "bg-primary/8 opacity-60" : "bg-secondary"
        }`}
      >
        <button
          onClick={onToggle}
          className={`flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
            activity.completed
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/40 hover:border-primary"
          }`}
        >
          {activity.completed && <Check className="h-3 w-3" />}
        </button>
        <div className="flex-1 min-w-0">
          <span
            className={`text-sm transition-all ${
              activity.completed ? "line-through text-muted-foreground" : "text-foreground font-medium"
            }`}
          >
            {activity.name}
          </span>
        </div>
        {isEditing ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onUpdateCost(Math.max(0, activity.spoon_cost - 1))}
              className="rounded bg-secondary p-0.5 hover:bg-muted active:scale-95"
            >
              <Minus className="h-2.5 w-2.5" />
            </button>
            <span className="text-xs font-semibold min-w-[2ch] text-center">
              {activity.spoon_cost}🥄
            </span>
            <button
              onClick={() => onUpdateCost(Math.min(10, activity.spoon_cost + 1))}
              className="rounded bg-secondary p-0.5 hover:bg-muted active:scale-95"
            >
              <Plus className="h-2.5 w-2.5" />
            </button>
            <button
              onClick={() => setEditingCostId(null)}
              className="rounded-full bg-primary p-0.5 text-primary-foreground ml-0.5 active:scale-95"
            >
              <Check className="h-2.5 w-2.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingCostId(activity.id)}
            className={`text-xs whitespace-nowrap transition-all hover:text-primary ${
              activity.completed ? "text-muted-foreground/50 line-through" : "text-muted-foreground"
            }`}
            title="Tap to adjust spoon cost"
          >
            {activity.spoon_cost}🥄
          </button>
        )}
      </motion.div>
    </div>
  );
}
