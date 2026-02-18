import { NavLink, useLocation } from "react-router-dom";
import { Home, BarChart3, TrendingUp, BookOpen, NotebookPen } from "lucide-react";

const tabs = [
  { to: "/today",   icon: Home,         label: "Today" },
  { to: "/track",   icon: BarChart3,    label: "Track" },
  { to: "/insights",icon: TrendingUp,   label: "Insights" },
  { to: "/journal", icon: NotebookPen,  label: "Journal" },
  { to: "/learn",   icon: BookOpen,     label: "Learn" },
];

const BottomNav = () => {
  const location = useLocation();

  // Hide on onboarding
  if (location.pathname.startsWith("/onboarding") || location.pathname === "/" || location.pathname === "/auth") {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `tap-highlight-none flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`h-5 w-5 transition-all ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`}
                />
                <span className={isActive ? "font-semibold" : ""}>{label}</span>
                {isActive && (
                  <div className="absolute -top-px left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
