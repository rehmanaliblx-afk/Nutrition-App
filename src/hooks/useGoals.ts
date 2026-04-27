import { useState, useCallback } from 'react';
import { getGoalForDate, upsertGoal } from '@/db/trackingDao';
import { DailyGoal, DailyGoalInput } from '@/db/schema';

export function useGoals() {
  const [goal, setGoal] = useState<DailyGoal | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const data = await getGoalForDate(date);
      setGoal(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (input: DailyGoalInput) => {
    await upsertGoal(input);
    await load(input.date);
  }, [load]);

  return { goal, loading, load, save };
}
