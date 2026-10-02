import { createContext, use, useMemo, type ReactNode } from 'react';

import { Database } from './engine';
import { buildSeedState } from './seed';

const DatabaseContext = createContext<Database | null>(null);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const db = useMemo(
    () =>
      Database.open({
        seed: buildSeedState,
        onRecover: (error) => {
          console.warn(
            'El archivo de datos no se pudo leer, se respalda y se empieza de cero.',
            error,
          );
        },
      }),
    [],
  );

  return <DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>;
}

export function useDatabase(): Database {
  const db = use(DatabaseContext);
  if (!db) {
    throw new Error('useDatabase() debe usarse dentro de <DatabaseProvider>');
  }
  return db;
}

export { Database };
export type {
  DatabaseState,
  InventoryRow,
  OrderItemRow,
  OrderRow,
  ProductRow,
  RecipeRow,
} from './engine';
export { DATA_FILE_NAME, DATA_FILE_VERSION } from './engine';
