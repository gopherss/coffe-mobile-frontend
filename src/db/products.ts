import { newId } from '@/lib/id';
import type { Database } from './engine';
import type { Product } from './types';

function toProduct(row: {
  id: string;
  name: string;
  category: Product['category'];
  priceCents: number;
  available: boolean;
}): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    priceCents: row.priceCents,
    available: row.available,
  };
}

function byName(a: string, b: string): number {
  return a.localeCompare(b, 'es', { sensitivity: 'base' });
}

export async function listProducts(db: Database): Promise<Product[]> {
  return db.read((state) =>
    state.products
      .map(toProduct)
      .sort((a, b) => byName(a.name, b.name)),
  );
}

export async function getProduct(db: Database, id: string): Promise<Product | null> {
  return db.read((state) => {
    const row = state.products.find((p) => p.id === id);
    return row ? toProduct(row) : null;
  });
}

export interface ProductInput {
  name: string;
  category: Product['category'];
  priceCents: number;
  available: boolean;
}

export async function createProduct(db: Database, input: ProductInput): Promise<string> {
  const id = newId();
  const now = Date.now();
  await db.write((state) => {
    state.products.push({
      id,
      name: input.name.trim(),
      category: input.category,
      priceCents: Math.max(0, Math.round(input.priceCents)),
      available: input.available,
      createdAt: now,
      updatedAt: now,
    });
  });
  return id;
}

export async function updateProduct(
  db: Database,
  id: string,
  input: ProductInput,
): Promise<void> {
  await db.write((state) => {
    const row = state.products.find((p) => p.id === id);
    if (!row) return;
    row.name = input.name.trim();
    row.category = input.category;
    row.priceCents = Math.max(0, Math.round(input.priceCents));
    row.available = input.available;
    row.updatedAt = Date.now();
  });
}

export async function setProductAvailability(
  db: Database,
  id: string,
  available: boolean,
): Promise<void> {
  await db.write((state) => {
    const row = state.products.find((p) => p.id === id);
    if (!row) return;
    row.available = available;
    row.updatedAt = Date.now();
  });
}

export async function deleteProduct(db: Database, id: string): Promise<void> {
  await db.write((state) => {
    state.recipes = state.recipes.filter((r) => r.productId !== id);
    for (const line of state.orderItems) {
      if (line.productId === id) line.productId = null;
    }
    state.products = state.products.filter((p) => p.id !== id);
  });
}
