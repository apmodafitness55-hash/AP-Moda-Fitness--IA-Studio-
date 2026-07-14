/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  Calendar, 
  Award, 
  Star,
  Instagram,
  Compass,
  Laptop,
  Store,
  MessageCircle,
  Eye,
  TrendingUp,
  Coins,
  ArrowRight,
  Sparkles,
  ClipboardList,
  Edit,
  Trash2,
  Gift,
  Zap,
  Save,
  Check,
  X
} from 'lucide-react';
import { Client, Sale, SalesChannel } from '../types';

export function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  let sum = 0;
  let remainder;
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
  return true;
}

interface CustomersCRMProps {
  clients: Client[];
  sales: Sale[];
  onAddClient: (newClient: Client) => void;
  onUpdateClients?: (updatedList: Client[]) => void;
  currentUser?: any;
  activeSubTab?: 'diretorio' | 'funil' | 'followup' | 'parceiros' | 'fidelidade';
  setActiveSubTab?: (subTab: 'diretorio' | 'funil' | 'followup' | 'parceiros' | 'fidelidade') => void;
  teamMembers?: any[];
  onUpdateTeamMembers?: (updatedList: any[]) => void;
}

interface Opportunity {
  id: string;
  clientName: string;
  value: number;
  probability: number; // e.g. 80 (%)
  stage: 'Prospecção' | 'Foto Enviada' | 'Prova / Reserva' | 'Fechado';
  itemInteresse: string;
  notes?: string;
}

interface FollowUp {
  id: string;
  clientName: string;
  channel: 'WhatsApp' | 'Instagram' | 'Call' | 'E-mail';
  date: string;
  notes: string;
  completed: boolean;
}

interface Partner {
  id: string;
  name: string;
  instagram: string;
  couponCode: string;
  commissionRate: number; // percentage, e.g. 10 (%)
  salesCount: number;
  totalGenerated: number;
}

export default function CustomersCRM({ 
  clients: rawClients, 
  sales: rawSales, 
  onAddClient, 
  onUpdateClients,
  currentUser,
  activeSubTab: propActiveSubTab,
  setActiveSubTab: propSetActiveSubTab,
  teamMembers: rawTeamMembers = [],
  onUpdateTeamMembers
}: CustomersCRMProps) {
  const clients = Array.isArray(rawClients) ? rawClients : [];
  const sales = Array.isArray(rawSales) ? rawSales : [];
  const teamMembers = Array.isArray(rawTeamMembers) ? rawTeamMembers : [];

  const [internalActiveSubTab, setInternalActiveSubTab] = useState<'diretorio' | 'funil' | 'followup' | 'parceiros' | 'fidelidade'>('diretorio');
  const activeSubTab = propActiveSubTab || internalActiveSubTab;
  const setActiveSubTab = propSetActiveSubTab || setInternalActiveSubTab;
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClientDetail, setSelectedClientDetail] = useState<Client | null>(null);

  // Editing state
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form states for adding or editing
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCpf, setNewCpf] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('');
  const [newChannel, setNewChannel] = useState<SalesChannel>('Instagram');
  const [newNps, setNewNps] = useState<number>(10);
  const [newBusto, setNewBusto] = useState<string>('');
  const [newCintura, setNewCintura] = useState<string>('');
  const [newQuadril, setNewQuadril] = useState<string>('');
  const [newCoxa, setNewCoxa] = useState<string>('');
  const [newAltura, setNewAltura] = useState<string>('');
  const [newPeso, setNewPeso] = useState<string>('');
  const [newVip, setNewVip] = useState<boolean>(false);

  // Interactive CRM states
  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => {
    try {
      const saved = localStorage.getItem('ap_moda_opportunities');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [followups, setFollowups] = useState<FollowUp[]>(() => {
    try {
      const saved = localStorage.getItem('ap_moda_followups');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Cashback config and manual adjust states
  const [cashbackRateConfig, setCashbackRateConfig] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ap_moda_cashback_rate');
      return saved ? parseFloat(saved) : 5;
    } catch (e) {
      return 5;
    }
  });

  const [adjustingClient, setAdjustingClient] = useState<Client | null>(null);
  const [adjustValue, setAdjustValue] = useState<string>('');

  const handleSaveCashbackRateConfig = (rate: number) => {
    setCashbackRateConfig(rate);
    try {
      localStorage.setItem('ap_moda_cashback_rate', rate.toString());
    } catch (e) {}
  };

  const handleSaveCashbackAdjustment = () => {
    if (!adjustingClient) return;
    const value = parseFloat(adjustValue);
    if (isNaN(value) || value < 0) {
      alert('Por favor, informe um valor numérico válido maior ou igual a zero.');
      return;
    }
    const updated = clients.map(c => {
      if (c.id === adjustingClient.id) {
        return { ...c, cashbackBalance: value };
      }
      return c;
    });
    if (onUpdateClients) {
      onUpdateClients(updated);
    }
    setAdjustingClient(null);
    setAdjustValue('');
  };

  // Birthday Automation States
  const [fidelidadeSubSection, setFidelidadeSubSection] = useState<'cashback' | 'aniversarios'>(() => {
    try {
      const saved = localStorage.getItem('ap_fidelidade_subsection');
      return (saved as any) || 'cashback';
    } catch (e) {
      return 'cashback';
    }
  });

  const [birthdayCouponDiscount, setBirthdayCouponDiscount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ap_birth_coupon_discount');
      return saved ? parseInt(saved) : 15;
    } catch (e) {
      return 15;
    }
  });

  const [birthdayCouponValidityDays, setBirthdayCouponValidityDays] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ap_birth_coupon_validity_days');
      return saved ? parseInt(saved) : 7;
    } catch (e) {
      return 7;
    }
  });

  const [birthdayAutoSend, setBirthdayAutoSend] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ap_birth_auto_send');
      return saved !== 'false';
    } catch (e) {
      return true;
    }
  });

  const [birthdayClientTemplate, setBirthdayClientTemplate] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('ap_birth_client_template');
      return saved || 'Olá, {NOME}! 🥳✨ Nós da AP Moda Fitness te desejamos um aniversário maravilhoso de muita luz! Para comemorar, aqui está um presente especial preparado com muito carinho: seu cupom exclusivo de {DESCONTO}% de desconto para usar nos próximos {VALIDADE} dias no site ou Loja Física:\n\n👉 Cupom: {CUPOM}\n\nQue seu dia seja repleto de energia e realizações! Parabéns! 🎂🎈';
    } catch (e) {
      return 'Olá, {NOME}! 🥳✨ Nós da AP Moda Fitness te desejamos um aniversário maravilhoso de muita luz! Para comemorar, aqui está um presente especial preparado com muito carinho: seu cupom exclusivo de {DESCONTO}% de desconto para usar nos próximos {VALIDADE} dias no site ou Loja Física:\n\n👉 Cupom: {CUPOM}\n\nQue seu dia seja repleto de energia e realizações! Parabéns! 🎂🎈';
    }
  });

  const [birthdayStaffTemplate, setBirthdayStaffTemplate] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('ap_birth_staff_template');
      return saved || 'Querido(a) colaborador(a) {NOME}! 🎈✨ Toda a equipe da AP Moda Fitness está em festa hoje celebrando o seu aniversário! Agradecemos imensamente pela sua dedicação, energia contagiante e parceria de sucesso diária no nosso time. Que este novo ano seja marcante, cheio de saúde, conquistas e alegrias! Parabéns de toda a família AP! 🎂🎉';
    } catch (e) {
      return 'Querido(a) colaborador(a) {NOME}! 🎈✨ Toda a equipe da AP Moda Fitness está em festa hoje celebrando o seu aniversário! Agradecemos imensamente pela sua dedicação, energia contagiante e parceria de sucesso diária no nosso time. Que este novo ano seja marcante, cheio de saúde, conquistas e alegrias! Parabéns de toda a família AP! 🎂🎉';
    }
  });

  // Tracking which automated birthday greetings have been "sent" this session
  const [congratulationsLog, setCongratulationsLog] = useState<Record<string, { type: 'client' | 'staff', sentAt: string, couponCode?: string }>>(() => {
    try {
      const saved = localStorage.getItem('ap_birthday_congrats_log_sent');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const saveFidelidadeSubSection = (sub: 'cashback' | 'aniversarios') => {
    setFidelidadeSubSection(sub);
    try {
      localStorage.setItem('ap_fidelidade_subsection', sub);
    } catch (e) {}
  };

  const handleSaveBirthdayConfig = () => {
    try {
      localStorage.setItem('ap_birth_coupon_discount', birthdayCouponDiscount.toString());
      localStorage.setItem('ap_birth_coupon_validity_days', birthdayCouponValidityDays.toString());
      localStorage.setItem('ap_birth_auto_send', birthdayAutoSend ? 'true' : 'false');
      localStorage.setItem('ap_birth_client_template', birthdayClientTemplate);
      localStorage.setItem('ap_birth_staff_template', birthdayStaffTemplate);
      alert('Configurações de automação de aniversário salvas com sucesso!');
    } catch (e) {
      alert('Erro ao salvar as configurações.');
    }
  };

  const markCongratsAsSent = (id: string, type: 'client' | 'staff', couponCode?: string) => {
    const updated = {
      ...congratulationsLog,
      [id]: { type, sentAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), couponCode }
    };
    setCongratulationsLog(updated);
    try {
      localStorage.setItem('ap_birthday_congrats_log_sent', JSON.stringify(updated));
    } catch (e) {}
  };

  const parseBirthDayAndMonth = (dateStr?: string): { day: number; month: number } | null => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const clean = dateStr.trim();
    if (!clean) return null;

    // Case 1: YYYY-MM-DD
    if (clean.includes('-')) {
      const parts = clean.split('-');
      if (parts.length >= 3) {
        const month = parseInt(parts[1]);
        const day = parseInt(parts[2]);
        if (!isNaN(day) && !isNaN(month)) {
          return { day, month };
        }
      } else if (parts.length === 2) {
        // MM-DD
        const month = parseInt(parts[0]);
        const day = parseInt(parts[1]);
        if (!isNaN(day) && !isNaN(month)) {
          return { day, month };
        }
      }
    }

    // Case 2: DD/MM/YYYY or DD/MM
    if (clean.includes('/')) {
      const parts = clean.split('/');
      if (parts.length >= 2) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        if (!isNaN(day) && !isNaN(month)) {
          return { day, month };
        }
      }
    }

    return null;
  };

  const getAnniversaryStatus = (day: number, month: number) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Birthday in current year
    let bdate = new Date(today.getFullYear(), month - 1, day);
    
    // Calculate difference in days
    const diffMs = bdate.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return { isToday: true, isUpcoming: false, daysRemaining: 0, text: 'Hoje! 🎉' };
    }
    if (diffDays > 0 && diffDays <= 7) {
      return { isToday: false, isUpcoming: true, daysRemaining: diffDays, text: `Em ${diffDays} dias ⏳` };
    }
    if (diffDays < 0 && diffDays >= -2) {
      return { isToday: false, isUpcoming: true, daysRemaining: diffDays, text: `Passou há ${Math.abs(diffDays)} dias 💝` };
    }
    
    return null;
  };

  // Generate dynamic coupon code
  const getBirthdayCouponCode = (clientName: string) => {
    const firstName = clientName.trim().split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '');
    return `NIVER-${firstName || 'VIP'}-${birthdayCouponDiscount}`;
  };

  // Get compiled message template
  const getCompiledTemplate = (type: 'client' | 'staff', name: string, couponCode?: string) => {
    const firstName = name.trim().split(' ')[0];
    const template = type === 'client' ? birthdayClientTemplate : birthdayStaffTemplate;
    
    return template
      .replace(/{NOME}/g, firstName)
      .replace(/{CUPOM}/g, couponCode || '')
      .replace(/{DESCONTO}/g, birthdayCouponDiscount.toString())
      .replace(/{VALIDADE}/g, birthdayCouponValidityDays.toString());
  };

  // Trigger dispatch simulation
  const handleTriggerDispatch = (id: string, type: 'client' | 'staff', name: string, phone: string, couponCode?: string) => {
    const textMsg = getCompiledTemplate(type, name, couponCode);
    const phoneClean = (phone || '').replace(/\D/g, '');
    const encoded = encodeURIComponent(textMsg);
    
    // Mark as sent in local state log
    markCongratsAsSent(id, type, couponCode);
    
    // Trigger window open for manual dispatch
    const url = `https://api.whatsapp.com/send?${phoneClean ? `phone=55${phoneClean}&` : ''}text=${encoded}`;
    window.open(url, '_blank');
    
    // Custom notification trigger event to App.tsx or general notification popup
    const customEvent = new CustomEvent('ap-show-notification', {
      detail: {
        title: type === 'client' ? 'Cupom & Parabéns Enviado! 🎂' : 'Congratulações Colaborador! 💼',
        desc: `Mensagem enviada com sucesso no canal WhatsApp para ${name}.`,
        type: 'success'
      }
    });
    window.dispatchEvent(customEvent);
  };

  const [partners, setPartners] = useState<Partner[]>(() => {
    try {
      const saved = localStorage.getItem('ap_moda_partners');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem('ap_moda_partners', JSON.stringify(partners));
  }, [partners]);

  // Form states for new Opportunity
  const [opClient, setOpClient] = useState('');
  const [opVal, setOpVal] = useState(150);
  const [opProb, setOpProb] = useState(70);
  const [opItem, setOpItem] = useState('');
  const [opNotes, setOpNotes] = useState('');

  // Edit states for Opportunity
  const [editingOpportunityId, setEditingOpportunityId] = useState<string | null>(null);
  const [editOpClient, setEditOpClient] = useState('');
  const [editOpVal, setEditOpVal] = useState(150);
  const [editOpProb, setEditOpProb] = useState(70);
  const [editOpItem, setEditOpItem] = useState('');
  const [editOpNotes, setEditOpNotes] = useState('');
  const [editOpStage, setEditOpStage] = useState<Opportunity['stage']>('Prospecção');

  // Auto-sync local state back to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ap_moda_opportunities', JSON.stringify(opportunities));
    } catch (e) {}
  }, [opportunities]);

  useEffect(() => {
    try {
      localStorage.setItem('ap_moda_followups', JSON.stringify(followups));
    } catch (e) {}
  }, [followups]);

  // Form states for new Follow-up
  const [fClient, setFClient] = useState('');
  const [fChannel, setFChannel] = useState<'WhatsApp' | 'Instagram' | 'Call' | 'E-mail'>('WhatsApp');
  const [fDate, setFDate] = useState('2026-06-14');
  const [fNotes, setFNotes] = useState('');

  // Form states for new Partner
  const [partName, setPartName] = useState('');
  const [partInsta, setPartInsta] = useState('');
  const [partCoupon, setPartCoupon] = useState('');
  const [partRate, setPartRate] = useState(10);

  // CRM Analytics computations
  const averageNpsScore = useMemo(() => {
    const list = clients.map(c => c.npsScore || 10);
    if (list.length === 0) return 9.8;
    return Number((list.reduce((sum, val) => sum + val, 0) / list.length).toFixed(1));
  }, [clients]);

  const totalRevenueOpportunities = useMemo(() => {
    return opportunities
      .filter(o => o.stage !== 'Fechado')
      .reduce((sum, o) => sum + o.value, 0);
  }, [opportunities]);

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.cpf && c.cpf.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [clients, searchQuery]);

  const clientPurchaseHistory = useMemo(() => {
    if (!selectedClientDetail) return [];
    return sales.filter(s => s.clientName.toLowerCase() === selectedClientDetail.name.toLowerCase());
  }, [selectedClientDetail, sales]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      alert('Nome e Telefone da cliente são obrigatórios!');
      return;
    }

    if (newCpf.trim() && !validateCPF(newCpf)) {
      alert('O CPF informado é inválido. Por favor, digite um CPF válido ou deixe o campo em branco.');
      return;
    }

    if (editingClient) {
      // Simulate/trigger editing of localized elements
      editingClient.name = newName.trim();
      editingClient.email = newEmail.trim() || 'cliente@exemplo.com';
      editingClient.phone = newPhone.trim();
      editingClient.cpf = newCpf.trim() || undefined;
      editingClient.birthDate = newBirthDate.trim() || undefined;
      editingClient.channel = newChannel;
      editingClient.npsScore = newNps;
      
      // Save measurements
      editingClient.busto = newBusto ? parseFloat(newBusto) : undefined;
      editingClient.cintura = newCintura ? parseFloat(newCintura) : undefined;
      editingClient.quadril = newQuadril ? parseFloat(newQuadril) : undefined;
      editingClient.coxa = newCoxa ? parseFloat(newCoxa) : undefined;
      editingClient.altura = newAltura ? parseFloat(newAltura) : undefined;
      editingClient.peso = newPeso ? parseFloat(newPeso) : undefined;
      editingClient.vip = newVip;
      
      alert('Dados da cliente atualizados com sucesso no CRM!');
      setEditingClient(null);
    } else {
      const newClient: Client = {
        id: `cli-${Date.now()}`,
        name: newName.trim(),
        email: newEmail.trim() || 'cliente@exemplo.com',
        phone: newPhone.trim(),
        cpf: newCpf.trim() || undefined,
        birthDate: newBirthDate.trim() || undefined,
        channel: newChannel,
        npsScore: newNps,
        totalSpent: 0,
        ordersCount: 0,
        createdAt: new Date().toISOString(),
        vip: newVip,
        
        // Save measurements
        busto: newBusto ? parseFloat(newBusto) : undefined,
        cintura: newCintura ? parseFloat(newCintura) : undefined,
        quadril: newQuadril ? parseFloat(newQuadril) : undefined,
        coxa: newCoxa ? parseFloat(newCoxa) : undefined,
        altura: newAltura ? parseFloat(newAltura) : undefined,
        peso: newPeso ? parseFloat(newPeso) : undefined
      };
      onAddClient(newClient);
      alert('Nova cliente adicionada com sucesso no diretório!');
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setNewName(client.name);
    setNewEmail(client.email);
    setNewPhone(client.phone);
    setNewCpf(client.cpf || '');
    setNewBirthDate(client.birthDate || '');
    setNewChannel(client.channel);
    setNewNps(client.npsScore || 10);
    setNewVip(!!client.vip);
    
    // Set measurements edit
    setNewBusto(client.busto ? String(client.busto) : '');
    setNewCintura(client.cintura ? String(client.cintura) : '');
    setNewQuadril(client.quadril ? String(client.quadril) : '');
    setNewCoxa(client.coxa ? String(client.coxa) : '');
    setNewAltura(client.altura ? String(client.altura) : '');
    setNewPeso(client.peso ? String(client.peso) : '');
    
    setIsAddModalOpen(true);
  };

  const resetForm = () => {
    setEditingClient(null);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewCpf('');
    setNewBirthDate('');
    setNewChannel('Instagram');
    setNewNps(10);
    setNewVip(false);
    
    // Reset measurements
    setNewBusto('');
    setNewCintura('');
    setNewQuadril('');
    setNewCoxa('');
    setNewAltura('');
    setNewPeso('');
  };

  // Funnel operations
  const moveOpportunity = (id: string, currentStage: Opportunity['stage']) => {
    const stages: Opportunity['stage'][] = ['Prospecção', 'Foto Enviada', 'Prova / Reserva', 'Fechado'];
    const nextIdx = stages.indexOf(currentStage) + 1;
    if (nextIdx >= stages.length) return;

    setOpportunities(prev => prev.map(o => {
      if (o.id === id) {
        return { ...o, stage: stages[nextIdx], probability: stages[nextIdx] === 'Fechado' ? 100 : Math.min(95, o.probability + 15) };
      }
      return o;
    }));
  };

  const startEditOpportunity = (op: Opportunity) => {
    setEditingOpportunityId(op.id);
    setEditOpClient(op.clientName);
    setEditOpVal(op.value);
    setEditOpProb(op.probability);
    setEditOpItem(op.itemInteresse);
    setEditOpNotes(op.notes || '');
    setEditOpStage(op.stage);
  };

  const handleSaveOpportunityEdit = () => {
    if (!editOpClient.trim()) {
      alert('Por favor, informe o nome da interessada.');
      return;
    }
    if (!editOpItem.trim()) {
      alert('Por favor, informe a peça de interesse.');
      return;
    }

    setOpportunities(prev => prev.map(o => {
      if (o.id === editingOpportunityId) {
        return {
          ...o,
          clientName: editOpClient,
          value: Number(editOpVal),
          probability: Number(editOpProb),
          stage: editOpStage,
          itemInteresse: editOpItem,
          notes: editOpNotes
        };
      }
      return o;
    }));

    setEditingOpportunityId(null);
    alert('Oportunidade atualizada com sucesso!');
  };

  const handleDeleteOpportunity = (id: string, name: string) => {
    if (confirm(`Tem certeza de que deseja excluir a oportunidade de ${name} do funil de vendas?`)) {
      setOpportunities(prev => prev.filter(o => o.id !== id));
      alert('Oportunidade excluída com sucesso!');
    }
  };

  const handleCreateOpportunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opClient || !opItem) return;

    const newOp: Opportunity = {
      id: `op-${Date.now().toString().slice(-4)}`,
      clientName: opClient,
      value: Number(opVal),
      probability: Number(opProb),
      stage: 'Prospecção',
      itemInteresse: opItem,
      notes: opNotes
    };

    setOpportunities(prev => [newOp, ...prev]);
    setOpClient('');
    setOpItem('');
    setOpNotes('');
    alert('Nova Oportunidade inserida com sucesso no Funil Comercial!');
  };

  // Follow up ops
  const handleCreateFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fClient || !fNotes) return;

    const newF: FollowUp = {
      id: `fup-${Date.now()}`,
      clientName: fClient,
      channel: fChannel,
      date: fDate,
      notes: fNotes,
      completed: false
    };

    setFollowups(prev => [newF, ...prev]);
    setFClient('');
    setFNotes('');
    alert('Follow-up agendado com sucesso para a vendedora!');
  };

  // Partner ops
  const handleCreatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName || !partCoupon) return;

    const newP: Partner = {
      id: `part-${Date.now()}`,
      name: partName,
      instagram: partInsta || '@insta_parceira',
      couponCode: partCoupon.trim().toUpperCase(),
      commissionRate: Number(partRate),
      salesCount: 0,
      totalGenerated: 0
    };

    setPartners(prev => [newP, ...prev]);
    setPartName('');
    setPartInsta('');
    setPartCoupon('');
    alert('Nova influenciadora cadastrada! Suas vendas vinculadas gerarão comissão.');
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6">
      
      {/* Title & CRM Metrics Row */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-sans text-slate-800 tracking-tight">CRM, Funil e Parcerias</h2>
          <p className="text-slate-400 text-sm">Estruture o funil comercial da AP Moda Fitness, controle os follow-ups agendados e comissions das influenciadoras</p>
        </div>

        {/* CRM quick KPI pills */}
        <div className="flex gap-2">
          <div className="bg-white border border-slate-100 rounded-xl px-4 py-2 flex items-center gap-2.5 shadow-xs text-xs font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <div className="text-left leading-none">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Prospecções Ativas</span>
              <p className="text-sm font-bold text-slate-800 tracking-tight mt-0.5">{opportunities.filter(o => o.stage !== 'Fechado').length} Leads</p>
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-xl px-4 py-2 flex items-center gap-2.5 shadow-xs text-xs font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
            <div className="text-left leading-none">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Média Geral NPS</span>
              <p className="text-sm font-bold text-slate-800 tracking-tight mt-0.5">{averageNpsScore}/10 Estrela</p>
            </div>
          </div>
        </div>
      </div>

      {/* CRM Sub-navigation Tabs */}
      <div className="flex border-b border-slate-100">
        <button
          type="button"
          onClick={() => setActiveSubTab('diretorio')}
          className={`px-4 py-2.5 font-sans text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer
            ${activeSubTab === 'diretorio' 
              ? 'border-pink-600 text-pink-600' 
              : 'border-transparent text-slate-450 hover:text-slate-700'}`}
        >
          <Users size={14} />
          <span>Fichário de Clientes</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('funil')}
          className={`px-4 py-2.5 font-sans text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer
            ${activeSubTab === 'funil' 
              ? 'border-pink-600 text-pink-600' 
              : 'border-transparent text-slate-450 hover:text-slate-700'}`}
        >
          <TrendingUp size={14} />
          <span>Funil de Vendas Kanban</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('followup')}
          className={`px-4 py-2.5 font-sans text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer
            ${activeSubTab === 'followup' 
              ? 'border-pink-600 text-pink-600' 
              : 'border-transparent text-slate-450 hover:text-slate-700'}`}
        >
          <Calendar size={14} />
          <span>Follow-up & Agendamentos</span>
        </button>
        {currentUser?.role !== 'Vendedor' && (
          <button
            type="button"
            onClick={() => setActiveSubTab('parceiros')}
            className={`px-4 py-2.5 font-sans text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer
              ${activeSubTab === 'parceiros' 
                ? 'border-pink-600 text-pink-600' 
                : 'border-transparent text-slate-450 hover:text-slate-705'}`}
          >
            <Award size={14} />
            <span>Influenciadoras & Parceiros</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setActiveSubTab('fidelidade')}
          className={`px-4 py-2.5 font-sans text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer
            ${activeSubTab === 'fidelidade' 
              ? 'border-pink-600 text-pink-600' 
              : 'border-transparent text-slate-450 hover:text-slate-705'}`}
        >
          <Coins size={14} />
          <span>Fidelidade & Cashback</span>
        </button>
      </div>

      {/* Tab 1: Fichário de Clientes */}
      {activeSubTab === 'diretorio' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
            {/* Search client input */}
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={16} />
              </span>
              <input 
                id="crm-search-input"
                type="text"
                placeholder="Buscar cliente por nome, e-mail ou número de telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-sans text-slate-700 focus:outline-hidden"
              />
            </div>
            
            <button 
              type="button"
              id="add-client-modal-btn"
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 bg-pink-600 hover:bg-pink-700 font-sans font-medium text-white rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={15} />
              <span>Cadastrar Cliente</span>
            </button>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wider select-none">
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Contato</th>
                    <th className="p-4">Canal Cadastrado</th>
                    <th className="p-4 text-center">Score NPS</th>
                    <th className="p-4 text-right">Faturamento Total</th>
                    <th className="p-4 text-center">Pedidos</th>
                    <th className="p-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-650">
                  {filteredClients.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-600 font-bold flex items-center justify-center text-[10px]">
                            {c.name.split(' ')[0][0]}{c.name.split(' ').slice(-1)[0] ? c.name.split(' ').slice(-1)[0][0] : ''}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 text-xs block leading-tight">{c.name}</span>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] text-slate-400 font-normal font-mono">ID: {c.id.substring(0,8).toUpperCase()}</span>
                              {c.vip && (
                                <span className="bg-amber-100 text-amber-800 border border-amber-200 px-1 py-0.2 rounded text-[9px] font-sans font-extrabold leading-none shrink-0 uppercase tracking-wider flex items-center gap-0.5" title="Membro VIP">
                                  👑 VIP
                                </span>
                              )}
                              {c.cpf && (
                                <span className="bg-slate-100 text-slate-650 border border-slate-200 px-1 py-0.2 rounded text-[9px] font-mono font-bold leading-none shrink-0" title={`CPF: ${c.cpf}`}>
                                  {c.cpf}
                                </span>
                              )}
                              {c.birthDate && (
                                <span className="bg-pink-50 text-pink-600 border border-pink-100 px-1 py-0.2 rounded text-[9px] font-mono font-bold leading-none shrink-0" title={`Aniversário: ${c.birthDate}`}>
                                  🎂 {c.birthDate}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Phone size={11} className="text-slate-400 shrink-0" />
                          <span className="font-mono">{c.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <Mail size={11} className="text-slate-350 shrink-0" />
                          <span className="truncate max-w-[130px]">{c.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded text-[10px] font-sans font-medium text-slate-600">
                          {getChannelIcon(c.channel)}
                          <span>{c.channel}</span>
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1 bg-amber-50/50 border border-amber-100 text-amber-600 font-bold font-mono px-2 py-0.5 rounded text-[10px]">
                          <Star size={10} fill="currentColor" />
                          <span>{c.npsScore !== undefined ? c.npsScore : '10'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-slate-850">{formatCurrency(c.totalSpent)}</td>
                      <td className="p-4 text-center font-mono font-bold text-slate-650">{c.ordersCount} compra(s)</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button 
                            type="button"
                            onClick={() => setSelectedClientDetail(c)}
                            className="p-1 px-2 text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded-lg font-bold font-sans text-[10px] transition"
                          >
                            <Eye size={12} className="inline mr-1" />
                            <span>Histórico</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="p-1 text-slate-450 hover:text-slate-800 rounded hover:bg-slate-100 transition"
                            title="Editar Dados"
                          >
                            <Edit size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Kanban Pipeline opportunities funnel */}
      {activeSubTab === 'funil' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs font-sans">
          
          {/* Form to insert opportunity */}
          <div className="lg:col-span-3 bg-white border border-slate-100 rounded-2xl p-4 shadow-xs height-fit space-y-4">
            <h3 className="font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-50 flex items-center gap-1">
              <Sparkles size={14} className="text-pink-600" />
              <span>Nova Oportunidade</span>
            </h3>

            <form onSubmit={handleCreateOpportunity} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Interessada (Designar)</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do Lead / Cliente"
                  value={opClient}
                  onChange={(e) => setOpClient(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Est. Peças (R$)</label>
                  <input
                    type="number"
                    value={opVal}
                    onChange={(e) => setOpVal(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Prob (%)</label>
                  <input
                    type="number"
                    value={opProb}
                    onChange={(e) => setOpProb(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Peça de Interesse</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Legging Sculp Wave"
                  value={opItem}
                  onChange={(e) => setOpItem(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Anotações rápidas</label>
                <textarea
                  rows={2}
                  placeholder="Ficou de vir provar"
                  value={opNotes}
                  onChange={(e) => setOpNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold transition rounded-lg"
              >
                Incluir no Funil
              </button>
            </form>
          </div>

          {/* Kanban board layout representation */}
          <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-4 gap-3">
            {(['Prospecção', 'Foto Enviada', 'Prova / Reserva', 'Fechado'] as Opportunity['stage'][]).map(stage => {
              const stageOps = opportunities.filter(o => o.stage === stage);
              const stageTot = stageOps.reduce((sum, o) => sum + o.value, 0);

              return (
                <div key={stage} className="bg-slate-50 rounded-2xl p-3 border border-slate-150 max-h-96 overflow-y-auto flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2 border-b border-slate-200 pb-1.5 font-bold uppercase tracking-wide">
                      <span className="text-slate-800 text-[10px]">{stage}</span>
                      <span className="bg-slate-200 text-slate-650 px-2 py-0.5 rounded-full text-[9px]">{stageOps.length}</span>
                    </div>

                    <div className="space-y-2">
                      {stageOps.map(op => (
                        <div key={op.id} className="bg-white p-3 rounded-xl border border-slate-100 hover:shadow-xs transition relative pr-14">
                          <p className="font-bold text-slate-800 truncate mb-1">{op.clientName}</p>
                          <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                            <button
                              type="button"
                              onClick={() => startEditOpportunity(op)}
                              title="Editar Oportunidade"
                              className="p-1 text-slate-400 hover:text-pink-600 rounded-md hover:bg-pink-50 transition-colors cursor-pointer"
                            >
                              <Edit size={10} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteOpportunity(op.id, op.clientName)}
                              title="Excluir Oportunidade"
                              className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>

                          <p className="font-medium text-pink-600 text-[10px] mb-1.5 truncate">{op.itemInteresse}</p>
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span>Prob: <strong className="text-slate-600">{op.probability}%</strong></span>
                            <span className="font-bold font-mono text-slate-700">{formatCurrency(op.value)}</span>
                          </div>
                          {op.notes && <p className="text-[9px] text-slate-400 mt-2 bg-slate-50/50 p-1.5 rounded border border-slate-100 leading-tight">📝 {op.notes}</p>}

                          {/* Quick transition trigger */}
                          {stage !== 'Fechado' && (
                            <button
                              type="button"
                              onClick={() => moveOpportunity(op.id, op.stage)}
                              className="w-full mt-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded text-[9px] font-bold text-slate-600 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                              <span>Avançar Etapa</span>
                              <ArrowRight size={10} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 text-right font-mono font-bold text-slate-750">
                    <span className="text-[10px] text-slate-400 mr-1.5">Soma:</span>
                    <span>{formatCurrency(stageTot)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* EDIT OPPORTUNITY MODAL */}
          {editingOpportunityId && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xl w-full max-w-md space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Edit size={14} className="text-pink-600" />
                    <span>Editar Oportunidade</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingOpportunityId(null)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Interessada (Cliente)</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2.5 focus:outline-hidden text-slate-800 font-medium font-sans"
                      value={editOpClient}
                      onChange={(e) => setEditOpClient(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Est. Peças (R$)</label>
                      <input
                        type="number"
                        className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2.5 focus:outline-hidden text-slate-800 font-medium font-sans"
                        value={editOpVal}
                        onChange={(e) => setEditOpVal(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Probabilidade (%)</label>
                      <input
                        type="number"
                        className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2.5 focus:outline-hidden text-slate-800 font-medium font-sans"
                        value={editOpProb}
                        onChange={(e) => setEditOpProb(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Peça de Interesse</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2.5 focus:outline-hidden text-slate-800 font-medium font-sans"
                      value={editOpItem}
                      onChange={(e) => setEditOpItem(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Etapa no Funil</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2.5 focus:outline-hidden text-slate-800 font-semibold cursor-pointer font-sans"
                      value={editOpStage}
                      onChange={(e) => setEditOpStage(e.target.value as any)}
                    >
                      <option value="Prospecção">Prospecção</option>
                      <option value="Foto Enviada">Foto Enviada</option>
                      <option value="Prova / Reserva">Prova / Reserva</option>
                      <option value="Fechado">Fechado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Anotações rápidas</label>
                    <textarea
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2.5 focus:outline-hidden text-slate-800 font-sans"
                      value={editOpNotes}
                      onChange={(e) => setEditOpNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingOpportunityId(null)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-150 text-slate-600 font-bold rounded-lg transition cursor-pointer font-sans"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveOpportunityEdit}
                    className="flex-1 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer font-sans"
                  >
                    <Save size={13} />
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Tab 3: Message Scheduling or Follow-up alerts */}
      {activeSubTab === 'followup' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs font-sans">
          
          {/* Scheduling Followup Form */}
          <div className="bg-white border border-slate-105 rounded-2xl p-4 shadow-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-50 flex items-center gap-1.5">
              <ClipboardList size={15} className="text-pink-600" />
              <span>Agendar Follow-up de Cliente</span>
            </h3>

            <form onSubmit={handleCreateFollowUp} className="space-y-4 pt-2">
              <div>
                <label className="block text-slate-405 font-semibold mb-1">Nome da Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Amanda Rezende"
                  value={fClient}
                  onChange={(e) => setFClient(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-405 font-semibold mb-1">Meio de Contato</label>
                  <select
                    value={fChannel}
                    onChange={(e: any) => setFChannel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden font-semibold"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Instagram">Instagram DM</option>
                    <option value="Call">Telefonar</option>
                    <option value="E-mail">E-mail</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-405 font-semibold mb-1">Data Agendada</label>
                  <input
                    type="date"
                    required
                    value={fDate}
                    onChange={(e) => setFDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-1.5 focus:outline-hidden font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-405 font-semibold mb-1">O que contatar? (Anotação da Campanha / Provadores)</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Perguntar o tamanho que ela prefere das estampas e cores que chegaram da nova coleção de tops!"
                  value={fNotes}
                  onChange={(e) => setFNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold transition rounded-lg"
              >
                Agendar Atividade
              </button>
            </form>
          </div>

          {/* List scheduled tasks */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-500 mb-3 block">Follow-up Atividades Agendadas</h3>

            <div className="space-y-2.5">
              {followups.map(fup => (
                <div key={fup.id} className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-sans transition-all
                  ${fup.completed ? 'bg-slate-50 border-slate-150 text-slate-400' : 'bg-white border-slate-150 hover:shadow-xs'}`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${fup.completed ? 'text-slate-405 line-through' : 'text-slate-800'}`}>{fup.clientName}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full
                        ${fup.channel === 'WhatsApp' ? 'bg-green-100 text-green-800' : fup.channel === 'Instagram' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'}`}>
                        {fup.channel}
                      </span>
                    </div>
                    <p className={`text-slate-550 ${fup.completed ? 'line-through opacity-70' : 'font-medium'}`}>{fup.notes}</p>
                    <p className="text-[10px] text-slate-400">Data contato: <strong className="text-slate-500">{fup.date}</strong></p>
                  </div>

                  <div className="flex gap-2">
                    {!fup.completed ? (
                      <button
                        type="button"
                        onClick={() => {
                          setFollowups(prev => prev.map(f => f.id === fup.id ? { ...f, completed: true } : f));
                          alert('Atividade marcada como realizada e arquivada!');
                        }}
                        className="py-1 px-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded transition text-[10px] border-none cursor-pointer"
                      >
                        Marcar Concluída
                      </button>
                    ) : (
                      <span className="text-green-600 font-bold text-[10px] bg-green-50 px-2 py-1 rounded">✔ Concluído</span>
                    )}

                    <button
                      type="button"
                      onClick={() => setFollowups(prev => prev.filter(f => f.id !== fup.id))}
                      className="p-1 px-2 hover:bg-rose-50 text-rose-600 rounded text-[10px] font-bold"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Tab 4: Partner / Influencer program */}
      {activeSubTab === 'parceiros' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs font-sans">
          
          {/* List and report of partners */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-500 mb-3 block">Métricas de Vendas por Parceira / Influenciadora</h3>
            
            <div className="divide-y divide-slate-100">
              {partners.map(part => {
                const comissaoPaga = Number(((part.totalGenerated * part.commissionRate) / 100).toFixed(2));

                return (
                  <div key={part.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink-100/50 text-pink-600 rounded-xl flex items-center justify-center font-bold">
                        <Gift size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">{part.name}</h4>
                        <span className="text-slate-400 text-[10px] font-medium block">{part.instagram}</span>
                        <span className="text-rose-600 font-mono font-bold text-[10px] bg-rose-50 px-1.5 py-0.5 rounded mt-1.5 inline-block">Cupom: {part.couponCode}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-right">
                      <div>
                        <span className="text-slate-350 font-bold block text-[9px] uppercase tracking-wider">Vendas</span>
                        <span className="font-bold text-slate-700 font-mono mt-0.5 inline-block text-[11px]">{part.salesCount} ped</span>
                      </div>
                      <div>
                        <span className="text-slate-350 font-bold block text-[9px] uppercase tracking-wider">Faturamento</span>
                        <span className="font-bold text-slate-700 font-mono mt-0.5 inline-block text-[11px]">{formatCurrency(part.totalGenerated)}</span>
                      </div>
                      <div>
                        <span className="text-slate-350 font-bold block text-[9px] uppercase tracking-wider">Comissão ({part.commissionRate}%)</span>
                        <span className="font-bold text-emerald-600 font-mono mt-0.5 inline-block text-[11px]">{formatCurrency(comissaoPaga)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form to insert partner */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-50 flex items-center gap-1.5 mb-3">
              <Plus size={15} className="text-pink-600" />
              <span>Cadastrar Influenciadora</span>
            </h3>

            <form onSubmit={handleCreatePartner} className="space-y-4">
              <div>
                <label className="block text-slate-405 font-semibold mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ana Souza Coach"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-slate-405 font-semibold mb-1">Instagram (@)</label>
                <input
                  type="text"
                  placeholder="Ex: @anasouza_fit"
                  value={partInsta}
                  onChange={(e) => setPartInsta(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-405 font-semibold mb-1">Código Cupom VIP</label>
                  <input
                    type="text"
                    required
                    placeholder="ANAFIT"
                    value={partCoupon}
                    onChange={(e) => setPartCoupon(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-1.5 focus:outline-hidden font-mono text-rose-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-405 font-semibold mb-1">Comissão (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={partRate}
                    onChange={(e) => setPartRate(Math.max(0, Math.min(100, Number(e.target.value))))}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-1.5 focus:outline-hidden font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold transition rounded-lg"
              >
                Cadastrar Parceira
              </button>
            </form>
          </div>

        </div>
      )}

      {/* Tab 5: Clube Fidelidade & Cashback */}
      {activeSubTab === 'fidelidade' && (() => {
        // Calculate celebrants list dynamically inside component execution
        const celebrantsList: Array<{
          id: string;
          name: string;
          role: 'client' | 'staff';
          staffRole?: string;
          phone: string;
          birthDateStr: string;
          statusText: string;
          daysRemaining: number;
          isToday: boolean;
          isUpcoming: boolean;
          couponCode?: string;
        }> = [];

        clients.forEach(c => {
          const parsed = parseBirthDayAndMonth(c.birthDate);
          if (parsed) {
            const s = getAnniversaryStatus(parsed.day, parsed.month);
            if (s) {
              celebrantsList.push({
                id: c.id,
                name: c.name,
                role: 'client',
                phone: c.phone || '',
                birthDateStr: c.birthDate || '',
                statusText: s.text,
                daysRemaining: s.daysRemaining,
                isToday: s.isToday,
                isUpcoming: s.isUpcoming,
                couponCode: getBirthdayCouponCode(c.name)
              });
            }
          }
        });

        teamMembers.forEach(m => {
          const parsed = parseBirthDayAndMonth(m.birthDate);
          if (parsed) {
            const s = getAnniversaryStatus(parsed.day, parsed.month);
            if (s) {
              celebrantsList.push({
                id: m.id,
                name: m.name,
                role: 'staff',
                staffRole: m.role,
                phone: m.phone || '11 99999-9999',
                birthDateStr: m.birthDate || '',
                statusText: s.text,
                daysRemaining: s.daysRemaining,
                isToday: s.isToday,
                isUpcoming: s.isUpcoming
              });
            }
          }
        });

        celebrantsList.sort((a, b) => {
          if (a.isToday && !b.isToday) return -1;
          if (!a.isToday && b.isToday) return 1;
          return a.daysRemaining - b.daysRemaining;
        });

        return (
          <div className="space-y-6 font-sans">
            
            {/* Elegant Sub-navigation */}
            <div className="flex border-b border-slate-100 gap-3 pb-0">
              <button
                type="button"
                onClick={() => saveFidelidadeSubSection('cashback')}
                className={`pb-3 px-4 font-bold text-xs uppercase tracking-wider transition duration-150 border-b-2 flex items-center gap-2 cursor-pointer border-none bg-transparent ${
                  fidelidadeSubSection === 'cashback'
                    ? 'border-pink-500 text-pink-650 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-650'
                }`}
              >
                <Coins size={14} />
                <span>Programa Cashback & Saldo</span>
              </button>
              <button
                type="button"
                onClick={() => saveFidelidadeSubSection('aniversarios')}
                className={`pb-3 px-4 font-bold text-xs uppercase tracking-wider transition duration-150 border-b-2 flex items-center gap-2 cursor-pointer border-none bg-transparent ${
                  fidelidadeSubSection === 'aniversarios'
                    ? 'border-pink-500 text-pink-650 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-650'
                }`}
              >
                <Gift size={15} />
                <span>Automação de Aniversários 🎁</span>
                {celebrantsList.filter(cel => cel.isToday).length > 0 && (
                  <span className="bg-rose-500 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                    {celebrantsList.filter(cel => cel.isToday).length}
                  </span>
                )}
              </button>
            </div>

            {fidelidadeSubSection === 'cashback' ? (
              <>
                {/* Top Panel: Metrics & Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  
                  {/* KPI Card 1: Total de Membros */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center gap-4">
                    <div className="p-3 bg-pink-100 text-pink-600 rounded-2xl">
                      <Users size={20} />
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Membros no Clube</span>
                      <span className="font-mono font-black text-xl text-slate-800">{clients.length}</span>
                    </div>
                  </div>

                  {/* KPI Card 2: Saldo Total Acumulado */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                      <Coins size={20} />
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Cashback Acumulado</span>
                      <span className="font-mono font-black text-xl text-slate-800">
                        {formatCurrency(clients.reduce((sum, c) => sum + (c.cashbackBalance || 0), 0))}
                      </span>
                    </div>
                  </div>

                  {/* KPI Card 3: Reserva de Segurança / Cashback Médio */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                      <Award size={20} />
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Média por Cliente</span>
                      <span className="font-mono font-black text-xl text-slate-800">
                        {formatCurrency(clients.length > 0 ? (clients.reduce((sum, c) => sum + (c.cashbackBalance || 0), 0) / clients.length) : 0)}
                      </span>
                    </div>
                  </div>

                  {/* KPI Card 4: Regra de Acúmulo de Cashback (Configurável) */}
                  <div className="bg-gradient-to-br from-pink-600 to-rose-600 text-white rounded-2xl p-4 shadow-md shadow-pink-500/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider opacity-80">Porcentagem Padrão</span>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">VIP AP Fitness</span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-black font-mono">{cashbackRateConfig}%</span>
                      <span className="text-[10px] opacity-90 font-medium">de volta</span>
                    </div>
                    <div className="mt-2.5 flex items-center gap-1.5 bg-white/10 p-1 rounded-lg">
                      <input 
                        type="range" 
                        min="1" 
                        max="30" 
                        value={cashbackRateConfig}
                        onChange={(e) => handleSaveCashbackRateConfig(Number(e.target.value))}
                        className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                      />
                      <span className="text-[10px] font-black font-mono w-6 text-center">{cashbackRateConfig}%</span>
                    </div>
                  </div>

                </div>

                {/* Core Table Section of Loyalty Members */}
                <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-150 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 animate-fade-in">Diretório do Clube de Fidelidade</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Veja quem acumula cashback, históricos de resgate e faça ajustes manuais de bônus.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text"
                        placeholder="Buscar cliente no clube..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-pink-500 text-xs w-48 font-semibold transition"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-450 text-[9px] font-extrabold uppercase tracking-widest">
                          <th className="px-4 py-3">Cliente</th>
                          <th className="px-4 py-3">Compras</th>
                          <th className="px-4 py-3">Total Gasto</th>
                          <th className="px-4 py-3">Cashback Acumulado</th>
                          <th className="px-4 py-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px] text-slate-650">
                        {clients
                          .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((client) => {
                            const clientHistory = sales.filter(s => s.clientName.toLowerCase() === client.name.toLowerCase());
                            const totalPurchases = clientHistory.length || client.ordersCount || 0;
                            const totalSpentSum = clientHistory.reduce((sum, s) => sum + s.total, 0) || client.totalSpent || 0;
                            const cBalance = client.cashbackBalance || 0;
                            
                            return (
                              <tr key={client.id} className="hover:bg-slate-50/50 transition duration-150">
                                <td className="px-4 py-3 flex items-center gap-3.5">
                                  <div className="w-8 h-8 bg-pink-100 text-pink-600 font-bold rounded-full flex items-center justify-center text-xs shadow-xs uppercase">
                                    {client.name[0]}
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-800 block text-[11.5px]">{client.name}</span>
                                    <span className="text-[9.5px] text-slate-400 font-sans block">{client.email}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 font-mono font-semibold text-slate-500">
                                  {totalPurchases}
                                </td>
                                <td className="px-4 py-3 font-mono font-bold text-slate-700">
                                  {formatCurrency(totalSpentSum)}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="font-mono font-black text-emerald-700 text-[12px]">
                                      {formatCurrency(cBalance)}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAdjustingClient(client);
                                      setAdjustValue((client.cashbackBalance || 0).toString());
                                    }}
                                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-pink-50 hover:text-pink-600 text-slate-600 rounded-lg font-bold text-[10px] transition cursor-pointer border-none"
                                  >
                                    Ajustar Saldo
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              /* ANNIVERSARIES AUTOMATION VIEW */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in animate-duration-300">
                
                {/* LEFT CONIFG PANEL: 5 columns */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                      <div className="p-2 bg-pink-100 text-pink-600 rounded-xl">
                        <Gift size={16} />
                      </div>
                      <div>
                        <h4 className="font-black text-xs text-slate-805 uppercase tracking-wider">Regras de Aniversário</h4>
                        <p className="text-[9.5px] text-slate-400">Configure descontos automáticos e textos base.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Coupon Discount */}
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <label className="text-[10px] font-extrabold text-slate-550 uppercase">Valor do Cupom Especial</label>
                          <span className="font-mono font-bold text-xs text-pink-600">{birthdayCouponDiscount}% OFF</span>
                        </div>
                        <input 
                          type="range"
                          min="5"
                          max="40"
                          step="5"
                          value={birthdayCouponDiscount}
                          onChange={(e) => setBirthdayCouponDiscount(Number(e.target.value))}
                          className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-pink-600"
                        />
                      </div>

                      {/* Coupon Validity */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-550 uppercase block">Dias de Validade do Cupom</label>
                        <select
                          value={birthdayCouponValidityDays}
                          onChange={(e) => setBirthdayCouponValidityDays(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 text-xs text-slate-700 cursor-pointer font-sans"
                        >
                          <option value="3">3 dias (Super Exclusivo)</option>
                          <option value="5">5 dias (Venda Rápida)</option>
                          <option value="7">7 dias (Semana do Aniversário)</option>
                          <option value="15">15 dias (Campanha Estendida)</option>
                        </select>
                      </div>

                      {/* Auto pilot WhatsApp trigger */}
                      <div className="p-3 bg-pink-50/50 border border-pink-100/40 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] font-black text-pink-850 uppercase flex items-center gap-1.5">
                            <Zap size={13} className="text-pink-650 animate-bounce" />
                            Gatilho Automático
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={birthdayAutoSend}
                              onChange={(e) => setBirthdayAutoSend(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-pink-600"></div>
                          </label>
                        </div>
                        <p className="text-[9.5px] text-slate-500 leading-relaxed font-sans mt-1">
                          Se ativado, ao abrir o painel em cada novo dia de trabalho, o sistema automatiza o diagnóstico dos aniversariantes e enfileira os relatórios e códigos de cupons prontos em background.
                        </p>
                        {birthdayAutoSend && (
                          <div className="flex items-center gap-1 mt-1 text-[9px] font-mono font-bold text-emerald-600 uppercase">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            Diagnóstico Ativo & Cupom Sincronizado
                          </div>
                        )}
                      </div>

                      {/* Template Client Copywriter */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-550 uppercase flex justify-between items-center">
                          <span>Texto p/ Clientes 👤</span>
                          <span className="text-[8px] text-slate-400 normal-case">Use: &#123;NOME&#124;, &#123;CUPOM&#124;, &#123;DESCONTO&#124;, &#123;VALIDADE&#124;</span>
                        </label>
                        <textarea 
                          rows={4}
                          value={birthdayClientTemplate}
                          onChange={(e) => setBirthdayClientTemplate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-[10.5px] text-slate-700 focus:outline-hidden focus:border-pink-500 font-sans leading-relaxed"
                        />
                      </div>

                      {/* Template Staff Copywriter */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-550 uppercase flex justify-between items-center">
                          <span>Texto p/ Colaboradores 💼</span>
                          <span className="text-[8px] text-slate-400 normal-case">Use: &#123;NOME&#124;</span>
                        </label>
                        <textarea 
                          rows={4}
                          value={birthdayStaffTemplate}
                          onChange={(e) => setBirthdayStaffTemplate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-[10.5px] text-slate-700 focus:outline-hidden focus:border-pink-500 font-sans leading-relaxed"
                        />
                      </div>

                      {/* Saving config button */}
                      <button
                        type="button"
                        onClick={handleSaveBirthdayConfig}
                        className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold font-sans uppercase hover:bg-slate-800 transition cursor-pointer border-none flex items-center justify-center gap-2"
                      >
                        <Save size={13} className="text-pink-405" />
                        <span>Salvar Automações & Templates</span>
                      </button>

                    </div>
                  </div>
                </div>

                {/* RIGHT CELEBRANTS BOARD: 7 columns */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs min-h-[460px] flex flex-col">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 h-[35px]">
                      <div>
                        <h4 className="font-black text-xs text-slate-805 uppercase tracking-wider">Mural dos Aniversariantes</h4>
                        <p className="text-[9.5px] text-slate-400">Hoje, ontem ou nos próximos 7 dias no calendário de contatos.</p>
                      </div>
                      <span className="text-[9.5px] bg-slate-50 border border-slate-100 px-2 py-1 rounded-full font-mono text-slate-550">
                        {celebrantsList.length} celebrando
                      </span>
                    </div>

                    {/* Celebrants Grid / List */}
                    {celebrantsList.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                        <div className="p-4 bg-slate-50 text-slate-400 rounded-full">
                          <Gift size={32} />
                        </div>
                        <div>
                          <span className="block text-slate-700 font-extrabold text-xs">Nenhum Aniversariante Próximo</span>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed max-w-xs mx-auto">
                            O calendário está tranquilo! Sem registros de aniversário para clientes ou equipe hoje ou nos próximos 7 dias. 👍
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3.5 divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
                        {celebrantsList.map((item, index) => {
                          const log = congratulationsLog[item.id];
                          const isSent = !!log;
                          const dynamicCoupon = item.couponCode;

                          return (
                            <div 
                              key={item.id} 
                              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3.5 first:pt-0 ${
                                item.isToday ? 'bg-pink-500/[0.02] border border-pink-500/10 p-3 rounded-xl' : ''
                              }`}
                            >
                              
                              {/* Left: Avatar & Metadata */}
                              <div className="flex items-start gap-3">
                                <div className={`w-9 h-9 rounded-full font-black flex items-center justify-center text-xs shrink-0 shadow-xs uppercase ${
                                  item.role === 'client' 
                                    ? 'bg-pink-100 text-pink-650' 
                                    : 'bg-indigo-100 text-indigo-650'
                                }`}>
                                  {item.name[0]}
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-extrabold text-[12px] text-slate-800 leading-none">{item.name}</span>
                                    {item.role === 'client' ? (
                                      <span className="text-[8.5px] border border-pink-100 bg-pink-50 text-pink-600 px-1.5 py-0.2 rounded-md font-bold uppercase shrink-0">Cliente 👤</span>
                                    ) : (
                                      <span className="text-[8.5px] border border-indigo-100 bg-indigo-50 text-indigo-600 px-1.5 py-0.2 rounded-md font-bold uppercase shrink-0" title="Colaborador da Loja">
                                        {item.staffRole || 'Equipe'} 💼
                                      </span>
                                    )}
                                    {item.isToday && (
                                      <span className="text-[8.5px] bg-red-550 bg-red-650 bg-rose-600 text-white px-2 py-0.2 rounded-full font-black uppercase tracking-wider animate-pulse inline-block shrink-0">ANIVERSÁRIO HOJE 🎂</span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 text-[10px] text-slate-450 font-mono">
                                    <span>Nascimento: <strong>{item.birthDateStr}</strong></span>
                                    <span>•</span>
                                    <span>{item.statusText}</span>
                                  </div>

                                  {/* Coupon copy button if client */}
                                  {item.role === 'client' && dynamicCoupon && (
                                    <div className="flex items-center gap-1.5 pt-1">
                                      <span className="text-[9.5px] text-slate-400">Cupom Especial:</span>
                                      <span 
                                        onClick={() => {
                                          navigator.clipboard.writeText(dynamicCoupon);
                                          alert(`Cupom "${dynamicCoupon}" copiado para a área de transferência!`);
                                        }}
                                        className="font-mono text-[10px] font-black bg-slate-100 hover:bg-pink-100 hover:text-pink-700 text-slate-700 px-2 py-0.5 rounded cursor-pointer transition border border-slate-200/50 flex items-center gap-1"
                                        title="Clique para copiar cupom"
                                      >
                                        {dynamicCoupon}
                                        <Award size={10} className="opacity-70" />
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right: Actions */}
                              <div className="flex items-center justify-end gap-2 shrink-0">
                                {isSent ? (
                                  <div className="text-right space-y-0.5">
                                    <span className="text-emerald-600 font-extrabold text-[10.5px] flex items-center gap-1">
                                      <Check size={12} strokeWidth={3} />
                                      Enviado às {log.sentAt}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleTriggerDispatch(item.id, item.role, item.name, item.phone, dynamicCoupon)}
                                      className="text-[9.5px] text-slate-400 hover:text-pink-650 bg-transparent border-none underline cursor-pointer hover:font-bold"
                                    >
                                      Reenviar Parabéns
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const text = getCompiledTemplate(item.role, item.name, dynamicCoupon);
                                        navigator.clipboard.writeText(text);
                                        alert('Mensagem personalizada copiada com sucesso para você disparar onde quiser!');
                                      }}
                                      className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold cursor-pointer border border-slate-200/50 transition-all flex items-center gap-1"
                                      title="Copiar texto do template substituído"
                                    >
                                      Copiar Texto
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleTriggerDispatch(item.id, item.role, item.name, item.phone, dynamicCoupon)}
                                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-black cursor-pointer border-none shadow-md shadow-green-500/10 flex items-center gap-1 hover:-translate-y-0.5 transition"
                                      title="Abrir WhatsApp Web com texto preenchido"
                                    >
                                      <span className="font-mono">💬</span> Parabenizar
                                    </button>
                                  </div>
                                )}
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* Manual Adjust Modal (Kept unchanged and working) */}
            {adjustingClient && (
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
                <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden font-sans">
                  <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-none">
                    <h3 className="font-bold text-xs uppercase tracking-wider">Ajustar Saldo de Cashback</h3>
                    <button 
                      type="button"
                      onClick={() => setAdjustingClient(null)}
                      className="text-slate-400 hover:text-white transition-colors text-xs bg-transparent border-none font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-pink-100 text-pink-600 font-bold rounded-full flex items-center justify-center text-sm mx-auto shadow-sm mb-2 uppercase">
                        {adjustingClient.name[0]}
                      </div>
                      <span className="block font-black text-slate-800 text-[13px]">{adjustingClient.name}</span>
                      <span className="block text-[10px] text-slate-400">Saldo Atual: {formatCurrency(adjustingClient.cashbackBalance || 0)}</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-550 uppercase block tracking-wider">Novo Saldo (BRL)</label>
                      <div className="relative">
                        <input 
                          type="number"
                          step="0.01"
                          min="0"
                          value={adjustValue}
                          onChange={(e) => setAdjustValue(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-pink-500 font-mono font-bold text-sm"
                          placeholder="0.00"
                          required
                          autoFocus
                        />
                        <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold font-sans">R$</span>
                      </div>
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <button 
                        type="button" 
                        onClick={() => setAdjustingClient(null)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl text-xs font-bold transition duration-150 cursor-pointer border-none"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="button"
                        onClick={handleSaveCashbackAdjustment}
                        className="flex-1 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition duration-150 cursor-pointer border-none shadow-md shadow-pink-500/10"
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        );
      })()}

      {/* Customer profile detail drawer */}
      {selectedClientDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-xs tracking-wider uppercase font-sans">Ficha da Cliente</span>
              <button 
                onClick={() => setSelectedClientDetail(null)}
                className="text-slate-400 hover:text-white transition-colors text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto font-sans text-xs">
              <div className="text-center pb-4 border-b border-slate-100">
                <div className="w-14 h-14 bg-pink-100 text-pink-600 font-bold rounded-full flex items-center justify-center text-lg mx-auto shadow-sm">
                  {selectedClientDetail.name[0]}
                </div>
                <h4 className="text-sm font-bold text-slate-800 mt-2.5">{selectedClientDetail.name}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{selectedClientDetail.email}</p>
                <div className="flex justify-center gap-2 mt-3 text-[10px] font-semibold">
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                    {selectedClientDetail.phone}
                  </span>
                  <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                    <Star size={10} fill="currentColor" /> {selectedClientDetail.npsScore || '10'}/10 Score
                  </span>
                </div>
              </div>

              {/* Sizing & Measurements Assistant */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[10px] text-slate-500 uppercase tracking-widest font-mono">📏 Medidas & Sugestão</span>
                  {selectedClientDetail.busto || selectedClientDetail.cintura || selectedClientDetail.quadril ? (
                    <span className="bg-pink-105 text-pink-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                      Tamanho Ideal: {(() => {
                        const busto = selectedClientDetail.busto;
                        const cintura = selectedClientDetail.cintura;
                        const quadril = selectedClientDetail.quadril;
                        const sizes = [];
                        if (busto) {
                          if (busto <= 88) sizes.push(1);
                          else if (busto <= 96) sizes.push(2);
                          else if (busto <= 104) sizes.push(3);
                          else sizes.push(4);
                        }
                        if (cintura) {
                          if (cintura <= 68) sizes.push(1);
                          else if (cintura <= 76) sizes.push(2);
                          else if (cintura <= 84) sizes.push(3);
                          else sizes.push(4);
                        }
                        if (quadril) {
                          if (quadril <= 98) sizes.push(1);
                          else if (quadril <= 106) sizes.push(2);
                          else if (quadril <= 114) sizes.push(3);
                          else sizes.push(4);
                        }
                        const max = sizes.length > 0 ? Math.max(...sizes) : 2;
                        return max === 1 ? 'P' : max === 2 ? 'M' : max === 3 ? 'G' : 'GG';
                      })()}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Não cadastradas</span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                    <span className="block text-[8px] text-slate-400 font-bold uppercase">Busto</span>
                    <span className="font-mono font-bold text-slate-700">
                      {selectedClientDetail.busto ? `${selectedClientDetail.busto} cm` : '--'}
                    </span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                    <span className="block text-[8px] text-slate-400 font-bold uppercase">Cintura</span>
                    <span className="font-mono font-bold text-slate-700">
                      {selectedClientDetail.cintura ? `${selectedClientDetail.cintura} cm` : '--'}
                    </span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                    <span className="block text-[8px] text-slate-400 font-bold uppercase">Quadril</span>
                    <span className="font-mono font-bold text-slate-700">
                      {selectedClientDetail.quadril ? `${selectedClientDetail.quadril} cm` : '--'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                    <span className="block text-[8px] text-slate-400 font-bold uppercase">Coxa</span>
                    <span className="font-mono font-bold text-slate-700">
                      {selectedClientDetail.coxa ? `${selectedClientDetail.coxa} cm` : '--'}
                    </span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                    <span className="block text-[8px] text-slate-400 font-bold uppercase">Altura</span>
                    <span className="font-mono font-bold text-slate-700">
                      {selectedClientDetail.altura ? `${selectedClientDetail.altura} m` : '--'}
                    </span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                    <span className="block text-[8px] text-slate-400 font-bold uppercase">Peso</span>
                    <span className="font-mono font-bold text-slate-700">
                      {selectedClientDetail.peso ? `${selectedClientDetail.peso} kg` : '--'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Purchase History Listing */}
              <div className="space-y-3">
                <h5 className="font-bold text-[10px] text-slate-450 uppercase tracking-widest font-mono">Histórico de Pedidos ({clientPurchaseHistory.length})</h5>
                {clientPurchaseHistory.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs font-sans">Nenhuma compra registrada para esta cliente no PDV ainda.</div>
                ) : (
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {clientPurchaseHistory.map((order, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs space-y-2">
                        <div className="flex justify-between font-mono">
                          <span className="font-bold text-slate-750">{order.id.toUpperCase()}</span>
                          <span className="text-slate-400">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="divide-y divide-slate-150/50">
                          {order.items.map((it, i) => (
                             <div key={i} className="py-1 flex justify-between text-[11px] text-slate-650">
                              <span>{it.quantity}x {it.name}</span>
                              <span className="font-semibold font-mono">{formatCurrency(it.price * it.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between border-t border-slate-150/55 pt-1.5 font-bold font-mono">
                          <span className="font-sans">Total</span>
                          <span className="text-pink-650">{formatCurrency(order.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={() => setSelectedClientDetail(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer text-center"
              >
                Fechar Perfil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Client Modal Popup */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-50 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-xs tracking-wider uppercase font-sans">
                {editingClient ? 'Editar Cadastro da Cliente' : 'Cadastrar Nova Cliente'}
              </span>
              <button 
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-white transition-colors text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="space-y-1 text-xs font-sans">
                <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Nome Completo</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Amanda Rezende"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-pink-500 transition-all font-medium"
                />
              </div>

              <div className="space-y-1 text-xs font-sans">
                <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Celular / WhatsApp</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: (11) 98888-7777"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-pink-500 transition-all font-medium font-mono"
                />
              </div>

              <div className="space-y-1 text-xs font-sans font-medium">
                <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">E-mail de Contato</label>
                <input 
                  type="email"
                  placeholder="Ex: amanda@exemplo.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:border-pink-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-sans font-medium">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">CPF do Cliente</label>
                  <input 
                    type="text"
                    placeholder="000.000.000-00"
                    value={newCpf}
                    onChange={(e) => setNewCpf(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:border-pink-500 transition-all font-mono"
                  />
                </div>

                <div className="space-y-1 font-sans">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Data Nascimento</label>
                  <input 
                    type="text"
                    placeholder="Ex: 12/04/1995"
                    value={newBirthDate}
                    onChange={(e) => setNewBirthDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:border-pink-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-sans font-medium">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Origem</label>
                  <select 
                    value={newChannel}
                    onChange={(e) => setNewChannel(e.target.value as SalesChannel)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-pink-500 transition-all font-semibold"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="E-commerce">E-commerce</option>
                    <option value="Loja Física">Loja Física</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div className="space-y-1 font-sans">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Score Relacionamento</label>
                  <select 
                    value={newNps}
                    onChange={(e) => setNewNps(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-pink-500 transition-all font-semibold font-mono"
                  >
                    {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              {/* Clube VIP Checkbox */}
              <div className="bg-pink-50/40 p-3.5 rounded-2xl border border-pink-100/50 flex items-center gap-2.5">
                <input 
                  type="checkbox"
                  id="client-vip-toggle"
                  checked={newVip}
                  onChange={(e) => setNewVip(e.target.checked)}
                  className="w-4.5 h-4.5 text-pink-600 border-slate-300 rounded focus:ring-pink-500 accent-pink-600 cursor-pointer"
                />
                <div className="leading-tight">
                  <label htmlFor="client-vip-toggle" className="text-xs font-black text-pink-700 cursor-pointer select-none block">
                    👑 Membro Ativo do Clube VIP
                  </label>
                  <span className="text-[9.5px] text-pink-500/80 font-medium">Aplica descontos automáticos de 10% adicionais nas compras online via Área do Cliente.</span>
                </div>
              </div>

              {/* Medidas da Cliente (Opcional) */}
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">📏 Medidas Corporais (Opcional)</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-slate-450 font-bold uppercase text-[8px] tracking-wide block">Busto (cm)</label>
                    <input 
                      type="number"
                      placeholder="Ex: 92"
                      value={newBusto}
                      onChange={(e) => setNewBusto(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-300 focus:outline-none focus:border-pink-500 transition-all font-mono text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-450 font-bold uppercase text-[8px] tracking-wide block">Cintura (cm)</label>
                    <input 
                      type="number"
                      placeholder="Ex: 72"
                      value={newCintura}
                      onChange={(e) => setNewCintura(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-300 focus:outline-none focus:border-pink-500 transition-all font-mono text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-450 font-bold uppercase text-[8px] tracking-wide block">Quadril (cm)</label>
                    <input 
                      type="number"
                      placeholder="Ex: 102"
                      value={newQuadril}
                      onChange={(e) => setNewQuadril(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-300 focus:outline-none focus:border-pink-500 transition-all font-mono text-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-slate-455 font-bold uppercase text-[8px] tracking-wide block">Coxa (cm)</label>
                    <input 
                      type="number"
                      placeholder="Ex: 58"
                      value={newCoxa}
                      onChange={(e) => setNewCoxa(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-300 focus:outline-none focus:border-pink-500 transition-all font-mono text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-455 font-bold uppercase text-[8px] tracking-wide block">Altura (m)</label>
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="Ex: 1.65"
                      value={newAltura}
                      onChange={(e) => setNewAltura(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-300 focus:outline-none focus:border-pink-500 transition-all font-mono text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-455 font-bold uppercase text-[8px] tracking-wide block">Peso (kg)</label>
                    <input 
                      type="number"
                      placeholder="Ex: 62"
                      value={newPeso}
                      onChange={(e) => setNewPeso(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-300 focus:outline-none focus:border-pink-500 transition-all font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-650 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer text-center hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-pink-600 text-white rounded-xl text-xs font-bold font-sans transition-all cursor-pointer text-center shadow-md shadow-pink-500/10 hover:bg-pink-700"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
