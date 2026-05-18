import { getDatabase } from './database';

export interface WorkoutSession {
  id: number;
  planId: number | null;
  planName: string | null;
  startedAt: string;
  endedAt: string | null;
  durationSec: number | null;
  totalSets: number;
  notes: string | null;
  createdAt: string;
}

export interface SessionSet {
  id: number;
  sessionId: number;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  completed: boolean;
  notes: string | null;
  createdAt: string;
}

export interface SessionWithSets extends WorkoutSession {
  sets: SessionSet[];
}

export interface PersonalRecord {
  weightKg: number;
  reps: number;
  estimatedOneRM: number;
  date: string;
}

// Raw DB row types (snake_case from SQLite)
interface WorkoutSessionRow {
  id: number;
  plan_id: number | null;
  plan_name: string | null;
  started_at: string;
  ended_at: string | null;
  duration_sec: number | null;
  total_sets: number;
  notes: string | null;
  created_at: string;
}

interface SessionSetRow {
  id: number;
  session_id: number;
  exercise_id: string;
  exercise_name: string;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  completed: number;
  notes: string | null;
  created_at: string;
}

function rowToSession(row: WorkoutSessionRow): WorkoutSession {
  return {
    id: row.id,
    planId: row.plan_id,
    planName: row.plan_name,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationSec: row.duration_sec,
    totalSets: row.total_sets,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function rowToSet(row: SessionSetRow): SessionSet {
  return {
    id: row.id,
    sessionId: row.session_id,
    exerciseId: row.exercise_id,
    exerciseName: row.exercise_name,
    setNumber: row.set_number,
    weightKg: row.weight_kg,
    reps: row.reps,
    completed: row.completed === 1,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export async function createSession(
  planId: number | null,
  planName: string | null
): Promise<number> {
  const db = getDatabase();
  const result = await db.runAsync(
    'INSERT INTO workout_sessions (plan_id, plan_name, started_at) VALUES (?, ?, ?)',
    [planId, planName, new Date().toISOString()]
  );
  return result.lastInsertRowId;
}

export async function endSession(
  id: number,
  durationSec: number,
  totalSets: number
): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    'UPDATE workout_sessions SET ended_at = ?, duration_sec = ?, total_sets = ? WHERE id = ?',
    [new Date().toISOString(), durationSec, totalSets, id]
  );
}

export async function addSessionSet(
  sessionId: number,
  exerciseId: string,
  exerciseName: string,
  setNumber: number,
  weightKg: number | null,
  reps: number | null
): Promise<number> {
  const db = getDatabase();
  const result = await db.runAsync(
    `INSERT INTO workout_session_sets
      (session_id, exercise_id, exercise_name, set_number, weight_kg, reps)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [sessionId, exerciseId, exerciseName, setNumber, weightKg, reps]
  );
  return result.lastInsertRowId;
}

export async function updateSessionSet(
  id: number,
  weightKg: number | null,
  reps: number | null,
  completed: boolean
): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    'UPDATE workout_session_sets SET weight_kg = ?, reps = ?, completed = ? WHERE id = ?',
    [weightKg, reps, completed ? 1 : 0, id]
  );
}

export async function deleteSessionSet(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM workout_session_sets WHERE id = ?', [id]);
}

export async function getRecentSessions(limit = 20): Promise<WorkoutSession[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<WorkoutSessionRow>(
    'SELECT * FROM workout_sessions ORDER BY started_at DESC LIMIT ?',
    [limit]
  );
  return rows.map(rowToSession);
}

export async function getSessionById(id: number): Promise<SessionWithSets | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<WorkoutSessionRow>(
    'SELECT * FROM workout_sessions WHERE id = ?',
    [id]
  );
  if (!row) return null;
  const setRows = await db.getAllAsync<SessionSetRow>(
    'SELECT * FROM workout_session_sets WHERE session_id = ? ORDER BY exercise_id, set_number',
    [id]
  );
  return { ...rowToSession(row), sets: setRows.map(rowToSet) };
}

export async function getExerciseHistory(
  exerciseId: string,
  limit = 10
): Promise<Array<{ date: string; sets: SessionSet[] }>> {
  const db = getDatabase();
  const sessions = await db.getAllAsync<WorkoutSessionRow>(
    `SELECT DISTINCT ws.* FROM workout_sessions ws
     INNER JOIN workout_session_sets wss ON wss.session_id = ws.id
     WHERE wss.exercise_id = ?
     ORDER BY ws.started_at DESC
     LIMIT ?`,
    [exerciseId, limit]
  );

  const result: Array<{ date: string; sets: SessionSet[] }> = [];
  for (const session of sessions) {
    const setRows = await db.getAllAsync<SessionSetRow>(
      'SELECT * FROM workout_session_sets WHERE session_id = ? AND exercise_id = ? ORDER BY set_number',
      [session.id, exerciseId]
    );
    result.push({
      date: session.started_at.slice(0, 10),
      sets: setRows.map(rowToSet),
    });
  }
  return result;
}

export async function getPersonalRecord(exerciseId: string): Promise<PersonalRecord | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<SessionSetRow & { started_at: string }>(
    `SELECT wss.*, ws.started_at
     FROM workout_session_sets wss
     INNER JOIN workout_sessions ws ON ws.id = wss.session_id
     WHERE wss.exercise_id = ? AND wss.completed = 1 AND wss.weight_kg IS NOT NULL AND wss.reps IS NOT NULL
     ORDER BY wss.weight_kg DESC, wss.reps DESC
     LIMIT 1`,
    [exerciseId]
  );
  if (!row || row.weight_kg == null || row.reps == null) return null;
  const estimatedOneRM = row.weight_kg * (1 + row.reps / 30);
  return {
    weightKg: row.weight_kg,
    reps: row.reps,
    estimatedOneRM,
    date: row.started_at.slice(0, 10),
  };
}

export async function deleteSession(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM workout_sessions WHERE id = ?', [id]);
}

export async function getActiveDates(): Promise<string[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<{ date: string }>(
    `SELECT DISTINCT substr(started_at, 1, 10) AS date
     FROM workout_sessions
     WHERE ended_at IS NOT NULL
     ORDER BY date ASC`
  );
  return rows.map((r) => r.date);
}
