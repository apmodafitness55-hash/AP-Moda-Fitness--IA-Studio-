/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';

export const metadata = { robots: { index: false, follow: false } };
import { 
  TrendingUp, 
  Award, 
  DollarSign, 
  Target, 
  ShoppingBag, 
  Calendar, 
  CheckCircle2, 
  User, 
  HelpCircle, 
  Sparkles, 
  Percent, 
  BarChart2, 
  LogOut, 
  ChevronRight, 
  Info,
  Briefcase,
  Layers,
  Search,
  Filter,
  Check
} from 'lucide-react';
import { Sale } from '../types';

interface SellerDashboardProps {
  currentUser: any;
  onLogout: () => void;
  sales: Sale[];
  onAddSale?: (sale: Sale) => void;
}

export default function SellerDashboard({ currentUser, onLogout, sales = [] }: SellerDashboardProps) {
  // Configurable individual goal for the salesperson
  const [individualGoal, setIndividualGoal] = useState<number>(() => {
    const saved = localStorage.getItem(`ap_seller_goal_${currentUser?.name}`);
    return saved ? parseFloat(saved) : 10000; // Default goal R$ 10.000,00
  });

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(individualGoal.toString());

  // Search and filter for the commission audit history
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Concluída' | 'Pendente'>('all');

  // Dynamic commission rate loaded from configuration (defaults to 5% if not set)
  const commissionRate = useMemo(() => {
    const saved = localStorage.getItem('ap_commission_rate');
    return saved ? parseFloat(saved) / 100 : 0.05;
  }, []);

  // Handler to update the goal
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(goalInput);
    if (!isNaN(val) && val > 0) {
      setIndividualGoal(val);
      localStorage.setItem(`ap_seller_goal_${currentUser?.name}`, val.toString());
      setIsEditingGoal(false);
    }
  };

  // June 2026 definition (system date in the simulation)
  const currentYear = 2026;
  const currentMonth = 5; // 0-indexed (June is 5)

  // 1. Filter completed sales made by this salesperson in the current month
  const sellerMonthlySales = useMemo(() => {
    return sales.filter(s => {
      // Name match check (case-insensitive, safety trim)
      const sellerMatch = s.salesperson && currentUser?.name && 
        s.salesperson.toLowerCase().trim() === currentUser.name.toLowerCase().trim();
      
      if (!sellerMatch) return false;

      const dateObj = new Date(s.createdAt);
      const isCurrentMonth = dateObj.getFullYear() === currentYear && dateObj.getMonth() === currentMonth;
      
      return isCurrentMonth;
    });
  }, [sales, currentUser]);

  // 2. Total accumulated sales revenue for this month
  const totalBilledMonth = useMemo(() => {
    const completed = sellerMonthlySales.filter(s => s.status === 'Concluída');
    return completed.reduce((sum, s) => sum + s.total, 0);
  }, [sellerMonthlySales]);

  // 3. Total generated commission due (and already completed)
  const totalCommissionEarned = useMemo(() => {
    const completed = sellerMonthlySales.filter(s => s.status === 'Concluída');
    return completed.reduce((sum, s) => sum + (s.total * commissionRate), 0);
  }, [sellerMonthlySales, commissionRate]);

  // 4. Goal completion metrics
  const percentageReached = useMemo(() => {
    if (individualGoal <= 0) return 100;
    const pct = (totalBilledMonth / individualGoal) * 100;
    return Math.min(100, Number(pct.toFixed(1)));
  }, [totalBilledMonth, individualGoal]);

  const remainingToGoal = useMemo(() => {
    const diff = individualGoal - totalBilledMonth;
    return diff > 0 ? diff : 0;
  }, [individualGoal, totalBilledMonth]);

  // Filtered list for commission audit history
  const filteredSalesForAudit = useMemo(() => {
    return sellerMonthlySales.filter(s => {
      const matchSearch = s.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      
      return matchSearch && matchStatus;
    });
  }, [sellerMonthlySales, searchQuery, statusFilter]);

  // Direct helper to format currency
  const formatValue = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none" id="seller-dashboard-root">
      {/* Top Professional Banner */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-pink-500/15 text-pink-500 rounded-2xl flex items-center justify-center font-black shadow-lg shadow-pink-500/5 animate-pulse">
            <Award size={22} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-pink-500/10 text-pink-400 border border-pink-500/20 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Perfil Vendedor
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 font-extrabold px-2 py-0.5 rounded-full tracking-wider">
                Mês Corrente: Junho/2026
              </span>
            </div>
            <h1 className="text-base font-black text-white leading-normal mt-0.5">
              Olá, {currentUser?.name || 'Vendedora Sênior'}! 🌸
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Status de Acesso</p>
            <p className="text-xs font-extrabold text-emerald-400 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Comissionamento Ativo</span>
            </p>
          </div>

          <button 
            onClick={onLogout}
            className="px-4 py-2 bg-slate-850 hover:bg-slate-800 active:scale-95 text-xs text-slate-300 hover:text-white font-bold rounded-xl flex items-center gap-2 transition-all border border-slate-800 cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sair da Conta</span>
          </button>
        </div>
      </header>

      {/* Main Grid Scroll Area */}
      <main className="flex-grow p-4 md:p-6 overflow-y-auto space-y-6 max-w-7xl mx-auto w-full">
        
        {/* Welcome motivational row */}
        <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/5 to-slate-950 border border-pink-500/20 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-1.5 max-w-xl">
            <h3 className="text-sm font-black text-pink-400 flex items-center gap-1.5">
              <Sparkles size={16} />
              <span>Seu Ritmo de Vendas e Metas de Junho</span>
            </h3>
            <p className="text-xs text-slate-350 leading-relaxed">
              Continue acompanhando seu progresso diário e o acúmulo de suas comissões personalizadas. Atualmente, você está comissionada em <span className="font-extrabold text-white">{(commissionRate * 100).toFixed(1)}%</span> sobre cada venda concluída!
            </p>
          </div>

          {/* Quick goal adjustment */}
          <div className="bg-slate-900/85 border border-slate-800 p-3 rounded-2xl flex items-center justify-between gap-4 shrink-0 shadow-lg min-w-[240px]">
            <div>
              <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wide">Minha Meta Individual</span>
              <p className="text-sm font-black text-white mt-0.5">{formatValue(individualGoal)}</p>
            </div>
            
            {isEditingGoal ? (
              <form onSubmit={handleSaveGoal} className="flex gap-2">
                <input 
                  type="number"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="w-20 bg-slate-950 border border-slate-750 text-center font-bold font-mono text-xs rounded-lg py-1 px-1.5 text-white focus:outline-hidden"
                  placeholder="Meta"
                />
                <button type="submit" className="px-2 py-1 bg-pink-600 hover:bg-pink-700 font-extrabold text-[10px] rounded-lg text-white border-0 cursor-pointer">
                  OK
                </button>
              </form>
            ) : (
              <button 
                onClick={() => {
                  setGoalInput(individualGoal.toString());
                  setIsEditingGoal(true);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 font-bold text-[10px] rounded-lg text-pink-400 hover:text-pink-300 transition-colors border-0 cursor-pointer"
              >
                Alterar Meta
              </button>
            )}
          </div>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
          {/* CARD 1: TOTAL ACUMULADO DE VENDAS */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-3 shadow-xl hover:border-slate-800 transition-colors">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Volume Vendido</span>
              <div className="w-8 h-8 bg-pink-500/10 rounded-xl flex items-center justify-center text-pink-400">
                <ShoppingBag size={16} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-50 font-mono tracking-tight">{formatValue(totalBilledMonth)}</p>
              <div className="flex items-center gap-1 text-[10px] text-slate-450 mt-2">
                <Calendar size={11} className="text-slate-500" />
                <span>Junho/2026 • </span>
                <span className="text-pink-400 font-bold">{sellerMonthlySales.filter(s => s.status === 'Concluída').length} pedidos concluídos</span>
              </div>
            </div>
          </div>

          {/* CARD 2: COMISSÃO A RECEBER */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-3 shadow-xl hover:border-slate-800 transition-colors">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Minha Comissão Geral</span>
              <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                <DollarSign size={16} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-400 font-mono tracking-tight">{formatValue(totalCommissionEarned)}</p>
              <div className="flex items-center gap-1 text-[10px] text-slate-450 mt-2">
                <Percent size={11} className="text-emerald-500" />
                <span>Faturamento comissionado em </span>
                <span className="text-emerald-400 font-bold">{(commissionRate * 100).toFixed(0)}% fixos</span>
              </div>
            </div>
          </div>

          {/* CARD 3: TAXA DE CONVERSÃO & PERFORMANCE */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-3 shadow-xl hover:border-slate-800 transition-colors">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Desempenho Geral</span>
              <div className="w-8 h-8 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
                <TrendingUp size={16} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-black text-slate-50 font-mono tracking-tight">{percentageReached}%</p>
                <span className="text-[10px] text-slate-400 font-bold uppercase">da Meta</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-450 mt-2">
                <CheckCircle2 size={11} className="text-purple-400" />
                <span>Meta individual estipulada em </span>
                <span className="text-purple-400 font-bold">{formatValue(individualGoal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* METAS VISUAL PROGRESS AREA */}
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-5 md:p-6 space-y-5 shadow-xl">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Target size={16} className="text-pink-500" />
              <span>Acompanhamento da Meta Individual do Mês</span>
            </h3>
            <span className="text-[10px] bg-slate-850 text-slate-300 border border-slate-750 px-2.5 py-1 rounded-xl font-bold">
              {percentageReached === 100 ? '🎉 META ALCANÇADA!' : `Faltam ${formatValue(remainingToGoal)}`}
            </span>
          </div>

          {/* Professional custom styled Progress Bar with markers and glow */}
          <div className="space-y-2">
            <div className="w-full bg-slate-950 h-5 rounded-2xl overflow-hidden p-1 border border-slate-800 relative">
              <div 
                className="h-full rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-emerald-500 transition-all duration-500 relative shadow-inner"
                style={{ width: `${percentageReached}%` }}
              >
                {percentageReached > 15 && (
                  <span className="absolute inset-y-0 right-2 flex items-center text-[8px] font-black text-white font-mono uppercase tracking-wider">
                    {percentageReached}%
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-wider px-1">
              <span>R$ 0,00</span>
              <span className="text-pink-400">R$ {(individualGoal * 0.5).toFixed(0)} (50%)</span>
              <span className="text-purple-400">R$ {(individualGoal * 0.8).toFixed(0)} (80%)</span>
              <span className="text-emerald-400">Meta: {formatValue(individualGoal)}</span>
            </div>
          </div>

          {/* Feedback/Advice based on progress */}
          <div className="p-4.5 bg-slate-950 border border-slate-850 rounded-2xl flex items-start gap-3 text-slate-350 text-xs">
            <Info size={16} className="text-pink-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-extrabold text-slate-200">
                {percentageReached === 100 
                  ? 'Incrível! Você bateu sua meta individual do mês de junho. Suas comissões estão garantidas e você já pode buscar o bônus de superação!'
                  : percentageReached >= 75
                    ? 'Quase lá! Você já alcançou mais de 75% da sua meta individual. Foque nos follow-ups no WhatsApp para fechar as sacolas pendentes.'
                    : 'Foco e consistência! Use o PDV da loja para registrar novas vendas presenciais e aumente seu ticket médio sugerindo acessórios em cada atendimento.'
                }
              </p>
              <p className="text-[10px] text-slate-500 leading-normal">
                Comissões são calculadas sobre vendas com status <span className="text-emerald-400 font-bold">"Concluída"</span>. Pedidos pendentes ou cancelados não geram saldo de comissionamento ativo.
              </p>
            </div>
          </div>
        </div>

        {/* COMMISSION AUDIT & LOG HISTORY LIST */}
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-5 md:p-6 space-y-5 shadow-xl">
          
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <BarChart2 size={16} className="text-pink-500" />
                <span>Auditoria e Histórico de Comissões</span>
              </h3>
              <p className="text-slate-450 text-[11px] mt-1">Lista de todos os atendimentos e vendas vinculadas ao seu nome no mês</p>
            </div>

            {/* Interactive Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={12} className="absolute left-3 top-2.5 text-slate-500" />
                <input 
                  type="text"
                  placeholder="Buscar ID ou Cliente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 font-bold text-[10px] text-slate-200 placeholder-slate-500 focus:outline-hidden w-40"
                />
              </div>

              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold transition-all cursor-pointer border-0 ${statusFilter === 'all' ? 'bg-pink-650 text-white shadow-md' : 'text-slate-400 hover:text-slate-250'}`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setStatusFilter('Concluída')}
                  className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold transition-all cursor-pointer border-0 ${statusFilter === 'Concluída' ? 'bg-pink-650 text-white shadow-md' : 'text-slate-400 hover:text-slate-250'}`}
                >
                  Concluídos
                </button>
                <button
                  onClick={() => setStatusFilter('Pendente')}
                  className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold transition-all cursor-pointer border-0 ${statusFilter === 'Pendente' ? 'bg-pink-650 text-white shadow-md' : 'text-slate-400 hover:text-slate-250'}`}
                >
                  Pendentes
                </button>
              </div>
            </div>
          </div>

          {/* Audit List Table */}
          <div className="overflow-x-auto">
            {filteredSalesForAudit.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <ShoppingBag size={30} className="text-slate-700 mx-auto" />
                <p className="text-slate-400 italic text-xs">Nenhum pedido localizado nesta listagem.</p>
                <p className="text-[10px] text-slate-600">Garanta que as vendas registradas no PDV usem seu nome de vendedora.</p>
              </div>
            ) : (
              <table className="w-full text-xs text-left font-sans">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase text-[9px] font-bold tracking-wider select-none">
                    <th className="pb-3 pl-2">Venda ID</th>
                    <th className="pb-3">Data</th>
                    <th className="pb-3">Cliente</th>
                    <th className="pb-3">Canal</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Valor Bruto</th>
                    <th className="pb-3 text-right pr-2">Sua Comissão ({(commissionRate * 100).toFixed(0)}%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredSalesForAudit.map((s) => {
                    const commissionValue = s.total * commissionRate;
                    const isCompleted = s.status === 'Concluída';
                    
                    return (
                      <tr key={s.id} className="hover:bg-slate-850/40 transition-colors">
                        <td className="py-3 pl-2 font-mono font-bold text-pink-400 uppercase">
                          {s.id}
                        </td>
                        <td className="py-3 text-slate-400 font-mono text-[10px]">
                          {new Date(s.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 font-bold text-slate-200">
                          {s.clientName}
                        </td>
                        <td className="py-3">
                          <span className="text-[10px] bg-slate-800 text-slate-350 px-2 py-0.5 rounded-md font-semibold">
                            {s.channel}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full
                            ${isCompleted ? 'bg-emerald-900/30 text-emerald-400' : 'bg-amber-900/30 text-amber-400 animate-pulse'}
                          `}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono font-medium text-slate-350">
                          {formatValue(s.total)}
                        </td>
                        <td className="py-3 text-right pr-2 font-mono font-bold">
                          {isCompleted ? (
                            <span className="text-emerald-400">{formatValue(commissionValue)}</span>
                          ) : (
                            <span className="text-slate-500 italic text-[10px]" title="Comissão será liberada quando a venda for concluída">
                              R$ 0,00 (Pendente)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </main>

      {/* Humble craft signature credit footer */}
      <footer className="bg-slate-900/40 border-t border-slate-900 py-3 text-center shrink-0">
        <p className="text-[9px] text-slate-600 font-mono uppercase tracking-widest">
          Módulo de Vendas & Comissões • AP Moda Fitness v3.0
        </p>
      </footer>
    </div>
  );
}
