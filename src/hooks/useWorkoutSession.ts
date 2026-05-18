import { useState, useCallback } from 'react';
import {
  createSession,
  endSession,
  addSessionSet,
  updateSessionSet,
  deleteSessionSet,
  getRecentSessions,
  getSessionById,
  getExerciseHistory,
  getPersonalRecord,
  deleteSession,
  getActiveDates,
  WorkoutSession,
  SessionWithSets,
  SessionSet,
  PersonalRecord,
} from '@/db/workoutSessionDao';

export function useWorkoutSession() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeDates, setActiveDates] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [recent, dates] = await Promise.all([getRecentSessions(), getActiveDates()]);
      setSessions(recent);
      setActiveDates(dates);
    } finally {
      setLoading(false);
    }
  }, []);

  const startSession = useCallback(
    async (planId: number | null, planName: string | null): Promise<number> => {
      const id = await createSession(planId, planName);
      await load();
      return id;
    },
    [load]
  );

  const endSessionFn = useCallback(
    async (id: number, durationSec: number, totalSets: number): Promise<void> => {
      await endSession(id, durationSec, totalSets);
      await load();
    },
    [load]
  );

  const addSet = useCallback(
    async (
      sessionId: number,
      exerciseId: string,
      exerciseName: string,
      setNumber: number,
      weightKg: number | null,
      reps: number | null
    ): Promise<number> => {
      return addSessionSet(sessionId, exerciseId, exerciseName, setNumber, weightKg, reps);
    },
    []
  );

  const updateSet = useCallback(
    async (
      id: number,
      weightKg: number | null,
      reps: number | null,
      completed: boolean
    ): Promise<void> => {
      return updateSessionSet(id, weightKg, reps, completed);
    },
    []
  );

  const deleteSet = useCallback(async (id: number): Promise<void> => {
    return deleteSessionSet(id);
  }, []);

  const getHistory = useCallback(
    async (
      exerciseId: string,
      limit?: number
    ): Promise<Array<{ date: string; sets: SessionSet[] }>> => {
      return getExerciseHistory(exerciseId, limit);
    },
    []
  );

  const getPR = useCallback(
    async (exerciseId: string): Promise<PersonalRecord | null> => {
      return getPersonalRecord(exerciseId);
    },
    []
  );

  const removeSession = useCallback(
    async (id: number): Promise<void> => {
      await deleteSession(id);
      await load();
    },
    [load]
  );

  return {
    sessions,
    loading,
    load,
    startSession,
    endSession: endSessionFn,
    addSet,
    updateSet,
    deleteSet,
    getHistory,
    getPR,
    removeSession,
    activeDates,
  };
}
