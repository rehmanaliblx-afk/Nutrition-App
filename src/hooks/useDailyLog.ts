import { useState, useCallback } from 'react';
import { getMealEntriesForDate, addMealEntry, deleteMealEntry } from '@/db/trackingDao';
import { getIngredientById } from '@/db/ingredientsDao';
import { getRecipeIngredients } from '@/db/recipesDao';
import { MealEntry, MealEntryInput } from '@/db/schema';
import { MealType, MEAL_TYPES } from '@/constants/macros';
import {
  MacroSet,
  EMPTY_MACROS,
  scaleIngredientMacros,
  calcRecipeMacros,
  scaleRecipeMacros,
  sumMacros,
  calcKcal,
} from '@/utils/macroCalculations';

export interface ResolvedEntry {
  entry: MealEntry;
  name: string;
  macros: MacroSet;
  kcal: number;
}

export interface DailyLogData {
  entries: Record<MealType, ResolvedEntry[]>;
  totals: MacroSet;
  totalKcal: number;
}

async function resolveEntry(entry: MealEntry): Promise<ResolvedEntry> {
  if (entry.food_type === 'ingredient') {
    const ingredient = await getIngredientById(entry.food_id);
    if (!ingredient) {
      return { entry, name: 'Unknown', macros: EMPTY_MACROS, kcal: 0 };
    }
    const macros = scaleIngredientMacros(ingredient, entry.grams);
    return { entry, name: ingredient.name, macros, kcal: calcKcal(macros) };
  } else {
    const riRows = await getRecipeIngredients(entry.food_id);
    const ingredient_macros_list = riRows.map((ri) => ({
      grams: ri.grams,
      ingredient_macros: {
        carbs_total: ri.carbs_total,
        carbs_sugar: ri.carbs_sugar,
        carbs_complex: ri.carbs_complex,
        carbs_fiber: ri.carbs_fiber,
        protein: ri.protein,
        fat_total: ri.fat_total,
        fat_unsaturated: ri.fat_unsaturated,
        fat_mono_poly: ri.fat_mono_poly,
        fat_trans: ri.fat_trans,
      },
    }));
    const recipeTotalMacros = calcRecipeMacros(ingredient_macros_list);
    const totalRecipeGrams = riRows.reduce((s, r) => s + r.grams, 0);
    const macros = scaleRecipeMacros(recipeTotalMacros, totalRecipeGrams, entry.grams);
    const { getRecipeById } = await import('@/db/recipesDao');
    const recipe = await getRecipeById(entry.food_id);
    return { entry, name: recipe?.name ?? 'Unknown Recipe', macros, kcal: calcKcal(macros) };
  }
}

export function useDailyLog() {
  const [data, setData] = useState<DailyLogData>({
    entries: { breakfast: [], lunch: [], dinner: [], snack: [] },
    totals: EMPTY_MACROS,
    totalKcal: 0,
  });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const rawEntries = await getMealEntriesForDate(date);
      const resolved = await Promise.all(rawEntries.map(resolveEntry));

      const grouped: Record<MealType, ResolvedEntry[]> = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
      };
      for (const re of resolved) {
        grouped[re.entry.meal_type].push(re);
      }

      const allMacros = resolved.map((re) => re.macros);
      const totals = allMacros.length > 0 ? sumMacros(allMacros) : EMPTY_MACROS;
      const totalKcal = resolved.reduce((s, re) => s + re.kcal, 0);

      setData({ entries: grouped, totals, totalKcal });
    } finally {
      setLoading(false);
    }
  }, []);

  const addEntry = useCallback(
    async (input: MealEntryInput, date: string) => {
      await addMealEntry(input);
      await load(date);
    },
    [load]
  );

  const removeEntry = useCallback(
    async (id: number, date: string) => {
      await deleteMealEntry(id);
      await load(date);
    },
    [load]
  );

  return { data, loading, load, addEntry, removeEntry };
}
