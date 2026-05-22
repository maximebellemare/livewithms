import type { CalmAudioSession } from "./types";

function sanitizeAudioCopy(text: string) {
  return text
    .replace(/\boptimize\b/gi, "support")
    .replace(/\btransform\b/gi, "soften")
    .replace(/\bhealing frequencies\b/gi, "steady sound")
    .replace(/\bmeditation performance\b/gi, "guided audio")
    .replace(/\bjourney\b/gi, "moment")
    .trim();
}

const AUDIO_SESSIONS: CalmAudioSession[] = [
  {
    id: "quiet-reset-audio",
    toolId: "mentally-overloaded-reset",
    title: "Quiet reset",
    category: "overwhelm",
    durationLabel: "2 minutes",
    totalSeconds: 120,
    description: "A short, low-stimulation reset for moments when your mind feels too full.",
    whyItHelps: "Reducing input first can make the next step feel less sharp.",
    recommendation: "A quieter reset may feel easier today.",
    lowStimulationNote: "This stays brief, quiet, and easy to stop.",
    supportsBackgroundResumption: true,
    supportsHaptics: true,
    cachedOffline: true,
    premiumFeature: "calm_audio_support",
    phases: [
      {
        id: "arrive",
        label: "Arrive",
        seconds: 30,
        prompt: "Let the shoulders drop a little. Nothing needs to be solved right now.",
      },
      {
        id: "breathe",
        label: "Slow breath",
        seconds: 45,
        prompt: "Breathe in gently for 4 and out for 6 if that feels okay.",
        breathCue: { inhaleSeconds: 4, exhaleSeconds: 6 },
      },
      {
        id: "settle",
        label: "Settle",
        seconds: 45,
        prompt: "Keep the next step small. One quieter choice may be enough.",
      },
    ],
  },
  {
    id: "lower-stimulation-audio",
    toolId: "calming-sensory-reset",
    title: "Lower stimulation",
    category: "grounding",
    durationLabel: "2 minutes",
    totalSeconds: 120,
    description: "A calmer sensory reset for moments when light, sound, or movement feels like too much.",
    whyItHelps: "Lowering stimulation can help the body stop bracing so hard.",
    recommendation: "This short grounding session is available if needed.",
    lowStimulationNote: "Soft pacing, no strong sound changes, and no pressure to continue.",
    supportsBackgroundResumption: true,
    supportsHaptics: false,
    cachedOffline: true,
    premiumFeature: "calm_audio_support",
    phases: [
      {
        id: "soften-room",
        label: "Soften the room",
        seconds: 40,
        prompt: "If you can, lower one source of input around you. Less can help.",
      },
      {
        id: "steady-attention",
        label: "Steady attention",
        seconds: 40,
        prompt: "Let your attention rest on one quieter thing in front of you.",
      },
      {
        id: "return-lightly",
        label: "Return lightly",
        seconds: 40,
        prompt: "Come back slowly. The next part of the day can stay simple.",
      },
    ],
  },
  {
    id: "difficult-morning-audio",
    toolId: "difficult-morning-support",
    title: "Difficult morning",
    category: "low-energy",
    durationLabel: "3 minutes",
    totalSeconds: 180,
    description: "A low-pressure audio reset for mornings that begin heavy.",
    whyItHelps: "A smaller start can protect energy before the day asks too much.",
    recommendation: "A quieter pace may help right now.",
    lowStimulationNote: "Gentle pacing, brief prompts, and plenty of room to pause.",
    supportsBackgroundResumption: true,
    supportsHaptics: true,
    cachedOffline: true,
    premiumFeature: "calm_audio_support",
    phases: [
      {
        id: "start-small",
        label: "Start small",
        seconds: 50,
        prompt: "Try choosing one needed thing, one support thing, and one thing that can wait.",
      },
      {
        id: "breath-space",
        label: "Breathing room",
        seconds: 60,
        prompt: "Breathe gently. The day does not need to open all at once.",
        breathCue: { inhaleSeconds: 4, exhaleSeconds: 5 },
      },
      {
        id: "simple-next-step",
        label: "Simple next step",
        seconds: 70,
        prompt: "Let the next step be small enough that it does not drain you before it begins.",
      },
    ],
  },
  {
    id: "sleep-decompression-audio",
    toolId: "sleep-decompression-flow",
    title: "Sleep decompression",
    category: "sleep",
    durationLabel: "5 minutes",
    totalSeconds: 300,
    description: "A quiet evening wind-down for nights that need less friction and less stimulation.",
    whyItHelps: "A simpler evening rhythm can make rest feel a little more reachable.",
    recommendation: "A steadier wind-down may feel easier tonight.",
    lowStimulationNote: "No dramatic sound shifts, no performance breathing, and easy pause/resume.",
    supportsBackgroundResumption: true,
    supportsHaptics: false,
    cachedOffline: true,
    premiumFeature: "calm_audio_support",
    phases: [
      {
        id: "settle-evening",
        label: "Settle the evening",
        seconds: 90,
        prompt: "Let the evening become a little quieter. Nothing here needs to feel productive.",
      },
      {
        id: "longer-exhale",
        label: "Longer exhale",
        seconds: 90,
        prompt: "If it feels okay, let the exhale run a little longer than the inhale.",
        breathCue: { inhaleSeconds: 4, exhaleSeconds: 6 },
      },
      {
        id: "lower-demand",
        label: "Lower demand",
        seconds: 120,
        prompt: "The day can end without being fully resolved. Rest can still begin here.",
      },
    ],
  },
  {
    id: "quiet-evening-reset-audio",
    toolId: "quiet-evening-reset",
    title: "Quiet your evening",
    category: "sleep",
    durationLabel: "3 minutes",
    totalSeconds: 180,
    description: "A low-stimulation evening reset for nights that feel noisy or hard to put down.",
    whyItHelps: "A quieter ending can reduce the feeling that the night still has to do more work.",
    recommendation: "A quieter evening may help tonight.",
    lowStimulationNote: "Soft pacing, low visual demand, and easy pause or stop at any point.",
    supportsBackgroundResumption: true,
    supportsHaptics: false,
    cachedOffline: true,
    premiumFeature: "calm_audio_support",
    phases: [
      {
        id: "dim-the-edge",
        label: "Dim the edge",
        seconds: 55,
        prompt: "Let one source of stimulation soften. The evening can ask less from you now.",
      },
      {
        id: "unload-lightly",
        label: "Unload lightly",
        seconds: 55,
        prompt: "Choose one thing that belongs to tomorrow instead of tonight.",
      },
      {
        id: "settle-night",
        label: "Settle the night",
        seconds: 70,
        prompt: "The day does not need to feel finished for the night to begin.",
      },
    ],
  },
  {
    id: "mentally-overloaded-tonight-audio",
    toolId: "mentally-overloaded-tonight",
    title: "Mentally overloaded tonight",
    category: "sleep",
    durationLabel: "3 minutes",
    totalSeconds: 180,
    description: "A quieter bedtime decompression for nights when your mind still feels crowded.",
    whyItHelps: "Lowering mental demand can make the night feel a little less sharp.",
    recommendation: "If tonight still feels loud, this can stay brief.",
    lowStimulationNote: "No performance breathing, no dramatic sound changes, and no pressure to continue.",
    supportsBackgroundResumption: true,
    supportsHaptics: false,
    cachedOffline: true,
    premiumFeature: "calm_audio_support",
    phases: [
      {
        id: "set-one-down",
        label: "Set one thing down",
        seconds: 60,
        prompt: "Let one unfinished thought stop being tonight's work.",
      },
      {
        id: "slower-breath",
        label: "Slower breath",
        seconds: 55,
        prompt: "If it feels okay, let the breath become a little slower without trying to perfect it.",
        breathCue: { inhaleSeconds: 4, exhaleSeconds: 5 },
      },
      {
        id: "easier-night",
        label: "Ease the night",
        seconds: 65,
        prompt: "The rest of the night can stay simple from here.",
      },
    ],
  },
  {
    id: "pace-after-overwhelm-audio",
    toolId: "pacing-after-overwhelm",
    title: "Rest after an overwhelming day",
    category: "pacing",
    durationLabel: "3 minutes",
    totalSeconds: 180,
    description: "A pacing reset for the stretch after a day that asked too much.",
    whyItHelps: "Recovery can stay quiet instead of becoming another task.",
    recommendation: "This short reset may help during heavier moments.",
    lowStimulationNote: "Low guidance density and steady pacing.",
    supportsBackgroundResumption: true,
    supportsHaptics: true,
    cachedOffline: true,
    premiumFeature: "calm_audio_support",
    phases: [
      {
        id: "release-pressure",
        label: "Release pressure",
        seconds: 60,
        prompt: "You do not need to make up for the day all at once.",
      },
      {
        id: "steady-breath",
        label: "Steady breath",
        seconds: 50,
        prompt: "Let the breath settle without trying to control it too much.",
        breathCue: { inhaleSeconds: 4, exhaleSeconds: 5, pauseSeconds: 1 },
      },
      {
        id: "gentle-return",
        label: "Gentle return",
        seconds: 70,
        prompt: "The next block of time can ask less from you than the last one did.",
      },
    ],
  },
  {
    id: "emotional-decompression-audio",
    toolId: "emotional-decompression-flow",
    title: "Emotional decompression",
    category: "decompression",
    durationLabel: "3 minutes",
    totalSeconds: 180,
    description: "A softer landing for emotionally loud days without pushing for deep processing.",
    whyItHelps: "A little distance from the intensity can make the evening feel more workable.",
    recommendation: "If today feels full, this can stay brief.",
    lowStimulationNote: "Short phrases, slower transitions, and no emotional over-guiding.",
    supportsBackgroundResumption: true,
    supportsHaptics: false,
    cachedOffline: true,
    premiumFeature: "calm_audio_support",
    phases: [
      {
        id: "name-lightly",
        label: "Name it lightly",
        seconds: 50,
        prompt: "You can name the day as heavy without needing to unpack all of it.",
      },
      {
        id: "small-distance",
        label: "Make a little space",
        seconds: 60,
        prompt: "Let there be a little room between you and everything the day held.",
      },
      {
        id: "ease-the-end",
        label: "Ease the end of the day",
        seconds: 70,
        prompt: "It is okay if the rest of today stays simple.",
      },
    ],
  },
];

export const CALM_AUDIO_SESSIONS = AUDIO_SESSIONS.map((session) => ({
  ...session,
  description: sanitizeAudioCopy(session.description),
  whyItHelps: sanitizeAudioCopy(session.whyItHelps),
  recommendation: sanitizeAudioCopy(session.recommendation),
  lowStimulationNote: sanitizeAudioCopy(session.lowStimulationNote),
  phases: session.phases.map((phase) => ({
    ...phase,
    prompt: sanitizeAudioCopy(phase.prompt),
  })),
}));

export function getCalmAudioSessionByToolId(toolId: string | null | undefined) {
  if (!toolId) {
    return null;
  }

  return CALM_AUDIO_SESSIONS.find((session) => session.toolId === toolId) ?? null;
}
