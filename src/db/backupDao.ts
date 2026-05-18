import { getDatabase } from './database';

type SqlVal = string | number | null;
type Row = Record<string, SqlVal>;

export interface BackupData {
  version: number;
  exported_at: string;
  ingredients: Row[];
  recipes: Row[];
  recipe_ingredients: Row[];
  daily_goals: Row[];
  meal_entries: Row[];
  water_entries: Row[];
  weight_entries: Row[];
  goal_templates: Row[];
}

export async function exportAllData(): Promise<BackupData> {
  const db = getDatabase();
  const [ingredients, recipes, recipe_ingredients, daily_goals, meal_entries, water_entries, weight_entries, goal_templates] =
    await Promise.all([
      db.getAllAsync<Row>('SELECT * FROM ingredients'),
      db.getAllAsync<Row>('SELECT * FROM recipes'),
      db.getAllAsync<Row>('SELECT * FROM recipe_ingredients'),
      db.getAllAsync<Row>('SELECT * FROM daily_goals'),
      db.getAllAsync<Row>('SELECT * FROM meal_entries'),
      db.getAllAsync<Row>('SELECT * FROM water_entries'),
      db.getAllAsync<Row>('SELECT * FROM weight_entries'),
      db.getAllAsync<Row>('SELECT * FROM goal_templates'),
    ]);
  return {
    version: 1,
    exported_at: new Date().toISOString(),
    ingredients,
    recipes,
    recipe_ingredients,
    daily_goals,
    meal_entries,
    water_entries,
    weight_entries,
    goal_templates,
  };
}

export async function importAllData(data: BackupData): Promise<void> {
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

    for (const r of data.ingredients) {
      await db.runAsync(
        'INSERT INTO ingredients (id,name,carbs_total,carbs_sugar,carbs_complex,carbs_fiber,protein,fat_total,fat_unsaturated,fat_mono_poly,fat_trans,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [r.id, r.name, r.carbs_total, r.carbs_sugar, r.carbs_complex, r.carbs_fiber, r.protein, r.fat_total, r.fat_unsaturated, r.fat_mono_poly, r.fat_trans, r.created_at, r.updated_at]
      );
    }
    for (const r of data.recipes) {
      await db.runAsync(
        'INSERT INTO recipes (id,name,description,created_at,updated_at) VALUES (?,?,?,?,?)',
        [r.id, r.name, r.description, r.created_at, r.updated_at]
      );
    }
    for (const r of data.recipe_ingredients) {
      await db.runAsync(
        'INSERT INTO recipe_ingredients (id,recipe_id,ingredient_id,grams) VALUES (?,?,?,?)',
        [r.id, r.recipe_id, r.ingredient_id, r.grams]
      );
    }
    for (const r of data.daily_goals) {
      await db.runAsync(
        'INSERT INTO daily_goals (id,date,kcal_goal,protein_goal,carbs_goal,fat_goal,water_goal_ml,created_at) VALUES (?,?,?,?,?,?,?,?)',
        [r.id, r.date, r.kcal_goal, r.protein_goal, r.carbs_goal, r.fat_goal, (r.water_goal_ml ?? 2000) as SqlVal, r.created_at]
      );
    }
    for (const r of data.meal_entries) {
      await db.runAsync(
        'INSERT INTO meal_entries (id,date,meal_type,food_type,food_id,grams,created_at) VALUES (?,?,?,?,?,?,?)',
        [r.id, r.date, r.meal_type, r.food_type, r.food_id, r.grams, r.created_at]
      );
    }
    for (const r of data.water_entries) {
      await db.runAsync(
        'INSERT INTO water_entries (id,date,amount_ml,created_at) VALUES (?,?,?,?)',
        [r.id, r.date, r.amount_ml, r.created_at]
      );
    }
    for (const r of data.weight_entries) {
      await db.runAsync(
        'INSERT INTO weight_entries (id,date,weight_kg,note,created_at) VALUES (?,?,?,?,?)',
        [r.id, r.date, r.weight_kg, r.note, r.created_at]
      );
    }
    for (const r of data.goal_templates) {
      await db.runAsync(
        'INSERT INTO goal_templates (id,name,kcal_goal,protein_goal,carbs_goal,fat_goal,water_goal_ml) VALUES (?,?,?,?,?,?,?)',
        [r.id, r.name, r.kcal_goal, r.protein_goal, r.carbs_goal, r.fat_goal, (r.water_goal_ml ?? 2000) as SqlVal]
      );
    }
  });
}
