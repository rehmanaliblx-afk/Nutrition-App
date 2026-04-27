import { useState, useCallback } from 'react';
import {
  getAllIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  searchIngredients,
} from '@/db/ingredientsDao';
import { Ingredient, IngredientInput } from '@/db/schema';
import { useDatabase } from '@/context/DatabaseContext';

export function useIngredients() {
  const { isReady } = useDatabase();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isReady) return;
    setLoading(true);
    try {
      const data = await getAllIngredients();
      setIngredients(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [isReady]);

  const search = useCallback(async (query: string) => {
    if (!isReady) return [];
    try {
      return await searchIngredients(query);
    } catch {
      return [];
    }
  }, [isReady]);

  const create = useCallback(async (input: IngredientInput): Promise<number> => {
    const id = await createIngredient(input);
    await load();
    return id;
  }, [load]);

  const update = useCallback(async (id: number, input: IngredientInput): Promise<void> => {
    await updateIngredient(id, input);
    await load();
  }, [load]);

  const remove = useCallback(async (id: number): Promise<void> => {
    await deleteIngredient(id);
    await load();
  }, [load]);

  return { ingredients, loading, error, load, search, create, update, remove };
}
