import { useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";

interface Props {
  streak: number;
  onDismiss: () => void;
}

const MILESTONES: Record<number, { emoji: string; headline: string; sub: string }> = {
  7:  { emoji: "🔥", headline: "7-Day Streak!", sub: "One week of consistent tracking — you're building a powerful habit." },
  14: { emoji: "⭐", headline: "14-Day Streak!", sub: "Two weeks strong! Your data is becoming a real health story." },
  30: { emoji: "🏆", headline: "30-Day Streak!", sub: "An entire month of dedication. You're an MS tracking champion!" },
};

/* ── Confetti particle ────────────────────────────────────── */
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

const COLORS = ["#f97316","#eab308","#22c55e","#3b82f6","#a855f7","#ec4899","#14b8a6"];

function randomParticle(canvasW: number): Particle {
  return {
    x: Math.random() * canvasW,
    y: -10,
    vx: (Math.random() - 0.5) * 3,
    vy: Math.random() * 2 + 1.5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: Math.random() * 6 + 4,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 8,
    opacity: 1,
  };
}

const ConfettiCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: Particle[] = [];
    let frame = 0;
    let animId: number;

    const spawn = () => {
      for (let i = 0; i < 4; i++) particles.push(randomParticle(canvas.width));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn new particles for first ~2 seconds
      if (frame < 80 && frame % 3 === 0) spawn();
      frame++;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.04; // gravity
        p.rotation += p.rotationSpeed;

        if (p.y > canvas.height + 20) {
          p.opacity -= 0.05;
        }
        if (p.opacity <= 0) { particles.splice(i, 1); continue; }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }

      if (particles.length > 0 || frame < 80) {
        animId = requestAnimationFrame(draw);
      }
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 w-full h-full"
    />
  );
};

/* ── Main banner ──────────────────────────────────────────── */
const StreakMilestoneBanner = ({ streak, onDismiss }: Props) => {
  const [visible, setVisible] = useState(true);
  const [entered, setEntered] = useState(false);
  const milestone = MILESTONES[streak];

  useEffect(() => {
    // Small delay before entrance so the animation is noticeable
    const t = setTimeout(() => setEntered(true), 50);
    return () => clearTimeout(t);
  }, []);

  if (!milestone || !visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    onDismiss();
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-accent via-card to-accent shadow-card transition-all duration-500 ${
        entered ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}
    >
      {/* Confetti layer */}
      <ConfettiCanvas />

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-3 z-10 rounded-full p-1 text-muted-foreground hover:bg-secondary transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Content */}
      <div className="relative px-5 py-6 text-center">
        {/* Pulsing glow ring behind emoji */}
        <div className="relative mx-auto mb-3 flex items-center justify-center">
          <span
            className="absolute inline-flex h-20 w-20 rounded-full bg-primary/20 animate-ping"
            style={{ animationDuration: "1.5s" }}
          />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/30 text-4xl shadow-[0_0_24px_rgba(var(--primary),0.25)]">
            {milestone.emoji}
          </span>
        </div>

        {/* Sparkles + headline */}
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <p className="text-xl font-bold text-foreground font-display">{milestone.headline}</p>
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
        </div>

        <p className="text-sm text-muted-foreground leading-snug max-w-[260px] mx-auto">
          {milestone.sub}
        </p>

        {/* Streak pill */}
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5">
          <span className="text-lg">🔥</span>
          <span className="text-sm font-bold text-primary">{streak} days in a row</span>
        </div>

        <p className="mt-3 text-[10px] text-muted-foreground">
          Tap ✕ to dismiss · Keep going!
        </p>
      </div>
    </div>
  );
};

export default StreakMilestoneBanner;
