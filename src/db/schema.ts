import { MealType, FoodType } from '@/constants/macros';

export interface Ingredient {
  id: number;
  name: string;
  carbs_total: number;
  carbs_sugar: number;
  carbs_complex: number;
  carbs_fiber: number;
  protein: number;
  fat_total: number;
  fat_unsaturated: number;
  fat_mono_poly: number;
  fat_trans: number;
  created_at: string;
  updated_at: string;
}

export type IngredientInput = Omit<Ingredient, 'id' | 'created_at' | 'updated_at'>;

export interface Recipe {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type RecipeInput = Omit<Recipe, 'id' | 'created_at' | 'updated_at'>;

export interface RecipeIngredient {
  id: number;
  recipe_id: number;
  ingredient_id: number;
  grams: number;
}

export interface RecipeIngredientWithDetails extends RecipeIngredient {
  ingredient_name: string;
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

export interface DailyGoal {
  id: number;
  date: string;
  kcal_goal: number | null;
  protein_goal: number | null;
  carbs_goal: number | null;
  fat_goal: number | null;
  water_goal_ml: number;
  created_at: string;
}

export type DailyGoalInput = Omit<DailyGoal, 'id' | 'created_at'>;

export interface MealEntry {
  id: number;
  date: string;
  meal_type: MealType;
  food_type: FoodType;
  food_id: number;
  grams: number;
  created_at: string;
}

export type MealEntryInput = Omit<MealEntry, 'id' | 'created_at'>;

export interface WaterEntry {
  id: number;
  date: string;
  amount_ml: number;
  created_at: string;
}

export interface WeightEntry {
  id: number;
  date: string;
  weight_kg: number;
  note: string | null;
  created_at: string;
}

export interface GoalTemplate {
  id: number;
  name: string;
  kcal_goal: number | null;
  protein_goal: number | null;
  carbs_goal: number | null;
  fat_goal: number | null;
  water_goal_ml: number;
}
