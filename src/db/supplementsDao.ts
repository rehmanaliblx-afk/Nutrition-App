import { getDatabase } from './database';
import { Supplement, SupplementInput } from './schema';

export async function getAllSupplements(): Promise<Supplement[]> {
  const db = getDatabase();
  return db.getAllAsync<Supplement>(
    'SELECT * FROM supplements ORDER BY created_at DESC'
  );
}

export async function getSupplementById(id: number): Promise<Supplement | null> {
  const db = getDatabase();
  return db.getFirstAsync<Supplement>(
    'SELECT * FROM supplements WHERE id = ?',
    [id]
  );
}

export async function addSupplement(input: SupplementInput): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `INSERT INTO supplements
      (name, role, timing, is_daily, cycling_info, dose, brand_notes, price_info, purchase_url, personal_notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.name,
      input.role,
      input.timing,
      input.is_daily,
      input.cycling_info,
      input.dose,
      input.brand_notes,
      input.price_info,
      input.purchase_url,
      input.personal_notes,
    ]
  );
}

export async function updateSupplement(
  id: number,
  input: SupplementInput
): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `UPDATE supplements SET
      name=?, role=?, timing=?, is_daily=?, cycling_info=?,
      dose=?, brand_notes=?, price_info=?, purchase_url=?, personal_notes=?
     WHERE id=?`,
    [
      input.name,
      input.role,
      input.timing,
      input.is_daily,
      input.cycling_info,
      input.dose,
      input.brand_notes,
      input.price_info,
      input.purchase_url,
      input.personal_notes,
      id,
    ]
  );
}

export async function deleteSupplement(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM supplements WHERE id = ?', [id]);
}
