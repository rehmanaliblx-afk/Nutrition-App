import { getDatabase } from './database';

export interface BodyMeasurement {
  id: number;
  date: string;
  weightKg: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  bicepsCm: number | null;
  thighsCm: number | null;
  calvesCm: number | null;
  shouldersCm: number | null;
  bodyFatPct: number | null;
  photoPath: string | null;
  notes: string | null;
  createdAt: string;
}

interface BodyMeasurementRow {
  id: number;
  date: string;
  weight_kg: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  biceps_cm: number | null;
  thighs_cm: number | null;
  calves_cm: number | null;
  shoulders_cm: number | null;
  body_fat_pct: number | null;
  photo_path: string | null;
  notes: string | null;
  created_at: string;
}

function rowToMeasurement(row: BodyMeasurementRow): BodyMeasurement {
  return {
    id: row.id,
    date: row.date,
    weightKg: row.weight_kg,
    chestCm: row.chest_cm,
    waistCm: row.waist_cm,
    hipsCm: row.hips_cm,
    bicepsCm: row.biceps_cm,
    thighsCm: row.thighs_cm,
    calvesCm: row.calves_cm,
    shouldersCm: row.shoulders_cm,
    bodyFatPct: row.body_fat_pct,
    photoPath: row.photo_path,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export async function upsertMeasurement(
  m: Omit<BodyMeasurement, 'id' | 'createdAt'>
): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `INSERT INTO body_measurements
      (date, weight_kg, chest_cm, waist_cm, hips_cm, biceps_cm, thighs_cm, calves_cm, shoulders_cm, body_fat_pct, photo_path, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       weight_kg    = excluded.weight_kg,
       chest_cm     = excluded.chest_cm,
       waist_cm     = excluded.waist_cm,
       hips_cm      = excluded.hips_cm,
       biceps_cm    = excluded.biceps_cm,
       thighs_cm    = excluded.thighs_cm,
       calves_cm    = excluded.calves_cm,
       shoulders_cm = excluded.shoulders_cm,
       body_fat_pct = excluded.body_fat_pct,
       photo_path   = excluded.photo_path,
       notes        = excluded.notes`,
    [
      m.date,
      m.weightKg,
      m.chestCm,
      m.waistCm,
      m.hipsCm,
      m.bicepsCm,
      m.thighsCm,
      m.calvesCm,
      m.shouldersCm,
      m.bodyFatPct,
      m.photoPath,
      m.notes,
    ]
  );
}

export async function getMeasurements(limit = 50): Promise<BodyMeasurement[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<BodyMeasurementRow>(
    'SELECT * FROM body_measurements ORDER BY date DESC LIMIT ?',
    [limit]
  );
  return rows.map(rowToMeasurement);
}

export async function getMeasurementByDate(date: string): Promise<BodyMeasurement | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<BodyMeasurementRow>(
    'SELECT * FROM body_measurements WHERE date = ?',
    [date]
  );
  return row ? rowToMeasurement(row) : null;
}

export async function getLatestMeasurement(): Promise<BodyMeasurement | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<BodyMeasurementRow>(
    'SELECT * FROM body_measurements ORDER BY date DESC LIMIT 1'
  );
  return row ? rowToMeasurement(row) : null;
}

export async function deleteMeasurement(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM body_measurements WHERE id = ?', [id]);
}
