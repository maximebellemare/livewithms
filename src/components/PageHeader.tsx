import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import NotificationBell from "./NotificationBell";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /** Show a back arrow that calls navigate(-1). Use on deeper pages behind the More menu. */
  showBack?: boolean;
}

const PageHeader = ({ title, subtitle, action, showBack = false }: PageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <div className="flex items-center gap-1.5">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors -ml-1"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </motion.div>
        </div>
        <div className="flex items-center gap-1">
          {action}
          <NotificationBell />
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
