import { getDatabase } from './database';
import { DailyGoal, DailyGoalInput, MealEntry, MealEntryInput } from './schema';
import { MealType } from '@/constants/macros';

export async function getMealEntriesForDate(date: string): Promise<MealEntry[]> {
  const db = getDatabase();
  return db.getAllAsync<MealEntry>(
    'SELECT * FROM meal_entries WHERE date = ? ORDER BY created_at ASC',
    [date]
  );
}

export async function getMealEntriesByMealType(date: string, mealType: MealType): Promise<MealEntry[]> {
  const db = getDatabase();
  return db.getAllAsync<MealEntry>(
    'SELECT * FROM meal_entries WHERE date = ? AND meal_type = ? ORDER BY created_at ASC',
    [date, mealType]
  );
}

export async function addMealEntry(input: MealEntryInput): Promise<number> {
  const db = getDatabase();
  const result = await db.runAsync(
    'INSERT INTO meal_entries (date, meal_type, food_type, food_id, grams) VALUES (?, ?, ?, ?, ?)',
    [input.date, input.meal_type, input.food_type, input.food_id, input.grams]
  );
  return result.lastInsertRowId;
}

export async function updateMealEntry(id: number, grams: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('UPDATE meal_entries SET grams = ? WHERE id = ?', [grams, id]);
}

export async function deleteMealEntry(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM meal_entries WHERE id = ?', [id]);
}

/** Returns the most recently set goal on or before the given date */
export async function getGoalForDate(date: string): Promise<DailyGoal | null> {
  const db = getDatabase();
  return db.getFirstAsync<DailyGoal>(
    'SELECT * FROM daily_goals WHERE date <= ? ORDER BY date DESC LIMIT 1',
    [date]
  );
}

export async function upsertGoal(input: DailyGoalInput): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `INSERT INTO daily_goals (date, kcal_goal, protein_goal, carbs_goal, fat_goal)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       kcal_goal = excluded.kcal_goal,
       protein_goal = excluded.protein_goal,
       carbs_goal = excluded.carbs_goal,
       fat_goal = excluded.fat_goal`,
    [input.date, input.kcal_goal, input.protein_goal, input.carbs_goal, input.fat_goal]
  );
}

export async function deleteAllData(): Promise<void> {
  const db = getDatabase();
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM meal_entries');
    await db.execAsync('DELETE FROM daily_goals');
    await db.execAsync('DELETE FROM recipe_ingredients');
    await db.execAsync('DELETE FROM recipes');
    await db.execAsync('DELETE FROM ingredients');
  });
}
