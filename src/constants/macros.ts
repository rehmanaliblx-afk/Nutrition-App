export const KCAL_PER_GRAM_CARBS = 4;
export const KCAL_PER_GRAM_PROTEIN = 4;
export const KCAL_PER_GRAM_FAT = 9;

export const DEFAULT_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealType = string;

export const MEAL_TYPES = [...DEFAULT_MEAL_TYPES] as string[];

export const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export const MACRO_COLORS = {
  kcal: '#FF6B6B',
  protein: '#4ECDC4',
  carbs: '#45B7D1',
  fat: '#FFA07A',
  sugar: '#FFD93D',
  complex_carb: '#6BCB77',
  fiber: '#4D96FF',
  saturated: '#C77DFF',
  mono_poly: '#9D4EDD',
  trans: '#E63946',
} as const;

export const FOOD_TYPES = ['ingredient', 'recipe'] as const;
export type FoodType = (typeof FOOD_TYPES)[number];
