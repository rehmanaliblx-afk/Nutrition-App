import { useState, useCallback } from 'react';
import {
  getAllRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipeIngredients,
  searchRecipes,
} from '@/db/recipesDao';
import { Recipe, RecipeInput, RecipeIngredientWithDetails } from '@/db/schema';
import { useDatabase } from '@/context/DatabaseContext';

export function useRecipes() {
  const { isReady } = useDatabase();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isReady) return;
    setLoading(true);
    try {
      const data = await getAllRecipes();
      setRecipes(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [isReady]);

  const search = useCallback(async (query: string) => {
    if (!isReady) return [];
    try {
      return await searchRecipes(query);
    } catch {
      return [];
    }
  }, [isReady]);

  const loadIngredients = useCallback(
    async (recipeId: number): Promise<RecipeIngredientWithDetails[]> => {
      try {
        return await getRecipeIngredients(recipeId);
      } catch {
        return [];
      }
    },
    []
  );

  const create = useCallback(
    async (
      input: RecipeInput,
      ingredients: Array<{ ingredient_id: number; grams: number }>
    ): Promise<number> => {
      const id = await createRecipe(input, ingredients);
      await load();
      return id;
    },
    [load]
  );

  const update = useCallback(
    async (
      id: number,
      input: RecipeInput,
      ingredients: Array<{ ingredient_id: number; grams: number }>
    ): Promise<void> => {
      await updateRecipe(id, input, ingredients);
      await load();
    },
    [load]
  );

  const remove = useCallback(
    async (id: number): Promise<void> => {
      await deleteRecipe(id);
      await load();
    },
    [load]
  );

  return { recipes, loading, error, load, search, loadIngredients, create, update, remove };
}
