// src/hooks/useTeacherData.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Generic data fetching hook used by Teacher module pages.
 * Accepts a function that returns a promise of the desired data.
 * Provides loading, error, data and a retry function.
 */
export function useTeacherData<T>(fetchFn: () => Promise<T>) {
  const fetchRef = useRef(fetchFn);

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRef.current();
      setData(result ?? null);
    } catch (e) {
      const err = e as Error;
      setError(err);
      toast.error(err.message || 'Failed to load data', {
        action: {
          label: 'Retry',
          onClick: () => load(),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  // Update ref if fetchFn changes (unlikely)
  useEffect(() => {
    fetchRef.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    load();
  }, []);

  return { data, loading, error, retry: load };
}
