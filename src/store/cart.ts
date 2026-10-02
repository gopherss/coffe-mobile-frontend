import { create } from 'zustand';

import type { OrderType, PaymentMethod } from '@/lib/constants';
import type { NewOrderInput, Product } from '@/db/types';

export interface CartLine {
  key: string;
  productId: string | null;
  productName: string;
  unitPriceCents: number;
  qty: number;
  notes: string | null;
}

interface CartState {
  type: OrderType;
  tableNo: string;
  customerName: string;
  notes: string;
  lines: CartLine[];
  setType: (type: OrderType) => void;
  setTableNo: (value: string) => void;
  setCustomerName: (value: string) => void;
  setNotes: (value: string) => void;
  addProduct: (product: Product, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  setLineNotes: (key: string, notes: string | null) => void;
  removeLine: (key: string) => void;
  clear: () => void;
}

const initialMeta = {
  type: 'takeaway' as OrderType,
  tableNo: '',
  customerName: '',
  notes: '',
  lines: [] as CartLine[],
};

function lineKey(productId: string, notes: string | null): string {
  return `${productId}::${notes ?? ''}`;
}

export const useCart = create<CartState>((set) => ({
  ...initialMeta,

  setType: (type) => set({ type }),
  setTableNo: (value) => set({ tableNo: value }),
  setCustomerName: (value) => set({ customerName: value }),
  setNotes: (value) => set({ notes: value }),

  addProduct: (product, qty = 1) =>
    set((state) => {
      const key = lineKey(product.id, null);
      const existing = state.lines.find((line) => line.key === key);
      if (existing) {
        return {
          lines: state.lines.map((line) =>
            line.key === key ? { ...line, qty: line.qty + qty } : line,
          ),
        };
      }
      return {
        lines: [
          ...state.lines,
          {
            key,
            productId: product.id,
            productName: product.name,
            unitPriceCents: product.priceCents,
            qty,
            notes: null,
          },
        ],
      };
    }),

  setQty: (key, qty) =>
    set((state) => ({
      lines:
        qty <= 0
          ? state.lines.filter((line) => line.key !== key)
          : state.lines.map((line) => (line.key === key ? { ...line, qty } : line)),
    })),

  setLineNotes: (key, notes) =>
    set((state) => {
      const target = state.lines.find((line) => line.key === key);
      if (!target) return state;
      const normalized = notes && notes.trim() ? notes.trim() : null;
      const nextKey = lineKey(target.productId ?? '', normalized);
      if (nextKey === key) {
        return {
          lines: state.lines.map((line) =>
            line.key === key ? { ...line, notes: normalized } : line,
          ),
        };
      }
      const others = state.lines.filter((line) => line.key !== key);
      const collision = others.find((line) => line.key === nextKey);
      if (collision) {
        return {
          lines: others.map((line) =>
            line.key === nextKey ? { ...line, qty: line.qty + target.qty } : line,
          ),
        };
      }
      return {
        lines: [...others, { ...target, key: nextKey, notes: normalized }],
      };
    }),

  removeLine: (key) =>
    set((state) => ({ lines: state.lines.filter((line) => line.key !== key) })),

  clear: () => set({ ...initialMeta }),
}));

export function cartTotals(lines: CartLine[]): {
  totalCents: number;
  count: number;
} {
  let totalCents = 0;
  let count = 0;
  for (const line of lines) {
    totalCents += line.unitPriceCents * line.qty;
    count += line.qty;
  }
  return { totalCents, count };
}

export function toNewOrder(state: CartState): NewOrderInput {
  return {
    type: state.type,
    tableNo: state.tableNo.trim() ? state.tableNo.trim() : null,
    customerName: state.customerName.trim() ? state.customerName.trim() : null,
    notes: state.notes.trim() ? state.notes.trim() : null,
    items: state.lines.map((line) => ({
      productId: line.productId,
      productName: line.productName,
      unitPriceCents: line.unitPriceCents,
      qty: line.qty,
      notes: line.notes,
    })),
  };
}

export function isValidPaymentMethod(value: unknown): value is PaymentMethod {
  return value === 'cash' || value === 'card';
}
