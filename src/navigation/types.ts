export type NutritionStackParamList = {
  Dashboard: undefined;
  // Tracking
  DailyLog: { date?: string };
  AddMealEntry: { date: string; mealType: string };
  // Ingredients
  IngredientList: undefined;
  IngredientForm: { ingredientId?: number };
  // Recipes
  RecipeList: undefined;
  RecipeDetail: { recipeId: number };
  RecipeForm: { recipeId?: number };
  // More / Settings
  SettingsHome: undefined;
  History: undefined;
  Backup: undefined;
  ManageMeals: undefined;
  Micronutrients: undefined;
  MicronutrientDetail: { id: string };
  Supplements: undefined;
  SupplementForm: { supplementId?: number };
  SupplementDetail: { supplementId: number };
  // Body & Meal planning
  BodyMeasurements: undefined;
  MealTemplates: undefined;
  WeeklyReport: undefined;
  MacroRecommendations: undefined;
  AdaptiveTDEE: undefined;
};

export type WorkoutStackParamList = {
  ExerciseLibrary: undefined;
  ExerciseDetail: { exerciseId: string };
  WorkoutPlans: undefined;
  WorkoutPlanDetail: { planId: number };
  WorkoutPlanForm: { planId?: number };
  WeightLog: undefined;
  WorkoutSession: { planId?: number; planName?: string } | undefined;
  WorkoutHistory: undefined;
  ExerciseProgress: { exerciseId: string; exerciseName: string };
  WorkoutGenerator: undefined;
  OneRMCalculator: undefined;
  RecoveryInsights: undefined;
};

export type RootDrawerParamList = {
  Nutrition: undefined;
  Workout: undefined;
};

// Backwards-compat aliases so existing screens compile without changes
export type MoreStackParamList = NutritionStackParamList;
export type TrackingStackParamList = NutritionStackParamList;
export type IngredientsStackParamList = NutritionStackParamList;
export type RecipesStackParamList = NutritionStackParamList;

// Legacy — was imported from here before moving to macros.ts
export type { MealType } from '@/constants/macros';
