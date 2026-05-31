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
    plan: item.plan ?? null,
    savedAt: typeof item.savedAt === "string" ? item.savedAt : new Date().toISOString(),
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

    const parsed = JSON.parse(raw) as Partial<NutritionPreferences>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return {
      goal: normalizeGoal(parsed.goal),
      dietStyle: normalizeDietStyle(parsed.dietStyle),
      dislikedFoods: typeof parsed.dislikedFoods === "string" ? parsed.dislikedFoods : "",
      dietaryFilters: Array.isArray(parsed.dietaryFilters)
        ? parsed.dietaryFilters.filter((item): item is string => typeof item === "string")
        : [],
      prepPreference: normalizePrepPreference(parsed.prepPreference),
      budgetPreference: typeof parsed.budgetPreference === "string" ? parsed.budgetPreference : "Budget-friendly",
      currentMealPlan: parsed.currentMealPlan ?? null,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
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
