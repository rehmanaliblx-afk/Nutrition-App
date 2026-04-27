import { getDatabase } from './database';
import { Recipe, RecipeInput, RecipeIngredientWithDetails } from './schema';

export async function getAllRecipes(): Promise<Recipe[]> {
  const db = getDatabase();
  return db.getAllAsync<Recipe>('SELECT * FROM recipes ORDER BY name ASC');
}

export async function getRecipeById(id: number): Promise<Recipe | null> {
  const db = getDatabase();
  return db.getFirstAsync<Recipe>('SELECT * FROM recipes WHERE id = ?', [id]);
}

export async function createRecipe(
  input: RecipeInput,
  ingredients: Array<{ ingredient_id: number; grams: number }>
): Promise<number> {
  const db = getDatabase();
  let recipeId = 0;

  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      'INSERT INTO recipes (name, description) VALUES (?, ?)',
      [input.name, input.description ?? null]
    );
    recipeId = result.lastInsertRowId;

    for (const ri of ingredients) {
      await db.runAsync(
        'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, grams) VALUES (?, ?, ?)',
        [recipeId, ri.ingredient_id, ri.grams]
      );
    }
  });

  return recipeId;
}

export async function updateRecipe(
  id: number,
  input: RecipeInput,
  ingredients: Array<{ ingredient_id: number; grams: number }>
): Promise<void> {
  const db = getDatabase();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE recipes SET name=?, description=?, updated_at=datetime('now') WHERE id=?`,
      [input.name, input.description ?? null, id]
    );

    await db.runAsync('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [id]);

    for (const ri of ingredients) {
      await db.runAsync(
        'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, grams) VALUES (?, ?, ?)',
        [id, ri.ingredient_id, ri.grams]
      );
    }
  });
}

export async function deleteRecipe(id: number): Promise<void> {
  const db = getDatabase();
  // recipe_ingredients rows are cascade-deleted automatically
  await db.runAsync('DELETE FROM recipes WHERE id = ?', [id]);
}

export async function getRecipeIngredients(recipeId: number): Promise<RecipeIngredientWithDetails[]> {
  const db = getDatabase();
  return db.getAllAsync<RecipeIngredientWithDetails>(
    `SELECT ri.id, ri.recipe_id, ri.ingredient_id, ri.grams,
            i.name AS ingredient_name,
            i.carbs_total, i.carbs_sugar, i.carbs_complex, i.carbs_fiber,
            i.protein,
            i.fat_total, i.fat_unsaturated, i.fat_mono_poly, i.fat_trans
     FROM recipe_ingredients ri
     JOIN ingredients i ON ri.ingredient_id = i.id
     WHERE ri.recipe_id = ?
     ORDER BY i.name ASC`,
    [recipeId]
  );
}

export async function searchRecipes(query: string): Promise<Recipe[]> {
  const db = getDatabase();
  return db.getAllAsync<Recipe>(
    'SELECT * FROM recipes WHERE name LIKE ? ORDER BY name ASC',
    [`%${query}%`]
  );
}
