/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Search, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  Tag,
  CheckCircle2,
  Trash2,
  Clock,
  CreditCard,
  Layers,
  Filter,
  Check
} from 'lucide-react';
import { Transaction, Sale, Product } from '../types';

interface FinanceCashflowProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  onAddTransaction: (tx: Transaction) => void;
  sales?: Sale[];
  products?: Product[];
}

export default function FinanceCashflow({ 
  transactions, 
  setTransactions, 
  onAddTransaction,
  sales = [],
  products = []
}: FinanceCashflowProps) {
  const [activeMainTab, setActiveMainTab] = useState<'caixa' | 'saude'>('caixa');
  const [saudePeriod, setSaudePeriod] = useState<'current_month' | 'last_month' | 'last_30' | 'last_90' | 'all'>('current_month');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'All' | 'Inflow' | 'Outflow'>('All');
  
  // Advanced Filter Tabs:
  // 'all' = Todos os fluxos
  // 'realized' = Realizado (Apenas Pagos/Liquidados)
  // 'payable' = Contas a Pagar (Saídas Pendentes)
  // 'receivable' = Contas a Receber (Entradas Pendentes)
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'realized' | 'payable' | 'receivable'>('all');
  
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);

  // Form states for creating / editing entries
  const [txType, setTxType] = useState<'Inflow' | 'Outflow'>('Outflow'); // typical use-case is Outflow (expense)
  const [txCategory, setTxCategory] = useState('Fornecedores');
  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txStatus, setTxStatus] = useState<'pago' | 'pendente'>('pendente');
  const [txDueDate, setTxDueDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  // Installments state (Parcelamento)
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState<number>(3);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Advanced financial calculations
  const metrics = useMemo(() => {
    let inflowPaid = 0;       // Recebido/Liquidado
    let inflowPending = 0;    // A receber
    let outflowPaid = 0;      // Pago/Liquidado
    let outflowPending = 0;   // A pagar

    transactions.forEach(t => {
      const status = t.status || 'pago'; // backward compatibility fallback
      const amount = Number(t.amount) || 0;
      
      if (t.type === 'Inflow') {
        if (status === 'pago') {
          inflowPaid += amount;
        } else {
          inflowPending += amount;
        }
      } else {
        if (status === 'pago') {
          outflowPaid += amount;
        } else {
          outflowPending += amount;
        }
      }
    });

    const balanceRealizado = inflowPaid - outflowPaid;
    const balanceProjetado = balanceRealizado + inflowPending - outflowPending;

    return {
      inflowPaid,
      inflowPending,
      outflowPaid,
      outflowPending,
      balanceRealizado,
      balanceProjetado
    };
  }, [transactions]);

  // Helper function to filter records by selected period/month
  const filterByPeriod = (dateStr: string, period: string): boolean => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    
    const now = new Date();
    
    switch (period) {
      case 'current_month': {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      case 'last_month': {
        const prev = new Date();
        prev.setMonth(prev.getMonth() - 1);
        return d.getMonth() === prev.getMonth() && d.getFullYear() === prev.getFullYear();
      }
      case 'last_30': {
        const diffMs = now.getTime() - d.getTime();
        return diffMs >= 0 && diffMs <= 30 * 24 * 60 * 60 * 1000;
      }
      case 'last_90': {
        const diffMs = now.getTime() - d.getTime();
        return diffMs >= 0 && diffMs <= 90 * 24 * 60 * 60 * 1000;
      }
      case 'all':
      default:
        return true;
    }
  };

  // Calculations for Saúde Financeira (Health Metrics)
  const saudeMetrics = useMemo(() => {
    // Filter sales and transactions by the selected period
    const filteredSales = sales.filter(s => filterByPeriod(s.createdAt, saudePeriod) && s.status !== 'Cancelada');
    const filteredTxs = transactions.filter(t => filterByPeriod(t.dueDate || t.date, saudePeriod));

    // 1. MARGEM BRUTA:
    // Faturamento Total (Total Revenue)
    const faturamentoTotal = filteredSales.reduce((acc, s) => acc + (s.total || 0), 0);
    // CMV (Cost of Goods Sold)
    const cmvTotal = filteredSales.reduce((acc, s) => acc + (s.costTotal || 0), 0);
    // Gross Profit
    const grossProfit = faturamentoTotal - cmvTotal;
    const margemBruta = faturamentoTotal > 0 ? (grossProfit / faturamentoTotal) * 100 : 0;

    // 2. MARGEM LÍQUIDA:
    // Operational/Administrative expenses excluding Supplier/Inventory direct costs to avoid double-counting
    const despesasOperacionais = filteredTxs
      .filter(t => t.type === 'Outflow' && t.category !== 'Fornecedores' && t.category !== 'Compra de Estoque')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const netProfit = faturamentoTotal - cmvTotal - despesasOperacionais;
    const margemLiquida = faturamentoTotal > 0 ? (netProfit / faturamentoTotal) * 100 : 0;

    // 3. MARGEM DE CONTRIBUIÇÃO:
    // Estimated direct transaction expenses (e.g. 5% representing average credit card/Pix processing fees + Simples tax)
    const taxAndCardRate = 0.05; 
    const estimatedFees = faturamentoTotal * taxAndCardRate;
    
    // Total Contribution Margin = Faturamento Total - CMV - Estimated Fees
    const margemContribuicaoTotal = faturamentoTotal - cmvTotal - estimatedFees;
    const margemContribuicaoMediaPerc = faturamentoTotal > 0 ? (margemContribuicaoTotal / faturamentoTotal) * 100 : 0;

    // 4. PONTO DE EQUILÍBRIO (Break-Even Point):
    // Custo Fixo Total = Despesas Operacionais (excluding supplier inventory acquisitions)
    // If 0, fallback to R$ 2.500,00 so there is always a realistic baseline scenario
    const custoFixoTotal = despesasOperacionais > 0 ? despesasOperacionais : 2500;
    
    // Break-Even Point = Custo Fixo Total / (Margem de Contribuição Média em decimal)
    const breakEvenPoint = margemContribuicaoMediaPerc > 0 
      ? custoFixoTotal / (margemContribuicaoMediaPerc / 100)
      : (faturamentoTotal > 0 ? custoFixoTotal / 0.5 : custoFixoTotal / 0.5); 

    // 5. TAXA DE INADIMPLÊNCIA:
    // Overdue Inflows = Inflows pending whose dueDate is past
    const todayStr = new Date().toISOString().split('T')[0];
    
    const receitasVencidasNaoPagas = filteredTxs
      .filter(t => t.type === 'Inflow' && t.status === 'pendente' && (t.dueDate || t.date.split('T')[0]) < todayStr)
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    // Unpaid/overdue sales (e.g., pending sales which are past-due or over 7 days old)
    const salesVencidosNaoPagos = filteredSales
      .filter(s => s.status === 'Pendente' && s.createdAt.split('T')[0] < todayStr)
      .reduce((acc, s) => acc + (s.total || 0), 0);

    const totalInadimplente = receitasVencidasNaoPagas + salesVencidosNaoPagos;

    // Faturamento Total Esperado = Faturamento Realizado + Total de Receitas Pendentes/Vencidas do período
    const faturamentoTotalEsperado = faturamentoTotal + receitasVencidasNaoPagas + salesVencidosNaoPagos;
    const taxaInadimplencia = faturamentoTotalEsperado > 0 
      ? (totalInadimplente / faturamentoTotalEsperado) * 100 
      : 0;

    return {
      faturamentoTotal,
      cmvTotal,
      grossProfit,
      margemBruta,
      despesasOperacionais,
      custoFixoTotal,
      netProfit,
      margemLiquida,
      estimatedFees,
      margemContribuicaoTotal,
      margemContribuicaoMediaPerc,
      breakEvenPoint,
      receitasVencidasNaoPagas,
      salesVencidosNaoPagos,
      totalInadimplente,
      faturamentoTotalEsperado,
      taxaInadimplencia,
      filteredSalesCount: filteredSales.length
    };
  }, [sales, transactions, saudePeriod]);

  // Master filters implementation 
  const filteredTransactions = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    return [...transactions]
      .filter(t => {
        const matchesSearch = 
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category.toLowerCase().includes(searchQuery.toLowerCase());
          
        const matchesType = selectedType === 'All' || t.type === selectedType;
        
        // Advanced Filter Tab criteria
        const status = t.status || 'pago';
        let matchesTab = true;
        if (activeFilterTab === 'realized') {
          matchesTab = (status === 'pago');
        } else if (activeFilterTab === 'payable') {
          matchesTab = (t.type === 'Outflow' && status === 'pendente');
        } else if (activeFilterTab === 'receivable') {
          matchesTab = (t.type === 'Inflow' && status === 'pendente');
        }
        
        return matchesSearch && matchesType && matchesTab;
      })
      .sort((a, b) => {
        // Sort: pending ones go on top, sorted closer to due date, then sorted by date DESC
        const aStatus = a.status || 'pago';
        const bStatus = b.status || 'pago';
        
        if (aStatus === 'pendente' && bStatus === 'pago') return -1;
        if (aStatus === 'pago' && bStatus === 'pendente') return 1;
        
        // If both pending, sort by due date ASC (closest deadline first)
        if (aStatus === 'pendente' && bStatus === 'pendente') {
          const aDue = a.dueDate || a.date;
          const bDue = b.dueDate || b.date;
          return aDue.localeCompare(bDue);
        }
        
        // Default: sort by date created DESC
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [transactions, searchQuery, selectedType, activeFilterTab]);

  // Quick action: settle/liquidate a pending bill or income straight from the dashboard
  const handleMarkAsPaid = (id: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return { 
          ...t, 
          status: 'pago',
          date: new Date().toISOString() // Marked as paid today/now in the cashledger
        };
      }
      return t;
    }));
  };

  // Quick action: delete a transaction
  const handleDeleteTx = (id: string) => {
    if (window.confirm('Confirma a exclusão definitiva deste lançamento financeiro? Essa ação não pode ser desfeita.')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  // Handle submit form (supports standard or monthly installment scheduler)
  const handleSubmitTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDesc.trim() || txAmount <= 0) {
      alert('Por favor, preencha a descrição do lançamento e defina um valor superior a R$ 0,00.');
      return;
    }

    if (isInstallment && installmentsCount >= 2) {
      // Installment scheduler engine (generates N recurring records month-over-month)
      const groupId = `group-${Date.now()}`;
      const installmentAmount = Number((txAmount / installmentsCount).toFixed(2));
      const generatedList: Transaction[] = [];

      for (let i = 1; i <= installmentsCount; i++) {
        // Calculate due date offset by (i - 1) months
        const baseDate = new Date(txDueDate + 'T12:00:00'); // set mid-day to avoid TZ adjustments shifts
        baseDate.setMonth(baseDate.getMonth() + (i - 1));
        const formattedDueDate = baseDate.toISOString().split('T')[0];

        // First installment behavior: matches the user selected status. 
        // Subsequent installments are set to "pendente" (future) automatically.
        const currentStatus = (i === 1) ? txStatus : 'pendente';

        generatedList.push({
          id: `tx-${Date.now()}-p${i}`,
          type: txType,
          category: txCategory,
          description: `${txDesc.trim()} (Parcela ${i}/${installmentsCount})`,
          amount: installmentAmount,
          date: new Date().toISOString(),
          status: currentStatus,
          dueDate: formattedDueDate,
          installmentsGroup: groupId,
          installmentNumber: i,
          totalInstallments: installmentsCount
        });
      }

      // Add all generated installments to transactions state
      setTransactions(prev => [...generatedList, ...prev]);
    } else {
      // Single transaction record
      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        type: txType,
        category: txCategory,
        description: txDesc.trim(),
        amount: txAmount,
        date: new Date().toISOString(),
        status: txStatus,
        dueDate: txDueDate
      };
      
      onAddTransaction(newTx);
    }

    setIsAddTxOpen(false);

    // Reset state inputs
    setTxDesc('');
    setTxAmount(0);
    setIsInstallment(false);
    setInstallmentsCount(3);
    setTxStatus('pendente');
    setTxDueDate(new Date().toISOString().split('T')[0]);
  };

  // Dynamic status badges and warnings
  const getTransactionStatusBadge = (tx: Transaction) => {
    const status = tx.status || 'pago';
    const isPending = status === 'pendente';
    
    if (!isPending) {
      return (
        <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 text-[10px] uppercase tracking-wide border border-emerald-100">
          <Check size={10} strokeWidth={3} /> Liquidado
        </span>
      );
    }

    // Is pending, evaluate deadline date
    const todayStr = new Date().toISOString().split('T')[0];
    const dueDateStr = tx.dueDate || tx.date.split('T')[0];

    if (dueDateStr < todayStr) {
      return (
        <span className="bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 text-[10px] uppercase tracking-wide border border-rose-100 animate-pulse">
          <AlertTriangle size={10} /> Atrasado (Venceu {dueDateStr.split('-').reverse().join('/')})
        </span>
      );
    } else if (dueDateStr === todayStr) {
      return (
        <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 text-[10px] uppercase tracking-wide border border-amber-100">
          <Clock size={10} /> Vence Hoje
        </span>
      );
    } else {
      return (
        <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 text-[10px] uppercase tracking-wide border border-blue-100">
          <Calendar size={10} /> A Vencer ({dueDateStr.split('-').reverse().join('/')})
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-sans text-slate-800 tracking-tight">Painel Financeiro & Fluxo de Caixa</h2>
          <p className="text-slate-400 text-sm font-sans font-medium">Controle total de despesas, contas a pagar, recebimentos parcelados e projeção real da saúde física da loja.</p>
        </div>
        <button 
          id="add-tx-modal-btn"
          onClick={() => {
            setTxDueDate(new Date().toISOString().split('T')[0]);
            setIsAddTxOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-black font-sans font-extrabold text-white px-5 py-3 rounded-xl text-xs uppercase shadow-md shadow-slate-900/10 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Lançar Despesa / Receita</span>
        </button>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-100 gap-1 overflow-x-auto select-none">
        <button
          onClick={() => setActiveMainTab('caixa')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeMainTab === 'caixa'
              ? 'border-pink-600 text-pink-600 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          💳 Fluxo de Caixa & Lançamentos
        </button>
        <button
          onClick={() => setActiveMainTab('saude')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeMainTab === 'saude'
              ? 'border-pink-600 text-pink-600 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          🏥 Saúde Financeira da Empresa
        </button>
      </div>

      {activeMainTab === 'caixa' ? (
        <>
          {/* Advanced Finance KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Caixa Realizado (Real Realized Safe) */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between hover:shadow-xs transition-all hover:border-slate-200">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block font-sans select-none">Saldo de Caixa Real</span>
                <div className="flex items-baseline gap-1">
                  <h3 className={`text-xl font-bold font-mono ${metrics.balanceRealizado >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {formatCurrency(metrics.balanceRealizado)}
                  </h3>
                </div>
                <span className="text-[9px] text-slate-400 font-sans block">
                  Dinheiro real em mãos (Liquidados)
                </span>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 
                ${metrics.balanceRealizado >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>
                <DollarSign size={18} />
              </div>
            </div>

            {/* Total Contas a Receber (Receivables Pending) */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between hover:shadow-xs transition-all hover:border-slate-200">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block font-sans select-none">Contas a Receber</span>
                <h3 className="text-xl font-bold font-mono text-blue-600">{formatCurrency(metrics.inflowPending)}</h3>
                <span className="text-[9px] text-blue-500 font-bold font-sans flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 block"></span> Receitas agendadas / pendentes
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                <ArrowUpRight size={18} />
              </div>
            </div>

            {/* Total Contas a Pagar (Payables Pending) */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between hover:shadow-xs transition-all hover:border-slate-200">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block font-sans select-none">Contas a Pagar</span>
                <h3 className="text-xl font-bold font-mono text-amber-600">{formatCurrency(metrics.outflowPending)}</h3>
                <span className="text-[9px] text-amber-600 font-bold font-sans flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 block animate-pulse"></span> Despesas futuras ou em aberto
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                <ArrowDownLeft size={18} />
              </div>
            </div>

            {/* Projeção Financeira Comercial (Projected flows) */}
            <div className="bg-slate-900 border border-slate-900 rounded-2xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans select-none">Saldo Projetado</span>
                <h3 className={`text-xl font-bold font-mono ${metrics.balanceProjetado >= 0 ? 'text-pink-400' : 'text-rose-400'}`}>
                  {formatCurrency(metrics.balanceProjetado)}
                </h3>
                <span className="text-[9px] text-slate-350 font-sans block">
                  Real + Receber - Pagar (Consolidado)
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-pink-400 flex items-center justify-center border border-slate-700 shrink-0">
                <TrendingUp size={18} />
              </div>
            </div>
          </div>

          {/* Ledger lists, sorting and subtabs selection */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
            
            {/* Ledger quick sub-tabs filter bar */}
        <div className="p-4 bg-slate-50/55 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-sans">
          
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start font-bold">
            <button 
              onClick={() => setActiveFilterTab('all')}
              className={`px-3 py-2 rounded-lg transition-all cursor-pointer text-[11px] ${activeFilterTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-450 hover:text-slate-700'}`}
            >
              Todos os Lançamentos ({transactions.length})
            </button>
            <button 
              onClick={() => setActiveFilterTab('realized')}
              className={`px-3 py-2 rounded-lg transition-all cursor-pointer text-[11px] ${activeFilterTab === 'realized' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-450 hover:text-slate-700'}`}
            >
              Realizado (Contas Baixadas)
            </button>
            <button 
              onClick={() => setActiveFilterTab('payable')}
              className={`px-3 py-2 rounded-lg transition-all cursor-pointer text-[11px] ${activeFilterTab === 'payable' ? 'bg-white text-rose-500 shadow-xs' : 'text-slate-450 hover:text-slate-700'}`}
            >
              Contas a Pagar (Despesas)
            </button>
            <button 
              onClick={() => setActiveFilterTab('receivable')}
              className={`px-3 py-2 rounded-lg transition-all cursor-pointer text-[11px] ${activeFilterTab === 'receivable' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-450 hover:text-slate-700'}`}
            >
              Contas a Receber
            </button>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-end md:self-auto font-bold text-slate-400">
            <button 
              onClick={() => setSelectedType('All')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-[10px] uppercase tracking-wider ${selectedType === 'All' ? 'bg-white text-slate-800' : 'hover:text-slate-750'}`}
            >
              Misto
            </button>
            <button 
              onClick={() => setSelectedType('Inflow')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-[10px] uppercase tracking-wider ${selectedType === 'Inflow' ? 'bg-emerald-50 text-emerald-700' : 'hover:text-emerald-600'}`}
            >
              Entradas
            </button>
            <button 
              onClick={() => setSelectedType('Outflow')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-[10px] uppercase tracking-wider ${selectedType === 'Outflow' ? 'bg-rose-50 text-rose-700' : 'hover:text-rose-600'}`}
            >
              Saídas
            </button>
          </div>
        </div>

        {/* Query keyword and metadata filter */}
        <div className="p-4 border-b border-slate-50 text-xs font-sans">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search size={14} />
            </span>
            <input 
              id="cashflow-search-input"
              type="text"
              placeholder="Buscar por descrição ou categoria (Ex: Fornecedores, Aluguel, Pro-labore, Venda)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-750 placeholder-slate-400 text-xs focus:outline-hidden focus:border-slate-800 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        {/* Ledger items rendering core */}
        <div className="divide-y divide-slate-100 overflow-x-auto">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-400 border border-slate-200">
                <Filter size={18} />
              </div>
              <p className="font-semibold text-xs text-slate-500">Nenhum lançamento financeiro corresponde aos filtros atuais.</p>
              <p className="text-[10px] text-slate-400">Insira um novo lançamento ou alterne os botões de categorias acima.</p>
            </div>
          ) : (
            <div className="min-w-[700px]">
              {/* Header Titles */}
              <div className="grid grid-cols-12 gap-2 bg-slate-50 px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <div className="col-span-4">Fluxo / Descrição</div>
                <div className="col-span-2">Categoria</div>
                <div className="col-span-3">Identificação de Vencimento / Status</div>
                <div className="col-span-1 text-right">Valor bruto</div>
                <div className="col-span-2 text-right">Ações rápidas</div>
              </div>

              {/* Items row list */}
              {filteredTransactions.map(tx => {
                const isInflow = tx.type === 'Inflow';
                const isPending = tx.status === 'pendente';
                const hasInstallments = tx.installmentsGroup && tx.installmentNumber;

                return (
                  <div 
                    key={tx.id}
                    className="grid grid-cols-12 gap-2 items-center px-4 py-3.5 hover:bg-slate-50/40 text-xs transition-all font-sans"
                  >
                    {/* Desc and indicator */}
                    <div className="col-span-4 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 
                        ${isInflow 
                          ? 'bg-emerald-50 border-emerald-100/70 text-emerald-600' 
                          : 'bg-rose-50 border-rose-100/70 text-rose-500'}`}
                      >
                        {isInflow ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-800 leading-tight block">{tx.description}</span>
                          {hasInstallments && (
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm text-[9px] font-bold border border-slate-200">
                              Parc. {tx.installmentNumber}/{tx.totalInstallments}
                            </span>
                          )}
                        </div>
                        <div className="text-[9.5px] text-slate-400 font-medium flex items-center gap-1.5">
                          <span>Criado em: {new Date(tx.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Category */}
                    <div className="col-span-2">
                      <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-600 px-2.5 py-1 rounded-md font-sans border border-slate-200 text-[10px] font-extrabold uppercase tracking-wide">
                        <Tag size={10} className="text-slate-400" /> {tx.category}
                      </span>
                    </div>

                    {/* Status badge and Date */}
                    <div className="col-span-3 flex items-center">
                      <div>
                        {getTransactionStatusBadge(tx)}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="col-span-1 text-right">
                      <span className={`font-mono font-bold text-xs select-all block
                        ${isInflow ? 'text-emerald-600' : 'text-rose-500'}`}
                      >
                        {isInflow ? '+' : '-'} {formatCurrency(tx.amount)}
                      </span>
                    </div>

                    {/* Quick settling Actions */}
                    <div className="col-span-2 text-right flex items-center justify-end gap-1 px-1">
                      {isPending ? (
                        <button
                          onClick={() => handleMarkAsPaid(tx.id)}
                          title={isInflow ? "Dar Baixa / Recebido" : "Dar Baixa / Pago comercialmente"}
                          className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wider border cursor-pointer hover:shadow-xs transition-all text-white
                            ${isInflow 
                              ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600' 
                              : 'bg-slate-900 border-slate-900 hover:bg-black'}`}
                        >
                          <CheckCircle2 size={11} />
                          <span>Baixar</span>
                        </button>
                      ) : (
                        <div className="text-[10px] text-emerald-500 pr-3 font-semibold select-none inline-flex items-center gap-1">
                          <Check size={12} strokeWidth={3} /> Pago
                        </div>
                      )}

                      <button
                        onClick={() => handleDeleteTx(tx.id)}
                        title="Remover definitivamente"
                        className="w-8 h-8 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors border border-transparent hover:border-rose-100 cursor-pointer shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
        </>
      ) : (
        /* SAÚDE FINANCEIRA TAB CONTENT */
        <div className="space-y-6 animate-fade-in">
          {/* Period Selector Bar */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-0.5">
              <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Filtrar Período de Análise</h4>
              <p className="text-[10px] text-slate-400 font-medium">Os indicadores de margem e saúde serão recalculados dinamicamente.</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 font-bold self-start sm:self-auto">
              {(['current_month', 'last_month', 'last_30', 'last_90', 'all'] as const).map((period) => {
                const labels: Record<typeof period, string> = {
                  current_month: 'Mês Atual',
                  last_month: 'Mês Anterior',
                  last_30: 'Últimos 30 Dias',
                  last_90: 'Últimos 90 Dias',
                  all: 'Todo o Histórico'
                };
                return (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setSaudePeriod(period)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer text-[10px] uppercase font-bold ${
                      saudePeriod === period 
                        ? 'bg-white text-pink-600 shadow-xs' 
                        : 'text-slate-450 hover:text-slate-700'
                    }`}
                  >
                    {labels[period]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Metrics Dashboard Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Margem Bruta Card */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Margem Bruta (Lucratividade Direta)</span>
                  <span className="text-emerald-500 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/50">Ideal: &gt; 50%</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-mono text-slate-800">
                      {(saudeMetrics.margemBruta || 0).toFixed(1)}%
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 font-mono">
                      (Retorno de {formatCurrency(saudeMetrics.grossProfit || 0)})
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${saudeMetrics.margemBruta >= 50 ? 'bg-emerald-500' : saudeMetrics.margemBruta >= 30 ? 'bg-amber-400' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(100, Math.max(0, saudeMetrics.margemBruta || 0))}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50 text-[10px] font-sans">
                  <div>
                    <span className="text-slate-400 block font-semibold">Faturamento Bruto:</span>
                    <span className="font-mono font-bold text-slate-700">{formatCurrency(saudeMetrics.faturamentoTotal || 0)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">CMV (Custo de Vendas):</span>
                    <span className="font-mono font-bold text-rose-500">-{formatCurrency(saudeMetrics.cmvTotal || 0)}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-[9.5px] text-slate-400 mt-4 leading-relaxed font-medium">
                Indica o quanto de sobra resta das vendas comerciais após abater o custo real de aquisição/fabricação das peças (CMV).
              </p>
            </div>

            {/* Margem Líquida Card */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Margem Líquida (Resultado Real)</span>
                  <span className="text-pink-600 font-bold text-[10px] bg-pink-50 px-2 py-0.5 rounded-md border border-pink-100/30">Ideal: 15% a 25%</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-extrabold font-mono ${saudeMetrics.margemLiquida >= 15 ? 'text-emerald-600' : saudeMetrics.margemLiquida >= 5 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {(saudeMetrics.margemLiquida || 0).toFixed(1)}%
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 font-mono">
                      (Sobrou {formatCurrency(saudeMetrics.netProfit || 0)})
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${saudeMetrics.margemLiquida >= 15 ? 'bg-emerald-500' : saudeMetrics.margemLiquida >= 5 ? 'bg-amber-400' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(100, Math.max(0, saudeMetrics.margemLiquida || 0))}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50 text-[10px] font-sans">
                  <div>
                    <span className="text-slate-400 block font-semibold">Despesas Gerais:</span>
                    <span className="font-mono font-bold text-rose-400">-{formatCurrency(saudeMetrics.despesasOperacionais || 0)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Resultado Final:</span>
                    <span className={`font-mono font-bold ${saudeMetrics.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {formatCurrency(saudeMetrics.netProfit || 0)}
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-[9.5px] text-slate-400 mt-4 leading-relaxed font-medium">
                Mede o lucro líquido final real do negócio após pagar todas as peças, impostos, salários, aluguel, marketing e taxas administrativas.
              </p>
            </div>

            {/* Margem de Contribuição Card */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Margem de Contribuição</span>
                  <span className="text-blue-500 font-bold text-[10px] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100/50">Alvo: &gt; 40%</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-mono text-slate-800">
                      {(saudeMetrics.margemContribuicaoMediaPerc || 0).toFixed(1)}%
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 font-mono">
                      ({formatCurrency(saudeMetrics.margemContribuicaoTotal || 0)})
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${Math.min(100, Math.max(0, saudeMetrics.margemContribuicaoMediaPerc || 0))}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50 text-[10px] font-sans">
                  <div>
                    <span className="text-slate-400 block font-semibold">Impostos/Taxas Est.:</span>
                    <span className="font-mono font-bold text-rose-400">-{formatCurrency(saudeMetrics.estimatedFees || 0)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Sobra Unitária:</span>
                    <span className="font-mono font-bold text-slate-700">{formatCurrency(saudeMetrics.margemContribuicaoTotal || 0)}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-[9.5px] text-slate-400 mt-4 leading-relaxed font-medium">
                Faturamento menos CMV e custos variáveis (ex: taxa de cartão de crédito e impostos aproximados). Mostra o que sobra para cobrir custos fixos.
              </p>
            </div>

          </div>

          {/* Break-Even & Overdue Analytics Blocks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Ponto de Equilíbrio (Break-Even Point Analysis) */}
            <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center">
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs uppercase tracking-wide">Ponto de Equilíbrio Operacional</h4>
                    <p className="text-[9px] text-slate-400 font-medium">Faturamento mínimo para a loja cobrir todos os custos e empatar.</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-850 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center bg-transparent">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Faturamento Mínimo Requerido</span>
                    <span className="text-xs font-bold text-pink-400 font-mono">Meta de Sobrevivência</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-white">
                    {formatCurrency(saudeMetrics.breakEvenPoint || 0)}
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    {saudeMetrics.faturamentoTotal > 0 ? (
                      <div 
                        className={`h-full rounded-full ${saudeMetrics.faturamentoTotal >= saudeMetrics.breakEvenPoint ? 'bg-emerald-400' : 'bg-pink-500'}`}
                        style={{ width: `${Math.min(100, ((saudeMetrics.faturamentoTotal || 0) / (saudeMetrics.breakEvenPoint || 1)) * 100)}%` }}
                      />
                    ) : (
                      <div className="h-full rounded-full bg-slate-700 w-0" />
                    )}
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 font-semibold font-mono">
                    <span>Faturamento Atual: {formatCurrency(saudeMetrics.faturamentoTotal || 0)}</span>
                    <span>
                      {saudeMetrics.faturamentoTotal >= saudeMetrics.breakEvenPoint 
                        ? '🟢 Lucro Operacional' 
                        : `🔴 Faltam ${formatCurrency((saudeMetrics.breakEvenPoint || 0) - (saudeMetrics.faturamentoTotal || 0))} para empatar`}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-[10px] text-slate-350 leading-relaxed font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                    <span>Custos Fixos Mensais Considerados: <strong className="font-mono text-white">{formatCurrency(saudeMetrics.custoFixoTotal || 0)}</strong> (despesas de marketing, aluguel, salários, etc.)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                    <span>Margem de Contribuição Média: <strong className="font-mono text-white">{(saudeMetrics.margemContribuicaoMediaPerc || 0).toFixed(1)}%</strong></span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 text-[9.5px] text-slate-400">
                💡 <strong>Como atingir:</strong> Para bater o ponto de equilíbrio de <strong>{formatCurrency(saudeMetrics.breakEvenPoint || 0)}</strong>, tente aumentar as vendas de produtos com maior margem de contribuição ou reduzir despesas operacionais fixas (como cortar assinaturas ociosas ou otimizar anúncios).
              </div>
            </div>

            {/* Taxa de Inadimplência & Contas Vencidas */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Contas Vencidas & Taxa de Inadimplência</h4>
                    <p className="text-[9px] text-slate-400 font-medium">Mapeamento de parcelas ou cobranças pendentes expiradas sem pagamento.</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Taxa de Inadimplência</span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase border
                      ${saudeMetrics.taxaInadimplencia > 10 
                        ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' 
                        : saudeMetrics.taxaInadimplencia > 3 
                          ? 'bg-amber-50 text-amber-600 border-amber-100' 
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                      {saudeMetrics.taxaInadimplencia > 10 ? 'Alta (Risco de Caixa)' : saudeMetrics.taxaInadimplencia > 3 ? 'Moderada' : 'Saudável'}
                    </span>
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-800">
                    {(saudeMetrics.taxaInadimplencia || 0).toFixed(1)}%
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 font-sans font-semibold">
                    <div>
                      <span className="text-slate-400 block font-semibold">Prejuízo por Inadimplência:</span>
                      <span className="font-mono text-rose-500 font-bold">{formatCurrency(saudeMetrics.totalInadimplente || 0)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Receita Esperada Total:</span>
                      <span className="font-mono text-slate-600 font-bold">{formatCurrency(saudeMetrics.faturamentoTotalEsperado || 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-[10px]">
                  <div className="p-2.5 flex items-center justify-between font-sans">
                    <span className="text-slate-500 font-bold uppercase">Lançamentos de Contas a Receber Vencidos:</span>
                    <span className="font-mono font-bold text-slate-700">{formatCurrency(saudeMetrics.receitasVencidasNaoPagas || 0)}</span>
                  </div>
                  <div className="p-2.5 flex items-center justify-between font-sans">
                    <span className="text-slate-500 font-bold uppercase">Vendas a Clientes com Status Pendente:</span>
                    <span className="font-mono font-bold text-slate-700">{formatCurrency(saudeMetrics.salesVencidosNaoPagos || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-[9.5px] text-slate-400 leading-relaxed font-medium">
                ⚠️ <strong>Atenção:</strong> Uma taxa de inadimplência acima de <strong>8%</strong> prejudica seriamente as compras de estoque da coleção futura. Considere adotar lembretes automáticos de cobrança no WhatsApp ou reduzir parcelamento no boleto/crediário próprio para novos clientes.
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Insert Flow entry Dialog Modal Portal */}
      {isAddTxOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-50 overflow-hidden" id="add-tx-modal">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-xs tracking-wider uppercase font-sans">Cadastrar Nova Movimentação Comercial</span>
              <button 
                onClick={() => setIsAddTxOpen(false)}
                className="text-slate-400 hover:text-white transition-colors text-xs font-semibold px-2 py-1 bg-slate-850 rounded-lg"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSubmitTx} className="p-6 space-y-4 font-medium text-xs font-sans">
              
              {/* Type toggle */}
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide select-none">Tipo do Lançamento Comercial</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button 
                    type="button"
                    onClick={() => { 
                      setTxType('Outflow'); 
                      setTxCategory('Fornecedores'); 
                    }}
                    className={`py-2 rounded-lg text-center transition-all cursor-pointer font-extrabold flex items-center justify-center gap-1 text-[11px] uppercase ${txType === 'Outflow' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-450 hover:text-slate-650'}`}
                  >
                    <ArrowDownLeft size={13} />
                    Saída (Despesa / Custo)
                  </button>
                  <button 
                    type="button"
                    onClick={() => { 
                      setTxType('Inflow'); 
                      setTxCategory('Venda'); 
                    }}
                    className={`py-2 rounded-lg text-center transition-all cursor-pointer font-extrabold flex items-center justify-center gap-1 text-[11px] uppercase ${txType === 'Inflow' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-450 hover:text-slate-650'}`}
                  >
                    <ArrowUpRight size={13} />
                    Entrada (Receita)
                  </button>
                </div>
              </div>

              {/* Category selector and Amount input */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-xs">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide select-none">Categoria</label>
                  {txType === 'Inflow' ? (
                    <select 
                      id="tx-category-inflow"
                      value={txCategory}
                      onChange={(e) => setTxCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-hidden focus:border-slate-800 transition-colors focus:bg-white text-xs"
                    >
                      <option value="Venda">Venda Comercial</option>
                      <option value="Aporte">Aporte Proprietário</option>
                      <option value="Rendimento">Rendimentos</option>
                      <option value="Reembolso">Reembolsos</option>
                      <option value="Outros">Outras Entradas</option>
                    </select>
                  ) : (
                    <select 
                      id="tx-category-outflow"
                      value={txCategory}
                      onChange={(e) => setTxCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-hidden focus:border-slate-800 transition-colors focus:bg-white text-xs"
                    >
                      <option value="Fornecedores">Fornecedores (Peças/Tecidos)</option>
                      <option value="Aluguel">Aluguel / Condomínio</option>
                      <option value="Marketing">Marketing / Tráfego</option>
                      <option value="Salários">Salários / Equipe / Pro-labore</option>
                      <option value="Impostos">Impostos / Tributos</option>
                      <option value="Insumos / Embalagens">Insumos & Embalagens</option>
                      <option value="Serviços">Serviços Tercerizados (Oficinas)</option>
                      <option value="Outros Custos">Outros Custos Operacionais</option>
                    </select>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide select-none">Valor Total (R$)</label>
                  <input 
                    id="tx-amount-input"
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    placeholder="0.00"
                    value={txAmount || ''}
                    onChange={(e) => setTxAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold font-mono focus:outline-hidden focus:border-slate-800 transition-colors focus:bg-white text-xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide select-none font-sans">Descrição Detalhada</label>
                <input 
                  id="tx-desc-input"
                  type="text"
                  required
                  placeholder="Ex: Pagamento referente à confecção da coleção Verão"
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-750 placeholder-slate-450 font-semibold focus:outline-hidden focus:border-slate-800 transition-colors focus:bg-white text-xs"
                />
              </div>

              {/* Initial Status and Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide select-none">Status Inicial</label>
                  <select 
                    id="tx-status-input"
                    value={txStatus}
                    onChange={(e) => setTxStatus(e.target.value as 'pago' | 'pendente')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-hidden focus:border-slate-800 transition-colors focus:bg-white text-xs"
                  >
                    <option value="pendente">
                      {txType === 'Inflow' ? 'A Receber (Não Consolidado)' : 'A Pagar (Em Aberto)'}
                    </option>
                    <option value="pago">
                      {txType === 'Inflow' ? 'Recebido (Liquidado em Caixa)' : 'Pago (Liquidado em Caixa)'}
                    </option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide select-none">
                    {txStatus === 'pago' ? 'Data de Pagamento' : 'Data de Vencimento'}
                  </label>
                  <input
                    type="date"
                    required
                    value={txDueDate}
                    onChange={(e) => setTxDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold font-mono focus:outline-hidden focus:border-slate-800 transition-colors focus:bg-white text-xs"
                  />
                </div>
              </div>

              {/* Installment configuration scheduler (Parcelamento) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-[10.5px] text-slate-850 uppercase tracking-wide block">Dividir / Parcelar Lançamento</span>
                    <span className="text-[9.5px] text-slate-400 block font-semibold leading-tight">Divide o valor total e agenda lembretes de cobrança automáticos mensais.</span>
                  </div>
                  <input 
                    type="checkbox"
                    id="checkbox-installment"
                    checked={isInstallment}
                    onChange={(e) => setIsInstallment(e.target.checked)}
                    className="w-4.5 h-4.5 accent-pink-600 rounded-md cursor-pointer shrink-0"
                  />
                </div>

                {isInstallment && (
                  <div className="grid grid-cols-2 gap-3 items-center pt-2 border-t border-slate-200/50 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-slate-450 uppercase font-bold tracking-wider block">Número de Parcelas</label>
                      <select
                        value={installmentsCount}
                        onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-extrabold text-xs"
                      >
                        {[2,3,4,5,6,7,8,9,10,11,12].map(n => (
                          <option key={n} value={n}>{n}x</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8.5px] text-slate-450 uppercase font-bold tracking-wider block leading-none">Previsão por Parcela</span>
                      <div className="text-slate-800 font-semibold font-mono text-[11px] pt-1">
                        {txAmount > 0 
                          ? `${installmentsCount}x de ${formatCurrency(Number((txAmount / installmentsCount).toFixed(2)))}` 
                          : 'insira o valor total acima'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cancel or Save CTA */}
              <div className="flex gap-2.5 pt-3">
                <button 
                  type="button" 
                  onClick={() => setIsAddTxOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold font-sans transition-all text-center uppercase tracking-wider text-[10px]"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-extrabold font-sans transition-all text-center uppercase tracking-wider text-[10px] shadow-md shadow-slate-900/10"
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
