import type {
  Category,
  OrderStatus,
  OrderType,
  PaymentMethod,
  Unit,
} from '@/lib/constants';

export interface Product {
  id: string;
  name: string;
  category: Category;
  priceCents: number;
  available: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: Unit;
  qtyOnHand: number;
  qtyMin: number;
}

export interface RecipePart {
  itemId: string;
  itemName: string;
  unit: Unit;
  qty: number;
}

export interface OrderLine {
  id: string;
  productId: string | null;
  productName: string;
  unitPriceCents: number;
  qty: number;
  notes: string | null;
  lineTotalCents: number;
}

export interface Order {
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
  items: OrderLine[];
}

export interface NewOrderLine {
  productId: string | null;
  productName: string;
  unitPriceCents: number;
  qty: number;
  notes: string | null;
}

export interface NewOrderInput {
  type: OrderType;
  tableNo: string | null;
  customerName: string | null;
  notes: string | null;
  items: NewOrderLine[];
}

export interface DaySummary {
  orderCount: number;
  totalCents: number;
  takeawayCount: number;
  dineInCount: number;
}
