
import React, { useMemo, useState } from 'react';
import { useAppState } from '../store';
import { OrderStatus, OrderItem } from '../types';

const KitchenModule: React.FC = () => {
  const { orders, updateOrderStatus } = useAppState();
  const [filter, setFilter] = useState<OrderStatus | 'TODOS'>(OrderStatus.PENDING);
  
  // Função auxiliar para identificar se o item é alimento (Filtro fixo solicitado anteriormente)
  const isFood = (item: OrderItem) => item.category !== 'Bebidas';

  // Filtra pedidos que contenham comida
  const allFoodOrders = useMemo(() => {
    return orders
      .map(order => ({
        ...order,
        foodItems: order.items.filter(isFood)
      }))
      .filter(order => order.foodItems.length > 0);
  }, [orders]);

  // Contadores para as abas
  const counts = useMemo(() => ({
    pending: allFoodOrders.filter(o => o.status === OrderStatus.PENDING).length,
    preparing: allFoodOrders.filter(o => o.status === OrderStatus.PREPARING).length,
    ready: allFoodOrders.filter(o => o.status === OrderStatus.READY).length,
  }), [allFoodOrders]);

  // Pedidos filtrados pela aba selecionada
  const filteredOrders = useMemo(() => {
    let result = allFoodOrders;
    if (filter !== 'TODOS') {
      result = result.filter(o => o.status === filter);
    }
    return result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [allFoodOrders, filter]);

  const getTimeElapsed = (timestamp: string | Date) => {
    const start = new Date(timestamp).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - start) / 60000);
    return isNaN(diff) ? 0 : diff;
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'border-orange-500';
      case OrderStatus.PREPARING: return 'border-blue-500';
      case OrderStatus.READY: return 'border-green-500';
      default: return 'border-gray-200';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-2xl overflow-hidden relative">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black flex items-center gap-4">
              <div className="bg-orange-500 w-12 h-12 rounded-2xl flex items-center justify-center">
                <i className="fas fa-fire"></i>
              </div>
              PRODUÇÃO COZINHA
            </h2>
            <p className="text-gray-400 mt-1 font-medium">Monitoramento de pedidos em tempo real</p>
          </div>
          
          <div className="flex bg-white/5 p-2 rounded-2xl backdrop-blur-md">
            <div className="px-6 py-2 border-r border-white/10 text-center">
              <span className="block text-2xl font-black text-orange-500">{counts.pending}</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Pendentes</span>
            </div>
            <div className="px-6 py-2 border-r border-white/10 text-center">
              <span className="block text-2xl font-black text-blue-400">{counts.preparing}</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">No Fogo</span>
            </div>
            <div className="px-6 py-2 text-center">
              <span className="block text-2xl font-black text-green-400">{counts.ready}</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Prontos</span>
            </div>
          </div>
        </div>
        {/* Decorativo de fundo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
      </header>

      {/* TABS DE FILTRAGEM */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        <button 
          onClick={() => setFilter(OrderStatus.PENDING)}
          className={`flex-shrink-0 px-8 py-4 rounded-2xl text-xs font-black transition-all uppercase tracking-widest flex items-center gap-3 ${filter === OrderStatus.PENDING ? 'bg-orange-500 text-white shadow-xl scale-105' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}
        >
          <i className="fas fa-clock"></i> Pendentes
        </button>
        <button 
          onClick={() => setFilter(OrderStatus.PREPARING)}
          className={`flex-shrink-0 px-8 py-4 rounded-2xl text-xs font-black transition-all uppercase tracking-widest flex items-center gap-3 ${filter === OrderStatus.PREPARING ? 'bg-blue-600 text-white shadow-xl scale-105' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}
        >
          <i className="fas fa-utensils"></i> Preparando
        </button>
        <button 
          onClick={() => setFilter(OrderStatus.READY)}
          className={`flex-shrink-0 px-8 py-4 rounded-2xl text-xs font-black transition-all uppercase tracking-widest flex items-center gap-3 ${filter === OrderStatus.READY ? 'bg-green-600 text-white shadow-xl scale-105' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}
        >
          <i className="fas fa-check-double"></i> Prontos
        </button>
        <button 
          onClick={() => setFilter('TODOS')}
          className={`flex-shrink-0 px-8 py-4 rounded-2xl text-xs font-black transition-all uppercase tracking-widest flex items-center gap-3 ${filter === 'TODOS' ? 'bg-gray-900 text-white shadow-xl scale-105' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}
        >
          Todos
        </button>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-24 text-center border-2 border-dashed border-gray-100 flex flex-col items-center">
          <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mb-6">
            <i className="fas fa-clipboard-list text-gray-200 text-4xl"></i>
          </div>
          <h3 className="text-2xl font-black text-gray-300 uppercase tracking-widest">Nada por aqui</h3>
          <p className="text-gray-400 mt-2 font-medium">Não há pedidos com o status selecionado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredOrders.map(order => {
            const minutes = getTimeElapsed(order.timestamp);
            const isLate = minutes > 15 && order.status !== OrderStatus.READY;

            return (
              <div 
                key={order.id} 
                className={`bg-white rounded-[2.5rem] shadow-xl border-t-[10px] flex flex-col transition-all hover:translate-y-[-5px] ${getStatusColor(order.status as OrderStatus)}`}
              >
                <div className="p-6 border-b border-gray-50 flex justify-between items-start">
                  <div>
                    <span className="text-4xl font-black text-gray-900 tracking-tighter">#M{order.tableNumber}</span>
                    <p className={`text-[10px] font-black uppercase mt-1 tracking-widest ${isLate ? 'text-red-500' : 'text-gray-400'}`}>
                      {isLate ? '⚠️ URGENTE - ' : ''}{minutes} min atrás
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${isLate ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500'}`}>
                    {order.status}
                  </div>
                </div>

                <div className="p-6 space-y-4 flex-grow">
                  {order.foodItems.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center">
                      <div className="bg-gray-900 text-white w-9 h-9 rounded-xl flex items-center justify-center font-black flex-shrink-0 text-sm">
                        {item.quantity}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-800 leading-tight truncate">{item.name}</p>
                        {item.notes && <p className="text-[10px] text-orange-500 font-bold italic mt-0.5">Obs: {item.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-gray-50/50 rounded-b-[2.5rem] mt-auto">
                  {order.status === OrderStatus.PENDING && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, OrderStatus.PREPARING)} 
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-5 rounded-2xl shadow-lg shadow-orange-100 transition-all active:scale-95 uppercase text-[11px] tracking-widest"
                    >
                      Iniciar Preparo
                    </button>
                  )}
                  {order.status === OrderStatus.PREPARING && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, OrderStatus.READY)} 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-95 uppercase text-[11px] tracking-widest"
                    >
                      Finalizar Pedido
                    </button>
                  )}
                  {order.status === OrderStatus.READY && (
                    <div className="flex flex-col items-center gap-2 text-green-600 py-2">
                       <i className="fas fa-check-circle text-2xl"></i>
                       <span className="text-[10px] font-black uppercase tracking-widest">Pronto para Retirada</span>
                    </div>
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
