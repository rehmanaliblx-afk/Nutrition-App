import { getDatabase } from './database';
import { WaterEntry } from './schema';

export async function getWaterEntriesForDate(date: string): Promise<WaterEntry[]> {
  const db = getDatabase();
  return db.getAllAsync<WaterEntry>(
    'SELECT * FROM water_entries WHERE date = ? ORDER BY created_at ASC',
    [date]
  );
}

export async function getWaterTotalForDate(date: string): Promise<number> {
  const db = getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(amount_ml), 0) as total FROM water_entries WHERE date = ?',
    [date]
  );
  return row?.total ?? 0;
}

export async function addWaterEntry(date: string, amount_ml: number): Promise<number> {
  const db = getDatabase();
  const result = await db.runAsync(
    'INSERT INTO water_entries (date, amount_ml) VALUES (?, ?)',
    [date, amount_ml]
  );
  return result.lastInsertRowId;
}

export async function deleteWaterEntry(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM water_entries WHERE id = ?', [id]);
}

export async function getWaterHistoryForRange(startDate: string, endDate: string): Promise<Array<{ date: string; total_ml: number }>> {
  const db = getDatabase();
  return db.getAllAsync<{ date: string; total_ml: number }>(
    `SELECT date, SUM(amount_ml) as total_ml FROM water_entries
     WHERE date >= ? AND date <= ?
     GROUP BY date ORDER BY date ASC`,
    [startDate, endDate]
  );
}
