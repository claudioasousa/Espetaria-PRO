
import React, { useState, useEffect, useMemo } from 'react';
import { useAppState } from '../store';
import { Product, OrderItem, OrderStatus } from '../types';

const WaiterModule: React.FC = () => {
  const { tables, products, orders, addOrder, updateTableStatus } = useAppState();
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [lastReadyCount, setLastReadyCount] = useState(0);

  // Categorias únicas do cardápio para o filtro
  const categories: string[] = ['Todos', ...Array.from(new Set<string>(products.map(p => p.category)))];

  // Identifica quais mesas possuem pedidos com status 'PRONTO' (aguardando entrega)
  const readyTables = useMemo(() => {
    const readySet = new Set<number>();
    orders.forEach(order => {
      if (order.status === OrderStatus.READY) {
        readySet.add(Number(order.tableNumber));
      }
    });
    return readySet;
  }, [orders]);

  // Efeito para detectar novos pedidos prontos e emitir alerta visual/log
  useEffect(() => {
    if (readyTables.size > lastReadyCount) {
      console.log("🔔 Novo pedido pronto para entrega!");
      // Em dispositivos móveis, poderíamos usar window.navigator.vibrate([200, 100, 200])
      setLastReadyCount(readyTables.size);
    } else {
      setLastReadyCount(readyTables.size);
    }
  }, [readyTables.size, lastReadyCount]);

  const handleTableSelection = async (tableNumber: number, currentStatus: string) => {
    if (currentStatus === 'AVAILABLE') {
      await updateTableStatus(tableNumber, 'OCCUPIED');
    }
    setSelectedTable(tableNumber);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { productId: product.id, name: product.name, price: Number(product.price), quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
        const existing = prev.find(item => item.productId === productId);
        if (existing && existing.quantity > 1) {
            return prev.map(item => item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item);
        }
        return prev.filter(item => item.productId !== productId);
    });
  };

  const submitOrder = async () => {
    if (!selectedTable || cart.length === 0) return;
    
    const success = await addOrder({
      tableNumber: selectedTable,
      waiterName: 'Operador Padrão',
      items: cart,
      total: cart.reduce((acc, curr) => acc + (Number(curr.price) * curr.quantity), 0)
    });

    if (success) {
      setCart([]);
      setSelectedTable(null);
      alert("🚀 Pedido enviado com sucesso!");
    } else {
      alert("❌ Erro ao enviar pedido.");
    }
  };

  const filteredProducts = activeCategory === 'Todos' ? products : products.filter(p => p.category === activeCategory);

  return (
    <div className="space-y-6 animate-fadeIn pb-24 relative">
      
      {/* BANNER DE ALERTA FLUTUANTE - Aparece apenas quando há pedidos prontos */}
      {readyTables.size > 0 && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md">
            <div className="bg-orange-500 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center justify-between animate-bounce border-4 border-white">
                <div className="flex items-center gap-3">
                    <i className="fas fa-bell text-2xl"></i>
                    <div>
                        <p className="font-black text-sm uppercase tracking-tighter">Pedido Pronto!</p>
                        <p className="text-[10px] font-bold opacity-90">Mesa(s): {Array.from(readyTables).join(', ')}</p>
                    </div>
                </div>
                <div className="bg-white text-orange-600 px-3 py-1 rounded-full text-[10px] font-black">ENTREGAR</div>
            </div>
        </div>
      )}

      <header className="flex justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
            <div className="bg-gray-900 w-10 h-10 rounded-xl flex items-center justify-center text-white">
                <i className="fas fa-hand-holding-heart text-sm"></i>
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Atendimento</h2>
        </div>
        <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronizado</span>
        </div>
      </header>

      {!selectedTable ? (
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-end mb-8">
              <div>
                  <h3 className="text-2xl font-black text-gray-900">Mapa de Mesas</h3>
                  <p className="text-gray-400 text-sm font-medium">Laranja indica que o pedido saiu da cozinha</p>
              </div>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6">
            {tables.map(table => {
              const isReady = readyTables.has(Number(table.number));
              const isOccupied = table.status === 'OCCUPIED';

              return (
                <button
                  key={table.number}
                  onClick={() => handleTableSelection(table.number, table.status)}
                  className={`group p-6 rounded-[2.5rem] flex flex-col items-center justify-center transition-all aspect-square relative ${
                    isReady 
                      ? 'bg-orange-500 text-white shadow-2xl shadow-orange-200 animate-pulse scale-105 z-10 border-4 border-white' 
                      : isOccupied 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'bg-gray-50 border-2 border-transparent hover:border-orange-500 text-gray-400 active:scale-95'
                  }`}
                >
                  <span className="text-3xl font-black">{table.number}</span>
                  
                  {isReady && (
                      <div className="absolute -top-3 -right-3 bg-white text-orange-500 w-10 h-10 rounded-full flex items-center justify-center shadow-xl border-2 border-orange-500">
                          <i className="fas fa-concierge-bell text-sm"></i>
                      </div>
                  )}

                  <span className="text-[9px] mt-1 font-black uppercase opacity-60 tracking-widest">
                    {isReady ? 'PRONTO' : isOccupied ? 'EM USO' : 'LIVRE'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-4 sticky top-24 bg-gray-50 z-20">
              <button onClick={() => setSelectedTable(null)} className="flex-shrink-0 bg-white shadow-sm border border-gray-100 text-gray-700 w-12 h-12 rounded-2xl flex items-center justify-center active:scale-90">
                <i className="fas fa-chevron-left"></i>
              </button>
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`flex-shrink-0 px-8 py-4 rounded-2xl text-sm font-black transition-all ${activeCategory === cat ? 'bg-orange-500 text-white shadow-xl' : 'bg-white border border-gray-100 text-gray-500'}`}>
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all text-left flex flex-col justify-between group h-48 relative overflow-hidden active:scale-95"
                >
                  <div className="relative z-10">
                    <span className="text-[10px] text-orange-500 font-black uppercase tracking-widest">{product.category}</span>
                    <h4 className="font-black text-gray-900 leading-tight mt-1 text-lg group-hover:text-orange-600 transition-colors">{product.name}</h4>
                  </div>
                  <div className="flex justify-between items-end relative z-10">
                    <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Preço</p>
                        <span className="text-xl font-black text-gray-900 tracking-tighter">R$ {Number(product.price).toFixed(2)}</span>
                    </div>
                    <div className="bg-orange-50 text-orange-500 w-12 h-12 rounded-2xl flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all shadow-sm">
                      <i className="fas fa-plus text-sm"></i>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[75vh]">
              <div className="p-6 bg-orange-500 text-white">
                <h3 className="font-black uppercase tracking-widest text-lg">Mesa {selectedTable}</h3>
                <p className="text-orange-100 text-xs font-medium">Itens no carrinho</p>
              </div>
              
              <div className="flex-grow p-6 overflow-y-auto space-y-4 no-scrollbar bg-gray-50/50">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-300">
                    <i className="fas fa-utensils text-3xl opacity-20 mb-4"></i>
                    <p className="text-sm font-black uppercase tracking-widest opacity-40">Adicione itens</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.productId} className="flex justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                      <div className="flex-grow">
                        <p className="font-black text-gray-900 text-sm leading-none mb-1">{item.name}</p>
                        <p className="text-[10px] text-orange-500 font-black uppercase">R$ {(Number(item.price) * item.quantity).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => removeFromCart(item.productId)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <i className="fas fa-minus-circle"></i>
                        </button>
                        <span className="font-black text-gray-900 bg-gray-100 w-8 h-8 flex items-center justify-center rounded-xl text-sm">{item.quantity}</span>
                        <button onClick={() => {
                            const p = products.find(prod => prod.id === item.productId);
                            if(p) addToCart(p);
                        }} className="text-gray-300 hover:text-green-500 transition-colors">
                          <i className="fas fa-plus-circle"></i>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 bg-white border-t border-gray-100 space-y-6">
                <div className="flex justify-between items-center px-2">
                  <span className="text-gray-400 font-black text-xs uppercase tracking-widest">Total</span>
                  <span className="text-3xl font-black text-gray-900 tracking-tighter">
                    R$ {cart.reduce((acc, curr) => acc + (Number(curr.price) * curr.quantity), 0).toFixed(2)}
                  </span>
                </div>
                <button disabled={cart.length === 0} onClick={submitOrder} className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 text-white font-black py-5 rounded-3xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-xs">
                  Confirmar Pedido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaiterModule;
