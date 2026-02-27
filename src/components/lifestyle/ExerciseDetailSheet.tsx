import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion } from "framer-motion";

interface ExerciseInfo {
  name: string;
  sets?: string;
  reps?: string;
  rest?: string;
}

interface Props {
  exercise: ExerciseInfo | null;
  onClose: () => void;
  msType?: string | null;
}

export default function ExerciseDetailSheet({ exercise, onClose }: Props) {
  if (!exercise) return null;

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card shadow-lg"
      >
        <div className="flex justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="space-y-4 px-4 pb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-1">
              <h3 className="text-base font-bold text-foreground">{exercise.name}</h3>
              {(exercise.sets || exercise.reps) && (
                <p className="text-xs text-muted-foreground">
                  {exercise.sets && `${exercise.sets} sets`}
                  {exercise.reps && ` · ${exercise.reps}`}
                  {exercise.rest && ` · Rest: ${exercise.rest}`}
                </p>
              )}
            </div>
            <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </>,
    document.body
  );
}