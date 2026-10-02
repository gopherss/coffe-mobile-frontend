import type { Category, Unit } from '@/lib/constants';
import { newId } from '@/lib/id';
import { DATA_FILE_VERSION, type DatabaseState } from './engine';

interface SeedProduct {
  name: string;
  category: Category;
  priceCents: number;
}

interface SeedItem {
  key: string;
  name: string;
  unit: Unit;
  qtyOnHand: number;
  qtyMin: number;
}

const SEED_ITEMS: SeedItem[] = [
  { key: 'grano', name: 'Café en grano', unit: 'g', qtyOnHand: 8000, qtyMin: 2000 },
  { key: 'leche', name: 'Leche entera', unit: 'ml', qtyOnHand: 12000, qtyMin: 3000 },
  { key: 'avena', name: 'Leche de avena', unit: 'ml', qtyOnHand: 3000, qtyMin: 1000 },
  { key: 'chocolate', name: 'Chocolate', unit: 'g', qtyOnHand: 1000, qtyMin: 300 },
  { key: 'hielo', name: 'Hielo', unit: 'g', qtyOnHand: 5000, qtyMin: 1000 },
  { key: 'limon', name: 'Limón', unit: 'uds', qtyOnHand: 20, qtyMin: 6 },
  { key: 'naranja', name: 'Naranja', unit: 'uds', qtyOnHand: 15, qtyMin: 5 },
  { key: 'harina', name: 'Harina', unit: 'g', qtyOnHand: 5000, qtyMin: 1000 },
  { key: 'manteca', name: 'Manteca', unit: 'g', qtyOnHand: 2000, qtyMin: 500 },
  { key: 'queso', name: 'Queso', unit: 'g', qtyOnHand: 1000, qtyMin: 300 },
  { key: 'jamon', name: 'Jamón', unit: 'g', qtyOnHand: 800, qtyMin: 200 },
  { key: 'azucar', name: 'Azúcar', unit: 'g', qtyOnHand: 5000, qtyMin: 1000 },
];

const SEED_PRODUCTS: SeedProduct[] = [
  { name: 'Espresso', category: 'cafe', priceCents: 650 },
  { name: 'Americano', category: 'cafe', priceCents: 750 },
  { name: 'Cortado', category: 'cafe', priceCents: 850 },
  { name: 'Flat White', category: 'cafe', priceCents: 1050 },
  { name: 'Latte', category: 'cafe', priceCents: 1050 },
  { name: 'Cappuccino', category: 'cafe', priceCents: 950 },
  { name: 'Mocha', category: 'cafe', priceCents: 1150 },
  { name: 'Cold Brew', category: 'fria', priceCents: 1200 },
  { name: 'Iced Latte', category: 'fria', priceCents: 1100 },
  { name: 'Limonada de menta', category: 'fria', priceCents: 1000 },
  { name: 'Jugo de naranja', category: 'fria', priceCents: 1100 },
  { name: 'Medialunas', category: 'panaderia', priceCents: 550 },
  { name: 'Tostado de queso y jamón', category: 'panaderia', priceCents: 1350 },
  { name: 'Cookie de chocolate', category: 'panaderia', priceCents: 600 },
];

const SEED_RECIPES: Record<string, Record<string, number>> = {
  Espresso: { grano: 9 },
  Americano: { grano: 9 },
  Cortado: { grano: 9, leche: 40 },
  'Flat White': { grano: 18, leche: 120 },
  Latte: { grano: 18, leche: 180 },
  Cappuccino: { grano: 18, leche: 120 },
  Mocha: { grano: 18, leche: 150, chocolate: 20 },
  'Cold Brew': { grano: 20, hielo: 150 },
  'Iced Latte': { grano: 18, leche: 150, hielo: 100 },
  'Limonada de menta': { limon: 3, azucar: 30, hielo: 100 },
  'Jugo de naranja': { naranja: 3, azucar: 20 },
  Medialunas: { harina: 60, manteca: 20 },
  'Tostado de queso y jamón': { queso: 40, jamon: 40 },
  'Cookie de chocolate': { harina: 50, manteca: 25, azucar: 30, chocolate: 25 },
};

export function buildSeedState(now: number = Date.now()): DatabaseState {
  const itemIds = new Map<string, string>();
  const inventoryItems = SEED_ITEMS.map((item) => {
    const id = newId();
    itemIds.set(item.key, id);
    return {
      id,
      name: item.name,
      unit: item.unit,
      qtyOnHand: item.qtyOnHand,
      qtyMin: item.qtyMin,
      createdAt: now,
      updatedAt: now,
    };
  });

  const recipes: DatabaseState['recipes'] = [];
  const products = SEED_PRODUCTS.map((product) => {
    const id = newId();
    const parts = SEED_RECIPES[product.name] ?? {};
    for (const [itemKey, qty] of Object.entries(parts)) {
      const itemId = itemIds.get(itemKey);
      if (!itemId) continue;
      recipes.push({ productId: id, itemId, qty });
    }
    return {
      id,
      name: product.name,
      category: product.category,
      priceCents: product.priceCents,
      available: true,
      createdAt: now,
      updatedAt: now,
    };
  });

  return {
    version: DATA_FILE_VERSION,
    products,
    inventoryItems,
    recipes,
    orders: [],
    orderItems: [],
  };
}
