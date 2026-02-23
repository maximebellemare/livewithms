import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, BarChart3, Brain, BookOpen, MessageCircle, Shield } from "lucide-react";

const screens = [
  {
    icon: Activity,
    title: "Track Symptoms",
    color: "from-orange-500/20 to-amber-500/10",
    accent: "text-orange-400",
    mockup: (
      <div className="space-y-2">
        {["Fatigue", "Brain Fog", "Pain"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className="text-[10px] text-foreground/70 w-14 text-right">{s}</span>
            <div className="flex-1 h-2 rounded-full bg-muted/40 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${[72, 45, 58][i]}%` }}
                transition={{ duration: 0.8, delay: i * 0.15 }}
                className="h-full rounded-full bg-orange-400/70"
              />
            </div>
          </div>
        ))}
        <div className="flex items-center gap-1.5 mt-1.5">
          {["😴", "😊", "😐", "🙁"].map((e) => (
            <div key={e} className="h-6 w-6 rounded-lg bg-muted/30 flex items-center justify-center text-[11px]">{e}</div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: BarChart3,
    title: "Smart Insights",
    color: "from-emerald-500/20 to-teal-500/10",
    accent: "text-emerald-400",
    mockup: (
      <div>
        <div className="flex items-end gap-[3px] h-10 mb-1.5">
          {[40, 55, 35, 65, 50, 75, 60].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex-1 rounded-sm bg-emerald-400/60"
            />
          ))}
        </div>
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-1.5">
          <p className="text-[9px] text-emerald-400 font-medium">✨ Pattern found</p>
          <p className="text-[8px] text-muted-foreground">Better sleep → less fatigue</p>
        </div>
      </div>
    ),
  },
  {
    icon: Brain,
    title: "Cognitive Games",
    color: "from-violet-500/20 to-purple-500/10",
    accent: "text-violet-400",
    mockup: (
      <div className="flex flex-col items-center gap-2">
        <div className="grid grid-cols-3 gap-1.5">
          {[1, 2, 3, 4, 5, 6].map((n, i) => (
            <motion.div
              key={n}
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: i * 0.08 }}
              className={`h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                i < 3 ? "bg-violet-400/30 text-violet-300" : "bg-muted/30 text-muted-foreground/50"
              }`}
            >
              {i < 3 ? n : "?"}
            </motion.div>
          ))}
        </div>
        <div className="flex items-center gap-1 text-[9px] text-violet-400">
          <span>🔥</span> 5-day streak
        </div>
      </div>
    ),
  },
  {
    icon: BookOpen,
    title: "Learn",
    color: "from-sky-500/20 to-blue-500/10",
    accent: "text-sky-400",
    mockup: (
      <div className="space-y-1.5">
        {["Managing Fatigue", "Sleep & MS", "Diet Tips"].map((title, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12 }}
            className="flex items-center gap-2 rounded-lg bg-sky-500/10 border border-sky-500/15 px-2 py-1.5"
          >
            <div className="h-5 w-5 rounded bg-sky-400/20 flex items-center justify-center text-[9px]">📖</div>
            <div>
              <p className="text-[9px] font-medium text-foreground/80">{title}</p>
              <p className="text-[7px] text-muted-foreground">3 min read</p>
            </div>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    icon: MessageCircle,
    title: "Community",
    color: "from-rose-500/20 to-pink-500/10",
    accent: "text-rose-400",
    mockup: (
      <div className="space-y-1.5">
        {[
          { name: "Sarah", msg: "Feeling great today! 🌟", time: "2m" },
          { name: "Mike", msg: "Any tips for brain fog?", time: "5m" },
        ].map((post, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className="flex items-start gap-2 rounded-lg bg-rose-500/10 border border-rose-500/15 px-2 py-1.5"
          >
            <div className="h-5 w-5 rounded-full bg-rose-400/30 flex items-center justify-center text-[8px] font-bold text-rose-300 flex-shrink-0 mt-0.5">
              {post.name[0]}
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-medium text-foreground/80">{post.name} <span className="text-muted-foreground/50 font-normal">· {post.time}</span></p>
              <p className="text-[8px] text-muted-foreground truncate">{post.msg}</p>
            </div>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    icon: Shield,
    title: "Relapse Tracking",
    color: "from-amber-500/20 to-yellow-500/10",
    accent: "text-amber-400",
    mockup: (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-emerald-500/20 border-2 border-emerald-400/40 flex items-center justify-center">
            <span className="text-[10px] font-bold text-emerald-400">Low</span>
          </div>
          <div>
            <p className="text-[9px] font-medium text-foreground/80">Risk Level</p>
            <p className="text-[8px] text-muted-foreground">142 days relapse-free</p>
          </div>
        </div>
        <div className="flex gap-[2px]">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className={`flex-1 h-2 rounded-sm ${i < 12 ? "bg-emerald-400/40" : "bg-muted/30"}`} />
          ))}
        </div>
      </div>
    ),
  },
];

const AppPreview = () => {
  const [active, setActive] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % screens.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -12, y: x * 12 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  const screen = screens[active];
  const Icon = screen.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-6 w-full max-w-[280px] mx-auto"
      style={{ perspective: 600 }}
    >
      {/* Phone frame */}
      <motion.div
        ref={frameRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{ rotateX: tilt.x, rotateY: tilt.y }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm shadow-lg overflow-hidden"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/30">
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
            <span className="text-[8px] font-medium text-muted-foreground/60">LiveWithMS</span>
          </div>
          <div className="flex gap-0.5">
            {[1, 2, 3].map((b) => (
              <div key={b} className="h-1 w-1 rounded-full bg-muted-foreground/20" />
            ))}
          </div>
        </div>

        {/* Screen content */}
        <div className="relative h-[140px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className={`absolute inset-0 p-3 bg-gradient-to-br ${screen.color}`}
            >
              {/* Header */}
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className={`h-3.5 w-3.5 ${screen.accent}`} />
                <span className={`text-[11px] font-semibold ${screen.accent}`}>{screen.title}</span>
              </div>
              {/* Mock UI */}
              {screen.mockup}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom nav mock */}
        <div className="flex items-center justify-around px-2 py-1.5 border-t border-border/30">
          {screens.map((s, i) => {
            const NavIcon = s.icon;
            return (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`p-1 rounded-md transition-colors ${
                  i === active ? "text-primary bg-primary/10" : "text-muted-foreground/30"
                }`}
              >
                <NavIcon className="h-3 w-3" />
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Label + dots */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {screens.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === active ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default AppPreview;
