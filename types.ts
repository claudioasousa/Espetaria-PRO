
export type Module = 'ADMIN' | 'WAITER' | 'KITCHEN' | 'FINANCE';

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
  category?: string;
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
  payment_method?: PaymentMethod;
  amount_paid?: number;
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

// Novos tipos financeiros
export interface CashSession {
  id: number;
  start_time: string;
  end_time: string | null;
  opening_balance: number;
  closing_balance: number | null;
  status: 'OPEN' | 'CLOSED';
}

export interface CashTransaction {
  id: number;
  session_id: number;
  type: 'APORTE' | 'SANGRIA';
  amount: number;
  description: string;
  timestamp: string;
}
