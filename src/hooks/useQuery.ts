import { useCallback, useEffect, useRef, useState } from 'react';

import { useDatabase, type Database } from '@/db';

export type QueryResult<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

/**
 * Carga asíncrona re-ejecutable contra la base de datos.
 * `key` identifica la consulta: al cambiarla se descarta el resultado anterior
 * y se vuelve a cargar.
 */
export function useQuery<T>(
  key: string,
  query: (db: Database) => Promise<T>,
): QueryResult<T> {
  const db = useDatabase();
  const queryRef = useRef(query);
  const [result, setResult] = useState<{
    key: string;
    data: T | null;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    queryRef.current = query;
  });

  const load = useCallback(async () => {
    try {
      const data = await queryRef.current(db);
      setResult({ key, data, error: null });
    } catch (err) {
      setResult({
        key,
        data: null,
        error: err instanceof Error ? err.message : 'Error al leer los datos',
      });
    }
  }, [db, key]);

  useEffect(() => {
    void load();
  }, [load]);

  const stale = result?.key !== key;

  return {
    data: stale ? null : (result?.data ?? null),
    loading: stale,
    error: stale ? null : (result?.error ?? null),
    reload: load,
  };
}
