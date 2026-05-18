import { getDatabase } from './database';

export interface MealTemplate {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface MealTemplateEntry {
  id: number;
  templateId: number;
  mealType: string;
  foodType: string;
  foodId: number;
  foodName: string;
  grams: number;
}

export interface MealTemplateWithEntries extends MealTemplate {
  entries: MealTemplateEntry[];
}

interface MealTemplateRow {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

interface MealTemplateEntryRow {
  id: number;
  template_id: number;
  meal_type: string;
  food_type: string;
  food_id: number;
  food_name: string;
  grams: number;
}

function rowToTemplate(row: MealTemplateRow): MealTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
  };
}

function rowToEntry(row: MealTemplateEntryRow): MealTemplateEntry {
  return {
    id: row.id,
    templateId: row.template_id,
    mealType: row.meal_type,
    foodType: row.food_type,
    foodId: row.food_id,
    foodName: row.food_name,
    grams: row.grams,
  };
}

export async function getAllTemplates(): Promise<MealTemplate[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<MealTemplateRow>(
    'SELECT * FROM meal_templates ORDER BY name ASC'
  );
  return rows.map(rowToTemplate);
}

export async function getTemplateById(id: number): Promise<MealTemplateWithEntries | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<MealTemplateRow>(
    'SELECT * FROM meal_templates WHERE id = ?',
    [id]
  );
  if (!row) return null;
  const entryRows = await db.getAllAsync<MealTemplateEntryRow>(
    'SELECT * FROM meal_template_entries WHERE template_id = ? ORDER BY meal_type, id',
    [id]
  );
  return { ...rowToTemplate(row), entries: entryRows.map(rowToEntry) };
}

export async function createTemplate(
  name: string,
  description: string | null,
  entries: Omit<MealTemplateEntry, 'id' | 'templateId'>[]
): Promise<number> {
  const db = getDatabase();
  const result = await db.runAsync(
    'INSERT INTO meal_templates (name, description) VALUES (?, ?)',
    [name, description]
  );
  const templateId = result.lastInsertRowId;
  for (const entry of entries) {
    await db.runAsync(
      `INSERT INTO meal_template_entries
        (template_id, meal_type, food_type, food_id, food_name, grams)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [templateId, entry.mealType, entry.foodType, entry.foodId, entry.foodName, entry.grams]
    );
  }
  return templateId;
}

export async function deleteTemplate(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM meal_templates WHERE id = ?', [id]);
}
