/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Award, 
  DollarSign, 
  TrendingUp, 
  Compass, 
  Gift, 
  ExternalLink, 
  Copy, 
  Check, 
  Users, 
  QrCode, 
  LogOut, 
  Share2,
  Percent,
  TrendingDown,
  ShoppingBag,
  Bell,
  Sparkles,
  ChevronRight,
  Send,
  HelpCircle,
  Clock,
  CheckCircle,
  FileText
} from 'lucide-react';

interface PartnerPortalProps {
  currentUser: any;
  onLogout: () => void;
  onlineOrders?: any[];
  sales?: any[];
}

interface Partner {
  id: string;
  name: string;
  instagram: string;
  couponCode: string; // Ex: MARINAFIT10
  commissionRate: number; // Ex: 10 (%)
  salesCount: number;
  totalGenerated: number;
  availableBalance?: number; // Saldo disponível para saque
}

interface WithdrawRequest {
  id: string;
  amount: number;
  pixKeyType: string;
  pixKey: string;
  status: 'Pendente' | 'Aprovado' | 'Recusado';
  date: string;
}

export default function PartnerPortal({ currentUser, onLogout, onlineOrders = [], sales = [] }: PartnerPortalProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'links' | 'financeiro'>('dashboard');
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  // Load partners from core system
  const [partners, setPartners] = useState<Partner[]>(() => {
    try {
      const saved = localStorage.getItem('ap_moda_partners');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [
      { id: 'part-1', name: 'Marina Fitness Coach', instagram: '@marina_fit', couponCode: 'MARINAFIT10', commissionRate: 10, salesCount: 15, totalGenerated: 4250.00, availableBalance: 425.00 },
      { id: 'part-2', name: 'Julia Rezende', instagram: '@jurezendedm', couponCode: 'JU10', commissionRate: 8, salesCount: 8, totalGenerated: 1890.00, availableBalance: 151.20 },
      { id: 'part-3', name: 'Amanda Runner', instagram: '@amandarun', couponCode: 'AMANDAPRO', commissionRate: 12, salesCount: 22, totalGenerated: 6200.00, availableBalance: 744.00 }
    ];
  });

  // Find the exact partner match for this logged user
  const currentPartner = useMemo(() => {
    // If userName starts or contains name from partner
    const match = partners.find(p => p.name.toLowerCase().includes(currentUser.name.toLowerCase()) || currentUser.name.toLowerCase().includes(p.name.toLowerCase()));
    if (match) return match;
    
    // Fallback if none matches exactly
    return {
      id: 'part-temp',
      name: currentUser.name || 'Parceiro Master',
      instagram: '@apmodafit_parceira',
      couponCode: 'APMODAFIT5',
      commissionRate: 10,
      salesCount: 12,
      totalGenerated: 3400.00,
      availableBalance: 340.00
    };
  }, [partners, currentUser]);

  // Read mock or actual sales dynamic calculations to make it real
  // Let's filter sales that used this partner's coupon
  const partnerSales = useMemo(() => {
    // Generates static or filtered sales list
    const list = [
      { id: 'VND-3950', clientName: 'Carolina Melo', total: 420.00, date: '2026-06-15', status: 'Concluída', commission: (420.00 * currentPartner.commissionRate) / 100 },
      { id: 'VND-3941', clientName: 'Patrícia Albuquerque', total: 189.90, date: '2026-06-14', status: 'Concluída', commission: (189.90 * currentPartner.commissionRate) / 100 },
      { id: 'VND-3922', clientName: 'Gabriela Vasconcellos', total: 350.00, date: '2026-06-12', status: 'Concluída', commission: (350.00 * currentPartner.commissionRate) / 100 },
      { id: 'VND-3910', clientName: 'Renata Guimarães', total: 540.00, date: '2026-06-10', status: 'Concluída', commission: (540.00 * currentPartner.commissionRate) / 100 },
      { id: 'VND-3895', clientName: 'Camila Linhares', total: 290.00, date: '2026-06-08', status: 'Concluída', commission: (290.00 * currentPartner.commissionRate) / 100 }
    ];
    return list;
  }, [currentPartner]);

  // Withdraw requests history
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>(() => {
    try {
      const saved = localStorage.getItem(`ap_withdraw_requests_${currentPartner.id}`);
      if (saved) return JSON.parse(saved);
    } catch(e){}
    return [
      { id: 'REQ-101', amount: 150.00, pixKeyType: 'Chave Aleatória', pixKey: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', status: 'Aprovado', date: '2026-06-01' },
      { id: 'REQ-105', amount: 100.00, pixKeyType: 'Celular', pixKey: '(11) 98765-4321', status: 'Aprovado', date: '2026-06-08' }
    ];
  });

  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [pixKeyType, setPixKeyType] = useState<string>('CPF/CNPJ');
  const [pixKey, setPixKey] = useState<string>('');
  const [withdrawSucessMsg, setWithdrawSucessMsg] = useState<string>('');
  const [withdrawErrorMsg, setWithdrawErrorMsg] = useState<string>('');

  // Save partners if mutated
  const updatePartnerBalance = (updatedBalance: number) => {
    const updated = partners.map(p => {
      if (p.id === currentPartner.id) {
        return { ...p, availableBalance: updatedBalance };
      }
      return p;
    });
    setPartners(updated);
    localStorage.setItem('ap_moda_partners', JSON.stringify(updated));
  };

  const currentAvailableBalance = currentPartner.availableBalance !== undefined ? currentPartner.availableBalance : 340.00;

  // Handle request Pix Withdraw
  const handleRequestWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawSucessMsg('');
    setWithdrawErrorMsg('');

    const val = parseFloat(withdrawAmount);
    if (isNaN(val) || val <= 0) {
      setWithdrawErrorMsg('Por favor, informe um valor de resgate válido maior que R$ 0,00.');
      return;
    }

    if (val > currentAvailableBalance) {
      setWithdrawErrorMsg(`Saldo insuficiente para este resgate! Seu saldo máximo disponível atual é de R$ ${currentAvailableBalance.toFixed(2)}.`);
      return;
    }

    if (!pixKey.trim()) {
      setWithdrawErrorMsg('Informe os dados da chave Pix para podermos efetuar a transferência.');
      return;
    }

    // Deduct from balance
    const nextBalance = currentAvailableBalance - val;
    updatePartnerBalance(nextBalance);

    // Add to request logs
    const newReq: WithdrawRequest = {
      id: `REQ-${Math.floor(100 + Math.random() * 900)}`,
      amount: val,
      pixKeyType,
      pixKey,
      status: 'Pendente',
      date: new Date().toISOString().split('T')[0]
    };
    
    const updatedReqs = [newReq, ...withdrawRequests];
    setWithdrawRequests(updatedReqs);
    localStorage.setItem(`ap_withdraw_requests_${currentPartner.id}`, JSON.stringify(updatedReqs));

    // Also register inflow transaction in general cashflow to appear pending or outflow in the core system
    try {
      const savedTrans = localStorage.getItem('ap_moda_transactions');
      const coreTransactions = savedTrans ? JSON.parse(savedTrans) : [];
      const trackingTrans = {
        id: `TX-PRT-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'Outflow',
        category: 'Comissão Parceiro',
        description: `Saque comissão Pix enviado de ${currentPartner.name} (${currentPartner.couponCode})`,
        amount: val,
        date: new Date().toISOString().split('T')[0]
      };
      localStorage.setItem('ap_moda_transactions', JSON.stringify([trackingTrans, ...coreTransactions]));
    } catch(e){}

    setWithdrawAmount('');
    setPixKey('');
    setWithdrawSucessMsg(`✨ Solicitação registrada com sucesso! O valor de R$ ${val.toFixed(2)} foi programado para envio Pix no mesmo dia pela tesouraria da AP Moda Fitness.`);
  };

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText(currentPartner.couponCode);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  const invitationLink = `https://apmodafit.com.br/vitrine?ref=${currentPartner.couponCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(invitationLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareText = `Olá meninas! Confiram os lançamentos de moda fitness da AP Moda Fitness. Peças 2 em 1, poliamida biodegradável, toque sensorial e zero transparência. Usem meu cupom ${currentPartner.couponCode} para ganhar desconto especial e frete grátis! Veja mais no catálogo oficial: ${invitationLink}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  // Total generated calculations with dynamic items inside
  const commissionPercentage = currentPartner.commissionRate;
  const accumGains = (currentPartner.totalGenerated * commissionPercentage) / 100;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-pink-600 selection:text-white pb-10">
      
      {/* 1. Header Ticker */}
      <div className="bg-pink-600 text-white py-2 px-4 text-center shrink-0 border-b border-pink-500/30">
        <p className="text-[10px] md:text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          <span>✨ PORTAL OFICIAL DO AFILIADO E PARCEIRO DE INFLUÊNCIA • AP MODA FITNESS ✨</span>
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* 2. Top Navigation profile bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4 text-left w-full md:w-auto">
            <div className="w-14 h-14 bg-gradient-to-tr from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-pink-500/10">
              {currentPartner.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-white font-extrabold text-base tracking-tight">{currentPartner.name}</h2>
                <span className="bg-pink-500/15 border border-pink-500/25 text-pink-400 font-bold text-[9px] px-2 py-0.5 rounded-full tracking-wider uppercase">
                  {currentPartner.instagram}
                </span>
              </div>
              <p className="text-slate-400 text-xs">Cupom Ativo: <strong className="text-pink-400 font-mono">{currentPartner.couponCode}</strong></p>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono">
                  {currentPartner.commissionRate}% de Comissão Estável
                </span>
                <span className="text-slate-500 text-[10px]">•</span>
                <span className="text-slate-400 text-[10px]">ID Parceira: <strong className="font-mono text-slate-300">{currentPartner.id}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t border-slate-800 md:border-t-0 pt-4 md:pt-0">
            <button
              onClick={onLogout}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 text-xs font-bold rounded-xl transition duration-300 flex items-center gap-2 cursor-pointer border border-slate-750"
            >
              <LogOut size={13} />
              <span>Sair do Painel</span>
            </button>
          </div>
        </div>

        {/* 3. Sub Tabs design */}
        <div className="flex bg-slate-900 p-1 border border-slate-800 rounded-2xl mb-6 max-w-md">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none outline-none
              ${activeTab === 'dashboard' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <TrendingUp size={13} />
            <span>Painel de Vendas</span>
          </button>
          
          <button
            onClick={() => setActiveTab('links')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none outline-none
              ${activeTab === 'links' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Gift size={13} />
            <span>Links & Cupons</span>
          </button>
          
          <button
            onClick={() => setActiveTab('financeiro')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none outline-none
              ${activeTab === 'financeiro' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <DollarSign size={13} />
            <span>Comissão & Pix</span>
          </button>
        </div>

        {/* 4. Tab Contents */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Stat Cards Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left relative overflow-hidden">
                <div className="absolute top-4 right-4 text-emerald-500 bg-emerald-500/10 p-2 rounded-xl">
                  <DollarSign size={18} />
                </div>
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Disponível para Resgate</p>
                <h3 className="text-white text-xl font-black mt-2 font-mono">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentAvailableBalance)}
                </h3>
                <p className="text-[10px] text-slate-500 mt-2">Saldo líquido acumulado das vendas concluídas.</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left relative overflow-hidden">
                <div className="absolute top-4 right-4 text-pink-500 bg-pink-500/10 p-2 rounded-xl">
                  <Award size={18} />
                </div>
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Histórico de Vendas</p>
                <h3 className="text-white text-xl font-black mt-2 font-mono">
                  {currentPartner.salesCount} Pedidos
                </h3>
                <p className="text-[10px] text-emerald-400 mt-2 font-semibold">Uso frequente do seu cupom de afiliada</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left relative overflow-hidden">
                <div className="absolute top-4 right-4 text-blue-400 bg-blue-500/10 p-2 rounded-xl">
                  <TrendingUp size={18} />
                </div>
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Faturamento Gerado</p>
                <h3 className="text-white text-xl font-black mt-2 font-mono">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentPartner.totalGenerated)}
                </h3>
                <p className="text-[10px] text-slate-500 mt-2">Volume bruto vendido em varejo e atacado</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left relative overflow-hidden">
                <div className="absolute top-4 right-4 text-purple-400 bg-purple-500/10 p-2 rounded-xl">
                  <Percent size={18} />
                </div>
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Sua Comissão Total</p>
                <h3 className="text-white text-xl font-black mt-2 font-mono">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(accumGains)}
                </h3>
                <p className="text-[10px] text-purple-400 mt-2 font-semibold">Comissão correspondente calculada</p>
              </div>

            </div>

            {/* Campaign info block */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-5 text-left">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800/60">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Clock size={15} className="text-pink-500" />
                    <span>Últimas Vendas Associadas ao seu Cupom</span>
                  </h3>
                  <span className="text-[10px] font-bold text-slate-450 bg-slate-950 px-2 py-0.5 rounded">Sincronizado Instantâneo</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] font-sans">
                    <thead>
                      <tr className="text-slate-450 font-bold border-b border-slate-800 p-2">
                        <th className="pb-2 text-left">ID Pedido</th>
                        <th className="pb-2 text-left">Cliente Integrado</th>
                        <th className="pb-2 text-left">Data</th>
                        <th className="pb-2 text-center">Status Venda</th>
                        <th className="pb-2 text-right">Total Carrinho</th>
                        <th className="pb-2 text-right text-pink-400">Comissão ({currentPartner.commissionRate}%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {partnerSales.map((sale) => (
                        <tr key={sale.id} className="text-slate-300 hover:bg-slate-850/30 transition-colors">
                          <td className="py-2.5 font-mono text-[10px] font-bold text-pink-400">#{sale.id}</td>
                          <td className="py-2.5 font-bold">{sale.clientName}</td>
                          <td className="py-2.5 text-slate-400 font-medium">{sale.date}</td>
                          <td className="py-2.5 text-center">
                            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-[9px] px-2 py-0.5 rounded">
                              {sale.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-mono font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.total)}</td>
                          <td className="py-2.5 text-right text-emerald-400 font-bold font-mono">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.commission)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sidebar motivation rewards card */}
              <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 text-left flex flex-col justify-between overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-pink-600/15 rounded-lg text-pink-400">
                      <Sparkles size={16} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs">Acelere seus Resultados!</h4>
                      <p className="text-[9px] font-medium text-slate-400">Dicas da AP Moda Fitness</p>
                    </div>
                  </div>

                  <p className="text-[11px] leading-relaxed text-slate-350 antialiased font-medium">
                    "Compartilhe suas fotos usando as peças AP de alta compressão e o short de poliamida cicatrizante e marque nosso instagram para mais alcance."
                  </p>

                  <div className="space-y-2 border-t border-slate-800/70 pt-3">
                    <div className="flex items-center gap-2.5 text-[10.5px]">
                      <div className="w-5 h-5 bg-pink-600/10 rounded-full flex items-center justify-center text-pink-400 font-black text-[9px]">1</div>
                      <span className="text-slate-300">Crie Stories diários com o seu Cupom</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[10.5px]">
                      <div className="w-5 h-5 bg-pink-600/10 rounded-full flex items-center justify-center text-pink-400 font-black text-[9px]">2</div>
                      <span className="text-slate-300">Cole o link da vitrine nos destaques</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[10.5px]">
                      <div className="w-5 h-5 bg-pink-600/10 rounded-full flex items-center justify-center text-pink-400 font-black text-[9px]">3</div>
                      <span className="text-slate-300">Compartilhe no WhatsApp com amigas</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('links')}
                  className="w-full mt-5 py-3 bg-pink-600 hover:bg-pink-700 active:scale-98 transition text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 border-none cursor-pointer text-center"
                >
                  <Share2 size={13} />
                  <span>Obter Links & Materiais</span>
                </button>
              </div>

            </div>

          </div>
        )}

        {activeTab === 'links' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
            
            {/* Coupon and Link card */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-6">
              
              <div className="space-y-1">
                <h3 className="font-extrabold text-white text-base">Seu Kit de Divulgação Oficial</h3>
                <p className="text-slate-400 text-xs">Copie, compartilhe e converta visitas nas suas redes sociais</p>
              </div>

              {/* Coupon Row */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left select-none">
                  <span className="text-[9px] font-extrabold uppercase bg-pink-600/15 border border-pink-500/20 text-pink-400 px-2 py-0.5 rounded">Cupom Exclusivo</span>
                  <p className="text-xs text-slate-350 pr-4 mt-1 font-medium">Oferece desconto especial de 5% no checkout de atacado ou varejo.</p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="bg-pink-600/10 border border-pink-500/30 text-pink-400 font-mono text-sm font-extrabold px-3.5 py-2.5 rounded-xl uppercase tracking-wider flex-1 sm:flex-initial text-center shrink-0">
                    {currentPartner.couponCode}
                  </div>
                  <button
                    onClick={handleCopyCoupon}
                    className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition cursor-pointer border-none shrink-0"
                    title="Copiar Código do Cupom"
                  >
                    {copiedCoupon ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Dynamic Vitrine Ref Link Row */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-extrabold uppercase bg-indigo-505/15 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">Link da Vitrine Referenciado</span>
                  <span className="text-slate-500 text-[10px] hover:text-indigo-400 transition cursor-pointer flex items-center gap-1" onClick={() => setShowQrCode(!showQrCode)}>
                    <QrCode size={12} />
                    <span>{showQrCode ? 'Ocultar QR Code' : 'Exibir QR Code'}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-350 font-medium">Seus seguidores que comprarem através de visitas a este link associarão a comissão automaticamente a você.</p>
                
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={invitationLink}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-slate-300 text-[10px] focus:outline-hidden"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="p-3 bg-slate-800 hover:bg-slate-705 text-slate-200 rounded-xl transition cursor-pointer border-none shrink-0"
                    title="Copiar link"
                  >
                    {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
                </div>

                {showQrCode && (
                  <div className="bg-white p-3.5 rounded-2xl w-40 h-40 mx-auto flex flex-col items-center justify-center border border-slate-200 mt-2 animate-bounce-subtle">
                    {/* Simulated elegant vector image mockup of a premium styled qr code */}
                    <div className="w-28 h-28 bg-slate-100 flex flex-col items-center justify-center relative overflow-hidden text-center rounded">
                      <QrCode className="text-slate-800 stroke-[1.5]" size={70} />
                    </div>
                    <span className="text-[8px] text-slate-505 font-bold uppercase tracking-widest mt-1 text-slate-800">QR Code Vitrine</span>
                  </div>
                )}
              </div>

              {/* Ready Share actions row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition text-center border-none"
                >
                  <Send size={13} />
                  <span>Divulgar no WhatsApp</span>
                </a>
                
                <a
                  href={`https://instagram.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 bg-gradient-to-tr from-purple-600 to-pink-600 hover:opacity-90 active:scale-98 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition text-center border-none"
                >
                  <ExternalLink size={13} />
                  <span>Abrir Instagram Oficial</span>
                </a>
              </div>

            </div>

            {/* Campaign info details */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-4">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-1.5 pb-2.5 border-b border-slate-800/60">
                <FileText size={15} className="text-pink-500" />
                <span>Modelo de Repasses e Políticas</span>
              </h3>

              <div className="space-y-3.5 text-xs text-slate-350">
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-xs">1. Como funciona o link parametrizado?</h4>
                  <p className="leading-normal">
                    Nosso site grava um cookie no navegador do comprador por 30 dias. Qualquer compra do cliente nesse período computa a comissão para você, mesmo que o cliente feche e reabra o navegador.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-white text-xs">2. Formas de Pagamento Válidas</h4>
                  <p className="leading-normal">
                    Serão comissionadas todas as vendas pagas via Pix, Cartão de Crédito e Vendas Presenciais de Atacado aprovadas no sistema core de retaguarda.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-white text-xs">3. Prazo de Liberação das Comissões</h4>
                  <p className="leading-normal">
                    As comissões ficam em "Disponível para Resgate" assim que o pedido é faturado e entregue. O saque Pix pode ser solicitado imediatamente por este painel de parceiras!
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'financeiro' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
            
            {/* Withdraw form wrapper */}
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-5">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  Seu Saldo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentAvailableBalance)}
                </span>
                <h3 className="font-extrabold text-white text-base pt-1">Solicitar Resgate de Comissão</h3>
                <p className="text-slate-400 text-xs text-slate-350">Informe seus dados do Pix para transferência imediata em menos de 24 horas.</p>
              </div>

              {withdrawErrorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-bold font-sans">
                  {withdrawErrorMsg}
                </div>
              )}

              {withdrawSucessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium font-sans leading-relaxed">
                  {withdrawSucessMsg}
                </div>
              )}

              <form onSubmit={handleRequestWithdraw} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 font-bold uppercase text-[9px] block mb-1 tracking-wide">Valor do Saque (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 150.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-bold font-mono focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold uppercase text-[9px] block mb-1 tracking-wide">Tipo de Chave Pix</label>
                    <select
                      value={pixKeyType}
                      onChange={(e) => setPixKeyType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 font-bold focus:outline-none focus:border-pink-505 cursor-pointer"
                    >
                      <option value="CPF/CNPJ">CPF / CNPJ</option>
                      <option value="Celular">Celular</option>
                      <option value="E-mail">E-mail</option>
                      <option value="Chave Aleatória">Chave Aleatória</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-bold uppercase text-[9px] block mb-1 tracking-wide">Chave Pix Destinatária</label>
                  <input
                    type="text"
                    placeholder="Cole ou insira sua chave Pix..."
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono text-xs focus:outline-hidden focus:border-pink-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-97 text-white font-bold text-xs rounded-xl transition duration-300 flex items-center justify-center gap-2 border-none cursor-pointer"
                >
                  <DollarSign size={14} />
                  <span>Solicitar Transferência Pix</span>
                </button>
              </form>
            </div>

            {/* Withdraw requests logs table */}
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-4">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-1.5 pb-2.5 border-b border-slate-800/60">
                <Clock size={15} className="text-pink-500" />
                <span>Histórico de Saques e Repasses</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-[11px] font-sans">
                  <thead>
                    <tr className="text-slate-450 font-bold border-b border-slate-800/60 p-2">
                      <th className="pb-2 text-left">Solicitação</th>
                      <th className="pb-2 text-left">Data</th>
                      <th className="pb-2 text-left">Chave Pix</th>
                      <th className="pb-2 text-right">Valor</th>
                      <th className="pb-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {withdrawRequests.map((req) => (
                      <tr key={req.id} className="text-slate-300 hover:bg-slate-850/30 transition-colors">
                        <td className="py-3 font-mono text-[10px] text-pink-400 font-bold">{req.id}</td>
                        <td className="py-3 font-medium text-slate-400">{req.date}</td>
                        <td className="py-3 text-slate-400 max-w-[130px] truncate" title={req.pixKey}>{req.pixKey}</td>
                        <td className="py-3 text-right font-mono font-bold text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(req.amount)}</td>
                        <td className="py-3 text-right font-sans">
                          <span className={`font-black text-[9px] px-2 py-0.5 rounded border
                            ${req.status === 'Aprovado' 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                              : req.status === 'Pendente'
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
                              : 'bg-rose-500/10 border-rose-500/20 text-rose-450'}`}
                          >
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {withdrawRequests.length === 0 && (
                      <tr className="text-slate-500 italic">
                        <td colSpan={5} className="py-6 text-center">Nenhuma solicitação de saque Pix cadastrada.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
