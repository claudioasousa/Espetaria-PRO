
import { Product, Table, InventoryItem, Employee } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Espetinho de Carne', price: 12.00, category: 'Espetos', stock: 100 },
  { id: '2', name: 'Espetinho de Frango', price: 10.00, category: 'Espetos', stock: 80 },
  { id: '3', name: 'Espetinho de Queijo Coalho', price: 11.00, category: 'Espetos', stock: 50 },
  { id: '4', name: 'Pão de Alho', price: 8.00, category: 'Acompanhamentos', stock: 120 },
  { id: '5', name: 'Cerveja Lata', price: 7.00, category: 'Bebidas', stock: 200 },
  { id: '6', name: 'Refrigerante', price: 6.00, category: 'Bebidas', stock: 150 },
];

export const INITIAL_TABLES: Table[] = Array.from({ length: 15 }, (_, i) => ({
  number: i + 1,
  status: 'AVAILABLE'
}));

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'i1', name: 'Alcatra (kg)', quantity: 25, unit: 'kg', minStock: 5 },
  { id: 'i2', name: 'Carvão (saco)', quantity: 10, unit: 'un', minStock: 3 },
  { id: 'i3', name: 'Cerveja (engradado)', quantity: 15, unit: 'un', minStock: 5 },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'e1', name: 'Ricardo Santos', role: 'ADMIN' },
  { id: 'e2', name: 'Maria Silva', role: 'WAITER' },
  { id: 'e3', name: 'Carlos Chef', role: 'CHEF' },
];
