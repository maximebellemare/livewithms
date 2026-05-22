import {
  deriveAdaptiveCoachSettings,
  deriveAdaptiveExperience,
  guardEmotionalSupportCopy,
} from "../../lib/adaptive-intelligence";
import { deriveCalmLifeSupport } from "../../lib/calm-life-support";
import { applySafeAIBehavior, derivePlatformGovernance } from "../../lib/platform-governance";

type CoachRefinementInput = {
  fatigue?: number | null;
  stress?: number | null;
  brainFog?: number | null;
  sleepHours?: number | null;
  lowEnergyMode?: boolean;
  adaptiveFatigueTrend?: "high" | "steady" | "lighter" | "unknown";
  adaptiveStressTrend?: "elevated" | "steady" | "lighter" | "unknown";
  message?: string | null;
  timeOfDay?: "morning" | "afternoon" | "evening";
};

type CoachFallbackState = {
  title: string;
  body: string;
  suggestions: string[];
};

type CoachResponseShape = {
  maxParagraphs: number;
  maxSentences: number;
  maxChars: number;
};

const OVERWHELM_PATTERNS = /\boverwhelm(?:ed)?\b|\bspiral(?:ing)?\b|\bpanic(?:ky)?\b|\btoo much\b|\bcan(?:'|’)t think\b|\bmentally exhausted\b|\bemotionally flooded\b|\bheavy\b/i;
const DIFFICULT_DAY_PATTERNS = /\beverything feels too hard\b|\bcan(?:'|’)t do much\b|\bless pressure\b|\bshutdown\b|\blow capacity\b|\bhopeless(?:-feeling)?\b/i;
const GUIDANCE_PATTERNS = /\btoo many things\b|\bwhat matters most\b|\bpriorit(?:y|ize)\b|\bdecision fatigue\b|\bnext hour\b|\btoo many decisions\b/i;
const RECOVERY_PATTERNS = /\bburn(?:ed)? out\b|\boverload(?:ed)?\b|\bneed recovery\b|\btoo many hard days\b|\bno recovery time\b|\bpace myself\b/i;
const COMMUNICATION_PATTERNS = /\bhow do i explain\b|\bfeel misunderstood\b|\bboundar(?:y|ies)\b|\bconversation\b|\bsocial plans\b|\bcommunicat(?:e|ing) overwhelm\b|\bexplain(?:ing)? brain fog\b/i;
const FORWARD_STABILITY_PATTERNS = /\buncertain(?:ty)?\b|\bfuture\b|\btonight\b|\bthis week feels heavy\b|\bone day at a time\b|\bspiral about the future\b|\btrapped in this\b/i;
const MEANINGFUL_LIFE_PATTERNS = /\bbeyond symptoms\b|\bordinary life\b|\bhobb(?:y|ies)\b|\bmeaningful outside\b|\bwho am i outside\b|\bgrounding moment\b|\bordinary moments?\b/i;
const MEANING_SUPPORT_PATTERNS = /\bmeaning(?:less)?\b|\bpurpose\b|\bwhat still matters\b|\bexistential\b|\bemotionally lost\b|\bwhy bother\b|\bwhat is the point\b|\blife feels smaller\b/i;
const EXISTENTIAL_GROUNDING_PATTERNS = /\bwhat(?:'| i)?s the point\b|\bwhat is the point\b|\bexistential\b|\bmeaning crisis\b|\beverything feels empty\b|\bnothing matters\b|\bno meaning\b|\bwhy bother\b/i;
const REORIENTATION_PATTERNS = /\bfeel lost\b|\bno direction\b|\bwhat matters anymore\b|\bdon['’]t know what matters\b|\bemotional(?:ly)? disorient(?:ed|ation)\b|\blost direction\b|\bcan['’]t reconnect\b|\blost my routine and goals\b/i;
const EVERYDAY_LIFE_REBUILDING_PATTERNS = /\bordinary life feels hard\b|\bdaily life feels hard\b|\bnormal activities\b|\bsmaller steps back\b|\bback into routine\b|\breturning to routines\b|\beveryday life\b|\bordinary tasks\b/i;
const SELF_RECONNECTION_PATTERNS = /\bdon['’]t feel like myself anymore\b|\bfar from myself\b|\bself feels distant\b|\bnot myself anymore\b|\bfeel unfamiliar to myself\b|\breturn to myself\b|\bfeel alien to myself\b/i;
const QUIET_CONFIDENCE_PATTERNS = /\bdon['’]t trust myself\b|\blose trust in myself\b|\bscared of another bad day\b|\bafraid of symptoms\b|\bemotionally shaken\b|\bdestabilized\b|\bi panic after\b|\bdifficult day defines\b/i;
const SELF_TRUST_STABILITY_PATTERNS = /\bdon['’]t trust my body\b|\bdon['’]t trust my mind\b|\bmonitor every feeling\b|\bmonitoring every feeling\b|\bscan(?:ning)? symptoms\b|\bhypervigil(?:ance|ant)\b|\bat war with my body\b|\bat war with my mind\b|\bunpredictable symptoms\b/i;
const BREATHING_ROOM_PATTERNS = /\beverything feels urgent\b|\bemotionally stacked\b|\bfeel rushed\b|\bsolve now\b|\btoo much pressure at once\b|\binternal urgency\b|\bmentally rushing\b|\bevery pressure\b/i;
const EMOTIONAL_COLLAPSE_PATTERNS = /\beverything feels too much\b|\bemotionally collaps(?:e|ing|ed)\b|\bemotionally flooded\b|\bemotional shutdown after overwhelm\b|\boverwhelm shutdown\b|\bcan't hold all of this\b|\btoo flooded\b|\bemotional exhaustion spiral\b/i;
const FUTURE_FEAR_RECOVERY_PATTERNS = /\bwhat happens next\b|\beverything will get worse\b|\blose stability\b|\bworsen(?:ing)? symptoms\b|\bfuture spiral\b|\bfear-heavy future\b/i;
const UNCERTAINTY_SUPPORT_PATTERNS = /\beverything feels uncertain\b|\bwhat if\b|\bwon['’]t settle\b|\bthinking ahead\b|\bmy brain won['’]t settle\b|\bunknowns\b|\bi can['’]t stop thinking ahead\b|\buncertain\b/i;
const OVERLOAD_RECOVERY_PATTERNS = /\bsocial exhaustion\b|\boverstimul(?:ated|ation)\b|\btoo much people\b|\btoo much noise\b|\bmentally drained\b|\bemotional noise\b|\bpeople heavy\b|\bneed quieter input\b|\bdrained after social\b/i;
const FEAR_RECOVERY_PATTERNS = /\beverything feels scary\b|\bhealth anxiety\b|\bsymptoms feel overwhelming\b|\bi can['’]t stop worrying\b|\bpanic-like\b|\bmentally flooded\b|\bsymptom fear\b|\bjumping to conclusions\b/i;
const FUTURE_FEAR_PATTERNS = /\blose myself\b|\bdisappear(?:ing)?\b|\bunrecognizable\b|\bmy life keeps shrinking\b|\bwho will i be\b|\bwho am i becoming\b|\bafraid of the future\b|\bfuture fear\b/i;
const LOSS_GRIEF_PATTERNS = /\bgrief\b|\bgrieving\b|\bloss\b|\bletting go\b|\bold version of life\b|\bold life\b|\bmiss who i was\b|\bsad about what changed\b|\bi should be over this\b|\bmoving on\b/i;
const FLARE_SUPPORT_PATTERNS = /\bflare\b|\bsymptom spike\b|\bheavier day\b|\bphysical setback\b|\bsymptom[- ]intense\b|\bdifficult symptom day\b|\btoo many symptoms\b|\bbody feels loud\b/i;
const EMOTIONAL_SPACIOUSNESS_PATTERNS = /\bfighting myself\b|\bneed to fix everything\b|\binternal pressure\b|\bcan't carry this\b|\bneed clarity now\b|\btoo much internal resistance\b|\bfeel trapped by this\b/i;
const QUIET_HOPE_PATTERNS = /\bhopeless\b|\bnothing will improve\b|\bno point\b|\bthis feels final\b|\bdiscouraged\b|\bbad stretch\b|\bwon['’]t get better\b|\bconsumed by this\b/i;
const EMOTIONAL_NUMBNESS_PATTERNS = /\bemotionally numb(?:ness)?\b|\bemotionally distant\b|\bfeel nothing\b|\bemotional flat(?:ness)?\b|\bnothing feels real\b|\bnothing feels meaningful\b|\bemotionally checked out\b|\bcan't feel much\b/i;
const LIFE_RECONNECTION_PATTERNS = /\bdisconnected\b|\bemotional numb(?:ness)?\b|\bshutdown\b|\bwithdrawn\b|\bfar away from life\b|\bcan't feel much\b|\bneed to reconnect\b|\bchecked out\b/i;
const ISOLATION_SUPPORT_PATTERNS = /\blonely\b|\balone\b|\bisolat(?:ed|ion)\b|\bemotionally unseen\b|\bsocial withdrawal\b|\bfeel unseen\b|\bno one gets it\b|\bdisconnected from people\b/i;
const IDENTITY_CONTINUITY_PATTERNS = /\blost myself\b|\bnot myself lately\b|\bfragmented\b|\bwho am i during this\b|\bself feels unstable\b|\bchanging too much\b|\bdo not feel like myself during this change\b/i;
const LONG_TERM_STABILITY_PATTERNS = /\bfigure everything out\b|\bno direction\b|\blong term\b|\btoo much future pressure\b|\blife pressure\b|\bperfect plan\b|\blost over time\b|\bhow do i live like this over time\b/i;
const IMPERFECT_DAYS_PATTERNS = /\bi failed today\b|\bimperfect day\b|\binconsistent\b|\bruined the day\b|\ball or nothing\b|\bwhy can['’]t i be consistent\b|\bbad day means\b|\bnot enough today\b/i;
const SETBACK_STABILITY_PATTERNS = /\bgoing backwards\b|\bgetting worse\b|\bregress(?:ion)?\b|\bsetback\b|\bdiscourag(?:ed|ing)\b|\bslipping\b|\bprogress feels fake\b|\bafraid this means everything is getting worse\b/i;
const SELF_FORGIVENESS_PATTERNS = /\btoo harsh on myself\b|\bpunish(?:ing)? myself\b|\bneed to forgive myself\b|\bguilt about resting\b|\bi should be doing more\b|\bi am not enough\b|\bbeing hard on myself\b|\bself[- ]judg(?:e|ment)\b/i;
const NONLINEARITY_SUPPORT_PATTERNS = /\bwhy can['’]t i stay stable\b|\bnonlinear\b|\bfluctuat(?:e|ion)\b|\bup and down\b|\binconsistent\b|\bunpredictable\b|\bcan't stay steady\b|\bfeel less steady than others\b/i;
const EMOTIONAL_RESET_PATTERNS = /\bslow things down\b|\beverything feels too loud\b|\bemotional carryover\b|\bnervous system\b|\bneed to reset\b|\bcan['’]t come down\b|\bdecompress after\b|\bstill carrying this\b/i;
const MENTAL_EXHAUSTION_PATTERNS = /\bbrain feels empty\b|\bmentally exhausted\b|\bcognitive burnout\b|\bempty tank\b|\bmentally depleted\b|\bno mental energy\b|\bbrain is spent\b|\bmentally drained for days\b/i;
const REBUILDING_SUPPORT_PATTERNS = /\blong difficult stretch\b|\blong hard period\b|\bsurvival mode\b|\brebuild(?:ing)?\b|\bcome back after burnout\b|\brestabiliz(?:e|ing)\b|\bpost[- ]overwhelm\b/i;
const TRANSITION_PATTERNS = /\btravel\b|\btrip\b|\baway from home\b|\broutine change\b|\broutine shifted\b|\bdisrupted week\b|\beverything changed this week\b|\btime away\b|\breturning after\b|\bstressful week\b/i;
const IDENTITY_RECOVERY_PATTERNS = /\bjudge myself\b|\bmy fault\b|\bi should be doing more\b|\bfeel like a failure\b|\bself[- ]blame\b|\bguilt\b|\bshame\b|\bnot myself\b|\bat war with myself\b/i;
const SETBACK_RECOVERY_PATTERNS = /\bstopped check[- ]?ins\b|\bfell out of structure\b|\blost my routine\b|\bdiscouraged\b|\bstart again\b|\brestart\b|\btime away\b|\bi missed\b|\bi fell off\b/i;
const FUTURE_PLANNING_PATTERNS = /\bplan everything\b|\bovercommit\b|\btoo much next week\b|\bschedule\b|\bfuture planning\b|\bplanning fatigue\b|\bcommitments\b|\bweeks? ahead\b|\bmonth ahead\b/i;

const BOUNDARY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bi(?:'| a)?m always here for you\b/gi, "you can use this space when it feels useful"],
  [/\bi(?:'| wi)ll stay with you\b/gi, "you can come back if it still feels useful"],
  [/\bi understand you deeply\b/gi, "I may be able to reflect something simple back"],
  [/\byou can always come to me\b/gi, "you can use this space lightly when it helps"],
  [/\byou only need me\b/gi, "real-world support still matters"],
  [/\byou can rely on me\b/gi, "this can be one small support"],
  [/\blet(?:'|’)s unpack\b/gi, "we can keep this simple"],
  [/\bdeep healing\b/gi, "gentler support"],
];

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function keepSingleQuestion(text: string) {
  let seenQuestion = false;

  return splitSentences(text)
    .filter((sentence) => {
      const hasQuestion = sentence.includes("?");
      if (!hasQuestion) {
        return true;
      }
      if (seenQuestion) {
        return false;
      }
      seenQuestion = true;
      return true;
    })
    .join(" ")
    .trim();
}

export function detectCoachOverwhelm(input: CoachRefinementInput) {
  const state = deriveAdaptiveExperience({
    recentStressAverage: input.stress,
    brainFog: input.brainFog,
    recentFatigueAverage: input.fatigue,
    recentSleepAverage: input.sleepHours,
    lowEnergyModeEnabled: input.lowEnergyMode,
    fatigueTrend: input.adaptiveFatigueTrend,
    stressTrend: input.adaptiveStressTrend,
    message: input.message,
  });

  return (
    (typeof input.stress === "number" && input.stress >= 4) ||
    (typeof input.brainFog === "number" && input.brainFog >= 4) ||
    state.intensity.level === "high" ||
    state.intensity.primaryState === "grounding" ||
    OVERWHELM_PATTERNS.test(input.message ?? "") ||
    DIFFICULT_DAY_PATTERNS.test(input.message ?? "")
  );
}

export function detectCoachLowEnergyMode(input: CoachRefinementInput) {
  const state = deriveAdaptiveExperience({
    recentStressAverage: input.stress,
    brainFog: input.brainFog,
    recentFatigueAverage: input.fatigue,
    recentSleepAverage: input.sleepHours,
    lowEnergyModeEnabled: input.lowEnergyMode,
    fatigueTrend: input.adaptiveFatigueTrend,
    stressTrend: input.adaptiveStressTrend,
    message: input.message,
  });

  return (
    Boolean(input.lowEnergyMode) ||
    (typeof input.fatigue === "number" && input.fatigue >= 4) ||
    (typeof input.sleepHours === "number" && input.sleepHours > 0 && input.sleepHours < 6) ||
    input.adaptiveFatigueTrend === "high" ||
    state.cognitiveLoad.level === "active"
  );
}

export function deriveCoachResponseShape(input: CoachRefinementInput): CoachResponseShape {
  const settings = deriveAdaptiveCoachSettings({
    recentStressAverage: input.stress,
    brainFog: input.brainFog,
    recentFatigueAverage: input.fatigue,
    recentSleepAverage: input.sleepHours,
    lowEnergyModeEnabled: input.lowEnergyMode,
    fatigueTrend: input.adaptiveFatigueTrend,
    stressTrend: input.adaptiveStressTrend,
    message: input.message,
    timeOfDay: input.timeOfDay,
  });

  return {
    maxParagraphs: settings.maxParagraphs,
    maxSentences: settings.maxSentences,
    maxChars: settings.maxChars,
  };
}

export function softenCoachAssistantText(text: string, input: CoachRefinementInput) {
  let next = text.trim();

  for (const [pattern, replacement] of BOUNDARY_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  next = next
    .replace(/\bI know exactly what you need\b/gi, "I may be able to help you narrow this down")
    .replace(/\byou should\b/gi, "you could")
    .replace(/\byou need to\b/gi, "it may help to")
    .replace(/\bI’m sorry you’re feeling this way\b/gi, "That sounds heavy.")
    .replace(/\bI'm sorry you're feeling this way\b/gi, "That sounds heavy.")
    .replace(/\bI’m sorry this is so hard\b/gi, "This sounds like a hard stretch.")
    .replace(/\bI'm sorry this is so hard\b/gi, "This sounds like a hard stretch.")
    .replace(/\n{3,}/g, "\n\n");

  next = keepSingleQuestion(next);

  const shape = deriveCoachResponseShape(input);
  const paragraphs = next
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .slice(0, shape.maxParagraphs);

  const trimmedParagraphs: string[] = [];
  let sentenceCount = 0;

  for (const paragraph of paragraphs) {
    const kept = splitSentences(paragraph).filter(() => {
      if (sentenceCount >= shape.maxSentences) {
        return false;
      }
      sentenceCount += 1;
      return true;
    });

    if (kept.length) {
      trimmedParagraphs.push(kept.join(" "));
    }

    if (sentenceCount >= shape.maxSentences) {
      break;
    }
  }

  next = trimmedParagraphs.join("\n\n").trim();

  if (next.length > shape.maxChars) {
    next = `${next.slice(0, shape.maxChars).trimEnd()}…`;
  }

  const governance = derivePlatformGovernance({
    recentStressAverage: input.stress,
    brainFog: input.brainFog,
    recentFatigueAverage: input.fatigue,
    recentSleepAverage: input.sleepHours,
    lowEnergyModeEnabled: input.lowEnergyMode,
    interactionTolerance: detectCoachLowEnergyMode(input) ? "reduced" : "steady",
    message: next,
    timeOfDay: input.timeOfDay,
    surface: "coach",
  });

  const interpreted = splitSentences(next).slice(0, governance.ai.maxInterpretiveSentences).join(" ").trim();
  return applySafeAIBehavior(guardEmotionalSupportCopy(interpreted));
}

export function deriveCoachStarterSuggestions(input: CoachRefinementInput) {
  const support = deriveCalmLifeSupport({
    lowEnergyModeEnabled: input.lowEnergyMode,
    recentFatigueAverage: input.fatigue,
    recentStressAverage: input.stress,
    recentSleepAverage: input.sleepHours,
    brainFog: input.brainFog,
    fatigueTrend: input.adaptiveFatigueTrend,
    stressTrend: input.adaptiveStressTrend,
    message: input.message,
    timeOfDay: input.timeOfDay,
    overwhelmDetected: detectCoachOverwhelm(input),
  });

  if (input.timeOfDay === "evening") {
    return [
      "Everything feels noisy tonight",
      "Help me slow down before sleep",
      "I need a quieter evening",
    ];
  }

  if (typeof input.brainFog === "number" && input.brainFog >= 4) {
    return [
      "I can’t focus",
      "Everything feels mentally noisy",
      "Help me simplify the next hour",
    ];
  }

  if (GUIDANCE_PATTERNS.test(input.message ?? "")) {
    return [
      "Too many things feel important",
      "Help me reduce the pressure",
      "What matters most right now?",
    ];
  }

  if (RECOVERY_PATTERNS.test(input.message ?? "")) {
    return [
      "I need a steadier pace",
      "Too many hard days are stacking up",
      "Help me reduce the pressure this week",
    ];
  }

  if (COMMUNICATION_PATTERNS.test(input.message ?? "")) {
    return [
      "I do not know how to explain this simply",
      "I need a gentler boundary",
      "Help me reduce the pressure around this conversation",
    ];
  }

  if (REORIENTATION_PATTERNS.test(input.message ?? "")) {
    return [
      "I feel lost and need smaller direction",
      "Help me reorient more gently",
      "I need less pressure to figure life out",
    ];
  }

  if (EVERYDAY_LIFE_REBUILDING_PATTERNS.test(input.message ?? "")) {
    return [
      "Ordinary life feels hard to re-enter",
      "Help me come back to routines more gently",
      "I need smaller steps back into daily life",
    ];
  }

  if (SELF_RECONNECTION_PATTERNS.test(input.message ?? "")) {
    return [
      "I feel far from myself right now",
      "Help me reconnect with myself more gently",
      "I need less pressure to feel fully back",
    ];
  }

  if (REBUILDING_SUPPORT_PATTERNS.test(input.message ?? "")) {
    return [
      "I am rebuilding after a long hard stretch",
      "Help me return more gently",
      "I need slower rebuilding and less pressure",
    ];
  }

  if (EXISTENTIAL_GROUNDING_PATTERNS.test(input.message ?? "")) {
    return [
      "Everything feels existentially heavy right now",
      "Help me keep this smaller and steadier",
      "I need less pressure to solve these questions",
    ];
  }

  if (MEANING_SUPPORT_PATTERNS.test(input.message ?? "")) {
    return [
      "What still feels meaningful lately?",
      "Help me come back to smaller things that matter",
      "I need a quieter sense of what still matters",
    ];
  }

  if (QUIET_CONFIDENCE_PATTERNS.test(input.message ?? "")) {
    return [
      "I feel emotionally shaken by this",
      "Help me steady the next part of the day",
      "I need a quieter way to hold this fear",
    ];
  }

  if (SELF_TRUST_STABILITY_PATTERNS.test(input.message ?? "")) {
    return [
      "I do not trust my body right now",
      "Help me carry this more gently",
      "I need less internal urgency around every feeling",
    ];
  }

  if (BREATHING_ROOM_PATTERNS.test(input.message ?? "")) {
    return [
      "Everything feels urgent right now",
      "Help me slow the internal pace",
      "I need more breathing room around all of this",
    ];
  }

  if (EMOTIONAL_COLLAPSE_PATTERNS.test(input.message ?? "")) {
    return [
      "Everything feels too much right now",
      "Help me make this smaller and steadier",
      "I need less emotional pressure",
    ];
  }

  if (FUTURE_FEAR_RECOVERY_PATTERNS.test(input.message ?? "")) {
    return [
      "The future feels emotionally loud right now",
      "Help me keep the horizon smaller",
      "I need less pressure around what happens next",
    ];
  }

  if (FUTURE_FEAR_PATTERNS.test(input.message ?? "")) {
    return [
      "I am scared of who I might become",
      "Help me carry this future fear more gently",
      "I need less pressure around the unknowns",
    ];
  }

  if (LOSS_GRIEF_PATTERNS.test(input.message ?? "")) {
    return [
      "Some of this still feels emotionally heavy",
      "Help me carry this change more gently",
      "I need less pressure to be over it",
    ];
  }

  if (UNCERTAINTY_SUPPORT_PATTERNS.test(input.message ?? "")) {
    return [
      "Everything feels uncertain",
      "Help me keep the focus smaller",
      "I need a calmer way to hold the unknowns",
    ];
  }

  if (OVERLOAD_RECOVERY_PATTERNS.test(input.message ?? "")) {
    return [
      "I need quieter input after this",
      "Help me decompress after too much people and noise",
      "I feel mentally drained from today",
    ];
  }

  if (FEAR_RECOVERY_PATTERNS.test(input.message ?? "")) {
    return [
      "Everything suddenly feels scary",
      "Help me slow the fear down a little",
      "I need a calmer way to hold this symptom fear",
    ];
  }

  if (FLARE_SUPPORT_PATTERNS.test(input.message ?? "")) {
    return [
      "Today feels symptom-heavy",
      "Help me simplify the day",
      "I need a gentler pace through this",
    ];
  }

  if (EMOTIONAL_SPACIOUSNESS_PATTERNS.test(input.message ?? "")) {
    return [
      "I need less internal pressure",
      "Help me carry this more gently",
      "I do not want to keep fighting myself today",
    ];
  }

  if (QUIET_HOPE_PATTERNS.test(input.message ?? "")) {
    return [
      "This stretch feels discouraging",
      "Help me reconnect with steadier ground",
      "I need a calmer way to hold this period",
    ];
  }

  if (EMOTIONAL_NUMBNESS_PATTERNS.test(input.message ?? "")) {
    return [
      "I feel emotionally numb right now",
      "Help me reconnect more gently",
      "I need less pressure to feel different",
    ];
  }

  if (ISOLATION_SUPPORT_PATTERNS.test(input.message ?? "")) {
    return [
      "I feel lonely and withdrawn right now",
      "Help me keep this gentler",
      "I need smaller forms of connection",
    ];
  }

  if (IDENTITY_CONTINUITY_PATTERNS.test(input.message ?? "")) {
    return [
      "I do not feel like myself during this change",
      "Help me stay connected to steadier parts of me",
      "I need a gentler sense of continuity",
    ];
  }

  if (LONG_TERM_STABILITY_PATTERNS.test(input.message ?? "")) {
    return [
      "I do not want to figure everything out at once",
      "Help me keep life smaller and steadier",
      "I need a calmer long-term pace",
    ];
  }

  if (IMPERFECT_DAYS_PATTERNS.test(input.message ?? "")) {
    return [
      "Today feels imperfect and heavier than I wanted",
      "Help me reduce the pressure around this day",
      "I need a gentler way to hold inconsistency",
    ];
  }

  if (SETBACK_STABILITY_PATTERNS.test(input.message ?? "")) {
    return [
      "I am afraid I am going backwards",
      "Help me hold this setback more steadily",
      "I need less pressure around this stretch",
    ];
  }

  if (NONLINEARITY_SUPPORT_PATTERNS.test(input.message ?? "")) {
    return [
      "I cannot stay stable in a straight line",
      "Help me carry the fluctuation more gently",
      "I need less pressure around inconsistency",
    ];
  }

  if (SELF_FORGIVENESS_PATTERNS.test(input.message ?? "")) {
    return [
      "I am being too hard on myself",
      "Help me reduce the guilt a little",
      "I need a gentler way to hold this day",
    ];
  }

  if (EMOTIONAL_RESET_PATTERNS.test(input.message ?? "")) {
    return [
      "Everything feels too loud right now",
      "Help me slow things down",
      "I need a quieter reset before the next hour",
    ];
  }

  if (MENTAL_EXHAUSTION_PATTERNS.test(input.message ?? "")) {
    return [
      "My brain feels empty right now",
      "Help me recover more slowly",
      "I need less mental pressure",
    ];
  }

  if (LIFE_RECONNECTION_PATTERNS.test(input.message ?? "")) {
    return [
      "I feel disconnected from life right now",
      "Help me reconnect more gently",
      "I need smaller ways back into ordinary life",
    ];
  }

  if (MEANINGFUL_LIFE_PATTERNS.test(input.message ?? "")) {
    return [
      "What still feels grounding outside symptoms?",
      "Help me reconnect with ordinary life a little",
      "I need less illness-centered thinking right now",
    ];
  }

  if (FORWARD_STABILITY_PATTERNS.test(input.message ?? "")) {
    return [
      "The future feels loud right now",
      "Help me keep this closer to today",
      "I need a calmer sense of this week",
    ];
  }

  if (TRANSITION_PATTERNS.test(input.message ?? "")) {
    return [
      "Everything changed this week",
      "Help me restart gently",
      "I need a quieter pace through this transition",
    ];
  }

  if (SELF_FORGIVENESS_PATTERNS.test(input.message ?? "")) {
    return [
      "I am being too hard on myself",
      "Help me reduce the guilt a little",
      "I need a gentler way to hold this day",
    ];
  }

  if (IDENTITY_RECOVERY_PATTERNS.test(input.message ?? "")) {
    return [
      "I am being hard on myself",
      "Help me lower the pressure a little",
      "I need a gentler way to hold this week",
    ];
  }

  if (SETBACK_RECOVERY_PATTERNS.test(input.message ?? "")) {
    return [
      "I need to restart quietly",
      "Help me begin again without pressure",
      "I feel discouraged after the gap",
    ];
  }

  if (FUTURE_PLANNING_PATTERNS.test(input.message ?? "")) {
    return [
      "I do not want to plan everything at once",
      "Help me keep the horizon smaller",
      "I need a calmer way to think about next week",
    ];
  }

  if (DIFFICULT_DAY_PATTERNS.test(input.message ?? "")) {
    return [
      "Everything feels too hard",
      "I can’t do much today",
      "I need less pressure",
    ];
  }

  if (detectCoachOverwhelm(input)) {
    return [
      "I’m overwhelmed",
      "Help me slow things down",
      "I don’t know what I need right now",
    ];
  }

  if (detectCoachLowEnergyMode(input)) {
    return [
      "I’m mentally exhausted",
      "I need a calmer day",
      support.calmDailySupport.suggestions[0] ?? "What can stay simple today?",
    ];
  }

  return [
    "Today feels heavy",
    support.calmDailySupport.suggestions[1] ?? "I need a calmer day",
    support.calmDailySupport.suggestions[2] ?? "Help me sort out one next step",
  ];
}

export function deriveCoachFallbackState(input: CoachRefinementInput): CoachFallbackState {
  const support = deriveCalmLifeSupport({
    lowEnergyModeEnabled: input.lowEnergyMode,
    recentFatigueAverage: input.fatigue,
    recentStressAverage: input.stress,
    recentSleepAverage: input.sleepHours,
    brainFog: input.brainFog,
    fatigueTrend: input.adaptiveFatigueTrend,
    stressTrend: input.adaptiveStressTrend,
    message: input.message,
    timeOfDay: input.timeOfDay,
    overwhelmDetected: detectCoachOverwhelm(input),
  });

  if (input.timeOfDay === "evening") {
    return {
      title: "A quieter night is okay",
      body: "The conversation is taking a moment to reconnect. The night does not need to hold everything from the day.",
      suggestions: ["Lower one source of input", "Let one thing wait until tomorrow", "Keep the rest of tonight simple"],
    };
  }

  if (TRANSITION_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Transitions can stay gentle",
      body: "The conversation is taking a moment to reconnect. You do not need to solve a disrupted week all at once.",
      suggestions: ["Keep the next step small", "Let one routine shift stay unfinished", "Reduce expectations for today"],
    };
  }

  if (SELF_FORGIVENESS_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Less internal harshness may help",
      body: "The conversation is taking a moment to reconnect. You may not need to be as harsh with yourself right now, especially when capacity has been changing more than you wanted.",
      suggestions: [
        "Lower one self-demand",
        "Let rest stay ordinary",
        "Keep the inner pace gentler",
      ],
    };
  }

  if (IDENTITY_RECOVERY_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Less pressure on yourself may help",
      body: "The conversation is taking a moment to reconnect. A hard stretch does not need to become a harsh story about you.",
      suggestions: ["Lower one expectation", "Keep the inner pace gentler", "Let today stay smaller"],
    };
  }

  if (SETBACK_RECOVERY_PATTERNS.test(input.message ?? "")) {
    return {
      title: "You can restart quietly",
      body: "The conversation is taking a moment to reconnect. Some periods naturally become harder to maintain, and you do not need to recover all at once.",
      suggestions: ["Keep the restart very small", "Ignore the pressure to catch up", "Let one step be enough"],
    };
  }

  if (FUTURE_PLANNING_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Keep the horizon smaller for now",
      body: "The conversation is taking a moment to reconnect. You may not need to plan everything at once for the next stretch to feel a little steadier.",
      suggestions: ["Shorten the planning window", "Leave one thing flexible", "Protect one little bit of room"],
    };
  }

  if (typeof input.brainFog === "number" && input.brainFog >= 4) {
    return {
      title: "Keep the next part simple",
      body: "The conversation is taking a moment to reconnect. One clear next step may be enough for now.",
      suggestions: ["Write down one next step", "Set one thing aside", "Reduce one decision"],
    };
  }

  if (GUIDANCE_PATTERNS.test(input.message ?? "")) {
    return {
      title: "A simpler next step is okay",
      body: "The conversation is taking a moment to reconnect. Reducing pressure may help more than adding more structure right now.",
      suggestions: ["Choose one priority", "Let one thing wait", "Keep the next hour smaller"],
    };
  }

  if (RECOVERY_PATTERNS.test(input.message ?? "")) {
    return {
      title: "A steadier pace is okay",
      body: "The conversation is taking a moment to reconnect. Protecting recovery time may matter more than doing more right now.",
      suggestions: ["Reduce one demand", "Protect one rest pocket", "Keep the next stretch simpler"],
    };
  }

  if (COMMUNICATION_PATTERNS.test(input.message ?? "")) {
    return {
      title: "A simpler explanation is okay",
      body: "The conversation is taking a moment to reconnect. You may not need a long explanation for what today feels like.",
      suggestions: ["Keep it to one sentence", "Reduce one layer of explanation", "Protect energy in the conversation"],
    };
  }

  if (REORIENTATION_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Direction can stay smaller for now",
      body: "The conversation is taking a moment to reconnect. You may not need a complete direction right now, and smaller forms of steadiness may still matter.",
      suggestions: ["Come back to one ordinary anchor", "Keep the next part simpler", "Let direction stay quieter"],
    };
  }

  if (EVERYDAY_LIFE_REBUILDING_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Ordinary life can return gradually",
      body: "The conversation is taking a moment to reconnect. You may not need to rebuild everything all at once for ordinary life to feel a little more reachable again.",
      suggestions: ["Choose one familiar routine", "Let the pace stay smaller", "Keep one ordinary task simple"],
    };
  }

  if (SELF_RECONNECTION_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Familiarity can return gradually",
      body: "The conversation is taking a moment to reconnect. You may still be yourself even during difficult periods, and familiarity does not need to return all at once.",
      suggestions: ["Come back to one familiar routine", "Let the pace stay quieter", "Keep the next part gentle"],
    };
  }

  if (REBUILDING_SUPPORT_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Rebuilding can stay gradual",
      body: "The conversation is taking a moment to reconnect. You may not need to rebuild everything at once after a long difficult stretch, and a smaller pace can still be meaningful right now.",
      suggestions: [
        "Keep one routine low-demand",
        "Reduce one expectation",
        "Let the return stay gradual",
      ],
    };
  }

  if (EXISTENTIAL_GROUNDING_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Difficult questions can stay smaller for now",
      body: "The conversation is taking a moment to reconnect. Meaning does not always need to feel dramatic or fully clear, and you may not need to resolve every difficult question right now.",
      suggestions: ["Come back to one ordinary anchor", "Let one question stay unfinished", "Keep the next part simpler"],
    };
  }

  if (MEANING_SUPPORT_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Meaning can stay smaller for now",
      body: "The conversation is taking a moment to reconnect. Meaning does not need to feel dramatic for this stretch to still hold something steady.",
      suggestions: ["Name one quieter anchor", "Come back to one ordinary thing", "Let this stay simple"],
    };
  }

  if (QUIET_CONFIDENCE_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Steadier can still return",
      body: "The conversation is taking a moment to reconnect. One difficult day may not define the whole pattern, even when it feels emotionally loud up close.",
      suggestions: ["Keep the next part quieter", "Come back to one grounding step", "Let steadiness rebuild gradually"],
    };
  }

  if (SELF_TRUST_STABILITY_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Trust can rebuild more gently",
      body: "The conversation is taking a moment to reconnect. You may not need to monitor every feeling so intensely right now, and calmer pacing may help more than forcing certainty out of every shift.",
      suggestions: [
        "Lower one source of internal urgency",
        "Come back to one ordinary anchor",
        "Keep the next part quieter",
      ],
    };
  }

  if (BREATHING_ROOM_PATTERNS.test(input.message ?? "")) {
    return {
      title: "A slower internal pace may help",
      body: "The conversation is taking a moment to reconnect. Not everything may need immediate emotional resolution, and you may not need to carry every pressure simultaneously.",
      suggestions: [
        "Lower one source of pressure",
        "Keep the next part quieter",
        "Let one thing wait",
      ],
    };
  }

  if (EMOTIONAL_COLLAPSE_PATTERNS.test(input.message ?? "")) {
    return {
      title: "This can stay smaller for now",
      body: "The conversation is taking a moment to reconnect. You may not need to emotionally solve everything right now, and some moments may simply require a quieter pace.",
      suggestions: [
        "Lower one source of input",
        "Keep the next part smaller",
        "Reduce one decision",
      ],
    };
  }

  if (FUTURE_FEAR_RECOVERY_PATTERNS.test(input.message ?? "")) {
    return {
      title: "The horizon can stay smaller for now",
      body: "The conversation is taking a moment to reconnect. You may not need to emotionally solve the future tonight, and a smaller focus may help this feel a little less overwhelming.",
      suggestions: [
        "Come back to today",
        "Let one future thought wait",
        "Keep the next part gentler",
      ],
    };
  }

  if (FUTURE_FEAR_PATTERNS.test(input.message ?? "")) {
    return {
      title: "The future can stay smaller for now",
      body: "The conversation is taking a moment to reconnect. Fear can make the future and your sense of self feel emotionally louder, and you may not need to solve the whole future tonight.",
      suggestions: [
        "Come back to one ordinary anchor",
        "Let the wider picture stay open",
        "Keep the next part gentler",
      ],
    };
  }

  if (LOSS_GRIEF_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Some losses stay heavy for a while",
      body: "The conversation is taking a moment to reconnect. Some forms of grief can feel quieter and ongoing, and you may not need to emotionally resolve everything immediately.",
      suggestions: [
        "Let one feeling stay unfinished",
        "Come back to one ordinary anchor",
        "Keep the emotional pace gentler",
      ],
    };
  }

  if (UNCERTAINTY_SUPPORT_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Unknowns can stay smaller for now",
      body: "The conversation is taking a moment to reconnect. You may not need to solve the future all at once for this moment to feel a little steadier.",
      suggestions: ["Keep the horizon closer", "Lower one pressure loop", "Come back to today"],
    };
  }

  if (OVERLOAD_RECOVERY_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Quieter input may help now",
      body: "The conversation is taking a moment to reconnect. Some days may simply need more decompression after too much people, noise, or mental carryover.",
      suggestions: ["Lower one source of input", "Keep the next part quieter", "Let the nervous system settle gradually"],
    };
  }

  if (FEAR_RECOVERY_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Fear can stay slower for now",
      body: "The conversation is taking a moment to reconnect. You may not need to interpret everything immediately for this moment to become a little less intense.",
      suggestions: ["Lower one source of input", "Slow the interpretation down", "Come back to one grounding step"],
    };
  }

  if (FLARE_SUPPORT_PATTERNS.test(input.message ?? "")) {
    return {
      title: "A gentler pace is okay here",
      body: "The conversation is taking a moment to reconnect. Heavier days may simply need less pressure, less input, and a smaller view of the day.",
      suggestions: ["Keep the day smaller", "Lower one demand", "Reduce one source of stimulation"],
    };
  }

  if (EMOTIONAL_SPACIOUSNESS_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Less internal pressure may help",
      body: "The conversation is taking a moment to reconnect. You may not need to solve every feeling immediately for this period to feel a little more spacious.",
      suggestions: ["Reduce one expectation", "Let clarity arrive more slowly", "Come back to one grounding step"],
    };
  }

  if (QUIET_HOPE_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Steadier ground can return gradually",
      body: "The conversation is taking a moment to reconnect. One difficult period may not define everything ahead, even if this stretch feels emotionally heavy right now.",
      suggestions: ["Look for one steadier moment", "Let recovery stay gradual", "Keep the next part simple"],
    };
  }

  if (EMOTIONAL_NUMBNESS_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Quieter reconnection is okay",
      body: "The conversation is taking a moment to reconnect. You may not need to force yourself to feel differently immediately when things feel emotionally distant or flat.",
      suggestions: [
        "Come back to one ordinary anchor",
        "Let the emotional pace stay slower",
        "Keep the next part low-pressure",
      ],
    };
  }

  if (ISOLATION_SUPPORT_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Connection can stay smaller for now",
      body: "The conversation is taking a moment to reconnect. Some periods naturally feel more disconnected than others, and you may not need to change that all at once.",
      suggestions: [
        "Keep contact low-pressure",
        "Come back to one ordinary routine",
        "Let connection stay small",
      ],
    };
  }

  if (IDENTITY_CONTINUITY_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Steadier parts of you can still remain",
      body: "The conversation is taking a moment to reconnect. Identity can feel quieter during changing periods without disappearing, and you may not need to solve that all at once.",
      suggestions: [
        "Come back to one familiar routine",
        "Let continuity stay small",
        "Notice one steady part of life",
      ],
    };
  }

  if (LONG_TERM_STABILITY_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Life can stay smaller and steadier",
      body: "The conversation is taking a moment to reconnect. You may not need to figure everything out all at once, and a steadier pace may matter more than a perfect long-term plan.",
      suggestions: [
        "Keep one part of life simple",
        "Let the horizon stay smaller",
        "Come back to one ordinary anchor",
      ],
    };
  }

  if (IMPERFECT_DAYS_PATTERNS.test(input.message ?? "")) {
    return {
      title: "An imperfect day can still be a human day",
      body: "The conversation is taking a moment to reconnect. Some days may naturally feel smaller or heavier, and you may not need to interpret that as failure.",
      suggestions: [
        "Reduce one expectation",
        "Let one unfinished thing wait",
        "Keep the next part simpler",
      ],
    };
  }

  if (SETBACK_STABILITY_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Setbacks can stay smaller in the wider picture",
      body: "The conversation is taking a moment to reconnect. A difficult stretch may not define the whole direction of your life, even if it feels louder and more discouraging up close.",
      suggestions: [
        "Come back to one steadier part of the day",
        "Reduce one pressure loop",
        "Let the wider picture stay open",
      ],
    };
  }

  if (NONLINEARITY_SUPPORT_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Steadiness does not need perfection",
      body: "The conversation is taking a moment to reconnect. Some periods naturally feel less steady than others, and you may not need complete stability for the week to still hold meaningful moments.",
      suggestions: [
        "Lower one pressure loop",
        "Let the week stay uneven",
        "Come back to one quieter anchor",
      ],
    };
  }

  if (SELF_FORGIVENESS_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Less internal harshness may help",
      body: "The conversation is taking a moment to reconnect. You may not need to be as harsh with yourself right now, especially when capacity has been changing more than you wanted.",
      suggestions: [
        "Lower one self-demand",
        "Let rest stay ordinary",
        "Keep the inner pace gentler",
      ],
    };
  }

  if (EMOTIONAL_RESET_PATTERNS.test(input.message ?? "")) {
    return {
      title: "The next hour can stay quieter",
      body: "The conversation is taking a moment to reconnect. You may not need to carry all of this into the next hour, and a quieter pace may help your system settle.",
      suggestions: [
        "Reduce one input",
        "Let the next part stay smaller",
        "Choose one slower breath",
      ],
    };
  }

  if (MENTAL_EXHAUSTION_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Mental recovery can stay slower",
      body: "The conversation is taking a moment to reconnect. You may not need to mentally recover all at once, and a quieter pace may help your system settle after a depleted stretch.",
      suggestions: [
        "Reduce one expectation",
        "Let one decision wait",
        "Keep the next part lower-demand",
      ],
    };
  }

  if (LIFE_RECONNECTION_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Life can return in smaller ways",
      body: "The conversation is taking a moment to reconnect. You may not need to reconnect with everything at once for ordinary life to feel a little closer again.",
      suggestions: ["Choose one familiar routine", "Let engagement stay small", "Come back to one ordinary thing"],
    };
  }

  if (MEANINGFUL_LIFE_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Ordinary life still matters",
      body: "The conversation is taking a moment to reconnect. It may help to come back to one ordinary part of life that still feels a little grounding.",
      suggestions: ["Name one ordinary anchor", "Keep one routine small", "Let this stay simple"],
    };
  }

  if (FORWARD_STABILITY_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Keep the future smaller for now",
      body: "The conversation is taking a moment to reconnect. You do not need to solve the future tonight for this moment to become a little steadier.",
      suggestions: ["Come back to today", "Keep the next step small", "Let one future thought wait"],
    };
  }

  if (DIFFICULT_DAY_PATTERNS.test(input.message ?? "")) {
    return {
      title: "Less pressure is okay",
      body: "The conversation is taking a moment to reconnect. Today may be more about reducing pressure than doing more.",
      suggestions: ["Choose one small thing", "Let one thing wait", "Keep the next part simpler"],
    };
  }

  if (detectCoachOverwhelm(input)) {
    return {
      title: support.calmDailySupport.title,
      body: `The conversation is taking a moment to reconnect. ${support.calmDailySupport.body}`,
      suggestions: support.calmDailySupport.suggestions,
    };
  }

  if (detectCoachLowEnergyMode(input)) {
    return {
      title: "A lighter pause is okay",
      body: `The conversation is taking a moment to reconnect. ${support.lowPressureGuidance[0] ?? "A short note or one small next step may be enough for now."}`,
      suggestions: support.calmDailySupport.suggestions,
    };
  }

  return {
    title: support.calmDailySupport.title,
    body: `The conversation is taking a moment to reconnect. ${support.lowPressureGuidance[1] ?? "Here is a simpler local fallback for now."}`,
    suggestions: support.calmDailySupport.suggestions,
  };
}
