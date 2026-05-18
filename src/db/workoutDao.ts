import { getDatabase } from './database';

export interface WorkoutPlan {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface WorkoutPlanExercise {
  id: number;
  plan_id: number;
  exercise_id: string;
  sets: number;
  reps: string;
  sort_order: number;
  notes: string | null;
}

export interface WorkoutPlanWithExercises extends WorkoutPlan {
  exercises: WorkoutPlanExercise[];
}

export async function getAllWorkoutPlans(): Promise<WorkoutPlan[]> {
  const db = await getDatabase();
  return db.getAllAsync<WorkoutPlan>('SELECT * FROM workout_plans ORDER BY created_at DESC');
}

export async function getWorkoutPlanById(id: number): Promise<WorkoutPlanWithExercises | null> {
  const db = await getDatabase();
  const plan = await db.getFirstAsync<WorkoutPlan>('SELECT * FROM workout_plans WHERE id = ?', [id]);
  if (!plan) return null;
  const exercises = await db.getAllAsync<WorkoutPlanExercise>(
    'SELECT * FROM workout_plan_exercises WHERE plan_id = ? ORDER BY sort_order',
    [id]
  );
  return { ...plan, exercises };
}

export async function createWorkoutPlan(
  name: string,
  description: string | null,
  exercises: Omit<WorkoutPlanExercise, 'id' | 'plan_id'>[]
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO workout_plans (name, description) VALUES (?, ?)',
    [name, description]
  );
  const planId = result.lastInsertRowId;
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    await db.runAsync(
      'INSERT INTO workout_plan_exercises (plan_id, exercise_id, sets, reps, sort_order, notes) VALUES (?,?,?,?,?,?)',
      [planId, ex.exercise_id, ex.sets, ex.reps, i, ex.notes ?? null]
    );
  }
  return planId;
}

export async function updateWorkoutPlan(
  id: number,
  name: string,
  description: string | null,
  exercises: Omit<WorkoutPlanExercise, 'id' | 'plan_id'>[]
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE workout_plans SET name = ?, description = ? WHERE id = ?', [name, description, id]);
  await db.runAsync('DELETE FROM workout_plan_exercises WHERE plan_id = ?', [id]);
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    await db.runAsync(
      'INSERT INTO workout_plan_exercises (plan_id, exercise_id, sets, reps, sort_order, notes) VALUES (?,?,?,?,?,?)',
      [id, ex.exercise_id, ex.sets, ex.reps, i, ex.notes ?? null]
    );
  }
}

export async function deleteWorkoutPlan(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM workout_plans WHERE id = ?', [id]);
}
