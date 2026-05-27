export type TodayFocusCategory =
  | "ms-facts"
  | "pacing"
  | "nervous-system"
  | "cognitive-load"
  | "emotional-realism"
  | "recovery"
  | "practical-support";

export type TodayFocusEntry = {
  category: TodayFocusCategory;
  text: string;
};

export const TODAY_FOCUS_ENTRIES: TodayFocusEntry[] = [
  { category: "pacing", text: "Pacing works best before energy is fully spent." },
  { category: "recovery", text: "Lower stimulation often helps recovery more than people expect." },
  { category: "ms-facts", text: "Fatigue can appear cognitively before it appears physically." },
  { category: "cognitive-load", text: "Reducing decisions can protect energy for what matters." },
  { category: "emotional-realism", text: "You do not need to maximize today for it to matter." },
  { category: "pacing", text: "A smaller plan can prevent a larger crash later." },
  { category: "nervous-system", text: "A stressed nervous system can make ordinary tasks feel louder." },
  { category: "practical-support", text: "One clear next step is easier to carry than a full list." },
  { category: "ms-facts", text: "Heat, stress, and poor sleep can make symptoms feel more intense." },
  { category: "recovery", text: "Recovery is easier to protect before the day becomes overloaded." },
  { category: "cognitive-load", text: "Brain fog often needs fewer inputs, not more effort." },
  { category: "pacing", text: "Doing less early can leave more room for later." },
  { category: "emotional-realism", text: "Changing the plan is not the same as failing the day." },
  { category: "nervous-system", text: "Slowing the pace can lower the body’s sense of threat." },
  { category: "practical-support", text: "If everything feels urgent, choose what is actually time-sensitive." },
  { category: "ms-facts", text: "MS fatigue can make simple choices feel unusually expensive." },
  { category: "recovery", text: "A quieter environment can make the next hour easier." },
  { category: "pacing", text: "Energy is easier to manage when the day has margins." },
  { category: "cognitive-load", text: "Fewer open loops can make thinking feel less crowded." },
  { category: "emotional-realism", text: "Needing a lower-demand day is information, not weakness." },
  { category: "nervous-system", text: "Your body may need safety before it can access clarity." },
  { category: "practical-support", text: "Put the most important task where your best energy usually is." },
  { category: "ms-facts", text: "Symptoms can fluctuate even when you did nothing wrong." },
  { category: "pacing", text: "A realistic plan should include the cost of transitions." },
  { category: "recovery", text: "Rest can be most useful when it happens before depletion." },
  { category: "cognitive-load", text: "Externalizing thoughts can reduce the load of holding them." },
  { category: "emotional-realism", text: "Some days ask for maintenance, not momentum." },
  { category: "nervous-system", text: "Overstimulation can make fatigue feel sharper and harder to sort." },
  { category: "practical-support", text: "Shortening the task can be more useful than postponing everything." },
  { category: "ms-facts", text: "Cognitive fatigue can show up as irritability, delay, or word-finding trouble." },
  { category: "pacing", text: "Protecting energy is easier than rebuilding it after a crash." },
  { category: "recovery", text: "Lower light and fewer sounds can make recovery feel more accessible." },
  { category: "cognitive-load", text: "A cluttered screen can become a cluttered task." },
  { category: "emotional-realism", text: "A difficult symptom day does not need a perfect response." },
  { category: "nervous-system", text: "Stress can narrow attention before you notice it physically." },
  { category: "practical-support", text: "The next useful action may be removing one demand." },
  { category: "ms-facts", text: "Poor sleep can make fatigue and brain fog harder to separate." },
  { category: "pacing", text: "The right pace is the one your body can repeat." },
  { category: "recovery", text: "Recovery often starts with reducing input, not adding a routine." },
  { category: "cognitive-load", text: "When thinking feels slow, fewer choices can be a real support." },
  { category: "emotional-realism", text: "You can respect your limits without shrinking your life." },
  { category: "nervous-system", text: "A brief pause can give your nervous system a clearer signal." },
  { category: "practical-support", text: "If the day is heavy, define what counts as enough early." },
  { category: "ms-facts", text: "MS symptoms can be sensitive to yesterday’s demands." },
  { category: "pacing", text: "The hardest part of pacing is often stopping before you have to." },
  { category: "recovery", text: "A recovery window is easier to keep when it is planned before stress peaks." },
  { category: "cognitive-load", text: "Mental effort still counts as effort." },
  { category: "emotional-realism", text: "A slower day can still be a responsible day." },
  { category: "nervous-system", text: "The body can interpret too many decisions as pressure." },
  { category: "practical-support", text: "Choose the version of the task that leaves something in reserve." },
  { category: "ms-facts", text: "Fatigue can make starting harder even when motivation is present." },
  { category: "pacing", text: "A plan that ignores recovery is not really a plan." },
  { category: "recovery", text: "Protecting recovery is part of functioning." },
  { category: "cognitive-load", text: "Brain fog often improves with clearer structure and fewer inputs." },
  { category: "emotional-realism", text: "You are allowed to measure today by steadiness, not output." },
  { category: "nervous-system", text: "Lowering stimulation can make the body feel less on alert." },
  { category: "practical-support", text: "When energy is limited, sequence matters more than speed." },
  { category: "ms-facts", text: "A symptom flare can make normal responsibilities feel newly complex." },
  { category: "pacing", text: "Leaving capacity unused can be the point of pacing." },
  { category: "recovery", text: "A short quiet break can prevent the day from compounding." },
  { category: "cognitive-load", text: "Writing one thing down can free attention for the next thing." },
  { category: "emotional-realism", text: "Adapting is not giving up; it is staying in the day." },
  { category: "nervous-system", text: "The nervous system often settles faster when the environment asks less." },
  { category: "practical-support", text: "Make the first step visible before judging the whole task." },
  { category: "ms-facts", text: "Fatigue can affect planning, memory, and emotional bandwidth at once." },
  { category: "pacing", text: "A lower-energy day needs a lower-friction plan." },
  { category: "recovery", text: "Rest is more effective when it is not treated as a last resort." },
  { category: "cognitive-load", text: "Too much context can make even simple decisions feel unavailable." },
  { category: "emotional-realism", text: "Today does not need to prove anything." },
  { category: "nervous-system", text: "Racing thoughts can be a signal that the load is too high." },
  { category: "practical-support", text: "If a task feels too large, keep the purpose and shrink the scope." },
  { category: "ms-facts", text: "MS fatigue can arrive without a clean explanation." },
  { category: "pacing", text: "Pacing is not doing nothing; it is choosing the sustainable amount." },
  { category: "recovery", text: "A calmer evening often starts with fewer late-day demands." },
  { category: "cognitive-load", text: "A one-item list can be more functional than a perfect plan." },
  { category: "emotional-realism", text: "Your capacity can change without your character changing." },
  { category: "nervous-system", text: "A body under stress may need repetition and simplicity." },
  { category: "practical-support", text: "The most helpful plan may be the one with fewer moving parts." },
  { category: "ms-facts", text: "Stress can amplify symptoms even when it is not the original cause." },
  { category: "pacing", text: "The goal is not maximum output; it is fewer avoidable crashes." },
  { category: "recovery", text: "Recovery can be active protection, not passive waiting." },
  { category: "cognitive-load", text: "Fewer tabs, fewer sounds, and fewer decisions can all count as support." },
  { category: "emotional-realism", text: "It is reasonable to make the day smaller when symptoms are louder." },
  { category: "nervous-system", text: "Your system may need less intensity before it can find direction." },
  { category: "practical-support", text: "Move one thing from today to later if it protects the whole day." },
  { category: "ms-facts", text: "Symptom patterns often become clearer when days are compared gently." },
  { category: "pacing", text: "If you need recovery tonight, spend energy carefully this afternoon." },
  { category: "recovery", text: "A protected pause can be the difference between tired and depleted." },
  { category: "cognitive-load", text: "When focus is thin, reduce switching before increasing effort." },
  { category: "emotional-realism", text: "You can have ambition and still need accommodation." },
  { category: "nervous-system", text: "Calm often comes from fewer demands, not better self-talk." },
  { category: "practical-support", text: "Choose what helps future-you get through the next few hours." },
  { category: "ms-facts", text: "Cognitive symptoms can be real even when they are hard to describe." },
  { category: "pacing", text: "A sustainable day usually has fewer peaks and softer transitions." },
  { category: "recovery", text: "Recovery needs less negotiation when it is treated as part of the plan." },
  { category: "cognitive-load", text: "Decision fatigue can make every option feel heavier than it is." },
  { category: "emotional-realism", text: "A day can be meaningful without being efficient." },
  { category: "nervous-system", text: "Reducing noise can reduce the work your brain is doing in the background." },
  { category: "practical-support", text: "If you can only do part of it, choose the part that matters most." },
  { category: "ms-facts", text: "Symptoms may lag behind exertion, so yesterday can matter today." },
  { category: "pacing", text: "The best stopping point may be before the obvious stopping point." },
  { category: "recovery", text: "Earlier recovery can make later choices less brittle." },
  { category: "cognitive-load", text: "The brain often handles one clear channel better than many small demands." },
  { category: "emotional-realism", text: "You do not need to earn rest by reaching depletion." },
  { category: "nervous-system", text: "A slower rhythm can make symptoms easier to read." },
  { category: "practical-support", text: "Start with the task that reduces the most future friction." },
  { category: "ms-facts", text: "Fatigue can make emotional regulation more expensive." },
  { category: "pacing", text: "Protect the energy needed for basics before spending it on extras." },
  { category: "recovery", text: "A low-stimulation break can be more useful than a long distracted rest." },
  { category: "cognitive-load", text: "When the mind feels crowded, sorting is a task by itself." },
  { category: "emotional-realism", text: "Being realistic about capacity can be deeply protective." },
  { category: "nervous-system", text: "Your body may settle when the day stops asking for urgency." },
  { category: "practical-support", text: "Make the plan easy enough to begin on a low-energy day." },
] as const;

function getDayNumber(date: string) {
  const parsed = new Date(`${date}T00:00:00.000Z`).getTime();
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.floor(parsed / 86_400_000);
}

export function getTodayFocusLine(date: string) {
  const dayNumber = getDayNumber(date);
  const year = Number(date.slice(0, 4)) || new Date().getUTCFullYear();
  const index = Math.abs((dayNumber * 37 + year * 17) % TODAY_FOCUS_ENTRIES.length);

  return TODAY_FOCUS_ENTRIES[index]?.text ?? "Choose the version of today that protects your energy.";
}
