import type { ProgramModule, ProgramSection, ProgramTool } from "./types";

export const PROGRAM_SECTIONS: ProgramSection[] = ["Calm", "Energy", "Planning", "Reflection"];

export const PROGRAM_MODULES: ProgramModule[] = [
  {
    id: "nervous-system-reset",
    title: "Nervous system reset",
    section: "Calm",
    track: "nervous-system",
    description: "Short grounding tools for moments when your system feels overloaded.",
    whyItHelps: "A brief pause can help the day feel less sharp and more manageable.",
    estimatedPace: "1-2 minutes",
    toolIds: ["breathing-reset", "body-scan"],
    content: [
      {
        id: "nsr-note-1",
        kind: "wellness-note",
        title: "When to use this",
        body: "This module can help when stress is high, your body feels tense, or you need a softer reset before choosing your next step.",
      },
    ],
  },
  {
    id: "energy-support",
    title: "Energy support",
    section: "Energy",
    track: "energy-management",
    description: "Low-energy guidance for days when doing less may help more.",
    whyItHelps: "Protecting energy early can make the rest of the day feel steadier.",
    estimatedPace: "2 minutes",
    toolIds: ["low-energy-checklist"],
    content: [
      {
        id: "energy-guide-1",
        kind: "micro-guide",
        title: "One gentle principle",
        body: "Try choosing one main task, one support action, and one thing that can wait. That can be enough.",
      },
    ],
  },
  {
    id: "gentle-planning",
    title: "Gentle planning",
    section: "Planning",
    track: "mindfulness",
    description: "Small planning tools for lowering decision load without adding pressure.",
    whyItHelps: "A clearer next step can reduce the feeling that everything is urgent at once.",
    estimatedPace: "2 minutes",
    toolIds: ["one-priority-planner"],
    content: [
      {
        id: "planning-prompt-1",
        kind: "reflection-prompt",
        title: "A useful question",
        body: "What matters most today, and what would make it 5% easier to begin?",
      },
    ],
  },
  {
    id: "emotional-processing",
    title: "Emotional processing",
    section: "Reflection",
    track: "emotional-resilience",
    description: "Short reflection support for difficult moments and heavier weeks.",
    whyItHelps: "Naming what feels hard can make it easier to meet the moment with more steadiness.",
    estimatedPace: "3 minutes",
    toolIds: ["hard-moment-reflection"],
    content: [
      {
        id: "reflection-guide-1",
        kind: "micro-guide",
        title: "Keep it small",
        body: "You do not need a full journal entry. One honest sentence is often enough to help you come back to the day more gently.",
      },
    ],
  },
];

export const PROGRAM_TOOLS: ProgramTool[] = [
  {
    id: "breathing-reset",
    title: "60-second breathing reset",
    moduleId: "nervous-system-reset",
    section: "Calm",
    whenToUse: "When your body feels tense or your mind feels busy.",
    durationLabel: "1 minute",
    durationSeconds: 60,
    description: "A short breathing cue to help the moment feel a little less intense.",
    steps: [
      "Let your shoulders soften and place both feet on the floor if you can.",
      "Breathe in gently for 4.",
      "Breathe out a little longer for 6.",
      "Repeat slowly until the timer ends.",
    ],
    completionMessage: "You took one small step today.",
    futureTrack: "nervous-system",
    continuationLabel: "Come back to this when the day feels noisy.",
    supportTags: ["stress", "sleep"],
  },
  {
    id: "body-scan",
    title: "2-minute body scan",
    moduleId: "nervous-system-reset",
    section: "Calm",
    whenToUse: "When you need to check in without pushing yourself.",
    durationLabel: "2 minutes",
    durationSeconds: 120,
    description: "A gentle scan to notice tension, effort, and what your body may need.",
    steps: [
      "Notice your jaw, shoulders, hands, and stomach one by one.",
      "Ask: what feels tight, tired, or tender right now?",
      "See if one part of your body can soften even 5%.",
      "End by choosing the gentlest next step for the next hour.",
    ],
    completionMessage: "You took one small step today.",
    futureTrack: "nervous-system",
    continuationLabel: "A body scan can help before choosing what to do next.",
    supportTags: ["stress", "sleep", "fatigue"],
  },
  {
    id: "low-energy-checklist",
    title: "Low-energy day checklist",
    moduleId: "energy-support",
    section: "Energy",
    whenToUse: "When fatigue is high and the day needs to feel smaller.",
    durationLabel: "2 minutes",
    description: "A quick reminder of what helps on heavier days.",
    steps: [
      "Pick only one priority for today.",
      "Move one non-urgent task out of the way.",
      "Keep water, snacks, and anything supportive nearby.",
      "Choose rest before you fully crash, not after.",
    ],
    completionMessage: "You took one small step today.",
    futureTrack: "energy-management",
    continuationLabel: "Come back when your energy needs a gentler plan.",
    supportTags: ["fatigue", "planning"],
  },
  {
    id: "one-priority-planner",
    title: "One-priority planner",
    moduleId: "gentle-planning",
    section: "Planning",
    whenToUse: "When everything feels important and you need a clearer next step.",
    durationLabel: "2 minutes",
    description: "A small planning reset to make the day feel more manageable.",
    steps: [
      "Name the one thing that matters most today.",
      "Write down one thing that can wait.",
      "Choose one support action that makes the priority easier.",
      "Give yourself permission to stop once the main thing is done.",
    ],
    completionMessage: "You took one small step today.",
    futureTrack: "mindfulness",
    continuationLabel: "This can help when the day feels crowded.",
    supportTags: ["planning", "stress"],
  },
  {
    id: "hard-moment-reflection",
    title: "Hard moment reflection",
    moduleId: "emotional-processing",
    section: "Reflection",
    whenToUse: "When you want to process the day without overthinking it.",
    durationLabel: "3 minutes",
    description: "A short reflection to make a hard moment feel clearer and a little lighter.",
    steps: [
      "What felt hardest today?",
      "What helped, even a little?",
      "What can you let go of before tonight?",
      "What would make tomorrow 5% easier?",
    ],
    completionMessage: "You took one small step today.",
    futureTrack: "emotional-resilience",
    continuationLabel: "You can return to this after a hard day or week.",
    supportTags: ["reflection", "stress"],
  },
];

export function getProgramToolById(toolId: string | null | undefined) {
  if (!toolId) {
    return null;
  }

  return PROGRAM_TOOLS.find((tool) => tool.id === toolId) ?? null;
}

export function getProgramModuleById(moduleId: string | null | undefined) {
  if (!moduleId) {
    return null;
  }

  return PROGRAM_MODULES.find((module) => module.id === moduleId) ?? null;
}

export function getProgramToolsByModuleId(moduleId: string) {
  return PROGRAM_TOOLS.filter((tool) => tool.moduleId === moduleId);
}
