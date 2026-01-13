
export type Module = 'ADMIN' | 'WAITER' | 'KITCHEN';

export enum OrderStatus {
  PENDING = 'PENDENTE',
  PREPARING = 'PREPARANDO',
  READY = 'PRONTO',
  DELIVERED = 'ENTREGUE',
  PAID = 'PAGO'
}

export enum PaymentMethod {
  CASH = 'DINHEIRO',
  PIX = 'PIX',
  DEBIT = 'DÉBITO',
  CREDIT = 'CRÉDITO',
  MEAL_VOUCHER = 'ALIMENTAÇÃO',
  MEAL_CARD = 'REFEIÇÃO'
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: string;
  tableNumber: number;
  waiterName: string;
  items: OrderItem[];
  status: OrderStatus;
  timestamp: Date;
  total: number;
}

export interface Table {
  number: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'PENDING_PAYMENT';
  currentOrderId?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: 'ADMIN' | 'WAITER' | 'CHEF';
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minStock: number;
}
