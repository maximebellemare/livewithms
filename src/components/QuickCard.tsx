interface QuickCardProps {
  emoji: string;
  title: string;
  subtitle: string;
  onClick?: () => void;
  accent?: boolean;
}

const QuickCard = ({ emoji, title, subtitle, onClick, accent }: QuickCardProps) => (
  <button
    onClick={onClick}
    className={`tap-highlight-none flex w-full items-center gap-3 rounded-xl p-4 text-left shadow-soft transition-all active:scale-[0.98] ${
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
  </button>
);

export default QuickCard;
