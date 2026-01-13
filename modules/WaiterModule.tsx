
import React, { useState, useMemo } from 'react';
import { useAppState } from '../store';
import { Product, OrderItem, OrderStatus } from '../types';

const WaiterModule: React.FC = () => {
  const { tables, products, orders, addOrder, updateTableStatus } = useAppState();
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [isCartOpen, setIsCartOpen] = useState(false);

  const categories: string[] = ['Todos', ...Array.from(new Set<string>(products.map(p => p.category)))];

  const activeOrdersForTable = useMemo(() => 
    selectedTable ? orders.filter(o => o.tableNumber === selectedTable && o.status !== OrderStatus.PAID) : []
  , [selectedTable, orders]);

  const itemsAlreadyOnTable = useMemo(() => {
    const itemsMap = new Map<string, { name: string, quantity: number }>();
    activeOrdersForTable.forEach(order => {
      order.items.forEach(item => {
        const existing = itemsMap.get(item.productId);
        if (existing) {
          itemsMap.set(item.productId, { ...existing, quantity: existing.quantity + item.quantity });
        } else {
          itemsMap.set(item.productId, { name: item.name, quantity: item.quantity });
        }
      });
    });
    return Array.from(itemsMap.values());
  }, [activeOrdersForTable]);

  const readyTables = useMemo(() => {
    const readySet = new Set<number>();
    orders.forEach(order => {
      if (order.status === OrderStatus.READY) {
        readySet.add(Number(order.tableNumber));
      }
    });
    return readySet;
  }, [orders]);

  const handleTableSelection = async (tableNumber: number, currentStatus: string) => {
    if (currentStatus === 'AVAILABLE') {
      await updateTableStatus(tableNumber, 'OCCUPIED');
    }
    setSelectedTable(tableNumber);
    setIsCartOpen(false);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { 
        productId: product.id, 
        name: product.name, 
        price: Number(product.price), 
        quantity: 1,
        category: product.category 
      }];
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

  const cartTotal = useMemo(() => cart.reduce((acc, curr) => acc + (Number(curr.price) * curr.quantity), 0), [cart]);

  const submitOrder = async () => {
    if (!selectedTable || cart.length === 0) return;
    
    const success = await addOrder({
      tableNumber: selectedTable,
      waiterName: 'Operador Padrão',
      items: cart,
      total: cartTotal
    });

    if (success) {
      setCart([]);
      setSelectedTable(null);
      setIsCartOpen(false);
      alert("🚀 Pedido enviado!");
    } else {
      alert("❌ Erro ao enviar.");
    }
  };

  const filteredProducts = activeCategory === 'Todos' ? products : products.filter(p => p.category === activeCategory);

  return (
    <div className="h-[calc(100vh-64px)] md:h-screen flex flex-col animate-fadeIn bg-gray-50 overflow-hidden relative">
      
      {/* HEADER E CATEGORIAS UNIFICADOS (FIXOS) */}
      <div className="flex-none bg-white border-b border-gray-100 shadow-sm z-30">
        <header className="p-4 md:p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {selectedTable && (
              <button onClick={() => setSelectedTable(null)} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full text-gray-600 active:scale-90 transition-transform">
                <i className="fas fa-arrow-left"></i>
              </button>
            )}
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none">
                {selectedTable ? `Mesa ${selectedTable}` : 'Atendimento'}
              </h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                {selectedTable ? 'Cardápio Digital' : 'Selecione uma mesa'}
              </p>
            </div>
          </div>
          {!selectedTable && (
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[9px] font-black text-green-600 uppercase">Sincronizado</span>
            </div>
          )}
        </header>

        {/* Categoria Chips (Só aparece se houver mesa selecionada) */}
        {selectedTable && (
          <div className="px-4 pb-4 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)} 
                className={`flex-shrink-0 px-6 py-2.5 rounded-full text-[10px] font-black transition-all uppercase tracking-widest border ${
                  activeCategory === cat ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white text-gray-400 border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ÁREA DE CONTEÚDO SCROLLÁVEL */}
      <div className="flex-grow overflow-y-auto no-scrollbar pb-32 pt-2">
        {!selectedTable ? (
          /* MAPA DE MESAS */
          <div className="p-4 md:p-8 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-6">
            {tables.map(table => {
              const isReady = readyTables.has(Number(table.number));
              const isOccupied = table.status === 'OCCUPIED';

              return (
                <button
                  key={table.number}
                  onClick={() => handleTableSelection(table.number, table.status)}
                  className={`group relative aspect-square rounded-3xl flex flex-col items-center justify-center transition-all active:scale-95 border-2 ${
                    isReady 
                      ? 'bg-orange-500 border-orange-400 text-white shadow-xl' 
                      : isOccupied 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                        : 'bg-white border-gray-100 text-gray-300'
                  }`}
                >
                  <span className="text-2xl md:text-3xl font-black">{table.number}</span>
                  <span className="text-[8px] font-black uppercase opacity-60 tracking-widest mt-0.5">
                    {isReady ? 'PRONTO' : isOccupied ? 'MESA' : 'LIVRE'}
                  </span>
                  {isReady && (
                    <div className="absolute -top-1.5 -right-1.5 bg-white text-orange-500 w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-orange-500 animate-bounce">
                      <i className="fas fa-bell text-[10px]"></i>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* GRID DE PRODUTOS */
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white p-4 md:p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 active:scale-[0.97] transition-all group"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-active:bg-orange-500 group-active:text-white transition-colors flex-shrink-0">
                  <i className={`fas ${product.category === 'Bebidas' ? 'fa-glass-whiskey' : 'fa-drumstick-bite'} text-xl md:text-2xl`}></i>
                </div>
                <div className="flex-grow text-left min-w-0">
                  <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest block truncate">{product.category}</span>
                  <h4 className="font-black text-gray-900 leading-tight truncate text-sm md:text-base">{product.name}</h4>
                  <p className="text-sm font-black text-gray-900 mt-0.5">R$ {Number(product.price).toFixed(2)}</p>
                </div>
                <div className="w-9 h-9 md:w-10 md:h-10 bg-gray-900 rounded-full flex items-center justify-center text-white shadow-lg flex-shrink-0">
                  <i className="fas fa-plus text-[10px]"></i>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CARRINHO / EXTRATO (BOTTOM SHEET) */}
      {selectedTable && (
        <>
          {isCartOpen && (
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fadeIn"
              onClick={() => setIsCartOpen(false)}
            />
          )}

          <div className={`fixed bottom-0 left-0 right-0 z-50 bg-white shadow-[0_-15px_40px_rgba(0,0,0,0.08)] transition-all duration-500 ease-out rounded-t-[2.5rem] flex flex-col ${
            isCartOpen ? 'h-[80vh]' : 'h-24'
          }`}>
            
            {/* Handler do Bottom Sheet */}
            <div 
              className="px-6 py-4 flex justify-between items-center cursor-pointer relative"
              onClick={() => setIsCartOpen(!isCartOpen)}
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full absolute top-2.5 left-1/2 -translate-x-1/2"></div>
              
              <div className="flex items-center gap-3">
                 <div className="relative">
                    <div className="bg-orange-500 w-11 h-11 rounded-2xl flex items-center justify-center text-white">
                        <i className="fas fa-shopping-basket text-sm"></i>
                    </div>
                    {cart.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                        {cart.reduce((a, b) => a + b.quantity, 0)}
                      </span>
                    )}
                 </div>
                 <div className="leading-tight">
                    <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest">Pedido</h3>
                    <p className="text-[9px] font-bold text-gray-400">Ver Itens</p>
                 </div>
              </div>

              <div className="text-right">
                <span className="text-xl md:text-2xl font-black text-gray-900 tracking-tighter">R$ {cartTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Conteúdo Expansível */}
            <div className={`flex-grow overflow-y-auto px-6 pb-8 no-scrollbar space-y-6 ${isCartOpen || 'hidden'}`}>
              
              {/* Já na Mesa (Consumo) */}
              {itemsAlreadyOnTable.length > 0 && (
                <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <i className="fas fa-history text-blue-400 text-[10px]"></i>
                    <h4 className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Consumo da Mesa</h4>
                  </div>
                  <div className="space-y-1.5">
                    {itemsAlreadyOnTable.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-gray-600">{item.name}</span>
                        <span className="font-black text-blue-600">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Novos Itens */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Adicionando Agora</h4>
                </div>

                {cart.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-300">Nenhum item selecionado</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div key={item.productId} className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                        <div className="flex-grow min-w-0">
                          <p className="font-black text-gray-900 text-xs truncate leading-none mb-1">{item.name}</p>
                          <p className="text-[9px] font-bold text-orange-500">R$ {Number(item.price).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => removeFromCart(item.productId)} className="text-gray-300 active:text-red-500 transition-colors p-1">
                            <i className="fas fa-minus-circle"></i>
                          </button>
                          <span className="font-black text-gray-900 text-sm w-4 text-center">{item.quantity}</span>
                          <button onClick={() => {
                            const p = products.find(prod => prod.id === item.productId);
                            if(p) addToCart(p);
                          }} className="text-gray-300 active:text-green-500 transition-colors p-1">
                            <i className="fas fa-plus-circle"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rodapé do Bottom Sheet */}
              <div className="pt-2 space-y-3">
                 <button 
                  disabled={cart.length === 0} 
                  onClick={submitOrder}
                  className="w-full bg-gray-900 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-20 uppercase tracking-widest text-[11px]"
                >
                  Confirmar Pedido
                </button>
                <button 
                  onClick={() => { setSelectedTable(null); setCart([]); }}
                  className="w-full text-[9px] font-black text-gray-400 uppercase tracking-widest py-2"
                >
                  Fechar Mesa
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WaiterModule;
