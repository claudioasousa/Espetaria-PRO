
import React, { useState } from 'react';
import { useAppState } from '../store';
import { OrderStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const AdminModule: React.FC = () => {
  const { orders, tables, updateOrderStatus, products, inventory, apiConnected, refreshData } = useAppState();
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'stats' | 'config' | 'inventory'>('stats');

  const revenue = orders.filter(o => o.status === OrderStatus.PAID).reduce((acc, curr) => acc + curr.total, 0);

  const chartData = [
    { name: 'Pendente', val: orders.filter(o => o.status === OrderStatus.PENDING).length },
    { name: 'Preparo', val: orders.filter(o => o.status === OrderStatus.PREPARING).length },
    { name: 'Pronto', val: orders.filter(o => o.status === OrderStatus.READY).length },
    { name: 'Entregue', val: orders.filter(o => o.status === OrderStatus.DELIVERED).length },
  ];

  const handlePayment = (orderId: string, total: number) => {
    updateOrderStatus(orderId, OrderStatus.PAID);
    setSelectedTable(null);
    setAmountReceived('');
    alert(`Pagamento processado! Troco: R$ ${(parseFloat(amountReceived) - total || 0).toFixed(2)}`);
  };

  const currentOrder = selectedTable ? orders.find(o => o.tableNumber === selectedTable && o.status !== OrderStatus.PAID) : null;

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h2>
          <div className="flex gap-6 mt-3">
            <button onClick={() => setActiveTab('stats')} className={`text-sm font-bold pb-2 border-b-2 transition-all ${activeTab === 'stats' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400'}`}>VISÃO GERAL</button>
            <button onClick={() => setActiveTab('inventory')} className={`text-sm font-bold pb-2 border-b-2 transition-all ${activeTab === 'inventory' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400'}`}>ESTOQUE</button>
            <button onClick={() => setActiveTab('config')} className={`text-sm font-bold pb-2 border-b-2 transition-all ${activeTab === 'config' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400'}`}>SISTEMA</button>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${apiConnected ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500 animate-pulse'}`}></div>
            <p className="text-xs font-black text-gray-900 uppercase">{apiConnected ? 'MySQL Ativo' : 'MySQL Offline'}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-green-100 p-2 rounded-lg text-green-600"><i className="fas fa-wallet"></i></div>
            <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Hoje</p>
                <p className="text-xl font-black text-gray-900">R$ {revenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </header>

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">Fluxo de Pedidos Atuais</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f9fafb'}} />
                    <Bar dataKey="val" radius={[6, 6, 0, 0]}>
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={['#f97316', '#3b82f6', '#10b981', '#6366f1'][index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-6">Mapa de Mesas</h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {tables.map(table => (
                  <button
                    key={table.number}
                    onClick={() => table.status === 'OCCUPIED' && setSelectedTable(table.number)}
                    className={`p-5 rounded-2xl flex flex-col items-center justify-center transition-all ${
                      table.status === 'OCCUPIED' 
                        ? 'bg-blue-50 border-2 border-blue-500 text-blue-700' 
                        : 'bg-gray-50 border-2 border-transparent text-gray-400 opacity-50'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase mb-1">Mesa</span>
                    <span className="text-2xl font-black">{table.number}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
              <div className="p-6 bg-gray-900 text-white">
                <h3 className="text-xl font-black uppercase tracking-tighter">Caixa</h3>
                <p className="text-gray-400 text-xs">Selecione uma mesa ocupada</p>
              </div>
              {currentOrder ? (
                <div className="p-6 space-y-6">
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <span className="text-2xl font-black text-blue-900">Mesa {currentOrder.tableNumber}</span>
                    <p className="text-[10px] font-bold text-blue-600 uppercase">Aguardando Pagamento</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-dashed pb-4">
                      <span className="text-sm font-bold text-gray-400 uppercase">Total</span>
                      <span className="text-3xl font-black text-gray-900">R$ {currentOrder.total.toFixed(2)}</span>
                    </div>
                    <input type="number" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} placeholder="Valor Recebido R$" className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xl font-black focus:border-orange-500 focus:outline-none"/>
                    <button onClick={() => handlePayment(currentOrder.id, currentOrder.total)} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-5 rounded-2xl shadow-xl transition-all">FINALIZAR VENDA</button>
                  </div>
                </div>
              ) : (
                <div className="p-16 text-center text-gray-300">
                  <i className="fas fa-cash-register text-3xl opacity-20 mb-4"></i>
                  <p className="text-sm font-bold uppercase">Nenhuma mesa selecionada</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-black mb-8">Gestão de Insumos (Banco SQL)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inventory.map(item => (
                    <div key={item.id} className="p-6 border rounded-2xl bg-gray-50 flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-gray-800 text-lg">{item.name}</h4>
                            <div className="flex items-center gap-2 mt-2">
                                {/* Fix: Use quantity and minStock property names from InventoryItem interface */}
                                <span className={`w-3 h-3 rounded-full ${item.quantity < item.minStock ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
                                {/* Fix: Use quantity and unit property names from InventoryItem interface */}
                                <span className="text-sm font-bold text-gray-500">{item.quantity} {item.unit}</span>
                            </div>
                        </div>
                        <div className="text-right">
                             {/* Fix: Use minStock property name from InventoryItem interface */}
                             <p className="text-[10px] font-black text-gray-400 uppercase">Mínimo: {item.minStock}</p>
                             <button className="text-[10px] font-bold text-orange-500 mt-2">REPOR</button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
      )}

      {activeTab === 'config' && (
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-4xl mx-auto space-y-8">
          <div className="flex items-center gap-6">
            <div className="bg-orange-100 w-20 h-20 rounded-3xl flex items-center justify-center text-orange-600">
              <i className="fas fa-server text-4xl"></i>
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-800">Status do Backend</h3>
              <p className="text-gray-500">Conectado em: {window.location.host}</p>
            </div>
          </div>
          <button onClick={refreshData} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase">Forçar Recarregamento de Dados</button>
        </section>
      )}
    </div>
  );
};

export default AdminModule;
