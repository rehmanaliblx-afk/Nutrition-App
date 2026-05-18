import { useState, useCallback } from 'react';
import {
  getAllSupplements,
  getSupplementById,
  addSupplement,
  updateSupplement,
  deleteSupplement,
} from '@/db/supplementsDao';
import { Supplement, SupplementInput } from '@/db/schema';
import { useDatabase } from '@/context/DatabaseContext';

export function useSupplements() {
  const { isReady } = useDatabase();
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isReady) return;
    setLoading(true);
    try {
      const data = await getAllSupplements();
      setSupplements(data);
    } finally {
      setLoading(false);
    }
  }, [isReady]);

  const getById = useCallback(
    async (id: number): Promise<Supplement | null> => {
      if (!isReady) return null;
      return getSupplementById(id);
    },
    [isReady]
  );

  const add = useCallback(
    async (input: SupplementInput): Promise<void> => {
      await addSupplement(input);
      await load();
    },
    [load]
  );

  const update = useCallback(
    async (id: number, input: SupplementInput): Promise<void> => {
      await updateSupplement(id, input);
      await load();
    },
    [load]
  );

  const remove = useCallback(
    async (id: number): Promise<void> => {
      await deleteSupplement(id);
      await load();
    },
    [load]
  );

  return { supplements, loading, load, getById, add, update, remove };
}
