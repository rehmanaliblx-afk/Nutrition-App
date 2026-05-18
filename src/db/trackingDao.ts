import { getDatabase } from './database';
import { DailyGoal, DailyGoalInput, MealEntry, MealEntryInput, GoalTemplate } from './schema';
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
    `INSERT INTO daily_goals (date, kcal_goal, protein_goal, carbs_goal, fat_goal, water_goal_ml)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       kcal_goal = excluded.kcal_goal,
       protein_goal = excluded.protein_goal,
       carbs_goal = excluded.carbs_goal,
       fat_goal = excluded.fat_goal,
       water_goal_ml = excluded.water_goal_ml`,
    [input.date, input.kcal_goal, input.protein_goal, input.carbs_goal, input.fat_goal, input.water_goal_ml ?? 2000]
  );
}

export async function getRecentFoods(limit = 10): Promise<Array<{ food_type: string; food_id: number }>> {
  const db = getDatabase();
  return db.getAllAsync<{ food_type: string; food_id: number }>(
    `SELECT food_type, food_id FROM meal_entries
     GROUP BY food_type, food_id
     ORDER BY MAX(created_at) DESC
     LIMIT ?`,
    [limit]
  );
}

export async function copyMealEntries(fromDate: string, toDate: string, mealType: MealType): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `INSERT INTO meal_entries (date, meal_type, food_type, food_id, grams)
     SELECT ?, meal_type, food_type, food_id, grams
     FROM meal_entries WHERE date = ? AND meal_type = ?`,
    [toDate, fromDate, mealType]
  );
}

export async function getDailyKcalHistory(days: number): Promise<Array<{ date: string; total_kcal: number }>> {
  const db = getDatabase();
  return db.getAllAsync<{ date: string; total_kcal: number }>(
    `SELECT date, COUNT(*) as entry_count FROM meal_entries
     WHERE date >= date('now', ?)
     GROUP BY date ORDER BY date ASC`,
    [`-${days} days`]
  );
}

export async function getAllGoalTemplates(): Promise<GoalTemplate[]> {
  const db = getDatabase();
  return db.getAllAsync<GoalTemplate>('SELECT * FROM goal_templates ORDER BY name ASC');
}

export async function upsertGoalTemplate(template: Omit<GoalTemplate, 'id'>): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `INSERT INTO goal_templates (name, kcal_goal, protein_goal, carbs_goal, fat_goal, water_goal_ml)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(name) DO UPDATE SET
       kcal_goal = excluded.kcal_goal,
       protein_goal = excluded.protein_goal,
       carbs_goal = excluded.carbs_goal,
       fat_goal = excluded.fat_goal,
       water_goal_ml = excluded.water_goal_ml`,
    [template.name, template.kcal_goal, template.protein_goal, template.carbs_goal, template.fat_goal, template.water_goal_ml]
  );
}

export async function deleteGoalTemplate(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM goal_templates WHERE id = ?', [id]);
}

export async function deleteAllData(): Promise<void> {
  const db = getDatabase();
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM meal_entries');
    await db.execAsync('DELETE FROM water_entries');
    await db.execAsync('DELETE FROM weight_entries');
    await db.execAsync('DELETE FROM goal_templates');
    await db.execAsync('DELETE FROM daily_goals');
    await db.execAsync('DELETE FROM recipe_ingredients');
    await db.execAsync('DELETE FROM recipes');
    await db.execAsync('DELETE FROM ingredients');
  });
}
