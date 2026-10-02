import { newId } from '@/lib/id';
import type { Database } from './engine';
import type { InventoryItem, RecipePart } from './types';

function toItem(row: {
  id: string;
  name: string;
  unit: InventoryItem['unit'];
  qtyOnHand: number;
  qtyMin: number;
}): InventoryItem {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    qtyOnHand: row.qtyOnHand,
    qtyMin: row.qtyMin,
  };
}

function byName(a: string, b: string): number {
  return a.localeCompare(b, 'es', { sensitivity: 'base' });
}

export async function listInventoryItems(db: Database): Promise<InventoryItem[]> {
  return db.read((state) =>
    state.inventoryItems.map(toItem).sort((a, b) => byName(a.name, b.name)),
  );
}

export interface InventoryItemInput {
  name: string;
  unit: InventoryItem['unit'];
  qtyOnHand: number;
  qtyMin: number;
}

export async function createInventoryItem(
  db: Database,
  input: InventoryItemInput,
): Promise<string> {
  const id = newId();
  const now = Date.now();
  await db.write((state) => {
    state.inventoryItems.push({
      id,
      name: input.name.trim(),
      unit: input.unit,
      qtyOnHand: input.qtyOnHand,
      qtyMin: input.qtyMin,
      createdAt: now,
      updatedAt: now,
    });
  });
  return id;
}

export async function updateInventoryItem(
  db: Database,
  id: string,
  input: InventoryItemInput,
): Promise<void> {
  await db.write((state) => {
    const row = state.inventoryItems.find((i) => i.id === id);
    if (!row) return;
    row.name = input.name.trim();
    row.unit = input.unit;
    row.qtyOnHand = input.qtyOnHand;
    row.qtyMin = input.qtyMin;
    row.updatedAt = Date.now();
  });
}

export async function adjustStock(db: Database, id: string, delta: number): Promise<void> {
  await db.write((state) => {
    const row = state.inventoryItems.find((i) => i.id === id);
    if (!row) return;
    row.qtyOnHand = row.qtyOnHand + delta;
    row.updatedAt = Date.now();
  });
}

export async function deleteInventoryItem(db: Database, id: string): Promise<void> {
  await db.write((state) => {
    state.recipes = state.recipes.filter((r) => r.itemId !== id);
    state.inventoryItems = state.inventoryItems.filter((i) => i.id !== id);
  });
}

export async function getRecipe(db: Database, productId: string): Promise<RecipePart[]> {
  return db.read((state) => {
    const itemsById = new Map(state.inventoryItems.map((i) => [i.id, i]));
    const parts: RecipePart[] = [];

    for (const recipe of state.recipes) {
      if (recipe.productId !== productId) continue;
      const item = itemsById.get(recipe.itemId);
      if (!item) continue;
      parts.push({
        itemId: item.id,
        itemName: item.name,
        unit: item.unit,
        qty: recipe.qty,
      });
    }

    return parts.sort((a, b) => byName(a.itemName, b.itemName));
  });
}

export async function setRecipePart(
  db: Database,
  productId: string,
  itemId: string,
  qty: number,
): Promise<void> {
  await db.write((state) => {
    const index = state.recipes.findIndex(
      (r) => r.productId === productId && r.itemId === itemId,
    );

    if (qty <= 0) {
      if (index >= 0) state.recipes.splice(index, 1);
      return;
    }

    if (index >= 0) {
      state.recipes[index].qty = qty;
      return;
    }

    state.recipes.push({ productId, itemId, qty });
  });
}
