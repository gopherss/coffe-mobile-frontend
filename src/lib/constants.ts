export const CATEGORIES = ['cafe', 'fria', 'panaderia', 'otros'] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  cafe: 'Café',
  fria: 'Fría',
  panaderia: 'Panadería',
  otros: 'Otros',
};

export const UNITS = ['g', 'ml', 'uds'] as const;
export type Unit = (typeof UNITS)[number];

export const ORDER_TYPES = ['takeaway', 'dine_in'] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  takeaway: 'Para llevar',
  dine_in: 'En el local',
};

export const ORDER_STATUSES = [
  'pending',
  'preparing',
  'ready',
  'completed',
  'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  preparing: 'En preparación',
  ready: 'Listo',
  completed: 'Entregado',
  cancelled: 'Cancelado',
};

export const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'preparing', 'ready'];

export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'preparing',
  preparing: 'ready',
  ready: 'completed',
};

export const NEXT_STATUS_ACTION: Partial<Record<OrderStatus, string>> = {
  pending: 'Empezar',
  preparing: 'Marcar listo',
  ready: 'Entregar',
};

export const PAYMENT_METHODS = ['cash', 'card'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
};

export const PREP_NOTE_PRESETS = [
  'Sin azúcar',
  'Extra shot',
  'Descafeinado',
  'Leche de avena',
  'Sin leche',
  'Poco hielo',
  'Caliente',
];

/** Minutos después de creado el pedido a partir de los cuales se marca como demorado. */
export const LATE_THRESHOLD_MINUTES = 6;
