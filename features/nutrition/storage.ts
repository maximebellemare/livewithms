import { appSecureStore } from "../../lib/secure-store";

export type SavedNutritionMeal = {
  id: string;
  title: string;
  category: string;
  goal?: string;
  dietStyle?: string;
  plan?: unknown | null;
  savedAt: string;
};

export type NutritionPreferences = {
  goal: string;
  dietStyle: string;
  dislikedFoods: string;
  dietaryFilters: string[];
  prepPreference: string;
  budgetPreference: string;
  currentMealPlan: unknown | null;
  updatedAt: string;
};

const SAVED_NUTRITION_MEALS_PREFIX = "livewithms:nutrition:saved-meals";
const NUTRITION_PREFERENCES_PREFIX = "livewithms:nutrition:preferences";
const NUTRITION_FOOD_ANALYSIS_USAGE_PREFIX = "livewithms:nutrition:food-analysis-usage";

type NormalizedMealEntry = {
  type: string;
  title: string;
  prep: string;
  prepTime: string;
  lowEnergyOption: string;
};

type NormalizedMealDay = {
  day: string;
  meals: Array<string | NormalizedMealEntry>;
};

type NormalizedMealPlan = {
  title: string;
  dietStyle: string;
  focus: string;
  fitReasons: string[];
  plan: NormalizedMealDay[];
  swaps: string[];
  groceries: Record<string, string[]>;
  budget: string;
};

function normalizeGoal(value: unknown) {
  if (value === "More stable energy") {
    return "Stable energy";
  }

  if (value === "Easier low-energy meals") {
    return "Low-energy meals";
  }

  if (value === "General MS-friendly eating") {
    return "General wellness";
  }

  return typeof value === "string" ? value : "Stable energy";
}

function normalizeDietStyle(value: unknown) {
  if (value === "Unsure — recommend one for me") {
    return "Recommend one for me";
  }

  return typeof value === "string" ? value : "Recommend one for me";
}

function normalizePrepPreference(value: unknown) {
  if (value === "No-cook") {
    return "No-cook options";
  }

  if (value === "10-minute") {
    return "Quick meals";
  }

  if (value === "Batch-cook") {
    return "Batch cooking";
  }

  if (value === "Freezer-friendly") {
    return "Freezer-friendly meals";
  }

  return typeof value === "string" ? value : "Quick meals";
}

function normalizeStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  if (typeof value === "string") {
    return value
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [] as string[];
}

function normalizeGroceries(value: unknown) {
  if (!value || typeof value !== "object") {
    return {} as Record<string, string[]>;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([category, items]) => [
      category,
      normalizeStringArray(items),
    ]),
  );
}

function normalizeMealEntry(value: unknown): string | NormalizedMealEntry | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Record<string, unknown>;
  if (typeof item.type !== "string" || typeof item.title !== "string") {
    return null;
  }

  return {
    type: item.type,
    title: item.title,
    prep: typeof item.prep === "string" ? item.prep : "",
    prepTime: typeof item.prepTime === "string" ? item.prepTime : "",
    lowEnergyOption: typeof item.lowEnergyOption === "string" ? item.lowEnergyOption : "",
  };
}

function normalizeMealPlanDay(value: unknown): NormalizedMealDay | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Record<string, unknown>;
  if (typeof item.day !== "string") {
    return null;
  }

  const meals = Array.isArray(item.meals)
    ? item.meals.map(normalizeMealEntry).filter((meal): meal is string | NormalizedMealEntry => Boolean(meal))
    : [];

  return {
    day: item.day,
    meals,
  };
}

function normalizeCurrentMealPlan(value: unknown): NormalizedMealPlan | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Record<string, unknown>;
  const plan = Array.isArray(item.plan)
    ? item.plan.map(normalizeMealPlanDay).filter((day): day is NormalizedMealDay => Boolean(day))
    : [];

  return {
    title: typeof item.title === "string" ? item.title : "Meal plan",
    dietStyle: typeof item.dietStyle === "string" ? item.dietStyle : "Recommend one for me",
    focus: typeof item.focus === "string" ? item.focus : "Keep meals simple, supportive, and realistic for the day.",
    fitReasons: normalizeStringArray(item.fitReasons),
    plan,
    swaps: normalizeStringArray(item.swaps),
    groceries: normalizeGroceries(item.groceries),
    budget: typeof item.budget === "string" ? item.budget : "Budget-friendly",
  };
}

function getSavedMealsKey(userId: string) {
  return `${SAVED_NUTRITION_MEALS_PREFIX}:${userId}`;
}

function getPreferencesKey(userId: string) {
  return `${NUTRITION_PREFERENCES_PREFIX}:${userId}`;
}

function getFoodAnalysisUsageKey(userId: string, dateKey: string) {
  return `${NUTRITION_FOOD_ANALYSIS_USAGE_PREFIX}:${userId}:${dateKey}`;
}

function normalizeSavedMeal(value: unknown): SavedNutritionMeal | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<SavedNutritionMeal>;

  if (typeof item.id !== "string" || typeof item.title !== "string" || typeof item.category !== "string") {
    return null;
  }

  return {
    id: item.id,
    title: item.title,
    category: item.category,
    goal: typeof item.goal === "string" ? item.goal : undefined,
    dietStyle: typeof item.dietStyle === "string" ? item.dietStyle : undefined,
    plan: normalizeCurrentMealPlan(item.plan),
    savedAt: typeof item.savedAt === "string" ? item.savedAt : new Date().toISOString(),
  };
}

export function normalizeNutritionState(raw: unknown): NutritionPreferences | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const parsed = raw as Partial<NutritionPreferences> & {
    dietaryPreferences?: unknown;
    prepPreferences?: unknown;
    currentPlan?: unknown;
    dislikes?: unknown;
  };

  return {
    goal: normalizeGoal(parsed.goal),
    dietStyle: normalizeDietStyle(parsed.dietStyle),
    dislikedFoods:
      typeof parsed.dislikedFoods === "string"
        ? parsed.dislikedFoods
        : typeof parsed.dislikes === "string"
          ? parsed.dislikes
          : "",
    dietaryFilters:
      normalizeStringArray(parsed.dietaryFilters).length > 0
        ? normalizeStringArray(parsed.dietaryFilters)
        : normalizeStringArray(parsed.dietaryPreferences),
    prepPreference: normalizePrepPreference(
      parsed.prepPreference ??
        (Array.isArray(parsed.prepPreferences) ? parsed.prepPreferences[0] : parsed.prepPreferences),
    ),
    budgetPreference: typeof parsed.budgetPreference === "string" ? parsed.budgetPreference : "Budget-friendly",
    currentMealPlan: normalizeCurrentMealPlan(parsed.currentMealPlan ?? parsed.currentPlan),
    updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
  };
}

export async function loadSavedNutritionMeals(userId: string): Promise<SavedNutritionMeal[]> {
  try {
    const raw = await appSecureStore.getItem(getSavedMealsKey(userId));
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(normalizeSavedMeal).filter((item): item is SavedNutritionMeal => Boolean(item));
  } catch {
    return [];
  }
}

export async function saveNutritionMeal(userId: string, meal: Omit<SavedNutritionMeal, "savedAt">) {
  const current = await loadSavedNutritionMeals(userId);
  const next = [
    { ...meal, savedAt: new Date().toISOString() },
    ...current.filter((item) => item.id !== meal.id),
  ].slice(0, 30);

  await appSecureStore.setItem(getSavedMealsKey(userId), JSON.stringify(next));
  return next;
}

export async function removeSavedNutritionMeal(userId: string, mealId: string) {
  const current = await loadSavedNutritionMeals(userId);
  const next = current.filter((item) => item.id !== mealId);
  await appSecureStore.setItem(getSavedMealsKey(userId), JSON.stringify(next));
  return next;
}

export async function loadNutritionPreferences(userId: string): Promise<NutritionPreferences | null> {
  try {
    const raw = await appSecureStore.getItem(getPreferencesKey(userId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;
    return normalizeNutritionState(parsed);
  } catch {
    return null;
  }
}

export async function saveNutritionPreferences(userId: string, preferences: Omit<NutritionPreferences, "updatedAt">) {
  const next: NutritionPreferences = {
    ...preferences,
    updatedAt: new Date().toISOString(),
  };
  await appSecureStore.setItem(getPreferencesKey(userId), JSON.stringify(next));
  return next;
}

export async function loadFoodAnalysisUsage(userId: string, dateKey: string) {
  try {
    const raw = await appSecureStore.getItem(getFoodAnalysisUsageKey(userId, dateKey));
    const parsed = raw ? Number(raw) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

export async function incrementFoodAnalysisUsage(userId: string, dateKey: string) {
  const current = await loadFoodAnalysisUsage(userId, dateKey);
  const next = current + 1;
  await appSecureStore.setItem(getFoodAnalysisUsageKey(userId, dateKey), String(next));
  return next;
}
