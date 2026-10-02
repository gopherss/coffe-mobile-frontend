import { File, Paths } from 'expo-file-system';

import {
  CATEGORIES,
  type Category,
  ORDER_STATUSES,
  ORDER_TYPES,
  type OrderStatus,
  type OrderType,
  PAYMENT_METHODS,
  type PaymentMethod,
  UNITS,
  type Unit,
} from '@/lib/constants';

export const DATA_FILE_NAME = 'coffeeshop.json';
export const DATA_FILE_VERSION = 1;

const TEMP_FILE_NAME = `${DATA_FILE_NAME}.tmp`;

export interface ProductRow {
  id: string;
  name: string;
  category: Category;
  priceCents: number;
  available: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface InventoryRow {
  id: string;
  name: string;
  unit: Unit;
  qtyOnHand: number;
  qtyMin: number;
  createdAt: number;
  updatedAt: number;
}

export interface RecipeRow {
  productId: string;
  itemId: string;
  qty: number;
}

export interface OrderRow {
  id: string;
  code: number;
  day: string;
  type: OrderType;
  status: OrderStatus;
  tableNo: string | null;
  customerName: string | null;
  notes: string | null;
  paymentMethod: PaymentMethod | null;
  totalCents: number;
  stockApplied: boolean;
  createdAt: number;
  updatedAt: number;
  readyAt: number | null;
}

export interface OrderItemRow {
  id: string;
  orderId: string;
  productId: string | null;
  productName: string;
  unitPriceCents: number;
  qty: number;
  notes: string | null;
  lineTotalCents: number;
}

export interface DatabaseState {
  version: number;
  products: ProductRow[];
  inventoryItems: InventoryRow[];
  recipes: RecipeRow[];
  orders: OrderRow[];
  orderItems: OrderItemRow[];
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asTextOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function asOneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function asOneOfOrNull<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

function asFlag(value: unknown): boolean {
  return value === true || value === 1;
}

function asQty(value: unknown): number {
  const qty = asNumber(value, 0);
  return qty > 0 ? qty : 0;
}

function asMoney(value: unknown): number {
  return Math.max(0, Math.round(asNumber(value, 0)));
}

function asTimestampOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function compact<T>(rows: (T | null)[]): T[] {
  const out: T[] = [];
  for (const row of rows) if (row) out.push(row);
  return out;
}

function toProductRow(raw: unknown): ProductRow | null {
  const row = asRecord(raw);
  const id = asString(row.id);
  if (!id) return null;
  return {
    id,
    name: asString(row.name),
    category: asOneOf<Category>(row.category, CATEGORIES, 'otros'),
    priceCents: asMoney(row.priceCents),
    available: asFlag(row.available),
    createdAt: asNumber(row.createdAt),
    updatedAt: asNumber(row.updatedAt),
  };
}

function toInventoryRow(raw: unknown): InventoryRow | null {
  const row = asRecord(raw);
  const id = asString(row.id);
  if (!id) return null;
  return {
    id,
    name: asString(row.name),
    unit: asOneOf<Unit>(row.unit, UNITS, 'uds'),
    qtyOnHand: asNumber(row.qtyOnHand),
    qtyMin: asQty(row.qtyMin),
    createdAt: asNumber(row.createdAt),
    updatedAt: asNumber(row.updatedAt),
  };
}

function toRecipeRow(raw: unknown): RecipeRow | null {
  const row = asRecord(raw);
  const productId = asString(row.productId);
  const itemId = asString(row.itemId);
  if (!productId || !itemId) return null;
  return { productId, itemId, qty: asQty(row.qty) };
}

function toOrderRow(raw: unknown): OrderRow | null {
  const row = asRecord(raw);
  const id = asString(row.id);
  if (!id) return null;
  return {
    id,
    code: asMoney(row.code),
    day: asString(row.day),
    type: asOneOf<OrderType>(row.type, ORDER_TYPES, 'takeaway'),
    status: asOneOf<OrderStatus>(row.status, ORDER_STATUSES, 'pending'),
    tableNo: asTextOrNull(row.tableNo),
    customerName: asTextOrNull(row.customerName),
    notes: asTextOrNull(row.notes),
    paymentMethod: asOneOfOrNull<PaymentMethod>(row.paymentMethod, PAYMENT_METHODS),
    totalCents: asMoney(row.totalCents),
    stockApplied: asFlag(row.stockApplied),
    createdAt: asNumber(row.createdAt),
    updatedAt: asNumber(row.updatedAt),
    readyAt: asTimestampOrNull(row.readyAt),
  };
}

function toOrderItemRow(raw: unknown): OrderItemRow | null {
  const row = asRecord(raw);
  const id = asString(row.id);
  const orderId = asString(row.orderId);
  if (!id || !orderId) return null;
  return {
    id,
    orderId,
    productId: asTextOrNull(row.productId),
    productName: asString(row.productName),
    unitPriceCents: asMoney(row.unitPriceCents),
    qty: asMoney(row.qty),
    notes: asTextOrNull(row.notes),
    lineTotalCents: asMoney(row.lineTotalCents),
  };
}

function nextFreeCode(orders: OrderRow[], day: string, ignore: OrderRow): number {
  const taken = new Set(
    orders.filter((o) => o.day === day && o !== ignore).map((o) => o.code),
  );
  let code = 1;
  while (taken.has(code)) code += 1;
  return code;
}

export function normalizeState(raw: unknown): DatabaseState {
  const root = asRecord(raw);

  const products = compact(asArray(root.products).map(toProductRow));
  const inventoryItems = compact(asArray(root.inventoryItems).map(toInventoryRow));
  const orders = compact(asArray(root.orders).map(toOrderRow));
  const orderItems = compact(asArray(root.orderItems).map(toOrderItemRow));

  const productIds = new Set(products.map((p) => p.id));
  const itemIds = new Set(inventoryItems.map((i) => i.id));
  const orderIds = new Set(orders.map((o) => o.id));

  const seenRecipes = new Set<string>();
  const recipes: RecipeRow[] = [];
  for (const row of compact(asArray(root.recipes).map(toRecipeRow))) {
    if (!productIds.has(row.productId) || !itemIds.has(row.itemId)) continue;
    const key = `${row.productId}::${row.itemId}`;
    if (seenRecipes.has(key)) continue;
    seenRecipes.add(key);
    recipes.push(row);
  }

  const seenCodes = new Set<string>();
  for (const order of orders) {
    const key = `${order.day}::${order.code}`;
    if (seenCodes.has(key)) order.code = nextFreeCode(orders, order.day, order);
    seenCodes.add(`${order.day}::${order.code}`);
  }

  return {
    version: asNumber(root.version, 0),
    products,
    inventoryItems,
    recipes,
    orders,
    orderItems: orderItems
      .filter((line) => orderIds.has(line.orderId))
      .map((line) =>
        line.productId && !productIds.has(line.productId)
          ? { ...line, productId: null }
          : line,
      ),
  };
}

function cloneState(state: DatabaseState): DatabaseState {
  return JSON.parse(JSON.stringify(state)) as DatabaseState;
}

export function dataFile(): File {
  return new File(Paths.document, DATA_FILE_NAME);
}

export function persistState(state: DatabaseState): void {
  const target = dataFile();
  const temp = new File(Paths.document, TEMP_FILE_NAME);
  temp.create({ intermediates: true, overwrite: true });
  temp.write(JSON.stringify(state, null, 2));
  temp.moveSync(target, { overwrite: true });
}

function quarantineFile(): void {
  const file = dataFile();
  const backup = new File(Paths.document, `${DATA_FILE_NAME}.roto-${Date.now()}`);
  try {
    file.moveSync(backup, { overwrite: true });
  } catch {
    try {
      file.delete();
    } catch {
      return;
    }
  }
}

function applyMigration(state: DatabaseState, target: number): DatabaseState {
  if (target === 1) return state;
  throw new Error(`No hay migración para la versión ${target} del archivo de datos`);
}

function migrate(state: DatabaseState): DatabaseState {
  let current = state;
  while (current.version < DATA_FILE_VERSION) {
    const next = current.version + 1;
    current = { ...applyMigration(current, next), version: next };
  }
  return current;
}

export interface OpenOptions {
  seed: () => DatabaseState;
  onRecover?: (error: unknown) => void;
}

export class Database {
  private state: DatabaseState;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(state: DatabaseState) {
    this.state = state;
  }

  static open(options: OpenOptions): Database {
    let loaded: DatabaseState | null = null;

    try {
      const file = dataFile();
      if (file.exists) {
        const text = file.textSync();
        loaded = text.trim() ? normalizeState(JSON.parse(text)) : null;
      }
    } catch (error) {
      options.onRecover?.(error);
      quarantineFile();
      loaded = null;
    }

    if (!loaded) {
      const seeded = options.seed();
      persistState(seeded);
      return new Database(seeded);
    }

    const migrated = migrate(loaded);
    if (migrated !== loaded) persistState(migrated);
    return new Database(migrated);
  }

  read<T>(fn: (state: DatabaseState) => T): T {
    return fn(this.state);
  }

  write<T>(fn: (state: DatabaseState) => T): Promise<T> {
    const run = this.queue.then(async () => {
      const draft = cloneState(this.state);
      const result = fn(draft);
      persistState(draft);
      this.state = draft;
      return result;
    });

    this.queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }
}
