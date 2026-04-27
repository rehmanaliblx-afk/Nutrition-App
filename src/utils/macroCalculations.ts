import { KCAL_PER_GRAM_CARBS, KCAL_PER_GRAM_FAT, KCAL_PER_GRAM_PROTEIN } from '@/constants/macros';

export interface MacroSet {
  carbs_total: number;
  carbs_sugar: number;
  carbs_complex: number;
  carbs_fiber: number;
  protein: number;
  fat_total: number;
  fat_unsaturated: number;
  fat_mono_poly: number;
  fat_trans: number;
}

export const EMPTY_MACROS: MacroSet = {
  carbs_total: 0,
  carbs_sugar: 0,
  carbs_complex: 0,
  carbs_fiber: 0,
  protein: 0,
  fat_total: 0,
  fat_unsaturated: 0,
  fat_mono_poly: 0,
  fat_trans: 0,
};

export function calcKcal(macros: MacroSet): number {
  return (
    macros.carbs_total * KCAL_PER_GRAM_CARBS +
    macros.protein * KCAL_PER_GRAM_PROTEIN +
    macros.fat_total * KCAL_PER_GRAM_FAT
  );
}

/** Scale ingredient macros (stored per 100g) to actual grams consumed */
export function scaleIngredientMacros(macros: MacroSet, grams: number): MacroSet {
  const factor = grams / 100;
  return {
    carbs_total: macros.carbs_total * factor,
    carbs_sugar: macros.carbs_sugar * factor,
    carbs_complex: macros.carbs_complex * factor,
    carbs_fiber: macros.carbs_fiber * factor,
    protein: macros.protein * factor,
    fat_total: macros.fat_total * factor,
    fat_unsaturated: macros.fat_unsaturated * factor,
    fat_mono_poly: macros.fat_mono_poly * factor,
    fat_trans: macros.fat_trans * factor,
  };
}

/** Aggregate macros for a full recipe (returns macros for the entire recipe weight) */
export function calcRecipeMacros(
  riRows: Array<{ grams: number; ingredient_macros: MacroSet }>
): MacroSet {
  return riRows.reduce(
    (acc, row) => sumMacros([acc, scaleIngredientMacros(row.ingredient_macros, row.grams)]),
    { ...EMPTY_MACROS }
  );
}

/** Scale recipe macros to a portion of the recipe by weight */
export function scaleRecipeMacros(
  recipeMacros: MacroSet,
  totalRecipeGrams: number,
  portionGrams: number
): MacroSet {
  if (totalRecipeGrams === 0) return { ...EMPTY_MACROS };
  const factor = portionGrams / totalRecipeGrams;
  return {
    carbs_total: recipeMacros.carbs_total * factor,
    carbs_sugar: recipeMacros.carbs_sugar * factor,
    carbs_complex: recipeMacros.carbs_complex * factor,
    carbs_fiber: recipeMacros.carbs_fiber * factor,
    protein: recipeMacros.protein * factor,
    fat_total: recipeMacros.fat_total * factor,
    fat_unsaturated: recipeMacros.fat_unsaturated * factor,
    fat_mono_poly: recipeMacros.fat_mono_poly * factor,
    fat_trans: recipeMacros.fat_trans * factor,
  };
}

/** Sum an array of MacroSets into one */
export function sumMacros(entries: MacroSet[]): MacroSet {
  return entries.reduce(
    (acc, m) => ({
      carbs_total: acc.carbs_total + m.carbs_total,
      carbs_sugar: acc.carbs_sugar + m.carbs_sugar,
      carbs_complex: acc.carbs_complex + m.carbs_complex,
      carbs_fiber: acc.carbs_fiber + m.carbs_fiber,
      protein: acc.protein + m.protein,
      fat_total: acc.fat_total + m.fat_total,
      fat_unsaturated: acc.fat_unsaturated + m.fat_unsaturated,
      fat_mono_poly: acc.fat_mono_poly + m.fat_mono_poly,
      fat_trans: acc.fat_trans + m.fat_trans,
    }),
    { ...EMPTY_MACROS }
  );
}

export function roundMacro(value: number, decimals = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
