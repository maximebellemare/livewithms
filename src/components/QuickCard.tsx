import { forwardRef } from "react";
import { motion } from "framer-motion";

interface QuickCardProps {
  emoji: string;
  title: string;
  subtitle: string;
  onClick?: () => void;
  accent?: boolean;
}

const QuickCard = forwardRef<HTMLButtonElement, QuickCardProps>(
  ({ emoji, title, subtitle, onClick, accent }, ref) => (
    <motion.button
      ref={ref as any}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={`tap-highlight-none flex w-full items-center gap-3 rounded-xl p-4 text-left shadow-soft transition-colors ${
        accent ? "bg-accent" : "bg-card"
      }`}
    >
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent text-lg">
        {emoji}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </motion.button>
  )
);

QuickCard.displayName = "QuickCard";

export default QuickCard;
