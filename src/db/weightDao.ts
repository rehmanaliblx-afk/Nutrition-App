import { getDatabase } from './database';
import { WeightEntry } from './schema';

export async function getWeightForDate(date: string): Promise<WeightEntry | null> {
  const db = getDatabase();
  return db.getFirstAsync<WeightEntry>(
    'SELECT * FROM weight_entries WHERE date = ?',
    [date]
  );
}

export async function upsertWeight(date: string, weight_kg: number, note?: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `INSERT INTO weight_entries (date, weight_kg, note)
     VALUES (?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       weight_kg = excluded.weight_kg,
       note = excluded.note`,
    [date, weight_kg, note ?? null]
  );
}

export async function deleteWeight(date: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM weight_entries WHERE date = ?', [date]);
}

export async function getWeightHistory(limit = 30): Promise<WeightEntry[]> {
  const db = getDatabase();
  return db.getAllAsync<WeightEntry>(
    'SELECT * FROM weight_entries ORDER BY date DESC LIMIT ?',
    [limit]
  );
}

export async function getWeightHistoryForRange(startDate: string, endDate: string): Promise<WeightEntry[]> {
  const db = getDatabase();
  return db.getAllAsync<WeightEntry>(
    'SELECT * FROM weight_entries WHERE date >= ? AND date <= ? ORDER BY date ASC',
    [startDate, endDate]
  );
}
