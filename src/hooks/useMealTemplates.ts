import { useState, useCallback } from 'react';
import {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  deleteTemplate,
  MealTemplate,
  MealTemplateEntry,
  MealTemplateWithEntries,
} from '@/db/mealTemplatesDao';

export function useMealTemplates() {
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTemplates(await getAllTemplates());
    } finally {
      setLoading(false);
    }
  }, []);

  const getById = useCallback(
    async (id: number): Promise<MealTemplateWithEntries | null> => {
      return getTemplateById(id);
    },
    []
  );

  const create = useCallback(
    async (
      name: string,
      description: string | null,
      entries: Omit<MealTemplateEntry, 'id' | 'templateId'>[]
    ): Promise<number> => {
      const id = await createTemplate(name, description, entries);
      await load();
      return id;
    },
    [load]
  );

  const remove = useCallback(
    async (id: number): Promise<void> => {
      await deleteTemplate(id);
      await load();
    },
    [load]
  );

  return { templates, loading, load, getById, create, remove };
}
