import { useState, useCallback } from 'react';
import {
  upsertMeasurement,
  getMeasurements,
  getMeasurementByDate,
  getLatestMeasurement,
  deleteMeasurement,
  BodyMeasurement,
} from '@/db/bodyMeasurementsDao';

export function useBodyMeasurements() {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(false);
  const [latest, setLatest] = useState<BodyMeasurement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [all, latestEntry] = await Promise.all([getMeasurements(), getLatestMeasurement()]);
      setMeasurements(all);
      setLatest(latestEntry);
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(
    async (m: Omit<BodyMeasurement, 'id' | 'createdAt'>): Promise<void> => {
      await upsertMeasurement(m);
      await load();
    },
    [load]
  );

  const getByDate = useCallback(
    async (date: string): Promise<BodyMeasurement | null> => {
      return getMeasurementByDate(date);
    },
    []
  );

  const remove = useCallback(
    async (id: number): Promise<void> => {
      await deleteMeasurement(id);
      await load();
    },
    [load]
  );

  return { measurements, loading, load, save, getByDate, latest, remove };
}
