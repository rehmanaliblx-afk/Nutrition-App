import { useState, useCallback } from 'react';
import { getAllMealSlots, createMealSlot, updateMealSlot, deleteMealSlot } from '@/db/mealSlotsDao';
import { MealSlot } from '@/db/schema';

export function useMealSlots() {
  const [slots, setSlots] = useState<MealSlot[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getAllMealSlots();
      setSlots(s);
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(async (display_name: string, emoji: string) => {
    await createMealSlot(display_name, emoji);
    await load();
  }, [load]);

  const update = useCallback(async (id: number, display_name: string, emoji: string) => {
    await updateMealSlot(id, display_name, emoji);
    await load();
  }, [load]);

  const remove = useCallback(async (id: number) => {
    await deleteMealSlot(id);
    await load();
  }, [load]);

  return { slots, loading, load, add, update, remove };
}
