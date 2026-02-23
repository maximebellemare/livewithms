import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, BookOpen, Brain, MessageCircle, Activity, Shield } from "lucide-react";

const features = [
  { icon: Activity, label: "Track Symptoms", desc: "Log daily symptoms, mood, and energy levels", color: "text-orange-400" },
  { icon: BarChart3, label: "Smart Insights", desc: "Discover patterns and correlations in your health", color: "text-emerald-400" },
  { icon: Brain, label: "Cognitive Games", desc: "Fun exercises to keep your mind sharp", color: "text-violet-400" },
  { icon: BookOpen, label: "Learn", desc: "Evidence-based articles tailored to you", color: "text-sky-400" },
  { icon: MessageCircle, label: "Community", desc: "Connect with others who understand", color: "text-rose-400" },
  { icon: Shield, label: "Relapse Tracking", desc: "Monitor risk factors and stay prepared", color: "text-amber-400" },
];

const FeatureCarousel = () => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % features.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="mt-6 w-full max-w-xs mx-auto"
    >
      {/* Feature card */}
      <div className="relative h-[72px] rounded-xl bg-card/80 border border-border/50 shadow-soft overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center gap-3.5 px-4"
          >
            {(() => {
              const Feature = features[active];
              const Icon = Feature.icon;
              return (
                <>
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 ${Feature.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-semibold text-foreground">{Feature.label}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{Feature.desc}</p>
                  </div>
                </>
              );
            })()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="mt-3 flex justify-center gap-1.5">
        {features.map((_, i) => (
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

export default FeatureCarousel;
