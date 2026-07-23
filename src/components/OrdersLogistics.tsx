/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';

export const metadata = { robots: { index: false, follow: false } };
import { 
  ShoppingBag, 
  Truck, 
  RefreshCcw, 
  Bookmark, 
  MessageCircle, 
  Plus, 
  Check, 
  Clock, 
  User, 
  MapPin, 
  DollarSign, 
  Calendar,
  AlertCircle,
  TrendingUp,
  FileText,
  Briefcase,
  Trash2,
  Edit,
  X,
  Printer,
  Copy
} from 'lucide-react';
import { Product, Sale, Client } from '../types';
import CorreiosLabel from './CorreiosLabel';

interface OrdersLogisticsProps {
  products: Product[];
  clients: Client[];
  sales: Sale[];
  onAddSale: (newSale: Sale) => void;
  onlineOrders: any[];
  setOnlineOrders: React.Dispatch<React.SetStateAction<any[]>>;
  onUpdateOnlineOrderStatus: (orderId: string, status: any, statusPagamento?: string, trackingCode?: string, statusLogistico?: string) => void;
  activeSubTab?: 'pedidos' | 'trocas_crediario' | 'logistica' | 'condicional';
  setActiveSubTab?: (subTab: 'pedidos' | 'trocas_crediario' | 'logistica' | 'condicional') => void;
  sellers?: string[];
}

interface OnlineOrder {
  id: string;
  clientName: string;
  phone: string;
  items: { productName: string; quantity: number; price: number }[];
  total: number;
  status: 'Pendente' | 'Separando' | 'Pronto' | 'Saiu para Entrega' | 'Entregue';
  createdAt: string;
  address: string;
  deliveryFee: number;
  motoboy?: string;
  notes?: string;
}

interface Reserva {
  id: string;
  clientName: string;
  productName: string;
  quantity: number;
  total: number;
  validUntil: string;
  status: 'Ativa' | 'Retirada' | 'Expirada';
}

interface CrediarioItem {
  id: string;
  clientName: string;
  totalLimit: number;
  usedAmount: number;
  lastPaymentDate?: string;
  status: 'Regular' | 'Atrasado';
}

interface TrocaItem {
  id: string;
  clientName: string;
  productReturned: string;
  productTaken: string;
  differenceAmount: number; // Positive if client paid more, negative if store owes/credit given
  date: string;
  reason: string;
}

export default function OrdersLogistics({ 
  products: rawProducts, 
  clients: rawClients, 
  sales: rawSales, 
  onAddSale, 
  onlineOrders: rawOnlineOrders, 
  setOnlineOrders, 
  onUpdateOnlineOrderStatus,
  activeSubTab: propActiveSubTab,
  setActiveSubTab: propSetActiveSubTab,
  sellers: rawSellers = []
}: OrdersLogisticsProps) {
  const products = Array.isArray(rawProducts) ? rawProducts : [];
  const clients = Array.isArray(rawClients) ? rawClients : [];
  const sales = Array.isArray(rawSales) ? rawSales : [];
  const onlineOrders = Array.isArray(rawOnlineOrders) ? rawOnlineOrders : [];
  const sellers = Array.isArray(rawSellers) ? rawSellers : [];

  const [internalActiveSubTab, setInternalActiveSubTab] = useState<'pedidos' | 'trocas_crediario' | 'logistica' | 'condicional'>('pedidos');
  const activeSubTab = propActiveSubTab || internalActiveSubTab;
  const setActiveSubTab = propSetActiveSubTab || setInternalActiveSubTab;

  const [selectedOrderForLabel, setSelectedOrderForLabel] = useState<any>(null);

  // States for UX/UI Senior enhancements (Premium Modal Dialog, Server Banner and Loadings)
  const [serverError, setServerError] = useState<string | null>(null);
  const [melhorEnvioStatus, setMelhorEnvioStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isUpdatingStatusId, setIsUpdatingStatusId] = useState<string | null>(null);
  const [isProcessingCredPay, setIsProcessingCredPay] = useState(false);
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);

  const handleDeleteOnlineOrder = (orderId: string) => {
    if (confirm(`Tem certeza de que deseja excluir definitivamente o pedido online #${orderId}? Esta ação removerá o pedido do sistema.`)) {
      setOnlineOrders(prev => prev.filter(o => o.id !== orderId));
      
      try {
        const url = localStorage.getItem('ap_supabase_url');
        const key = localStorage.getItem('ap_supabase_key');
        if (url && key) {
          fetch(`${url}/rest/v1/ap_online_orders?id=eq.${orderId}`, {
            method: 'DELETE',
            headers: {
              'apikey': key,
              'Authorization': `Bearer ${key}`
            }
          }).catch(() => {});
        }
      } catch (e) {}

      showCustomAlert('Sucesso', `Pedido online #${orderId} foi excluído definitivamente.`);
    }
  };

  const handleInvoiceOrder = (order: any) => {
    if (confirm(`Deseja lançar e faturar o pedido #${order.id} diretamente no PDV/Faturamento de Vendas?`)) {
      const items = Array.isArray(order.items) && order.items.length > 0 
        ? order.items 
        : [{ productName: 'Item Pedido Web', quantity: 1, price: order.total || 0 }];
      
      const subtotal = items.reduce((sum: number, it: any) => sum + (Number(it.price) * Number(it.quantity)), 0) || order.total || 0;
      const deliveryFee = Number(order.deliveryFee) || 0;

      const newSale: Sale = {
        id: `venda-web-${Date.now().toString().slice(-6)}`,
        clientName: order.clientName || 'Cliente Online',
        salesperson: 'Loja Online (E-commerce)',
        channel: 'E-commerce',
        items: items.map((it: any) => ({
          productId: it.productId || 'p1',
          name: it.productName || it.name || 'Produto Online',
          quantity: Number(it.quantity) || 1,
          price: Number(it.price) || 0,
          cost: 0
        })),
        total: subtotal + deliveryFee,
        costTotal: 0,
        status: 'Concluída',
        createdAt: new Date().toISOString(),
        address: order.address || undefined
      };

      onAddSale(newSale);
      handleUpdateOrderStatus(order.id, 'Entregue');
      showCustomAlert('Venda Faturada', `Pedido #${order.id} faturado com sucesso! Lançado na lista de Vendas do PDV.`);
    }
  };

  const isMelhorEnvioDelivery = (method?: string) => {
    if (!method) return false;
    const m = method.toLowerCase();
    return m.includes('correios') || m.includes('transportadora') || m.includes('pac') || m.includes('sedex') || m.includes('envio');
  };

  const getDeliveryLabel = (method?: string) => {
    if (!method) return 'A Combinar 🤝';
    const m = method.toLowerCase();
    if (m.includes('correios')) return 'Correios (Melhor Envio) 📦';
    if (m.includes('transportadora')) return 'Transportadora (Melhor Envio) 📦';
    if (m.includes('pac') || m.includes('sedex') || m.includes('envio')) return `${method.toUpperCase()} (Melhor Envio) 📦`;
    if (m === 'retirada') return 'Retirada na Loja 🏠';
    if (m === 'motoboy') return 'Motoboy Express 🏍️';
    return method;
  };
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert'
  });

  const showCustomAlert = (title: string, message: string) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type: 'alert'
    });
  };

  const showCustomConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      onConfirm
    });
  };

  const handleCopyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextId(id);
    setTimeout(() => {
      setCopiedTextId(null);
    }, 1500);
  };

  const getOrderCpf = (order: any) => {
    if (order.cpf) return order.cpf;
    if (order.notes) {
      const match = order.notes.match(/CPF:\s*([0-9.-]+)/i);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return '000.000.000-00';
  };

  const [reservas, setReservas] = useState<Reserva[]>([]);

  const [crediario, setCrediario] = useState<CrediarioItem[]>([]);

  const [trocas, setTrocas] = useState<TrocaItem[]>(() => {
    try {
      const saved = localStorage.getItem('ap_moda_trocas');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [deliveryRiders, setDeliveryRiders] = useState<{ id: string, name: string, status: string, region: string, salesAssigned: number }[]>(() => {
    try {
      const saved = localStorage.getItem('ap_moda_motoboys_detailed');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const motoboys = deliveryRiders.map(dr => dr.name);

  // Sync to local storage
  React.useEffect(() => {
    try {
      localStorage.setItem('ap_moda_trocas', JSON.stringify(trocas));
    } catch (e) {}
  }, [trocas]);

  React.useEffect(() => {
    try {
      localStorage.setItem('ap_moda_motoboys_detailed', JSON.stringify(deliveryRiders));
    } catch (e) {}
  }, [deliveryRiders]);

  React.useEffect(() => {
    fetch('/api/melhor-envio/status')
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          setMelhorEnvioStatus({ success: true, message: data.message });
        } else {
          setMelhorEnvioStatus({ success: false, message: data ? data.error : 'Erro desconhecido' });
        }
      })
      .catch(err => {
        console.error('[Melhor Envio Connection Status Check Failed]', err);
        setMelhorEnvioStatus({ 
          success: false, 
          message: `Falha na requisição de status: ${err.message}` 
        });
      });
  }, []);

  const [editingTroca, setEditingTroca] = useState<TrocaItem | null>(null);
  const [editTrocaClient, setEditTrocaClient] = useState('');
  const [editTrocaReturned, setEditTrocaReturned] = useState('');
  const [editTrocaTaken, setEditTrocaTaken] = useState('');
  const [editTrocaDiff, setEditTrocaDiff] = useState(0);
  const [editTrocaReason, setEditTrocaReason] = useState('');

  const [editingRider, setEditingRider] = useState<any | null>(null);
  const [editRiderName, setEditRiderName] = useState('');
  const [editRiderStatus, setEditRiderStatus] = useState('Disponível');
  const [editRiderRegion, setEditRiderRegion] = useState('');
  const [editRiderAssigned, setEditRiderAssigned] = useState(0);

  const [isAddRiderModalOpen, setIsAddRiderModalOpen] = useState(false);
  const [addRiderName, setAddRiderName] = useState('');
  const [addRiderStatus, setAddRiderStatus] = useState('Disponível');
  const [addRiderRegion, setAddRiderRegion] = useState('');
  const [addRiderAssigned, setAddRiderAssigned] = useState(0);

  const handleDeleteTroca = (id: string) => {
    showCustomConfirm(
      'Confirmar Exclusão',
      'Deseja realmente excluir esta troca/devolução? Esta ação é irreversível.',
      () => {
        setTrocas(prev => prev.filter(t => t.id !== id));
        showCustomAlert('Troca Removida', 'O registro da troca foi excluído com sucesso.');
      }
    );
  };

  const startEditTroca = (tr: TrocaItem) => {
    setEditingTroca(tr);
    setEditTrocaClient(tr.clientName);
    setEditTrocaReturned(tr.productReturned);
    setEditTrocaTaken(tr.productTaken);
    setEditTrocaDiff(tr.differenceAmount);
    setEditTrocaReason(tr.reason);
  };

  const handleSaveTrocaEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTroca) return;
    setTrocas(prev => prev.map(t => t.id === editingTroca.id ? {
      ...t,
      clientName: editTrocaClient,
      productReturned: editTrocaReturned,
      productTaken: editTrocaTaken,
      differenceAmount: Number(editTrocaDiff),
      reason: editTrocaReason
    } : t));
    setEditingTroca(null);
    showCustomAlert('Sucesso', 'Troca editada com sucesso!');
  };

  const startEditRider = (r: any) => {
    setEditingRider(r);
    setEditRiderName(r.name);
    setEditRiderStatus(r.status);
    setEditRiderRegion(r.region);
    setEditRiderAssigned(r.salesAssigned);
  };

  const handleSaveRiderEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRider) return;
    setDeliveryRiders(prev => prev.map(r => r.id === editingRider.id ? {
      ...r,
      name: editRiderName,
      status: editRiderStatus,
      region: editRiderRegion,
      salesAssigned: Number(editRiderAssigned)
    } : r));
    setEditingRider(null);
    showCustomAlert('Sucesso', 'Entregador editado com sucesso!');
  };

  const handleDeleteRider = (id: string) => {
    showCustomConfirm(
      'Excluir Entregador',
      'Deseja realmente excluir este entregador? Ele não receberá novas entregas.',
      () => {
        setDeliveryRiders(prev => prev.filter(r => r.id !== id));
        showCustomAlert('Entregador Removido', 'O entregador foi desvinculado do sistema com sucesso.');
      }
    );
  };

  const handleAddRiderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addRiderName || !addRiderRegion) {
      showCustomAlert('Aviso', 'Por favor, preencha o nome e a região.');
      return;
    }
    const newRider = {
      id: 'moto-' + Date.now(),
      name: addRiderName,
      status: addRiderStatus,
      region: addRiderRegion,
      salesAssigned: Number(addRiderAssigned)
    };
    setDeliveryRiders(prev => [...prev, newRider]);
    setAddRiderName('');
    setAddRiderRegion('');
    setAddRiderStatus('Disponível');
    setAddRiderAssigned(0);
    setIsAddRiderModalOpen(false);
    showCustomAlert('Sucesso', 'Entregador adicionado com sucesso!');
  };

  // Form States for Reserva creation
  const [reservaClient, setReservaClient] = useState('');
  const [reservaProd, setReservaProd] = useState('');
  const [reservaQty, setReservaQty] = useState(1);
  const [reservaDays, setReservaDays] = useState(5);

  // Form States for Troca creation
  const [trocaClient, setTrocaClient] = useState('');
  const [trocaReturned, setTrocaReturned] = useState('');
  const [trocaTaken, setTrocaTaken] = useState('');
  const [trocaDiff, setTrocaDiff] = useState(0);
  const [trocaReason, setTrocaReason] = useState('Ajuste de tamanho');

  // Form States for Crediario Payment/Adjustment
  const [credClientSelected, setCredClientSelected] = useState('');
  const [credPayVal, setCredPayVal] = useState(100);

  // Sacolas em Condicional State with LocalStorage Persistence
  const [condicionais, setCondicionais] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('ap_moda_condicionais');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'cond-1',
        clientName: 'Carla Oliveira',
        phone: '11999998888',
        items: [
          { productId: 'prod-1', productName: 'Legging Glow Cós Anatômico - M', quantity: 1, price: 119.90, cost: 45.00 },
          { productId: 'prod-2', productName: 'Top Cross Alta Sustentação - M', quantity: 1, price: 89.90, cost: 35.00 }
        ],
        dateOut: '2026-06-16',
        dateLimit: '2026-06-19',
        status: 'Pendente'
      },
      {
        id: 'cond-2',
        clientName: 'Fernanda Lima',
        phone: '11988887777',
        items: [
          { productId: 'prod-3', productName: 'Shorts Seamless Sculpt - P', quantity: 1, price: 139.90, cost: 50.00 },
          { productId: 'prod-4', productName: 'Top Seamless Confort - P', quantity: 1, price: 99.90, cost: 38.00 }
        ],
        dateOut: '2026-06-14',
        dateLimit: '2026-06-17',
        status: 'Pendente'
      }
    ];
  });

  // Sync condicionais to localStorage
  React.useEffect(() => {
    localStorage.setItem('ap_moda_condicionais', JSON.stringify(condicionais));
  }, [condicionais]);

  // Form states for creating a new condicional bag
  const [isCondicionalModalOpen, setIsCondicionalModalOpen] = useState(false);
  const [condClient, setCondClient] = useState('');
  const [condPhone, setCondPhone] = useState('');
  const [condDays, setCondDays] = useState(3);
  const [selectedCondProducts, setSelectedCondProducts] = useState<{ productId: string; productName: string; quantity: number; price: number; cost: number }[]>([]);
  const [currentSelectedProdId, setCurrentSelectedProdId] = useState('');
  const [currentSelectedProdQty, setCurrentSelectedProdQty] = useState(1);
  const [selectedClientObj, setSelectedClientObj] = useState<Client | null>(null);

  // Active closure/return modal
  const [closingCondBag, setClosingCondBag] = useState<any | null>(null);
  const [itemsToBuyQty, setItemsToBuyQty] = useState<{ [productId: string]: number }>({});
  const [condSalesperson, setCondSalesperson] = useState('Juliana Cardoso');

  // Stats summaries
  const totalReservasAtivas = useMemo(() => reservas.filter(r => r.status === 'Ativa').length, [reservas]);
  const totalCrediarioDevido = useMemo(() => crediario.reduce((sum, c) => sum + c.usedAmount, 0), [crediario]);
  const pendingShipmentsCount = useMemo(() => onlineOrders.filter(o => o.status !== 'Entregue').length, [onlineOrders]);

  // Form states for manual delivery order registration (E-commerce / WhatsApp)
  const [newOrderClient, setNewOrderClient] = useState('');
  const [newOrderPhone, setNewOrderPhone] = useState('');
  const [newOrderAddress, setNewOrderAddress] = useState('');
  const [newOrderProdId, setNewOrderProdId] = useState('');
  const [newOrderQty, setNewOrderQty] = useState(1);
  const [newOrderFee, setNewOrderFee] = useState(12);
  const [newOrderRider, setNewOrderRider] = useState('');
  const [newOrderNotes, setNewOrderNotes] = useState('');

  // Actions
  const [isGeneratingLabelId, setIsGeneratingLabelId] = useState<string | null>(null);

  const handleGenerateMelhorEnvioLabel = async (order: any) => {
    setIsGeneratingLabelId(order.id);
    setServerError(null);
    try {
      const response = await fetch('/api/melhor-envio/generate-label', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ order })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Não foi possível gerar a etiqueta.');
      }

      // Update order status, trackingCode and status_logistico
      onUpdateOnlineOrderStatus(
        order.id, 
        'Pronto', 
        order.status_pagamento || 'pago', 
        data.trackingCode, 
        'Etiqueta Gerada'
      );

      showCustomAlert(
        'Etiqueta Gerada!',
        `Etiqueta gerada com sucesso!\nCódigo de Rastreio: ${data.trackingCode}\n\nO PDF oficial será aberto em uma nova aba.`
      );
      
      if (data.printUrl) {
        window.open(data.printUrl, '_blank');
      }
    } catch (err: any) {
      console.error('[Melhor Envio Generate Error]', err);
      setServerError(`Melhor Envio API Falhou: ${err.message}. Verifique o saldo da conta e a conexão.`);
      showCustomAlert('Falha de Comunicação', `Melhor Envio API Falhou: ${err.message}. Um alerta foi gerado no topo da página.`);
    } finally {
      setIsGeneratingLabelId(null);
    }
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OnlineOrder['status']) => {
    setIsUpdatingStatusId(orderId);
    setServerError(null);
    setTimeout(() => {
      onUpdateOnlineOrderStatus(orderId, newStatus);
      setIsUpdatingStatusId(null);
    }, 500);
  };

  const handleCreateOnlineOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderClient || !newOrderAddress || !newOrderProdId) {
      showCustomAlert('Aviso', 'Favor preencher o Nome do Cliente, Endereço de Entrega e o Produto.');
      return;
    }

    const matchedProd = products.find(p => p.id === newOrderProdId);
    if (!matchedProd) return;

    const price = matchedProd.price;
    const total = price * newOrderQty;

    const newOrder: OnlineOrder = {
      id: `ped-web-${(onlineOrders.length + 1).toString().padStart(2, '0')}`,
      clientName: newOrderClient,
      phone: newOrderPhone || '(11) 99999-9999',
      items: [{ productName: matchedProd.name, quantity: newOrderQty, price }],
      total,
      status: 'Pendente',
      createdAt: new Date().toISOString(),
      address: newOrderAddress,
      deliveryFee: Number(newOrderFee),
      motoboy: newOrderRider || undefined,
      notes: newOrderNotes || undefined
    };

    setOnlineOrders(prev => [newOrder, ...prev]);

    // Reset Form
    setNewOrderClient('');
    setNewOrderPhone('');
    setNewOrderAddress('');
    setNewOrderProdId('');
    setNewOrderQty(1);
    setNewOrderFee(12);
    setNewOrderRider('');
    setNewOrderNotes('');

    showCustomAlert('Pedido Registrado', `Pedido registrado com sucesso! ID Gerado: ${newOrder.id.toUpperCase()}`);
  };

  const handleAssignMotoboy = (orderId: string, rider: string) => {
    setOnlineOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, motoboy: rider, status: o.status === 'Pendente' ? 'Separando' : o.status };
      }
      return o;
    }));
  };

  const handleSendWhatsAppOrder = (order: OnlineOrder) => {
    const itemsText = order.items.map(it => `• ${it.quantity}x ${it.productName}`).join('\n');
    const msg = `Olá, ${order.clientName}! 🌸\n\nSomos do suporte da *AP Moda Fitness*. Seu pedido *${order.id.toUpperCase()}* está no status: *${order.status}*!\n\n🛍️ *Seus Itens:*\n${itemsText}\n\n📍 *Endereço de Entrega:*\n${order.address}\n\n💵 *Total:* ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total + order.deliveryFee)} (já incluindo entrega).\n\n${order.status === 'Saiu para Entrega' ? `🏍️ Entregador encarregado: *${order.motoboy || 'Próprio'}*. Já estamos a caminho!` : 'Qualquer dúvida estamos à disposição!'}`;
    
    try {
      const url = `https://api.whatsapp.com/send?phone=${order.phone.replace(/\D/g, '')}&text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
    } catch {
      showCustomAlert('Mensagem do WhatsApp', msg);
    }
  };

  const handleCreateReservaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservaClient || !reservaProd) {
      showCustomAlert('Aviso', 'Favor preencher o Cliente e selecionar o Produto.');
      return;
    }

    const matchedProd = products.find(p => p.id === reservaProd);
    const prodName = matchedProd ? matchedProd.name : 'Produto Selecionado';
    const prodPrice = matchedProd ? matchedProd.price : 100;

    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() + Number(reservaDays));

    const newReserva: Reserva = {
      id: `res-${Date.now().toString().slice(-4)}`,
      clientName: reservaClient,
      productName: prodName,
      quantity: reservaQty,
      total: prodPrice * reservaQty,
      validUntil: limitDate.toISOString().split('T')[0],
      status: 'Ativa'
    };

    setReservas(prev => [newReserva, ...prev]);
    setReservaClient('');
    setReservaProd('');
    setReservaQty(1);
    showCustomAlert('Sucesso', 'Reserva efetuada com sucesso no sistema! O estoque deste item fica pré-reservado até a data selecionada.');
  };

  const handleCreateTrocaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trocaClient || !trocaReturned || !trocaTaken) {
      showCustomAlert('Aviso', 'Favor preencher todos os campos da troca.');
      return;
    }

    const newTroca: TrocaItem = {
      id: `trc-${Date.now().toString().slice(-4)}`,
      clientName: trocaClient,
      productReturned: trocaReturned,
      productTaken: trocaTaken,
      differenceAmount: Number(trocaDiff),
      date: new Date().toISOString(),
      reason: trocaReason
    };

    setTrocas(prev => [newTroca, ...prev]);

    // If there is difference to receive, we can optionally register a transaction
    if (Number(trocaDiff) > 0) {
      showCustomAlert('Troca Registrada', `Troca registrada! Cliente pagou diferença de R$ ${Number(trocaDiff).toFixed(2)}.`);
    } else if (Number(trocaDiff) < 0) {
      showCustomAlert('Troca Registrada', `Troca registrada! Foi gerado um vale-crédito no valor de R$ ${Math.abs(Number(trocaDiff)).toFixed(2)} para a cliente.`);
    } else {
      showCustomAlert('Troca Registrada', 'Troca registrada com sucesso (Valores casados, sem diferença financeira)!');
    }

    setTrocaClient('');
    setTrocaReturned('');
    setTrocaTaken('');
    setTrocaDiff(0);
  };

  const handlePayCrediario = (e: React.FormEvent) => {
    e.preventDefault();
    const credItem = crediario.find(c => c.id === credClientSelected);
    if (!credItem) return;

    const val = Number(credPayVal);
    if (val <= 0) return;

    setIsProcessingCredPay(true);
    setTimeout(() => {
      setCrediario(prev => prev.map(c => {
        if (c.id === credClientSelected) {
          return {
            ...c,
            usedAmount: Math.max(0, c.usedAmount - val),
            lastPaymentDate: new Date().toISOString().split('T')[0]
          };
        }
        return c;
      }));

      setIsProcessingCredPay(false);
      showCustomAlert('Sucesso', `Baixa no crediário efetuada! Cliente realizou pagamento de R$ ${val.toFixed(2)}.`);
      setCredClientSelected('');
      setCredPayVal(100);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Server Error Banner for API/Supabase/Melhor Envio Errors */}
      {serverError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold p-4 rounded-2xl flex items-center justify-between gap-3 mb-4 animate-in fade-in slide-in-from-top-4 duration-200 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg text-sm shrink-0">⚠️</span>
            <span>{serverError}</span>
          </div>
          <button
            onClick={() => setServerError(null)}
            className="text-rose-500 hover:text-rose-700 font-extrabold text-sm px-2 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Melhor Envio API Status Banner */}
      {melhorEnvioStatus && !melhorEnvioStatus.success && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold p-4 rounded-2xl flex items-center justify-between gap-3 mb-4 animate-in fade-in slide-in-from-top-4 duration-200 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm shrink-0">⚠️</span>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold">Integração com Melhor Envio Suspensa / Inativa</span>
              <span className="text-[11px] font-normal text-amber-800">
                {melhorEnvioStatus.message || 'Não foi possível ler o Token do banco ou estabelecer comunicação.'}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setMelhorEnvioStatus(null);
              fetch('/api/melhor-envio/status')
                .then(res => res.json())
                .then(data => {
                  if (data && data.success) {
                    setMelhorEnvioStatus({ success: true, message: data.message });
                  } else {
                    setMelhorEnvioStatus({ success: false, message: data ? data.error : 'Erro desconhecido' });
                  }
                })
                .catch(err => {
                  setMelhorEnvioStatus({ success: false, message: err.message });
                });
            }}
            className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-3 py-1.5 rounded-xl transition cursor-pointer border-none shrink-0"
          >
            🔄 Tentar Reconectar
          </button>
        </div>
      )}

      {/* Page Title & KPI Mini row */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-sans text-slate-800 tracking-tight">Comercial, Pedidos & Logística</h2>
          <p className="text-slate-400 text-sm">Gerencie faturamento online, controle motoboys, registre trocas das clientes e reservas de estoque</p>
        </div>

        {/* Operational pills */}
        <div className="flex gap-2">
          <div className="bg-white border border-slate-100 rounded-xl px-4 py-2 flex items-center gap-2.5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <div className="text-left leading-none">
              <span className="text-[9px] font-bold text-slate-400 font-sans uppercase">Entregas Ativas</span>
              <p className="text-sm font-bold text-slate-800 tracking-tight mt-0.5">{pendingShipmentsCount}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-xl px-4 py-2 flex items-center gap-2.5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
            <div className="text-left leading-none">
              <span className="text-[9px] font-bold text-slate-400 font-sans uppercase">Em Crediário</span>
              <p className="text-sm font-bold text-slate-800 tracking-tight mt-0.5">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCrediarioDevido)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Sub-menus */}
      <div className="flex border-b border-slate-100">
        <button
          type="button"
          onClick={() => setActiveSubTab('pedidos')}
          className={`px-4 py-2.5 font-sans text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer
            ${activeSubTab === 'pedidos' 
              ? 'border-pink-600 text-pink-600' 
              : 'border-transparent text-slate-450 hover:text-slate-700'}`}
        >
          <ShoppingBag size={14} />
          <span>Pedidos Online & Reservas</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('trocas_crediario')}
          className={`px-4 py-2.5 font-sans text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer
            ${activeSubTab === 'trocas_crediario' 
              ? 'border-pink-600 text-pink-600' 
              : 'border-transparent text-slate-450 hover:text-slate-700'}`}
        >
          <RefreshCcw size={14} />
          <span>Trocas, Devoluções & Crediário</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('logistica')}
          className={`px-4 py-2.5 font-sans text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer
            ${activeSubTab === 'logistica' 
              ? 'border-pink-600 text-pink-600' 
              : 'border-transparent text-slate-450 hover:text-slate-700'}`}
        >
          <Truck size={14} />
          <span>Acompanhamento & Motoboys</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('condicional')}
          className={`px-4 py-2.5 font-sans text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer
            ${activeSubTab === 'condicional' 
              ? 'border-pink-600 text-pink-600' 
              : 'border-transparent text-slate-450 hover:text-slate-700'}`}
        >
          <Briefcase size={14} />
          <span>Condicionais (Mala em Casa)</span>
        </button>
      </div>

      {/* Tab 1: Pedidos Online & Reservas */}
      {activeSubTab === 'pedidos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main List of Orders */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Fila de Separação de Pedidos da Loja (E-commerce / Whats)</h3>
                <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full">Sincronizado</span>
              </div>

              <div className="divide-y divide-slate-100">
                {onlineOrders.map(order => (
                  <div key={order.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded uppercase">
                          {order.id}
                        </span>
                        <div className="text-[10px] text-slate-400 font-sans flex items-center gap-1">
                          <Clock size={11} />
                          <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      {/* Status selectors */}
                      <div className="flex items-center gap-1.5">
                        <select
                          className="bg-slate-50 border border-slate-200 text-[10px] font-bold font-sans rounded px-2 py-1 text-slate-700 outline-hidden cursor-pointer"
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as OnlineOrder['status'])}
                        >
                          <option value="Pendente">Aguardando Separação (Pendente)</option>
                          <option value="Separando">Em Separação</option>
                          <option value="Pronto">Pronto para Enviar</option>
                          <option value="Saiu para Entrega">Saiu para Entrega</option>
                          <option value="Entregue">Pedido Entregue</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppOrder(order)}
                          title="Enviar atualização de status via WhatsApp"
                          className="p-1 px-2.5 bg-green-50 hover:bg-green-100 text-green-600 border border-green-200/20 rounded font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <MessageCircle size={12} />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedOrderForLabel(order)}
                          title="Imprimir Etiqueta de Envio Correios"
                          className="p-1 px-2 bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200/20 rounded font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Printer size={12} />
                          <span className="hidden sm:inline">Etiqueta</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleInvoiceOrder(order)}
                          title="Faturar e Lançar Venda no PDV"
                          className="p-1 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/40 rounded font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <ShoppingBag size={12} />
                          <span className="hidden md:inline">Faturar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingOrder(order)}
                          title="Editar Dados do Pedido"
                          className="p-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/50 rounded font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit size={12} />
                          <span className="hidden md:inline">Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteOnlineOrder(order.id)}
                          title="Excluir Definitivamente este Pedido Online"
                          className="p-1 px-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/40 rounded font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Trash2 size={12} />
                          <span className="hidden md:inline">Excluir</span>
                        </button>
                      </div>
                    </div>

                    {/* Compact Logistic Flow Section */}
                    <div className="mt-3 bg-slate-50/70 rounded-2xl border border-slate-150 p-3.5 space-y-3 font-sans text-xs">
                      <div className="flex items-center gap-1.5 border-b border-slate-200/60 pb-1.5 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                        <Truck size={12} className="text-pink-600" />
                        <span>Informações de Entrega & Despacho</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {/* Column 1: Client & Delivery Info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800 shrink-0">{order.clientName}</span>
                            <span className="text-slate-300">|</span>
                            <span className="font-mono text-slate-500 text-[11px] flex items-center gap-1">
                              CPF: {getOrderCpf(order)}
                              <button
                                onClick={() => handleCopyToClipboard(getOrderCpf(order), `${order.id}-cpf`)}
                                className="p-1 hover:bg-slate-200 text-slate-455 hover:text-slate-700 rounded-md transition-all cursor-pointer bg-transparent border-none"
                                title="Copiar CPF"
                              >
                                {copiedTextId === `${order.id}-cpf` ? <span className="text-emerald-600 font-bold text-[10px]">Copiado!</span> : <Copy size={11} />}
                              </button>
                            </span>
                          </div>

                          {/* Address */}
                          <div className="text-slate-550 text-[11px] bg-white border border-slate-150 p-2 rounded-xl flex items-start gap-2 shadow-xs">
                            <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0 text-left">
                              <p className="line-clamp-2 text-slate-700 leading-normal">{order.address}</p>
                            </div>
                            <button
                              onClick={() => handleCopyToClipboard(order.address, `${order.id}-addr`)}
                              className="p-1.5 hover:bg-slate-100 text-slate-455 hover:text-slate-700 rounded-lg transition-all cursor-pointer self-center bg-transparent border-none"
                              title="Copiar Endereço"
                            >
                              {copiedTextId === `${order.id}-addr` ? <span className="text-emerald-600 font-bold text-[10px]">Copiado!</span> : <Copy size={12} />}
                            </button>
                          </div>

                          {order.notes && (
                            <p className="text-blue-600 bg-blue-50/50 border border-blue-100/50 text-[10px] px-2 py-1 rounded-lg">
                              <strong>Obs:</strong> {order.notes}
                            </p>
                          )}
                        </div>

                        {/* Column 2: Order Items & Delivery Method */}
                        <div className="space-y-2.5 flex flex-col justify-between">
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <p key={idx} className="font-medium text-slate-700 text-[11px] flex justify-between">
                                <span>{item.quantity}x {item.productName}</span>
                                <span className="font-mono text-slate-500">({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)})</span>
                              </p>
                            ))}
                            <div className="border-t border-slate-100 pt-1.5 flex justify-between items-center">
                              <span className="text-slate-400 text-[11px]">Total c/ Entrega:</span>
                              <span className="font-extrabold text-pink-600 font-mono text-sm">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total + order.deliveryFee)}
                              </span>
                            </div>
                          </div>

                          {/* Freight Modality Badge & Actions */}
                          <div className="bg-white border border-slate-150 rounded-xl p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                            <div className="flex items-center gap-1.5 text-slate-650 font-medium">
                              <Truck size={13} className="text-pink-600 shrink-0" />
                              <span>Frete: <strong className="text-slate-800 uppercase">{getDeliveryLabel(order.deliveryMethod)}</strong></span>
                              <button
                                onClick={() => handleCopyToClipboard(getDeliveryLabel(order.deliveryMethod), `${order.id}-freight`)}
                                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded bg-transparent border-none"
                                title="Copiar Modalidade"
                              >
                                {copiedTextId === `${order.id}-freight` ? <span className="text-emerald-600 font-bold text-[9px]">Copiado</span> : <Copy size={10} />}
                              </button>
                            </div>

                            {/* Tracking Code or Motoboy Assignment inside here */}
                            {isMelhorEnvioDelivery(order.deliveryMethod) ? (
                              order.trackingCode && (
                                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                                  <span>Rastreio: <strong className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded">{order.trackingCode}</strong></span>
                                  <button
                                    onClick={() => handleCopyToClipboard(order.trackingCode, `${order.id}-track`)}
                                    className="p-1 hover:bg-slate-100 text-slate-400 bg-transparent border-none"
                                    title="Copiar Rastreio"
                                  >
                                    {copiedTextId === `${order.id}-track` ? <span className="text-emerald-650 font-bold text-[9px]">Copied</span> : <Copy size={10} />}
                                  </button>
                                </div>
                              )
                            ) : (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400">Rider:</span>
                                <select
                                  className="bg-slate-50 border border-slate-200 text-[10px] font-sans rounded px-1.5 py-0.5 text-slate-600 outline-hidden cursor-pointer"
                                  value={order.motoboy || ''}
                                  onChange={(e) => handleAssignMotoboy(order.id, e.target.value)}
                                >
                                  <option value="">-- Escolha --</option>
                                  {motoboys.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>

                          {/* Print Label Actions in correct intuitive flow */}
                          {isMelhorEnvioDelivery(order.deliveryMethod) && (
                            <div className="flex justify-end pt-1">
                              {((order.status_pagamento || '').toLowerCase() === 'pago' || (order.status || '').toLowerCase() === 'pago' || order.status === 'Pronto' || order.status === 'Saiu para Entrega' || order.status === 'Entregue') ? (
                                <button
                                  type="button"
                                  onClick={() => handleGenerateMelhorEnvioLabel(order)}
                                  disabled={isGeneratingLabelId === order.id}
                                  className="w-full py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white font-bold text-[11px] rounded-xl shadow-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 border-none"
                                >
                                  {isGeneratingLabelId === order.id ? (
                                    <>
                                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      <span>Gerando Etiqueta no Melhor Envio...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Printer size={13} />
                                      <span>{order.trackingCode ? 'Reemitir Etiqueta de Envio' : 'Gerar Etiqueta de Envio'}</span>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <div className="text-[10px] text-amber-600 bg-amber-50 border border-amber-150 rounded-lg p-1.5 w-full text-center font-semibold">
                                  ⚠️ Aguardando Confirmação de Pagamento para gerar etiqueta.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Reservas Panel */}
          <div className="space-y-6">
            
            {/* Create Reservation Form */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-4">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-50 pb-2">
                <Bookmark size={15} className="text-pink-600" />
                <h3 className="text-xs font-bold font-sans uppercase text-slate-700 tracking-wider">Criar Reserva de Peça</h3>
              </div>
              <form onSubmit={handleCreateReservaSubmit} className="space-y-3.5 text-xs font-sans">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nome da Cliente VIP</label>
                  <input
                    type="text"
                    required={true}
                    placeholder="Ex: Beatriz Pereira"
                    value={reservaClient}
                    onChange={(e) => setReservaClient(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Peça Desejada</label>
                  <select
                    required={true}
                    value={reservaProd}
                    onChange={(e) => setReservaProd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                  >
                    <option value="">-- Escolha o Produto --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Disponível: {p.stock})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Quantidade</label>
                    <input
                      type="number"
                      min={1}
                      value={reservaQty}
                      onChange={(e) => setReservaQty(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Prazo (Dias)</label>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={reservaDays}
                      onChange={(e) => setReservaDays(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Confirmar Reserva no Sistema
                </button>
              </form>
            </div>

            {/* Registrar Pedido de Entrega Moto Form */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-4">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-50 pb-2">
                <Truck size={15} className="text-pink-600" />
                <h3 className="text-xs font-bold font-sans uppercase text-slate-700 tracking-wider">Despachar Pedido c/ Motoboy</h3>
              </div>
              <form onSubmit={handleCreateOnlineOrderSubmit} className="space-y-3 text-xs font-sans">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nome do Cliente</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Ana Costa"
                    value={newOrderClient}
                    onChange={(e) => setNewOrderClient(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">WhatsApp/Telefone</label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 99999-9999"
                    value={newOrderPhone}
                    onChange={(e) => setNewOrderPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Endereço Completo de Entrega</label>
                  <input
                    type="text"
                    required
                    placeholder="Rua, Número, Bairro, Cidade - UF"
                    value={newOrderAddress}
                    onChange={(e) => setNewOrderAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-3 focus:outline-hidden text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Peça Vendida</label>
                  <select
                    required
                    value={newOrderProdId}
                    onChange={(e) => setNewOrderProdId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                  >
                    <option value="">-- Escolha o Produto --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (R$ {p.price})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Qtd</label>
                    <input
                      type="number"
                      min={1}
                      value={newOrderQty}
                      onChange={(e) => setNewOrderQty(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Taxa Entrega (R$)</label>
                    <input
                      type="number"
                      min={0}
                      value={newOrderFee}
                      onChange={(e) => setNewOrderFee(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Designar Motoboy Inicial (Opcional)</label>
                  <select
                    value={newOrderRider}
                    onChange={(e) => setNewOrderRider(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                  >
                    <option value="">-- Deixar em Aberto --</option>
                    {motoboys.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Observações de Rota</label>
                  <input
                    type="text"
                    placeholder="Ex: Próximo ao metrô Lorena"
                    value={newOrderNotes}
                    onChange={(e) => setNewOrderNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 border border-slate-800 text-white font-extrabold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Confirmar e Despachar Rota
                </button>
              </form>
            </div>

            {/* List Active reservations */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-4">
              <h3 className="text-xs font-bold font-sans uppercase text-slate-500 tracking-wider mb-2.5 font-bold">Reservas Ativas ({totalReservasAtivas})</h3>
              <div className="space-y-2.5">
                {reservas.map(res => (
                  <div key={res.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-sans">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-800">{res.clientName}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${res.status === 'Ativa' ? 'bg-amber-100 text-amber-800' : 'bg-slate-150 text-slate-500'}`}>
                        {res.status}
                      </span>
                    </div>
                    <p className="text-slate-650 font-medium">{res.quantity}x {res.productName}</p>
                    <div className="flex justify-between items-center mt-2 pt-1 border-t border-slate-150/50 text-[10px] text-slate-400">
                      <span>Expira em: <strong className="text-slate-500">{res.validUntil}</strong></span>
                      <span className="font-bold text-pink-600 font-mono">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(res.total)}</span>
                    </div>
                    <div className="flex gap-2.5 mt-2.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setReservas(prev => prev.map(r => r.id === res.id ? {...r, status: 'Retirada'} : r));
                          alert('Reserva faturada com sucesso! Lembre-se de lançar a venda correspondente no PDV.');
                        }}
                        className="flex-1 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors text-[9px] font-bold rounded"
                      >
                        Faturada / Retirada
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReservas(prev => prev.filter(r => r.id !== res.id));
                          alert('Reserva excluída e estoque liberado.');
                        }}
                        className="py-1 px-2 text-rose-600 hover:bg-rose-50 rounded transition-colors text-[9px] font-semibold"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab 2: Trocas, Devoluções & Crediário */}
      {activeSubTab === 'trocas_crediario' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Trocas registration */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-4">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                <RefreshCcw size={15} className="text-pink-600" />
                <span>Registrar Troca ou Devolução de Mercadoria</span>
              </h3>
              
              <form onSubmit={handleCreateTrocaSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 text-xs font-sans">
                <div className="lg:col-span-4">
                  <label className="block text-slate-450 font-semibold mb-1">Cliente Solicitante</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Maria Silva"
                    value={trocaClient}
                    onChange={(e) => setTrocaClient(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                  />
                </div>
                <div className="lg:col-span-4">
                  <label className="block text-slate-450 font-semibold mb-1">Peça Devolvida</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Legging Azul Wave (P)"
                    value={trocaReturned}
                    onChange={(e) => setTrocaReturned(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                  />
                </div>
                <div className="lg:col-span-4">
                  <label className="block text-slate-450 font-semibold mb-1">Peça Levada</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Legging Preta Sculpt (P) ou Cr-Vale"
                    value={trocaTaken}
                    onChange={(e) => setTrocaTaken(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                  />
                </div>

                <div className="lg:col-span-4">
                  <label className="block text-slate-450 font-semibold mb-1">Diferença Financeira (R$)</label>
                  <input
                    type="number"
                    value={trocaDiff}
                    onChange={(e) => setTrocaDiff(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                    placeholder="Positivo para cliente paga, Negativo para crédito"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Insira positivo caso a cliente esteja pagando a maior, e negativo gerando reembolso/vale.</p>
                </div>
                <div className="lg:col-span-5">
                  <label className="block text-slate-450 font-semibold mb-1">Motivo / Categoria</label>
                  <input
                    type="text"
                    value={trocaReason}
                    onChange={(e) => setTrocaReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                  />
                </div>
                <div className="lg:col-span-3 flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors cursor-pointer text-center"
                  >
                    Registrar Troca
                  </button>
                </div>
              </form>
            </div>

            {/* List of past Trocas */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-4">
              <h3 className="text-xs font-bold font-sans uppercase text-slate-500 tracking-wider mb-2.5 font-sans">Histórico Recente de Trocas</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-sans">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wider select-none">
                      <th className="p-3">Data</th>
                      <th className="p-3">Cliente</th>
                      <th className="p-3">Item Devolvido</th>
                      <th className="p-3">Item Entregue</th>
                      <th className="p-3">Diferença</th>
                      <th className="p-3">Motivo</th>
                      <th className="p-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {trocas.map(tr => (
                      <tr key={tr.id} className="hover:bg-slate-50/40">
                        <td className="p-3 font-mono text-[10px]">{new Date(tr.date).toLocaleDateString()}</td>
                        <td className="p-3 font-bold">{tr.clientName}</td>
                        <td className="p-3 text-red-600 bg-red-50/10 font-medium">{tr.productReturned}</td>
                        <td className="p-3 text-emerald-600 bg-emerald-50/10 font-medium">{tr.productTaken}</td>
                        <td className="p-3 font-mono font-bold">
                          {tr.differenceAmount > 0 ? (
                            <span className="text-emerald-600">+{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tr.differenceAmount)}</span>
                          ) : tr.differenceAmount < 0 ? (
                            <span className="text-amber-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tr.differenceAmount)}</span>
                          ) : (
                            <span className="text-slate-400">R$ 0,00</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-450 italic">{tr.reason}</td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEditTroca(tr)}
                              className="p-1 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                              title="Editar Troca"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTroca(tr.id)}
                              className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Excluir Troca"
                            >
                              <Trash2 size={12} />
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

          {/* Crediario sidebar box */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Pay Crediario Form */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-4">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-50 pb-2">
                <DollarSign size={15} className="text-pink-600" />
                <h3 className="text-xs font-bold font-sans uppercase text-slate-700 tracking-wider">Quitar / Amortizar Crediário</h3>
              </div>
              <form onSubmit={handlePayCrediario} className="space-y-3.5 text-xs font-sans">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Selecionar Caderneta</label>
                  <select
                    required
                    value={credClientSelected}
                    onChange={(e) => setCredClientSelected(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                  >
                    <option value="">-- Selecione a Ficha --</option>
                    {crediario.map(c => (
                      <option key={c.id} value={c.id}>{c.clientName} (Saldo: R$ {c.usedAmount.toFixed(2)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Valor do Pagamento (R$)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={credPayVal}
                    onChange={(e) => setCredPayVal(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Registrar Pagamento de Carnê
                </button>
              </form>
            </div>

            {/* List Crediario entries */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-4">
              <h3 className="text-xs font-bold font-sans uppercase text-slate-500 tracking-wider mb-2.5">Faturamento em Aberto (Crediário)</h3>
              <div className="space-y-3">
                {crediario.map(cred => (
                  <div key={cred.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-sans">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-800">{cred.clientName}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cred.status === 'Regular' ? 'bg-green-100 text-green-800' : 'bg-red-150 text-red-800 animate-pulse'}`}>
                        {cred.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 mt-1.5">
                      <span>Limite Usado:</span>
                      <span className="font-bold text-slate-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cred.usedAmount)} / {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cred.totalLimit)}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-pink-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, (cred.usedAmount / cred.totalLimit) * 100)}%` }} />
                    </div>
                    {cred.lastPaymentDate && (
                      <p className="text-[10px] text-slate-400 mt-2 font-sans">Último pagamento em: <strong className="text-slate-500">{cred.lastPaymentDate}</strong></p>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab 3: Logística & Motoboys */}
      {activeSubTab === 'logistica' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Motoboy Status Dashboard */}
          <div className="lg:col-span-2 space-y-6 text-xs font-sans">
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-4">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                <Truck size={15} className="text-pink-600" />
                <span>Gestão Logística de Encomendas & Motoboys</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-bold block">Faturamento Envio</span>
                  <span className="text-lg font-bold text-slate-800 mt-0.5">R$ 45,00</span>
                  <p className="text-[9px] text-slate-400 mt-1">Taxas de entregas coletadas ontem/hoje</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-bold block">Média Tempo de Entrega</span>
                  <span className="text-lg font-bold text-slate-800 mt-0.5">32 minutos</span>
                  <p className="text-[9px] text-slate-400 mt-1">Desde a expedição até o recebimento</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-bold block">Modos Disponíveis</span>
                  <span className="text-lg font-bold text-slate-800 mt-0.5">Motoboy VIP, Correios</span>
                  <p className="text-[9px] text-slate-400 mt-1">Disponíveis para checkout no e-commerce</p>
                </div>
              </div>

              {/* Delivery Riders statuses */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-700">Status dos Entregadores Parceiros</h4>
                <button
                  type="button"
                  onClick={() => setIsAddRiderModalOpen(true)}
                  className="text-[10px] font-bold text-pink-600 hover:text-pink-700 flex items-center gap-0.5 cursor-pointer bg-pink-50 px-2 py-1 rounded"
                >
                  <Plus size={11} /> Novo Entregador
                </button>
              </div>
              <div className="space-y-2.5">
                {deliveryRiders.map((m, idx) => (
                  <div key={m.id || idx} className="p-3 bg-white border border-slate-150 rounded-xl hover:shadow-xs transition-shadow flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-600 font-bold flex items-center justify-center">
                        <User size={13} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{m.name}</p>
                        <p className="text-slate-400 text-[10px] mt-0.5">Região preferencial: {m.region}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block
                          ${m.status === 'Disponível' || m.status === 'Completado' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800 animate-pulse'}`}>
                          {m.status}
                        </span>
                        {m.salesAssigned > 0 && <p className="text-slate-400 text-[9px] mt-0.5">{m.salesAssigned} entrega(s) pendente</p>}
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => startEditRider(m)}
                          className="p-1 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                          title="Editar Entregador"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRider(m.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Excluir Entregador"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Zone/neighborhood pricing list */}
          <div className="space-y-6 text-xs font-sans">
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-4">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-50 pb-2">
                <MapPin size={15} className="text-pink-600" />
                <h3 className="text-xs font-bold font-sans uppercase text-slate-700 tracking-wider">Calculadora de Frete Local (Motoboy)</h3>
              </div>
              
              <div className="space-y-2 text-slate-650">
                <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                  <span className="font-medium">Região Central / Próximo à Loja</span>
                  <span className="font-bold text-slate-800">R$ 10,00</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                  <span className="font-medium">Zona Sul / Bairros Vizinhos (7-15km)</span>
                  <span className="font-bold text-slate-800">R$ 15,00</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                  <span className="font-medium">Zona Norte / Periferias (15-25km)</span>
                  <span className="font-bold text-slate-800">R$ 20,00</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                  <span className="font-medium">Região Metropolitana (Correios PAC)</span>
                  <span className="font-bold text-slate-800">R$ 25,00</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-pink-50/30 rounded-xl border border-pink-100/50 text-[11px] leading-relaxed text-pink-900/80">
                💡 <strong>Dica de Vendedor:</strong> Ofereça <strong>Frete Grátis</strong> para compras acima de <strong>R$ 399,00</strong>! Isso aumenta seu Ticket Médio e induz compras combinadas de legging + top!
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Tab 4: Condicionais (Mala em Casa) */}
      {activeSubTab === 'condicional' && (
        <div className="space-y-6">
          {/* Stat cards row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-bold block uppercase text-[10px]">Sacolas em Trânsito</span>
                <span className="text-xl font-extrabold text-slate-800 mt-0.5">
                  {condicionais.filter(c => c.status === 'Pendente').length} Ativas
                </span>
                <p className="text-slate-400 text-[10px] mt-1">Malas com clientes para provar em casa</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center">
                <Briefcase size={18} />
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-bold block uppercase text-[10px]">Valor Potencial Sob Prova</span>
                <span className="text-xl font-extrabold text-emerald-600 mt-0.5">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    condicionais
                      .filter(c => c.status === 'Pendente')
                      .reduce((sum, cond) => sum + cond.items.reduce((iSum: number, item: any) => iSum + (item.price * item.quantity), 0), 0)
                  )}
                </span>
                <p className="text-slate-400 text-[10px] mt-1">Valor de tabela de todas as peças despachadas</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign size={18} />
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-bold block uppercase text-[10px]">Retorno Estimado</span>
                <span className="text-xl font-extrabold text-indigo-650 mt-0.5">72 Horas limite</span>
                <p className="text-slate-400 text-[10px] mt-1">Fidelização e comodidade com alta conversão</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Clock size={18} />
              </div>
            </div>
          </div>

          {/* Table list and control box */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-50 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Controle de Condicionais (Mala em Casa)</h3>
                <p className="text-slate-400 text-xs mt-0.5">Monitore peças enviadas para clientes experimentarem e feche as vendas do que elas escolherem</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCondProducts([]);
                  setCondClient('');
                  setCondPhone('');
                  setCondDays(3);
                  setSelectedClientObj(null);
                  setIsCondicionalModalOpen(true);
                }}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-pink-500/10 self-start sm:self-center border-none"
              >
                <Plus size={14} />
                <span>Montar Nova Sacola</span>
              </button>
            </div>

            {/* List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider select-none">
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Contato</th>
                    <th className="p-3">Data Envio</th>
                    <th className="p-3">Prazo Retorno</th>
                    <th className="p-3">Peças Enviadas</th>
                    <th className="p-3 text-right">Valor Total</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Ações de Resolução</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-755">
                  {condicionais.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                        Nenhuma sacola condicional registrada no momento.
                      </td>
                    </tr>
                  ) : (
                    condicionais.map((cond) => {
                      const totalVal = cond.items.reduce((s: number, i: any) => s + (i.price * i.quantity), 0);
                      const isLate = cond.status === 'Pendente' && new Date(cond.dateLimit) < new Date();
                      return (
                        <tr key={cond.id} className="hover:bg-slate-50/30">
                          <td className="p-3 font-bold text-slate-800">{cond.clientName}</td>
                          <td className="p-3 font-mono text-[10px] text-slate-500">{cond.phone || 'Sem celular'}</td>
                          <td className="p-3 font-mono text-[10px]">{cond.dateOut}</td>
                          <td className="p-3 font-mono text-[10px]">
                            <span className={isLate ? 'text-red-650 font-bold' : ''}>
                              {cond.dateLimit} {isLate && '⚠️ (Atrasado!)'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-705 px-2 py-0.5 bg-slate-100 rounded-full text-[10px]">
                              {cond.items.length} itens
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1 max-w-xs truncate">
                              {cond.items.map((i: any) => `${i.quantity}x ${i.productName}`).join(', ')}
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-850">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVal)}
                          </td>
                          <td className="p-3">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block
                              ${cond.status === 'Finalizado' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : isLate 
                                ? 'bg-red-100 text-red-800 animate-pulse' 
                                : 'bg-amber-100 text-amber-800'}`}>
                              {cond.status === 'Pendente' ? 'Com Cliente' : cond.status}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1.5">
                              {cond.status === 'Pendente' && (
                                <>
                                  <button
                                    title="Chamar WhatsApp para alinhar peças"
                                    type="button"
                                    onClick={() => {
                                      const dateLimitFormatted = cond.dateLimit;
                                      const itemsText = cond.items.map((i: any) => `• ${i.quantity}x ${i.productName} - R$ ${i.price.toFixed(2)}`).join('\n');
                                      const totalVal = cond.items.reduce((s: number, i: any) => s + (i.price * i.quantity), 0);
                                      const totalFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVal);
                                      const text = `Olá, ${cond.clientName}! Tudo bem? ❤️\n\nPassando para acompanhar as pecinhas da sua *Mala de Condicional* da *AP Moda Fitness*! 🥰\n\n📦 *Peças na sua mala:*\n${itemsText}\n\n💰 *Valor total sob prova:* ${totalFormatted}\n⏳ *Prazo de devolução/retorno:* ${dateLimitFormatted}\n\nExperimente com calma e me diga quais você mais amou e quer ficar! Se precisar de ajuda para escolher ou quiser simular suas medidas no nosso *Provador Virtual*, estou por aqui! 🌸🏼‍♀️`;
                                      window.open(`https://api.whatsapp.com/send?phone=55${cond.phone}&text=${encodeURIComponent(text)}`, '_blank');
                                    }}
                                    className="p-1 px-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors border-none font-bold text-[10px] cursor-pointer flex items-center gap-1"
                                  >
                                    <MessageCircle size={10} />
                                    Cobrar Whats
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // pre-fill the purchased items to default maximum quantities
                                      const initialQty: { [productId: string]: number } = {};
                                      cond.items.forEach((it: any) => {
                                        initialQty[it.productId] = it.quantity;
                                      });
                                      setItemsToBuyQty(initialQty);
                                      setClosingCondBag(cond);
                                    }}
                                    className="p-1 px-2.5 bg-pink-600 text-white hover:bg-pink-700 rounded-lg transition-colors border-none font-bold text-[10px] cursor-pointer"
                                  >
                                    Devolução / Venda
                                  </button>
                                </>
                              )}
                              <button
                                title="Excluir Condicional"
                                type="button"
                                onClick={() => {
                                  if (confirm('Deseja realmente remover esta sacola condicional sem registrar venda?')) {
                                    setCondicionais(prev => prev.filter(c => c.id !== cond.id));
                                  }
                                }}
                                className="p-1.5 bg-slate-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors border-none cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Create New Condicional Bag */}
      {isCondicionalModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-50 overflow-hidden font-sans">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-xs tracking-wider uppercase flex items-center gap-1.5">
                <Briefcase size={14} className="text-pink-500" />
                Montar Mala Condicional (Mala em Casa)
              </span>
              <button 
                onClick={() => setIsCondicionalModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors text-xs border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700 max-h-[85vh] overflow-y-auto">
              <div className="bg-pink-50/40 p-3 rounded-xl border border-pink-100/55 space-y-2">
                <label className="text-pink-850 font-bold uppercase text-[9px] tracking-wide block">Localizar Cliente no CRM (Otimização de Medidas)</label>
                <select
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    if (selectedId) {
                      const found = clients.find(c => c.id === selectedId);
                      if (found) {
                        setCondClient(found.name);
                        setCondPhone(found.phone || '');
                        setSelectedClientObj(found);
                      }
                    } else {
                      setSelectedClientObj(null);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-pink-500 transition-all font-medium font-sans text-xs"
                >
                  <option value="">-- Selecionar Cliente Cadastrada (Opcional) --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Virtual Fitting Room CRM Integration display */}
              {selectedClientObj && (selectedClientObj.busto || selectedClientObj.cintura || selectedClientObj.quadril || selectedClientObj.altura) && (
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[9px] text-slate-500 uppercase tracking-widest font-mono">📏 Medidas do Perfil & Tamanho Recomendado</span>
                    <span className="bg-pink-100 text-pink-700 font-extrabold px-2 py-0.5 rounded-full text-[10px]">
                      Tamanho Ideal: {(() => {
                        const busto = selectedClientObj.busto;
                        const cintura = selectedClientObj.cintura;
                        const quadril = selectedClientObj.quadril;
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
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                     <div className="bg-white p-1.5 rounded-lg border border-slate-150">
                       <span className="block text-[8px] text-slate-400 font-bold uppercase">Busto</span>
                       <span className="font-mono font-bold text-slate-700">{selectedClientObj.busto ? `${selectedClientObj.busto} cm` : '--'}</span>
                     </div>
                     <div className="bg-white p-1.5 rounded-lg border border-slate-150">
                       <span className="block text-[8px] text-slate-400 font-bold uppercase">Cintura</span>
                       <span className="font-mono font-bold text-slate-700">{selectedClientObj.cintura ? `${selectedClientObj.cintura} cm` : '--'}</span>
                     </div>
                     <div className="bg-white p-1.5 rounded-lg border border-slate-150">
                       <span className="block text-[8px] text-slate-400 font-bold uppercase">Quadril</span>
                       <span className="font-mono font-bold text-slate-700">{selectedClientObj.quadril ? `${selectedClientObj.quadril} cm` : '--'}</span>
                     </div>
                     <div className="bg-white p-1.5 rounded-lg border border-slate-150">
                       <span className="block text-[8px] text-slate-400 font-bold uppercase">Altura/Peso</span>
                       <span className="font-mono font-bold text-slate-700">{selectedClientObj.altura ? `${selectedClientObj.altura}m` : '--'}/{selectedClientObj.peso ? `${selectedClientObj.peso}kg` : '--'}</span>
                     </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold uppercase text-[9px] tracking-wide block">Nome da Cliente</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex: Ana Carolina Silva"
                    value={condClient}
                    onChange={(e) => setCondClient(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-pink-500 transition-all font-medium font-sans text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold uppercase text-[9px] tracking-wide block">Telefone WhatsApp</label>
                  <input 
                    type="text"
                    placeholder="Ex: 11999998888"
                    value={condPhone}
                    onChange={(e) => setCondPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-pink-500 transition-all font-medium font-sans text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold uppercase text-[9px] tracking-wide block">Dias de Prova limite</label>
                  <select 
                    value={condDays}
                    onChange={(e) => setCondDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-pink-500 transition-all font-medium font-sans text-xs"
                  >
                    <option value={2}>2 dias (Express)</option>
                    <option value={3}>3 dias (Padrão recomendável)</option>
                    <option value={5}>5 dias (Fim de semana estendido)</option>
                    <option value={7}>7 dias (Especial)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold uppercase text-[9px] tracking-wide block">Dica Comercial</label>
                  <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-100 text-amber-900 text-[10px] leading-relaxed">
                    🌟 <strong>Otimização AP:</strong> Adicione modelos variados de fitness (tops, shorts, calças e macacões) do tamanho sugerido no CRM da cliente para induzir o "efeito look completo"!
                  </div>
                </div>
              </div>

              {/* Add item box */}
              <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 space-y-3">
                <h4 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">Adicionar Peças na Sacola Condicional</h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <select
                      value={currentSelectedProdId}
                      onChange={(e) => setCurrentSelectedProdId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-pink-500 text-xs text-slate-700 font-medium"
                    >
                      <option value="">-- Escolha uma peça de roupa --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (R$ {p.price.toFixed(2)}) - Estoque: {p.stock}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-24">
                    <input
                      type="number"
                      min={1}
                      placeholder="Qtd"
                      value={currentSelectedProdQty}
                      onChange={(e) => setCurrentSelectedProdQty(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-pink-500 text-xs text-slate-700 text-center font-bold"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentSelectedProdId) {
                        alert('Por favor, selecione uma peça!');
                        return;
                      }
                      const p = products.find(prod => prod.id === currentSelectedProdId);
                      if (!p) return;

                      // Check if already in list
                      const existingIndex = selectedCondProducts.findIndex(item => item.productId === p.id);
                      if (existingIndex > -1) {
                        setSelectedCondProducts(prev => prev.map((item, idx) => {
                          if (idx === existingIndex) {
                            return { ...item, quantity: item.quantity + currentSelectedProdQty };
                          }
                          return item;
                        }));
                      } else {
                        setSelectedCondProducts(prev => [...prev, {
                          productId: p.id,
                          productName: p.name,
                          quantity: currentSelectedProdQty,
                          price: p.price,
                          cost: p.cost || p.price * 0.4
                        }]);
                      }

                      setCurrentSelectedProdId('');
                      setCurrentSelectedProdQty(1);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors border-none cursor-pointer text-xs"
                  >
                    Incluir
                  </button>
                </div>
              </div>

              {/* Selected items list */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold uppercase text-[9px] tracking-wide block">Itens da Sacola de Prova ({selectedCondProducts.length})</label>
                <div className="border border-slate-100 rounded-xl bg-white max-h-40 overflow-y-auto divide-y divide-slate-50 font-sans p-1">
                  {selectedCondProducts.length === 0 ? (
                    <p className="p-6 text-center text-slate-400 italic">Sua sacola condicional está vazia. Adicione produtos acima.</p>
                  ) : (
                    selectedCondProducts.map((item, index) => (
                      <div key={index} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50">
                        <div>
                          <p className="font-bold text-slate-700">{item.productName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Qtd: <strong className="text-slate-600">{item.quantity}</strong> | Unitário: R$ {item.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-805 font-mono">
                            R$ {(item.price * item.quantity).toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedCondProducts(prev => prev.filter((_, idx) => idx !== index))}
                            className="text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsCondicionalModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-650 hover:bg-slate-200 rounded-xl font-bold transition-all cursor-pointer text-center border-none text-xs"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    if (!condClient.trim()) {
                      alert('Favor inserir o nome da cliente!');
                      return;
                    }
                    if (selectedCondProducts.length === 0) {
                      alert('Selecione pelo menos um produto para o condicional!');
                      return;
                    }

                    const dateOutStr = new Date().toISOString().split('T')[0];
                    const limitDate = new Date();
                    limitDate.setDate(limitDate.getDate() + condDays);
                    const dateLimitStr = limitDate.toISOString().split('T')[0];

                    const newCondBag = {
                      id: `cond-${Date.now()}`,
                      clientName: condClient.trim(),
                      phone: condPhone.trim(),
                      items: selectedCondProducts,
                      dateOut: dateOutStr,
                      dateLimit: dateLimitStr,
                      status: 'Pendente'
                    };

                    setCondicionais(prev => [newCondBag, ...prev]);
                    setIsCondicionalModalOpen(false);
                    
                    const openWhatsApp = confirm(`Sacola condicional para a cliente ${condClient} gravada com sucesso!\n\nDeseja abrir o WhatsApp para enviar o recibo detalhado da mala condicional com a lista de peças?`);
                    if (openWhatsApp) {
                      const itemsText = selectedCondProducts.map(i => `• ${i.quantity}x ${i.productName} - R$ ${i.price.toFixed(2)}`).join('\n');
                      const totalVal = selectedCondProducts.reduce((s, i) => s + (i.price * i.quantity), 0);
                      const totalFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVal);
                      const msgText = `Olá, ${condClient.trim()}! Tudo bem? ❤️\n\nSua *Mala de Condicional* da *AP Moda Fitness* está pronta e a caminho! 🥰\n\n📦 *Peças enviadas para você provar em casa:*\n${itemsText}\n\n💰 *Valor total sob prova:* ${totalFormatted}\n⏳ *Prazo para retorno sugerido:* ${dateLimitStr}\n\nExperimente tudo com carinho! Caso queira ajustar ou simular suas medidas no nosso *Provador Virtual*, estamos à disposição. Boas provas! 🌸🏃‍♀️`;
                      window.open(`https://api.whatsapp.com/send?phone=55${condPhone.trim()}&text=${encodeURIComponent(msgText)}`, '_blank');
                    }
                  }}
                  className="flex-1 py-2.5 bg-pink-600 text-white hover:bg-pink-700 rounded-xl font-bold transition-all cursor-pointer text-center shadow-md shadow-pink-500/10 border-none text-xs"
                >
                  Confirmar Envio Condicional
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Close and Finalize Active Condicional Bag */}
      {closingCondBag && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all col-span-12 font-sans">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-50 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-xs tracking-wider uppercase flex items-center gap-1.5 leading-none">
                <Check size={14} className="text-pink-500" />
                Devolução & Fechamento de Venda Condicional
              </span>
              <button 
                onClick={() => setClosingCondBag(null)}
                className="text-slate-400 hover:text-white transition-colors text-xs border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700 max-h-[85vh] overflow-y-auto">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs leading-relaxed">
                <div>
                  <p className="font-bold text-slate-800 text-[11px]">{closingCondBag.clientName}</p>
                  <p className="text-slate-400 text-[10px] mt-0.5">Prazo Estimado: {closingCondBag.dateLimit} | Enviado em: {closingCondBag.dateOut}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold">Total Condicional</span>
                  <span className="text-xs font-extrabold text-slate-700">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      closingCondBag.items.reduce((s: number, i: any) => s + (i.price * i.quantity), 0)
                    )}
                  </span>
                </div>
              </div>

              {/* Item quantities bought */}
              <div className="space-y-2">
                <label className="text-slate-400 font-bold uppercase text-[9px] tracking-wide block">Instrução: Escolha a quantidade de peças QUE A CLIENTE COMPROU</label>
                <p className="text-[10px] text-slate-400 leading-none">O restante das peças será automaticamente recolhida de volta ao estoque!</p>
                <div className="border border-slate-100 rounded-xl bg-white divide-y divide-slate-100 pr-1 max-h-48 overflow-y-auto">
                  {closingCondBag.items.map((item: any, idx: number) => {
                    const currentQtyToBuy = itemsToBuyQty[item.productId] ?? 0;
                    return (
                      <div key={idx} className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                        <div className="flex-1">
                          <p className="font-bold text-slate-750">{item.productName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Preço de Tabela: R$ {item.price.toFixed(2)} | Qtd Enviada: {item.quantity} peça(s)
                          </p>
                        </div>
                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <span className="text-[10px] font-semibold text-slate-400">Comprando:</span>
                          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                            <button
                              type="button"
                              onClick={() => {
                                setItemsToBuyQty(prev => ({
                                  ...prev,
                                  [item.productId]: Math.max(0, currentQtyToBuy - 1)
                                }));
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 font-bold border-none cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-3.5 font-bold text-slate-800 text-xs min-w-8 text-center">{currentQtyToBuy}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setItemsToBuyQty(prev => ({
                                  ...prev,
                                  [item.productId]: Math.min(item.quantity, currentQtyToBuy + 1)
                                }));
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 font-bold border-none cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary of checkout */}
              {(() => {
                let purchaseItemsCount = 0;
                let returnItemsCount = 0;
                let finalSaleTotal = 0;

                closingCondBag.items.forEach((item: any) => {
                  const buyQty = itemsToBuyQty[item.productId] ?? 0;
                  finalSaleTotal += (item.price * buyQty);
                  purchaseItemsCount += buyQty;
                  returnItemsCount += (item.quantity - buyQty);
                });

                return (
                  <div className="space-y-3.5">
                    <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 font-sans space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500">
                        <span>Peças Compradas:</span>
                        <span className="text-slate-800 font-bold">{purchaseItemsCount} item(ns)</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500">
                        <span>Peças Retornadas ao Estoque:</span>
                        <span className="text-slate-800 font-bold">{returnItemsCount} item(ns)</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-slate-800 border-t border-slate-200/50 pt-2">
                        <span>VALOR FINAL DA COMPRA:</span>
                        <span className="text-pink-600 text-sm font-extrabold">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalSaleTotal)}
                        </span>
                      </div>
                    </div>

                    {purchaseItemsCount > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-slate-400 font-bold uppercase text-[9px] tracking-wide block">Vendedor Atribuído</label>
                          <select 
                            value={condSalesperson}
                            onChange={(e) => setCondSalesperson(e.target.value)}
                            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-pink-500"
                          >
                            {sellers.length > 0 ? (
                              sellers.map(name => (
                                <option key={name} value={name}>{name}</option>
                              ))
                            ) : (
                              <>
                                <option value="Sem Vendedor">Sem Vendedor</option>
                                <option value="Juliana Cardoso">Juliana Cardoso</option>
                              </>
                            )}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 font-bold uppercase text-[9px] tracking-wide block">Método de Liquidação</label>
                          <select className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-pink-500">
                            <option value="Pix">Pix Garantido</option>
                            <option value="Cartão">Cartão de Crédito</option>
                            <option value="Dinheiro">Espécie / Dinheiro</option>
                            <option value="Crediário">Crediário da Casa (Caderneta)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button 
                        type="button" 
                        onClick={() => setClosingCondBag(null)}
                        className="flex-1 py-2.5 bg-slate-100 text-slate-650 hover:bg-slate-200 rounded-xl font-bold transition-all cursor-pointer text-center border-none text-xs"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          // Compile items bought
                          const saleItems: any[] = [];
                          let totalToPay = 0;
                          let totalCost = 0;

                          closingCondBag.items.forEach((item: any) => {
                            const buyQty = itemsToBuyQty[item.productId] ?? 0;
                            if (buyQty > 0) {
                              const itCost = item.cost || item.price * 0.4;
                              saleItems.push({
                                productId: item.productId,
                                name: item.productName,
                                quantity: buyQty,
                                price: item.price,
                                cost: itCost
                              });
                              totalToPay += (item.price * buyQty);
                              totalCost += (itCost * buyQty);
                            }
                          });

                          // Register Sale if any items bought
                          if (saleItems.length > 0) {
                            onAddSale({
                              id: `sale-cond-${Date.now()}`,
                              clientName: closingCondBag.clientName,
                              channel: 'WhatsApp',
                              items: saleItems,
                              total: totalToPay,
                              costTotal: totalCost,
                              status: 'Concluída',
                              createdAt: new Date().toISOString(),
                              salesperson: condSalesperson
                            });
                          }

                          // Mark as closed in state
                          setCondicionais(prev => prev.map(c => {
                            if (c.id === closingCondBag.id) {
                              return { ...c, status: 'Finalizado' };
                            }
                            return c;
                          }));

                          setClosingCondBag(null);
                          alert(`Resolução da sacola condicional realizada com sucesso! ${saleItems.length > 0 ? `Venda registrada no valor de R$ ${totalToPay.toFixed(2)}.` : 'Nenhum item foi selecionado para compra. As peças foram recolhidas com sucesso!'}`);
                        }}
                        className="flex-1 py-2.5 bg-pink-600 text-white hover:bg-pink-700 rounded-xl font-bold transition-all cursor-pointer text-center shadow-md shadow-pink-500/10 border-none text-xs"
                      >
                        {purchaseItemsCount > 0 ? 'Gravar Venda & Retorno de Peças' : 'Confirmar Retorno do Condicional'}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Troca */}
      {editingTroca && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-lg overflow-hidden animate-in fade-in duration-200 text-left font-sans text-xs">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <span className="font-extrabold text-xs uppercase tracking-wider">Editar Registro de Troca</span>
              <button type="button" onClick={() => setEditingTroca(null)} className="text-slate-400 hover:text-white transition-colors border-none bg-transparent cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveTrocaEdit} className="p-4 space-y-3">
              <div>
                <label className="text-slate-400 font-bold text-[8px] uppercase block mb-0.5">Cliente</label>
                <input
                  type="text"
                  value={editTrocaClient}
                  onChange={e => setEditTrocaClient(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 focus:bg-white transition-colors focus:ring-1 focus:ring-pink-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold text-[8px] uppercase block mb-0.5">Item Devolvido</label>
                <input
                  type="text"
                  value={editTrocaReturned}
                  onChange={e => setEditTrocaReturned(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 focus:bg-white transition-colors focus:ring-1 focus:ring-pink-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold text-[8px] uppercase block mb-0.5">Item Entregue / Retirado</label>
                <input
                  type="text"
                  value={editTrocaTaken}
                  onChange={e => setEditTrocaTaken(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 focus:bg-white transition-colors focus:ring-1 focus:ring-pink-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold text-[8px] uppercase block mb-0.5">Diferença Financeira (Em R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editTrocaDiff}
                  onChange={e => setEditTrocaDiff(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 focus:bg-white transition-colors focus:ring-1 focus:ring-pink-500 outline-none"
                  required
                />
                <span className="text-[9px] text-slate-400 block mt-0.5">Positivo se o cliente pagou a mais; Negativo se ficou de vale-crédito.</span>
              </div>
              <div>
                <label className="text-slate-400 font-bold text-[8px] uppercase block mb-0.5">Motivo da Troca</label>
                <input
                  type="text"
                  value={editTrocaReason}
                  onChange={e => setEditTrocaReason(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 focus:bg-white transition-colors focus:ring-1 focus:ring-pink-500 outline-none"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setEditingTroca(null)} className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold border-none cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-bold border-none cursor-pointer">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Delivery Rider */}
      {isAddRiderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-lg overflow-hidden animate-in fade-in duration-200 text-left font-sans text-xs">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <span className="font-extrabold text-xs uppercase tracking-wider">Novo Entregador Parceiro</span>
              <button type="button" onClick={() => setIsAddRiderModalOpen(false)} className="text-slate-400 hover:text-white transition-colors border-none bg-transparent cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddRiderSubmit} className="p-4 space-y-3">
              <div>
                <label className="text-slate-400 font-bold text-[8px] uppercase block mb-0.5">Nome do Entregador</label>
                <input
                  type="text"
                  value={addRiderName}
                  onChange={e => setAddRiderName(e.target.value)}
                  placeholder="Ex: Pedro Henrique (Moto 3)"
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 focus:bg-white transition-colors focus:ring-1 focus:ring-pink-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold text-[8px] uppercase block mb-0.5">Região Preferencial</label>
                <input
                  type="text"
                  value={addRiderRegion}
                  onChange={e => setAddRiderRegion(e.target.value)}
                  placeholder="Ex: Zona Norte / Santana"
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 focus:bg-white transition-colors focus:ring-1 focus:ring-pink-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold text-[8px] uppercase block mb-0.5">Status Inicial</label>
                <select
                  value={addRiderStatus}
                  onChange={e => setAddRiderStatus(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 focus:bg-white transition-colors focus:ring-1 focus:ring-pink-500 outline-none"
                >
                  <option value="Disponível">Disponível</option>
                  <option value="Fazendo Entrega">Fazendo Entrega</option>
                  <option value="Completado">Completado</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 font-bold text-[8px] uppercase block mb-0.5">Entregas Pendentes</label>
                <input
                  type="number"
                  value={addRiderAssigned}
                  onChange={e => setAddRiderAssigned(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 focus:bg-white transition-colors focus:ring-1 focus:ring-pink-500 outline-none"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setIsAddRiderModalOpen(false)} className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold border-none cursor-pointer font-sans">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-bold border-none cursor-pointer font-sans">Adicionar Entregador</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Delivery Rider */}
      {editingRider && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-lg overflow-hidden animate-in fade-in duration-200 text-left font-sans text-xs">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <span className="font-extrabold text-xs uppercase tracking-wider">Editar Entregador</span>
              <button type="button" onClick={() => setEditingRider(null)} className="text-slate-400 hover:text-white transition-colors border-none bg-transparent cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveRiderEdit} className="p-4 space-y-3">
              <div>
                <label className="text-slate-400 font-bold text-[8px] uppercase block mb-0.5">Nome do Entregador</label>
                <input
                  type="text"
                  value={editRiderName}
                  onChange={e => setEditRiderName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 focus:bg-white transition-colors focus:ring-1 focus:ring-pink-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold text-[8px] uppercase block mb-0.5">Região</label>
                <input
                  type="text"
                  value={editRiderRegion}
                  onChange={e => setEditRiderRegion(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 focus:bg-white transition-colors focus:ring-1 focus:ring-pink-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold text-[8px] uppercase block mb-0.5">Status</label>
                <select
                  value={editRiderStatus}
                  onChange={e => setEditRiderStatus(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 focus:bg-white transition-colors focus:ring-1 focus:ring-pink-500 outline-none"
                >
                  <option value="Disponível">Disponível</option>
                  <option value="Fazendo Entrega">Fazendo Entrega</option>
                  <option value="Completado">Completado</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 font-bold text-[8px] uppercase block mb-0.5">Entregas Pendentes</label>
                <input
                  type="number"
                  value={editRiderAssigned}
                  onChange={e => setEditRiderAssigned(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 focus:bg-white transition-colors focus:ring-1 focus:ring-pink-500 outline-none"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setEditingRider(null)} className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold border-none cursor-pointer font-sans">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-bold border-none cursor-pointer font-sans">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedOrderForLabel && (
        <CorreiosLabel
          order={selectedOrderForLabel}
          onClose={() => setSelectedOrderForLabel(null)}
          onUpdateTrackingCode={(orderId, code) => {
            setOnlineOrders(prev => prev.map(o => o.id === orderId ? { ...o, trackingCode: code } : o));
          }}
        />
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <span className="font-bold text-xs tracking-wider uppercase font-sans flex items-center gap-2">
                <Edit size={14} className="text-pink-400" />
                <span>Editar Pedido Online #{editingOrder.id}</span>
              </span>
              <button 
                type="button"
                onClick={() => setEditingOrder(null)}
                className="text-slate-400 hover:text-white transition-colors text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                setOnlineOrders(prev => prev.map(o => o.id === editingOrder.id ? editingOrder : o));
                
                try {
                  const url = localStorage.getItem('ap_supabase_url');
                  const key = localStorage.getItem('ap_supabase_key');
                  if (url && key) {
                    fetch(`${url}/rest/v1/ap_online_orders?id=eq.${editingOrder.id}`, {
                      method: 'PATCH',
                      headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${key}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(editingOrder)
                    }).catch(() => {});
                  }
                } catch(err) {}

                showCustomAlert('Sucesso', `Pedido #${editingOrder.id} atualizado com sucesso!`);
                setEditingOrder(null);
              }}
              className="p-5 space-y-4 overflow-y-auto font-sans text-xs flex-1"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Nome do Cliente</label>
                  <input 
                    type="text"
                    required
                    value={editingOrder.clientName || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, clientName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Telefone / WhatsApp</label>
                  <input 
                    type="text"
                    required
                    value={editingOrder.phone || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Endereço de Entrega</label>
                <input 
                  type="text"
                  value={editingOrder.address || ''}
                  onChange={(e) => setEditingOrder({ ...editingOrder, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Status do Pedido</label>
                  <select 
                    value={editingOrder.status || 'Pendente'}
                    onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:outline-none focus:border-pink-500"
                  >
                    <option value="Pendente">Pendente / Aguardando Separação</option>
                    <option value="Separando">Em Separação</option>
                    <option value="Pronto">Pronto para Enviar</option>
                    <option value="Saiu para Entrega">Saiu para Entrega</option>
                    <option value="Entregue">Entregue</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Status do Pagamento</label>
                  <select 
                    value={editingOrder.status_pagamento || 'pendente'}
                    onChange={(e) => setEditingOrder({ ...editingOrder, status_pagamento: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:outline-none focus:border-pink-500"
                  >
                    <option value="pendente">Pendente / Aguardando Pago</option>
                    <option value="pago">Pago / Confirmado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Taxa de Entrega (R$)</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={editingOrder.deliveryFee !== undefined ? editingOrder.deliveryFee : 0}
                    onChange={(e) => {
                      const fee = parseFloat(e.target.value) || 0;
                      setEditingOrder({ ...editingOrder, deliveryFee: fee });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Valor Total (R$)</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={editingOrder.total !== undefined ? editingOrder.total : 0}
                    onChange={(e) => {
                      const tot = parseFloat(e.target.value) || 0;
                      setEditingOrder({ ...editingOrder, total: tot });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono font-bold focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Observações / CPF</label>
                <textarea 
                  rows={2}
                  value={editingOrder.notes || ''}
                  onChange={(e) => setEditingOrder({ ...editingOrder, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Items List inside Modal */}
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Itens do Pedido ({editingOrder.items?.length || 0})</span>
                  <button 
                    type="button"
                    onClick={() => {
                      const currentItems = editingOrder.items || [];
                      setEditingOrder({
                        ...editingOrder,
                        items: [...currentItems, { productName: 'Novo Produto', quantity: 1, price: 0 }]
                      });
                    }}
                    className="text-[10px] font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Adicionar Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(editingOrder.items || []).map((it: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                      <input 
                        type="text"
                        placeholder="Nome do Produto"
                        value={it.productName || it.name || ''}
                        onChange={(e) => {
                          const updatedItems = [...editingOrder.items];
                          updatedItems[idx] = { ...updatedItems[idx], productName: e.target.value };
                          setEditingOrder({ ...editingOrder, items: updatedItems });
                        }}
                        className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 text-[11px]"
                      />
                      <input 
                        type="number"
                        min="1"
                        placeholder="Qtd"
                        value={it.quantity || 1}
                        onChange={(e) => {
                          const updatedItems = [...editingOrder.items];
                          updatedItems[idx] = { ...updatedItems[idx], quantity: Number(e.target.value) || 1 };
                          setEditingOrder({ ...editingOrder, items: updatedItems });
                        }}
                        className="w-14 px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 text-[11px] font-mono text-center"
                      />
                      <input 
                        type="number"
                        step="0.01"
                        placeholder="Preço R$"
                        value={it.price || 0}
                        onChange={(e) => {
                          const updatedItems = [...editingOrder.items];
                          updatedItems[idx] = { ...updatedItems[idx], price: Number(e.target.value) || 0 };
                          setEditingOrder({ ...editingOrder, items: updatedItems });
                        }}
                        className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 text-[11px] font-mono"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const updatedItems = editingOrder.items.filter((_: any, i: number) => i !== idx);
                          setEditingOrder({ ...editingOrder, items: updatedItems });
                        }}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        title="Remover Item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => handleDeleteOnlineOrder(editingOrder.id)}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Excluir</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl font-bold transition cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold transition shadow-sm cursor-pointer text-center"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Premium Alert/Confirm Modal Dialog Overlay */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-3xl max-w-md w-full p-6 shadow-xl animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-pink-50 text-pink-600 shrink-0">
                <AlertCircle size={22} className="text-pink-600 animate-bounce" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider font-sans">{modalConfig.title}</h4>
                <p className="text-xs text-slate-500 mt-2 whitespace-pre-line leading-relaxed font-sans">{modalConfig.message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2.5 font-sans">
              {modalConfig.type === 'confirm' && (
                <button
                  type="button"
                  onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200 cursor-pointer bg-white"
                >
                  Cancelar
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setModalConfig(prev => ({ ...prev, isOpen: false }));
                  if (modalConfig.type === 'confirm' && modalConfig.onConfirm) {
                    modalConfig.onConfirm();
                  }
                }}
                className="px-5 py-2 text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white rounded-xl transition-all shadow-xs cursor-pointer active:scale-97"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
