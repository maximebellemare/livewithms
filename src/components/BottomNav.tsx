import { NavLink, useLocation } from "react-router-dom";
import { Home, BarChart3, TrendingUp, BookOpen, NotebookPen, Phone } from "lucide-react";

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
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Crisis banner */}
      <div className="border-t border-border/50 bg-card/90 backdrop-blur-sm">
        <div className="mx-auto max-w-lg flex items-center justify-center gap-1.5 px-4 py-1">
          <Phone className="h-2.5 w-2.5 text-muted-foreground/60" />
          <span className="text-[9px] text-muted-foreground/60">
            Crisis?{" "}
            <a href="tel:988" className="font-semibold text-primary/70 hover:text-primary">
              Call 988
            </a>
            {" · "}
            <a href="https://www.nationalmssociety.org" target="_blank" rel="noopener noreferrer" className="text-primary/70 hover:text-primary">
              MS Society
            </a>
          </span>
        </div>
      </div>
      {/* Nav tabs */}
      <nav className="border-t border-border bg-card/95 backdrop-blur-lg safe-bottom">
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
    </div>
  );
};

export default BottomNav;
