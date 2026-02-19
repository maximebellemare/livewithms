import { ReactNode } from "react";
import NotificationBell from "./NotificationBell";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

const PageHeader = ({ title, subtitle, action }: PageHeaderProps) => (
  <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
    <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-1">
        {action}
        <NotificationBell />
      </div>
    </div>
  </header>
);

export default PageHeader;
