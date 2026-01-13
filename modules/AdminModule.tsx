
import React, { useState, useMemo } from 'react';
import { useAppState } from '../store';
import { OrderStatus, PaymentMethod } from '../types';

const AdminModule: React.FC = () => {
  const { orders, tables, updateOrderStatus, inventory, restockInventory, refreshData } = useAppState();
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'inventory'>('stats');

  // Filtra todos os pedidos abertos da mesa selecionada
  const activeOrdersForTable = useMemo(() => 
    selectedTable ? orders.filter(o => o.tableNumber === selectedTable && o.status !== OrderStatus.PAID) : []
  , [selectedTable, orders]);

  // Soma o total de todos os pedidos daquela mesa
  const tableTotal = useMemo(() => 
    activeOrdersForTable.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0)
  , [activeOrdersForTable]);
  
  const changeValue = useMemo(() => {
    const received = Number(amountReceived) || 0;
    return received - tableTotal;
  }, [amountReceived, tableTotal]);

  const handlePayment = async () => {
    if (!selectedMethod || activeOrdersForTable.length === 0) {
        alert("Selecione a forma de pagamento");
        return;
    }

    if (selectedMethod === PaymentMethod.CASH && Number(amountReceived) < tableTotal) {
        alert("Valor recebido é insuficiente.");
        return;
    }

    try {
      // Finaliza cada pedido individual daquela mesa
      const promises = activeOrdersForTable.map(order => 
        fetch(`/api/orders/${order.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: OrderStatus.PAID,
            payment_method: selectedMethod,
            amount_paid: selectedMethod === PaymentMethod.CASH ? Number(amountReceived) : tableTotal
          })
        })
      );

      await Promise.all(promises);
      
      setSelectedTable(null);
      setAmountReceived('');
      setSelectedMethod(null);
      refreshData();
      alert("Mesa finalizada com sucesso!");
    } catch (e) {
      alert("Erro ao finalizar venda.");
    }
  };

  const paymentOptions = [
    { id: PaymentMethod.CASH, label: 'Dinheiro', icon: 'fa-money-bill-wave' },
    { id: PaymentMethod.PIX, label: 'PIX', icon: 'fa-qrcode' },
    { id: PaymentMethod.DEBIT, label: 'Débito', icon: 'fa-credit-card' },
    { id: PaymentMethod.CREDIT, label: 'Crédito', icon: 'fa-credit-card' },
    { id: PaymentMethod.MEAL_VOUCHER, label: 'Alimentação', icon: 'fa-utensils' },
    { id: PaymentMethod.MEAL_CARD, label: 'Refeição', icon: 'fa-wallet' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Painel de Controle</h2>
        <div className="flex gap-2">
            <button onClick={() => setActiveTab('stats')} className={`px-5 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${activeTab === 'stats' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>Mesas</button>
            <button onClick={() => setActiveTab('inventory')} className={`px-5 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>Estoque</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {activeTab === 'stats' ? (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <h3 className="text-xl font-black mb-8">Mapa de Mesas</h3>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
                {tables.map(table => (
                  <button
                    key={table.number}
                    onClick={() => table.status === 'OCCUPIED' && setSelectedTable(table.number)}
                    className={`p-5 rounded-2xl flex flex-col items-center justify-center transition-all aspect-square border-2 ${
                      table.status === 'OCCUPIED' 
                        ? 'bg-blue-600 border-blue-400 text-white shadow-lg active:scale-95' 
                        : 'bg-gray-50 border-gray-100 text-gray-300 opacity-40 cursor-default'
                    }`}
                  >
                    <span className="text-2xl font-black">{table.number}</span>
                    <span className="text-[9px] font-black uppercase mt-1 tracking-widest">CAIXA</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <h3 className="text-xl font-black mb-8">Produtos em Estoque</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {inventory.map(item => (
                        <div key={item.id} className="p-6 bg-gray-50 rounded-3xl flex justify-between items-center border border-gray-100">
                            <div>
                                <p className="font-bold text-gray-800">{item.name}</p>
                                <p className="text-xs text-gray-400 font-black uppercase tracking-widest">{item.quantity} {item.unit}</p>
                            </div>
                            <button onClick={() => restockInventory(item.id, 1)} className="bg-white px-4 py-2 rounded-xl text-[10px] font-black text-orange-500 border border-gray-200">REPOR</button>
                        </div>
                    ))}
                </div>
            </div>
          )}
        </div>

        {/* COLUNA DO CAIXA - DESIGN FIEL À IMAGEM */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col min-h-[680px]">
            
            {/* Header Dark */}
            <div className="p-8 bg-[#111827] text-white">
              <h3 className="text-2xl font-black tracking-tight uppercase leading-none">CAIXA</h3>
              <p className="text-xs text-gray-400 mt-2 font-medium">Selecione uma mesa aberta</p>
            </div>

            {selectedTable && activeOrdersForTable.length > 0 ? (
              <div className="p-8 space-y-6 flex-grow flex flex-col animate-fadeIn">
                
                {/* Card Mesa (Azul claro) */}
                <div className="bg-[#eff6ff] p-7 rounded-[1.5rem] border border-[#dbeafe]">
                  <h4 className="text-4xl font-black text-[#1d4ed8]">Mesa {selectedTable}</h4>
                  <p className="text-[11px] text-[#2563eb] font-bold uppercase tracking-widest mt-1">FECHAMENTO DE CONTA</p>
                  <p className="text-[9px] text-gray-400 font-bold mt-2">{activeOrdersForTable.length} Pedidos acumulados</p>
                </div>

                {/* Valor Total Acumulado */}
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest pb-1">TOTAL ACUMULADO</span>
                    <span className="text-5xl font-black text-[#111827] tracking-tighter">R$ {tableTotal.toFixed(2)}</span>
                  </div>
                  <div className="border-b border-dashed border-gray-200 w-full"></div>
                </div>

                {/* Seleção de Forma de Pagamento */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Forma de Pagamento</p>
                  <div className="grid grid-cols-2 gap-2">
                    {paymentOptions.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setSelectedMethod(opt.id);
                          if(opt.id !== PaymentMethod.CASH) setAmountReceived('');
                        }}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                          selectedMethod === opt.id 
                            ? 'bg-orange-50 border-orange-500 text-orange-600 shadow-sm scale-[1.02]' 
                            : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                        }`}
                      >
                        <i className={`fas ${opt.icon} text-lg ${selectedMethod === opt.id ? 'text-orange-500' : 'text-gray-300'}`}></i>
                        <span className="text-[9px] font-black uppercase tracking-tight text-center leading-tight">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input condicional para Dinheiro */}
                {selectedMethod === PaymentMethod.CASH && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="relative">
                      <input 
                        type="number" 
                        value={amountReceived} 
                        onChange={(e) => setAmountReceived(e.target.value)} 
                        placeholder="Valor Recebido R$" 
                        className="w-full px-6 py-6 bg-[#f9fafb] border-2 border-[#f3f4f6] rounded-2xl text-xl font-black text-gray-700 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none transition-all"
                        autoFocus
                      />
                    </div>
                    
                    {Number(amountReceived) > 0 && (
                      <div className={`p-5 rounded-2xl flex justify-between items-center ${changeValue >= 0 ? 'bg-green-600 text-white shadow-lg' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase opacity-70 tracking-widest">{changeValue >= 0 ? 'Troco' : 'Falta'}</span>
                          <span className="text-2xl font-black tracking-tighter">R$ {Math.abs(changeValue).toFixed(2)}</span>
                        </div>
                        <i className={`fas ${changeValue >= 0 ? 'fa-coins' : 'fa-exclamation-circle'} text-3xl opacity-30`}></i>
                      </div>
                    )}
                  </div>
                )}

                {/* Botão Finalizar */}
                <div className="mt-auto pt-4">
                    <button 
                        disabled={!selectedMethod || (selectedMethod === PaymentMethod.CASH && Number(amountReceived) < tableTotal)}
                        onClick={handlePayment} 
                        className={`w-full font-black py-6 rounded-[1.2rem] shadow-xl transition-all active:scale-95 uppercase tracking-widest text-sm ${
                            selectedMethod 
                            ? 'bg-[#f97316] hover:bg-[#ea580c] text-white shadow-orange-100' 
                            : 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
                        }`}
                    >
                        FINALIZAR VENDA
                    </button>
                    <button 
                      onClick={() => { setSelectedTable(null); setSelectedMethod(null); setAmountReceived(''); }}
                      className="w-full text-[10px] font-black text-gray-300 mt-6 uppercase tracking-widest hover:text-red-500 transition-colors"
                    >
                      Cancelar Operação
                    </button>
                </div>
              </div>
            ) : (
              <div className="p-20 text-center flex-grow flex flex-col items-center justify-center space-y-6">
                <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center border-2 border-dashed border-gray-100">
                    <i className="fas fa-hand-pointer text-4xl text-gray-200"></i>
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-300 leading-relaxed max-w-[180px]">
                    Selecione uma mesa ativa para processar o fechamento acumulado
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminModule;
