import { motion } from "framer-motion";

interface StepIndicatorProps {
  current: number;
  total: number;
  label?: string;
  className?: string;
}

/**
 * Minimal step indicator — "Step 2 of 5" with animated dot track.
 * Designed for multi-step exercises and flows.
 */
const StepIndicator = ({ current, total, label, className = "" }: StepIndicatorProps) => (
  <div className={`flex flex-col items-center gap-1.5 ${className}`}>
    <p className="text-xs font-medium text-muted-foreground">
      {label ? `${label} · ` : ""}
      <span className="text-foreground">Step {current}</span> of {total}
    </p>
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <motion.div
          key={i}
          className={`h-1.5 rounded-full transition-colors duration-300 ${
            i < current ? "bg-primary" : "bg-muted"
          }`}
          animate={{ width: i === current - 1 ? 20 : 6 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      ))}
    </div>
  </div>
);

export default StepIndicator;
