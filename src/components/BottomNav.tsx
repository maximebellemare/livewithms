import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, BarChart3, TrendingUp, NotebookPen, Phone, Users, MoreHorizontal, MessageCircle, BookOpen, AlertTriangle, FileText, CalendarDays, Pill, UserCog, Award, History } from "lucide-react";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import { useUnreadCommunityPosts } from "@/hooks/useUnreadCommunity";
import { useUnreadMessagesCount } from "@/hooks/useMessages";
import MedicalDisclaimerDialog from "@/components/MedicalDisclaimerDialog";

const mainTabs = [
  { to: "/today",     icon: Home,        label: "Today" },
  { to: "/track",     icon: BarChart3,   label: "Track" },
  { to: "/insights",  icon: TrendingUp,  label: "Insights" },
  { to: "/journal",   icon: NotebookPen, label: "Journal" },
  { to: "/community", icon: Users,       label: "Community" },
];

const moreTabs = [
  { to: "/my-ms-history", icon: History,      label: "My MS History" },
  { to: "/relapses",     icon: AlertTriangle, label: "Relapses" },
  { to: "/medications",  icon: Pill,          label: "Medications" },
  { to: "/reports",      icon: FileText,      label: "Reports" },
  { to: "/appointments", icon: CalendarDays,  label: "Appointments" },
  { to: "/messages",     icon: MessageCircle, label: "Messages" },
  { to: "/badges",       icon: Award,         label: "Badges" },
  { to: "/learn",        icon: BookOpen,      label: "Learn" },
  { to: "/profile",      icon: UserCog,       label: "Profile & Settings" },
];

const vibrate = (pattern: number | number[] = 10) => {
  if (navigator.vibrate) navigator.vibrate(pattern);
};

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: unreadCount = 0 } = useUnreadCommunityPosts();
  const { data: unreadMessages = 0 } = useUnreadMessagesCount();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const isMoreActive = moreTabs.some((t) => location.pathname.startsWith(t.to));
  const moreBadge = unreadMessages || 0;

  // Close on outside click
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [moreOpen]);

  // Close on route change
  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  if (location.pathname.startsWith("/onboarding") || location.pathname === "/" || location.pathname === "/auth") {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Crisis banner */}
      <div className="border-t border-border/50 bg-card/90 backdrop-blur-sm" role="complementary" aria-label="Crisis resources">
        <div className="mx-auto max-w-lg flex items-center justify-center gap-1.5 px-4 py-1">
          <Phone className="h-2.5 w-2.5 text-muted-foreground/60" aria-hidden="true" />
          <span className="text-[9px] text-muted-foreground/60">
            Crisis?{" "}
            <a href="tel:988" className="font-semibold text-primary/70 hover:text-primary">Call 988</a>
            {" · "}
            <a href="https://www.nationalmssociety.org" target="_blank" rel="noopener noreferrer" className="text-primary/70 hover:text-primary">MS Society</a>
            {" · "}
            <MedicalDisclaimerDialog />
          </span>
        </div>
      </div>
      {/* Nav tabs */}
      <nav className="border-t border-border bg-card/95 backdrop-blur-lg safe-bottom" aria-label="Main navigation">
        <LayoutGroup>
          <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1" role="tablist">
            {mainTabs.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                aria-label={to === "/community" && unreadCount > 0 ? `${label} (${unreadCount} new)` : label}
                aria-current={location.pathname === to ? "page" : undefined}
                className={({ isActive }) =>
                  `tap-highlight-none relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-xs font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
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
                        aria-hidden="true"
                      />
                      {to === "/community" && unreadCount > 0 && !isActive && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1.5 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-primary-foreground"
                          aria-hidden="true"
                        >
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </motion.span>
                      )}
                    </motion.div>
                    <span className={`text-[10px] ${isActive ? "font-semibold" : ""}`} aria-hidden="true">{label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute -top-px left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                        aria-hidden="true"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}

            {/* More button */}
            <div ref={moreRef} className="relative">
              <button
                onClick={() => { vibrate(); setMoreOpen((o) => !o); }}
                aria-label={moreBadge > 0 ? `More (${moreBadge} new)` : "More"}
                aria-expanded={moreOpen}
                className={`tap-highlight-none relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-xs font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  isMoreActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <motion.div
                  className="relative"
                  animate={isMoreActive ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <MoreHorizontal
                    className={`h-5 w-5 transition-all ${isMoreActive ? "stroke-[2.5]" : "stroke-[1.5]"}`}
                    aria-hidden="true"
                  />
                  {moreBadge > 0 && !isMoreActive && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1.5 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-primary-foreground"
                      aria-hidden="true"
                    >
                      {moreBadge > 99 ? "99+" : moreBadge}
                    </motion.span>
                  )}
                </motion.div>
                <span className={`text-[10px] ${isMoreActive ? "font-semibold" : ""}`} aria-hidden="true">More</span>
                {isMoreActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-px left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    aria-hidden="true"
                  />
                )}
              </button>

              {/* Sheet overlay + slide-up panel */}
              <AnimatePresence>
                {moreOpen && (
                  <>
                    {/* Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="fixed inset-0 z-[59] bg-black/40"
                      onClick={() => setMoreOpen(false)}
                    />
                    {/* Sheet */}
                    <motion.div
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      drag="y"
                      dragConstraints={{ top: 0, bottom: 0 }}
                      dragElastic={{ top: 0, bottom: 0.6 }}
                      onDragEnd={(_, info) => {
                        if (info.offset.y > 80 || info.velocity.y > 300) {
                          vibrate([5, 30, 5]);
                          setMoreOpen(false);
                        }
                      }}
                      className="fixed bottom-0 left-0 right-0 z-[60] rounded-t-2xl border-t border-border bg-card pb-safe touch-none"
                    >
                      {/* Handle */}
                      <div className="flex justify-center pt-3 pb-1">
                        <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
                      </div>
                      {/* Items */}
                      <div className="px-4 pb-6 space-y-1">
                        {moreTabs.map(({ to, icon: Icon, label }, index) => {
                          const active = location.pathname.startsWith(to);
                          const badge = to === "/messages" ? unreadMessages : 0;
                          const isLast = index === moreTabs.length - 1;
                          return (
                            <div key={to}>
                              {isLast && (
                                <div className="my-1 border-t border-border/50" />
                              )}
                              <button
                                onClick={() => { setMoreOpen(false); navigate(to); }}
                                className={`flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-sm transition-colors hover:bg-accent ${
                                  active ? "text-primary font-semibold bg-accent/50" : "text-foreground"
                                }`}
                              >
                                <Icon className="h-5 w-5" />
                                <span className="flex-1 text-left text-base">{label}</span>
                                {badge > 0 && (
                                  <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                                    {badge > 99 ? "99+" : badge}
                                  </span>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </LayoutGroup>
      </nav>
    </div>
  );
};

export default BottomNav;
