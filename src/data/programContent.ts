// Full structured content for all premium programs
// Each day includes: title, instructions, supportLine (optional), variation (optional)
// Timer metadata (optional): breathing phases or countdown seconds

export interface BreathingPhase {
  label: string;
  duration: number; // seconds
}

export interface ProgramTimer {
  type: "breathing";
  phases: BreathingPhase[];
  cycles: number;
}

export interface CountdownTimer {
  type: "countdown";
  seconds: number;
  label?: string;
}

export interface ProgramDay {
  title: string;
  instructions: string;
  supportLine?: string;
  variation?: string;
  timer?: ProgramTimer | CountdownTimer;
}

export interface ProgramDefinition {
  id: string;
  title: string;
  duration: string;
  emoji: string;
  description: string;
  totalDays: number;
  days: ProgramDay[];
}

const COMPLETION_MESSAGES = [
  "Nice. Small steps like this help over time. 🌿",
  "Done. That's one more good moment today. ☀️",
  "Well done — your nervous system thanks you. 💛",
  "A small reset goes a long way. 🌱",
  "You showed up for yourself today. That matters. 🤍",
  "Gentle and done. That's all it takes. 🕊️",
  "One more calm moment in the bank. ✨",
  "You did it. Rest in that for a moment. 🌙",
  "Progress isn't always visible — but it's happening. 🌊",
  "That was enough. You are enough. 💫",
];

export function getCompletionMessage(): string {
  return COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)];
}

// ─── PROGRAM 1: NERVOUS SYSTEM STABILIZATION (30 days) ───

const nervousSystemDays: ProgramDay[] = [
  {
    title: "Slow exhale breathing",
    instructions: "Breathe in gently for 4 seconds. Breathe out slowly for 6 seconds. Repeat 5 times.",
    supportLine: "Just follow the breath. Nothing else matters right now.",
  },
  {
    title: "Grounding through touch",
    instructions: "Place both hands on a surface near you. Notice the temperature, texture, and weight of your hands. Stay for 60 seconds.",
    supportLine: "You're safe right here.",
  },
  {
    title: "Humming reset",
    instructions: "Take a deep breath in. On the exhale, hum gently until you run out of air. Repeat 5 times.",
    supportLine: "Humming stimulates your vagus nerve and helps your body calm down.",
  },
  {
    title: "Body scan — just noticing",
    instructions: "Close your eyes. Slowly move your attention from your feet to the top of your head. Just notice what you feel — no need to change anything.",
    supportLine: "This is about awareness, not fixing.",
    variation: "If closing your eyes feels uncomfortable, soften your gaze downward instead.",
  },
  {
    title: "Cold water reset",
    instructions: "Run cold water over your wrists for 30 seconds. Notice the sensation fully.",
    supportLine: "Cold activates your calming response. Even a few seconds helps.",
  },
  {
    title: "Gentle neck release",
    instructions: "Slowly tilt your head to the right and hold for 15 seconds. Then to the left. Repeat twice on each side.",
    supportLine: "Tension often hides in the neck. Let it go gently.",
  },
  {
    title: "Extended exhale",
    instructions: "Breathe in for 3 seconds. Breathe out for 7 seconds. Repeat for 2 minutes.",
    supportLine: "Longer exhales signal safety to your nervous system.",
  },
  {
    title: "Five senses grounding",
    instructions: "Name 5 things you see, 4 you hear, 3 you can touch, 2 you smell, and 1 you taste. Take your time.",
    supportLine: "This brings you back to the present moment.",
  },
  {
    title: "Butterfly hug",
    instructions: "Cross your arms over your chest so each hand touches the opposite shoulder. Alternate gentle taps left and right for 1 minute.",
    supportLine: "This bilateral stimulation helps regulate your nervous system.",
  },
  {
    title: "Sighing breath",
    instructions: "Take a deep breath in through your nose. Then exhale with an audible sigh through your mouth. Repeat 5 times.",
    supportLine: "Physiological sighs are the fastest way to calm down.",
  },
  {
    title: "Feet on the floor",
    instructions: "Press both feet firmly into the floor. Notice the ground beneath you. Hold for 60 seconds, breathing naturally.",
    supportLine: "Grounding through your feet anchors your whole body.",
  },
  {
    title: "Jaw release",
    instructions: "Open your mouth wide, then close it gently. Repeat 5 times. Then let your jaw hang slightly open and relax for 30 seconds.",
    supportLine: "We hold so much tension in the jaw without realising.",
  },
  {
    title: "Hand warming visualization",
    instructions: "Close your eyes. Imagine warm sunlight gently warming your hands. Focus on the warmth for 90 seconds.",
    supportLine: "Visualization activates the same calming pathways as real warmth.",
  },
  {
    title: "Box breathing",
    instructions: "Breathe in for 4 seconds, hold for 4, out for 4, hold for 4. Repeat 4 rounds.",
    supportLine: "This pattern brings balance to your nervous system.",
    variation: "If holding feels uncomfortable, shorten to 3 seconds each.",
  },
  {
    title: "Gentle shoulder rolls",
    instructions: "Roll your shoulders forward 5 times, then backward 5 times. Go very slowly and notice the movement.",
    supportLine: "Moving slowly helps your body shift out of tension mode.",
  },
  {
    title: "Listening meditation",
    instructions: "Close your eyes. For 90 seconds, just listen. Don't label sounds — just hear them.",
    supportLine: "Listening without judging is a gentle way to be present.",
  },
  {
    title: "Vagal tone — gargling",
    instructions: "Take a sip of water and gargle for 10–15 seconds. Repeat 3 times.",
    supportLine: "Gargling gently activates your vagus nerve.",
    variation: "If gargling isn't comfortable, try humming instead.",
  },
  {
    title: "Palm pressure",
    instructions: "Press your palms together firmly in front of your chest. Hold for 10 seconds, then release slowly. Repeat 5 times.",
    supportLine: "This creates a sense of containment and stability.",
  },
  {
    title: "Micro-walk",
    instructions: "Walk very slowly across a room. Focus on each footstep — the lift, the movement, the landing. Do this for 1–2 minutes.",
    supportLine: "Slow movement calms the nervous system more than fast movement.",
  },
  {
    title: "Belly breathing",
    instructions: "Place one hand on your belly. Breathe in through your nose so your belly rises. Exhale slowly. Repeat for 2 minutes.",
    supportLine: "Belly breathing tells your body it's time to rest.",
  },
  {
    title: "Self-hold",
    instructions: "Place one hand on your chest and one on your belly. Breathe gently for 90 seconds while feeling the warmth of your own hands.",
    supportLine: "Touch from yourself can be just as soothing as touch from others.",
  },
  {
    title: "Sound cue reset",
    instructions: "Find a calming sound — a clock ticking, rain, a fan. Focus on it for 60 seconds. Let other thoughts pass.",
    supportLine: "A single sound anchor can steady your whole system.",
  },
  {
    title: "Tension and release",
    instructions: "Tense your fists tightly for 5 seconds. Then release completely. Do the same with your shoulders, then your face. One round each.",
    supportLine: "The release after tension is where calm lives.",
  },
  {
    title: "Counting breaths",
    instructions: "Breathe normally. Count each exhale. When you reach 10, start over. Continue for 2 minutes.",
    supportLine: "If you lose count, just start again. That's perfectly fine.",
  },
  {
    title: "One-word check-in",
    instructions: "Ask yourself: 'How do I feel right now?' Answer with one word. Write it down or say it aloud. No judgment.",
    supportLine: "Naming a feeling is the first step to regulating it.",
  },
  {
    title: "Orienting",
    instructions: "Slowly turn your head and look around the room. Name three things you see. Move gently and notice colors and shapes.",
    supportLine: "Orienting tells your brain you're safe in this space.",
  },
  {
    title: "Gentle hum and sway",
    instructions: "Stand or sit. Hum a low, steady note while gently swaying side to side. Continue for 1 minute.",
    supportLine: "Combining sound with movement deepens the calming effect.",
  },
  {
    title: "Warmth on the neck",
    instructions: "Place a warm cloth or your warm hands on the back of your neck. Hold for 60 seconds while breathing slowly.",
    supportLine: "Warmth on the neck helps activate your rest-and-digest response.",
  },
  {
    title: "Gratitude breath",
    instructions: "With each inhale, think of one small thing you're grateful for. With each exhale, let tension go. Do 5 rounds.",
    supportLine: "Gratitude paired with breath is a powerful combination.",
  },
  {
    title: "Stillness minute",
    instructions: "Sit still for 60 seconds. Don't try to relax. Don't try to do anything. Just be still.",
    supportLine: "Stillness is a practice, not a test. However it felt — that was enough.",
  },
];

// ─── PROGRAM 2: FATIGUE MANAGEMENT & ENERGY PACING (30 days) ───

const fatigueDays: ProgramDay[] = [
  {
    title: "Energy check-in",
    instructions: "Rate your energy right now from 1–10. Write it down. No judgment — just noticing where you are.",
    supportLine: "Awareness is the first step to pacing.",
  },
  {
    title: "The 3-task rule",
    instructions: "Write down only 3 things you want to do today. That's your whole list. If you do less, that's okay too.",
    supportLine: "Less is more on hard days.",
  },
  {
    title: "Micro-rest practice",
    instructions: "Set a timer for 2 minutes. Close your eyes, lean back, and do nothing. When the timer goes, carry on.",
    supportLine: "Short rests prevent bigger crashes.",
  },
  {
    title: "Activity pacing intro",
    instructions: "Pick one task today and break it into two halves. Do the first half, rest for 5 minutes, then finish.",
    supportLine: "Pacing isn't slowing down — it's being strategic.",
  },
  {
    title: "Notice your peak time",
    instructions: "Think about yesterday. When did you have the most energy? Morning? Afternoon? Write it down.",
    supportLine: "Knowing your pattern helps you plan smarter.",
    variation: "If you're not sure, just guess. You can refine over time.",
  },
  {
    title: "Seated stretch reset",
    instructions: "While sitting, raise both arms overhead and stretch gently for 10 seconds. Lower them slowly. Repeat 3 times.",
    supportLine: "Gentle movement can boost energy without draining it.",
  },
  {
    title: "Hydration check",
    instructions: "Drink a full glass of water right now. Dehydration is one of the most common causes of fatigue.",
    supportLine: "This one small act can shift your energy.",
  },
  {
    title: "Permission to rest",
    instructions: "Say to yourself: 'Resting is productive. I don't need to earn it.' Sit with that for a moment.",
    supportLine: "Rest guilt is common with MS. It's okay to let it go.",
  },
  {
    title: "Energy audit",
    instructions: "List 3 things that drain your energy. List 3 things that give you energy. Keep this list visible today.",
    supportLine: "When you know your drains and gains, you can choose better.",
  },
  {
    title: "30-second breathing boost",
    instructions: "Take 5 deep breaths — in through nose for 3 seconds, out through mouth for 3 seconds. Do this right now.",
    supportLine: "Oxygen is energy. This is a quick top-up.",
  },
  {
    title: "Pre-plan tomorrow",
    instructions: "Write down what time you'll do your most important task tomorrow — during your peak energy window.",
    supportLine: "Planning reduces decision fatigue.",
  },
  {
    title: "Gentle walk or sway",
    instructions: "Walk gently for 2 minutes — indoors is fine. If walking is hard, sway side to side while standing or sitting.",
    supportLine: "Light movement can reset fatigue better than stillness.",
  },
  {
    title: "Saying no practice",
    instructions: "Think of one thing this week you could say no to. It doesn't have to be big. Just one thing.",
    supportLine: "Every 'no' protects your energy for something that matters.",
  },
  {
    title: "Power nap permission",
    instructions: "Set a timer for 15 minutes. Close your eyes. You don't have to sleep — just rest.",
    supportLine: "Even closing your eyes for 15 minutes counts as recovery.",
    variation: "If you can't nap, just dim the lights and be still.",
  },
  {
    title: "Temperature reset",
    instructions: "Splash cold water on your face or hold something cold for 15 seconds. Notice how your alertness shifts.",
    supportLine: "Cold triggers a mild alertness response — a gentle wake-up.",
  },
  {
    title: "One thing at a time",
    instructions: "For the next 30 minutes, do only one thing. No multitasking. When you're done, pause before the next thing.",
    supportLine: "Single-tasking saves more energy than you'd think.",
  },
  {
    title: "Fatigue journal",
    instructions: "Write one sentence about your energy today. Example: 'Energy was low after lunch but better by 4pm.'",
    supportLine: "Over time, these notes reveal your patterns.",
  },
  {
    title: "Delegate or defer",
    instructions: "Look at your to-do list. Can anything be done by someone else or pushed to another day? Move at least one thing.",
    supportLine: "You don't have to do everything today.",
  },
  {
    title: "Sunlight pause",
    instructions: "Spend 2 minutes near natural light — by a window or outside. Look at the sky. Breathe.",
    supportLine: "Natural light supports your circadian rhythm and energy levels.",
  },
  {
    title: "Body position reset",
    instructions: "Change your body position right now. If sitting, stand. If lying, sit up. Hold the new position for 60 seconds.",
    supportLine: "Changing position can shift your energy state.",
  },
  {
    title: "Snack for energy",
    instructions: "Eat a small, balanced snack — something with protein or healthy fat. Notice how you feel 15 minutes later.",
    supportLine: "Blood sugar dips can masquerade as MS fatigue.",
  },
  {
    title: "Evening wind-down",
    instructions: "30 minutes before bed, put your phone down. Do something slow — stretch, read, breathe.",
    supportLine: "Good sleep tonight is tomorrow's energy.",
  },
  {
    title: "Buffer time",
    instructions: "Add 15 minutes of buffer between your next two tasks today. Use it however you want — even doing nothing.",
    supportLine: "Buffer time prevents the energy crash of rushing.",
  },
  {
    title: "Comfort inventory",
    instructions: "List 3 things that feel comforting to you right now. A blanket, a drink, a sound. Use one of them.",
    supportLine: "Comfort supports recovery.",
  },
  {
    title: "Movement snack",
    instructions: "Do 5 gentle arm circles, 5 ankle rolls, and 3 slow neck turns. Total time: about 1 minute.",
    supportLine: "A movement snack keeps your body from stiffening up.",
  },
  {
    title: "Celebrate low-energy days",
    instructions: "Write down one thing you managed to do today, even if it feels small. That was enough.",
    supportLine: "On hard days, showing up at all is the win.",
  },
  {
    title: "Stop point",
    instructions: "Pick a time today when you'll stop 'being productive.' After that, it's just rest. Commit to it.",
    supportLine: "Having a stop point removes the guilt of stopping.",
  },
  {
    title: "Breathe and soften",
    instructions: "Breathe in. On the exhale, intentionally soften your shoulders, jaw, and hands. Repeat 5 times.",
    supportLine: "Softening the body softens the mind.",
  },
  {
    title: "Weekly review",
    instructions: "Look back at this week. What helped your energy most? What drained it? Write one sentence.",
    supportLine: "Reflection turns experience into wisdom.",
  },
  {
    title: "Pace with pride",
    instructions: "Today, pace one activity on purpose. Do half, rest, finish. Afterward, notice: was it easier?",
    supportLine: "Pacing isn't weakness. It's intelligent energy management.",
  },
];

// ─── PROGRAM 3: ANXIETY & OVERWHELM RESET (14 days) ───

const anxietyDays: ProgramDay[] = [
  {
    title: "4-7-8 breathing",
    instructions: "Breathe in for 4 seconds. Hold for 7 seconds. Exhale slowly for 8 seconds. Repeat 3 times.",
    supportLine: "This pattern activates your calming response. Go at your own pace.",
  },
  {
    title: "Name it to tame it",
    instructions: "Ask yourself: 'What am I feeling right now?' Say the word out loud or write it down. Just one word is enough.",
    supportLine: "Naming an emotion reduces its intensity.",
  },
  {
    title: "Grounding with objects",
    instructions: "Hold an object in your hand — a mug, a pen, anything nearby. Focus on its weight, texture, and temperature for 60 seconds.",
    supportLine: "This pulls your attention away from anxious thoughts.",
  },
  {
    title: "Worry download",
    instructions: "Set a timer for 2 minutes. Write down everything worrying you. Don't filter. When the timer stops, close the page.",
    supportLine: "Getting worries out of your head makes them less powerful.",
    variation: "If writing feels hard, just say them out loud.",
  },
  {
    title: "Physiological sigh",
    instructions: "Take two quick inhales through your nose (sniff-sniff), then one long exhale through your mouth. Repeat 5 times.",
    supportLine: "This is the fastest natural way to reduce anxiety.",
  },
  {
    title: "Safe place visualization",
    instructions: "Close your eyes. Picture a place where you feel completely safe. Notice the details — colors, sounds, temperature. Stay for 90 seconds.",
    supportLine: "Your brain responds to imagined safety almost like real safety.",
  },
  {
    title: "Bilateral tapping",
    instructions: "Tap your knees alternately — left, right, left, right — at a steady, slow pace. Continue for 1 minute.",
    supportLine: "Bilateral movement helps process anxiety and calm the mind.",
  },
  {
    title: "The 'good enough' list",
    instructions: "Write down 3 things that are 'good enough' in your life right now. They don't have to be perfect. Just good enough.",
    supportLine: "Anxiety often tells us nothing is enough. This is a gentle correction.",
  },
  {
    title: "Peripheral vision exercise",
    instructions: "Stare at a point in front of you. Without moving your eyes, widen your awareness to see everything in your peripheral vision. Hold for 60 seconds.",
    supportLine: "Peripheral vision activates your parasympathetic (calming) nervous system.",
  },
  {
    title: "Hands under warm water",
    instructions: "Run warm water over your hands for 30 seconds. Focus completely on the warmth and sensation.",
    supportLine: "Warmth on the hands is naturally soothing for the nervous system.",
  },
  {
    title: "One-sentence journal",
    instructions: "Write one sentence starting with: 'Right now, I feel…' That's all. One sentence.",
    supportLine: "You don't need to write a lot. Just one honest sentence.",
  },
  {
    title: "Exhale-only focus",
    instructions: "Breathe in naturally. On each exhale, make it slightly longer and slower than the last. Do 8 breaths.",
    supportLine: "You don't need to control the inhale. The exhale does the work.",
  },
  {
    title: "Self-compassion moment",
    instructions: "Place your hand on your heart. Say quietly: 'This is hard. I'm doing my best. That's enough.'",
    supportLine: "Speaking kindly to yourself is not silly — it's science-backed.",
  },
  {
    title: "Integration & reflection",
    instructions: "Look back over the last 14 days. What felt most helpful? Write it down. That's your go-to tool now.",
    supportLine: "You've built a toolkit. Use it whenever you need it. 💛",
  },
];

// ─── PROGRAM DEFINITIONS ───

export const PROGRAMS: ProgramDefinition[] = [
  {
    id: "nervous-system",
    title: "Nervous System Stabilization",
    duration: "30 days",
    emoji: "🧠",
    description: "Daily micro-exercises to calm and stabilize your nervous system. Each day takes 1–2 minutes.",
    totalDays: 30,
    days: nervousSystemDays,
  },
  {
    id: "fatigue-pacing",
    title: "Fatigue Management & Energy Pacing",
    duration: "30 days",
    emoji: "🔋",
    description: "Learn to manage your energy with small, practical daily steps. No pressure — just awareness and gentle action.",
    totalDays: 30,
    days: fatigueDays,
  },
  {
    id: "anxiety-reset",
    title: "Anxiety & Overwhelm Reset",
    duration: "14 days",
    emoji: "🌊",
    description: "Gentle daily exercises to calm anxious thoughts and reduce overwhelm. Takes 1–2 minutes per day.",
    totalDays: 14,
    days: anxietyDays,
  },
];
