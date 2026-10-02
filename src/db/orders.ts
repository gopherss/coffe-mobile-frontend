import {
  ACTIVE_STATUSES,
  NEXT_STATUS,
  type OrderStatus,
  type PaymentMethod,
} from '@/lib/constants';
import { dayKey } from '@/lib/date';
import { newId } from '@/lib/id';
import type { Database, DatabaseState, OrderRow } from './engine';
import type { DaySummary, NewOrderInput, Order, OrderLine } from './types';

function toOrder(row: OrderRow, items: OrderLine[]): Order {
  return {
    id: row.id,
    code: row.code,
    day: row.day,
    type: row.type,
    status: row.status,
    tableNo: row.tableNo,
    customerName: row.customerName,
    notes: row.notes,
    paymentMethod: row.paymentMethod,
    totalCents: row.totalCents,
    stockApplied: row.stockApplied,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    readyAt: row.readyAt,
    items,
  };
}

function toOrderLine(row: {
  id: string;
  productId: string | null;
  productName: string;
  unitPriceCents: number;
  qty: number;
  notes: string | null;
  lineTotalCents: number;
}): OrderLine {
  return {
    id: row.id,
    productId: row.productId,
    productName: row.productName,
    unitPriceCents: row.unitPriceCents,
    qty: row.qty,
    notes: row.notes,
    lineTotalCents: row.lineTotalCents,
  };
}

function linesOf(state: DatabaseState, orderId: string): OrderLine[] {
  return state.orderItems
    .filter((line) => line.orderId === orderId)
    .map(toOrderLine);
}

export async function createOrder(db: Database, input: NewOrderInput): Promise<string> {
  const id = newId();
  const now = Date.now();
  const day = dayKey(now);
  const totalCents = input.items.reduce(
    (sum, line) => sum + line.unitPriceCents * line.qty,
    0,
  );

  await db.write((state) => {
    const used = new Set(state.orders.filter((o) => o.day === day).map((o) => o.code));
    let code = 1;
    while (used.has(code)) code += 1;

    state.orders.push({
      id,
      code,
      day,
      type: input.type,
      status: 'pending',
      tableNo: input.tableNo,
      customerName: input.customerName,
      notes: input.notes,
      paymentMethod: null,
      totalCents,
      stockApplied: false,
      createdAt: now,
      updatedAt: now,
      readyAt: null,
    });

    for (const line of input.items) {
      state.orderItems.push({
        id: newId(),
        orderId: id,
        productId: line.productId,
        productName: line.productName,
        unitPriceCents: line.unitPriceCents,
        qty: line.qty,
        notes: line.notes,
        lineTotalCents: line.unitPriceCents * line.qty,
      });
    }
  });

  return id;
}

export async function listActiveOrders(db: Database): Promise<Order[]> {
  return db.read((state) => {
    const rows = state.orders
      .filter((o) => ACTIVE_STATUSES.includes(o.status))
      .sort((a, b) => a.createdAt - b.createdAt);
    return rows.map((row) => toOrder(row, linesOf(state, row.id)));
  });
}

export async function listOrdersForDay(db: Database, day: string): Promise<Order[]> {
  return db.read((state) => {
    const rows = state.orders
      .filter((o) => o.day === day)
      .sort((a, b) => b.createdAt - a.createdAt);
    return rows.map((row) => toOrder(row, linesOf(state, row.id)));
  });
}

export async function getOrder(db: Database, id: string): Promise<Order | null> {
  return db.read((state) => {
    const row = state.orders.find((o) => o.id === id);
    return row ? toOrder(row, linesOf(state, row.id)) : null;
  });
}

function moveStock(
  state: DatabaseState,
  orderId: string,
  direction: 1 | -1,
  now: number,
): void {
  const recipesByProduct = new Map<string, { itemId: string; qty: number }[]>();
  for (const recipe of state.recipes) {
    const list = recipesByProduct.get(recipe.productId);
    if (list) list.push(recipe);
    else recipesByProduct.set(recipe.productId, [recipe]);
  }

  const itemsById = new Map(state.inventoryItems.map((i) => [i.id, i]));

  for (const line of state.orderItems) {
    if (line.orderId !== orderId || !line.productId) continue;
    for (const part of recipesByProduct.get(line.productId) ?? []) {
      const item = itemsById.get(part.itemId);
      if (!item) continue;
      item.qtyOnHand = item.qtyOnHand - part.qty * line.qty * direction;
      item.updatedAt = now;
    }
  }
}

export async function setOrderStatus(
  db: Database,
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  await db.write((state) => {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;

    const now = Date.now();

    if (status === 'preparing' && !order.stockApplied) {
      moveStock(state, orderId, 1, now);
      order.stockApplied = true;
    } else if (status === 'cancelled' && order.stockApplied) {
      moveStock(state, orderId, -1, now);
      order.stockApplied = false;
    }

    order.status = status;
    order.updatedAt = now;

    if (status === 'ready' && order.readyAt === null) {
      order.readyAt = now;
    }
  });
}

export async function completeOrder(
  db: Database,
  orderId: string,
  paymentMethod: PaymentMethod,
): Promise<void> {
  await db.write((state) => {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;
    order.status = 'completed';
    order.paymentMethod = paymentMethod;
    order.updatedAt = Date.now();
  });
}

export async function cancelOrder(db: Database, orderId: string): Promise<void> {
  await setOrderStatus(db, orderId, 'cancelled');
}

export async function getDaySummary(db: Database, day: string): Promise<DaySummary> {
  return db.read((state) => {
    const rows = state.orders.filter((o) => o.day === day && o.status !== 'cancelled');
    let totalCents = 0;
    let takeawayCount = 0;
    let dineInCount = 0;

    for (const row of rows) {
      totalCents += row.totalCents;
      if (row.type === 'takeaway') takeawayCount += 1;
      else dineInCount += 1;
    }

    return {
      orderCount: rows.length,
      totalCents,
      takeawayCount,
      dineInCount,
    };
  });
}

export function nextStatusOf(order: Order): OrderStatus | null {
  return NEXT_STATUS[order.status] ?? null;
}
