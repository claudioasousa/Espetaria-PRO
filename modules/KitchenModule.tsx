
import React, { useMemo } from 'react';
import { useAppState } from '../store';
import { OrderStatus, OrderItem } from '../types';

const KitchenModule: React.FC = () => {
  const { orders, updateOrderStatus } = useAppState();
  
  // Função auxiliar para identificar se o item é alimento
  const isFood = (item: OrderItem) => item.category !== 'Bebidas';

  // Filtra e prepara os pedidos para a cozinha
  const kitchenOrders = useMemo(() => {
    return orders
      .filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING)
      .map(order => ({
        ...order,
        // Filtra apenas os itens que não são bebidas para exibição
        foodItems: order.items.filter(isFood)
      }))
      // Apenas mostra o card se houver pelo menos um item que não seja bebida
      .filter(order => order.foodItems.length > 0)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [orders]);

  const getTimeElapsed = (timestamp: string | Date) => {
    const start = new Date(timestamp).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - start) / 60000);
    return isNaN(diff) ? 0 : diff;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex justify-between items-center bg-gray-900 text-white p-8 rounded-3xl shadow-2xl">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-4">
            <div className="bg-orange-500 w-12 h-12 rounded-2xl flex items-center justify-center"><i className="fas fa-fire"></i></div>
            COZINHA
          </h2>
          <p className="text-gray-400 mt-1">Fila de preparo (Apenas Alimentos)</p>
        </div>
        <div className="text-right">
          <span className="text-5xl font-black text-orange-500">{kitchenOrders.length}</span>
          <p className="text-[10px] text-gray-500 font-black uppercase">Pedidos de Comida</p>
        </div>
      </header>

      {kitchenOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-32 text-center border-2 border-dashed border-gray-200">
          <i className="fas fa-check-circle text-gray-100 text-9xl mb-8"></i>
          <h3 className="text-3xl font-black text-gray-300 uppercase">Sem comida para preparar</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {kitchenOrders.map(order => {
            const minutes = getTimeElapsed(order.timestamp);
            const isLate = minutes > 15;

            return (
                <div key={order.id} className={`bg-white rounded-[2rem] shadow-xl border-t-[12px] flex flex-col ${order.status === OrderStatus.PENDING ? 'border-orange-500' : 'border-blue-500'}`}>
                    <div className="p-6 border-b flex justify-between items-start">
                        <div>
                            <span className="text-4xl font-black">#M{order.tableNumber}</span>
                            <p className="text-[10px] font-black text-gray-400 uppercase mt-1">Aberto há {minutes}m</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${isLate ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500'}`}>
                            {isLate ? 'Atrasado' : order.status}
                        </div>
                    </div>

                    <div className="p-6 space-y-4 flex-grow">
                        {order.foodItems.map((item, idx) => (
                            <div key={idx} className="flex gap-4">
                                <div className="bg-gray-900 text-white w-8 h-8 rounded-lg flex items-center justify-center font-black flex-shrink-0">{item.quantity}</div>
                                <div>
                                    <p className="font-bold text-lg text-gray-800 leading-tight">{item.name}</p>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{item.category}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 bg-gray-50 rounded-b-[2rem]">
                        {order.status === OrderStatus.PENDING ? (
                            <button onClick={() => updateOrderStatus(order.id, OrderStatus.PREPARING)} className="w-full bg-orange-500 text-white font-black py-4 rounded-xl uppercase text-xs">Iniciar Preparo</button>
                        ) : (
                            <button onClick={() => updateOrderStatus(order.id, OrderStatus.READY)} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl uppercase text-xs">Pronto para Entrega</button>
                        )}
                    </div>
                </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KitchenModule;
