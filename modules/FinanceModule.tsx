
import React, { useState, useEffect, useMemo } from 'react';
import { useAppState } from '../store';
import { CashSession, CashTransaction, Order, OrderStatus } from '../types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from 'recharts';

const FinanceModule: React.FC = () => {
  const { orders } = useAppState();
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [openingAmount, setOpeningAmount] = useState<string>('');
  const [transAmount, setTransAmount] = useState<string>('');
  const [transDesc, setTransDesc] = useState<string>('');
  const [transType, setTransType] = useState<'APORTE' | 'SANGRIA'>('APORTE');
  const [reportRange, setReportRange] = useState<'DAY' | 'WEEK' | 'MONTH'>('DAY');
  const [showTransModal, setShowTransModal] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/cash/active');
      if (res.ok) {
        const data = await res.json();
        setActiveSession(data.session);
        setTransactions(data.transactions || []);
      } else {
        setActiveSession(null);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleOpenCash = async () => {
    if (!openingAmount) return;
    try {
      const res = await fetch('/api/cash/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opening_balance: parseFloat(openingAmount) })
      });
      if (res.ok) {
        fetchSession();
        setOpeningAmount('');
      }
    } catch (e) { console.error(e); }
  };

  const handleCloseCash = async () => {
    if (!activeSession) return;
    if (!confirm("Deseja realmente fechar o caixa agora?")) return;
    try {
      const res = await fetch(`/api/cash/close/${activeSession.id}`, { method: 'POST' });
      if (res.ok) fetchSession();
    } catch (e) { console.error(e); }
  };

  const handleAddTransaction = async () => {
    if (!activeSession || !transAmount || !transDesc) return;
    try {
      const res = await fetch('/api/cash/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession.id,
          type: transType,
          amount: parseFloat(transAmount),
          description: transDesc
        })
      });
      if (res.ok) {
        fetchSession();
        setTransAmount('');
        setTransDesc('');
        setShowTransModal(false);
      }
    } catch (e) { console.error(e); }
  };

  // Cálculos Financeiros
  const sessionSales = useMemo(() => {
    if (!activeSession) return 0;
    const start = new Date(activeSession.start_time).getTime();
    return orders
      .filter(o => o.status === OrderStatus.PAID && new Date(o.timestamp).getTime() >= start)
      .reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
  }, [activeSession, orders]);

  const sessionAportes = useMemo(() => transactions.filter(t => t.type === 'APORTE').reduce((acc, curr) => acc + Number(curr.amount), 0), [transactions]);
  const sessionSangrias = useMemo(() => transactions.filter(t => t.type === 'SANGRIA').reduce((acc, curr) => acc + Number(curr.amount), 0), [transactions]);
  const expectedBalance = useMemo(() => {
    if (!activeSession) return 0;
    return activeSession.opening_balance + sessionSales + sessionAportes - sessionSangrias;
  }, [activeSession, sessionSales, sessionAportes, sessionSangrias]);

  // Dados para Relatórios
  const reportData = useMemo(() => {
    const now = new Date();
    let filterDate = new Date();
    if (reportRange === 'WEEK') filterDate.setDate(now.getDate() - 7);
    else if (reportRange === 'MONTH') filterDate.setMonth(now.getMonth() - 1);
    else filterDate.setHours(0, 0, 0, 0);

    const relevantOrders = orders.filter(o => o.status === OrderStatus.PAID && new Date(o.timestamp) >= filterDate);
    
    // Agrupar por dia ou hora
    const groups: any = {};
    relevantOrders.forEach(o => {
      const dateKey = reportRange === 'DAY' 
        ? new Date(o.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date(o.timestamp).toLocaleDateString();
      groups[dateKey] = (groups[dateKey] || 0) + (Number(o.total) || 0);
    });

    return Object.keys(groups).map(key => ({ label: key, total: groups[key] }));
  }, [orders, reportRange]);

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Gestão Financeira</h2>
          <p className="text-gray-400 font-medium">Controle de caixa e análise de performance</p>
        </div>
        
        {activeSession ? (
          <div className="flex gap-3">
             <button 
              onClick={() => { setTransType('SANGRIA'); setShowTransModal(true); }}
              className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-red-100 hover:bg-red-100 transition-all"
            >
              <i className="fas fa-minus-circle mr-2"></i> Sangria
            </button>
            <button 
              onClick={() => { setTransType('APORTE'); setShowTransModal(true); }}
              className="px-6 py-3 bg-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-all"
            >
              <i className="fas fa-plus-circle mr-2"></i> Aporte
            </button>
            <button 
              onClick={handleCloseCash}
              className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Fechar Caixa
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
            <input 
              type="number" 
              placeholder="Valor inicial R$" 
              value={openingAmount}
              onChange={(e) => setOpeningAmount(e.target.value)}
              className="bg-transparent px-4 py-2 text-sm font-black focus:outline-none w-32"
            />
            <button 
              onClick={handleOpenCash}
              className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-100 active:scale-95 transition-all"
            >
              Abrir Caixa
            </button>
          </div>
        )}
      </header>

      {/* DASHBOARD DE CAIXA ATIVO */}
      {activeSession ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Abertura</p>
            <p className="text-3xl font-black text-gray-900 tracking-tighter">R$ {activeSession.opening_balance.toFixed(2)}</p>
            <p className="text-[9px] text-gray-400 font-bold mt-2">Em {new Date(activeSession.start_time).toLocaleTimeString()}</p>
          </div>
          <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Vendas (Sessão)</p>
            <p className="text-3xl font-black text-green-600 tracking-tighter">R$ {sessionSales.toFixed(2)}</p>
            <p className="text-[9px] text-gray-400 font-bold mt-2">Pagamentos confirmados</p>
          </div>
          <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Movimentações</p>
            <p className="text-3xl font-black text-blue-500 tracking-tighter">R$ {(sessionAportes - sessionSangrias).toFixed(2)}</p>
            <p className="text-[9px] text-gray-400 font-bold mt-2">{transactions.length} registros nesta sessão</p>
          </div>
          <div className="bg-gray-900 p-7 rounded-[2.5rem] shadow-2xl">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Saldo em Caixa</p>
            <p className="text-3xl font-black text-white tracking-tighter">R$ {expectedBalance.toFixed(2)}</p>
            <div className="flex items-center gap-2 mt-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[9px] text-green-500 font-bold uppercase">Caixa Aberto</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-[3rem] text-center border-2 border-dashed border-gray-100 flex flex-col items-center">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                <i className="fas fa-lock text-gray-200 text-3xl"></i>
            </div>
            <h3 className="text-xl font-black text-gray-300 uppercase tracking-widest">Caixa Fechado</h3>
            <p className="text-gray-400 mt-2 max-w-sm font-medium">Abra o caixa informando o valor inicial em espécie para começar as operações do dia.</p>
        </div>
      )}

      {/* RELATÓRIOS E GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-black text-gray-900">Performance de Vendas</h3>
            <div className="flex bg-gray-50 p-1 rounded-xl">
              <button onClick={() => setReportRange('DAY')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${reportRange === 'DAY' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}>Dia</button>
              <button onClick={() => setReportRange('WEEK')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${reportRange === 'WEEK' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}>Semana</button>
              <button onClick={() => setReportRange('MONTH')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${reportRange === 'MONTH' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}>Mês</button>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#9ca3af'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#9ca3af'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px'}}
                  labelStyle={{fontWeight: 900, marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase'}}
                />
                <Line type="monotone" dataKey="total" stroke="#f97316" strokeWidth={4} dot={{r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ÚLTIMAS TRANSAÇÕES */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-xl font-black text-gray-900 mb-8">Movimentações</h3>
          <div className="flex-grow overflow-y-auto no-scrollbar space-y-4 max-h-[350px]">
            {transactions.length === 0 ? (
                <div className="text-center py-12 text-gray-300 font-black uppercase text-[10px] tracking-widest">Nenhuma movimentação</div>
            ) : (
                transactions.sort((a,b) => b.id - a.id).map(t => (
                    <div key={t.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'APORTE' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                            <i className={`fas ${t.type === 'APORTE' ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
                        </div>
                        <div className="flex-grow">
                            <p className="font-black text-gray-900 text-xs leading-none mb-1">{t.description}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase">{new Date(t.timestamp).toLocaleTimeString()}</p>
                        </div>
                        <div className={`text-sm font-black ${t.type === 'APORTE' ? 'text-blue-600' : 'text-red-600'}`}>
                            {t.type === 'APORTE' ? '+' : '-'} R$ {Number(t.amount).toFixed(2)}
                        </div>
                    </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE TRANSAÇÃO */}
      {showTransModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowTransModal(false)}></div>
            <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-fadeIn">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black uppercase tracking-tight">{transType} DE CAIXA</h3>
                    <button onClick={() => setShowTransModal(false)} className="text-gray-300 hover:text-gray-900 transition-colors">
                        <i className="fas fa-times-circle text-2xl"></i>
                    </button>
                </div>
                
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Valor do Lançamento</label>
                        <input 
                            type="number" 
                            value={transAmount} 
                            onChange={(e) => setTransAmount(e.target.value)} 
                            placeholder="R$ 0,00"
                            className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xl font-black focus:border-orange-500 focus:outline-none transition-all"
                            autoFocus
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Motivo / Descrição</label>
                        <textarea 
                            value={transDesc} 
                            onChange={(e) => setTransDesc(e.target.value)} 
                            placeholder="Descreva o motivo..."
                            className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-orange-500 focus:outline-none transition-all h-24 resize-none"
                        />
                    </div>
                    <button 
                        onClick={handleAddTransaction}
                        className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl active:scale-95 transition-all text-white ${transType === 'APORTE' ? 'bg-blue-600' : 'bg-red-600'}`}
                    >
                        Confirmar {transType}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default FinanceModule;
