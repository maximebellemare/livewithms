import { motion } from "framer-motion";

export type Difficulty = "easy" | "medium" | "hard";

const levels: { id: Difficulty; label: string; color: string }[] = [
  { id: "easy", label: "Easy", color: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30" },
  { id: "medium", label: "Medium", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  { id: "hard", label: "Hard", color: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30" },
];

interface DifficultySelectorProps {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
  disabled?: boolean;
}

const DifficultySelector = ({ value, onChange, disabled }: DifficultySelectorProps) => (
  <div className="flex gap-1.5">
    {levels.map((l) => (
      <button
        key={l.id}
        onClick={() => onChange(l.id)}
        disabled={disabled}
        className={`relative rounded-lg px-3 py-1.5 text-xs font-medium border transition-all disabled:opacity-50 ${
          value === l.id ? l.color : "bg-secondary text-muted-foreground border-transparent hover:text-foreground"
        }`}
      >
        {value === l.id && (
          <motion.div
            layoutId="difficulty-pill"
            className="absolute inset-0 rounded-lg border border-current opacity-30"
            transition={{ duration: 0.2 }}
          />
        )}
        {l.label}
      </button>
    ))}
  </div>
);

export default DifficultySelector;
