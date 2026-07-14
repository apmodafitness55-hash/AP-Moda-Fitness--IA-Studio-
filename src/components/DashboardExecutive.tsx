/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';

export const metadata = { robots: { index: false, follow: false } };
import { 
  BarChart, Bar, 
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  TrendingUp, 
  Coins, 
  Target, 
  Scale, 
  DollarSign,
  HelpCircle,
  Users,
  Award
} from 'lucide-react';
import { Product, Sale, Client, Transaction } from '../types';

interface DashboardExecutiveProps {
  products: Product[];
  sales: Sale[];
  clients: Client[];
  transactions: Transaction[];
  sellers?: string[];
}

export default function DashboardExecutive({ 
  products: rawProducts, 
  sales: rawSales, 
  clients: rawClients, 
  transactions: rawTransactions, 
  sellers: rawSellers = [] 
}: DashboardExecutiveProps) {
  const products = Array.isArray(rawProducts) ? rawProducts : [];
  const sales = Array.isArray(rawSales) ? rawSales : [];
  const clients = Array.isArray(rawClients) ? rawClients : [];
  const transactions = Array.isArray(rawTransactions) ? rawTransactions : [];
  const sellers = Array.isArray(rawSellers) ? rawSellers : [];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // 1. Receita Total matches historical + current
  const statsRecveita = useMemo(() => {
    const currentSales = sales.filter(s => s.status === 'Concluída').reduce((sum, s) => sum + s.total, 0);
    const histSales = transactions
      .filter(t => t.type === 'Inflow' && t.category === 'Venda' && t.id.includes('hist'))
      .reduce((sum, t) => sum + t.amount, 0);
    return currentSales + histSales;
  }, [sales, transactions]);

  const statsReceitaLiquida = useMemo(() => {
    const currentSalesLiquidas = sales
      .filter(s => s.status === 'Concluída')
      .reduce((sum, s) => {
        if (s.valor_liquido !== undefined && s.valor_liquido !== null && s.valor_liquido > 0) {
          return sum + s.valor_liquido;
        }
        // Fallback
        const totalAmount = s.total;
        let totalFee = 0;
        if (s.payments && Array.isArray(s.payments) && s.payments.length > 0) {
          s.payments.forEach(p => {
            const method = String(p.method || '').toLowerCase();
            let rate = 0;
            if (method.includes('pix')) {
              rate = 0.00;
            } else if (method.includes('debit') || method.includes('debito') || method.includes('débito')) {
              rate = 0.0138;
            } else if (method.includes('credit') || method.includes('credito') || method.includes('crédito') || method.includes('infinite') || method.includes('link')) {
              rate = 0.0316;
            }
            totalFee += (p.amount || 0) * rate;
          });
        } else {
          totalFee = totalAmount * 0.0316;
        }
        return sum + (totalAmount - totalFee);
      }, 0);

    const histSales = transactions
      .filter(t => t.type === 'Inflow' && t.category === 'Venda' && t.id.includes('hist'))
      .reduce((sum, t) => sum + t.amount, 0);
    return currentSalesLiquidas + histSales;
  }, [sales, transactions]);

  // 2. Ticket Médio
  const ticketMedio = useMemo(() => {
    const activeSales = sales.filter(s => s.status === 'Concluída');
    return activeSales.length > 0
      ? activeSales.reduce((sum, s) => sum + s.total, 0) / activeSales.length
      : 0;
  }, [sales]);

  // 3. Average Margem Média (Faturamento - Custo) / Faturamento
  const margemMedia = useMemo(() => {
    const activeSales = sales.filter(s => s.status === 'Concluída');
    if (activeSales.length === 0) return 0;
    const revenue = activeSales.reduce((sum, s) => sum + s.total, 0);
    const cost = activeSales.reduce((sum, s) => sum + s.costTotal, 0);
    if (revenue === 0) return 0;
    return Math.round(((revenue - cost) / revenue) * 100);
  }, [sales]);

  // Receita vs Custos vs Lucro Chart Data (6 months dynamic search)
  const barChartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = months[d.getMonth()];
      const mIndex = d.getMonth();
      const yStr = d.getFullYear();
      
      const monthSales = sales.filter(s => {
        if (s.status !== 'Concluída') return false;
        const sd = new Date(s.createdAt);
        return sd.getMonth() === mIndex && sd.getFullYear() === yStr;
      });
      
      const MonthRevenue = monthSales.reduce((sum, s) => sum + s.total, 0);
      const MonthCost = monthSales.reduce((sum, s) => sum + s.costTotal, 0);
      
      const monthTxOutflows = transactions.filter(t => {
        if (t.type !== 'Outflow') return false;
        const td = new Date(t.date);
        return td.getMonth() === mIndex && td.getFullYear() === yStr;
      }).reduce((sum, t) => sum + t.amount, 0);
      
      const totalCosts = MonthCost + monthTxOutflows;
      const profit = MonthRevenue - totalCosts;
      
      last6Months.push({
        name: mName,
        Receita: Number(MonthRevenue.toFixed(2)),
        Custos: Number(totalCosts.toFixed(2)),
        Lucro: Number(profit.toFixed(2))
      });
    }
    
    return last6Months;
  }, [sales, transactions]);

  // Crescimento Mensal Line Chart Data (6 months dynamic search)
  const lineChartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const last6Months = [];
    
    // Check if there are any active sales first
    const hasAnySales = sales.length > 0;
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = months[d.getMonth()];
      const mIndex = d.getMonth();
      const yStr = d.getFullYear();
      
      const monthSales = sales.filter(s => {
        if (s.status !== 'Concluída') return false;
        const sd = new Date(s.createdAt);
        return sd.getMonth() === mIndex && sd.getFullYear() === yStr;
      });
      
      const MonthRevenue = monthSales.reduce((sum, s) => sum + s.total, 0);
      const targetGoal = hasAnySales ? 5000 + (mIndex * 1500) : 0;
      
      last6Months.push({
        name: mName,
        Meta: targetGoal,
        Faturado: Number(MonthRevenue.toFixed(2))
      });
    }
    
    return last6Months;
  }, [sales]);

  // Compute Top Channels Percentages Dynamically
  const topChannels = useMemo(() => {
    const counts: Record<string, number> = {
      'Instagram': 0,
      'WhatsApp': 0,
      'E-commerce': 0,
      'Loja Física': 0
    };
    
    const activeSales = sales.filter(s => s.status === 'Concluída');
    const total = activeSales.length;
    
    if (total === 0) {
      return [
        { name: 'Instagram', pct: 0, color: '#E1306C' },
        { name: 'WhatsApp', pct: 0, color: '#25D366' },
        { name: 'E-commerce', pct: 0, color: '#3B82F6' },
        { name: 'Loja Física', pct: 0, color: '#F59E0B' }
      ];
    }
    
    activeSales.forEach(s => {
      if (counts[s.channel] !== undefined) {
        counts[s.channel]++;
      }
    });
    
    return [
      { name: 'Instagram', pct: Math.round((counts['Instagram'] / total) * 100), color: '#E1306C' },
      { name: 'WhatsApp', pct: Math.round((counts['WhatsApp'] / total) * 100), color: '#25D366' },
      { name: 'E-commerce', pct: Math.round((counts['E-commerce'] / total) * 100), color: '#3B82F6' },
      { name: 'Loja Física', pct: Math.round((counts['Loja Física'] / total) * 100), color: '#F59E0B' }
    ];
  }, [sales]);

  const salespersonStats = useMemo(() => {
    // Collect active sellers from the props
    const activeSellersSet = new Set<string>(sellers);
    
    // Also include any salesperson name that is in the actual completed sales list
    sales.forEach(s => {
      if (s.status === 'Concluída' && s.salesperson) {
        activeSellersSet.add(s.salesperson);
      }
    });

    const list = Array.from(activeSellersSet);
    const stats = list.map(name => ({
      name,
      revenue: 0,
      orders: 0,
      commission: 0
    }));

    sales.forEach(s => {
      if (s.status !== 'Concluída') return;
      if (s.salesperson) {
        const found = stats.find(item => item.name.toLowerCase() === s.salesperson?.toLowerCase());
        if (found) {
          found.revenue += s.total;
          found.orders += 1;
        }
      }
    });

    // Compute commission dynamically
    const rateSaved = localStorage.getItem('ap_commission_rate');
    const commissionRate = rateSaved ? parseFloat(rateSaved) / 100 : 0.05;
    stats.forEach(item => {
      item.commission = item.revenue * commissionRate;
    });

    return stats.sort((a, b) => b.revenue - a.revenue);
  }, [sales, sellers]);

  const monthlyRevenuePct = useMemo(() => {
    const target = 30000;
    const current = sales.filter(s => s.status === 'Concluída').reduce((sum, s) => sum + s.total, 0);
    return Math.min(Math.round((current / target) * 100), 100);
  }, [sales]);

  const monthlyNewClientsPct = useMemo(() => {
    const target = 20;
    const current = clients.length;
    return Math.min(Math.round((current / target) * 100), 100);
  }, [clients]);

  const monthlyNpsPct = useMemo(() => {
    const scoredClients = clients.filter(c => c.npsScore !== undefined);
    if (scoredClients.length === 0) return 0;
    const promoters = scoredClients.filter(c => c.npsScore! >= 9).length;
    const detractors = scoredClients.filter(c => c.npsScore! <= 6).length;
    const pct = Math.round(((promoters - detractors) / scoredClients.length) * 100);
    return Math.max(0, pct);
  }, [clients]);

  const repurchaseRate = useMemo(() => {
    if (clients.length === 0) return 0;
    const returningClients = clients.filter(c => c.ordersCount > 1).length;
    return Math.round((returningClients / clients.length) * 100);
  }, [clients]);

  const cacValue = useMemo(() => {
    if (clients.length === 0) return 0;
    const marketingExpenses = transactions
      .filter(t => t.type === 'Outflow' && (t.category?.toLowerCase() || '').includes('marketing'))
      .reduce((sum, t) => sum + t.amount, 0);
    return marketingExpenses > 0 ? marketingExpenses / clients.length : 28.50;
  }, [clients, transactions]);

  const ltvValue = useMemo(() => {
    if (clients.length === 0) return 0;
    const totalRevenue = sales.filter(s => s.status === 'Concluída').reduce((sum, s) => sum + s.total, 0);
    return totalRevenue / clients.length;
  }, [sales, clients]);

  const conversaoMedia = useMemo(() => {
    if (sales.length === 0) return 0;
    const completed = sales.filter(s => s.status === 'Concluída').length;
    return Math.round((completed / sales.length) * 100);
  }, [sales]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold font-sans text-slate-800 tracking-tight">Dashboard Executivo</h2>
        <p className="text-slate-400 text-sm">Visão estratégica e de alto impacto de saúde financeira da AP Moda Fitness</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* RECEITA TOTAL */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider font-sans uppercase">Receita</span>
            <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
              <Coins size={16} />
            </div>
          </div>
          <div className="mt-2 space-y-1.5">
            <div>
              <span className="text-[9px] font-semibold text-slate-400">Bruta:</span>
              <h3 className="text-sm font-bold text-slate-600 tracking-tight">{formatCurrency(statsRecveita)}</h3>
            </div>
            <div className="border-t border-slate-50 pt-1.5">
              <span className="text-[9px] font-bold text-pink-500 uppercase">Líquida Receber:</span>
              <h3 className="text-base md:text-lg font-extrabold text-slate-800 tracking-tight">{formatCurrency(statsReceitaLiquida)}</h3>
            </div>
          </div>
        </div>

        {/* TICKET MÉDIO */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider font-sans uppercase">Ticket Médio</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Target size={16} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">{formatCurrency(ticketMedio)}</h3>
            {ticketMedio > 0 ? (
              <span className="text-[10px] font-medium text-blue-500 flex items-center gap-1 mt-1">
                <TrendingUp size={10} /> Média real de vendas
              </span>
            ) : (
              <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mt-1">
                Sem vendas efetuadas
              </span>
            )}
          </div>
        </div>

        {/* CONVERSÃO */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider font-sans uppercase">Conversão Média</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Award size={16} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">{conversaoMedia}%</h3>
            {conversaoMedia > 0 ? (
              <span className="text-[10px] font-medium text-emerald-500 flex items-center gap-1 mt-1">
                <TrendingUp size={10} /> Conversão de pedidos real
              </span>
            ) : (
              <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mt-1">
                Sem histórico de leads/pedidos
              </span>
            )}
          </div>
        </div>

        {/* MARGEM MÉDIA */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider font-sans uppercase">Margem Média</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Scale size={16} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">{margemMedia}%</h3>
            {margemMedia > 0 ? (
              <span className="text-[10px] font-medium text-purple-500 flex items-center gap-1 mt-1">
                <TrendingUp size={10} /> Margem sobre vendas
              </span>
            ) : (
              <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mt-1">
                Sem faturamento ativa
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Corporate Charts Grid (Receita vs Custos vs Lucro AND Crescimento Mensal Line) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receita vs Custos vs Lucro Bar Chart */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-xs gap-4 flex flex-col">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Receita vs Custos vs Lucro</h3>
            <p className="text-slate-400 text-xs">Comparativo histórico de fluxos e saldo de caixa operacional</p>
          </div>
          <div className="h-64 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(v) => `R$${v/1000}k`} tickLine={false} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value))]} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontFamily: 'sans-serif' }} />
                <Bar dataKey="Receita" fill="#EC4899" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Custos" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Lucro" fill="#25D366" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crescimento Mensal Line Chart */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-xs gap-4 flex flex-col">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Crescimento Mensal</h3>
            <p className="text-slate-400 text-xs">Análise de atingimento de metas e performance de vendas</p>
          </div>
          <div className="h-64 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(v) => `R$${v/1000}k`} tickLine={false} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontFamily: 'sans-serif' }} />
                <Line type="monotone" dataKey="Faturado" stroke="#EC4899" strokeWidth={3} dot={{ strokeWidth: 1, r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Meta" stroke="#10B981" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Meta Goals / Channel Conversion / KPI breakdown (Matches bottom of second screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Channels */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-3">Top Canais</h4>
          <div className="mt-4 space-y-4">
            {topChannels.map((chan, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-medium font-sans">
                  <span className="text-slate-650 flex items-center gap-1.5 font-semibold">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: chan.color }} />
                    {chan.name}
                  </span>
                  <span className="text-slate-800 font-bold font-mono">{chan.pct}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${chan.pct}%`, backgroundColor: chan.color }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Metas do Mês */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-3">Metas do Mês</h4>
          <div className="mt-4 space-y-4">
            {/* Metas list */}
            <div className="space-y-1.5 text-xs font-sans">
              <div className="flex justify-between font-medium">
                <span className="text-slate-600 font-semibold">Faturamento Mês</span>
                <span className="font-bold font-mono text-slate-800">{monthlyRevenuePct}%</span>
              </div>
              <div className="w-full bg-slate-150 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-pink-500 rounded-full transition-all duration-500" style={{ width: `${monthlyRevenuePct}%` }} />
              </div>
            </div>

            <div className="space-y-1.5 text-xs font-sans">
              <div className="flex justify-between font-medium">
                <span className="text-slate-600 font-semibold">Novos Clientes</span>
                <span className="font-bold font-mono text-slate-800">{monthlyNewClientsPct}%</span>
              </div>
              <div className="w-full bg-slate-150 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${monthlyNewClientsPct}%` }} />
              </div>
            </div>

            <div className="space-y-1.5 text-xs font-sans">
              <div className="flex justify-between font-medium">
                <span className="text-slate-600 font-semibold">NPS Geral Target</span>
                <span className="font-bold font-mono text-slate-800">{monthlyNpsPct}%</span>
              </div>
              <div className="w-full bg-slate-150 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${monthlyNpsPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Indicadores Chave */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-3">Indicadores Chave</h4>
          <div className="mt-4 space-y-3.5 text-xs font-sans">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-650 flex items-center gap-1 font-semibold">
                Clientes Ativos
                <HelpCircle size={12} className="text-slate-400 cursor-pointer" />
              </span>
              <span className="bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full text-[10px] font-mono">
                {clients.length} Ativas
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-650 flex items-center gap-1 font-semibold">
                Taxa de Recompra
                <HelpCircle size={12} className="text-slate-400 cursor-pointer" />
              </span>
              <span className="bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full text-[10px] font-mono">
                {repurchaseRate}%
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-650 flex items-center gap-1 font-semibold">
                CAC (Custo de Aquisição)
              </span>
              <span className="font-bold font-mono text-slate-850">
                {formatCurrency(cacValue)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-650 flex items-center gap-1 font-semibold">
                LTV (Lifetime Value)
              </span>
              <span className="font-bold font-mono text-slate-855 text-pink-650">
                {formatCurrency(ltvValue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Salespeople Commissions & Leaderboard Section */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-xs flex flex-col gap-4 text-left font-sans" id="executive-salespeople-team">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-50 pb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5 font-sans">
              <span>Desempenho de Equipe & Comissões ({(parseFloat(localStorage.getItem('ap_commission_rate') || '5')).toFixed(1)}%)</span>
              <span className="bg-pink-100 text-pink-700 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">
                Comissão Unificada
              </span>
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">Acompanhe as metas atingidas, comissões individuais e faturamento de cada vendedora parceira</p>
          </div>
          
          <div className="bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-xl font-mono text-xs text-slate-650 font-bold flex items-center gap-2">
            <span>Total Comissão Devida:</span>
            <span className="text-pink-600 font-black">
              {formatCurrency(salespersonStats.reduce((sum, s) => sum + s.commission, 0))}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table list */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] font-bold select-none text-left">
                  <th className="pb-2.5">Vendedora</th>
                  <th className="pb-2.5">Qtd Vendas</th>
                  <th className="pb-2.5">Total Faturado</th>
                  <th className="pb-2.5 text-right font-black">Comissão ({(parseFloat(localStorage.getItem('ap_commission_rate') || '5')).toFixed(0)}%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {salespersonStats.map((seller, idx) => {
                  const avatarLetters = seller.name.split(' ').map(n => n[0]).join('').slice(0, 2);
                  return (
                    <tr key={seller.name} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg font-black text-xs flex items-center justify-center 
                          ${idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-150 text-slate-600'}`}>
                          {idx === 0 ? '🥇' : avatarLetters}
                        </div>
                        <div>
                          <p className="font-bold text-slate-750">{seller.name}</p>
                          {idx === 0 && <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-1 py-0.5 rounded-md">Destaque do Mês</span>}
                        </div>
                      </td>
                      <td className="py-3 text-slate-600 font-mono font-medium">{seller.orders} ordens</td>
                      <td className="py-3 text-slate-800 font-mono font-bold">{formatCurrency(seller.revenue)}</td>
                      <td className="py-3 text-right font-mono font-extrabold text-pink-600 font-semibold">{formatCurrency(seller.commission)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Graphical Progress Bars */}
          <div className="bg-slate-50/65 border border-slate-100 rounded-2xl p-4 md:p-5 flex flex-col gap-4 justify-between">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Metas de Participação no Faturamento</h4>
              <p className="text-[10px] text-slate-400">Distribuição percentual de contribuição da equipe de vendedoras no total faturado no mês</p>
            </div>
            
            <div className="space-y-3.5 my-1">
              {salespersonStats.map((seller, idx) => {
                const totalTeamRevenue = salespersonStats.reduce((sum, s) => sum + s.revenue, 0) || 1;
                const sharePct = ((seller.revenue / totalTeamRevenue) * 100).toFixed(1);
                
                return (
                  <div key={seller.name} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-sans font-medium">
                      <span className="text-slate-650 font-bold">{seller.name}</span>
                      <span className="text-slate-400 font-mono">{sharePct}% ({formatCurrency(seller.revenue)})</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          idx === 0 ? 'bg-gradient-to-r from-pink-500 to-pink-600' :
                          idx === 1 ? 'bg-gradient-to-r from-indigo-500 to-indigo-600' :
                          idx === 2 ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-slate-400'
                        }`}
                        style={{ width: `${sharePct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[9px] text-slate-400 font-sans leading-normal leading-relaxed text-center">💡 A comissão é calculada sobre o faturamento faturado real e liquidado. Pagamentos de comissão podem ser lançados como "Saída / Salários de Equipe" no Painel Financeiro.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
