/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { saveStoredPartners } from '../utils/partnerUtils';
import { getAppUrl } from '../config';
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
  FileText,
  Search,
  Link2,
  Filter,
  CheckSquare,
  Square,
  Plus,
  X,
  Tag,
  Calendar
} from 'lucide-react';

interface PartnerPortalProps {
  currentUser: any;
  onLogout: () => void;
  onlineOrders?: any[];
  sales?: any[];
  products?: any[];
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

export default function PartnerPortal({ currentUser, onLogout, onlineOrders = [], sales = [], products = [] }: PartnerPortalProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'links' | 'financeiro'>('dashboard');
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  // Load partners from core system
  const [partners, setPartners] = useState<Partner[]>(() => {
    try {
      const saved = localStorage.getItem('ap_moda_partners');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch(e) {}
    return [
      { id: 'part-1', name: 'Marina Fitness Coach', instagram: '@marina_fit', couponCode: 'MARINAFIT10', commissionRate: 10, salesCount: 0, totalGenerated: 0, availableBalance: 0 },
      { id: 'part-2', name: 'Julia Rezende', instagram: '@jurezendedm', couponCode: 'JU10', commissionRate: 8, salesCount: 0, totalGenerated: 0, availableBalance: 0 },
      { id: 'part-3', name: 'Amanda Runner', instagram: '@amandarun', couponCode: 'AMANDAPRO', commissionRate: 12, salesCount: 0, totalGenerated: 0, availableBalance: 0 },
      { id: 'part-4', name: 'Patricia Cardoso', instagram: '@patriciacardoso', couponCode: 'PATRICIA10', commissionRate: 10, salesCount: 0, totalGenerated: 0, availableBalance: 0 }
    ];
  });

  // Find the exact partner match for this logged user
  const currentPartner = useMemo(() => {
    const match = partners.find(p => p.name.toLowerCase().includes(currentUser.name.toLowerCase()) || currentUser.name.toLowerCase().includes(p.name.toLowerCase()) || (p.couponCode && currentUser.couponCode && p.couponCode.toUpperCase() === currentUser.couponCode.toUpperCase()));
    if (match) return match;
    
    return {
      id: currentUser.id || 'part-temp',
      name: currentUser.name || 'Parceiro Master',
      instagram: '@' + (currentUser.login || 'apmodafit_parceira'),
      couponCode: currentUser.couponCode || currentUser.details?.couponCode || (currentUser.login ? currentUser.login.toUpperCase() + '10' : 'APMODAFIT10'),
      commissionRate: 10,
      salesCount: 0,
      totalGenerated: 0,
      availableBalance: 0
    };
  }, [partners, currentUser]);

  // Manual retroactive sales state
  const [manualSales, setManualSales] = useState<any[]>(() => {
    try {
      const savedLocal = localStorage.getItem(`ap_manual_partner_sales_${currentPartner.id}`);
      let list: any[] = [];
      if (savedLocal) {
        const parsed = JSON.parse(savedLocal);
        if (Array.isArray(parsed)) list = parsed;
      }
      const savedGlobal = localStorage.getItem('ap_manual_partner_sales');
      if (savedGlobal) {
        const parsedGlobal = JSON.parse(savedGlobal);
        if (Array.isArray(parsedGlobal)) {
          parsedGlobal.forEach(gItem => {
            const isForThisPartner = gItem.partnerId === currentPartner.id ||
              (gItem.partnerName && currentPartner.name && gItem.partnerName.toLowerCase().includes(currentPartner.name.toLowerCase()));
            if (isForThisPartner && !list.some(l => l.id === gItem.id)) {
              list.push(gItem);
            }
          });
        }
      }
      return list;
    } catch(e) {}
    return [];
  });

  // Extract all token variations for currentPartner to ensure 100% failproof auto-matching
  const partnerTokens = useMemo(() => {
    const tokens = new Set<string>();
    const sanitize = (str: string) => (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

    const rawName = currentPartner.name || '';
    const rawCoupon = currentPartner.couponCode || '';
    const rawLogin = ((currentPartner as any).login || currentUser?.login || '');
    const rawId = currentPartner.id || '';

    const cleanName = sanitize(rawName);
    const cleanCoupon = sanitize(rawCoupon);
    const cleanLogin = sanitize(rawLogin);
    const cleanId = sanitize(rawId);

    if (cleanCoupon) {
      tokens.add(cleanCoupon);
      const alpha = cleanCoupon.replace(/[^A-Z]/g, '');
      if (alpha.length >= 3) tokens.add(alpha);
    }

    if (cleanLogin) {
      tokens.add(cleanLogin);
      const alpha = cleanLogin.replace(/[^A-Z]/g, '');
      if (alpha.length >= 3) tokens.add(alpha);
    }

    if (cleanName) {
      tokens.add(cleanName);
      cleanName.split(/\s+/).forEach(part => {
        const p = part.trim();
        if (p.length >= 3 && !['DOS', 'DAS', 'DA', 'DE', 'DO', 'MODA', 'FITNESS'].includes(p)) {
          tokens.add(p);
        }
      });
    }

    if (cleanId) tokens.add(cleanId);

    return Array.from(tokens);
  }, [currentPartner, currentUser]);

  // Compute REAL sales matching this partner's couponCode / ID / name / login / tokens + manual sales
  const partnerSales = useMemo(() => {
    const matched: any[] = [];
    const sanitize = (str: string) => (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

    const isPartnerMatch = (cCode: string, pName: string, pId: string, notes: string, extraFields: string = '') => {
      const cleanCCode = sanitize(cCode);
      const cleanPName = sanitize(pName);
      const cleanPId = sanitize(pId);
      const cleanNotes = sanitize(notes);
      const cleanExtra = sanitize(extraFields);
      const cleanAll = `${cleanCCode} ${cleanPName} ${cleanPId} ${cleanNotes} ${cleanExtra}`;

      for (const token of partnerTokens) {
        if (!token) continue;
        if (cleanCCode === token || (cleanCCode && (cleanCCode.includes(token) || token.includes(cleanCCode)))) {
          return true;
        }
        if (cleanPName.includes(token) || cleanPId === token || cleanNotes.includes(token) || cleanAll.includes(token)) {
          return true;
        }
      }
      return false;
    };

    // 1. From POS sales
    if (Array.isArray(sales)) {
      sales.forEach(s => {
        if (s.status === 'Cancelada') return;
        const cCode = s.couponCode || s.coupon || s.partnerCoupon || (s.appliedCoupon?.code) || '';
        const pName = s.partner || s.partnerName || s.seller || s.salesperson || '';
        const pId = s.partnerId || '';
        const notes = `${s.notes || ''} ${s.observation || ''} ${s.clientName || ''}`;

        if (isPartnerMatch(cCode, pName, pId, notes, JSON.stringify(s))) {
          const totalVal = Number(s.total || s.value || s.amount || 0);
          const commRate = currentPartner.commissionRate || 10;
          const commVal = (totalVal * commRate) / 100;
          matched.push({
            id: s.id || `VND-${s.number || Math.floor(1000 + Math.random() * 9000)}`,
            clientName: s.clientName || s.customerName || s.client || 'Cliente',
            total: totalVal,
            date: s.date ? s.date.split('T')[0] : (s.createdAt ? s.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
            status: s.status || 'Concluída',
            commission: commVal,
            type: 'Venda Loja'
          });
        }
      });
    }

    // 2. From onlineOrders
    if (Array.isArray(onlineOrders)) {
      onlineOrders.forEach(o => {
        if (o.status === 'Cancelado') return;
        const cCode = o.couponCode || o.coupon || o.ref || o.partnerCoupon || (o.appliedCoupon?.code) || '';
        const pName = o.partnerName || o.partner || o.partnerId || '';
        const pId = o.partnerId || '';
        const notes = `${o.notes || ''} ${o.observation || ''} ${o.clientName || ''} ${o.customerName || ''}`;

        if (isPartnerMatch(cCode, pName, pId, notes, JSON.stringify(o))) {
          if (!matched.some(m => m.id === o.id)) {
            const totalVal = Number(o.total || o.value || o.amount || 0);
            const commRate = currentPartner.commissionRate || 10;
            const commVal = (totalVal * commRate) / 100;
            matched.push({
              id: o.id || `PED-${o.number || Math.floor(1000 + Math.random() * 9000)}`,
              clientName: o.clientName || o.customerName || o.client || 'Cliente Site',
              total: totalVal,
              date: o.date ? o.date.split('T')[0] : (o.createdAt ? o.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
              status: o.status || 'Concluído',
              commission: commVal,
              type: 'Pedido Online'
            });
          }
        }
      });
    }

    // 3. From manual retroactive sales
    if (Array.isArray(manualSales)) {
      manualSales.forEach(m => {
        if (!matched.some(item => item.id === m.id)) {
          const totalVal = Number(m.total || m.amount || 0);
          const commRate = m.commissionRate || currentPartner.commissionRate || 10;
          const commVal = m.commission ?? ((totalVal * commRate) / 100);
          matched.push({
            id: m.id || `RET-${Math.floor(1000 + Math.random() * 9000)}`,
            clientName: m.clientName || 'Cliente Retroativo',
            total: totalVal,
            date: m.date ? m.date.split('T')[0] : new Date().toISOString().split('T')[0],
            status: m.status || 'Concluída',
            commission: commVal,
            type: m.type || 'Lançamento Retroativo',
            notes: m.notes || ''
          });
        }
      });
    }

    return matched;
  }, [sales, onlineOrders, manualSales, partnerTokens, currentPartner]);

  // Retroactive sale modal state
  const [isRetroModalOpen, setIsRetroModalOpen] = useState(false);
  const [retroTab, setRetroTab] = useState<'system' | 'manual'>('system');
  const [retroSearch, setRetroSearch] = useState('');

  // Manual entry form state
  const [manualClientName, setManualClientName] = useState('');
  const [manualTotal, setManualTotal] = useState('');
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [manualOrderNum, setManualOrderNum] = useState('');
  const [manualChannel, setManualChannel] = useState('Cupom / Link de Afiliado');
  const [manualNotes, setManualNotes] = useState('');
  const [retroSuccessMsg, setRetroSuccessMsg] = useState('');

  // Handler to link existing sale/order from system
  const handleLinkExistingSale = (item: any, isOnlineOrder: boolean) => {
    const saleId = item.id;
    const clientName = item.clientName || item.customerName || 'Cliente';
    const totalVal = Number(item.total || item.amount || 0);
    const commRate = currentPartner.commissionRate || 10;
    const commVal = (totalVal * commRate) / 100;

    const newManualItem = {
      id: saleId,
      partnerId: currentPartner.id,
      partnerName: currentPartner.name,
      clientName,
      total: totalVal,
      date: item.date ? item.date.split('T')[0] : (item.createdAt ? item.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
      status: 'Concluída',
      commissionRate: commRate,
      commission: commVal,
      type: isOnlineOrder ? 'Pedido Online' : 'Venda Loja',
      notes: `Vencimento pós-fechado vinculado a ${currentPartner.name}`
    };

    const updatedLocal = [newManualItem, ...manualSales.filter(m => m.id !== saleId)];
    setManualSales(updatedLocal);
    localStorage.setItem(`ap_manual_partner_sales_${currentPartner.id}`, JSON.stringify(updatedLocal));

    try {
      const savedGlobal = localStorage.getItem('ap_manual_partner_sales');
      const parsedGlobal = savedGlobal ? JSON.parse(savedGlobal) : [];
      const updatedGlobal = [newManualItem, ...parsedGlobal.filter((g: any) => g.id !== saleId)];
      localStorage.setItem('ap_manual_partner_sales', JSON.stringify(updatedGlobal));
    } catch(e) {}

    if (isOnlineOrder) {
      try {
        const savedOrders = localStorage.getItem('ap_online_orders');
        if (savedOrders) {
          const parsedOrders = JSON.parse(savedOrders);
          const updated = parsedOrders.map((o: any) => {
            if (o.id === saleId) {
              return { ...o, partnerName: currentPartner.name, partnerId: currentPartner.id, couponCode: currentPartner.couponCode };
            }
            return o;
          });
          localStorage.setItem('ap_online_orders', JSON.stringify(updated));
        }
      } catch(e) {}
    } else {
      try {
        const savedSales = localStorage.getItem('ap_moda_sales');
        if (savedSales) {
          const parsedSales = JSON.parse(savedSales);
          const updated = parsedSales.map((s: any) => {
            if (s.id === saleId) {
              return { ...s, partner: currentPartner.name, partnerId: currentPartner.id, couponCode: currentPartner.couponCode };
            }
            return s;
          });
          localStorage.setItem('ap_moda_sales', JSON.stringify(updated));
        }
      } catch(e) {}
    }

    window.dispatchEvent(new Event('storage'));

    setRetroSuccessMsg(`Venda #${saleId} de ${clientName} (R$ ${totalVal.toFixed(2)}) vinculada com sucesso a ${currentPartner.name}!`);
    setTimeout(() => setRetroSuccessMsg(''), 4000);
  };

  // Handler to submit manual direct sale
  const handleSaveManualSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualClientName.trim()) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }
    const totalVal = parseFloat(manualTotal);
    if (isNaN(totalVal) || totalVal <= 0) {
      alert('Por favor, informe um valor total válido maior que R$ 0,00.');
      return;
    }

    const saleId = manualOrderNum.trim() ? manualOrderNum.trim().toUpperCase() : `RET-${Math.floor(10000 + Math.random() * 90000)}`;
    const commRate = currentPartner.commissionRate || 10;
    const commVal = (totalVal * commRate) / 100;

    const newItem = {
      id: saleId,
      partnerId: currentPartner.id,
      partnerName: currentPartner.name,
      clientName: manualClientName.trim(),
      total: totalVal,
      date: manualDate || new Date().toISOString().split('T')[0],
      status: 'Concluída',
      commissionRate: commRate,
      commission: commVal,
      type: manualChannel,
      notes: manualNotes.trim()
    };

    const updatedLocal = [newItem, ...manualSales.filter(m => m.id !== saleId)];
    setManualSales(updatedLocal);
    localStorage.setItem(`ap_manual_partner_sales_${currentPartner.id}`, JSON.stringify(updatedLocal));

    try {
      const savedGlobal = localStorage.getItem('ap_manual_partner_sales');
      const parsedGlobal = savedGlobal ? JSON.parse(savedGlobal) : [];
      const updatedGlobal = [newItem, ...parsedGlobal.filter((g: any) => g.id !== saleId)];
      localStorage.setItem('ap_manual_partner_sales', JSON.stringify(updatedGlobal));
    } catch(e) {}

    window.dispatchEvent(new Event('storage'));

    setManualClientName('');
    setManualTotal('');
    setManualOrderNum('');
    setManualNotes('');
    setRetroSuccessMsg(`Lançamento manual registrado! Venda de R$ ${totalVal.toFixed(2)} contabilizada no perfil de ${currentPartner.name}.`);
    setTimeout(() => setRetroSuccessMsg(''), 4000);
  };

  // Withdraw requests history loaded from localStorage (no ghost defaults)
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>(() => {
    try {
      const saved = localStorage.getItem(`ap_withdraw_requests_${currentPartner.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch(e){}
    return [];
  });

  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [pixKeyType, setPixKeyType] = useState<string>('CPF/CNPJ');
  const [pixKey, setPixKey] = useState<string>('');
  const [withdrawSucessMsg, setWithdrawSucessMsg] = useState<string>('');
  const [withdrawErrorMsg, setWithdrawErrorMsg] = useState<string>('');

  // Dynamic real metrics
  const realSalesCount = partnerSales.length;
  const realTotalGenerated = partnerSales.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const realEarnedCommission = partnerSales.reduce((acc, curr) => acc + (curr.commission || 0), 0);
  const totalWithdrawn = withdrawRequests
    .filter(r => r.status === 'Aprovado' || r.status === 'Pendente')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const currentAvailableBalance = Math.max(0, realEarnedCommission - totalWithdrawn);

  // Curated product selection for Partner's Custom Promotion List
  const allProductsList = useMemo(() => {
    if (products && products.length > 0) return products;
    try {
      const saved = localStorage.getItem('ap_moda_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  }, [products]);

  const [partnerCuratedIds, setPartnerCuratedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`ap_partner_curated_${currentPartner.id}`);
      if (saved) return JSON.parse(saved);
    } catch(e){}
    return [];
  });

  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [copiedCuratedLink, setCopiedCuratedLink] = useState(false);

  const toggleProductInCuratedList = (prodId: string) => {
    setPartnerCuratedIds(prev => {
      const updated = prev.includes(prodId) ? prev.filter(id => id !== prodId) : [...prev, prodId];
      try {
        localStorage.setItem(`ap_partner_curated_${currentPartner.id}`, JSON.stringify(updated));
      } catch(e){}
      return updated;
    });
  };

  const curatedSelectionLink = useMemo(() => {
    const origin = getAppUrl();
    
    if (partnerCuratedIds.length > 0) {
      return `${origin}/?ref=${currentPartner.couponCode}&produtos=${partnerCuratedIds.join(',')}`;
    }
    return `${origin}/?ref=${currentPartner.couponCode}`;
  }, [currentPartner.couponCode, partnerCuratedIds]);

  const handleCopyCuratedLink = () => {
    navigator.clipboard.writeText(curatedSelectionLink);
    setCopiedCuratedLink(true);
    setTimeout(() => setCopiedCuratedLink(false), 2500);
  };

  const curatedShareText = useMemo(() => {
    const selectedProdsNames = allProductsList
      .filter(p => partnerCuratedIds.includes(p.id))
      .map(p => `• ${p.name}`)
      .slice(0, 4);

    let text = `✨ Minhas Peças Favoritas da AP Moda Fitness! ✨\n\n`;
    if (selectedProdsNames.length > 0) {
      text += `Preparei uma seleção especial de lançamentos para você:\n${selectedProdsNames.join('\n')}\n`;
      if (partnerCuratedIds.length > 4) {
        text += `...e mais ${partnerCuratedIds.length - 4} peças incríveis!\n`;
      }
      text += `\n`;
    }
    text += `🎁 Use meu cupom *${currentPartner.couponCode}* no checkout e ganhe desconto exclusivo!\n\n`;
    text += `Acesse a minha lista completa aqui:\n${curatedSelectionLink}`;
    return text;
  }, [allProductsList, partnerCuratedIds, currentPartner.couponCode, curatedSelectionLink]);

  const curatedWhatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(curatedShareText)}`;

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

  const invitationLink = `${getAppUrl()}/?ref=${currentPartner.couponCode}`;

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
                  {realSalesCount} {realSalesCount === 1 ? 'Pedido' : 'Pedidos'}
                </h3>
                <p className="text-[10px] text-emerald-400 mt-2 font-semibold">Vendas associadas ao seu cupom</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left relative overflow-hidden">
                <div className="absolute top-4 right-4 text-blue-400 bg-blue-500/10 p-2 rounded-xl">
                  <TrendingUp size={18} />
                </div>
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Faturamento Gerado</p>
                <h3 className="text-white text-xl font-black mt-2 font-mono">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(realTotalGenerated)}
                </h3>
                <p className="text-[10px] text-slate-500 mt-2">Volume bruto gerado com seu cupom</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left relative overflow-hidden">
                <div className="absolute top-4 right-4 text-purple-400 bg-purple-500/10 p-2 rounded-xl">
                  <Percent size={18} />
                </div>
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Sua Comissão Total</p>
                <h3 className="text-white text-xl font-black mt-2 font-mono">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(realEarnedCommission)}
                </h3>
                <p className="text-[10px] text-purple-400 mt-2 font-semibold">Comissão de {currentPartner.commissionRate}% calculada</p>
              </div>

            </div>

            {/* Campaign info block */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-5 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/60">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Clock size={15} className="text-pink-500" />
                      <span>Últimas Vendas Associadas ao seu Perfil</span>
                    </h3>
                    <p className="text-[10px] text-slate-400">Contabiliza vendas de cupom, link, balcão e lançamentos pós-fechados</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsRetroModalOpen(true)}
                      className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-[11px] px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all border border-pink-500/30"
                    >
                      <Plus size={14} />
                      <span>➕ Lançar Venda Pós-Fechada</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {partnerSales.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <p className="text-xs font-bold text-slate-300">Nenhuma venda registrada com o seu cupom ainda.</p>
                      <p className="text-[10px] text-slate-500 max-w-sm mx-auto">
                        Divulgue seu cupom <strong className="text-pink-400 font-mono">{currentPartner.couponCode}</strong> ou seu link exclusivo para seus seguidores e comece a acumular comissões!
                      </p>
                    </div>
                  ) : (
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
                  )}
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

            {/* CREATOR/INFLUENCER CURATED SELECTION LINK BUILDER */}
            <div className="lg:col-span-12 bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={18} className="text-pink-500" />
                    <h3 className="font-extrabold text-white text-base">
                      Crie um Link com sua Seleção de Produtos Favoritos
                    </h3>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Escolha as peças que você está ofertando no Instagram, Stories ou WhatsApp. O link gerado abrirá o catálogo destacando a sua seleção e com seu cupom <strong>{currentPartner.couponCode}</strong> pré-aplicado!
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 px-3 py-1.5 rounded-2xl text-pink-400 text-xs font-extrabold font-mono">
                  <span>{partnerCuratedIds.length} peça{partnerCuratedIds.length !== 1 ? 's' : ''} selecionada{partnerCuratedIds.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Generated Link Bar & Quick Share Buttons */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase bg-pink-600/15 border border-pink-500/25 text-pink-400 px-2.5 py-0.5 rounded-full tracking-wider">
                    Link Direto da Sua Seleção
                  </span>
                  {partnerCuratedIds.length > 0 && (
                    <button 
                      onClick={() => setPartnerCuratedIds([])}
                      className="text-[10px] text-slate-500 hover:text-rose-400 font-bold transition cursor-pointer"
                    >
                      Limpar Seleção
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={curatedSelectionLink}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-slate-200 text-xs focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleCopyCuratedLink}
                    className="py-3 px-4 bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs rounded-xl transition cursor-pointer border-none shrink-0 flex items-center gap-1.5"
                    title="Copiar Link da Seleção"
                  >
                    {copiedCuratedLink ? <Check size={14} className="text-white" /> : <Copy size={14} />}
                    <span>{copiedCuratedLink ? 'Copiado! ✓' : 'Copiar Link'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href={curatedWhatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer border-none"
                  >
                    <Send size={13} />
                    <span>Compartilhar Seleção no WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `Seleção de Produtos | ${currentPartner.name}`,
                          text: curatedShareText,
                          url: curatedSelectionLink
                        }).catch(() => {});
                      } else {
                        handleCopyCuratedLink();
                      }
                    }}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer border-none"
                  >
                    <Share2 size={13} />
                    <span>Outras Redes (Instagram / Telegram)</span>
                  </button>
                </div>
              </div>

              {/* Product Selector Catalog Filter */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                    Selecione as Peças do Catálogo Oficial:
                  </h4>
                  
                  <div className="relative w-full sm:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Buscar por nome ou código..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-pink-500 font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
                  {allProductsList
                    .filter(p => {
                      if (!productSearchTerm.trim()) return true;
                      const term = productSearchTerm.toLowerCase();
                      return p.name.toLowerCase().includes(term) || (p.category && p.category.toLowerCase().includes(term)) || (p.sku && p.sku.toLowerCase().includes(term));
                    })
                    .map(p => {
                      const isSelected = partnerCuratedIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleProductInCuratedList(p.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 select-none
                            ${isSelected 
                              ? 'bg-pink-950/40 border-pink-500/80 shadow-md shadow-pink-500/10' 
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                        >
                          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 relative">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-600 text-[10px] font-bold">Sem Foto</div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-xs font-extrabold text-white truncate">{p.name}</p>
                            <p className="text-[10px] text-pink-400 font-bold font-mono">
                              R$ {p.price.toFixed(2).replace('.', ',')}
                            </p>
                            <span className="text-[9px] text-slate-500 font-medium truncate block">
                              {p.category || 'Moda Fitness'}
                            </span>
                          </div>

                          <div className="shrink-0 text-slate-400">
                            {isSelected ? (
                              <CheckSquare size={18} className="text-pink-500" />
                            ) : (
                              <Square size={18} className="text-slate-700" />
                            )}
                          </div>
                        </div>
                      );
                    })}
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

      {/* Retroactive / Posthumous Sale Addition Modal */}
      {isRetroModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 text-slate-100 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-pink-600/20 text-pink-400 rounded-2xl border border-pink-500/30">
                  <Tag size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Lançar / Vincular Venda Pós-Fechada</h3>
                  <p className="text-xs text-slate-400">Adicione ou vincule vendas retroativas para <strong className="text-pink-400">{currentPartner.name}</strong></p>
                </div>
              </div>
              <button
                onClick={() => { setIsRetroModalOpen(false); setRetroSuccessMsg(''); }}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Notification alert */}
            {retroSuccessMsg && (
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle size={16} className="shrink-0" />
                <span>{retroSuccessMsg}</span>
              </div>
            )}

            {/* Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-2xl mt-4 border border-slate-800 text-xs font-bold">
              <button
                onClick={() => setRetroTab('system')}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${retroTab === 'system' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Search size={13} />
                <span>Buscar em Vendas do Sistema</span>
              </button>
              <button
                onClick={() => setRetroTab('manual')}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${retroTab === 'manual' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Plus size={13} />
                <span>Cadastrar Lançamento Direto</span>
              </button>
            </div>

            {/* Tab 1: System Sales Search */}
            {retroTab === 'system' && (
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar por nome do cliente, número do pedido ou valor..."
                    value={retroSearch}
                    onChange={(e) => setRetroSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {(() => {
                    const allCandidates: { item: any; isOnline: boolean }[] = [];
                    if (Array.isArray(sales)) {
                      sales.forEach(s => {
                        if (s.status !== 'Cancelada') allCandidates.push({ item: s, isOnline: false });
                      });
                    }
                    if (Array.isArray(onlineOrders)) {
                      onlineOrders.forEach(o => {
                        if (o.status !== 'Cancelado') allCandidates.push({ item: o, isOnline: true });
                      });
                    }

                    const query = retroSearch.toLowerCase().trim();
                    const filtered = allCandidates.filter(({ item }) => {
                      if (!query) return true;
                      const cName = (item.clientName || item.customerName || '').toLowerCase();
                      const sId = (item.id || '').toLowerCase();
                      const totalStr = (item.total || item.amount || '').toString();
                      return cName.includes(query) || sId.includes(query) || totalStr.includes(query);
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="py-8 text-center text-slate-500 text-xs italic">
                          Nenhuma venda do sistema encontrada com os termos informados.
                        </div>
                      );
                    }

                    return filtered.slice(0, 15).map(({ item, isOnline }) => {
                      const isAlreadyPartner = partnerSales.some(ps => ps.id === item.id);
                      const totalVal = Number(item.total || item.amount || 0);
                      const dateStr = item.date ? item.date.split('T')[0] : (item.createdAt ? item.createdAt.split('T')[0] : '');

                      return (
                        <div key={item.id} className="p-3 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-between hover:border-slate-700 transition-all">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-bold text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded">
                                #{item.id}
                              </span>
                              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-semibold">
                                {isOnline ? 'Site / Online' : 'Loja Física'}
                              </span>
                              <span className="text-[10px] text-slate-500">{dateStr}</span>
                            </div>
                            <p className="text-xs font-bold text-slate-200">{item.clientName || item.customerName || 'Cliente'}</p>
                            <p className="text-[11px] font-mono text-emerald-400 font-bold">
                              R$ {totalVal.toFixed(2)}
                            </p>
                          </div>

                          <div>
                            {isAlreadyPartner ? (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl flex items-center gap-1">
                                <CheckCircle size={12} />
                                Já Vinculado
                              </span>
                            ) : (
                              <button
                                onClick={() => handleLinkExistingSale(item, isOnline)}
                                className="bg-pink-600 hover:bg-pink-500 text-white font-bold text-[11px] px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <Plus size={12} />
                                Vincular
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Tab 2: Manual Direct Entry */}
            {retroTab === 'manual' && (
              <form onSubmit={handleSaveManualSale} className="mt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Nome do Cliente *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Patrícia Cardoso ou Cliente Indicação"
                      value={manualClientName}
                      onChange={(e) => setManualClientName(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Valor Total da Venda (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Ex: 299.90"
                      value={manualTotal}
                      onChange={(e) => setManualTotal(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Data da Venda</label>
                    <input
                      type="date"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Nº do Pedido / Identificador (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: PED-9821 ou Comprovante Pix"
                      value={manualOrderNum}
                      onChange={(e) => setManualOrderNum(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Canal de Origem</label>
                    <select
                      value={manualChannel}
                      onChange={(e) => setManualChannel(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
                    >
                      <option value="Cupom / Link de Afiliado">Cupom / Link de Afiliado</option>
                      <option value="Indicação Direta WhatsApp">Indicação Direta WhatsApp</option>
                      <option value="Venda Presencial Balcão">Venda Presencial Balcão</option>
                      <option value="Instagram Direct">Instagram Direct</option>
                      <option value="Outro Canal">Outro Canal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Observações / Detalhes</label>
                    <input
                      type="text"
                      placeholder="Ex: Pedido fechado pós-atendimento via link"
                      value={manualNotes}
                      onChange={(e) => setManualNotes(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRetroModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-lg transition-all"
                  >
                    💾 Salvar Lançamento Retroativo
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      </div>

    </div>
  );
}
