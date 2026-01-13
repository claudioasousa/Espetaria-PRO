
import React, { useState } from 'react';
import { useAppState } from '../store';
import { OrderStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const AdminModule: React.FC = () => {
  const { orders, tables, updateOrderStatus, inventory, restockInventory, apiConnected, refreshData } = useAppState();
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'stats' | 'config' | 'inventory'>('stats');

  const revenue = orders.filter(o => o.status === OrderStatus.PAID).reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);

  const chartData = [
    { name: 'Pendente', val: orders.filter(o => o.status === OrderStatus.PENDING).length },
    { name: 'Preparo', val: orders.filter(o => o.status === OrderStatus.PREPARING).length },
    { name: 'Pronto', val: orders.filter(o => o.status === OrderStatus.READY).length },
    { name: 'Entregue', val: orders.filter(o => o.status === OrderStatus.DELIVERED).length },
  ];

  const handlePayment = (orderId: string, total: number) => {
    updateOrderStatus(orderId, OrderStatus.PAID);
    const troco = (Number(amountReceived) || 0) - Number(total);
    setSelectedTable(null);
    setAmountReceived('');
    alert(`Pagamento processado! Troco: R$ ${troco.toFixed(2)}`);
  };

  const handleRestock = (itemId: string, itemName: string) => {
    const qty = prompt(`Quanto de "${itemName}" você recebeu?`);
    if (qty && !isNaN(parseFloat(qty))) {
        restockInventory(itemId, parseFloat(qty));
    }
  };

  const currentOrder = selectedTable ? orders.find(o => o.tableNumber === selectedTable && o.status !== OrderStatus.PAID) : null;

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Painel Executivo</h2>
          <div className="flex gap-6 mt-3">
            <button onClick={() => setActiveTab('stats')} className={`text-sm font-black pb-2 border-b-2 transition-all ${activeTab === 'stats' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400'}`}>MÉTRICAS</button>
            <button onClick={() => setActiveTab('inventory')} className={`text-sm font-black pb-2 border-b-2 transition-all ${activeTab === 'inventory' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400'}`}>ESTOQUE</button>
            <button onClick={() => setActiveTab('config')} className={`text-sm font-black pb-2 border-b-2 transition-all ${activeTab === 'config' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400'}`}>SERVER</button>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${apiConnected ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500 animate-pulse'}`}></div>
            <p className="text-xs font-black text-gray-900 uppercase">{apiConnected ? 'Cloud Online' : 'Offline'}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-green-100 p-2 rounded-lg text-green-600"><i className="fas fa-hand-holding-usd"></i></div>
            <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Receita</p>
                <p className="text-xl font-black text-gray-900 tracking-tighter">R$ {Number(revenue).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </header>

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-6">Status dos Pedidos</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f9fafb'}} />
                    <Bar dataKey="val" radius={[6, 6, 0, 0]} barSize={40}>
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={['#f97316', '#3b82f6', '#10b981', '#6366f1'][index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-6">Mapa de Ocupação</h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                {tables.map(table => (
                  <button
                    key={table.number}
                    onClick={() => table.status === 'OCCUPIED' && setSelectedTable(table.number)}
                    className={`p-4 rounded-2xl flex flex-col items-center justify-center transition-all ${
                      table.status === 'OCCUPIED' 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'bg-gray-50 text-gray-400 opacity-60'
                    }`}
                  >
                    <span className="text-xl font-black">{table.number}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
              <div className="p-6 bg-gray-900 text-white">
                <h3 className="text-xl font-black uppercase tracking-tighter">Caixa</h3>
              </div>
              {currentOrder ? (
                <div className="p-6 space-y-6">
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <span className="text-2xl font-black text-blue-900">Mesa {currentOrder.tableNumber}</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-dashed pb-4">
                      <span className="text-sm font-bold text-gray-400 uppercase">Total</span>
                      <span className="text-3xl font-black text-gray-900 tracking-tighter">R$ {Number(currentOrder.total).toFixed(2)}</span>
                    </div>
                    <input type="number" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} placeholder="0.00" className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xl font-black focus:border-orange-500 focus:outline-none"/>
                    <button onClick={() => handlePayment(currentOrder.id, Number(currentOrder.total))} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-5 rounded-2xl shadow-xl transition-all">FINALIZAR</button>
                  </div>
                </div>
              ) : (
                <div className="p-16 text-center text-gray-300">
                  <i className="fas fa-receipt text-4xl opacity-20 mb-4"></i>
                  <p className="text-sm font-bold uppercase tracking-widest">Aguardando mesa</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-black mb-8">Insumos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inventory.map(item => (
                    <div key={item.id} className="p-6 border rounded-3xl bg-gray-50 flex items-center justify-between">
                        <div>
                            <h4 className="font-black text-gray-800 text-lg">{item.name}</h4>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`w-3 h-3 rounded-full ${item.quantity < item.minStock ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
                                <span className="text-sm font-black text-gray-500">{Number(item.quantity).toFixed(1)} {item.unit}</span>
                            </div>
                        </div>
                        <button onClick={() => handleRestock(item.id, item.name)} className="bg-white px-4 py-2 rounded-xl border border-gray-200 text-[10px] font-black text-orange-500">REPOR</button>
                    </div>
                ))}
            </div>
        </section>
      )}

      {activeTab === 'config' && (
        <section className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 max-w-2xl mx-auto text-center space-y-8">
          <div className="bg-orange-100 w-24 h-24 rounded-full flex items-center justify-center text-orange-600 mx-auto">
            <i className="fas fa-database text-4xl"></i>
          </div>
          <h3 className="text-2xl font-black text-gray-900">Configuração do Servidor</h3>
          <button onClick={refreshData} className="bg-gray-900 text-white py-5 px-8 rounded-2xl font-black uppercase tracking-widest text-xs">Forçar Sincronização</button>
        </section>
      )}
    </div>
  );
};

export default AdminModule;
