
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Order, OrderStatus, Product, Table, InventoryItem, Employee } from './types';

const API_URL = '/api'; // Usando proxy do Vite ou caminho relativo

interface AppState {
  orders: Order[];
  products: Product[];
  tables: Table[];
  inventory: InventoryItem[];
  employees: Employee[];
  loading: boolean;
  apiConnected: boolean;
  addOrder: (order: Omit<Order, 'id' | 'timestamp' | 'status'>) => Promise<boolean>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);

  const refreshData = useCallback(async () => {
    try {
      const [resProducts, resTables, resOrders, resInventory] = await Promise.all([
        fetch(`${API_URL}/products`),
        fetch(`${API_URL}/tables`),
        fetch(`${API_URL}/orders`),
        fetch(`${API_URL}/inventory`).catch(() => null)
      ]);

      if (resProducts.ok && resTables.ok && resOrders.ok) {
        const [p, t, o, i] = await Promise.all([
          resProducts.json(),
          resTables.json(),
          resOrders.json(),
          resInventory ? resInventory.json() : []
        ]);
        setProducts(p);
        setTables(t);
        setOrders(o);
        setInventory(i);
        setApiConnected(true);
      } else {
        setApiConnected(false);
      }
    } catch (error) {
      console.error("Erro na sincronização:", error);
      setApiConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000); // Polling agressivo para tempo real
    return () => clearInterval(interval);
  }, [refreshData]);

  const addOrder = useCallback(async (orderData: Omit<Order, 'id' | 'timestamp' | 'status'>) => {
    const newOrder = {
      ...orderData,
      id: Math.random().toString(36).substr(2, 9),
    };

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
      
      if (res.ok) {
        await refreshData();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro ao enviar pedido:", error);
      return false;
    }
  }, [refreshData]);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) await refreshData();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  }, [refreshData]);

  return (
    <AppContext.Provider value={{ 
      orders, products, tables, inventory, employees, loading, apiConnected,
      addOrder, updateOrderStatus, refreshData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppState deve ser usado dentro de um AppProvider');
  return context;
};
