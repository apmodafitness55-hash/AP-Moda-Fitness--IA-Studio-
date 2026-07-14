/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';

export const metadata = { robots: { index: false, follow: false } };
import { 
  AreaChart, Area, 
  BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  DollarSign, 
  ShoppingBag, 
  Percent, 
  Users, 
  Package, 
  Star, 
  TrendingUp,
  Instagram,
  Compass,
  Laptop,
  Store,
  MessageCircle,
  Clock,
  ArrowUpRight,
  Eye,
  Plus,
  Printer,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { Product, Sale, Client, Transaction, ActiveTab, SalesChannel } from '../types';
import ThermalReceipt from './ThermalReceipt';
import SalesGoalSimulator from './SalesGoalSimulator';

interface DashboardOverviewProps {
  products: Product[];
  sales: Sale[];
  clients: Client[];
  transactions: Transaction[];
  setActiveTab: (tab: ActiveTab) => void;
  setCustomersCRMSubTab?: (subTab: 'diretorio' | 'funil' | 'followup' | 'parceiros' | 'fidelidade') => void;
  setProductsSubTab?: (subTab: 'inventario' | 'restoque' | 'cadastro') => void;
  isDemo?: boolean;
}

export default function DashboardOverview({ 
  products: rawProducts, 
  sales: rawSales, 
  clients: rawClients, 
  transactions: rawTransactions, 
  setActiveTab, 
  setCustomersCRMSubTab,
  setProductsSubTab,
  isDemo = true 
}: DashboardOverviewProps) {
  const products = Array.isArray(rawProducts) ? rawProducts : [];
  const sales = Array.isArray(rawSales) ? rawSales : [];
  const clients = Array.isArray(rawClients) ? rawClients : [];
  const transactions = Array.isArray(rawTransactions) ? rawTransactions : [];

  // Chart configurations
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('7d');
  const [chartType, setChartType] = useState<'area' | 'bar'>('bar');
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<Sale | null>(null);
  const [isThermalReceiptOpen, setIsThermalReceiptOpen] = useState<boolean>(false);
  const [pieMode, setPieMode] = useState<'categoria' | 'canal'>('categoria');

  // Dynamic calculations
  const faturamentoTotal = useMemo(() => {
    return sales
      .filter(s => s.status === 'Concluída')
      .reduce((sum, s) => sum + s.total, 0);
  }, [sales]);

  const faturamentoLiquido = useMemo(() => {
    return sales
      .filter(s => s.status === 'Concluída')
      .reduce((sum, s) => {
        // If exact valor_liquido was saved in the db by the InfinitePay webhook
        if (s.valor_liquido !== undefined && s.valor_liquido !== null && s.valor_liquido > 0) {
          return sum + s.valor_liquido;
        }

        // Fallback calculations for sales without pre-calculated database fields
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
              rate = 0.0316; // default crédito 1x
            }
            totalFee += (p.amount || 0) * rate;
          });
        } else {
          // If no payments structured list is present, assume credit_1x as a conservative baseline
          totalFee = totalAmount * 0.0316;
        }

        return sum + (totalAmount - totalFee);
      }, 0);
  }, [sales]);

  const totalVendasConcluidas = useMemo(() => {
    return sales.filter(s => s.status === 'Concluída').length;
  }, [sales]);

  const ticketMedio = useMemo(() => {
    return totalVendasConcluidas > 0 ? faturamentoTotal / totalVendasConcluidas : 0;
  }, [faturamentoTotal, totalVendasConcluidas]);

  const totalClients = useMemo(() => clients.length, [clients]);

  const totalStockItems = useMemo(() => {
    return products.reduce((sum, p) => sum + p.stock, 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => p.stock < p.minStock).length;
  }, [products]);

  const dynamicNpsScore = useMemo(() => {
    const scoredClients = clients.filter(c => c.npsScore !== undefined);
    if (scoredClients.length === 0) return 100;
    const promoters = scoredClients.filter(c => c.npsScore! >= 9).length;
    const detractors = scoredClients.filter(c => c.npsScore! <= 6).length;
    const total = scoredClients.length;
    return Math.round(((promoters - detractors) / total) * 100);
  }, [clients]);

  // Compute Sales by Channel
  const channelData = useMemo(() => {
    const counts: Record<SalesChannel, { value: number; revenue: number }> = {
      'Instagram': { value: 0, revenue: 0 },
      'WhatsApp': { value: 0, revenue: 0 },
      'E-commerce': { value: 0, revenue: 0 },
      'Loja Física': { value: 0, revenue: 0 },
      'Outros': { value: 0, revenue: 0 }
    };

    sales.forEach(sale => {
      if (sale.status === 'Concluída') {
        const chan = sale.channel && counts[sale.channel] ? sale.channel : 'Outros';
        counts[chan].value += 1;
        counts[chan].revenue += sale.total;
      }
    });

    const colors = {
      'Instagram': '#E1306C',
      'WhatsApp': '#25D366',
      'E-commerce': '#3B82F6',
      'Loja Física': '#F59E0B',
      'Outros': '#8B5CF6'
    };

    return Object.entries(counts).map(([name, data]) => ({
      name,
      value: data.revenue > 0 ? Number(data.revenue.toFixed(2)) : 0,
      count: data.value,
      color: colors[name as SalesChannel] || '#94A3B8'
    })).filter(item => item.value > 0);
  }, [sales]);

  // If no completed sales, we return actual sales counts to prevent ghost data
  const donutData = useMemo(() => {
    return channelData;
  }, [channelData]);

  // Compute Sales by Category
  const categorySalesData = useMemo(() => {
    const categoryTotals: Record<string, { value: number; count: number }> = {};
    
    sales.forEach(sale => {
      if (sale.status !== 'Concluída') return;
      
      sale.items.forEach(item => {
        // Find matching product to get its category
        const product = products.find(p => p.id === item.productId || p.name.toLowerCase() === item.name.toLowerCase());
        const category = product?.category || 'Moda Fitness';
        
        if (!categoryTotals[category]) {
          categoryTotals[category] = { value: 0, count: 0 };
        }
        
        categoryTotals[category].value += item.price * item.quantity;
        categoryTotals[category].count += item.quantity;
      });
    });
    
    const colors = [
      '#EC4899', // Pink-500
      '#3B82F6', // Blue-500
      '#8B5CF6', // Violet-500
      '#10B981', // Emerald-500
      '#F59E0B', // Amber-500
      '#EF4444', // Red-500
      '#06B6D4', // Cyan-500
      '#14B8A6'  // Teal-500
    ];

    const entries = Object.entries(categoryTotals).map(([name, data], index) => ({
      name,
      value: Number(data.value.toFixed(2)),
      count: data.count,
      color: colors[index % colors.length]
    }));

    return entries;
  }, [sales, products]);

  // Generate dynamic sales over last 7 or 14 days
  const dailyPerformanceData = useMemo(() => {
    const daysToCover = timeRange === '14d' ? 14 : 7;
    const result = [];
    
    for (let i = daysToCover - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      
      const salesOnDay = sales.filter(s => {
        if (s.status !== 'Concluída') return false;
        try {
          const saleDate = new Date(s.createdAt).toISOString().split('T')[0];
          return saleDate === dateStr;
        } catch {
          return false;
        }
      });
      
      const revenue = salesOnDay.reduce((sum, s) => sum + s.total, 0);
      const count = salesOnDay.length;
      
      result.push({
        dateStr,
        name: label,
        Faturamento: Number(revenue.toFixed(2)),
        Vendas: count
      });
    }

    return result;
  }, [sales, timeRange]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getChannelIcon = (channel: SalesChannel) => {
    switch (channel) {
      case 'Instagram':
        return <Instagram size={14} className="text-pink-500" />;
      case 'WhatsApp':
        return <MessageCircle size={14} className="text-green-500" />;
      case 'E-commerce':
        return <Laptop size={14} className="text-blue-500" />;
      case 'Loja Física':
        return <Store size={14} className="text-amber-500" />;
      default:
        return <Compass size={14} className="text-slate-500" />;
    }
  };

  const bestSellingProducts = useMemo(() => {
    return [...products].sort((a, b) => b.salesCount - a.salesCount).slice(0, 3);
  }, [products]);

  const criticalStockVariations = useMemo(() => {
    const list: { productId: string; productName: string; size: string; color: string; stock: number }[] = [];
    products.forEach(p => {
      if (p.sizeColorStocks) {
        Object.entries(p.sizeColorStocks).forEach(([size, colorObj]) => {
          if (colorObj) {
            Object.entries(colorObj).forEach(([color, stock]) => {
              if (stock <= 2) {
                list.push({
                  productId: p.id,
                  productName: p.name,
                  size,
                  color,
                  stock
                });
              }
            });
          }
        });
      } else if (p.colorStocks) {
        Object.entries(p.colorStocks).forEach(([color, stock]) => {
          if (stock <= 2) {
            list.push({
              productId: p.id,
              productName: p.name,
              size: 'Padrão',
              color,
              stock
            });
          }
        });
      } else if (p.stock <= 2) {
        list.push({
          productId: p.id,
          productName: p.name,
          size: 'Único',
          color: 'Padrão',
          stock: p.stock
        });
      }
    });
    return list;
  }, [products]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-sans text-slate-800 tracking-tight">Dashboard</h2>
          <p className="text-slate-400 text-sm">Visão geral em tempo real do seu negócio fitness de moda feminina</p>
        </div>
        <div className="flex gap-2.5">
          <button 
            id="create-sale-dash-btn"
            onClick={() => setActiveTab(ActiveTab.PDV)}
            className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 font-sans font-medium text-white px-4 py-2 rounded-xl text-xs shadow-md shadow-pink-500/10 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Nova Venda (PDV)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* FATURAMENTO */}
        <div 
          onClick={() => setActiveTab(ActiveTab.FINANCEIRO)}
          className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-pink-200 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer select-none"
          title="Clique para acessar o painel Financeiro e Fluxo de Caixa"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider font-sans uppercase">Faturamento</span>
            <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-2 space-y-1.5">
            <div>
              <span className="text-[9px] font-semibold text-slate-400">Bruto:</span>
              <h3 className="text-xs md:text-sm font-bold text-slate-600 tracking-tight">{formatCurrency(faturamentoTotal)}</h3>
            </div>
            <div className="border-t border-slate-50 pt-1.5">
              <span className="text-[9px] font-bold text-pink-500 uppercase">Líquido Receber:</span>
              <h3 className="text-base md:text-lg font-extrabold text-slate-800 tracking-tight">{formatCurrency(faturamentoLiquido)}</h3>
            </div>
          </div>
        </div>

        {/* VENDAS */}
        <div 
          onClick={() => setActiveTab(ActiveTab.VENDAS)}
          className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-blue-200 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer select-none"
          title="Clique para acessar o histórico de Vendas"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider font-sans uppercase">Vendas</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">{totalVendasConcluidas}</h3>
            {totalVendasConcluidas > 0 ? (
              <span className="text-[10px] font-medium text-green-500 flex items-center gap-1 mt-1">
                <TrendingUp size={10} /> +{totalVendasConcluidas} concluídas
              </span>
            ) : (
              <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mt-1">
                Nenhum pedido efetuado
              </span>
            )}
          </div>
        </div>

        {/* TICKET MEDIO */}
        <div 
          onClick={() => setActiveTab(ActiveTab.VENDAS)}
          className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-emerald-200 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer select-none"
          title="Clique para acessar o histórico de Vendas"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider font-sans uppercase">Ticket Médio</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Percent size={16} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">{formatCurrency(ticketMedio)}</h3>
            {totalVendasConcluidas > 0 ? (
              <span className="text-[10px] font-medium text-emerald-500 flex items-center gap-1 mt-1">
                <TrendingUp size={10} /> Baseado em vendas reais
              </span>
            ) : (
              <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mt-1">
                Sem ticket médio ainda
              </span>
            )}
          </div>
        </div>

        {/* CLIENTES */}
        <div 
          onClick={() => { setActiveTab(ActiveTab.CLIENTES); if (setCustomersCRMSubTab) setCustomersCRMSubTab('diretorio'); }}
          className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-purple-200 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer select-none"
          title="Clique para acessar o Fichário de Clientes (CRM)"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider font-sans uppercase">Clientes</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">{totalClients}</h3>
            {totalClients > 0 ? (
              <span className="text-[10px] font-medium text-violet-500 flex items-center gap-1 mt-1">
                <TrendingUp size={10} /> Clientes cadastrados
              </span>
            ) : (
              <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mt-1">
                Nenhum cliente ativo
              </span>
            )}
          </div>
        </div>

        {/* PRODUTOS / ESTOQUE */}
        <div 
          onClick={() => { setActiveTab(ActiveTab.PRODUTOS); if (setProductsSubTab) setProductsSubTab('inventario'); }}
          className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-orange-200 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer select-none"
          title="Clique para acessar o Controle de Estoque e Inventário"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider font-sans uppercase">Estoques</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
              <Package size={16} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">{totalStockItems}</h3>
            {products.length > 0 ? (
              <span className={`text-[10px] font-medium flex items-center gap-1 mt-1 ${lowStockCount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {lowStockCount > 0 ? `⚠ ${lowStockCount} em baixo estoque` : '✓ Estoque regularizado'}
              </span>
            ) : (
              <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mt-1">
                Sem produtos no catálogo
              </span>
            )}
          </div>
        </div>

        {/* NPS */}
        <div 
          onClick={() => { setActiveTab(ActiveTab.CLIENTES); if (setCustomersCRMSubTab) setCustomersCRMSubTab('fidelidade'); }}
          className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-amber-200 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer select-none"
          title="Clique para acessar o painel de Fidelidade e NPS"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider font-sans uppercase">NPS</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Star size={16} fill="currentColor" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
              {clients.filter(c => c.npsScore !== undefined).length > 0 ? dynamicNpsScore : 'N/A'}
            </h3>
            <span className="text-[10px] font-medium text-amber-600 flex items-center gap-1 mt-1">
              <TrendingUp size={10} /> {clients.filter(c => c.npsScore !== undefined).length} avaliações
            </span>
          </div>
        </div>
      </div>

      {/* Sales Goals Simulator Section */}
      <SalesGoalSimulator sales={sales} />

      {/* Main Charts & Analytics Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
        {/* Sales Daily Performance Chart (Left) */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-4 md:p-6 shadow-xs flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-50 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Desempenho Diário</h3>
              <p className="text-slate-400 text-xs">Acompanhamento do faturamento real consolidado por período</p>
            </div>
            {/* View filters */}
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100 select-none">
                <button 
                  type="button"
                  onClick={() => setTimeRange('7d')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${timeRange === '7d' ? 'bg-white text-slate-850 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  7d
                </button>
                <button 
                  type="button"
                  onClick={() => setTimeRange('14d')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${timeRange === '14d' ? 'bg-white text-slate-850 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  14d
                </button>
              </div>

              <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100 select-none">
                <button 
                  type="button"
                  onClick={() => setChartType('area')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${chartType === 'area' ? 'bg-white text-slate-850 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  Área
                </button>
                <button 
                  type="button"
                  onClick={() => setChartType('bar')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${chartType === 'bar' ? 'bg-white text-slate-850 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  Barras
                </button>
              </div>
            </div>
          </div>

          {/* Actual Recharts Element */}
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={dailyPerformanceData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EC4899" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(v) => `R$${v}`} tickLine={false} />
                  <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name === 'Faturamento' ? 'Faturamento' : name]} />
                  <Area type="monotone" dataKey="Faturamento" name="Faturamento" stroke="#EC4899" strokeWidth={2} fillOpacity={1} fill="url(#colorFaturamento)" />
                </AreaChart>
              ) : (
                <BarChart data={dailyPerformanceData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(v) => `R$${v}`} tickLine={false} />
                  <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name === 'Faturamento' ? 'Faturamento' : name]} />
                  <Bar dataKey="Faturamento" name="Faturamento" fill="#EC4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category & Channel Pie Chart (Right) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 md:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start border-b border-slate-50 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {pieMode === 'categoria' ? 'Distribuição por Categoria' : 'Vendas por Canal'}
              </h3>
              <p className="text-slate-400 text-xs">
                {pieMode === 'categoria' ? 'Faturamento por categoria de produto' : 'Desempenho por canal de venda'}
              </p>
            </div>
            
            {/* Toggle segment for category vs channel */}
            <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100 select-none">
              <button 
                type="button"
                onClick={() => setPieMode('categoria')}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${pieMode === 'categoria' ? 'bg-white text-slate-850 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
              >
                Categoria
              </button>
              <button 
                type="button"
                onClick={() => setPieMode('canal')}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${pieMode === 'canal' ? 'bg-white text-slate-850 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
              >
                Canal
              </button>
            </div>
          </div>

          <div className="relative h-44 mt-3 w-full">
            {(pieMode === 'categoria' ? categorySalesData : donutData).length === 0 ? (
              <div className="text-center p-4 flex flex-col items-center justify-center h-full">
                <p className="text-slate-400 text-xs font-medium">Nenhuma venda registrada</p>
                <p className="text-[10px] text-slate-400/80 mt-1">Realize vendas no PDV ou no catálogo para alimentar este gráfico.</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieMode === 'categoria' ? categorySalesData : donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {(pieMode === 'categoria' ? categorySalesData : donutData).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [
                      `${formatCurrency(Number(value))} (${props.payload.count || 0} pçs)`, 
                      'Faturamento'
                    ]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                  <span className="text-[9px] font-sans text-slate-400 font-bold uppercase tracking-wider">Total Filtrado</span>
                  <span className="text-xs font-bold text-slate-700 font-mono">
                    {formatCurrency(
                      (pieMode === 'categoria' ? categorySalesData : donutData).reduce((sum, item) => sum + item.value, 0)
                    )}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Animated labels */}
          <div className="grid grid-cols-2 gap-2 mt-4 text-[10.5px] font-medium text-slate-500 font-sans max-h-24 overflow-y-auto pr-1">
            {(pieMode === 'categoria' ? categorySalesData : donutData).map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 truncate border-b border-dashed border-slate-50 pb-0.5" title={item.name}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate text-slate-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sales List & Best Sellers Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent sales */}
        <div className="xl:col-span-2 bg-white border border-slate-100 rounded-2xl p-4 md:p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Vendas Recentes</h3>
              <p className="text-slate-400 text-xs">Histórico das últimas operações efetuadas nos diversos canais</p>
            </div>
            <button 
              onClick={() => setActiveTab(ActiveTab.PDV)} 
              className="text-pink-600 hover:text-pink-700 font-bold text-[11px] flex items-center gap-1 transition-colors"
            >
              Ir para PDV →
            </button>
          </div>

          {/* List items */}
          <div className="divide-y divide-slate-50 mt-4">
            {sales.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-sans">Nenhuma venda registrada ainda. Use o PDV para registrar!</div>
            ) : (
              sales.slice(0, 5).map((sale) => (
                <div 
                  key={sale.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs font-sans hover:bg-slate-50/50 p-2 rounded-lg transition-colors cursor-pointer"
                  onClick={() => setSelectedSaleDetail(sale)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                      {sale.clientName.split(' ')[0][0] || 'C'}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <span>{sale.clientName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1 font-sans">
                          {getChannelIcon(sale.channel)}
                          {sale.channel}
                        </span>
                        {sale.salesperson && (
                          <>
                            <span>•</span>
                            <span className="bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded font-sans font-semibold">
                              👩‍💼 {sale.salesperson}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>{sale.id.toUpperCase()}</span>
                        <span>•</span>
                        <Clock size={10} />
                        <span>{new Date(sale.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-slate-850 font-mono">{formatCurrency(sale.total)}</div>
                    <span className={`inline-block text-[9px] font-bold font-sans px-1.5 py-0.5 rounded-full mt-1
                      ${sale.status === 'Concluída' 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : sale.status === 'Pendente'
                          ? 'bg-amber-50 text-amber-600 border border-amber-100'
                          : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                      {sale.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Best sellers */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 md:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Mais Vendidos</h3>
            <p className="text-slate-400 text-xs">Modelos fitness femininos de maior sucesso comercial</p>
          </div>

          <div className="space-y-4 mt-6 flex-1">
            {bestSellingProducts.map((prod, idx) => (
              <div 
                key={prod.id} 
                onClick={() => { setActiveTab(ActiveTab.PRODUTOS); if (setProductsSubTab) setProductsSubTab('inventario'); }}
                className="flex items-center gap-3 border-b border-slate-50 pb-3 last:border-0 last:pb-0 hover:bg-slate-50/70 p-1.5 rounded-xl cursor-pointer select-none transition-all"
                title="Clique para visualizar no catálogo de produtos"
              >
                <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 shrink-0">
                  <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute top-0 left-0 bg-slate-900/70 text-white font-mono text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-br-lg">
                    {idx + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-xs text-slate-700 truncate leading-tight">{prod.name}</h4>
                  <span className="text-[10px] text-slate-400 mt-0.5 inline-block font-sans">{prod.category}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-pink-600 font-bold font-mono text-xs">{formatCurrency(prod.price)}</span>
                    <span className="text-slate-300 font-sans">•</span>
                    <span className="text-slate-400 text-[10px] font-sans font-medium">{prod.salesCount} vendidos</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Alerta de Reposição - Estoque Crítico */}
          {criticalStockVariations.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-red-600 mb-3">
                <AlertTriangle size={15} className="animate-pulse shrink-0" />
                <span className="font-extrabold text-[10.5px] uppercase tracking-wider font-sans">
                  Estoque Crítico / Reposição ({criticalStockVariations.length})
                </span>
              </div>
              <div 
                onClick={() => { setActiveTab(ActiveTab.PRODUTOS); if (setProductsSubTab) setProductsSubTab('restoque'); }}
                className="bg-red-50/50 border border-red-100 rounded-xl p-3 space-y-2.5 max-h-48 overflow-y-auto text-left cursor-pointer hover:bg-red-50/80 active:scale-[0.99] transition-all"
                title="Clique para ir à tela de reposição de estoque crítico"
              >
                {criticalStockVariations.map((v, i) => (
                  <div key={`critical-${i}`} className="flex justify-between items-start text-[10px] leading-tight font-sans">
                    <div className="min-w-0 pr-2">
                      <p className="font-extrabold text-slate-800 truncate">{v.productName}</p>
                      <p className="text-slate-500 font-semibold text-[9px] mt-0.5">
                        Tamanho: <span className="text-slate-700 font-bold">{v.size}</span> • Cor: <span className="text-slate-700 font-bold">{v.color}</span>
                      </p>
                    </div>
                    <span className="bg-red-100 text-red-700 font-bold font-mono text-[9px] px-2 py-0.5 rounded-full shrink-0">
                      {v.stock} un
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button 
            onClick={() => setActiveTab(ActiveTab.PRODUTOS)}
            className="w-full py-2.5 mt-4 text-[11px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl transition-all cursor-pointer text-center"
          >
            Ver Catálogo Inteiro
          </button>
        </div>
      </div>

      {/* Sale Detail Receipt Modal */}
      {selectedSaleDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden" id="receipt-modal">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-pink-500 flex items-center justify-center font-bold text-xs text-white">AP</div>
                <span className="font-sans font-bold text-xs tracking-wider">Recibo Digital AP Moda Fitness</span>
              </div>
              <button 
                onClick={() => setSelectedSaleDetail(null)}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                ✕
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="text-center pb-4 border-b border-dashed border-slate-200">
                <span className="text-slate-400 text-xs font-mono">ID DA COMPRA: {selectedSaleDetail.id.toUpperCase()}</span>
                <h4 className="text-xl font-bold mt-1 text-slate-800">{formatCurrency(selectedSaleDetail.total)}</h4>
                <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full mt-2 font-mono">
                  {getChannelIcon(selectedSaleDetail.channel)}
                  <span>Venda via {selectedSaleDetail.channel}</span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-1.5 text-xs font-sans">
                <h5 className="font-bold text-[10px] text-slate-450 uppercase tracking-widest font-mono">Cliente</h5>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nome:</span>
                  <span className="font-semibold text-slate-700">{selectedSaleDetail.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Data/Hora:</span>
                  <span className="text-slate-700 font-mono">{new Date(selectedSaleDetail.createdAt).toLocaleString('pt-BR')}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h5 className="font-bold text-[10px] text-slate-450 uppercase tracking-widest font-mono select-none">Produtos Adquiridos</h5>
                <div className="divide-y divide-slate-100 max-h-44 overflow-y-auto pr-1">
                  {selectedSaleDetail.items.map((item, index) => (
                    <div key={index} className="py-2.5 flex justify-between text-xs font-sans">
                      <div>
                        <p className="font-medium text-slate-700 leading-tight">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">Qtde: {item.quantity} x {formatCurrency(item.price)}</p>
                      </div>
                      <span className="font-bold font-mono text-slate-800">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculations Block */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1.5 text-xs font-sans font-mono mt-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Status do Pedido:</span>
                  <span className={`font-bold ${selectedSaleDetail.status === 'Concluída' ? 'text-green-600' : 'text-amber-600'}`}>
                    {selectedSaleDetail.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-150 pt-1.5">
                  <span className="text-slate-500 font-bold">Subtotal:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(selectedSaleDetail.total)}</span>
                </div>
              </div>

              {/* Payment Combination Detail */}
              {selectedSaleDetail.payments && selectedSaleDetail.payments.length > 0 && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2 text-xs font-sans mt-2">
                  <h5 className="font-bold text-[9px] text-slate-400 uppercase tracking-widest font-mono">Formas de Pagamento Combinadas</h5>
                  <div className="space-y-1 divide-y divide-slate-100/35">
                    {selectedSaleDetail.payments.map((p, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-650 font-sans pt-1 first:pt-0">
                        <span>{p.method}</span>
                        <span className="font-bold font-mono text-slate-800">{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Print or Close Details */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button 
                type="button"
                onClick={() => setIsThermalReceiptOpen(true)}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center font-sans flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/5 active:scale-97"
              >
                <Printer size={13} />
                <span>Imprimir Cupom / PDF</span>
              </button>
              <button 
                type="button"
                onClick={() => setSelectedSaleDetail(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 rounded-xl text-slate-700 text-xs font-bold transition-all cursor-pointer text-center font-sans"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Thermal Receipt Modal popup */}
      {isThermalReceiptOpen && selectedSaleDetail && (
        <ThermalReceipt 
          sale={selectedSaleDetail} 
          onClose={() => {
            setIsThermalReceiptOpen(false);
          }}
        />
      )}
    </div>
  );
}
