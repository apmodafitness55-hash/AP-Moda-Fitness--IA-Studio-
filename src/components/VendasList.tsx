/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  User, 
  ShoppingBag, 
  Printer, 
  XSquare, 
  Download, 
  FileText, 
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { Sale, Product, Transaction } from '../types';
import ThermalReceipt from './ThermalReceipt';

interface VendasListProps {
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setActiveTab: (tab: any) => void;
  onAddTransaction?: (tx: Transaction) => void;
  onDeleteSale?: (saleId: string) => void;
}

export default function VendasList({ 
  sales, 
  setSales, 
  products, 
  setProducts, 
  setActiveTab, 
  onAddTransaction,
  onDeleteSale
}: VendasListProps) {
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>('all');
  const [selectedPayMethod, setSelectedPayMethod] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Selected sale for receipt rendering
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [selectedSaleForInvoice, setSelectedSaleForInvoice] = useState<Sale | null>(null);

  // List of salespeople dynamically extracted from sales
  const salespeople = useMemo(() => {
    const list = new Set<string>();
    sales.forEach(s => {
      if (s.salesperson) list.add(s.salesperson);
    });
    return Array.from(list);
  }, [sales]);

  // Payment methods dynamically extracted
  const paymentMethods = useMemo(() => {
    const list = new Set<string>();
    sales.forEach(s => {
      if (s.payments) {
        s.payments.forEach(p => list.add(p.method));
      }
    });
    return Array.from(list);
  }, [sales]);

  // Handle Cancel Sale
  const handleCancelSale = (saleId: string) => {
    const targetSale = sales.find(s => s.id === saleId);
    if (!targetSale) return;

    if (targetSale.status === 'Cancelada') {
      alert('Esta venda já está cancelada.');
      return;
    }

    if (confirm(`Tem certeza que deseja cancelar a venda #${saleId.toUpperCase()} de ${targetSale.clientName}? Isso retornará os produtos para o estoque e atualizará o caixa.`)) {
      // 1. Revert sale status
      setSales(prev => prev.map(s => {
        if (s.id === saleId) {
          return { ...s, status: 'Cancelada' as const };
        }
        return s;
      }));

      // 2. Put products back to stock
      setProducts(prevProducts => {
        return prevProducts.map(prod => {
          const itemSold = targetSale.items.find(it => it.productId === prod.id);
          if (itemSold) {
            return {
              ...prod,
              stock: prod.stock + itemSold.quantity,
              salesCount: Math.max(0, prod.salesCount - itemSold.quantity)
            };
          }
          return prod;
        });
      });

      // 3. Revert transactions (registering an outflow)
      const refundTx: Transaction = {
        id: `t-refund-${Date.now()}`,
        type: 'Outflow',
        category: 'Venda Cancelada',
        description: `Estorno de venda #${saleId.toUpperCase()} - Cliente ${targetSale.clientName}`,
        amount: targetSale.total,
        date: new Date().toISOString()
      };

      if (onAddTransaction) {
        onAddTransaction(refundTx);
      } else {
        const cachedTxsStr = localStorage.getItem('ap_moda_transactions');
        if (cachedTxsStr) {
          try {
            const txs = JSON.parse(cachedTxsStr);
            localStorage.setItem('ap_moda_transactions', JSON.stringify([refundTx, ...txs]));
            // Dispatch custom event to sync parent state if needed
            window.dispatchEvent(new Event('storage'));
          } catch (e) {
            console.error(e);
          }
        }
      }

      alert('Venda cancelada e armazenada como "Cancelada". O estoque físico correspondente foi retornado para o inventário!');
    }
  };

  // Handle Permanent Delete Sale
  const handleDeleteSaleClick = (saleId: string) => {
    const targetSale = sales.find(s => s.id === saleId);
    if (!targetSale) return;

    if (!confirm(`ATENÇÃO: Tem certeza absoluta que deseja APAGAR permanentemente a venda #${saleId.toUpperCase()} de ${targetSale.clientName} do histórico?\n\nEsta ação não poderá ser desfeita e removerá o registro completamente!`)) {
      return;
    }

    // Se a venda for concluída, perguntar sobre o estoque
    if (targetSale.status === 'Concluída') {
      const returnStock = confirm(`Deseja também retornar os produtos desta venda (${targetSale.items.length} itens) ao estoque físico antes de apagá-la do histórico?\n\n[OK] Sim, devolver itens ao estoque e apagar venda.\n[Cancelar] Não, apenas apagar a venda sem alterar o estoque.`);
      if (returnStock) {
        setProducts(prevProducts => {
          return prevProducts.map(prod => {
            const itemSold = targetSale.items.find(it => it.productId === prod.id);
            if (itemSold) {
              return {
                ...prod,
                stock: prod.stock + itemSold.quantity,
                salesCount: Math.max(0, prod.salesCount - itemSold.quantity)
              };
            }
            return prod;
          });
        });
      }
    }

    // Remover a venda do estado
    if (onDeleteSale) {
      onDeleteSale(saleId);
    } else {
      setSales(prev => prev.filter(s => s.id !== saleId));
    }

    alert('Venda apagada com sucesso do histórico!');
  };

  // KPI Calculations
  const metrics = useMemo(() => {
    const activeSales = sales.filter(s => s.status === 'Concluída');
    const totalBilled = activeSales.reduce((sum, s) => sum + s.total, 0);
    const totalCost = activeSales.reduce((sum, s) => sum + (s.costTotal || 0), 0);
    const averageTicket = activeSales.length > 0 ? totalBilled / activeSales.length : 0;
    
    // Commission ranking
    const commissionBySeller: { [name: string]: number } = {};
    const rateSaved = localStorage.getItem('ap_commission_rate');
    const commissionRate = rateSaved ? parseFloat(rateSaved) / 100 : 0.05;

    activeSales.forEach(s => {
      if (s.salesperson) {
        const commission = s.total * commissionRate;
        commissionBySeller[s.salesperson] = (commissionBySeller[s.salesperson] || 0) + commission;
      }
    });

    return {
      totalBilled,
      netProfit: totalBilled - totalCost,
      averageTicket,
      totalSalesCount: activeSales.length,
      canceledCount: sales.filter(s => s.status === 'Cancelada').length,
      commissionBySeller
    };
  }, [sales]);

  // Main filter function
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Search Box matching
      const query = searchTerm.toLowerCase();
      const matchesSearch = 
        sale.id.toLowerCase().includes(query) ||
        sale.clientName.toLowerCase().includes(query) ||
        (sale.salesperson && sale.salesperson.toLowerCase().includes(query)) ||
        sale.items.some(it => it.name.toLowerCase().includes(query));

      // Channel matching
      const matchesChannel = selectedChannel === 'all' || sale.channel === selectedChannel;
      
      // Status matching
      const matchesStatus = selectedStatus === 'all' || sale.status === selectedStatus;

      // Salesperson matching
      const matchesSeller = selectedSalesperson === 'all' || sale.salesperson === selectedSalesperson;

      // Payment Method matching
      const matchesPayMethod = selectedPayMethod === 'all' || (sale.payments && sale.payments.some(p => p.method === selectedPayMethod));

      // Date range matching
      const saleDate = new Date(sale.createdAt);
      const matchesStartDate = !startDate || saleDate >= new Date(startDate + 'T00:00:00');
      const matchesEndDate = !endDate || saleDate <= new Date(endDate + 'T23:59:59');

      return matchesSearch && matchesChannel && matchesStatus && matchesSeller && matchesPayMethod && matchesStartDate && matchesEndDate;
    });
  }, [sales, searchTerm, selectedChannel, selectedStatus, selectedSalesperson, selectedPayMethod, startDate, endDate]);

  const handleExportCSV = () => {
    try {
      const headers = ['ID Venda', 'Data', 'Cliente', 'Canal Venda', 'Vendedor', 'Itens Quantidade', 'Total Pago', 'Status'];
      const rows = filteredSales.map(s => [
        s.id.toUpperCase(),
        new Date(s.createdAt).toLocaleDateString(),
        s.clientName,
        s.channel,
        s.salesperson || 'Nenhum',
        s.items.reduce((sum, item) => sum + item.quantity, 0),
        s.total,
        s.status
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `relatorio_vendas_apmoda_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert('Não foi possível exportar os dados neste navegador.');
    }
  };

  return (
    <div className="space-y-6" id="sales-management-tab">
      {/* Tab Header & Quick buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-sans text-slate-800 tracking-tight">Painel Completo de Vendas</h2>
          <p className="text-slate-400 text-sm">Histórico completo de transações do PDV, Loja Online e WhatsApp. Monitore faturamento e emita cupons</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Download size={14} />
            <span>Exportar Lançamentos</span>
          </button>
          
          <button
            onClick={() => setActiveTab('PDV')}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-pink-500/15 cursor-pointer active:scale-95"
          >
            <ShoppingBag size={14} />
            <span>Registrar Nova Venda</span>
          </button>
        </div>
      </div>

      {/* KPI Overviews Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 bg-pink-50 rounded-xl text-pink-600 flex items-center justify-center shrink-0">
            <DollarSign size={22} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-450 block tracking-wide">Faturamento Líquido</span>
            <p className="text-lg font-black text-slate-800 mt-0.5 truncate">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalBilled)}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold mt-1">
              <TrendingUp size={11} />
              <span>Valores reais excluindo cancelados</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 bg-emerald-50 rounded-xl text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp size={22} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-450 block tracking-wide">Lucro Estimado</span>
            <p className="text-lg font-black text-slate-800 mt-0.5 truncate">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.netProfit)}
            </p>
            <span className="text-[10px] text-slate-400 block mt-1">Faturamento (-) custos de compra</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 bg-blue-50 rounded-xl text-blue-600 flex items-center justify-center shrink-0">
            <FileText size={22} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-450 block tracking-wide">Ticket Médio por Pedido</span>
            <p className="text-lg font-black text-slate-800 mt-0.5 truncate">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.averageTicket)}
            </p>
            <span className="text-[10px] text-slate-400 block mt-1">Em {metrics.totalSalesCount} pedidos faturados</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 bg-slate-100 rounded-xl text-slate-600 flex items-center justify-center shrink-0">
            <XSquare size={22} className="text-rose-500" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-450 block tracking-wide">Pedidos Cancelados</span>
            <p className="text-lg font-black text-slate-800 mt-0.5 truncate">
              {metrics.canceledCount} <span className="text-slate-400 text-xs font-medium">unidades</span>
            </p>
            <span className="text-[10px] text-slate-400 block mt-1">Estornos e devoluções registradas</span>
          </div>
        </div>
      </div>

      {/* Salesperson Comissions and rankings banner */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 text-white flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-xl">
        <div className="space-y-1">
          <span className="bg-pink-600 text-white font-bold text-[9px] uppercase font-sans tracking-widest px-2 py-0.5 rounded-full inline-block">
            Comissões de Vendedoras ({(parseFloat(localStorage.getItem('ap_commission_rate') || '5')).toFixed(1)}% Padrão)
          </span>
          <h3 className="text-sm font-bold tracking-tight">Ranking & Comissão do Mês</h3>
          <p className="text-[11px] text-slate-400">Prêmios parciais acumulados com base nas metas e vendas de balcão concluídas</p>
        </div>

        <div className="flex flex-wrap gap-4.5 w-full lg:w-auto">
          {Object.keys(metrics.commissionBySeller).length === 0 ? (
            <span className="text-slate-500 text-xs italic">Nenhuma venda de vendedora registrada este mês.</span>
          ) : (
            Object.entries(metrics.commissionBySeller).map(([seller, value]) => (
              <div key={seller} className="bg-slate-800/80 border border-slate-700/50 p-2.5 px-4 rounded-xl text-xs flex items-center gap-3">
                <div className="w-7 h-7 bg-pink-100/10 rounded-full flex items-center justify-center text-pink-400 text-[10px] font-bold">
                  {seller.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-100">{seller}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Comissão: <strong className="font-mono text-pink-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number)}</strong></p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Filter controls box */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-xs space-y-4">
        <h3 className="text-xs font-bold font-sans uppercase text-slate-600 tracking-wider flex items-center gap-2">
          <Filter size={13} className="text-pink-600" />
          <span>Filtros Avançados de Pesquisa</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-sans">
          
          {/* Search Input */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={13} />
            </span>
            <input
              type="text"
              placeholder="Buscar por ID, cliente, peça ou vendedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs placeholder-slate-400 text-slate-700 focus:outline-hidden focus:border-pink-500 focus:bg-white transition-all"
            />
          </div>

          {/* Sales Channel filter */}
          <div>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-150 rounded-xl p-2 font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="all">-- Todos Canais de Venda --</option>
              <option value="Instagram">Instagram</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="E-commerce">E-commerce</option>
              <option value="Loja Física">Loja Física</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-150 rounded-xl p-2 font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="all">-- Status da Venda --</option>
              <option value="Concluída">Concluídas</option>
              <option value="Pendente">Pendentes</option>
              <option value="Cancelada">Canceladas</option>
            </select>
          </div>

          {/* Salesperson filter */}
          <div>
            <select
              value={selectedSalesperson}
              onChange={(e) => setSelectedSalesperson(e.target.value)}
              className="w-full bg-slate-50 border border-slate-150 rounded-xl p-2 font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="all">-- Filtrar por Vendedor --</option>
              {salespeople.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date and Payment method row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-sans">
          
          {/* Payment Method filter */}
          <div>
            <select
              value={selectedPayMethod}
              onChange={(e) => setSelectedPayMethod(e.target.value)}
              className="w-full bg-slate-50 border border-slate-150 rounded-xl p-2 font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="all">-- Filtrar Forma de Pagamento --</option>
              {paymentMethods.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 shrink-0 font-bold text-[10px] uppercase">De:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-150 rounded-xl p-1.5 font-medium text-slate-700 focus:outline-hidden"
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 shrink-0 font-bold text-[10px] uppercase">Até:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-150 rounded-xl p-1.5 font-medium text-slate-700 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Filters clearing button */}
        {(searchTerm || selectedChannel !== 'all' || selectedStatus !== 'all' || selectedSalesperson !== 'all' || selectedPayMethod !== 'all' || startDate || endDate) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedChannel('all');
                setSelectedStatus('all');
                setSelectedSalesperson('all');
                setSelectedPayMethod('all');
                setStartDate('');
                setEndDate('');
              }}
              className="text-[11px] text-pink-600 hover:text-pink-700 font-bold transition-all"
            >
              × Limpar filtros selecionados
            </button>
          </div>
        )}
      </div>

      {/* Table of sales database */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase font-sans text-slate-500 tracking-wider">Lançamentos de Vendas Filtrados ({filteredSales.length})</h3>
          <span className="text-[10px] text-slate-450">Listagem atualizada com persistência em tempo real</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wider select-none">
                <th className="p-3">ID Venda</th>
                <th className="p-3">Data</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Canal</th>
                <th className="p-3">Vendedor</th>
                <th className="p-3">Itens Comprados</th>
                <th className="p-3">Total Pago</th>
                <th className="p-3">Formas Pgto</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-150/40 text-slate-700">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 italic">
                    Nenhuma venda encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* ID Venda */}
                    <td className="p-3">
                      <span className="font-bold text-slate-800 bg-slate-100 p-1 px-1.5 rounded-md font-mono text-[10px] uppercase">
                        {sale.id.replace('v-', '').toUpperCase()}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="p-3 font-mono text-[11px] whitespace-nowrap">
                      {new Date(sale.createdAt).toLocaleDateString('pt-BR')} 
                      <span className="text-slate-400 block text-[9px] mt-0.5">
                        {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    {/* Cliente */}
                    <td className="p-3 font-bold text-slate-800">
                      {sale.clientName}
                    </td>

                    {/* Canal */}
                    <td className="p-3 whitespace-nowrap">
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full font-semibold">
                        {sale.channel}
                      </span>
                    </td>

                    {/* Vendedor */}
                    <td className="p-3 font-medium text-slate-650">
                      {sale.salesperson ? (
                        <span className="text-pink-600 bg-pink-50/20 px-1.5 py-0.5 rounded border border-pink-100/40">
                          👩‍💼 {sale.salesperson}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic font-normal">Nenhum</span>
                      )}
                    </td>

                    {/* Itens Comprados */}
                    <td className="p-3 max-w-[180px]">
                      <div className="space-y-0.5 text-[11px] truncate leading-tight">
                        {sale.items.map((it, idx) => (
                          <p key={idx} className="truncate text-slate-700 font-medium">
                            <span className="text-slate-450 font-bold font-mono">{it.quantity}x</span> {it.name}
                          </p>
                        ))}
                      </div>
                    </td>

                    {/* Total Pago */}
                    <td className="p-3 font-mono font-bold text-slate-800 text-sm">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.total)}
                    </td>

                    {/* Formas Pgto */}
                    <td className="p-3 max-w-[150px]">
                      {sale.payments && sale.payments.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {sale.payments.map((p, pIdx) => (
                            <span key={pIdx} className="text-[9px] bg-slate-100/80 border border-slate-200 text-slate-600 p-0.5 px-1.5 rounded font-mono uppercase">
                              {p.method}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-[10px]">PIX</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-3 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit
                        ${sale.status === 'Concluída' ? 'bg-emerald-100 text-emerald-800' : ''}
                        ${sale.status === 'Pendente' ? 'bg-amber-100 text-amber-800' : ''}
                        ${sale.status === 'Cancelada' ? 'bg-rose-100 text-rose-800 line-through opacity-85' : ''}
                      `}>
                        {sale.status === 'Concluída' && <span className="w-1 h-1 rounded-full bg-emerald-500" />}
                        {sale.status === 'Pendente' && <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />}
                        {sale.status === 'Cancelada' && <span className="w-1 h-1 rounded-full bg-rose-500" />}
                        <span>{sale.status}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3 whitespace-nowrap text-center">
                      <div className="flex justify-center items-center gap-1.5">
                        <button
                          onClick={() => setSelectedSaleForInvoice(sale)}
                          title="Gerar Recibo do Pedido (PDF / A4)"
                          className="p-1 px-2.5 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 rounded font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <FileText size={12} />
                          <span>Gerar Recibo do Pedido</span>
                        </button>

                        <button
                          onClick={() => setSelectedSaleForReceipt(sale)}
                          title="Imprimir Comprovante / Cupom de Venda"
                          className="p-1 px-2.5 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Printer size={12} />
                          <span>Cupom</span>
                        </button>

                        {sale.status !== 'Cancelada' && (
                          <button
                            onClick={() => handleCancelSale(sale.id)}
                            title="Estornar e Cancelar essa Venda"
                            className="p-1 px-2 hover:bg-rose-50 text-rose-600 hover:border-rose-150 border border-transparent rounded font-bold text-[10px] cursor-pointer transition-colors"
                          >
                            <span>Cancelar</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteSaleClick(sale.id)}
                          title="Excluir/Apagar essa venda permanentemente"
                          className="p-1 px-2 hover:bg-red-50 text-red-600 hover:border-red-150 border border-transparent rounded font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Trash2 size={12} />
                          <span>Apagar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Render Receipt Modal */}
      {selectedSaleForReceipt && (
        <ThermalReceipt 
          sale={selectedSaleForReceipt}
          onClose={() => setSelectedSaleForReceipt(null)}
        />
      )}

      {/* Render A4 Minimalist Invoice Receipt Modal */}
      {selectedSaleForInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto font-sans text-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Header / Actions - NOT PRINTED */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 rounded-t-2xl print:hidden">
              <span className="font-bold text-xs tracking-wider uppercase flex items-center gap-2">
                <FileText size={14} className="text-pink-500" />
                <span>Recibo de Venda Oficial - A4</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border-none"
                >
                  <Printer size={13} />
                  <span>Imprimir / Salvar PDF</span>
                </button>
                <button 
                  onClick={() => setSelectedSaleForInvoice(null)}
                  className="text-slate-400 hover:text-white transition-colors text-sm px-2 cursor-pointer bg-transparent border-none"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Document Body (Printable Area) */}
            <div className="p-8 overflow-y-auto flex-1 bg-white print:p-0 print:overflow-visible" id="printable-invoice-sheet">
              <style>{`
                @media print {
                  @page {
                    size: A4 portrait;
                    margin: 15mm 10mm 15mm 10mm;
                  }
                  html, body, #root, #main-app-container {
                    visibility: visible !important;
                    height: auto !important;
                    min-height: 100% !important;
                    overflow: visible !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    background: #ffffff !important;
                  }
                  body * {
                    visibility: hidden !important;
                  }
                  .no-print, .print-hidden, header, aside, nav, footer, button {
                    display: none !important;
                    visibility: hidden !important;
                  }
                  #printable-invoice-sheet, #printable-invoice-sheet * {
                    visibility: visible !important;
                  }
                  #printable-invoice-sheet {
                    display: block !important;
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    background: #ffffff !important;
                    color: #000000 !important;
                    z-index: 9999999 !important;
                  }
                  #printable-invoice-sheet * {
                    color: #000000 !important;
                    background: transparent !important;
                  }
                }
              `}</style>
              
              <div className="space-y-6">
                {/* Brand Header */}
                <div className="flex justify-between items-start border-b border-slate-150 pb-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-lg font-black tracking-widest text-slate-900">AP MODA FITNESS</span>
                    </div>
                    <p className="text-slate-400 text-[10px] leading-relaxed">
                      CNPJ: 45.678.901/0001-23<br />
                      Av. Paulista, 1000 - Bela Vista, São Paulo - SP<br />
                      Instagram: @apmodafitness.oficial • Tel: (11) 98765-4321
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="bg-pink-100 text-pink-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Comprovante de Venda
                    </span>
                    <h2 className="text-slate-800 font-bold text-xs">PEDIDO #{selectedSaleForInvoice.id.slice(-8).toUpperCase()}</h2>
                    <p className="text-slate-400 text-[10px]">
                      Data: {new Date(selectedSaleForInvoice.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Client / Order details */}
                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100 text-[11px]">
                  <div className="space-y-1.5">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">DADOS DO CLIENTE</span>
                    <div className="space-y-1 text-slate-700">
                      <p><strong>Nome:</strong> {selectedSaleForInvoice.clientName || 'Cliente Consumidor'}</p>
                      <p><strong>CPF/CNPJ:</strong> {selectedSaleForInvoice.clientDoc || 'Não Informado'}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">DADOS DA OPERAÇÃO</span>
                    <div className="space-y-1 text-slate-700">
                      <p><strong>Canal de Venda:</strong> {selectedSaleForInvoice.channel || 'Loja Física'}</p>
                      <p><strong>Vendedor:</strong> {selectedSaleForInvoice.salesperson || 'Atendimento Geral'}</p>
                      <p><strong>Forma de Pagamento:</strong> {selectedSaleForInvoice.payments?.[0]?.method || 'PIX / Cartão'}</p>
                    </div>
                  </div>
                </div>

                {/* Products Table */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">ITENS COMPRADOS</span>
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b-2 border-slate-200 text-slate-400 font-extrabold uppercase text-[9px]">
                        <th className="py-2 pb-1.5">Descrição do Produto</th>
                        <th className="py-2 pb-1.5 text-center w-16">Qtd</th>
                        <th className="py-2 pb-1.5 text-right w-24">Vl. Unitário</th>
                        <th className="py-2 pb-1.5 text-right w-24">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {selectedSaleForInvoice.items.map((item, index) => {
                        const productData = products.find(p => p.id === item.productId || p.name === item.name);
                        return (
                          <tr key={index}>
                            <td className="py-2.5">
                              <div className="font-semibold">{item.name}</div>
                              {productData && (
                                <div className="text-[9px] text-slate-400 font-mono">SKU: {productData.sku}</div>
                              )}
                            </td>
                            <td className="py-2.5 text-center font-mono">{item.quantity}</td>
                            <td className="py-2.5 text-right font-mono">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                            </td>
                            <td className="py-2.5 text-right font-mono font-bold">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Totals block */}
                {(() => {
                  const itemsSubtotal = selectedSaleForInvoice.items.reduce((acc, p) => acc + (p.price * p.quantity), 0);
                  const calculatedDiscount = Math.max(0, itemsSubtotal - selectedSaleForInvoice.total);

                  return (
                    <div className="flex justify-end pt-4 border-t border-slate-150">
                      <div className="w-64 space-y-1.5 text-[11px]">
                        <div className="flex justify-between text-slate-500">
                          <span>Valor de Tabela:</span>
                          <span className="font-mono">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(itemsSubtotal)}
                          </span>
                        </div>
                        {calculatedDiscount > 0 && (
                          <div className="flex justify-between text-rose-600 font-semibold">
                            <span>Desconto Aplicado:</span>
                            <span className="font-mono">
                              -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedDiscount)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-800 font-black text-xs border-t border-dashed border-slate-200 pt-1.5">
                          <span>TOTAL LÍQUIDO:</span>
                          <span className="font-mono text-pink-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedSaleForInvoice.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Footer Signature and Stamp */}
                <div className="grid grid-cols-2 gap-8 pt-12 text-[10px] text-slate-400 text-center">
                  <div className="space-y-12">
                    <div className="border-b border-slate-300 mx-auto w-48 h-10" />
                    <p className="font-medium">Assinatura do Responsável</p>
                  </div>
                  <div className="space-y-12">
                    <div className="border-b border-slate-300 mx-auto w-48 h-10" />
                    <p className="font-medium">Assinatura do Cliente / Recebedor</p>
                  </div>
                </div>

                {/* Terms Disclaimer */}
                <div className="pt-8 border-t border-slate-100 text-center text-[9px] text-slate-400 space-y-1 leading-normal font-sans">
                  <p>Agradecemos pela preferência! Conforme políticas da AP Moda Fitness, trocas de peças sem defeitos</p>
                  <p>podem ser feitas em até 30 dias contados desta emissão, obrigatoriamente com a etiqueta original anexada.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
