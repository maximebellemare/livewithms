import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Flame, Zap, Heart, Clock, AlertTriangle } from "lucide-react";

type MSExercise = {
  id: string;
  name: string;
  category: "cardio" | "strength" | "flexibility" | "balance";
  fatigueLevel: "low" | "moderate" | "high";
  duration: string;
  benefits: string[];
  description: string;
  msTips: string;
  heatSafe: boolean;
};

const EXERCISES: MSExercise[] = [
  {
    id: "aqua", name: "Aquatic Exercise", category: "cardio", fatigueLevel: "low",
    duration: "20–30 min", heatSafe: true,
    benefits: ["Reduces spasticity", "Improves balance", "Low joint impact", "Natural cooling"],
    description: "Exercising in cool water (27-29°C) helps manage body temperature while building strength and endurance.",
    msTips: "Pool temperature matters — avoid hot pools. Start with 15 minutes and build up. Water supports your body weight, making movement easier.",
  },
  {
    id: "yoga", name: "Adaptive Yoga", category: "flexibility", fatigueLevel: "low",
    duration: "15–30 min", heatSafe: true,
    benefits: ["Reduces stress", "Improves flexibility", "Better balance", "Mood boost"],
    description: "Modified yoga poses designed for varying ability levels, using chairs or walls for support.",
    msTips: "Chair yoga is excellent for days with high fatigue. Focus on breathing techniques which also help with anxiety and pain management.",
  },
  {
    id: "walking", name: "Walking Program", category: "cardio", fatigueLevel: "moderate",
    duration: "10–30 min", heatSafe: false,
    benefits: ["Cardiovascular health", "Mood improvement", "Bone density", "Social activity"],
    description: "Progressive walking tailored to your energy levels, starting with short intervals.",
    msTips: "Walk during cooler parts of the day. Use cooling vest in warm weather. Break into 10-minute sessions if fatigue is high. Consider using a walking aid on difficult days.",
  },
  {
    id: "resistance", name: "Resistance Bands", category: "strength", fatigueLevel: "moderate",
    duration: "15–20 min", heatSafe: true,
    benefits: ["Muscle strength", "Bone health", "Functional mobility", "Easy to modify"],
    description: "Gentle resistance training using elastic bands — adjustable difficulty, can be done seated.",
    msTips: "Start with the lightest band. Do exercises seated if balance is a concern. Focus on large muscle groups first. Rest 60–90 seconds between sets.",
  },
  {
    id: "tai-chi", name: "Tai Chi", category: "balance", fatigueLevel: "low",
    duration: "15–30 min", heatSafe: true,
    benefits: ["Fall prevention", "Balance", "Stress relief", "Pain reduction"],
    description: "Slow, flowing movements that improve balance, coordination, and mindfulness.",
    msTips: "Excellent for improving balance and reducing fall risk. Can be done seated. The slow pace is ideal for managing fatigue.",
  },
  {
    id: "pilates", name: "Modified Pilates", category: "strength", fatigueLevel: "moderate",
    duration: "20–30 min", heatSafe: true,
    benefits: ["Core strength", "Posture", "Flexibility", "Bladder control"],
    description: "Core-focused exercises modified for MS — strengthens the trunk muscles that support balance and posture.",
    msTips: "Strong core muscles help with balance and reduce fall risk. Pelvic floor exercises can help with bladder issues common in MS.",
  },
  {
    id: "cycling", name: "Recumbent Cycling", category: "cardio", fatigueLevel: "moderate",
    duration: "15–25 min", heatSafe: true,
    benefits: ["Cardiovascular fitness", "Leg strength", "Low fall risk", "Climate controlled"],
    description: "Seated cycling on a recumbent bike — provides back support and eliminates balance concerns.",
    msTips: "The reclined position supports your back. Start with low resistance. Indoor cycling lets you control temperature. Use a fan for cooling.",
  },
  {
    id: "stretching", name: "Stretching Routine", category: "flexibility", fatigueLevel: "low",
    duration: "10–15 min", heatSafe: true,
    benefits: ["Spasticity relief", "Range of motion", "Pain reduction", "Sleep quality"],
    description: "Gentle stretches targeting muscles commonly affected by MS spasticity.",
    msTips: "Stretch daily, especially before bed to reduce nighttime spasticity. Hold stretches for 30–60 seconds. Never bounce. Focus on calves, hamstrings, and hip flexors.",
  },
  {
    id: "seated-strength", name: "Seated Strength Training", category: "strength", fatigueLevel: "low",
    duration: "15–20 min", heatSafe: true,
    benefits: ["Upper body strength", "Independence", "Bone density", "Low fall risk"],
    description: "Dumbbell or bodyweight exercises performed entirely from a chair, targeting arms, shoulders, and core.",
    msTips: "Use a sturdy chair with armrests. Light weights (1–3 kg) are enough. Great on high-fatigue days when standing exercises feel unsafe.",
  },
  {
    id: "balance-training", name: "Balance & Gait Training", category: "balance", fatigueLevel: "moderate",
    duration: "10–20 min", heatSafe: true,
    benefits: ["Fall prevention", "Walking confidence", "Coordination", "Ankle strength"],
    description: "Targeted drills like heel-to-toe walking, single-leg stands, and weight shifts to improve stability and walking patterns.",
    msTips: "Always train near a wall or counter for support. Practice during your best-energy window. Even 5 minutes daily can significantly reduce fall risk.",
  },
  {
    id: "foam-rolling", name: "Foam Rolling & Self-Massage", category: "flexibility", fatigueLevel: "low",
    duration: "10–15 min", heatSafe: true,
    benefits: ["Muscle tension relief", "Circulation", "Spasticity management", "Relaxation"],
    description: "Using a foam roller or massage ball to release tight muscles, reduce spasticity, and improve tissue mobility.",
    msTips: "Use a soft-density roller. Avoid rolling directly on joints. Focus on calves, quads, and IT band. Can be done in bed with a massage ball on tough days.",
  },
  {
    id: "hand-therapy", name: "Hand & Grip Exercises", category: "strength", fatigueLevel: "low",
    duration: "5–10 min", heatSafe: true,
    benefits: ["Fine motor skills", "Grip strength", "Dexterity", "Daily task ability"],
    description: "Squeezing therapy putty, finger extensions, and grip exercises to maintain hand function and dexterity.",
    msTips: "Loss of grip is common in MS — these exercises slow progression. Keep therapy putty at your desk for easy practice throughout the day.",
  },
  {
    id: "elliptical", name: "Elliptical Trainer", category: "cardio", fatigueLevel: "moderate",
    duration: "10–20 min", heatSafe: true,
    benefits: ["Low-impact cardio", "Full-body workout", "Leg strength", "Endurance"],
    description: "Smooth, gliding motion that works both arms and legs without the jarring impact of running or jogging.",
    msTips: "Handles provide stability so balance is less of a concern. Start at the lowest resistance. Keep sessions short and increase gradually over weeks.",
  },
  {
    id: "breathing", name: "Breathing Exercises", category: "flexibility", fatigueLevel: "low",
    duration: "5–10 min", heatSafe: true,
    benefits: ["Respiratory strength", "Stress relief", "Energy boost", "Pain management"],
    description: "Diaphragmatic breathing, pursed-lip breathing, and rib expansion exercises to improve lung capacity and relaxation.",
    msTips: "MS can weaken respiratory muscles over time. Daily breathing practice helps maintain lung function and can reduce anxiety during symptom flares.",
  },
  {
    id: "dance", name: "Seated Dance / Movement", category: "cardio", fatigueLevel: "low",
    duration: "10–20 min", heatSafe: true,
    benefits: ["Mood boost", "Coordination", "Social connection", "Cognitive stimulation"],
    description: "Fun, rhythmic upper-body and seated dance movements set to music — no standing required.",
    msTips: "Music-based movement can bypass some MS motor difficulties. The cognitive challenge of following rhythms also exercises your brain. Great for combating depression.",
  },
  {
    id: "wall-exercises", name: "Wall Exercises", category: "strength", fatigueLevel: "moderate",
    duration: "10–15 min", heatSafe: true,
    benefits: ["Upper body strength", "Stability", "Posture", "No equipment needed"],
    description: "Wall push-ups, wall sits, and supported squats using a wall for balance and resistance.",
    msTips: "The wall provides both support and resistance — perfect for when you want strength work without balance risk. Adjust difficulty by changing your foot distance from the wall.",
  },
  {
    id: "qigong", name: "Qigong", category: "balance", fatigueLevel: "low",
    duration: "15–25 min", heatSafe: true,
    benefits: ["Energy management", "Balance", "Mindfulness", "Gentle movement"],
    description: "Ancient Chinese practice combining slow, deliberate movements with breathwork and meditation for mind-body harmony.",
    msTips: "Even gentler than Tai Chi. The focus on energy flow aligns well with MS energy management. Many movements can be adapted to seated positions.",
  },
  {
    id: "stair-training", name: "Stair Training", category: "strength", fatigueLevel: "high",
    duration: "5–10 min", heatSafe: false,
    benefits: ["Leg power", "Functional mobility", "Bone density", "Real-world strength"],
    description: "Controlled stair climbing with rest breaks — builds the leg strength needed for daily life activities.",
    msTips: "Only attempt when well-rested and with a railing available. Start with just a few steps. This is high-fatigue but translates directly to real-world mobility. Stop immediately if legs feel weak.",
  },
  {
    id: "vibration", name: "Whole Body Vibration", category: "balance", fatigueLevel: "low",
    duration: "10–15 min", heatSafe: true,
    benefits: ["Muscle activation", "Balance", "Bone density", "Circulation"],
    description: "Standing or seated on a vibration platform that transmits gentle oscillations through the body to stimulate muscles.",
    msTips: "Research shows benefits for MS balance and spasticity. Start with low intensity for short durations. Use the handle bars for support. Not suitable during active relapses.",
  },
  {
    id: "rowing", name: "Seated Rowing Machine", category: "cardio", fatigueLevel: "moderate",
    duration: "10–20 min", heatSafe: true,
    benefits: ["Back strength", "Posture", "Cardiovascular fitness", "Full-body engagement"],
    description: "Low-impact seated rowing that works back, arms, and legs simultaneously while keeping you stable.",
    msTips: "The seated position removes balance concerns. Use a low resistance setting. Focus on smooth, controlled strokes rather than speed. Great for posture-related pain.",
  },
  {
    id: "gardening", name: "Therapeutic Gardening", category: "flexibility", fatigueLevel: "low",
    duration: "15–30 min", heatSafe: false,
    benefits: ["Fine motor skills", "Mood boost", "Vitamin D", "Sense of purpose"],
    description: "Light gardening tasks like potting, weeding, and watering — counts as gentle physical activity with mental health benefits.",
    msTips: "Use raised beds or containers to avoid bending. Garden in the early morning or evening to avoid heat. Adaptive tools with larger grips reduce hand fatigue.",
  },
  {
    id: "pelvic-floor", name: "Pelvic Floor Exercises", category: "strength", fatigueLevel: "low",
    duration: "5–10 min", heatSafe: true,
    benefits: ["Bladder control", "Core stability", "Sexual health", "Confidence"],
    description: "Targeted Kegel exercises and pelvic tilts to strengthen the muscles that control bladder and bowel function.",
    msTips: "Bladder issues affect up to 80% of MS patients. Daily pelvic floor work can significantly reduce urgency and incontinence. Can be done lying down, seated, or standing.",
  },
  {
    id: "boxing", name: "Seated Boxing", category: "cardio", fatigueLevel: "moderate",
    duration: "10–15 min", heatSafe: true,
    benefits: ["Upper body power", "Coordination", "Stress relief", "Reaction time"],
    description: "Punching combinations from a seated position — builds upper body strength and hand-eye coordination.",
    msTips: "Use light gloves or no gloves. Focus on technique over power. The rhythmic movement can improve coordination. Excellent stress outlet on frustrating symptom days.",
  },
  {
    id: "nordic-walking", name: "Nordic Walking", category: "cardio", fatigueLevel: "moderate",
    duration: "15–30 min", heatSafe: false,
    benefits: ["Full-body workout", "Walking stability", "Posture", "Upper body engagement"],
    description: "Walking with specially designed poles that engage the upper body and provide extra balance support.",
    msTips: "The poles act as extra points of contact, improving stability. Engages 90% of muscles vs 40% in regular walking. Great progression from standard walking if balance is a concern.",
  },
  {
    id: "eye-exercises", name: "Eye Movement Exercises", category: "balance", fatigueLevel: "low",
    duration: "5–10 min", heatSafe: true,
    benefits: ["Visual tracking", "Dizziness reduction", "Focus", "Vestibular health"],
    description: "Controlled eye movements, gaze stabilization, and tracking exercises to address MS-related vision and vestibular issues.",
    msTips: "Optic neuritis and nystagmus are common in MS. These exercises can reduce dizziness and improve reading ability. Do them seated to avoid falls from dizziness.",
  },
  {
    id: "functional-training", name: "Functional Movement", category: "strength", fatigueLevel: "moderate",
    duration: "15–20 min", heatSafe: true,
    benefits: ["Daily task ability", "Independence", "Practical strength", "Confidence"],
    description: "Practicing real-life movements — sit-to-stand, reaching overhead, carrying objects — to maintain independence in daily activities.",
    msTips: "These exercises directly improve your ability to do everyday tasks. Practice getting up from different chair heights. Use a counter for support during standing movements.",
  },
  {
    id: "hydrotherapy", name: "Hydrotherapy (Warm Water)", category: "flexibility", fatigueLevel: "low",
    duration: "20–30 min", heatSafe: true,
    benefits: ["Pain relief", "Joint mobility", "Relaxation", "Muscle tension relief"],
    description: "Gentle movements and stretches performed in warm (not hot) therapeutic water, distinct from pool exercise.",
    msTips: "Water temperature should be 33–34°C — warm enough for pain relief but not so hot it triggers Uhthoff's phenomenon. Shorter sessions (15 min) if you're heat-sensitive.",
  },
  {
    id: "ankle-exercises", name: "Ankle & Foot Strengthening", category: "balance", fatigueLevel: "low",
    duration: "5–10 min", heatSafe: true,
    benefits: ["Foot drop prevention", "Walking stability", "Ankle strength", "Fall prevention"],
    description: "Toe raises, ankle circles, towel scrunches, and dorsiflexion exercises targeting the lower leg and foot.",
    msTips: "Foot drop is a common MS symptom caused by weak dorsiflexors. Daily ankle exercises can slow progression and improve walking safety. Can be done while watching TV.",
  },
  {
    id: "swimming", name: "Lap Swimming", category: "cardio", fatigueLevel: "moderate",
    duration: "15–30 min", heatSafe: true,
    benefits: ["Full-body conditioning", "Respiratory strength", "Endurance", "Joint-free movement"],
    description: "Structured swimming laps at a comfortable pace — provides a full cardiovascular workout without any joint stress.",
    msTips: "Backstroke is often easiest for people with MS. Use a pool noodle for extra buoyancy. Cool water (26–28°C) is ideal. Always swim where a lifeguard is present.",
  },
];

const CATEGORY_COLORS = {
  cardio: "bg-red-500/10 text-red-600 dark:text-red-400",
  strength: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  flexibility: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  balance: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

const FATIGUE_COLORS = {
  low: "text-emerald-500",
  moderate: "text-amber-500",
  high: "text-red-500",
};

export default function ExerciseLibrary() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? EXERCISES : EXERCISES.filter(e => e.category === filter);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground">MS-Safe Exercise Guide</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Exercises curated for people with MS. Each includes fatigue ratings and heat-safety info.
      </p>

      {/* Filters */}
      <div className="flex gap-1.5 flex-wrap">
        {["all", "cardio", "strength", "flexibility", "balance"].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`rounded-full px-2.5 py-1 text-[11px] capitalize transition-all ${
              filter === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-muted"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.map(ex => {
        const isOpen = expanded === ex.id;
        return (
          <motion.div key={ex.id} layout className="rounded-xl bg-card shadow-soft overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : ex.id)}
              className="flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-accent/30"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-foreground">{ex.name}</p>
                  {!ex.heatSafe && <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${CATEGORY_COLORS[ex.category]}`}>
                    {ex.category}
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px]">
                    <Zap className={`h-3 w-3 ${FATIGUE_COLORS[ex.fatigueLevel]}`} />
                    <span className={FATIGUE_COLORS[ex.fatigueLevel]}>{ex.fatigueLevel} fatigue</span>
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> {ex.duration}
                  </span>
                </div>
              </div>
              {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-3.5 pb-3.5 space-y-3">
                    <p className="text-sm text-foreground leading-relaxed">{ex.description}</p>

                    <div className="flex flex-wrap gap-1.5">
                      {ex.benefits.map((b, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          <Heart className="h-2.5 w-2.5" /> {b}
                        </span>
                      ))}
                    </div>

                    <div className="rounded-lg bg-accent/50 px-3 py-2.5">
                      <p className="text-xs text-accent-foreground leading-relaxed">
                        <span className="font-semibold">🧠 MS Tip:</span> {ex.msTips}
                      </p>
                    </div>

                    {!ex.heatSafe && (
                      <div className="rounded-lg bg-amber-500/10 px-3 py-2">
                        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                          <span className="font-semibold">⚠️ Heat Warning:</span> This exercise may raise body temperature. Use cooling strategies and avoid exercising during peak heat.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
