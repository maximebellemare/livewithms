import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { Trash2, Edit2, MapPin, Clock, CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { getAppointmentTypeInfo, AppointmentType } from "@/lib/appointments";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SwipeableAppointmentCardProps {
  appt: {
    id: string;
    title: string;
    type: string;
    date: string;
    time: string | null;
    location: string | null;
    notes: string | null;
  };
  showDate: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const SWIPE_THRESHOLD = 60;
const ACTION_WIDTH = 72;

const SwipeableAppointmentCard = ({ appt, showDate, onEdit, onDelete }: SwipeableAppointmentCardProps) => {
  const isMobile = useIsMobile();
  const typeInfo = getAppointmentTypeInfo(appt.type as AppointmentType);
  const x = useMotionValue(0);
  const [swiped, setSwiped] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDragging = useRef(false);

  const actionsOpacity = useTransform(x, [-ACTION_WIDTH, -SWIPE_THRESHOLD, 0], [1, 0.6, 0]);

  const triggerHaptic = () => {
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const handlePointerDown = () => {
    if (!isMobile) return;
    isDragging.current = false;
    longPressTimer.current = setTimeout(() => {
      if (!isDragging.current && !swiped) {
        triggerHaptic();
        animate(x, -ACTION_WIDTH, { type: "spring", stiffness: 300, damping: 30 });
        setSwiped(true);
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
    } else {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
      setSwiped(false);
    }
  };

  const closeSwipe = () => {
    animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
    setSwiped(false);
  };

  const cardContent = (
    <>
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent text-lg">
        {typeInfo.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{appt.title}</p>
        <p className="text-xs text-muted-foreground">{typeInfo.label}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
          {showDate && (
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {format(parseISO(appt.date), "MMM d")}
            </span>
          )}
          {appt.time && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {appt.time}
            </span>
          )}
          {appt.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {appt.location}
            </span>
          )}
        </div>
        {appt.notes && <p className="mt-1 text-[11px] text-muted-foreground italic">{appt.notes}</p>}
      </div>
    </>
  );

  // Desktop: no swipe, show buttons inline
  if (!isMobile) {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-card p-4 shadow-soft animate-fade-in">
        {cardContent}
        <div className="flex gap-1">
          <button onClick={onEdit} className="rounded-full p-2 text-muted-foreground hover:bg-secondary">
            <Edit2 className="h-4 w-4" />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete appointment?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove "{appt.title}" from your calendar. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    );
  }

  // Mobile: swipe to reveal delete
  return (
    <div className="relative overflow-hidden rounded-xl animate-fade-in">
      {/* Delete action behind */}
      <motion.div
        className="absolute inset-y-0 right-0 flex items-stretch"
        style={{ opacity: actionsOpacity }}
      >
        <button
          onClick={() => {
            onEdit();
            closeSwipe();
          }}
          className="flex w-[36px] items-center justify-center bg-secondary text-foreground"
          aria-label="Edit"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            onDelete();
            closeSwipe();
          }}
          className="flex w-[36px] items-center justify-center bg-destructive text-destructive-foreground"
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </motion.div>

      {/* Draggable card */}
      <motion.div
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
          if (swiped) closeSwipe();
        }}
        className="relative flex items-start gap-3 rounded-xl bg-card p-4 shadow-soft"
      >
        {cardContent}
      </motion.div>
    </div>
  );
};

export default SwipeableAppointmentCard;
