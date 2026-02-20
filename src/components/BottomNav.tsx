import { NavLink, useLocation } from "react-router-dom";
import { Home, BarChart3, TrendingUp, BookOpen, NotebookPen, Phone, Users } from "lucide-react";
import { motion, LayoutGroup } from "framer-motion";
import { useUnreadCommunityPosts } from "@/hooks/useUnreadCommunity";

const baseTabs = [
  { to: "/today",     icon: Home,        label: "Today" },
  { to: "/track",     icon: BarChart3,   label: "Track" },
  { to: "/insights",  icon: TrendingUp,  label: "Insights" },
  { to: "/journal",   icon: NotebookPen, label: "Journal" },
  { to: "/community", icon: Users,       label: "Community" },
  { to: "/learn",     icon: BookOpen,    label: "Learn" },
];

const BottomNav = () => {
  const location = useLocation();
  const { data: unreadCount = 0 } = useUnreadCommunityPosts();

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
        <LayoutGroup>
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1">
          {baseTabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `tap-highlight-none relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <motion.div
                    className="relative"
                    animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Icon
                      className={`h-5 w-5 transition-all ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`}
                    />
                    {to === "/community" && unreadCount > 0 && !isActive && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1.5 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-primary-foreground"
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </motion.span>
                    )}
                  </motion.div>
                  <span className={`text-[10px] ${isActive ? "font-semibold" : ""}`}>{label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -top-px left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
        </LayoutGroup>
      </nav>
    </div>
  );
};

export default BottomNav;
