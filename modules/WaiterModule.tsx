
import React, { useState } from 'react';
import { useAppState } from '../store';
import { Product, OrderItem } from '../types';

const WaiterModule: React.FC = () => {
  const { tables, products, addOrder, updateTableStatus } = useAppState();
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');

  const categories: string[] = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];

  const handleTableSelection = async (tableNumber: number, currentStatus: string) => {
    // Se a mesa estiver livre, avisamos o banco que ela está sendo aberta/ocupada agora
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
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
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
      total: cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0)
    });

    if (success) {
      setCart([]);
      setSelectedTable(null);
      alert("🚀 Pedido enviado com sucesso para a cozinha!");
    } else {
      alert("❌ Erro ao enviar pedido. Verifique a conexão.");
    }
  };

  const filteredProducts = activeCategory === 'Todos' ? products : products.filter(p => p.category === activeCategory);

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      <header className="flex justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
            <div className="bg-orange-500 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
                <i className="fas fa-hand-holding-heart text-sm"></i>
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Terminal Mobile</h2>
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
                  <h3 className="text-2xl font-black text-gray-900">Selecione a Mesa</h3>
                  <p className="text-gray-400 text-sm font-medium">Toque em uma mesa livre para ocupar e abrir pedido</p>
              </div>
              <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                      <span className="text-[10px] font-bold text-gray-400">LIVRE</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-[10px] font-bold text-gray-400">OCUPADA</span>
                  </div>
              </div>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4">
            {tables.map(table => (
              <button
                key={table.number}
                onClick={() => handleTableSelection(table.number, table.status)}
                className={`group p-6 rounded-3xl flex flex-col items-center justify-center transition-all aspect-square ${
                  table.status === 'OCCUPIED' 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 scale-95' 
                    : 'bg-gray-50 border-2 border-transparent hover:border-orange-500 text-gray-900 active:scale-90'
                }`}
              >
                <span className="text-3xl font-black">{table.number}</span>
                <span className="text-[9px] mt-2 font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                    {table.status === 'OCCUPIED' ? 'Ativa' : 'Abrir'}
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 sticky top-24 bg-gray-50 z-20">
              <button 
                onClick={() => setSelectedTable(null)}
                className="flex-shrink-0 bg-white shadow-sm border border-gray-100 text-gray-700 w-12 h-12 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-8 py-4 rounded-2xl text-sm font-black transition-all ${
                    activeCategory === cat 
                        ? 'bg-orange-500 text-white shadow-xl shadow-orange-100' 
                        : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
                  }`}
                >
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
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Preço Un.</p>
                        <span className="text-xl font-black text-gray-900 tracking-tighter">R$ {product.price.toFixed(2)}</span>
                    </div>
                    <div className="bg-orange-50 text-orange-500 w-12 h-12 rounded-2xl flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all shadow-sm">
                      <i className="fas fa-plus text-sm"></i>
                    </div>
                  </div>
                  <div className="absolute -right-4 -top-4 bg-gray-50 w-24 h-24 rounded-full opacity-50 scale-0 group-hover:scale-100 transition-transform"></div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[75vh]">
              <div className="p-6 bg-orange-500 text-white">
                <div className="flex justify-between items-center mb-1">
                    <h3 className="font-black uppercase tracking-widest text-lg">Mesa {selectedTable}</h3>
                    <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase">Novo Pedido</div>
                </div>
                <p className="text-orange-100 text-xs font-medium">Itens na comanda temporária</p>
              </div>
              
              <div className="flex-grow p-6 overflow-y-auto space-y-4 no-scrollbar bg-gray-50/50">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-300">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-inner mb-6">
                        <i className="fas fa-utensils text-3xl opacity-20"></i>
                    </div>
                    <p className="text-sm font-black uppercase tracking-widest opacity-40">Pedido vazio</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.productId} className="flex justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 group">
                      <div className="flex-grow">
                        <p className="font-black text-gray-900 text-sm leading-none mb-1">{item.name}</p>
                        <p className="text-[10px] text-orange-500 font-black uppercase">R$ {(item.price * item.quantity).toFixed(2)}</p>
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
                  <span className="text-gray-400 font-black text-xs uppercase tracking-widest">Valor Total</span>
                  <span className="text-3xl font-black text-gray-900 tracking-tighter">
                    R$ {cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0).toFixed(2)}
                  </span>
                </div>
                <button
                  disabled={cart.length === 0}
                  onClick={submitOrder}
                  className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 text-white font-black py-5 rounded-3xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                >
                  <i className="fas fa-paper-plane"></i>
                  Enviar à Cozinha
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
