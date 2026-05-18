import { getDatabase } from './database';
import { MealSlot } from './schema';

export async function getAllMealSlots(): Promise<MealSlot[]> {
  const db = getDatabase();
  return db.getAllAsync<MealSlot>('SELECT * FROM meal_slots ORDER BY sort_order ASC');
}

export async function createMealSlot(display_name: string, emoji: string): Promise<void> {
  const db = getDatabase();
  const name = display_name.trim().toLowerCase().replace(/\s+/g, '_');
  const maxOrder = await db.getFirstAsync<{ max: number }>('SELECT COALESCE(MAX(sort_order), 0) as max FROM meal_slots');
  await db.runAsync(
    'INSERT INTO meal_slots (name, display_name, emoji, sort_order) VALUES (?, ?, ?, ?)',
    [name, display_name.trim(), emoji, (maxOrder?.max ?? 0) + 1]
  );
}

export async function updateMealSlot(id: number, display_name: string, emoji: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    'UPDATE meal_slots SET display_name = ?, emoji = ? WHERE id = ?',
    [display_name.trim(), emoji, id]
  );
}

export async function deleteMealSlot(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM meal_slots WHERE id = ?', [id]);
}

export async function reorderMealSlots(ids: number[]): Promise<void> {
  const db = getDatabase();
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < ids.length; i++) {
      await db.runAsync('UPDATE meal_slots SET sort_order = ? WHERE id = ?', [i, ids[i]]);
    }
  });
}

export async function getAppSetting(key: string): Promise<string | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

export async function setAppSetting(key: string, value: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value]
  );
}
