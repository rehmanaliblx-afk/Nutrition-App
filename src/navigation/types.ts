import { MealType } from '@/constants/macros';

export type RootTabParamList = {
  Dashboard: undefined;
  Log: undefined;
  Ingredients: undefined;
  Recipes: undefined;
  Settings: undefined;
};

export type IngredientsStackParamList = {
  IngredientList: undefined;
  IngredientForm: { ingredientId?: number };
};

export type RecipesStackParamList = {
  RecipeList: undefined;
  RecipeDetail: { recipeId: number };
  RecipeForm: { recipeId?: number };
};

export type TrackingStackParamList = {
  DailyLog: { date?: string };
  AddMealEntry: { date: string; mealType: MealType };
};
