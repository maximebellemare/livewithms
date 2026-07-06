import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import { Alert, Clipboard, InteractionManager, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import AppButton from "../ui/AppButton";
import AppScreen from "../ui/AppScreen";
import AppText from "../ui/AppText";
import CalmSkeleton from "../ui/CalmSkeleton";
import ErrorState from "../ui/ErrorState";
import {
  useAppointments,
  useCreateAppointment,
  useDeleteAppointment,
  useUpdateAppointment,
} from "../../features/appointments/hooks";
import type { Appointment, AppointmentInput } from "../../features/appointments/types";
import { useAuth } from "../../features/auth/hooks";
import {
  useCareNotes,
  useCreateCareNote,
  useDeleteCareNote,
  useUpdateCareNote,
} from "../../features/care-notes/hooks";
import type { CareNote, CareNoteInput } from "../../features/care-notes/types";
import {
  useCreateMedication,
  useDeleteMedication,
  useMedications,
  useUpdateMedication,
} from "../../features/medications/hooks";
import { medicationsApi } from "../../features/medications/api";
import type { Medication, MedicationInput } from "../../features/medications/types";
import {
  MEDICATION_DAY_OPTIONS,
  type MedicationDay,
  type MedicationScheduleType,
  buildMedicationTakenKey,
  getMedicationDoseEntriesForDate,
} from "../../features/medications/schedule";
import { getErrorMessage } from "../../lib/errors";
import { logger } from "../../lib/logger";
import { trackRetryTriggered } from "../../lib/events";
import { useGrowthState } from "../../features/growth/hooks";
import { useSlowScreenDiagnostics } from "../../lib/observability";
import { useLowEnergyMode } from "../../features/low-energy-mode/hooks";
import { usePremium } from "../../features/premium/hooks";
import {
  incrementFoodAnalysisUsage,
  loadFoodAnalysisUsage,
  loadNutritionPreferences,
  loadSavedNutritionMeals,
  normalizeNutritionState,
  removeSavedNutritionMeal,
  saveNutritionMeal,
  saveNutritionPreferences,
  type SavedNutritionMeal,
  type NutritionPreferences,
} from "../../features/nutrition/storage";
import {
  addCareNotificationResponseListener,
  cancelCareReminders,
  scheduleAppointmentReminders,
  scheduleMedicationReminder,
} from "../../features/reminders/notifications";

const MEDICATION_SCHEDULE_OPTIONS: Array<{
  value: MedicationScheduleType;
  label: string;
}> = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "as_needed", label: "As needed" },
] as const;

const CARE_NOTE_CATEGORIES = [
  "Symptoms noticed",
  "Questions for provider",
  "Medication side effects",
  "Important changes",
  "Things helping",
] as const;

const NUTRITION_FILTERS = [
  "No preference",
  "Vegetarian",
  "Pescatarian",
  "Dairy-free",
  "Gluten-free",
  "High-protein",
  "Low-prep",
  "No-cook options",
  "Freezer-friendly",
  "Family-friendly",
  "Budget-friendly",
] as const;

const NUTRITION_BASICS = [
  {
    title: "Mediterranean-style eating",
    body: "Vegetables, beans, whole grains, fish, olive oil, nuts, and fruit.",
  },
  {
    title: "Anti-inflammatory-style foods",
    body: "Colorful plants, fiber-rich foods, unsaturated fats, herbs, and minimally processed meals.",
  },
  {
    title: "Vitamin D food sources",
    body: "Salmon, sardines, egg yolks, fortified milk alternatives, and fortified cereals.",
  },
  {
    title: "Omega-3 food sources",
    body: "Fatty fish, chia, flax, walnuts, hemp seeds, and fortified options.",
  },
  {
    title: "Hydration",
    body: "Water, herbal tea, broths, fruit, and electrolyte drinks when useful.",
  },
  {
    title: "Fiber and gut support",
    body: "Beans, oats, lentils, berries, vegetables, seeds, and whole grains.",
  },
  {
    title: "Low-energy meal prep",
    body: "Use freezer staples, pre-washed produce, batch proteins, and repeatable easy meals.",
  },
] as const;

const DIET_APPROACHES = [
  {
    title: "Mediterranean-style",
    emphasizes: "Plants, fish, olive oil, beans, whole grains, nuts, and simple meals.",
    difficult: "Fish, produce, and cooking time can be barriers.",
    useful: "People who want a flexible, evidence-informed general wellness pattern.",
  },
  {
    title: "Overcoming MS-style",
    emphasizes: "Plant-forward meals, seafood, low saturated fat, and vitamin D awareness.",
    difficult: "Can feel restrictive and may require planning, label reading, and dietitian support.",
    useful: "People who prefer a structured framework and can make changes gradually.",
  },
  {
    title: "Wahls-style",
    emphasizes: "High vegetable intake, nutrient-dense foods, and fewer processed foods.",
    difficult: "Can be demanding, restrictive, and difficult during fatigue or limited prep capacity.",
    useful: "People who want a structured food template and have support for meal prep.",
  },
  {
    title: "Plant-forward",
    emphasizes: "More vegetables, beans, lentils, grains, nuts, seeds, and fruit.",
    difficult: "Protein, B12, iron, and easy meal planning may need attention.",
    useful: "People who want more plant meals without following a strict diet.",
  },
  {
    title: "Gluten-free/dairy-free considerations",
    emphasizes: "Removing gluten or dairy only when it clearly helps or is medically needed.",
    difficult: "Can add cost, reduce convenience, and make eating harder if not necessary.",
    useful: "People with diagnosed intolerance, allergy, celiac disease, or clinician guidance.",
  },
] as const;

const LOW_ENERGY_MEALS = [
  {
    id: "tuna-bean-bowl",
    title: "Tuna and white bean bowl",
    category: "No-cook",
    tags: ["Pescatarian", "High-protein", "Low-prep", "Budget-friendly"],
    details: "Tuna, canned white beans, olive oil, lemon, greens, and whole-grain toast.",
  },
  {
    id: "greek-yogurt-plate",
    title: "Greek yogurt plate",
    category: "10-minute",
    tags: ["Vegetarian", "High-protein", "Low-prep", "Budget-friendly"],
    details: "Greek yogurt, berries, walnuts, chia, and a slice of whole-grain toast.",
  },
  {
    id: "hummus-plate",
    title: "Hummus snack plate",
    category: "No-cook",
    tags: ["Vegetarian", "Dairy-free", "Low-prep", "Budget-friendly"],
    details: "Hummus, pita, cucumber, carrots, olives, fruit, and boiled eggs if useful.",
  },
  {
    id: "salmon-rice-freezer",
    title: "Salmon rice freezer bowl",
    category: "Freezer-friendly",
    tags: ["Pescatarian", "Gluten-free", "High-protein"],
    details: "Frozen salmon, ready-to-eat rice, frozen vegetables, olive oil, and yogurt dill sauce.",
  },
  {
    id: "lentil-soup-batch",
    title: "Lentil soup batch",
    category: "Batch-cook",
    tags: ["Vegetarian", "Dairy-free", "High-protein", "Budget-friendly"],
    details: "Lentils, canned tomatoes, carrots, spinach, broth, and olive oil.",
  },
  {
    id: "egg-avocado-toast",
    title: "Egg and avocado toast",
    category: "10-minute",
    tags: ["Vegetarian", "High-protein", "Low-prep"],
    details: "Eggs, avocado, whole-grain toast, fruit, and seeds.",
  },
  {
    id: "tofu-stir-fry-kit",
    title: "Tofu stir-fry kit",
    category: "10-minute",
    tags: ["Vegetarian", "Dairy-free", "High-protein", "Low-prep"],
    details: "Pre-cubed tofu, frozen vegetables, ready-to-eat rice, and simple sauce.",
  },
] as const;

const FREE_SAMPLE_MEAL_PLAN = {
  title: "1-day sample meal plan",
  meals: [
    "Breakfast: Greek yogurt, berries, chia, walnuts, and oats.",
    "Lunch: Tuna or chickpea salad over greens with whole-grain toast.",
    "Dinner: Salmon or tofu, ready-to-eat rice, frozen vegetables, and olive oil.",
    "Snack: Apple with peanut butter or hummus with vegetables.",
  ],
} as const;

const PREMIUM_MEAL_PLANS = [
  {
    id: "three-day-mediterranean-low-prep",
    title: "3-day low-prep Mediterranean-style plan",
    category: "3-day meal plan",
    filters: ["Pescatarian", "High-protein", "Low-prep"],
    meals: [
      "Day 1: Yogurt bowl, tuna bean bowl, salmon rice bowl.",
      "Day 2: Egg toast, lentil soup, sheet-pan chicken or tofu.",
      "Day 3: Smoothie with protein, hummus plate, sardine or chickpea pasta.",
    ],
    groceries: {
      Produce: ["Greens", "berries", "lemons", "cucumbers", "carrots", "avocados"],
      Protein: ["Greek yogurt", "eggs", "tuna", "salmon", "lentils", "tofu"],
      Pantry: ["Oats", "chia", "walnuts", "white beans", "rice", "olive oil"],
      Freezer: ["Frozen vegetables", "frozen salmon or tofu-friendly vegetables"],
    },
  },
  {
    id: "seven-day-low-energy-prep",
    title: "7-day low-energy meal prep plan",
    category: "7-day meal plan",
    filters: ["Vegetarian", "Dairy-free", "Gluten-free", "Low-prep", "Budget-friendly"],
    meals: [
      "Repeatable breakfasts: oats, smoothies, egg or tofu toast.",
      "Easy lunches: lentil soup, hummus plates, bean bowls, leftovers.",
      "Simple dinners: reheatable bowls, sheet-pan meals, chickpea pasta, rice bowls.",
      "Prep once: wash produce, batch lentils, portion snacks, freeze two meals.",
    ],
    groceries: {
      Produce: ["Spinach", "berries", "bananas", "sweet potatoes", "broccoli", "peppers"],
      Protein: ["Lentils", "chickpeas", "tofu", "eggs or alternatives", "nuts"],
      Pantry: ["Rice", "oats", "olive oil", "nut butter", "beans", "chickpea pasta"],
      Freezer: ["Frozen vegetables", "frozen fruit", "freezer-friendly soup containers"],
    },
  },
] as const;

const FOOD_SEARCH_SUGGESTIONS = [
  "chips",
  "cookies",
  "frozen pizza",
  "energy drink",
  "protein bar",
  "instant noodles",
  "sweet cereal",
  "salmon",
  "hummus",
] as const;

const FOOD_ANALYSIS_LIBRARY = [
  {
    terms: ["chips", "crisps"],
    name: "Chips",
    processing: "More processed snack",
    inflammation: "May be less supportive for inflammation because it is often salty, refined, and fried.",
    energy: "Can feel quick and convenient, but may not support steady energy on its own.",
    balance: "Usually low in protein and fiber unless paired with something more filling.",
    guidance: "If this is what is available, pair a smaller portion with protein or fiber.",
    alternatives: ["popcorn with olive oil", "roasted chickpeas", "nuts and seeds", "hummus with crackers", "sweet potato chips"],
    easyAlternatives: ["popcorn", "single-serve nuts", "hummus cup with crackers", "pre-cut vegetables and dip"],
  },
  {
    terms: ["cookies", "cookie", "candy", "chocolate bar"],
    name: "Sweet snack",
    processing: "More processed sweet snack",
    inflammation: "Higher added sugar may be less supportive for inflammation-focused eating patterns.",
    energy: "May raise energy briefly and then feel less steady for some people.",
    balance: "Usually lower in protein and fiber, so it may not stay filling for long.",
    guidance: "A more supportive option adds protein, fiber, or fat so energy lasts longer.",
    alternatives: ["Greek yogurt with berries", "apple with peanut butter", "dark chocolate with nuts", "oat energy bites", "berries with walnuts"],
    easyAlternatives: ["fruit and nut pack", "Greek yogurt cup", "apple with peanut butter", "trail mix"],
  },
  {
    terms: ["frozen meal", "frozen pizza", "pizza"],
    name: "Frozen meal",
    processing: "Often more processed, depending on ingredients",
    inflammation: "Some frozen meals are higher in sodium, refined grains, and saturated fat.",
    energy: "Can be useful on low-energy days, especially when paired with vegetables or protein.",
    balance: "Look for protein, fiber, vegetables, and a sodium level that fits your needs.",
    guidance: "Make it more supportive by adding frozen vegetables, beans, tuna, tofu, or a side salad.",
    alternatives: ["frozen grain bowl with vegetables", "soup with beans", "salmon rice freezer bowl", "chickpea pasta", "rotisserie chicken with salad kit"],
    easyAlternatives: ["ready-to-eat rice bowl plus frozen vegetables", "canned soup plus beans", "salad kit plus protein", "freezer soup"],
  },
  {
    terms: ["energy drink", "soda", "soft drink"],
    name: "Sweetened drink",
    processing: "Sweetened beverage",
    inflammation: "Frequent high-sugar drinks may be less supportive for inflammation-focused habits.",
    energy: "Caffeine and sugar can feel helpful short-term but may contribute to energy dips later.",
    balance: "Usually provides little protein or fiber.",
    guidance: "Try a lower-sugar option or pair caffeine with food if energy crashes are common.",
    alternatives: ["sparkling water with citrus", "iced tea with less sugar", "coffee with food", "electrolyte drink with low sugar", "smoothie with protein"],
    easyAlternatives: ["sparkling water", "unsweetened iced tea", "low-sugar electrolyte drink", "coffee plus nuts"],
  },
  {
    terms: ["protein bar", "granola bar", "bar"],
    name: "Packaged bar",
    processing: "Varies from simple to more processed",
    inflammation: "Some bars are high in added sugar or saturated fat; others are reasonable convenience options.",
    energy: "More supportive when it has protein and fiber without a large sugar spike.",
    balance: "Check for protein, fiber, and added sugar balance.",
    guidance: "A bar can be useful on low-energy days if it keeps you fed without extra prep.",
    alternatives: ["nuts and fruit", "Greek yogurt", "hummus and crackers", "boiled eggs and fruit", "higher-fiber protein bar"],
    easyAlternatives: ["nuts and dried fruit", "ready-to-drink protein shake", "cheese or hummus snack pack", "Greek yogurt cup"],
  },
  {
    terms: ["instant noodles", "ramen"],
    name: "Instant noodles",
    processing: "More processed convenience meal",
    inflammation: "Often high in sodium and refined grains, which may be less supportive as a frequent staple.",
    energy: "Quick and low-effort, but usually needs protein or vegetables for steadier energy.",
    balance: "Low protein and fiber unless you add extras.",
    guidance: "Add frozen vegetables, egg, tofu, chicken, or edamame to make it more supportive.",
    alternatives: ["rice noodles with tofu and vegetables", "miso soup with tofu", "ready-to-eat rice with edamame", "lentil soup", "chickpea pasta"],
    easyAlternatives: ["ramen plus frozen vegetables", "ramen plus egg", "miso soup cup plus tofu", "ready-to-eat rice plus edamame"],
  },
  {
    terms: ["cereal", "sweet cereal"],
    name: "Sweet cereal",
    processing: "Often refined and sweetened",
    inflammation: "Higher added sugar may be less supportive for inflammation-focused eating patterns.",
    energy: "May not keep energy steady unless paired with protein or fiber.",
    balance: "Look for higher fiber and pair with protein when possible.",
    guidance: "Make it steadier with Greek yogurt, nuts, chia, or a lower-sugar cereal.",
    alternatives: ["oats with nuts", "higher-fiber cereal", "Greek yogurt with granola", "overnight oats", "eggs with toast"],
    easyAlternatives: ["instant oats with nuts", "higher-fiber cereal", "Greek yogurt and granola", "smoothie with protein"],
  },
  {
    terms: ["salmon", "sardines", "trout"],
    name: "Fatty fish",
    processing: "Minimally processed or lightly processed",
    inflammation: "Generally fits Mediterranean-style and anti-inflammatory-style eating patterns.",
    energy: "Protein and fat can support steadier energy than refined snacks alone.",
    balance: "Good protein source, often with omega-3 fats; add fiber with vegetables, beans, or grains.",
    guidance: "A simple frozen or canned option can make this easier on low-energy days.",
    alternatives: ["sardines", "trout", "tofu with walnuts", "omega-3 eggs", "chia or flax with a protein meal"],
    easyAlternatives: ["canned salmon", "sardines on toast", "frozen salmon fillet", "tuna bean bowl"],
  },
  {
    terms: ["hummus", "chickpeas"],
    name: "Hummus",
    processing: "Usually minimally to moderately processed",
    inflammation: "Often fits Mediterranean-style eating patterns when paired with vegetables or whole grains.",
    energy: "Fiber and fat can help make snacks feel steadier.",
    balance: "Add extra protein if it is the main meal.",
    guidance: "Useful as a low-prep base for snack plates or simple lunches.",
    alternatives: ["bean dip", "lentil soup", "Greek yogurt dip", "tuna bean bowl", "edamame"],
    easyAlternatives: ["hummus cup with crackers", "hummus and pre-cut vegetables", "pita with hummus", "hummus snack plate"],
  },
] as const;

const DEFAULT_FOOD_ANALYSIS = {
  name: "Food item",
  processing: "Depends on ingredients and preparation",
  inflammation: "Less processed options with plants, protein, and fiber are often more supportive.",
  energy: "Energy may feel steadier when the meal includes protein, fiber, and healthy fats.",
  balance: "Check whether it includes protein, fiber, and added sugar balance.",
  guidance: "Try pairing it with a simple protein or fiber source rather than treating it as all-or-nothing.",
  alternatives: ["nuts and fruit", "hummus with crackers", "Greek yogurt with berries", "bean bowl", "freezer-friendly soup"],
  easyAlternatives: ["single-serve nuts", "hummus cup", "Greek yogurt cup", "ready-to-eat rice plus beans"],
} as const;

const MEAL_PLAN_GOALS = [
  "Stable energy",
  "Lower inflammation",
  "Low-energy meals",
  "Brain fog support",
  "Weight management",
  "Better recovery",
  "General wellness",
] as const;

const DIET_STYLE_OPTIONS = [
  "Mediterranean-style",
  "Anti-inflammatory-style",
  "Plant-forward",
  "Higher-protein balanced",
  "Low-prep / fatigue-friendly",
  "Recommend one for me",
] as const;

const PREP_PREFERENCES = [
  { label: "Minimal cooking", description: "Simple meals with little cleanup." },
  { label: "Quick meals", description: "Meals that take about 10 minutes." },
  { label: "Batch cooking", description: "Cook once for multiple meals." },
  { label: "Freezer-friendly meals", description: "Meals that store and reheat well." },
  { label: "No-cook options", description: "Ready-to-eat meals and snack plates." },
] as const;
const BUDGET_PREFERENCES = ["Budget-friendly", "Flexible", "Higher convenience"] as const;
const FREE_FOOD_ANALYSIS_LIMIT = 3;

function summarizeNutritionMealPlanShape(value: unknown) {
  if (!value || typeof value !== "object") {
    return { exists: false };
  }

  const item = value as Record<string, unknown>;
  return {
    exists: true,
    title: typeof item.title === "string" ? item.title : null,
    dietStyle: typeof item.dietStyle === "string" ? item.dietStyle : null,
    fitReasonsCount: Array.isArray(item.fitReasons) ? item.fitReasons.length : 0,
    planDaysCount: Array.isArray(item.plan) ? item.plan.length : 0,
    swapsCount: Array.isArray(item.swaps) ? item.swaps.length : 0,
    groceryCategories: item.groceries && typeof item.groceries === "object" ? Object.keys(item.groceries as Record<string, unknown>).length : 0,
  };
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function sortAppointmentsByDateTime(items: Appointment[], ascending: boolean) {
  return items.slice().sort((left, right) => {
    const dateCompare = left.appointment_date.localeCompare(right.appointment_date);

    if (dateCompare !== 0) {
      return ascending ? dateCompare : -dateCompare;
    }

    const leftTime = left.appointment_time ?? "";
    const rightTime = right.appointment_time ?? "";
    const timeCompare = leftTime.localeCompare(rightTime);

    return ascending ? timeCompare : -timeCompare;
  });
}

function formatAppointmentDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`);

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatAppointmentDateLong(date: string) {
  const parsed = new Date(`${date}T12:00:00`);

  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatAppointmentDateInput(date: string) {
  if (!date) {
    return "Choose a date";
  }

  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return "Choose a date";
  }

  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAppointmentTimeInput(time: string) {
  if (!time) {
    return "Choose a time";
  }

  const [hourText = "0", minuteText = "0"] = time.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return time;
  }

  const parsed = new Date();
  parsed.setHours(hour, minute, 0, 0);

  return parsed.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildPickerDateFromAppointment(date: string, time: string) {
  const fallback = new Date();
  fallback.setSeconds(0, 0);

  if (!date) {
    return fallback;
  }

  const isoTime = time && time.includes(":") ? `${time}:00` : "12:00:00";
  const parsed = new Date(`${date}T${isoTime}`);

  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function formatTimeForStorage(date: Date) {
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}

function createDoseTimeDraft(time = "09:00", dose = "") {
  return {
    time,
    dose,
  };
}

function buildMedicationPickerDate(time: string) {
  return buildPickerDateFromAppointment(getTodayDateString(), time);
}

function getNotePreview(note: string, maxLength = 110) {
  const trimmed = note.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}

function formatTakenTime(isoDate: string) {
  return new Date(isoDate).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMedicationTakenSummary(takenCount: number, totalCount: number) {
  if (totalCount === 0) {
    return "No medications scheduled today.";
  }

  return `${takenCount} of ${totalCount} taken today`;
}

function analyzeFood(foodName: string) {
  const normalized = foodName.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const match = FOOD_ANALYSIS_LIBRARY.find((item) =>
    item.terms.some((term) => normalized.includes(term) || term.includes(normalized)),
  );

  return match ?? {
    ...DEFAULT_FOOD_ANALYSIS,
    name: foodName.trim(),
  };
}

function getMealPlanGoalLine(goal: string) {
  switch (goal) {
    case "Stable energy":
      return "Prioritize protein, fiber, and slower-digesting carbohydrates.";
    case "Lower inflammation":
      return "Emphasize colorful plants, beans, fish or plant proteins, olive oil, nuts, and seeds.";
    case "Low-energy meals":
      return "Use repeatable meals, freezer staples, and low-cleanup options.";
    case "Better recovery":
      return "Make hydration, protein, and a lower-stimulation evening easier to protect.";
    case "Weight management":
      return "Focus on filling meals with protein, fiber, and realistic portions without restriction.";
    case "Brain fog support":
      return "Keep meals simple and steady, with easy protein and fewer sugar spikes.";
    case "General wellness":
      return "Use flexible meals that are realistic, filling, and easy to repeat.";
    default:
      return "Keep meals simple, supportive, and realistic for the day.";
  }
}

function parseFoodList(value: string) {
  return value
    .split(/[,.\n]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function chooseDietStyle(goal: string, selectedStyle: string, filters: string[], prepPreference: string) {
  if (selectedStyle && selectedStyle !== "Recommend one for me" && selectedStyle !== "Unsure — recommend one for me") {
    return selectedStyle;
  }

  if (
    prepPreference === "No-cook options" ||
    prepPreference === "Minimal cooking" ||
    filters.includes("Low-prep") ||
    filters.includes("No-cook options") ||
    goal === "Low-energy meals"
  ) {
    return "Low-prep / fatigue-friendly";
  }

  if (filters.includes("Vegetarian") || goal === "Lower inflammation") {
    return "Plant-forward";
  }

  if (filters.includes("High-protein") || goal === "Stable energy" || goal === "Weight management") {
    return "Higher-protein balanced";
  }

  return "Mediterranean-style";
}

function getDietRecommendationReasons(input: {
  goal: string;
  style: string;
  filters: string[];
  prepPreference: string;
  dislikedFoods: string;
}) {
  const reasons: string[] = [];
  const meaningfulFilters = input.filters.filter((filter) => filter !== "No preference");

  if (input.goal) {
    reasons.push(`You selected ${input.goal.toLowerCase()}, so the plan is built around that goal instead of a strict diet template.`);
  }

  if (input.style === "Mediterranean-style") {
    reasons.push("Mediterranean-style eating emphasizes vegetables, olive oil, beans, fish or plant proteins, nuts, and whole grains.");
    reasons.push("It is flexible enough to adapt around fatigue, budget, and foods you already like.");
  }

  if (input.style === "Anti-inflammatory-style") {
    reasons.push("Anti-inflammatory-style meals emphasize colorful plants, fiber, unsaturated fats, and fewer highly processed staples.");
    reasons.push("That can make meals feel more supportive for steady energy and general wellness without making food rules rigid.");
  }

  if (input.style === "Plant-forward") {
    reasons.push("Plant-forward eating emphasizes vegetables, legumes, whole grains, nuts, seeds, and fiber-rich foods.");
    reasons.push(
      input.goal === "Lower inflammation"
        ? "That fits lower inflammation because it leans on less processed, fiber-rich foods while still allowing gradual changes."
        : "This can be affordable and flexible when simple protein options are planned ahead.",
    );
  }

  if (input.style === "Higher-protein balanced") {
    reasons.push("Higher-protein balanced meals pair protein with fiber-rich foods to support steadier energy.");
    reasons.push("This can be useful when meals need to feel filling without becoming restrictive.");
  }

  if (input.style === "Low-prep / fatigue-friendly") {
    reasons.push("Low-prep meals reduce cooking, cleanup, and decision load on fatigue-heavy days.");
    reasons.push("The plan uses freezer staples, no-cook backups, and repeatable meals so eating does not depend on high energy.");
  }

  if (meaningfulFilters.length > 0) {
    reasons.push(`Your preferences are included: ${meaningfulFilters.join(", ")}.`);
  }

  if (input.dislikedFoods.trim()) {
    reasons.push("Foods you dislike are removed or treated as swap targets, not foods to force through.");
  }

  return reasons.slice(0, 5);
}

function getDietDirection(style: string) {
  switch (style) {
    case "Anti-inflammatory-style":
      return {
        title: "Anti-inflammatory-style direction",
        emphasizes: "Colorful plants, beans, fish or plant proteins, olive oil, nuts, seeds, and fewer highly processed staples.",
        watchFor: "Avoid turning it into strict food rules. Convenience still matters on fatigue days.",
      };
    case "Plant-forward":
      return {
        title: "Plant-forward direction",
        emphasizes: "Beans, lentils, tofu, vegetables, fruit, whole grains, nuts, and seeds.",
        watchFor: "Plan simple protein, B12, iron, and easy backups if you eat mostly plant-based.",
      };
    case "Higher-protein balanced":
      return {
        title: "Higher-protein balanced direction",
        emphasizes: "Protein at meals, fiber-rich carbohydrates, vegetables, fruit, and satisfying snacks.",
        watchFor: "Keep it supportive rather than restrictive; the goal is steadier energy, not perfection.",
      };
    case "Low-prep / fatigue-friendly":
      return {
        title: "Low-prep / fatigue-friendly direction",
        emphasizes: "No-cook meals, freezer staples, ready-to-eat rice or quinoa packets, pre-washed produce, and repeatable easy proteins.",
        watchFor: "Build backups for low-energy days instead of relying on cooking capacity.",
      };
    case "Mediterranean-style":
    default:
      return {
        title: "Mediterranean-style direction",
        emphasizes: "Vegetables, beans, whole grains, olive oil, fish or plant proteins, nuts, seeds, and fruit.",
        watchFor: "Keep meals realistic by using canned, frozen, and prepared ingredients when needed.",
      };
  }
}

function getProteinOptions(filters: string[], dislikedFoods: string[]) {
  const baseOptions = filters.includes("Vegetarian")
    ? ["tofu", "lentils", "beans", "eggs", "Greek yogurt", "nuts and seeds"]
    : filters.includes("Pescatarian")
      ? ["sardines", "trout", "tuna", "eggs", "tofu", "beans"]
      : ["trout", "tuna", "eggs", "chicken", "tofu", "beans", "Greek yogurt"];

  return baseOptions.filter((option) => !dislikedFoods.some((food) => option.toLowerCase().includes(food)));
}

function getSwapExplanation(dislikedFoods: string[], proteinOptions: string[]) {
  if (dislikedFoods.length === 0) {
    return "No disliked foods listed yet. Add foods you avoid to rebuild the plan around easier swaps.";
  }

  const alternatives = proteinOptions.slice(0, 5).join(", ") || "beans, tofu, eggs, chicken, or another protein you tolerate";
  return `Removed or avoided: ${dislikedFoods.join(", ")}. Use realistic alternatives such as ${alternatives}.`;
}

function buildAdaptivePlanReasons(input: {
  goal: string;
  style: string;
  filters: string[];
  prepPreference: string;
  budgetPreference: string;
  dislikedFoods: string;
}) {
  const reasons: string[] = [];
  const visibleFilters = input.filters.filter((filter) => filter !== "No preference");

  reasons.push(`This plan is built around ${input.goal.toLowerCase()} rather than a strict diet template.`);

  if (input.style === "Low-prep / fatigue-friendly") {
    reasons.push("Meals lean on repeatable low-prep options so eating still feels possible on lower-energy days.");
  } else if (input.prepPreference === "No-cook options" || input.prepPreference === "Minimal cooking") {
    reasons.push("The meals stay simple and low-cleanup because you chose lighter prep.");
  } else if (input.prepPreference === "Batch cooking" || input.prepPreference === "Freezer-friendly meals") {
    reasons.push("The plan uses repeatable ingredients so one round of prep covers more than one meal.");
  }

  if (visibleFilters.length > 0) {
    reasons.push(`Your preferences are built in: ${visibleFilters.join(", ")}.`);
  }

  if (input.budgetPreference === "Budget-friendly") {
    reasons.push("The grocery list favors repeatable staples and lower-friction convenience items.");
  }

  if (input.dislikedFoods.trim()) {
    reasons.push("Foods you dislike are swapped out instead of pushed back into the plan.");
  }

  return reasons.slice(0, 4);
}

function formatGroceryListText(title: string, groceries: Record<string, string[]>) {
  const sections = Object.entries(groceries)
    .map(([category, items]) => `${category}\n${items.map((item) => `- ${item}`).join("\n")}`)
    .join("\n\n");

  return `${title}\n\n${sections}`;
}

function buildAdaptiveMealPlan(input: {
  goal: string;
  dietStyle: string;
  filters: string[];
  dislikes: string;
  allergies: string;
  prepPreference: string;
  budgetPreference: string;
  premium: boolean;
}) {
  const days = input.premium ? 7 : 1;
  const dislikedFoods = parseFoodList(input.dislikes);
  const proteinOptions = getProteinOptions(input.filters, dislikedFoods);
  const protein = proteinOptions.length > 0 ? proteinOptions.join(", ") : "beans, tofu, eggs, or another protein you tolerate";
  const chosenStyle = chooseDietStyle(input.goal, input.dietStyle, input.filters, input.prepPreference);
  const noCook = input.prepPreference === "No-cook options" || input.filters.includes("No-cook options");
  const freezerFriendly = input.prepPreference === "Freezer-friendly meals" || input.filters.includes("Freezer-friendly");
  const batchCooking = input.prepPreference === "Batch cooking";
  const breakfast = dislikedFoods.some((food) => /yogurt|dairy/.test(food))
    ? "Overnight oats with berries, chia, nuts, and a protein option you tolerate"
    : `Overnight oats or yogurt bowl with berries, chia, and nuts${input.filters.includes("Dairy-free") ? " using dairy-free yogurt" : ""}`;
  const lunch = noCook
    ? `${proteinOptions[0] ?? "Bean"} snack plate with vegetables, whole-grain crackers, and olive oil`
    : `${proteinOptions[0] ?? "Bean"}, vegetable, and grain bowl with olive oil`;
  const dinner = freezerFriendly
    ? `Freezer-friendly rice bowl with ${proteinOptions[1] ?? proteinOptions[0] ?? "beans"} and frozen vegetables`
    : batchCooking
      ? `Batch bowl with ${proteinOptions[1] ?? proteinOptions[0] ?? "beans"}, rice or quinoa, and frozen vegetables`
      : `Simple grain bowl with ${proteinOptions[1] ?? proteinOptions[0] ?? "beans"} and frozen or pre-cut vegetables`;
  const lowEnergyAlternative = noCook
    ? "hummus or bean dip with crackers, pre-cut vegetables, fruit, and nuts"
    : freezerFriendly
      ? "freezer soup or ready-to-eat rice with frozen vegetables and an easy protein"
      : "Greek yogurt or hummus plate with fruit, nuts, and whole-grain crackers";
  const prepNote = noCook
    ? "Keep ready-to-eat proteins, washed produce, crackers, and fruit visible."
    : freezerFriendly
      ? "Use frozen vegetables, ready-to-eat rice or quinoa packets, and one freezer-friendly protein to reduce cleanup."
      : batchCooking
        ? "Cook one grain and one protein once, then use them in bowls, wraps, or soup."
        : "Prep one protein or grain once, then repeat it in different combinations.";
  const prep =
    input.prepPreference === "No-cook options"
      ? "no-cook plates, snack boxes, and ready-to-eat proteins"
      : input.prepPreference === "Freezer-friendly meals"
        ? "reheatable bowls, soups, frozen vegetables, and ready-to-eat rice or quinoa packets"
        : input.prepPreference === "Batch cooking"
          ? "one batch-cooked base that repeats in different ways"
          : input.prepPreference === "Minimal cooking"
            ? "minimal-cooking meals with little cleanup"
            : "quick meals with minimal cleanup";
  const dislikes = input.dislikes.trim();
  const allergies = input.allergies.trim();
  const fitReasons = buildAdaptivePlanReasons({
    goal: input.goal,
    style: chosenStyle,
    filters: input.filters,
    prepPreference: input.prepPreference,
    budgetPreference: input.budgetPreference,
    dislikedFoods: input.dislikes,
  });

  return {
    title: input.premium ? `${days}-day adaptive meal plan` : "1-day simple meal plan",
    dietStyle: chosenStyle,
    focus: getMealPlanGoalLine(input.goal),
    fitReasons,
    plan: Array.from({ length: days }, (_, index) => {
      const day = index + 1;
      return {
        day: `Day ${day}`,
        meals: [
          {
            type: "Breakfast",
            title: breakfast,
            prep: noCook
              ? "Assemble the bowl or plate using ready-to-eat ingredients."
              : "Mix oats, milk or yogurt, berries, chia, and nuts in a container. Refrigerate overnight or eat right away.",
            prepTime: "5 minutes",
            lowEnergyOption: "Use pre-made overnight oats, a yogurt cup, or fruit with nuts.",
          },
          {
            type: "Lunch",
            title: lunch,
            prep: noCook
              ? "Place the protein, crackers, vegetables, and olive oil or dip on one plate."
              : "Use ready-to-eat rice or quinoa packets, add protein, add vegetables, then finish with olive oil or dressing.",
            prepTime: noCook ? "5 minutes" : "10 minutes",
            lowEnergyOption: "Use a salad kit, canned beans or tuna, and crackers.",
          },
          {
            type: "Dinner",
            title: dinner,
            prep: freezerFriendly
              ? "Microwave rice and frozen vegetables, warm the protein, then add olive oil or a simple sauce."
              : batchCooking
                ? "Reheat the batch-cooked grain and protein, then add frozen vegetables or pre-washed greens."
                : "Use ready-to-eat rice or quinoa packets, warm the protein, and add frozen or pre-cut vegetables.",
            prepTime: freezerFriendly || batchCooking ? "10 minutes" : "10–15 minutes",
            lowEnergyOption: lowEnergyAlternative,
          },
          {
            type: "Snack",
            title: "Fruit with nuts, hummus with crackers, or a higher-fiber protein option",
            prep: "Keep one protein-or-fiber snack visible so it is easier to choose when energy is low.",
            prepTime: "2 minutes",
            lowEnergyOption: "Use single-serve nuts, hummus cups, fruit, or a ready-to-drink protein option.",
          },
        ],
      };
    }),
    swaps: [
      dislikes
        ? `Protein swap: if ${dislikes} is not workable, use another easy protein such as ${protein}.`
        : `Protein swap: rotate between the easiest options for this week, such as ${protein}.`,
      allergies
        ? `Safety swap: avoid ${allergies} and substitute a safe option you already tolerate.`
        : "Low-energy swap: keep one backup meal ready for days when cooking is not realistic.",
      `Preference swap: ${getSwapExplanation(dislikedFoods, proteinOptions)}`,
      `Prep swap: this plan leans on ${prep}.`,
      ...(input.premium
        ? [
            "Advanced swap: if dinner feels too demanding, use the low-energy option listed for that meal and keep the rest of the day simpler.",
          ]
        : []),
    ],
    groceries: {
      Produce: ["greens", "berries", "pre-cut vegetables", "lemons", "fruit"],
      Protein: protein.split(", ").slice(0, 5),
      Pantry: ["oats", "rice or quinoa", "beans", "olive oil", "nuts or seeds"],
      Frozen: ["frozen vegetables", "frozen fruit", "freezer-friendly protein"],
      Snacks: ["hummus", "crackers", "nut packs", "higher-fiber bars"],
    },
    budget: input.budgetPreference,
  };
}

function CareSectionPlaceholder({ lines = 3 }: { lines?: number }) {
  return (
    <View style={styles.placeholderStack}>
      {Array.from({ length: lines }, (_, index) => (
        <CalmSkeleton
          key={`care-placeholder-${index}`}
          height={index === 0 ? 18 : 14}
          width={index === 0 ? "58%" : index === lines - 1 ? "70%" : "92%"}
        />
      ))}
    </View>
  );
}

export function NutritionScreenContent() {
  const { user } = useAuth();
  const premium = usePremium();
  const growth = useGrowthState();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [selectedNutritionFilters, setSelectedNutritionFilters] = useState<string[]>([]);
  const [nutritionMessage, setNutritionMessage] = useState<string | null>(null);
  const [foodSearchInput, setFoodSearchInput] = useState("");
  const [foodAnalysis, setFoodAnalysis] = useState<ReturnType<typeof analyzeFood>>(null);
  const [showEasierAlternatives, setShowEasierAlternatives] = useState(false);
  const [mealPlanGoal, setMealPlanGoal] = useState<string>("Stable energy");
  const [dietStyle, setDietStyle] = useState<string>("Recommend one for me");
  const [mealPlanDislikes, setMealPlanDislikes] = useState("");
  const [mealPlanAllergies, setMealPlanAllergies] = useState("");
  const [mealPlanPrep, setMealPlanPrep] = useState<string>("Quick meals");
  const [mealPlanBudget, setMealPlanBudget] = useState<string>("Budget-friendly");
  const [adaptiveMealPlan, setAdaptiveMealPlan] = useState<ReturnType<typeof buildAdaptiveMealPlan> | null>(null);
  const [savedMealPlans, setSavedMealPlans] = useState<SavedNutritionMeal[]>([]);
  const [mealPlanStatus, setMealPlanStatus] = useState<"idle" | "generating">("idle");
  const [mealPlanError, setMealPlanError] = useState<string | null>(null);
  const [foodAnalysisUsageCount, setFoodAnalysisUsageCount] = useState(0);
  const [foodAnalysisStatus, setFoodAnalysisStatus] = useState<"idle" | "analyzing">("idle");
  const [foodAnalysisMessage, setFoodAnalysisMessage] = useState<string | null>(null);
  const [pendingFoodImageUri, setPendingFoodImageUri] = useState<string | null>(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [showNutritionPlanner, setShowNutritionPlanner] = useState(false);
  const [expandedMealPlanDays, setExpandedMealPlanDays] = useState<string[]>(["Day 1"]);
  const [showAllMealPlanDays, setShowAllMealPlanDays] = useState(false);
  const [mealPlanSectionY, setMealPlanSectionY] = useState(0);
  const [groceryCopyFeedbackVisible, setGroceryCopyFeedbackVisible] = useState(false);

  const resetNutritionState = useCallback(() => {
    setMealPlanGoal("Stable energy");
    setDietStyle("Recommend one for me");
    setMealPlanDislikes("");
    setMealPlanAllergies("");
    setSelectedNutritionFilters([]);
    setMealPlanPrep("Quick meals");
    setMealPlanBudget("Budget-friendly");
    setAdaptiveMealPlan(null);
  }, []);

  const recommendedDietStyle = useMemo(
    () => chooseDietStyle(mealPlanGoal, dietStyle, selectedNutritionFilters, mealPlanPrep),
    [dietStyle, mealPlanGoal, mealPlanPrep, selectedNutritionFilters],
  );
  const recommendedDietDirection = useMemo(
    () => getDietDirection(recommendedDietStyle),
    [recommendedDietStyle],
  );
  const recommendationReasons = useMemo(
    () =>
      getDietRecommendationReasons({
        goal: mealPlanGoal,
        style: recommendedDietStyle,
        filters: selectedNutritionFilters,
        prepPreference: mealPlanPrep,
        dislikedFoods: mealPlanDislikes,
      }),
    [mealPlanDislikes, mealPlanGoal, mealPlanPrep, recommendedDietStyle, selectedNutritionFilters],
  );

  useEffect(() => {
    let cancelled = false;

    if (!user?.id) {
      return;
    }

    void (async () => {
      try {
        const preferences = await loadNutritionPreferences(user.id);
        const savedPlans = await loadSavedNutritionMeals(user.id);
        if (__DEV__) {
          console.log("[nutrition] load state", {
            userId: user.id,
            savedNutritionPreferences: preferences,
            savedMealPlanShape: summarizeNutritionMealPlanShape(preferences?.currentMealPlan ?? null),
            savedPlansCount: savedPlans.length,
            selectedDietStyle: preferences?.dietStyle ?? null,
            dislikedFoods: preferences?.dislikedFoods ?? "",
            dietaryPreferences: preferences?.dietaryFilters ?? [],
          });
        }

        if (!cancelled) {
          resetNutritionState();
          if (preferences) {
            const normalizedPreferences = normalizeNutritionState(preferences);
            if (normalizedPreferences) {
              setMealPlanGoal(normalizedPreferences.goal);
              setDietStyle(normalizedPreferences.dietStyle);
              setMealPlanDislikes(normalizedPreferences.dislikedFoods);
              setSelectedNutritionFilters(normalizedPreferences.dietaryFilters);
              setMealPlanPrep(normalizedPreferences.prepPreference);
              setMealPlanBudget(normalizedPreferences.budgetPreference);
              setAdaptiveMealPlan(normalizedPreferences.currentMealPlan as ReturnType<typeof buildAdaptiveMealPlan> | null);
              setShowNutritionPlanner(!(normalizedPreferences.currentMealPlan as ReturnType<typeof buildAdaptiveMealPlan> | null));
              const firstDay = (normalizedPreferences.currentMealPlan as ReturnType<typeof buildAdaptiveMealPlan> | null)?.plan?.[0]?.day ?? "Day 1";
              setExpandedMealPlanDays([firstDay]);
              setShowAllMealPlanDays(false);
            }
          }
          if (!preferences || !normalizeNutritionState(preferences)?.currentMealPlan) {
            setShowNutritionPlanner(true);
            setExpandedMealPlanDays(["Day 1"]);
            setShowAllMealPlanDays(false);
          }
          setSavedMealPlans(savedPlans);
          setPreferencesLoaded(true);
        }
      } catch (error) {
        console.error("[nutrition] load failed", {
          userId: user.id,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });

        if (!cancelled) {
          resetNutritionState();
          setSavedMealPlans([]);
          setShowNutritionPlanner(true);
          setExpandedMealPlanDays(["Day 1"]);
          setShowAllMealPlanDays(false);
          setNutritionMessage("Nutrition preferences were reset to keep things working smoothly.");
          setPreferencesLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resetNutritionState, user?.id]);

  useEffect(() => {
    let cancelled = false;

    if (!user?.id) {
      setFoodAnalysisUsageCount(0);
      return;
    }

    void loadFoodAnalysisUsage(user.id, getTodayDateString()).then((count) => {
      if (!cancelled) {
        setFoodAnalysisUsageCount(count);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const persistNutritionPreferences = useCallback(async (mealPlan: ReturnType<typeof buildAdaptiveMealPlan> | null = adaptiveMealPlan) => {
    if (!user?.id) {
      return;
    }

    const preferences: Omit<NutritionPreferences, "updatedAt"> = {
      goal: mealPlanGoal,
      dietStyle,
      dislikedFoods: mealPlanDislikes,
      dietaryFilters: selectedNutritionFilters,
      prepPreference: mealPlanPrep,
      budgetPreference: mealPlanBudget,
      currentMealPlan: mealPlan,
    };

    await saveNutritionPreferences(user.id, preferences);
  }, [
    adaptiveMealPlan,
    dietStyle,
    mealPlanBudget,
    mealPlanDislikes,
    mealPlanGoal,
    mealPlanPrep,
    selectedNutritionFilters,
    user?.id,
  ]);

  useEffect(() => {
    if (!user?.id || !preferencesLoaded) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void persistNutritionPreferences();
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [
    adaptiveMealPlan,
    dietStyle,
    mealPlanBudget,
    mealPlanDislikes,
    mealPlanGoal,
    mealPlanPrep,
    persistNutritionPreferences,
    preferencesLoaded,
    selectedNutritionFilters,
    user?.id,
  ]);

  const toggleNutritionFilter = (filter: string) => {
    if (filter === "No preference") {
      setSelectedNutritionFilters((current) => (current.includes("No preference") ? [] : ["No preference"]));
      return;
    }

    setSelectedNutritionFilters((current) =>
      current.includes(filter)
        ? current.filter((item) => item !== filter)
        : [...current.filter((item) => item !== "No preference"), filter],
    );
  };

  const handleShareGroceryList = async (plan: (typeof PREMIUM_MEAL_PLANS)[number]) => {
    try {
      await Share.share({
        title: `${plan.title} grocery list`,
        message: formatGroceryListText(`${plan.title} grocery list`, plan.groceries),
      });
    } catch {
      setNutritionMessage("Grocery list could not be shared right now.");
    }
  };

  const handleCopyGroceryList = (title: string, groceries: Record<string, string[]>) => {
    try {
      Clipboard.setString(formatGroceryListText(title, groceries));
      setNutritionMessage("Grocery list copied.");
      setGroceryCopyFeedbackVisible(true);
      setTimeout(() => {
        setGroceryCopyFeedbackVisible(false);
      }, 2000);
    } catch {
      setGroceryCopyFeedbackVisible(false);
      setNutritionMessage("Grocery list could not be copied right now.");
    }
  };

  const getMealPlanSaveId = useCallback((plan: ReturnType<typeof buildAdaptiveMealPlan> | null, goal: string) => {
    if (!plan) {
      return null;
    }

    return `${plan.dietStyle}-${plan.plan.length}-day-${goal}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  }, []);

  const scrollToMealPlan = useCallback((message?: string) => {
    InteractionManager.runAfterInteractions(() => {
      scrollViewRef.current?.scrollTo({ y: Math.max(mealPlanSectionY - 24, 0), animated: true });
      if (message) {
        setNutritionMessage(message);
      }
    });
  }, [mealPlanSectionY]);

  const handleSaveCurrentMealPlan = useCallback(async () => {
    if (!user?.id || !adaptiveMealPlan || !premium.hasPremiumAccess) {
      return;
    }

    try {
      const mealPlanId = getMealPlanSaveId(adaptiveMealPlan, mealPlanGoal);
      const nextSavedPlans = await saveNutritionMeal(user.id, {
        id: mealPlanId ?? `${Date.now()}`,
        title: adaptiveMealPlan.title,
        category: adaptiveMealPlan.dietStyle,
        goal: mealPlanGoal,
        dietStyle: adaptiveMealPlan.dietStyle,
        plan: adaptiveMealPlan,
      });
      setSavedMealPlans(nextSavedPlans);
      setNutritionMessage("Meal plan saved.");
    } catch {
      setNutritionMessage("Meal plan could not be saved right now.");
    }
  }, [adaptiveMealPlan, getMealPlanSaveId, mealPlanGoal, premium.hasPremiumAccess, user?.id]);

  const handleLoadSavedMealPlan = (savedPlan: SavedNutritionMeal) => {
    const nextPlan = savedPlan.plan as ReturnType<typeof buildAdaptiveMealPlan> | null;
    if (!nextPlan) {
      setNutritionMessage("Saved plan could not be opened right now.");
      return;
    }

    const firstDay = nextPlan.plan[0]?.day ?? "Day 1";
    setAdaptiveMealPlan(nextPlan);
    setMealPlanGoal(savedPlan.goal ?? mealPlanGoal);
    setDietStyle(savedPlan.dietStyle ?? nextPlan.dietStyle);
    setShowNutritionPlanner(false);
    setExpandedMealPlanDays([firstDay]);
    setShowAllMealPlanDays(false);
    scrollToMealPlan("Meal plan opened.");
  };

  const handleRemoveSavedMealPlan = async (savedPlanId: string) => {
    if (!user?.id) {
      return;
    }

    try {
      const nextSavedPlans = await removeSavedNutritionMeal(user.id, savedPlanId);
      setSavedMealPlans(nextSavedPlans);
      setNutritionMessage("Saved meal plan removed.");
    } catch {
      setNutritionMessage("Saved meal plan could not be removed right now.");
    }
  };

  const canUseFoodAnalysis = premium.hasPremiumAccess || foodAnalysisUsageCount < FREE_FOOD_ANALYSIS_LIMIT;
  const foodAnalysisUsageLabel = premium.hasPremiumAccess
    ? "Premium includes unlimited food analysis."
    : `${Math.max(FREE_FOOD_ANALYSIS_LIMIT - foodAnalysisUsageCount, 0)} free analyses left today.`;

  const handleFoodAnalysis = async (value?: string, source: "search" | "photo" | "barcode" = "search") => {
    if (!canUseFoodAnalysis) {
      setFoodAnalysisMessage("Premium includes unlimited food analysis and meal updates.");
      router.push("/premium?source=nutrition-food-analysis");
      return;
    }

    const nextValue = value ?? foodSearchInput;
    const nextAnalysis = analyzeFood(nextValue);

    if (!nextAnalysis) {
      setFoodAnalysisMessage("Enter a food to analyze.");
      return;
    }

    setFoodAnalysisStatus("analyzing");
    setFoodAnalysisMessage(source === "photo" ? "Analyzing photo..." : source === "barcode" ? "Checking packaged food..." : "Analyzing food...");

    try {
      await new Promise((resolve) => setTimeout(resolve, 250));
      setFoodSearchInput(nextAnalysis.name);
      setFoodAnalysis(nextAnalysis);
      setPendingFoodImageUri(null);
      if (user?.id && !premium.hasPremiumAccess) {
        const nextCount = await incrementFoodAnalysisUsage(user.id, getTodayDateString());
        setFoodAnalysisUsageCount(nextCount);
      }
      setNutritionMessage(null);
      setFoodAnalysisMessage(source === "photo" ? "Photo analysis ready ✓" : "Food analysis ready ✓");
    } catch {
      setFoodAnalysisMessage("Food analysis could not be completed. Please try again.");
    } finally {
      setFoodAnalysisStatus("idle");
    }
  };

  const handlePhotoFoodAnalysis = async () => {
    if (!canUseFoodAnalysis) {
      setFoodAnalysisMessage("Premium includes unlimited food analysis and meal updates.");
      router.push("/premium?source=nutrition-food-analysis");
      return;
    }

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setFoodAnalysisMessage("Camera permission is needed to take a food photo. You can use manual search here.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
      });

      if (result.canceled) {
        return;
      }

      const uri = result.assets?.[0]?.uri;
      if (!uri) {
        setFoodAnalysisMessage("Camera scanning works on a real iPhone build. You can use manual search here.");
        return;
      }

      setPendingFoodImageUri(uri);
      setFoodAnalysisMessage("We found the photo. What food should we analyze?");
      setFoodSearchInput("");
    } catch {
      setFoodAnalysisMessage("Camera scanning works on a real iPhone build. You can use manual search here.");
    }
  };

  const handleUploadFoodPhoto = async () => {
    if (!canUseFoodAnalysis) {
      setFoodAnalysisMessage("Premium includes unlimited food analysis and meal updates.");
      router.push("/premium?source=nutrition-food-analysis");
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setFoodAnalysisMessage("Photo library permission is needed to upload a food image. You can use manual search here.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
      });

      if (result.canceled) {
        return;
      }

      const uri = result.assets?.[0]?.uri;
      if (!uri) {
        setFoodAnalysisMessage("Photo upload works on a real iPhone build. You can use manual search here.");
        return;
      }

      setPendingFoodImageUri(uri);
      setFoodAnalysisMessage("We found the photo. What food should we analyze?");
      setFoodSearchInput("");
    } catch {
      setFoodAnalysisMessage("Photo upload works on a real iPhone build. You can use manual search here.");
    }
  };

  const handleGenerateAdaptiveMealPlan = async () => {
    if (!mealPlanGoal || !dietStyle) {
      setMealPlanError("Choose your goal and eating style first.");
      return;
    }

    if (!premium.hasPremiumAccess && adaptiveMealPlan) {
      setMealPlanError("Premium includes unlimited food analysis and meal updates.");
      router.push("/premium?source=nutrition-meal-updates");
      return;
    }

    setMealPlanStatus("generating");
    setMealPlanError(null);
    setNutritionMessage(adaptiveMealPlan ? "Updating meal plan..." : "Generating meal plan...");

    try {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const plan = buildAdaptiveMealPlan({
        goal: mealPlanGoal,
        dietStyle,
        filters: selectedNutritionFilters,
        dislikes: mealPlanDislikes,
        allergies: mealPlanAllergies,
        prepPreference: mealPlanPrep,
        budgetPreference: mealPlanBudget,
        premium: premium.hasPremiumAccess,
      });
      setAdaptiveMealPlan(plan);
      setShowNutritionPlanner(false);
      setExpandedMealPlanDays(plan.plan[0] ? [plan.plan[0].day] : ["Day 1"]);
      setShowAllMealPlanDays(false);
      await persistNutritionPreferences(plan);
      await growth.recordEvent("nutrition_meal_plan_generated", {
        premium: premium.hasPremiumAccess,
        days: plan.plan.length,
      });
      setNutritionMessage(adaptiveMealPlan ? "Meal plan updated ✓" : premium.hasPremiumAccess ? "Meal plan generated." : "1-day meal plan generated.");
    } catch {
      setMealPlanError("Meal plan could not be generated. Please try again.");
      setNutritionMessage(null);
    } finally {
      setMealPlanStatus("idle");
    }
  };

  const handleTryAnotherDietStyle = () => {
    const switchable = DIET_STYLE_OPTIONS.filter((style) => style !== "Recommend one for me");
    const currentIndex = switchable.indexOf(recommendedDietStyle);
    const nextStyle = switchable[(currentIndex + 1) % switchable.length] ?? "Mediterranean-style";
    setDietStyle(nextStyle);
    setAdaptiveMealPlan(null);
    setShowNutritionPlanner(true);
    setNutritionMessage(`Trying ${nextStyle}. Generate a plan when you are ready.`);
  };

  const toggleMealPlanDay = (dayLabel: string) => {
    setExpandedMealPlanDays((current) =>
      current.includes(dayLabel) ? current.filter((item) => item !== dayLabel) : [...current, dayLabel],
    );
  };

  const handleToggleAllMealPlanDays = () => {
    if (!adaptiveMealPlan) {
      return;
    }

    if (showAllMealPlanDays) {
      setExpandedMealPlanDays([]);
      setShowAllMealPlanDays(false);
      return;
    }

    setExpandedMealPlanDays(adaptiveMealPlan.plan.map((day) => day.day));
    setShowAllMealPlanDays(true);
  };

  const handleViewCurrentPlan = () => {
    if (!adaptiveMealPlan) {
      return;
    }

    setExpandedMealPlanDays(adaptiveMealPlan.plan[0] ? [adaptiveMealPlan.plan[0].day] : []);
    setShowAllMealPlanDays(false);
    scrollToMealPlan("Showing Day 1 meals.");
  };

  useEffect(() => {
    if (!adaptiveMealPlan) {
      setShowAllMealPlanDays(false);
      return;
    }

    const allExpanded = adaptiveMealPlan.plan.every((day) => expandedMealPlanDays.includes(day.day));
    setShowAllMealPlanDays(allExpanded);
  }, [adaptiveMealPlan, expandedMealPlanDays]);

  const currentMealPlanSaved = useMemo(() => {
    const mealPlanId = getMealPlanSaveId(adaptiveMealPlan, mealPlanGoal);
    if (!mealPlanId) {
      return false;
    }

    return savedMealPlans.some((plan) => plan.id === mealPlanId);
  }, [adaptiveMealPlan, getMealPlanSaveId, mealPlanGoal, savedMealPlans]);

  const handleShareAdaptiveGroceryList = async () => {
    if (!adaptiveMealPlan) {
      return;
    }

    try {
      await Share.share({
        title: `${adaptiveMealPlan.title} grocery list`,
        message: formatGroceryListText(`${adaptiveMealPlan.title} grocery list`, adaptiveMealPlan.groceries),
      });
    } catch {
      setNutritionMessage("Grocery list could not be shared right now.");
    }
  };

  const generatedMealPlanContent = adaptiveMealPlan ? (
    <View
      style={styles.foodAnalysisCard}
      onLayout={(event) => {
        setMealPlanSectionY(event.nativeEvent.layout.y);
      }}
    >
      <View style={styles.medicationHeader}>
        <View style={styles.itemHeaderCopy}>
          <AppText style={styles.itemTitle}>{adaptiveMealPlan.title}</AppText>
          <AppText style={styles.itemMeta}>{mealPlanGoal}</AppText>
        </View>
        <AppText style={[styles.badge, premium.hasPremiumAccess ? styles.badgeActive : styles.badgeInactive]}>
          {premium.hasPremiumAccess ? "Premium" : "Simple"}
        </AppText>
      </View>
      <AppText style={styles.itemNotes}>{adaptiveMealPlan.focus}</AppText>
      <View style={styles.groceryListCard}>
        <AppText style={styles.nutritionCardTitle}>Why this plan fits you</AppText>
        {adaptiveMealPlan.fitReasons.map((reason) => (
          <AppText key={reason} style={styles.nutritionPlanLine}>• {reason}</AppText>
        ))}
      </View>
      <View style={styles.nutritionHeaderRow}>
        <AppText style={styles.sectionLabel}>7-day adaptive meal plan</AppText>
        {adaptiveMealPlan.plan.length > 1 ? (
          <Pressable
            accessibilityRole="button"
            onPress={handleToggleAllMealPlanDays}
            style={({ pressed }) => [styles.clearFiltersButton, pressed && styles.collapseRowPressed]}
          >
            <AppText style={styles.clearFiltersText}>{showAllMealPlanDays ? "Collapse all" : "Expand all"}</AppText>
          </Pressable>
        ) : null}
      </View>
      {premium.hasPremiumAccess ? (
        <View style={styles.itemActions}>
          <AppButton label="Today's meals" onPress={handleViewCurrentPlan} variant="secondary" />
        </View>
      ) : null}
      {adaptiveMealPlan.plan.map((day, index) => {
        const isExpanded = expandedMealPlanDays.includes(day.day);
        const summary = typeof day.meals[0] === "string"
          ? "Meals planned"
          : `${day.meals.map((meal) => (typeof meal === "string" ? meal : meal.type)).slice(0, 3).join(", ")} planned`;
        return (
          <View key={day.day} style={styles.groceryListCard}>
            <Pressable
              accessibilityRole="button"
              onPress={() => toggleMealPlanDay(day.day)}
              style={({ pressed }) => [styles.expandRow, pressed && styles.collapseRowPressed]}
            >
              <View style={styles.expandCopy}>
                <AppText style={styles.nutritionCardTitle}>{day.day}</AppText>
                <AppText style={styles.nutritionCardBody}>
                  {index === 0 ? "Open first by default so today's meals are easiest to find." : summary}
                </AppText>
              </View>
              <AppText style={styles.expandLabel}>{isExpanded ? "Hide" : "View"}</AppText>
            </Pressable>
            {isExpanded ? day.meals.map((meal) =>
              typeof meal === "string" ? (
                <AppText key={meal} style={styles.nutritionPlanLine}>• {meal}</AppText>
              ) : (
                <View key={`${day.day}-${meal.type}-${meal.title}`} style={styles.mealInstructionCard}>
                  <AppText style={styles.nutritionCardTitle}>{meal.type}: {meal.title}</AppText>
                  <AppText style={styles.nutritionCardBody}>
                    <AppText style={styles.nutritionDetailLabel}>Prep: </AppText>
                    {meal.prep}
                  </AppText>
                  <AppText style={styles.nutritionCardBody}>
                    <AppText style={styles.nutritionDetailLabel}>Prep time: </AppText>
                    {meal.prepTime}
                  </AppText>
                  <AppText style={styles.nutritionCardBody}>
                    <AppText style={styles.nutritionDetailLabel}>Low-energy option: </AppText>
                    {meal.lowEnergyOption}
                  </AppText>
                </View>
              ),
            ) : null}
          </View>
        );
      })}
      <View style={styles.groceryListCard}>
        <AppText style={styles.nutritionCardTitle}>Meal swaps</AppText>
        {adaptiveMealPlan.swaps.map((swap) => (
          <AppText key={swap} style={styles.nutritionPlanLine}>• {swap}</AppText>
        ))}
      </View>
      <View style={styles.groceryListCard}>
        <AppText style={styles.nutritionCardTitle}>Swap foods I don’t like</AppText>
        <AppText style={styles.nutritionCardBody}>
          Add foods to avoid, then regenerate the plan with easier alternatives.
        </AppText>
        <TextInput
          value={mealPlanDislikes}
          onChangeText={setMealPlanDislikes}
          placeholder="Example: salmon, mushrooms, yogurt"
          placeholderTextColor="#9ca3af"
          style={styles.input}
        />
        <AppButton
          label={mealPlanStatus === "generating" ? "Updating meal plan..." : "Update meal plan"}
          onPress={() => void handleGenerateAdaptiveMealPlan()}
          variant="secondary"
          disabled={mealPlanStatus === "generating"}
        />
      </View>
      {premium.hasPremiumAccess ? (
        <>
          <View style={styles.groceryListCard}>
            <AppText style={styles.nutritionCardTitle}>Grocery list</AppText>
            {Object.entries(adaptiveMealPlan.groceries).map(([category, items]) => (
              <AppText key={category} style={styles.nutritionCardBody}>
                <AppText style={styles.nutritionDetailLabel}>{category}: </AppText>
                {items.join(", ")}
              </AppText>
            ))}
          </View>
          <View style={styles.itemActions}>
            <AppButton label="Share grocery list" onPress={() => void handleShareAdaptiveGroceryList()} variant="secondary" />
            <AppButton
              label={groceryCopyFeedbackVisible ? "✓ Copied" : "Copy grocery list"}
              onPress={() => handleCopyGroceryList(`${adaptiveMealPlan.title} grocery list`, adaptiveMealPlan.groceries)}
              variant="secondary"
            />
            <AppButton
              label={currentMealPlanSaved ? "Meal plan saved ✓" : "Save this meal plan"}
              onPress={() => void handleSaveCurrentMealPlan()}
              variant="secondary"
              disabled={currentMealPlanSaved}
            />
          </View>
          <AppText style={styles.emptyHint}>
            {currentMealPlanSaved ? "Saved plans appear below." : "Save this meal plan to reopen it later from Saved Plans below."}
          </AppText>
        </>
      ) : (
        <View style={styles.nutritionUpgradeCard}>
          <AppText style={styles.nutritionCardBody}>
            Premium adds unlimited meal plans, unlimited food analysis, grocery lists, saved plans, and advanced swaps.
          </AppText>
          <AppButton label="View Premium" onPress={() => router.push("/premium?source=nutrition-meal-plan")} variant="secondary" />
        </View>
      )}
    </View>
  ) : null;

  return (
    <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={[styles.card, styles.heroCard]}>
        <View style={styles.formHeaderCopy}>
          <AppText style={styles.title}>Nutrition Support</AppText>
          <AppText style={styles.body}>Plan meals, check foods, and find simple nutrition ideas that support your day.</AppText>
          <AppText style={styles.nutritionDisclaimer}>
            Nutrition information may support organization and daily planning, but it does not replace medical advice.
          </AppText>
        </View>

        <View style={styles.foodAnalysisCard}>
          <View style={styles.medicationHeader}>
            <View style={styles.itemHeaderCopy}>
              <AppText style={styles.itemTitle}>Is this inflammatory?</AppText>
              <AppText style={styles.itemMeta}>Food check</AppText>
            </View>
            <AppText style={[styles.badge, styles.nutritionBadge]}>Useful tool</AppText>
          </View>
          <AppText style={styles.body}>
            This can help you understand whether a food may be inflammatory. It does not replace medical advice.
          </AppText>
          <View style={styles.scannerModeRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => void handlePhotoFoodAnalysis()}
              style={({ pressed }) => [styles.scannerModePill, pressed && styles.collapseRowPressed]}
            >
              <AppText style={styles.scannerModePillText}>Take food photo</AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => void handleUploadFoodPhoto()}
              style={({ pressed }) => [styles.scannerModePill, pressed && styles.collapseRowPressed]}
            >
              <AppText style={styles.scannerModePillText}>Upload photo</AppText>
            </Pressable>
            <View style={[styles.scannerModePill, styles.scannerModePillActive]}>
              <AppText style={[styles.scannerModePillText, styles.scannerModePillTextActive]}>Search manually</AppText>
            </View>
          </View>
          {pendingFoodImageUri ? (
            <View style={styles.nutritionUpgradeCard}>
              <AppText style={styles.nutritionCardBody}>
                Image selected. Visual AI analysis is not available yet, so confirm the food name below to analyze it.
              </AppText>
            </View>
          ) : null}
          <AppText style={styles.emptyHint}>{foodAnalysisUsageLabel}</AppText>
          <View style={styles.fieldGroup}>
            <AppText style={styles.fieldLabel}>Food or product</AppText>
            <TextInput
              value={foodSearchInput}
              onChangeText={setFoodSearchInput}
              placeholder="Try chips, frozen pizza, protein bar..."
              placeholderTextColor="#9ca3af"
              style={styles.input}
              returnKeyType="search"
              onSubmitEditing={() => void handleFoodAnalysis()}
            />
          </View>
          <View style={styles.frequencyOptions}>
            {FOOD_SEARCH_SUGGESTIONS.map((suggestion) => (
              <Pressable
                key={suggestion}
                onPress={() => void handleFoodAnalysis(suggestion)}
                style={({ pressed }) => [styles.frequencyChip, pressed && styles.frequencyChipPressed]}
              >
                <AppText style={styles.frequencyChipText}>{suggestion}</AppText>
              </Pressable>
            ))}
          </View>
          <AppButton
            label={foodAnalysisStatus === "analyzing" ? "Checking a food..." : "Check a food"}
            onPress={() => void handleFoodAnalysis()}
            variant="secondary"
            disabled={foodAnalysisStatus === "analyzing"}
          />
          {foodAnalysisMessage ? (
            <AppText
              style={
                foodAnalysisMessage.includes("could not") ||
                foodAnalysisMessage.includes("Premium") ||
                foodAnalysisMessage.includes("needs camera")
                  ? styles.errorText
                  : styles.successText
              }
            >
              {foodAnalysisMessage}
            </AppText>
          ) : null}
        </View>

        {foodAnalysis ? (
          <View style={styles.foodAnalysisCard}>
            <View style={styles.medicationHeader}>
              <View style={styles.itemHeaderCopy}>
                <AppText style={styles.itemTitle}>{foodAnalysis.name}</AppText>
                <AppText style={styles.itemMeta}>Food check result</AppText>
              </View>
              <AppText style={[styles.badge, styles.nutritionBadge]}>Educational</AppText>
            </View>
            <View style={styles.analysisMetricGrid}>
              {[
                ["Processing level", foodAnalysis.processing],
                ["Likely inflammation impact", foodAnalysis.inflammation],
                ["Energy stability", foodAnalysis.energy],
                ["Sugar/protein/fiber balance", foodAnalysis.balance],
              ].map(([title, body]) => (
                <View key={title} style={styles.analysisMetricCard}>
                  <AppText style={styles.nutritionCardTitle}>{title}</AppText>
                  <AppText style={styles.nutritionCardBody}>{body}</AppText>
                </View>
              ))}
            </View>
            <AppText style={styles.itemNotes}>{foodAnalysis.guidance}</AppText>
            <View style={styles.nutritionHeaderRow}>
              <AppText style={styles.sectionLabel}>Better alternatives</AppText>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowEasierAlternatives((current) => !current)}
                style={({ pressed }) => [styles.clearFiltersButton, pressed && styles.collapseRowPressed]}
              >
                <AppText style={styles.clearFiltersText}>{showEasierAlternatives ? "All options" : "Show easier"}</AppText>
              </Pressable>
            </View>
            <View style={styles.list}>
              {(showEasierAlternatives ? foodAnalysis.easyAlternatives : foodAnalysis.alternatives)
                .slice(0, premium.hasPremiumAccess ? undefined : 3)
                .map((alternative) => (
                  <View key={alternative} style={styles.alternativeRow}>
                    <AppText style={styles.alternativeBullet}>•</AppText>
                    <AppText style={styles.alternativeText}>{alternative}</AppText>
                  </View>
                ))}
            </View>
          </View>
        ) : null}

        {adaptiveMealPlan ? (
          <View style={styles.foodAnalysisCard}>
            <View style={styles.medicationHeader}>
              <View style={styles.itemHeaderCopy}>
                <AppText style={styles.itemTitle}>Current plan</AppText>
                <AppText style={styles.itemMeta}>Saved in this device</AppText>
              </View>
              <AppText style={[styles.badge, premium.hasPremiumAccess ? styles.badgeActive : styles.badgeInactive]}>
                {premium.hasPremiumAccess ? "Premium" : "Simple"}
              </AppText>
            </View>
            <AppText style={styles.nutritionCardBody}>You selected: {adaptiveMealPlan.dietStyle}</AppText>
            <AppText style={styles.nutritionCardBody}>
              Based on: {mealPlanGoal}, {mealPlanPrep.toLowerCase()}, {selectedNutritionFilters.filter((item) => item !== "No preference").join(", ") || "no extra filters"}.
            </AppText>
            <View style={styles.itemActions}>
              <AppButton label="View plan" onPress={handleViewCurrentPlan} variant="secondary" />
              <AppButton label="Change diet" onPress={() => setShowNutritionPlanner((current) => !current)} variant="secondary" />
            </View>
          </View>
        ) : null}

        {(!adaptiveMealPlan || showNutritionPlanner) ? (
          <View style={styles.nutritionPlannerCard}>
            <AppText style={styles.sectionLabel}>{adaptiveMealPlan ? "Change nutrition plan" : "Nutrition planner"}</AppText>
          <View style={styles.nutritionStep}>
            <AppText style={styles.nutritionStepTitle}>1. What would you like nutrition support with?</AppText>
            <View style={styles.frequencyOptions}>
              {MEAL_PLAN_GOALS.map((goal) => {
                const isSelected = mealPlanGoal === goal;
                return (
                  <Pressable
                    key={goal}
                    onPress={() => setMealPlanGoal(goal)}
                    style={({ pressed }) => [
                      styles.frequencyChip,
                      isSelected && styles.frequencyChipSelected,
                      pressed && styles.frequencyChipPressed,
                    ]}
                  >
                    <AppText style={[styles.frequencyChipText, isSelected && styles.frequencyChipTextSelected]}>{goal}</AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.nutritionStep}>
            <AppText style={styles.nutritionStepTitle}>2. What eating style sounds best?</AppText>
            <View style={styles.frequencyOptions}>
              {DIET_STYLE_OPTIONS.map((style) => {
                const isSelected = dietStyle === style;
                return (
                  <Pressable
                    key={style}
                    onPress={() => setDietStyle(style)}
                    style={({ pressed }) => [
                      styles.frequencyChip,
                      isSelected && styles.frequencyChipSelected,
                      pressed && styles.frequencyChipPressed,
                    ]}
                  >
                    <AppText style={[styles.frequencyChipText, isSelected && styles.frequencyChipTextSelected]}>{style}</AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.nutritionStep}>
            <AppText style={styles.nutritionStepTitle}>3. Any foods you avoid or dislike?</AppText>
            <TextInput
              value={mealPlanDislikes}
              onChangeText={setMealPlanDislikes}
              placeholder="Example: I don’t like salmon, mushrooms, yogurt."
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />
          </View>

          <View style={styles.nutritionStep}>
            <AppText style={styles.nutritionStepTitle}>4. Dietary preferences</AppText>
            <View style={styles.frequencyOptions}>
              {NUTRITION_FILTERS.map((filter) => {
                const isSelected = selectedNutritionFilters.includes(filter);
                return (
                  <Pressable
                    key={filter}
                    onPress={() => toggleNutritionFilter(filter)}
                    style={({ pressed }) => [
                      styles.frequencyChip,
                      isSelected && styles.frequencyChipSelected,
                      pressed && styles.frequencyChipPressed,
                    ]}
                  >
                    <AppText style={[styles.frequencyChipText, isSelected && styles.frequencyChipTextSelected]}>{filter}</AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.nutritionStep}>
            <AppText style={styles.nutritionStepTitle}>5. Prep and budget</AppText>
            <AppText style={styles.fieldLabel}>Prep preference</AppText>
            <View style={styles.frequencyOptions}>
              {PREP_PREFERENCES.map((preference) => {
                const isSelected = mealPlanPrep === preference.label;
                return (
                  <Pressable
                    key={preference.label}
                    onPress={() => setMealPlanPrep(preference.label)}
                    style={({ pressed }) => [
                      styles.frequencyChip,
                      isSelected && styles.frequencyChipSelected,
                      pressed && styles.frequencyChipPressed,
                    ]}
                  >
                    <AppText style={[styles.frequencyChipText, isSelected && styles.frequencyChipTextSelected]}>{preference.label}</AppText>
                    <AppText style={[styles.frequencyChipHint, isSelected && styles.frequencyChipTextSelected]}>
                      {preference.description}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
            <AppText style={styles.fieldLabel}>Budget preference</AppText>
            <View style={styles.frequencyOptions}>
              {BUDGET_PREFERENCES.map((preference) => {
                const isSelected = mealPlanBudget === preference;
                return (
                  <Pressable
                    key={preference}
                    onPress={() => setMealPlanBudget(preference)}
                    style={({ pressed }) => [
                      styles.frequencyChip,
                      isSelected && styles.frequencyChipSelected,
                      pressed && styles.frequencyChipPressed,
                    ]}
                  >
                    <AppText style={[styles.frequencyChipText, isSelected && styles.frequencyChipTextSelected]}>{preference}</AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.dietRecommendationCard}>
            <AppText style={styles.nutritionCardTitle}>{recommendedDietDirection.title}</AppText>
            <AppText style={styles.nutritionCardBody}>
              Recommended style: {recommendedDietStyle}, {mealPlanPrep.toLowerCase()} meals.
            </AppText>
            <View style={styles.list}>
              <AppText style={styles.nutritionDetailLabel}>Why this may fit</AppText>
              {recommendationReasons.map((reason) => (
                <View key={reason} style={styles.alternativeRow}>
                  <AppText style={styles.alternativeBullet}>•</AppText>
                  <AppText style={styles.alternativeText}>{reason}</AppText>
                </View>
              ))}
            </View>
            <AppText style={styles.nutritionCardBody}>
              <AppText style={styles.nutritionDetailLabel}>Emphasizes: </AppText>
              {recommendedDietDirection.emphasizes}
            </AppText>
            <AppText style={styles.nutritionCardBody}>
              <AppText style={styles.nutritionDetailLabel}>Watch for: </AppText>
              {recommendedDietDirection.watchFor}
            </AppText>
          </View>

          <View style={styles.itemActions}>
            <AppButton
              label={
                mealPlanStatus === "generating"
                  ? adaptiveMealPlan
                    ? "Updating meal plan..."
                    : "Generating meal plan..."
                  : premium.hasPremiumAccess
                    ? adaptiveMealPlan
                      ? "Regenerate plan"
                      : "Build my nutrition plan"
                    : "Build my nutrition plan"
              }
              onPress={() => void handleGenerateAdaptiveMealPlan()}
              variant="secondary"
              disabled={mealPlanStatus === "generating"}
            />
            <AppButton label="Try another diet style" onPress={handleTryAnotherDietStyle} variant="secondary" />
          </View>
          {mealPlanError ? <AppText style={styles.errorText}>{mealPlanError}</AppText> : null}
          </View>
        ) : null}

        {generatedMealPlanContent}

        {premium.hasPremiumAccess ? (
          <View style={styles.nutritionSection}>
            <AppText style={styles.sectionLabel}>Saved plans</AppText>
            {savedMealPlans.length > 0 ? (
              <View style={styles.list}>
                {savedMealPlans.map((savedPlan) => (
                  <View key={savedPlan.id} style={styles.nutritionMealCard}>
                    <View style={styles.medicationHeader}>
                      <View style={styles.itemHeaderCopy}>
                        <AppText style={styles.itemTitle}>{savedPlan.title}</AppText>
                        <AppText style={styles.itemMeta}>
                          {savedPlan.goal ? `${savedPlan.goal} • ` : ""}
                          {savedPlan.dietStyle ?? savedPlan.category}
                        </AppText>
                      </View>
                      <AppText style={[styles.badge, styles.badgeActive]}>Saved</AppText>
                    </View>
                    <AppText style={styles.itemNotes}>
                      Saved {new Date(savedPlan.savedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}.
                    </AppText>
                    <View style={styles.itemActions}>
                      <AppButton label="Open plan" onPress={() => handleLoadSavedMealPlan(savedPlan)} variant="secondary" />
                      <AppButton label="Remove" onPress={() => void handleRemoveSavedMealPlan(savedPlan.id)} variant="secondary" />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.nutritionUpgradeCard}>
                <AppText style={styles.nutritionCardBody}>
                  Save a generated meal plan to revisit it later without rebuilding everything.
                </AppText>
              </View>
            )}
          </View>
        ) : null}

        {nutritionMessage ? <AppText style={styles.successText}>{nutritionMessage}</AppText> : null}
      </View>
    </ScrollView>
  );
}

export default function CareScreen() {
  const medicationNameInputRef = useRef<TextInput | null>(null);
  const { user } = useAuth();
  const appointmentsQuery = useAppointments(user?.id);
  const medicationsQuery = useMedications(user?.id);
  const careNotesQuery = useCareNotes(user?.id);
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const deleteAppointment = useDeleteAppointment();
  const createMedication = useCreateMedication();
  const updateMedication = useUpdateMedication();
  const deleteMedication = useDeleteMedication();
  const createCareNote = useCreateCareNote();
  const updateCareNote = useUpdateCareNote();
  const deleteCareNote = useDeleteCareNote();
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showMedicationForm, setShowMedicationForm] = useState(false);
  const [editingMedicationId, setEditingMedicationId] = useState<string | null>(null);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [activePicker, setActivePicker] = useState<"date" | "time" | null>(null);
  const [appointmentPickerDate, setAppointmentPickerDate] = useState(() => buildPickerDateFromAppointment("", ""));
  const [pickerDraftDate, setPickerDraftDate] = useState(() => buildPickerDateFromAppointment("", ""));
  const [provider, setProvider] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [medicationName, setMedicationName] = useState("");
  const [medicationDosage, setMedicationDosage] = useState("");
  const [medicationScheduleType, setMedicationScheduleType] = useState<MedicationScheduleType>("daily");
  const [medicationSelectedDays, setMedicationSelectedDays] = useState<MedicationDay[]>([]);
  const [medicationDoseTimes, setMedicationDoseTimes] = useState<Array<{ time: string; dose: string }>>([createDoseTimeDraft()]);
  const [activeMedicationDosePickerIndex, setActiveMedicationDosePickerIndex] = useState<number | null>(null);
  const [medicationPickerDraftDate, setMedicationPickerDraftDate] = useState(() => buildMedicationPickerDate("09:00"));
  const [medicationNotes, setMedicationNotes] = useState("");
  const [showCareNoteForm, setShowCareNoteForm] = useState(false);
  const [editingCareNoteId, setEditingCareNoteId] = useState<string | null>(null);
  const [careNoteTitle, setCareNoteTitle] = useState("");
  const [careNoteCategory, setCareNoteCategory] = useState("");
  const [careNoteBody, setCareNoteBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [medicationMessage, setMedicationMessage] = useState<string | null>(null);
  const [careNoteMessage, setCareNoteMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [medicationErrorMessage, setMedicationErrorMessage] = useState<string | null>(null);
  const [careNoteErrorMessage, setCareNoteErrorMessage] = useState<string | null>(null);
  const [medicationsTakenToday, setMedicationsTakenToday] = useState<Record<string, string>>({});
  const today = getTodayDateString();
  const isInitialLoading =
    (appointmentsQuery.isLoading && !appointmentsQuery.data) ||
    (medicationsQuery.isLoading && !medicationsQuery.data) ||
    (careNotesQuery.isLoading && !careNotesQuery.data);
  useSlowScreenDiagnostics("care", isInitialLoading);
  const appointmentsLoading = appointmentsQuery.isLoading && !appointmentsQuery.data;
  const medicationsLoading = medicationsQuery.isLoading && !medicationsQuery.data;
  const careNotesLoading = careNotesQuery.isLoading && !careNotesQuery.data;
  const [showInactiveMedications, setShowInactiveMedications] = useState(false);
  const lowEnergyMode = useLowEnergyMode();
  const careLoadWarnings = useMemo(() => {
    const warnings: string[] = [];

    if (appointmentsQuery.isError) {
      warnings.push("Appointments could not refresh right now.");
    }

    if (medicationsQuery.isError) {
      warnings.push("Medications could not refresh right now.");
    }

    if (careNotesQuery.isError) {
      warnings.push("Care notes could not refresh right now.");
    }

    return warnings;
  }, [appointmentsQuery.isError, medicationsQuery.isError, careNotesQuery.isError]);
  const careLoadWarningMessage = useMemo(() => {
    if (careLoadWarnings.length === 0) {
      return null;
    }

    return `${careLoadWarnings.join(" ")} You can still use the rest of Care.`;
  }, [careLoadWarnings]);

  useEffect(() => {
    if (!appointmentsQuery.isError) {
      return;
    }

    const friendlyMessage = getErrorMessage(appointmentsQuery.error);
    console.error("[care] load failed", appointmentsQuery.error);

    if (friendlyMessage.toLowerCase().includes("save profile")) {
      console.error("[care] profile save failed", appointmentsQuery.error);
    }
  }, [appointmentsQuery.error, appointmentsQuery.isError]);

  useEffect(() => {
    if (!medicationsQuery.isError) {
      return;
    }

    const friendlyMessage = getErrorMessage(medicationsQuery.error);
    console.error("[care] load failed", medicationsQuery.error);

    if (friendlyMessage.toLowerCase().includes("save profile")) {
      console.error("[care] profile save failed", medicationsQuery.error);
    }
  }, [medicationsQuery.error, medicationsQuery.isError]);

  useEffect(() => {
    if (!careNotesQuery.isError) {
      return;
    }

    const friendlyMessage = getErrorMessage(careNotesQuery.error);
    console.error("[care] load failed", careNotesQuery.error);

    if (friendlyMessage.toLowerCase().includes("save profile")) {
      console.error("[care] profile save failed", careNotesQuery.error);
    }
  }, [careNotesQuery.error, careNotesQuery.isError]);

  const upcomingAppointments = useMemo(() => {
    const items = (appointmentsQuery.data ?? []).filter((item) => item.appointment_date >= today);
    return sortAppointmentsByDateTime(items, true);
  }, [appointmentsQuery.data, today]);

  const pastAppointments = useMemo(() => {
    const items = (appointmentsQuery.data ?? []).filter((item) => item.appointment_date < today);
    return sortAppointmentsByDateTime(items, false);
  }, [appointmentsQuery.data, today]);

  const medications = useMemo(() => medicationsQuery.data ?? [], [medicationsQuery.data]);
  const activeMedications = useMemo(
    () => medications.filter((medication) => medication.active),
    [medications],
  );
  const inactiveMedications = useMemo(
    () => medications.filter((medication) => !medication.active),
    [medications],
  );
  const nextAppointment = upcomingAppointments[0] ?? null;
  const todayMedicationDoses = useMemo(
    () =>
      activeMedications.flatMap((medication) =>
        getMedicationDoseEntriesForDate(medication, today).map((doseEntry) => ({
          medication,
          doseEntry,
        })),
      ),
    [activeMedications, today],
  );
  const takenMedicationCount = useMemo(
    () => todayMedicationDoses.filter((entry) => medicationsTakenToday[entry.doseEntry.key]).length,
    [medicationsTakenToday, todayMedicationDoses],
  );
  const nextDueMedication = useMemo(
    () =>
      todayMedicationDoses.find((entry) => !medicationsTakenToday[entry.doseEntry.key]) ?? null,
    [medicationsTakenToday, todayMedicationDoses],
  );
  const nextDueMedicationTime = nextDueMedication?.doseEntry.label ?? null;
  const trimmedMedicationName = medicationName.trim();
  const medicationNameValidationMessage =
    medicationErrorMessage === "Please enter a medication name." ||
    medicationErrorMessage === "Medication name is required."
      ? medicationErrorMessage
      : null;

  const persistMedicationTakenToday = useCallback((medicationId: string, takenAt: string | null, scheduledTime?: string | null) => {
    if (!user?.id) {
      return;
    }

    const sync = takenAt
      ? medicationsApi.markTakenToday(user.id, medicationId, today, takenAt, scheduledTime)
      : medicationsApi.unmarkTakenToday(user.id, medicationId, today, scheduledTime);

    void sync.catch((error) => {
      logger.warn("Medication taken state could not sync.", {
        error: getErrorMessage(error),
      });
    });
  }, [today, user?.id]);

  useEffect(() => {
    return addCareNotificationResponseListener((action) => {
      if (action.type === "medication-taken") {
        setMedicationsTakenToday((current) => {
          const takenAt = new Date().toISOString();
          const takenKey = buildMedicationTakenKey(action.medicationId, action.scheduledTime);
          const next = {
            ...current,
            [takenKey]: takenAt,
          };
          persistMedicationTakenToday(action.medicationId, takenAt, action.scheduledTime);
          return next;
        });
        setMedicationMessage("Medication marked taken today.");
        return;
      }

      if (action.type === "medication-skipped") {
        setMedicationMessage("Medication reminder skipped.");
        return;
      }

      if (action.type === "medication-later") {
        setMedicationMessage("Medication reminder moved later.");
        return;
      }

      router.push("/health-summary");
    });
  }, [persistMedicationTakenToday]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      router.prefetch?.("/health-summary");
      router.prefetch?.("/nutrition");
    });

    return () => {
      task.cancel?.();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!user?.id) {
      setMedicationsTakenToday({});
      return;
    }

    void (async () => {
      try {
        const taken = await medicationsApi.listTakenToday(user.id, today);

        if (!cancelled) {
          setMedicationsTakenToday(taken);
        }
      } catch (error) {
        logger.warn("Medication taken state could not load.", {
          error: getErrorMessage(error),
        });

        if (!cancelled) {
          setMedicationsTakenToday({});
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [today, user?.id]);

  useEffect(() => {
    logger.info("Care medications state", {
      today,
      medications: medications.map((medication) => ({
        id: medication.id,
        name: medication.name,
        active: medication.active,
        frequency: medication.frequency,
        schedule_type: medication.schedule_type,
        selected_days: medication.selected_days,
        dose_times: medication.dose_times,
        reminder_time: medication.reminder_time ?? null,
      })),
      takenMedicationIds: Object.keys(medicationsTakenToday),
    });
  }, [medications, medicationsTakenToday, today]);

  const toggleMedicationTakenToday = (medicationId: string, scheduledTime?: string | null) => {
    const takenKey = buildMedicationTakenKey(medicationId, scheduledTime);
    setMedicationsTakenToday((current) => {
      if (current[takenKey]) {
        const next = { ...current };
        delete next[takenKey];
        persistMedicationTakenToday(medicationId, null, scheduledTime);
        return next;
      }

      const takenAt = new Date().toISOString();
      const next = {
        ...current,
        [takenKey]: takenAt,
      };
      persistMedicationTakenToday(medicationId, takenAt, scheduledTime);
      return next;
    });
  };

  const scheduleMedicationReminderQuietly = async (medication: Medication) => {
    if (!medication.active || medication.schedule_type === "as_needed") {
      return;
    }

    try {
      const identifiers = await scheduleMedicationReminder({
        medicationId: medication.id,
        name: medication.name,
        scheduleType: medication.schedule_type,
        doseTimes: medication.dose_times,
        selectedDays: medication.selected_days,
      });

      if (identifiers.length > 0) {
        setMedicationMessage(`Medication saved. Reminder schedule updated.`);
      }
    } catch {
      setMedicationMessage("Medication saved. Reminder setup was not available right now.");
    }
  };

  const scheduleAppointmentRemindersQuietly = async (appointment: Appointment) => {
    try {
      const identifiers = await scheduleAppointmentReminders({
        appointmentId: appointment.id,
        title: appointment.title,
        appointmentDate: appointment.appointment_date,
        appointmentTime: appointment.appointment_time,
      });

      if (identifiers.length > 0) {
        setMessage("Appointment saved. Reminders are scheduled.");
      }
    } catch {
      setMessage("Appointment saved. Reminder setup was not available right now.");
    }
  };

  const resetAppointmentForm = () => {
    setTitle("");
    setDate("");
    setTime("");
    setActivePicker(null);
    setAppointmentPickerDate(buildPickerDateFromAppointment("", ""));
    setPickerDraftDate(buildPickerDateFromAppointment("", ""));
    setProvider("");
    setLocation("");
    setNotes("");
    setEditingAppointmentId(null);
  };

  const resetMedicationForm = () => {
    setMedicationName("");
    setMedicationDosage("");
    setMedicationScheduleType("daily");
    setMedicationSelectedDays([]);
    setMedicationDoseTimes([createDoseTimeDraft()]);
    setActiveMedicationDosePickerIndex(null);
    setMedicationPickerDraftDate(buildMedicationPickerDate("09:00"));
    setMedicationNotes("");
    setEditingMedicationId(null);
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android" && event.type === "dismissed") {
      setActivePicker(null);
      return;
    }

    if (!selectedDate) {
      return;
    }

    if (Platform.OS === "android") {
      setAppointmentPickerDate(selectedDate);
      setPickerDraftDate(selectedDate);
      setDate(selectedDate.toISOString().slice(0, 10));
      setActivePicker(null);
      return;
    }

    setPickerDraftDate(selectedDate);
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android" && event.type === "dismissed") {
      setActivePicker(null);
      return;
    }

    if (!selectedDate) {
      return;
    }

    if (Platform.OS === "android") {
      setAppointmentPickerDate(selectedDate);
      setPickerDraftDate(selectedDate);
      setTime(formatTimeForStorage(selectedDate));
      setActivePicker(null);
      return;
    }

    setPickerDraftDate(selectedDate);
  };

  const openAppointmentPicker = (mode: "date" | "time") => {
    const nextDate = buildPickerDateFromAppointment(date, time);
    setAppointmentPickerDate(nextDate);
    setPickerDraftDate(nextDate);
    logger.info("Appointment picker opened", {
      mode,
      date,
      time,
    });
    setActivePicker(mode);
  };

  const closeAppointmentPicker = () => {
    logger.info("Appointment picker closed", {
      mode: activePicker,
    });
    setActivePicker(null);
  };

  const confirmAppointmentPicker = () => {
    const nextDate = pickerDraftDate;
    setAppointmentPickerDate(nextDate);

    if (activePicker === "date") {
      setDate(nextDate.toISOString().slice(0, 10));
    }

    if (activePicker === "time") {
      setTime(formatTimeForStorage(nextDate));
    }

    logger.info("Appointment picker confirmed", {
      mode: activePicker,
      nextDate: nextDate.toISOString(),
      storedDate: activePicker === "date" ? nextDate.toISOString().slice(0, 10) : date,
      storedTime: activePicker === "time" ? formatTimeForStorage(nextDate) : time,
    });
    setActivePicker(null);
  };

  const resetCareNoteForm = () => {
    setCareNoteTitle("");
    setCareNoteCategory("");
    setCareNoteBody("");
    setEditingCareNoteId(null);
  };

  const handleAppointmentSubmit = async () => {
    if (!user?.id || createAppointment.isPending || updateAppointment.isPending) {
      return;
    }

    setErrorMessage(null);
    setMessage(null);

    const input: AppointmentInput = {
      title,
      appointment_date: date,
      appointment_time: time || null,
      provider: provider || null,
      location: location || null,
      notes: notes || null,
    };

    try {
      let savedAppointment: Appointment;
      if (editingAppointmentId) {
        savedAppointment = await updateAppointment.mutateAsync({
          userId: user.id,
          appointmentId: editingAppointmentId,
          input,
        });
        setMessage("Appointment updated.");
      } else {
        savedAppointment = await createAppointment.mutateAsync({
          userId: user.id,
          input,
        });
        setMessage("Appointment saved.");
      }

      void scheduleAppointmentRemindersQuietly(savedAppointment);
      resetAppointmentForm();
      setShowAppointmentForm(false);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  const startEditingAppointment = (appointment: Appointment) => {
    setTitle(appointment.title);
    setDate(appointment.appointment_date);
    setTime(appointment.appointment_time ?? "");
    const pickerDate = buildPickerDateFromAppointment(
      appointment.appointment_date,
      appointment.appointment_time ?? "",
    );
    setActivePicker(null);
    setAppointmentPickerDate(pickerDate);
    setPickerDraftDate(pickerDate);
    setProvider(appointment.provider ?? "");
    setLocation(appointment.location ?? "");
    setNotes(appointment.notes ?? "");
    setEditingAppointmentId(appointment.id);
    setShowAppointmentForm(true);
    setErrorMessage(null);
    setMessage(null);
  };

  const confirmDeleteAppointment = (appointment: Appointment) => {
    Alert.alert(
      "Remove appointment",
      `Take "${appointment.title}" out of this care list?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void handleDeleteAppointment(appointment.id);
          },
        },
      ],
    );
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!user?.id || deleteAppointment.isPending) {
      return;
    }

    setErrorMessage(null);
    setMessage(null);

    try {
      await deleteAppointment.mutateAsync({
        userId: user.id,
        appointmentId,
      });
      await cancelCareReminders(`appointment.${appointmentId}`);

      if (editingAppointmentId === appointmentId) {
        resetAppointmentForm();
        setShowAppointmentForm(false);
      }

      setMessage("That appointment has been removed.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  const handleMedicationSubmit = async () => {
    if (!user?.id || createMedication.isPending || updateMedication.isPending) {
      return;
    }

    setMedicationErrorMessage(null);
    setMedicationMessage(null);

    if (!trimmedMedicationName) {
      setMedicationErrorMessage("Please enter a medication name.");
      medicationNameInputRef.current?.focus();
      return;
    }

    const normalizedDoseTimes = medicationDoseTimes
      .map((item) => ({
        time: item.time.trim(),
        dose: item.dose.trim() || null,
      }))
      .filter((item) => item.time.length > 0);

    if (medicationScheduleType !== "as_needed" && normalizedDoseTimes.length === 0) {
      setMedicationErrorMessage("Add at least one dose time for this medication.");
      return;
    }

    if (medicationScheduleType === "weekly" && medicationSelectedDays.length === 0) {
      setMedicationErrorMessage("Choose at least one day for this medication schedule.");
      return;
    }

    const input: MedicationInput = {
      name: trimmedMedicationName,
      dosage: medicationDosage || null,
      schedule_type: medicationScheduleType,
      selected_days: medicationSelectedDays,
      dose_times: normalizedDoseTimes,
      notes: medicationNotes || null,
      active: editingMedicationId ? medications.find((item) => item.id === editingMedicationId)?.active ?? true : true,
    };

    try {
      let savedMedication: Medication;
      if (editingMedicationId) {
        savedMedication = await updateMedication.mutateAsync({
          userId: user.id,
          medicationId: editingMedicationId,
          input,
        });
      } else {
        savedMedication = await createMedication.mutateAsync({
          userId: user.id,
          input,
        });
      }
      resetMedicationForm();
      setShowMedicationForm(false);
      setMedicationMessage(editingMedicationId ? "Medication updated." : "Medication saved.");
      void scheduleMedicationReminderQuietly(savedMedication);
    } catch (error) {
      console.error("[care] medication save failed", error);
      setMedicationErrorMessage(getErrorMessage(error));
    }
  };

  const startEditingMedication = (medication: Medication) => {
    setMedicationName(medication.name);
    setMedicationDosage(medication.dosage ?? "");
    setMedicationScheduleType(medication.schedule_type);
    setMedicationSelectedDays(medication.selected_days);
    setMedicationDoseTimes(
      medication.dose_times.length > 0
        ? medication.dose_times.map((item) => ({
            time: item.time,
            dose: item.dose ?? "",
          }))
        : medication.schedule_type === "as_needed"
          ? []
          : [createDoseTimeDraft()],
    );
    setActiveMedicationDosePickerIndex(null);
    setMedicationPickerDraftDate(buildMedicationPickerDate(medication.dose_times[0]?.time ?? "09:00"));
    setMedicationNotes(medication.notes ?? "");
    setEditingMedicationId(medication.id);
    setShowMedicationForm(true);
    setMedicationErrorMessage(null);
    setMedicationMessage(null);
  };

  const handleDeleteMedication = async (medicationId: string) => {
    if (!user?.id || deleteMedication.isPending) {
      return;
    }

    setMedicationErrorMessage(null);
    setMedicationMessage(null);

    try {
      await deleteMedication.mutateAsync({
        userId: user.id,
        medicationId,
      });
      await cancelCareReminders(`medication.${medicationId}`);

      if (editingMedicationId === medicationId) {
        resetMedicationForm();
        setShowMedicationForm(false);
      }

      setMedicationMessage("That medication has been removed.");
    } catch (error) {
      setMedicationErrorMessage(getErrorMessage(error));
    }
  };

  const confirmDeleteMedication = (medication: Medication) => {
    Alert.alert(
      "Remove medication",
      `Take "${medication.name}" out of this medication list?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void handleDeleteMedication(medication.id);
          },
        },
      ],
    );
  };

  const handleMedicationScheduleTypePress = (scheduleType: MedicationScheduleType) => {
    setMedicationScheduleType(scheduleType);

    if (scheduleType === "as_needed") {
      setMedicationDoseTimes([]);
      setMedicationSelectedDays([]);
      return;
    }

    if (scheduleType === "daily") {
      setMedicationSelectedDays([]);
    }

    if (scheduleType === "weekly" && medicationSelectedDays.length === 0) {
      setMedicationSelectedDays(["Sunday"]);
    }

    if (medicationDoseTimes.length === 0) {
      setMedicationDoseTimes([createDoseTimeDraft()]);
    }
  };

  const toggleMedicationDay = (day: MedicationDay) => {
    setMedicationSelectedDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    );
  };

  const updateMedicationDoseTime = (index: number, field: "time" | "dose", value: string) => {
    setMedicationDoseTimes((current) =>
      current.map((item, currentIndex) =>
        currentIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  const addMedicationDoseTime = () => {
    setMedicationDoseTimes((current) => [...current, createDoseTimeDraft()]);
  };

  const removeMedicationDoseTime = (index: number) => {
    setMedicationDoseTimes((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setActiveMedicationDosePickerIndex((current) => {
      if (current === null) {
        return null;
      }

      if (current === index) {
        return null;
      }

      if (current > index) {
        return current - 1;
      }

      return current;
    });
  };

  const openMedicationDosePicker = (index: number) => {
    const currentTime = medicationDoseTimes[index]?.time ?? "09:00";
    setMedicationPickerDraftDate(buildMedicationPickerDate(currentTime));
    setActiveMedicationDosePickerIndex(index);
  };

  const closeMedicationDosePicker = () => {
    setActiveMedicationDosePickerIndex(null);
  };

  const confirmMedicationDosePicker = () => {
    if (activeMedicationDosePickerIndex === null) {
      return;
    }

    updateMedicationDoseTime(activeMedicationDosePickerIndex, "time", formatTimeForStorage(medicationPickerDraftDate));
    setActiveMedicationDosePickerIndex(null);
  };

  const handleMedicationDosePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android" && event.type === "dismissed") {
      setActiveMedicationDosePickerIndex(null);
      return;
    }

    if (!selectedDate || activeMedicationDosePickerIndex === null) {
      return;
    }

    if (Platform.OS === "android") {
      updateMedicationDoseTime(activeMedicationDosePickerIndex, "time", formatTimeForStorage(selectedDate));
      setMedicationPickerDraftDate(selectedDate);
      setActiveMedicationDosePickerIndex(null);
      return;
    }

    setMedicationPickerDraftDate(selectedDate);
  };

  const handleCareNoteSave = async () => {
    if (!user?.id || createCareNote.isPending || updateCareNote.isPending) {
      return;
    }

    setCareNoteErrorMessage(null);
    setCareNoteMessage(null);

    const input: CareNoteInput = {
      title: careNoteTitle || null,
      category: careNoteCategory || null,
      body: careNoteBody,
    };

    try {
      if (editingCareNoteId) {
        await updateCareNote.mutateAsync({
          userId: user.id,
          noteId: editingCareNoteId,
          input,
        });
        setCareNoteMessage("Care reminder updated.");
      } else {
        await createCareNote.mutateAsync({
          userId: user.id,
          input,
        });
        setCareNoteMessage("Care reminder saved.");
      }

      resetCareNoteForm();
      setShowCareNoteForm(false);
    } catch (error) {
      setCareNoteErrorMessage(getErrorMessage(error));
    }
  };

  const startEditingCareNote = (note: CareNote) => {
    setCareNoteTitle(note.title ?? "");
    setCareNoteCategory(note.category ?? "");
    setCareNoteBody(note.body);
    setEditingCareNoteId(note.id);
    setShowCareNoteForm(true);
    setCareNoteErrorMessage(null);
    setCareNoteMessage(null);
  };

  const handleDeleteCareNote = async (noteId: string) => {
    if (!user?.id || deleteCareNote.isPending) {
      return;
    }

    setCareNoteErrorMessage(null);
    setCareNoteMessage(null);

    try {
      await deleteCareNote.mutateAsync({
        userId: user.id,
        noteId,
      });

      if (editingCareNoteId === noteId) {
        resetCareNoteForm();
        setShowCareNoteForm(false);
      }

      setCareNoteMessage("That note has been removed.");
    } catch (error) {
      setCareNoteErrorMessage(getErrorMessage(error));
    }
  };

  const confirmDeleteCareNote = (note: CareNote) => {
    Alert.alert(
      "Remove note",
      `Remove "${note.title || "this reminder"}" from appointment notes?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void handleDeleteCareNote(note.id);
          },
        },
      ],
    );
  };

  if (!user?.id) {
    return <ErrorState message="Care is available once you’re signed in." />;
  }

  return (
    <AppScreen
      title="Care"
      subtitle="Organize medications, appointments, and important care notes."
    >
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, lowEnergyMode.enabled && styles.contentLowEnergy]}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        keyboardShouldPersistTaps="handled"
      >
        {lowEnergyMode.enabled ? (
          <View style={styles.lowEnergyBanner}>
            <AppText style={styles.lowEnergyBannerText}>
              Simplified layout is active.
            </AppText>
          </View>
        ) : null}

        {careLoadWarningMessage ? (
          <View style={styles.warningBanner}>
            <AppText style={styles.warningBannerTitle}>Some care details could not sync yet.</AppText>
            <AppText style={styles.warningBannerText}>{careLoadWarningMessage}</AppText>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void trackRetryTriggered("care-load-warning-retry");
                void appointmentsQuery.refetch();
                void medicationsQuery.refetch();
                void careNotesQuery.refetch();
              }}
              style={({ pressed }) => [styles.warningBannerButton, pressed && styles.warningBannerButtonPressed]}
            >
              <AppText style={styles.warningBannerButtonText}>Try again</AppText>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <AppText style={styles.summaryLabel}>Next appointment</AppText>
            {appointmentsLoading ? (
              <CareSectionPlaceholder />
            ) : nextAppointment ? (
              <>
                <AppText style={styles.summaryTitle}>{nextAppointment.title}</AppText>
                <AppText style={styles.summaryBody}>
                  {formatAppointmentDateLong(nextAppointment.appointment_date)}
                  {nextAppointment.appointment_time ? ` · ${formatAppointmentTimeInput(nextAppointment.appointment_time)}` : ""}
                </AppText>
                {nextAppointment.provider ? (
                  <AppText style={styles.summaryBody}>{nextAppointment.provider}</AppText>
                ) : (
                  <AppText style={styles.summaryHint}>Add a provider if you want it listed here.</AppText>
                )}
              </>
            ) : (
              <>
                <AppText style={styles.summaryEmptyTitle}>No appointment saved yet.</AppText>
                <AppText style={styles.summaryHint}>A title and date are enough to start.</AppText>
              </>
            )}
          </View>

          <View style={styles.summaryCard}>
            <AppText style={styles.summaryLabel}>Today’s medications</AppText>
            {medicationsLoading ? (
              <CareSectionPlaceholder lines={4} />
            ) : (
              <>
                <AppText style={styles.summaryBody}>
                  {formatMedicationTakenSummary(takenMedicationCount, todayMedicationDoses.length)}
                </AppText>
                {todayMedicationDoses.length === 0 ? (
                  <AppText style={styles.summaryHint}>
                    {activeMedications.length === 0
                      ? "Add a medication to track today’s schedule."
                      : "No medications are scheduled for today."}
                  </AppText>
                ) : (
                  <View style={styles.todayMedicationList}>
                    {todayMedicationDoses.map(({ medication, doseEntry }) => {
                      const takenAt = medicationsTakenToday[doseEntry.key];

                      return (
                        <View key={doseEntry.key} style={styles.todayMedicationRow}>
                          <View style={styles.todayMedicationCopy}>
                            <AppText style={styles.todayMedicationName}>{medication.name}</AppText>
                            {doseEntry.dose || medication.dosage ? (
                              <AppText style={styles.todayMedicationDosage}>{doseEntry.dose ?? medication.dosage}</AppText>
                            ) : null}
                            <AppText style={[styles.todayMedicationStatus, takenAt && styles.todayMedicationStatusTaken]}>
                              {takenAt ? "✓ Taken today" : `Due at ${doseEntry.label}`}
                            </AppText>
                          </View>
                          {takenAt ? null : (
                            <Pressable
                              accessibilityRole="button"
                              onPress={() => toggleMedicationTakenToday(medication.id, doseEntry.time)}
                              style={({ pressed }) => [styles.todayMedicationButton, pressed && styles.takenButtonPressed]}
                            >
                              <AppText style={styles.todayMedicationButtonText}>Mark as taken</AppText>
                            </Pressable>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
                {nextDueMedication && nextDueMedicationTime ? (
                  <AppText style={styles.summaryHint}>
                    Next due: {nextDueMedication.medication.name} • {nextDueMedicationTime}
                  </AppText>
                ) : null}
              </>
            )}
          </View>

        </View>

        <View style={styles.quickLinksCard}>
          <AppText style={styles.sectionTitle}>Health summary</AppText>
          <AppText style={styles.body}>Prepare a shareable summary for appointments.</AppText>
          <View style={styles.navButtons}>
            <AppButton label="Health Summary" onPress={() => router.push("/health-summary")} variant="secondary" />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/nutrition")}
          style={({ pressed }) => [styles.quickLinksCard, pressed && styles.collapseRowPressed]}
        >
          <View style={styles.formHeaderCopy}>
            <AppText style={styles.sectionTitle}>Nutrition</AppText>
            <AppText style={styles.body}>Build a nutrition plan based on your goals and preferences.</AppText>
          </View>
          <View style={styles.nutritionOpenButton}>
            <AppText style={styles.nutritionOpenButtonText}>Open</AppText>
          </View>
        </Pressable>

        <View style={styles.card}>
          <View style={styles.formHeader}>
            <View style={styles.formHeaderCopy}>
              <AppText style={styles.title}>Appointments</AppText>
              <AppText style={styles.body}>Save upcoming visits and any details you want to keep handy.</AppText>
            </View>
            <AppButton
              label={showAppointmentForm ? "Hide form" : "Add appointment"}
              onPress={() => setShowAppointmentForm((current) => !current)}
              variant="secondary"
            />
          </View>

          {showAppointmentForm ? (
            <View style={styles.formCard}>
              <AppText style={styles.formIntro}>
                Keep this brief. A title, date, and optional time are enough.
              </AppText>
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Title</AppText>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Neurology follow-up"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Date</AppText>
                <Pressable
                  onPress={() => openAppointmentPicker("date")}
                  style={({ pressed }) => [
                    styles.selectionField,
                    pressed && styles.selectionFieldPressed,
                  ]}
                >
                  <AppText style={date ? styles.selectionValue : styles.selectionPlaceholder}>
                    {formatAppointmentDateInput(date)}
                  </AppText>
                </Pressable>
              </View>
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Time</AppText>
                <Pressable
                  onPress={() => openAppointmentPicker("time")}
                  style={({ pressed }) => [
                    styles.selectionField,
                    pressed && styles.selectionFieldPressed,
                  ]}
                >
                  <AppText style={time ? styles.selectionValue : styles.selectionPlaceholder}>
                    {formatAppointmentTimeInput(time)}
                  </AppText>
                </Pressable>
                <AppText style={styles.helperText}>Optional. Leave this open if the time is not settled yet.</AppText>
              </View>
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Provider</AppText>
                <TextInput
                  value={provider}
                  onChangeText={setProvider}
                  placeholder="Neurologist"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Location</AppText>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Clinic or hospital"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Notes</AppText>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Questions, reminders, or anything you want handy"
                  placeholderTextColor="#9ca3af"
                  multiline
                  textAlignVertical="top"
                  style={styles.notesInput}
                />
              </View>
              <AppButton
                label={
                  createAppointment.isPending || updateAppointment.isPending
                    ? "Saving..."
                    : editingAppointmentId
                      ? "Save changes"
                      : "Save appointment"
                }
                onPress={() => void handleAppointmentSubmit()}
                disabled={createAppointment.isPending || updateAppointment.isPending}
              />
              {errorMessage ? <AppText style={styles.errorText}>{errorMessage}</AppText> : null}
            </View>
          ) : null}

          {message ? <AppText style={styles.successText}>{message}</AppText> : null}

          <AppText style={styles.sectionLabel}>Upcoming appointments</AppText>
          {appointmentsLoading ? (
            <CareSectionPlaceholder lines={4} />
          ) : upcomingAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <AppText style={styles.body}>No upcoming appointments saved yet.</AppText>
              <AppText style={styles.emptyHint}>Add a visit to keep it easy to find.</AppText>
            </View>
          ) : (
            <View style={styles.list}>
              {upcomingAppointments.map((appointment) => (
                <View key={appointment.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.datePill}>
                      <AppText style={styles.datePillText}>
                        {formatAppointmentDate(appointment.appointment_date)}
                      </AppText>
                    </View>
                    <View style={styles.itemHeaderCopy}>
                      <AppText style={styles.itemTitle}>{appointment.title}</AppText>
                      <AppText style={styles.itemMeta}>
                        {formatAppointmentDateLong(appointment.appointment_date)}
                        {appointment.appointment_time ? ` · ${formatAppointmentTimeInput(appointment.appointment_time)}` : ""}
                      </AppText>
                    </View>
                  </View>
                  {appointment.provider ? (
                    <AppText style={styles.detailText}>With {appointment.provider}</AppText>
                  ) : null}
                  {appointment.location ? (
                    <AppText style={styles.detailText}>At {appointment.location}</AppText>
                  ) : null}
                  {appointment.notes ? <AppText style={styles.itemNotes}>{appointment.notes}</AppText> : null}
                  <View style={styles.itemActions}>
                    <AppButton label="Edit" onPress={() => startEditingAppointment(appointment)} variant="secondary" />
                    <AppButton
                      label={deleteAppointment.isPending ? "Deleting..." : "Delete"}
                      onPress={() => confirmDeleteAppointment(appointment)}
                      variant="secondary"
                      disabled={deleteAppointment.isPending}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          <AppText style={styles.sectionLabel}>Past appointments</AppText>
          {appointmentsLoading ? (
            <CareSectionPlaceholder lines={3} />
          ) : pastAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <AppText style={styles.body}>No past appointments saved yet.</AppText>
              <AppText style={styles.emptyHint}>Completed visits will appear here.</AppText>
            </View>
          ) : (
            <View style={styles.list}>
              {pastAppointments.map((appointment) => (
                <View key={appointment.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.datePill}>
                      <AppText style={styles.datePillText}>
                        {formatAppointmentDate(appointment.appointment_date)}
                      </AppText>
                    </View>
                    <View style={styles.itemHeaderCopy}>
                      <AppText style={styles.itemTitle}>{appointment.title}</AppText>
                      <AppText style={styles.itemMeta}>
                        {formatAppointmentDateLong(appointment.appointment_date)}
                        {appointment.appointment_time ? ` · ${formatAppointmentTimeInput(appointment.appointment_time)}` : ""}
                      </AppText>
                    </View>
                  </View>
                  {appointment.provider ? (
                    <AppText style={styles.detailText}>With {appointment.provider}</AppText>
                  ) : null}
                  {appointment.location ? (
                    <AppText style={styles.detailText}>At {appointment.location}</AppText>
                  ) : null}
                  {appointment.notes ? <AppText style={styles.itemNotes}>{appointment.notes}</AppText> : null}
                  <View style={styles.itemActions}>
                    <AppButton label="Edit" onPress={() => startEditingAppointment(appointment)} variant="secondary" />
                    <AppButton
                      label={deleteAppointment.isPending ? "Deleting..." : "Delete"}
                      onPress={() => confirmDeleteAppointment(appointment)}
                      variant="secondary"
                      disabled={deleteAppointment.isPending}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
            <View style={styles.formHeader}>
              <View style={styles.formHeaderCopy}>
                <AppText style={styles.title}>Today’s medications</AppText>
              <AppText style={styles.body}>{formatMedicationTakenSummary(takenMedicationCount, todayMedicationDoses.length)}</AppText>
              </View>
            <AppButton
              label={showMedicationForm ? "Hide form" : "Add medication"}
              onPress={() => setShowMedicationForm((current) => !current)}
              variant="secondary"
            />
          </View>

          {showMedicationForm ? (
            <View style={styles.formCard}>
              <AppText style={styles.sectionLabel}>MEDICATION UI V2 - June 8</AppText>
              <AppText style={styles.formIntro}>
                Start with the name and choose the closest schedule. You can keep the rest minimal.
              </AppText>
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Name</AppText>
                <TextInput
                  ref={medicationNameInputRef}
                  value={medicationName}
                  onChangeText={(value) => {
                    setMedicationName(value);
                    if (medicationErrorMessage === "Please enter a medication name." || medicationErrorMessage === "Medication name is required.") {
                      setMedicationErrorMessage(null);
                    }
                  }}
                  placeholder="Vitamin D"
                  placeholderTextColor="#9ca3af"
                  style={[styles.input, medicationNameValidationMessage && styles.inputError]}
                />
                {medicationNameValidationMessage ? (
                  <AppText style={styles.errorText}>{medicationNameValidationMessage}</AppText>
                ) : null}
              </View>
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Dosage</AppText>
                <TextInput
                  value={medicationDosage}
                  onChangeText={setMedicationDosage}
                  placeholder="1000 IU"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Schedule</AppText>
                <View style={styles.frequencyOptions}>
                  {MEDICATION_SCHEDULE_OPTIONS.map((option) => {
                    const isSelected = medicationScheduleType === option.value;

                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => handleMedicationScheduleTypePress(option.value)}
                        style={({ pressed }) => [
                          styles.frequencyChip,
                          isSelected && styles.frequencyChipSelected,
                          pressed && styles.frequencyChipPressed,
                        ]}
                      >
                        <AppText
                          style={[
                            styles.frequencyChipText,
                            isSelected && styles.frequencyChipTextSelected,
                          ]}
                        >
                          {option.label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
                <AppText style={styles.helperText}>
                  Daily can use one or many times. Weekly only appears due on the days you choose.
                </AppText>
              </View>
              {medicationScheduleType === "weekly" ? (
                <View style={styles.fieldGroup}>
                  <AppText style={styles.fieldLabel}>Days</AppText>
                  <View style={styles.frequencyOptions}>
                    {MEDICATION_DAY_OPTIONS.map((day) => {
                      const isSelected = medicationSelectedDays.includes(day);

                      return (
                        <Pressable
                          key={day}
                          onPress={() => toggleMedicationDay(day)}
                          style={({ pressed }) => [
                            styles.frequencyChip,
                            isSelected && styles.frequencyChipSelected,
                            pressed && styles.frequencyChipPressed,
                          ]}
                        >
                          <AppText style={[styles.frequencyChipText, isSelected && styles.frequencyChipTextSelected]}>
                            {day.slice(0, 3)}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                  <AppText style={styles.helperText}>
                    Select the days this medication should appear as due.
                  </AppText>
                </View>
              ) : null}
              {medicationScheduleType !== "as_needed" ? (
                <View style={styles.fieldGroup}>
                  <AppText style={styles.fieldLabel}>Dose times</AppText>
                  <AppText style={styles.helperText}>
                    Add one or more times. Each time can include an optional dose note like “1 pill”.
                  </AppText>
                  <View style={styles.list}>
                    {medicationDoseTimes.map((doseTime, index) => (
                      <View key={`dose-time-${index}`} style={styles.itemCard}>
                        <View style={styles.fieldGroup}>
                          <AppText style={styles.fieldLabel}>Dose {index + 1} time</AppText>
                          <Pressable
                            onPress={() => openMedicationDosePicker(index)}
                            style={({ pressed }) => [
                              styles.selectionField,
                              pressed && styles.selectionFieldPressed,
                            ]}
                          >
                            <AppText style={doseTime.time ? styles.selectionValue : styles.selectionPlaceholder}>
                              {doseTime.time ? formatAppointmentTimeInput(doseTime.time) : "Choose a time"}
                            </AppText>
                          </Pressable>
                        </View>
                        <View style={styles.fieldGroup}>
                          <AppText style={styles.fieldLabel}>Dose note</AppText>
                          <TextInput
                            value={doseTime.dose}
                            onChangeText={(value) => updateMedicationDoseTime(index, "dose", value)}
                            placeholder="1 pill"
                            placeholderTextColor="#9ca3af"
                            style={styles.input}
                          />
                        </View>
                        <View style={styles.itemActions}>
                          <AppButton
                            label="Remove"
                            onPress={() => removeMedicationDoseTime(index)}
                            variant="secondary"
                            disabled={medicationDoseTimes.length === 1}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                  <AppButton label="Add another time" onPress={addMedicationDoseTime} variant="secondary" />
                </View>
              ) : null}
              {medicationScheduleType === "as_needed" ? (
                <AppText style={styles.helperText}>
                  As needed medications stay off the daily due list until you log them manually.
                </AppText>
              ) : null}
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Notes</AppText>
                <TextInput
                  value={medicationNotes}
                  onChangeText={setMedicationNotes}
                  placeholder="Anything useful to remember"
                  placeholderTextColor="#9ca3af"
                  multiline
                  textAlignVertical="top"
                  style={styles.notesInput}
                />
              </View>
              <AppButton
                label={
                  createMedication.isPending || updateMedication.isPending
                    ? "Saving..."
                    : editingMedicationId
                      ? "Save changes"
                      : "Save medication"
                }
                onPress={() => void handleMedicationSubmit()}
                disabled={createMedication.isPending || updateMedication.isPending || trimmedMedicationName.length === 0}
              />
              {medicationErrorMessage ? <AppText style={styles.errorText}>{medicationErrorMessage}</AppText> : null}
            </View>
          ) : null}

          {medicationMessage ? <AppText style={styles.successText}>{medicationMessage}</AppText> : null}

          <AppText style={styles.sectionLabel}>Medication list</AppText>
          {medicationsLoading ? (
            <CareSectionPlaceholder lines={4} />
          ) : activeMedications.length === 0 ? (
            <View style={styles.emptyState}>
              <AppText style={styles.body}>No medications scheduled today.</AppText>
              <AppText style={styles.emptyHint}>Add a medication to track dosage, schedule, and today’s taken status.</AppText>
            </View>
          ) : (
            <View style={styles.list}>
              {activeMedications.map((medication) => {
                const dueEntries = getMedicationDoseEntriesForDate(medication, today);
                const isMedicationTakenToday = dueEntries.length > 0 && dueEntries.every((entry) => medicationsTakenToday[entry.key]);

                return (
                <View key={medication.id} style={[styles.itemCard, isMedicationTakenToday && styles.medicationTakenCard]}>
                  <View style={styles.medicationHeader}>
                    <View style={styles.itemHeaderCopy}>
                      <AppText style={styles.itemTitle}>{medication.name}</AppText>
                      <AppText style={styles.itemMeta}>
                        {medication.dosage ? `${medication.dosage} · ` : ""}
                        {medication.frequency}
                      </AppText>
                    </View>
                    <AppText style={[styles.badge, isMedicationTakenToday ? styles.badgeTaken : styles.badgeActive]}>
                      {isMedicationTakenToday ? "Taken today" : "Current"}
                    </AppText>
                  </View>
                  {medication.notes ? <AppText style={styles.itemNotes}>{medication.notes}</AppText> : null}
                  <View style={styles.medicationStatusRow}>
                    <AppText style={[styles.medicationStatusText, isMedicationTakenToday && styles.medicationStatusTextTaken]}>
                      {medication.schedule_type === "as_needed"
                        ? "Take as needed"
                        : dueEntries.length > 0
                          ? isMedicationTakenToday
                            ? "✓ All scheduled doses marked taken today"
                            : `${dueEntries.length} ${dueEntries.length === 1 ? "dose" : "doses"} scheduled today`
                          : "Not scheduled today"}
                    </AppText>
                  </View>
                  {dueEntries.length > 0 ? (
                    <View style={styles.list}>
                      {dueEntries.map((entry) => {
                        const takenAt = medicationsTakenToday[entry.key];

                        return (
                          <View key={entry.key} style={styles.adherenceRow}>
                            <View style={styles.itemHeaderCopy}>
                              <AppText style={styles.adherenceTitle}>
                                {takenAt ? `Taken at ${formatTakenTime(takenAt)}` : `Due at ${entry.label}`}
                              </AppText>
                              <AppText style={styles.adherenceBody}>
                                {entry.dose ?? medication.dosage ?? "Scheduled dose"}
                              </AppText>
                            </View>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`${takenAt ? "Undo taken status for" : "Mark taken for"} ${medication.name} at ${entry.label}`}
                              onPress={() => toggleMedicationTakenToday(medication.id, entry.time)}
                              style={({ pressed }) => [
                                styles.takenButton,
                                takenAt && styles.takenButtonActive,
                                pressed && styles.takenButtonPressed,
                              ]}
                            >
                              <AppText style={[styles.takenButtonText, takenAt && styles.takenButtonTextActive]}>
                                {takenAt ? "Taken ✓" : "Mark as taken"}
                              </AppText>
                            </Pressable>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.adherenceRow}>
                      <View style={styles.itemHeaderCopy}>
                        <AppText style={styles.adherenceTitle}>
                          {medication.schedule_type === "as_needed" ? "No fixed schedule" : medication.frequency}
                        </AppText>
                        <AppText style={styles.adherenceBody}>
                          {medication.schedule_type === "as_needed"
                            ? "Mark this when you take it, rather than on a daily schedule."
                            : "This medication is active, but it is not due today."}
                        </AppText>
                      </View>
                    </View>
                  )}
                  <View style={styles.itemActions}>
                    <AppButton label="Edit" onPress={() => startEditingMedication(medication)} variant="secondary" />
                    <AppButton
                      label={deleteMedication.isPending ? "Deleting..." : "Delete"}
                      onPress={() => confirmDeleteMedication(medication)}
                      variant="secondary"
                      disabled={deleteMedication.isPending}
                    />
                  </View>
                </View>
                );
              })}
            </View>
          )}

          {inactiveMedications.length > 0 ? (
            <View style={styles.inactiveSection}>
              <Pressable
                onPress={() => setShowInactiveMedications((current) => !current)}
                style={({ pressed }) => [styles.collapseRow, pressed && styles.collapseRowPressed]}
              >
                <AppText style={styles.sectionLabel}>Inactive medications</AppText>
                <AppText style={styles.collapseLabel}>
                  {showInactiveMedications ? "Hide" : `Show ${inactiveMedications.length}`}
                </AppText>
              </Pressable>

              {showInactiveMedications ? (
                <View style={styles.list}>
                  {inactiveMedications.map((medication) => (
                    <View key={medication.id} style={styles.itemCard}>
                      <View style={styles.medicationHeader}>
                        <View style={styles.itemHeaderCopy}>
                          <AppText style={styles.itemTitle}>{medication.name}</AppText>
                          <AppText style={styles.itemMeta}>
                            {medication.dosage ? `${medication.dosage} · ` : ""}
                            {medication.frequency}
                          </AppText>
                        </View>
                        <AppText style={[styles.badge, styles.badgeInactive]}>Inactive</AppText>
                      </View>
                      {medication.notes ? <AppText style={styles.itemNotes}>{medication.notes}</AppText> : null}
                      <View style={styles.itemActions}>
                        <AppButton label="Edit" onPress={() => startEditingMedication(medication)} variant="secondary" />
                        <AppButton
                          label={deleteMedication.isPending ? "Deleting..." : "Delete"}
                          onPress={() => confirmDeleteMedication(medication)}
                          variant="secondary"
                          disabled={deleteMedication.isPending}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={styles.formHeader}>
            <View style={styles.formHeaderCopy}>
              <AppText style={styles.title}>Appointment notes</AppText>
              <AppText style={styles.body}>
                Save questions, symptoms, side effects, and changes to discuss with your care team.
              </AppText>
            </View>
            <AppButton
              label={showCareNoteForm ? "Hide form" : "Add care reminder"}
              onPress={() => setShowCareNoteForm((current) => !current)}
              variant="secondary"
            />
          </View>

          {showCareNoteForm ? (
            <View style={styles.formCard}>
              <AppText style={styles.formIntro}>
                Choose a category and write only what you want to remember.
              </AppText>
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Title</AppText>
                <TextInput
                  value={careNoteTitle}
                  onChangeText={setCareNoteTitle}
                  placeholder="Questions for next visit"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Category</AppText>
                <TextInput
                  value={careNoteCategory}
                  onChangeText={setCareNoteCategory}
                  placeholder="Questions for provider"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
              <View style={styles.categoryOptions}>
                {CARE_NOTE_CATEGORIES.map((category) => {
                  const isSelected = careNoteCategory === category;

                  return (
                    <Pressable
                      key={category}
                      onPress={() => setCareNoteCategory(category)}
                      style={({ pressed }) => [
                        styles.frequencyChip,
                        isSelected && styles.frequencyChipSelected,
                        pressed && styles.frequencyChipPressed,
                      ]}
                    >
                      <AppText
                        style={[
                          styles.frequencyChipText,
                          isSelected && styles.frequencyChipTextSelected,
                        ]}
                      >
                        {category}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Note</AppText>
                <TextInput
                  value={careNoteBody}
                  onChangeText={setCareNoteBody}
                  placeholder="Write what you want to remember or discuss"
                  placeholderTextColor="#9ca3af"
                  multiline
                  textAlignVertical="top"
                  style={styles.notesInput}
                />
              </View>
              <AppButton
                label={
                  createCareNote.isPending || updateCareNote.isPending
                    ? "Saving..."
                    : editingCareNoteId
                      ? "Save changes"
                      : "Save care reminder"
                }
                onPress={() => void handleCareNoteSave()}
                disabled={createCareNote.isPending || updateCareNote.isPending}
              />
            </View>
          ) : null}

          {careNoteMessage ? <AppText style={styles.successText}>{careNoteMessage}</AppText> : null}
          {careNoteErrorMessage ? <AppText style={styles.errorText}>{careNoteErrorMessage}</AppText> : null}

          {careNotesLoading ? (
            <CareSectionPlaceholder lines={4} />
          ) : (careNotesQuery.data ?? []).length === 0 ? (
            <View style={styles.emptyState}>
              <AppText style={styles.body}>No care reminders saved yet.</AppText>
              <AppText style={styles.emptyHint}>
                Save provider questions, symptom changes, medication side effects, or things helping.
              </AppText>
            </View>
          ) : (
            <View style={styles.list}>
              {careNotesQuery.data?.map((note) => (
                <View key={note.id} style={styles.itemCard}>
                  <View style={styles.noteHeader}>
                    <View style={styles.itemHeaderCopy}>
                      <AppText style={styles.itemTitle}>{note.title || "Untitled note"}</AppText>
                      {note.category ? <AppText style={styles.categoryChip}>{note.category}</AppText> : null}
                    </View>
                  </View>
                  <AppText style={styles.itemNotes}>{getNotePreview(note.body, 180)}</AppText>
                  <AppText style={styles.noteMeta}>
                    Updated {new Date(note.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </AppText>
                  <View style={styles.itemActions}>
                    <AppButton label="Edit" onPress={() => startEditingCareNote(note)} variant="secondary" />
                    <AppButton
                      label={deleteCareNote.isPending ? "Deleting..." : "Delete"}
                      onPress={() => confirmDeleteCareNote(note)}
                      variant="secondary"
                      disabled={deleteCareNote.isPending}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
      {Platform.OS === "ios" ? (
      <Modal
        visible={activePicker !== null}
        transparent
        animationType="slide"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={closeAppointmentPicker}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Pressable onPress={closeAppointmentPicker} style={styles.modalAction}>
                <AppText style={styles.modalActionText}>Cancel</AppText>
              </Pressable>
              <AppText style={styles.modalTitle}>
                {activePicker === "date" ? "Choose a date" : "Choose a time"}
              </AppText>
              <Pressable onPress={confirmAppointmentPicker} style={styles.modalAction}>
                <AppText style={styles.modalActionText}>Done</AppText>
              </Pressable>
            </View>
            {activePicker ? (
              <DateTimePicker
                value={pickerDraftDate}
                mode={activePicker}
                display="spinner"
                onChange={activePicker === "date" ? handleDateChange : handleTimeChange}
                style={styles.modalPicker}
              />
            ) : null}
          </View>
        </View>
      </Modal>
      ) : null}
      {Platform.OS === "ios" ? (
      <Modal
        visible={activeMedicationDosePickerIndex !== null}
        transparent
        animationType="slide"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={closeMedicationDosePicker}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Pressable onPress={closeMedicationDosePicker} style={styles.modalAction}>
                <AppText style={styles.modalActionText}>Cancel</AppText>
              </Pressable>
              <AppText style={styles.modalTitle}>Choose a dose time</AppText>
              <Pressable onPress={confirmMedicationDosePicker} style={styles.modalAction}>
                <AppText style={styles.modalActionText}>Done</AppText>
              </Pressable>
            </View>
            {activeMedicationDosePickerIndex !== null ? (
              <DateTimePicker
                value={medicationPickerDraftDate}
                mode="time"
                display="spinner"
                onChange={handleMedicationDosePickerChange}
                style={styles.modalPicker}
              />
            ) : null}
          </View>
        </View>
      </Modal>
      ) : null}
      {Platform.OS === "android" && activePicker ? (
        <DateTimePicker
          value={pickerDraftDate}
          mode={activePicker}
          display="default"
          onChange={activePicker === "date" ? handleDateChange : handleTimeChange}
        />
      ) : null}
      {Platform.OS === "android" && activeMedicationDosePickerIndex !== null ? (
        <DateTimePicker
          value={medicationPickerDraftDate}
          mode="time"
          display="default"
          onChange={handleMedicationDosePickerChange}
        />
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 18,
  },
  contentLowEnergy: {
    gap: 20,
  },
  heroCard: {
    backgroundColor: "#fff3e8",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f1c8a7",
    padding: 20,
    gap: 12,
    shadowColor: "rgba(120, 71, 29, 0.22)",
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  lowEnergyBanner: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eadfd6",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  lowEnergyBannerText: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 19,
  },
  warningBanner: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fff7f0",
    padding: 16,
    gap: 8,
  },
  warningBannerTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: "#8a4a17",
  },
  warningBannerText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#7c5a43",
  },
  warningBannerButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#fff0e2",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  warningBannerButtonPressed: {
    opacity: 0.84,
  },
  warningBannerButtonText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: "#9a4a11",
  },
  summaryGrid: {
    gap: 14,
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 10,
  },
  quickLinksCard: {
    backgroundColor: "#fffdfb",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#efd7c4",
    padding: 18,
    gap: 14,
  },
  card: {
    backgroundColor: "#fffdfb",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#efd7c4",
    padding: 18,
    gap: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: "800",
    color: "#1f2937",
    letterSpacing: -0.4,
  },
  body: {
    color: "#4b5563",
    lineHeight: 23,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  nutritionDisclaimer: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 19,
  },
  nutritionSection: {
    gap: 12,
  },
  nutritionPlannerCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#efd7c4",
    backgroundColor: "#fff7f1",
    padding: 14,
    gap: 16,
  },
  nutritionStep: {
    gap: 10,
  },
  nutritionStepTitle: {
    color: "#1f2937",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
  },
  dietRecommendationCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dbe9dc",
    backgroundColor: "#f8fcf7",
    padding: 14,
    gap: 8,
  },
  nutritionGrid: {
    gap: 10,
  },
  nutritionInfoCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    padding: 14,
    gap: 6,
  },
  nutritionApproachCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    padding: 14,
    gap: 8,
  },
  nutritionCardTitle: {
    color: "#1f2937",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
  },
  nutritionCardBody: {
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 20,
  },
  nutritionDetailText: {
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 20,
  },
  nutritionDetailLabel: {
    color: "#1f2937",
    fontWeight: "700",
  },
  nutritionClinicianNote: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 19,
  },
  nutritionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  nutritionOpenButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#e8751a",
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 2,
  },
  nutritionOpenButtonText: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },
  scannerModeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  scannerModePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  scannerModePillActive: {
    borderColor: "#f3dfd1",
    backgroundColor: "#fff4ec",
  },
  scannerModePillText: {
    color: "#6b7280",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  scannerModePillTextActive: {
    color: "#9a4a11",
  },
  clearFiltersButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead8ca",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearFiltersText: {
    color: "#c25d10",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  nutritionMealCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#efd7c4",
    backgroundColor: "#fff8f2",
    padding: 14,
    gap: 10,
  },
  foodAnalysisCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#efd7c4",
    backgroundColor: "#fffdfb",
    padding: 14,
    gap: 12,
  },
  analysisMetricGrid: {
    gap: 10,
  },
  analysisMetricCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    padding: 12,
    gap: 5,
  },
  alternativeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 12,
    backgroundColor: "#fffaf6",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  alternativeBullet: {
    color: "#c25d10",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },
  alternativeText: {
    flex: 1,
    color: "#374151",
    fontSize: 14,
    lineHeight: 21,
  },
  nutritionUpgradeCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eadfd6",
    backgroundColor: "#f9fafb",
    padding: 12,
    gap: 10,
  },
  nutritionLockedCard: {
    backgroundColor: "#f9fafb",
    borderColor: "#e5e7eb",
  },
  nutritionBadge: {
    backgroundColor: "#eef7ed",
    color: "#166534",
  },
  nutritionTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  nutritionTag: {
    borderRadius: 999,
    backgroundColor: "#fff0e2",
    paddingHorizontal: 9,
    paddingVertical: 4,
    color: "#9a4a11",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  nutritionPlanLine: {
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 21,
  },
  groceryListCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#efd7c4",
    backgroundColor: "#fff8f2",
    padding: 12,
    gap: 6,
  },
  mealInstructionCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    padding: 12,
    gap: 6,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    color: "#c25d10",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  summaryCount: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1f2937",
    lineHeight: 38,
  },
  summaryBody: {
    color: "#4b5563",
    lineHeight: 20,
  },
  summaryHint: {
    color: "#6b7280",
    lineHeight: 20,
  },
  todayMedicationList: {
    gap: 10,
  },
  todayMedicationRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    padding: 12,
    gap: 10,
  },
  todayMedicationCopy: {
    gap: 3,
  },
  todayMedicationName: {
    color: "#1f2937",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
  },
  todayMedicationDosage: {
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 19,
  },
  todayMedicationStatus: {
    color: "#9a4f14",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  todayMedicationStatusTaken: {
    color: "#166534",
  },
  todayMedicationButton: {
    alignSelf: "flex-start",
    minHeight: 42,
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#e8751a",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  todayMedicationButtonText: {
    color: "#ffffff",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  summaryEmptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  navButtons: {
    gap: 10,
  },
  formHeader: {
    gap: 14,
  },
  formHeaderCopy: {
    gap: 6,
  },
  formCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 16,
    gap: 16,
  },
  formIntro: {
    color: "#6b7280",
    lineHeight: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: "#374151",
  },
  helperText: {
    marginTop: -4,
    fontSize: 13,
    lineHeight: 18,
    color: "#6b7280",
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5d6cb",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    lineHeight: 22,
    color: "#1f2937",
    minHeight: 52,
  },
  inputError: {
    borderColor: "#dc2626",
    backgroundColor: "#fff7f7",
  },
  selectionField: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5d6cb",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 15,
    minHeight: 54,
  },
  selectionFieldPressed: {
    opacity: 0.88,
  },
  selectionValue: {
    fontSize: 16,
    lineHeight: 22,
    color: "#1f2937",
  },
  selectionPlaceholder: {
    fontSize: 16,
    lineHeight: 22,
    color: "#9ca3af",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(31, 41, 55, 0.22)",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    paddingTop: 12,
    paddingBottom: 16,
    minHeight: 320,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  modalTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  modalAction: {
    minWidth: 56,
    paddingVertical: 8,
  },
  modalActionText: {
    color: "#c25d10",
    fontSize: 15,
    fontWeight: "600",
  },
  modalPicker: {
    minHeight: 220,
    alignSelf: "stretch",
  },
  frequencyOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  frequencyChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead8ca",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  frequencyChipSelected: {
    borderColor: "#e8751a",
    backgroundColor: "#fff4ec",
  },
  frequencyChipPressed: {
    opacity: 0.88,
  },
  frequencyChipText: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  frequencyChipHint: {
    color: "#6b7280",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
    marginTop: 2,
  },
  frequencyChipTextSelected: {
    color: "#9a4a11",
  },
  notesInput: {
    minHeight: 124,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5d6cb",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 23,
    color: "#1f2937",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#c25d10",
  },
  errorText: {
    fontSize: 14,
    color: "#b91c1c",
  },
  successText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#166534",
  },
  emptyState: {
    gap: 8,
    paddingVertical: 8,
  },
  emptyHint: {
    color: "#6b7280",
    lineHeight: 20,
  },
  list: {
    gap: 12,
  },
  inactiveSection: {
    gap: 10,
  },
  collapseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  collapseRowPressed: {
    opacity: 0.82,
  },
  collapseLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#c25d10",
  },
  itemCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 16,
    gap: 10,
  },
  medicationTakenCard: {
    borderColor: "#cfe8d4",
    backgroundColor: "#fbfdf9",
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  medicationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  datePill: {
    backgroundColor: "#fff0e2",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 72,
    alignItems: "center",
  },
  datePillText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#c25d10",
  },
  itemHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  itemMeta: {
    fontSize: 13,
    lineHeight: 19,
    color: "#c25d10",
    fontWeight: "600",
  },
  categoryChip: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#fff0e2",
    fontSize: 12,
    lineHeight: 16,
    color: "#c25d10",
    fontWeight: "600",
  },
  placeholderStack: {
    gap: 10,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  badgeActive: {
    backgroundColor: "#e8f7ec",
    color: "#166534",
  },
  badgeTaken: {
    backgroundColor: "#dff3e4",
    color: "#166534",
  },
  badgeInactive: {
    backgroundColor: "#f3f4f6",
    color: "#4b5563",
  },
  detailText: {
    color: "#4b5563",
    lineHeight: 21,
  },
  itemNotes: {
    color: "#4b5563",
    lineHeight: 21,
  },
  medicationStatusRow: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#fff7ed",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  medicationStatusText: {
    color: "#9a4f14",
    fontSize: 13,
    fontWeight: "700",
  },
  medicationStatusTextTaken: {
    color: "#166534",
  },
  adherenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eadfd6",
    backgroundColor: "#ffffff",
    padding: 12,
  },
  adherenceTitle: {
    color: "#1f2937",
    fontWeight: "700",
    lineHeight: 20,
  },
  adherenceBody: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
  },
  takenButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d8ead9",
    backgroundColor: "#f7fbf7",
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 118,
    alignItems: "center",
  },
  takenButtonActive: {
    borderColor: "#7abf83",
    backgroundColor: "#e8f7ec",
  },
  takenButtonPressed: {
    opacity: 0.86,
  },
  takenButtonText: {
    color: "#166534",
    fontSize: 13,
    fontWeight: "700",
  },
  takenButtonTextActive: {
    color: "#14532d",
  },
  noteMeta: {
    fontSize: 12,
    lineHeight: 17,
    color: "#6b7280",
  },
  itemActions: {
    gap: 10,
    paddingTop: 6,
  },
});
