import { useState, useCallback } from 'react';
import { getWaterEntriesForDate, getWaterTotalForDate, addWaterEntry, deleteWaterEntry } from '@/db/waterDao';
import { WaterEntry } from '@/db/schema';

export function useWater() {
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const [e, t] = await Promise.all([
        getWaterEntriesForDate(date),
        getWaterTotalForDate(date),
      ]);
      setEntries(e);
      setTotal(t);
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(async (date: string, amount_ml: number) => {
    await addWaterEntry(date, amount_ml);
    await load(date);
  }, [load]);

  const remove = useCallback(async (id: number, date: string) => {
    await deleteWaterEntry(id);
    await load(date);
  }, [load]);

  return { entries, total, loading, load, add, remove };
}
