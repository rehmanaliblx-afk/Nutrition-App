import { useState, useCallback } from 'react';
import {
  getAllWorkoutPlans,
  getWorkoutPlanById,
  createWorkoutPlan,
  updateWorkoutPlan,
  deleteWorkoutPlan,
  WorkoutPlan,
  WorkoutPlanWithExercises,
  WorkoutPlanExercise,
} from '@/db/workoutDao';

export function useWorkoutPlans() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPlans(await getAllWorkoutPlans());
    } finally {
      setLoading(false);
    }
  }, []);

  const getById = useCallback(async (id: number): Promise<WorkoutPlanWithExercises | null> => {
    return getWorkoutPlanById(id);
  }, []);

  const add = useCallback(
    async (name: string, description: string | null, exercises: Omit<WorkoutPlanExercise, 'id' | 'plan_id'>[]): Promise<number> => {
      const id = await createWorkoutPlan(name, description, exercises);
      await load();
      return id;
    },
    [load]
  );

  const update = useCallback(
    async (id: number, name: string, description: string | null, exercises: Omit<WorkoutPlanExercise, 'id' | 'plan_id'>[]): Promise<void> => {
      await updateWorkoutPlan(id, name, description, exercises);
      await load();
    },
    [load]
  );

  const remove = useCallback(
    async (id: number): Promise<void> => {
      await deleteWorkoutPlan(id);
      await load();
    },
    [load]
  );

  return { plans, loading, load, getById, add, update, remove };
}
