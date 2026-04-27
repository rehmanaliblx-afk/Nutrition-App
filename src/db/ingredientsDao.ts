import { getDatabase } from './database';
import { Ingredient, IngredientInput } from './schema';

export async function getAllIngredients(): Promise<Ingredient[]> {
  const db = getDatabase();
  return db.getAllAsync<Ingredient>('SELECT * FROM ingredients ORDER BY name ASC');
}

export async function getIngredientById(id: number): Promise<Ingredient | null> {
  const db = getDatabase();
  return db.getFirstAsync<Ingredient>('SELECT * FROM ingredients WHERE id = ?', [id]);
}

export async function createIngredient(input: IngredientInput): Promise<number> {
  const db = getDatabase();
  const result = await db.runAsync(
    `INSERT INTO ingredients (name, carbs_total, carbs_sugar, carbs_complex, carbs_fiber,
      protein, fat_total, fat_unsaturated, fat_mono_poly, fat_trans)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.name,
      input.carbs_total,
      input.carbs_sugar,
      input.carbs_complex,
      input.carbs_fiber,
      input.protein,
      input.fat_total,
      input.fat_unsaturated,
      input.fat_mono_poly,
      input.fat_trans,
    ]
  );
  return result.lastInsertRowId;
}

export async function updateIngredient(id: number, input: IngredientInput): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `UPDATE ingredients SET name=?, carbs_total=?, carbs_sugar=?, carbs_complex=?, carbs_fiber=?,
      protein=?, fat_total=?, fat_unsaturated=?, fat_mono_poly=?, fat_trans=?,
      updated_at=datetime('now')
     WHERE id=?`,
    [
      input.name,
      input.carbs_total,
      input.carbs_sugar,
      input.carbs_complex,
      input.carbs_fiber,
      input.protein,
      input.fat_total,
      input.fat_unsaturated,
      input.fat_mono_poly,
      input.fat_trans,
      id,
    ]
  );
}

export async function deleteIngredient(id: number): Promise<void> {
  const db = getDatabase();
  // Will throw if ingredient is used in a recipe (RESTRICT foreign key)
  await db.runAsync('DELETE FROM ingredients WHERE id = ?', [id]);
}

export async function searchIngredients(query: string): Promise<Ingredient[]> {
  const db = getDatabase();
  return db.getAllAsync<Ingredient>(
    'SELECT * FROM ingredients WHERE name LIKE ? ORDER BY name ASC',
    [`%${query}%`]
  );
}
