const moodTags = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😌", label: "Calm" },
  { emoji: "😤", label: "Frustrated" },
  { emoji: "😔", label: "Sad" },
  { emoji: "😰", label: "Anxious" },
  { emoji: "😴", label: "Tired" },
  { emoji: "💪", label: "Strong" },
  { emoji: "🌧️", label: "Low" },
];

interface MoodSelectorProps {
  selected: string[];
  onToggle: (tag: string) => void;
}

const MoodSelector = ({ selected, onToggle }: MoodSelectorProps) => (
  <div className="rounded-xl bg-card p-4 shadow-soft">
    <p className="mb-3 text-sm font-medium text-foreground">How are you feeling?</p>
    <div className="flex flex-wrap gap-2">
      {moodTags.map(({ emoji, label }) => (
        <button
          key={label}
          onClick={() => onToggle(label)}
          className={`tap-highlight-none flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
            selected.includes(label)
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          <span>{emoji}</span>
          {label}
        </button>
      ))}
    </div>
  </div>
);

export default MoodSelector;
