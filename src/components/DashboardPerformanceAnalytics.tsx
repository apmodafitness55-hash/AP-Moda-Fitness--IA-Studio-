/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Eye, 
  BarChart3, 
  RefreshCw, 
  Search, 
  ArrowUpRight,
  Flame,
  Activity,
  Ruler
} from 'lucide-react';
import { Product, Sale, Client } from '../types';

interface CheckoutItem {
  productName: string;
  productId: string;
  quantity: number;
  price: number;
  color?: string;
  size?: string;
}

interface Checkout {
  id: string;
  clientName: string;
  phone: string;
  email: string;
  items: CheckoutItem[];
  total: number;
  status: 'pendente' | 'concluido' | 'recuperado';
  createdAt: string;
  updatedAt: string;
}

interface DashboardPerformanceAnalyticsProps {
  products: Product[];
  sales: Sale[];
  clients: Client[];
  checkouts?: Checkout[];
}

export default function DashboardPerformanceAnalytics({ 
  products = [], 
  sales = [], 
  clients = [],
  checkouts = []
}: DashboardPerformanceAnalyticsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activePeriod, setActivePeriod] = useState<'7d' | '30d' | 'total'>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Helper to format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // 1. Faturamento Bruto Real (Apenas faturamento de pedidos reais concluídos no banco Supabase)
  const totalRevenue = useMemo(() => {
    return sales
      .filter(s => s.status === 'Concluída')
      .reduce((sum, s) => sum + s.total, 0);
  }, [sales]);

  // Total de pedidos concluídos reais
  const salesCount = useMemo(() => {
    return sales.filter(s => s.status === 'Concluída').length;
  }, [sales]);

  // 2. Carrinhos Convertidos vs. Abandonados Reais do Supabase / localStorage
  const localCheckouts: Checkout[] = useMemo(() => {
    if (checkouts && checkouts.length > 0) return checkouts;
    try {
      const saved = localStorage.getItem('ap_moda_checkouts');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn(e);
    }
    return [];
  }, [checkouts]);

  const checkoutStats = useMemo(() => {
    const converted = localCheckouts.filter(c => c.status === 'concluido' || c.status === 'recuperado').length;
    const pending = localCheckouts.filter(c => c.status === 'pendente').length;

    const total = converted + pending;
    const efficiencyRate = total > 0 ? (converted / total) * 100 : 0;

    return {
      converted,
      pending,
      total,
      efficiencyRate
    };
  }, [localCheckouts]);

  // 3. Uso Real do Provador Virtual (Iniciado em 0 por padrão, sem baseline fictício)
  const provadorUses = useMemo(() => {
    try {
      const count = localStorage.getItem('ap_provador_uses');
      if (count) {
        return parseInt(count, 10);
      }
    } catch (e) {
      console.warn(e);
    }
    return 0;
  }, [isRefreshing]);

  // 4. Ranking de Produtos Mais Desejados por cliques/acessos da Vitrine Pública e vendas reais
  const desiredProducts = useMemo(() => {
    let clickMap: Record<string, number> = {};
    try {
      const saved = localStorage.getItem('ap_product_clicks_map');
      if (saved) {
        clickMap = JSON.parse(saved);
      }
    } catch (e) {
      console.warn(e);
    }

    const salesCountMap: Record<string, number> = {};
    sales
      .filter(s => s.status === 'Concluída')
      .forEach(s => {
        if (s.items && Array.isArray(s.items)) {
          s.items.forEach(item => {
            if (item.productId) {
              salesCountMap[item.productId] = (salesCountMap[item.productId] || 0) + (item.quantity || 1);
            }
          });
        }
      });

    const mapped = products.map((prod) => {
      const trackedClicks = clickMap[prod.id] || 0;
      const soldQty = salesCountMap[prod.id] || 0;
      const totalClicks = trackedClicks + soldQty;

      return {
        ...prod,
        interactions: totalClicks,
        realClicks: trackedClicks,
        realSales: soldQty
      };
    });

    return mapped.sort((a, b) => b.interactions - a.interactions);
  }, [products, sales, isRefreshing]);

  // Dynamic growth rate calculation comparing last 30 days to the 30 days before that
  const growthRate = useMemo(() => {
    const completedSales = sales.filter(s => s.status === 'Concluída');
    if (completedSales.length === 0) {
      return { percent: 0, text: 'Sem movimentação recente' };
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const salesThisMonth = completedSales.filter(s => {
      const d = new Date(s.createdAt);
      return d >= thirtyDaysAgo && d <= now;
    });

    const salesLastMonth = completedSales.filter(s => {
      const d = new Date(s.createdAt);
      return d >= sixtyDaysAgo && d < thirtyDaysAgo;
    });

    const revenueThisMonth = salesThisMonth.reduce((sum, s) => sum + s.total, 0);
    const revenueLastMonth = salesLastMonth.reduce((sum, s) => sum + s.total, 0);

    if (revenueLastMonth === 0) {
      if (revenueThisMonth > 0) {
        return { percent: 100, text: 'Crescimento inicial registrado' };
      }
      return { percent: 0, text: 'Sem dados comparativos anteriores' };
    }

    const diff = ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100;
    return { percent: diff, text: 'em relação ao período anterior' };
  }, [sales]);

  // Filter products in the ranking if search term is used
  const filteredRanking = useMemo(() => {
    return desiredProducts.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [desiredProducts, searchTerm]);

  // Top 3 most clicked products for the absolute highlights panel
  const topThree = useMemo(() => {
    return desiredProducts.slice(0, 3);
  }, [desiredProducts]);

  return (
    <div className="space-y-6 text-left" id="performance-analytics-dashboard">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="text-pink-600" size={24} />
            <span>Dashboard de Desempenho (Analytics)</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Inteligência de dados e métricas de conversão da loja em tempo real.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActivePeriod('7d')}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all border-none cursor-pointer ${
                activePeriod === '7d' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 bg-transparent'
              }`}
            >
              7 Dias
            </button>
            <button
              onClick={() => setActivePeriod('30d')}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all border-none cursor-pointer ${
                activePeriod === '30d' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 bg-transparent'
              }`}
            >
              30 Dias
            </button>
            <button
              onClick={() => setActivePeriod('total')}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all border-none cursor-pointer ${
                activePeriod === 'total' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 bg-transparent'
              }`}
            >
              Histórico
            </button>
          </div>

          <button
            onClick={() => {
              setIsRefreshing(true);
              setTimeout(() => setIsRefreshing(false), 500);
            }}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
            title="Sincronizar Métricas"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* METRIC CARDS (Minimal & Spaced) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: FATURAMENTO BRUTO */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col justify-between min-h-[160px] relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-pink-500/15 transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">Faturamento Bruto</span>
            <div className="w-8 h-8 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              {formatCurrency(totalRevenue)}
            </h3>
            <p className="text-slate-400 text-[10px] mt-1.5 flex items-center gap-1">
              {growthRate.percent !== 0 && (
                <span className={`font-bold flex items-center ${growthRate.percent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <ArrowUpRight size={12} className={growthRate.percent < 0 ? 'rotate-90' : ''} />
                  {growthRate.percent >= 0 ? '+' : ''}{growthRate.percent.toFixed(1)}%
                </span>
              )}
              <span>{growthRate.text} ({salesCount} {salesCount === 1 ? 'pedido' : 'pedidos'})</span>
            </p>
          </div>
        </div>

        {/* CARD 2: CARRINHOS CONVERTIDOS VS ABANDONADOS */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col justify-between min-h-[160px] relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/15 transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">Taxa de Conversão de Carrinhos</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Activity size={16} />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-400">
                {checkoutStats.efficiencyRate.toFixed(1)}%
              </h3>
              <span className="text-xs font-semibold text-slate-400">de eficiência</span>
            </div>
            
            {/* Split indicator visual */}
            <div className="mt-3 space-y-1.5">
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                {checkoutStats.total > 0 ? (
                  <>
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500" 
                      style={{ width: `${checkoutStats.efficiencyRate}%` }} 
                      title={`Convertidos: ${checkoutStats.converted}`}
                    />
                    <div 
                      className="bg-rose-500 h-full transition-all duration-500" 
                      style={{ width: `${100 - checkoutStats.efficiencyRate}%` }} 
                      title={`Abandonados: ${checkoutStats.pending}`}
                    />
                  </>
                ) : (
                  <div className="bg-slate-800 w-full h-full" title="Sem dados de carrinho" />
                )}
              </div>
              <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {checkoutStats.converted} Convertidos
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {checkoutStats.pending} Abandonados
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: USO DO PROVADOR VIRTUAL */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col justify-between min-h-[160px] relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/15 transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">Uso do Provador Virtual</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Ruler size={16} />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-indigo-400">
                {provadorUses} <span className="text-xs text-slate-400 font-bold uppercase font-sans">{provadorUses === 1 ? 'Simulação' : 'Simulações'}</span>
              </h3>
            </div>
            <p className="text-slate-400 text-[10px] mt-2 flex items-center gap-1">
              <span>Precisão calibrada por tabelas de biotipos da vitrine</span>
            </p>
          </div>
        </div>
      </div>

      {/* TOP 3 CAMPEÕES VISUAL HIGHLIGHTS */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-xl" id="top-desejados-highlights">
        <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest flex items-center gap-2 mb-5">
          <Flame size={14} className="text-orange-500 animate-pulse" />
          <span>Destaques: Líderes de Acesso e Venda</span>
        </h3>
        
        {topThree.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs font-medium">
            Nenhum produto cadastrado para classificar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topThree.map((prod, idx) => {
              const placeColors = [
                'from-yellow-500/25 to-transparent border-yellow-500/30',
                'from-slate-300/20 to-transparent border-slate-300/20',
                'from-amber-600/25 to-transparent border-amber-600/30'
              ];
              const badgeTexts = ['🥇 1º Lugar', '🥈 2º Lugar', '🥉 3º Lugar'];

              return (
                <div 
                  key={prod.id} 
                  className={`bg-gradient-to-b ${placeColors[idx] || 'from-slate-800/10 to-transparent border-slate-800'} border p-4 rounded-xl flex items-center gap-4 transition-all duration-300 hover:scale-[1.01]`}
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-800 border border-slate-700 relative">
                    <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <span className="absolute top-0 left-0 bg-slate-950/80 text-white font-mono text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-br">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="leading-snug text-left min-w-0">
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">
                      {badgeTexts[idx]}
                    </span>
                    <p className="font-extrabold text-[11px] truncate text-white">{prod.name}</p>
                    <p className="text-[10px] text-pink-500 font-bold font-mono mt-0.5 flex items-center gap-1">
                      <Eye size={10} />
                      <span>{prod.interactions} {prod.interactions === 1 ? 'ponto' : 'pontos'} de interesse</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAILED RANKING TABLE */}
      <div className="bg-slate-950 border border-slate-800 text-white rounded-2xl p-6 shadow-xl" id="desired-products-ranking-list">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
              <BarChart3 size={15} className="text-pink-500" />
              <span>Ranking de Produtos Mais Desejados</span>
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Interações orgânicas e vendas reais processadas pela plataforma.
            </p>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Buscar no ranking..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-pink-500 transition-all w-full sm:w-64"
            />
          </div>
        </div>

        {/* Dynamic List */}
        <div className="overflow-x-auto mt-4">
          {filteredRanking.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Nenhum produto cadastrado no catálogo.
            </div>
          ) : (
            <table className="w-full text-xs text-left text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[9px] font-bold select-none">
                  <th className="pb-3 pl-2 text-center w-16">Posição</th>
                  <th className="pb-3">Produto</th>
                  <th className="pb-3">Categoria</th>
                  <th className="pb-3">Preço</th>
                  <th className="pb-3 text-center">Cliques / Visualizações</th>
                  <th className="pb-3 text-right pr-6">Unidades Vendidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredRanking.map((prod) => {
                  const placeIndex = desiredProducts.findIndex(p => p.id === prod.id) + 1;
                  return (
                    <tr key={prod.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 pl-2 font-mono font-black text-slate-400 text-center w-16">
                        {placeIndex === 1 ? (
                          <span className="text-yellow-500 text-sm font-bold">🥇</span>
                        ) : placeIndex === 2 ? (
                          <span className="text-slate-300 text-sm font-bold">🥈</span>
                        ) : placeIndex === 3 ? (
                          <span className="text-amber-600 text-sm font-bold">🥉</span>
                        ) : (
                          <span>#{placeIndex}</span>
                        )}
                      </td>
                      <td className="py-3.5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-800 bg-slate-900">
                          <img referrerPolicy="no-referrer" src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="leading-snug min-w-0">
                          <p className="font-extrabold text-white truncate max-w-[200px] sm:max-w-[300px]">{prod.name}</p>
                          <p className="text-[9px] text-slate-500 font-mono font-bold">SKU: {prod.sku}</p>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className="bg-slate-900 border border-slate-800 text-slate-400 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                          {prod.category}
                        </span>
                      </td>
                      <td className="py-3.5 font-mono font-black text-pink-500">
                        {formatCurrency(prod.price)}
                      </td>
                      <td className="py-3.5 text-center font-mono font-bold text-white">
                        {prod.realClicks} cliques
                      </td>
                      <td className="py-3.5 text-right pr-6 font-mono font-black text-emerald-400">
                        {prod.realSales} un.
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
