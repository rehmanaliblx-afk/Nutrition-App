import { EXERCISES, Exercise, ExerciseCategory } from '@/constants/exercises';

export type SplitType =
  | 'push'
  | 'pull'
  | 'legs'
  | 'chest_back'
  | 'full_body'
  | 'upper'
  | 'lower'
  | 'arms'
  | 'shoulders_arms';

export type EquipmentFilter =
  | 'any'
  | 'barbell'
  | 'dumbbells'
  | 'bodyweight'
  | 'machines';

export interface GeneratedExercise {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  repsRange: string;
  restSec: number;
  notes: string;
}

export interface GeneratedWorkout {
  name: string;
  estimatedMinutes: number;
  exercises: GeneratedExercise[];
}

export const SPLIT_LABELS: Record<SplitType, string> = {
  push: 'Push (Chest / Shoulders / Triceps)',
  pull: 'Pull (Back / Biceps)',
  legs: 'Legs (Quads / Hamstrings / Glutes / Calves)',
  chest_back: 'Chest & Back',
  full_body: 'Full Body',
  upper: 'Upper Body',
  lower: 'Lower Body',
  arms: 'Arms (Biceps & Triceps)',
  shoulders_arms: 'Shoulders & Arms',
};

export const EQUIPMENT_LABELS: Record<EquipmentFilter, string> = {
  any: 'Any Equipment',
  barbell: 'Barbell',
  dumbbells: 'Dumbbells',
  bodyweight: 'Bodyweight Only',
  machines: 'Machines',
};

/** Map each split to the exercise categories it targets. */
const SPLIT_CATEGORIES: Record<SplitType, ExerciseCategory[]> = {
  push: ['chest', 'shoulders', 'triceps'],
  pull: ['back', 'biceps'],
  legs: ['legs', 'glutes'],
  chest_back: ['chest', 'back'],
  full_body: ['chest', 'back', 'shoulders', 'legs', 'core'],
  upper: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
  lower: ['legs', 'glutes', 'core'],
  arms: ['biceps', 'triceps'],
  shoulders_arms: ['shoulders', 'biceps', 'triceps'],
};

/** Equipment keyword matching for the EquipmentFilter. */
const EQUIPMENT_KEYWORDS: Record<EquipmentFilter, string[]> = {
  any: [],
  barbell: ['barbell', 'bar'],
  dumbbells: ['dumbbell'],
  bodyweight: ['bodyweight', 'body weight', 'no equipment'],
  machines: ['machine', 'cable', 'lat pulldown', 'leg press', 'leg curl', 'leg extension'],
};

function matchesEquipment(exercise: Exercise, filter: EquipmentFilter): boolean {
  if (filter === 'any') return true;
  const eq = exercise.equipment.toLowerCase();
  return EQUIPMENT_KEYWORDS[filter].some((kw) => eq.includes(kw));
}

function pickExercises(
  candidates: Exercise[],
  compoundCount: number,
  isolationCount: number
): Exercise[] {
  const compounds = candidates.filter((e) => e.type === 'compound');
  const isolations = candidates.filter((e) => e.type === 'isolation');

  const picked: Exercise[] = [];
  const usedIds = new Set<string>();

  const take = (pool: Exercise[], n: number) => {
    let taken = 0;
    for (const ex of pool) {
      if (taken >= n) break;
      if (!usedIds.has(ex.id)) {
        picked.push(ex);
        usedIds.add(ex.id);
        taken++;
      }
    }
  };

  take(compounds, compoundCount);
  take(isolations, isolationCount);

  return picked;
}

function buildExercise(
  ex: Exercise,
  focus: 'strength' | 'hypertrophy',
  isCompound: boolean
): GeneratedExercise {
  let sets: number;
  let repsRange: string;
  let restSec: number;
  let notes: string;

  if (isCompound) {
    if (focus === 'strength') {
      sets = 4;
      repsRange = '4-6';
      restSec = 180;
      notes = 'Focus on progressive overload. Rest fully between sets.';
    } else {
      sets = 3;
      repsRange = '8-12';
      restSec = 120;
      notes = 'Control the eccentric phase. Aim for a strong muscle contraction.';
    }
  } else {
    sets = 3;
    repsRange = '10-15';
    restSec = 60;
    notes = 'Feel the target muscle working. Use a full range of motion.';
  }

  return {
    exerciseId: ex.id,
    exerciseName: ex.name,
    sets,
    repsRange,
    restSec,
    notes,
  };
}

/**
 * Generate a workout for a given split, equipment availability, difficulty, and focus.
 *
 * Exercise counts:
 *   beginner:     3 compound + 1 isolation = 4 total
 *   intermediate: 3 compound + 2 isolation = 5 total
 *   advanced:     4 compound + 3 isolation = 7 total
 */
export function generateWorkout(
  split: SplitType,
  equipment: EquipmentFilter,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  focus: 'strength' | 'hypertrophy' = 'hypertrophy'
): GeneratedWorkout {
  const categories = SPLIT_CATEGORIES[split];

  // Filter exercises by category and equipment
  const pool = EXERCISES.filter((ex) => {
    if (!categories.includes(ex.category)) return false;
    if (!matchesEquipment(ex, equipment)) return false;
    // For non-advanced users, exclude advanced-only exercises.
    if (ex.difficulty === 'advanced' && difficulty !== 'advanced') return false;
    return true;
  });

  // Count targets
  const compoundTarget = difficulty === 'advanced' ? 4 : 3;
  const isolationTarget = difficulty === 'beginner' ? 1 : difficulty === 'intermediate' ? 2 : 3;

  const selected = pickExercises(pool, compoundTarget, isolationTarget);

  const exercises: GeneratedExercise[] = selected.map((ex) =>
    buildExercise(ex, focus, ex.type === 'compound')
  );

  // Estimate workout duration:
  // Per set: ~2.5 min for compound (work + rest) or ~1.5 min for isolation
  const minutes = exercises.reduce((total, ex) => {
    const perSet = ex.restSec >= 120 ? 2.5 : 1.5;
    return total + ex.sets * perSet;
  }, 0);

  return {
    name: `${SPLIT_LABELS[split]} — ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`,
    estimatedMinutes: Math.round(minutes),
    exercises,
  };
}
