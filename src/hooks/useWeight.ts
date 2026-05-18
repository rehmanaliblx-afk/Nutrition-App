import { useState, useCallback } from 'react';
import { getWeightHistory, getWeightForDate, upsertWeight, deleteWeight } from '@/db/weightDao';
import { WeightEntry } from '@/db/schema';

export function useWeight() {
  const [history, setHistory] = useState<WeightEntry[]>([]);
  const [todayEntry, setTodayEntry] = useState<WeightEntry | null>(null);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async (limit = 30) => {
    setLoading(true);
    try {
      const h = await getWeightHistory(limit);
      setHistory(h);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadToday = useCallback(async (date: string) => {
    const entry = await getWeightForDate(date);
    setTodayEntry(entry);
  }, []);

  const save = useCallback(async (date: string, weight_kg: number, note?: string) => {
    await upsertWeight(date, weight_kg, note);
    await Promise.all([loadHistory(), loadToday(date)]);
  }, [loadHistory, loadToday]);

  const remove = useCallback(async (date: string) => {
    await deleteWeight(date);
    await loadHistory();
    setTodayEntry(null);
  }, [loadHistory]);

  return { history, todayEntry, loading, loadHistory, loadToday, save, remove };
}
