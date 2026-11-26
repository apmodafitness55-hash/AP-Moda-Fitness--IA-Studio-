/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  MapPin,
  Phone,
  CheckCircle2,
  Truck,
  Navigation,
  Lock,
  ChevronRight,
  ChevronLeft,
  Check,
  User,
  WifiOff,
  Compass,
  MessageSquare,
  LogOut,
  Copy,
  Eraser,
  Package,
} from 'lucide-react';
import { getWhatsAppUrl } from '../utils/storeConfig';
import { showToast } from '../lib/uiDialog';

const openExternalSafely = (url: string) => {
  try {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch {
    showToast(`Abra o link manualmente: ${url}`, 'info', 6000);
  }
};

interface DriverDeliveryExtraFields {
  receiverName?: string;
  receiverDoc?: string;
  deliverySignature?: string;
  deliveredAt?: string;
}

interface DriverAppPortalProps {
  onlineOrders: any[];
  onUpdateOrderStatus: (
    orderId: string,
    status: any,
    statusPagamento?: string,
    trackingCode?: string,
    statusLogistico?: string,
    motoboy?: string,
    extraFields?: DriverDeliveryExtraFields
  ) => void;
  onExitPortal: () => void;
  currentUser?: any;
  onLogout?: () => void;
  motoboys?: string[];
}

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

const isOrderPaid = (order: any) => {
  const payStatus = (order?.status_pagamento || '').toLowerCase();
  const status = (order?.status || '').toLowerCase();
  return payStatus === 'pago' || status === 'pago' || status === 'entregue';
};

export default function DriverAppPortal({
  onlineOrders,
  onUpdateOrderStatus,
  onExitPortal,
  currentUser,
  onLogout,
  motoboys,
}: DriverAppPortalProps) {
  const riders = useMemo(() => {
    if (Array.isArray(motoboys) && motoboys.length > 0) {
      return motoboys;
    }
    return [
      'Bruno Ramos (Moto 1)',
      'Lucas Correia (Moto 2)',
      'Thales Silva (Bike/Região Central)',
      'Cláudio Santos (Parceiro Envio Rápido)',
    ];
  }, [motoboys]);

  const [selectedRider, setSelectedRider] = useState<string>(() => riders[0] || '');
  const [activeStep, setActiveStep] = useState<'login' | 'feed' | 'delivery_detail' | 'signature'>(() =>
    currentUser && currentUser.role === 'Entregador' ? 'feed' : 'login'
  );

  useEffect(() => {
    if (currentUser && currentUser.role === 'Entregador') {
      const cName = (currentUser.name || '').toLowerCase();
      const matched = riders.find(
        (r) => r.toLowerCase().includes(cName) || cName.includes(r.toLowerCase().split('(')[0].trim())
      );
      setSelectedRider(matched || currentUser.name);
      setActiveStep('feed');
    }
  }, [currentUser, riders]);

  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Signature Pad
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [receiverDoc, setReceiverDoc] = useState('');

  // Exit Admin PIN Modal
  const [showExitModal, setShowExitModal] = useState(false);
  const [exitPin, setExitPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Live GPS State
  const [routeStep, setRouteStep] = useState(0);
  const [driverCoords, setDriverCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'searching' | 'active' | 'denied' | 'unsupported'>('idle');

  // Feed Filters
  const [feedTab, setFeedTab] = useState<'pending' | 'completed'>('pending');
  const [feedFilter, setFeedFilter] = useState<'mine' | 'all'>('mine');
  const [showWhatsappModal, setShowWhatsappModal] = useState<{
    orderId: string;
    clientName: string;
    phone: string;
    message: string;
    link: string;
  } | null>(null);

  const riderBaseName = useMemo(() => selectedRider.split('(')[0].trim().toLowerCase(), [selectedRider]);

  const isOrderAssignedToRider = useCallback(
    (o: any) => {
      if (!o.motoboy || !riderBaseName) return false;
      const assigned = String(o.motoboy).split('(')[0].trim().toLowerCase();
      return assigned === riderBaseName || String(o.motoboy).toLowerCase() === selectedRider.toLowerCase();
    },
    [riderBaseName, selectedRider]
  );

  const riderOrders = useMemo(
    () => onlineOrders.filter((o) => isOrderAssignedToRider(o)),
    [onlineOrders, isOrderAssignedToRider]
  );

  const pendingStatuses = ['pago', 'saiu para entrega', 'pronto', 'separando', 'pendente'];

  const myPendingCount = useMemo(
    () =>
      onlineOrders.filter(
        (o) => isOrderAssignedToRider(o) && pendingStatuses.includes((o.status || '').toLowerCase())
      ).length,
    [onlineOrders, isOrderAssignedToRider]
  );

  const unassignedPendingCount = useMemo(
    () =>
      onlineOrders.filter(
        (o) => (!o.motoboy || o.motoboy.trim() === '') && pendingStatuses.includes((o.status || '').toLowerCase())
      ).length,
    [onlineOrders]
  );

  const filteredFeedOrders = useMemo(() => {
    return onlineOrders.filter((o) => {
      const isAssignedToMe = isOrderAssignedToRider(o);
      const isUnassigned = !o.motoboy || o.motoboy.trim() === '';
      const matchesRiderType = feedFilter === 'mine' ? isAssignedToMe : isUnassigned;
      const statusLower = (o.status || '').toLowerCase();

      if (feedTab === 'pending') {
        return matchesRiderType && pendingStatuses.includes(statusLower);
      }
      return matchesRiderType && statusLower === 'entregue';
    });
  }, [onlineOrders, isOrderAssignedToRider, feedFilter, feedTab]);

  const stats = useMemo(() => {
    const totalDeliveries = riderOrders.length;
    const completed = riderOrders.filter((o) => (o.status || '').toLowerCase() === 'entregue').length;
    const inRoute = riderOrders.filter((o) => (o.status || '').toLowerCase() === 'saiu para entrega').length;
    const pending = totalDeliveries - completed;
    return { totalDeliveries, completed, inRoute, pending };
  }, [riderOrders]);

  // Size signature canvas cleanly to match display dimensions (zero blurry or misaligned touch coordinates)
  useEffect(() => {
    if (activeStep !== 'signature') return;
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = canvasContainerRef.current;
      if (!canvas || !container) return;
      const width = container.clientWidth || 320;
      const height = 180;
      canvas.width = width;
      canvas.height = height;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [activeStep]);

  const getPointerPos = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const pos = getPointerPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasSigned(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPointerPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  // Real device GPS watch when viewing active delivery route
  useEffect(() => {
    if (activeStep !== 'delivery_detail' && routeStep !== 1) return;
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGpsStatus('unsupported');
      return;
    }

    setGpsStatus((prev) => (prev === 'active' ? 'active' : 'searching'));
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setDriverCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 0),
        });
        setGpsStatus('active');
      },
      () => {
        setGpsStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [activeStep, routeStep]);

  const cleanAddressForNav = (address: string) =>
    (address || '').replace(/^Retirada no Local|^A combinar/i, '').trim();

  const handleOpenGoogleMaps = (address: string) => {
    const cleanAddr = cleanAddressForNav(address);
    if (!cleanAddr) {
      showToast('Endereço não informado para traçar rota.', 'warning');
      return;
    }
    const encoded = encodeURIComponent(cleanAddr);
    const originParam = driverCoords ? `&origin=${driverCoords.lat},${driverCoords.lng}` : '';
    openExternalSafely(
      `https://www.google.com/maps/dir/?api=1${originParam}&destination=${encoded}&travelmode=driving`
    );
  };

  const handleOpenWaze = (address: string) => {
    const cleanAddr = cleanAddressForNav(address);
    if (!cleanAddr) {
      showToast('Endereço não informado para abrir no Waze.', 'warning');
      return;
    }
    openExternalSafely(`https://waze.com/ul?q=${encodeURIComponent(cleanAddr)}&navigate=yes`);
  };

  const handleCopyAddress = async (address: string) => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      showToast('Endereço copiado!', 'success', 2000);
    } catch {
      showToast('Selecione e copie o endereço manualmente.', 'info');
    }
  };

  const handleOpenWhatsAppClient = (phone: string, clientName: string, address: string) => {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (!cleanPhone) {
      showToast('Telefone do cliente não informado.', 'warning');
      return;
    }
    const msg = encodeURIComponent(
      `Olá ${clientName || 'Cliente'}! Sou o entregador da AP2 Moda Fitness e estou a caminho do seu endereço com o seu pedido.\n\nEndereço: ${address || 'Local informado'}`
    );
    openExternalSafely(`https://wa.me/55${cleanPhone}?text=${msg}`);
  };

  const handleCallClient = (phone: string) => {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (!cleanPhone) {
      showToast('Telefone não cadastrado.', 'warning');
      return;
    }
    window.location.href = `tel:${cleanPhone}`;
  };

  const handleStartRoute = (order: any, assignedMotoboy?: string) => {
    const nextOrder = assignedMotoboy ? { ...order, motoboy: assignedMotoboy } : order;
    setActiveOrder(nextOrder);
    setRouteStep(1);
    onUpdateOrderStatus(order.id, 'Saiu para Entrega', undefined, undefined, 'saiu_para_entrega', assignedMotoboy);

    const rawPhone = order.phone || '';
    const msg = `Olá, *${order.clientName}*! Seu pedido da *AP2 Moda Fitness* (#${String(order.id).toUpperCase()}) está a caminho com o nosso entregador *${selectedRider.split('(')[0].trim()}*.\n\nEndereço de entrega: _${order.address}_\n\nPor favor, confirme se há alguém no local para receber.`;
    const link = getWhatsAppUrl(rawPhone, msg);

    setShowWhatsappModal({
      orderId: order.id,
      clientName: order.clientName,
      phone: rawPhone,
      message: msg,
      link,
    });
    setActiveStep('delivery_detail');
  };

  const handleFinalizeDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverName.trim()) {
      showToast('Informe o nome de quem recebeu o pedido.', 'warning');
      return;
    }

    const signatureDataUrl =
      hasSigned && canvasRef.current ? canvasRef.current.toDataURL('image/png') : undefined;

    onUpdateOrderStatus(
      activeOrder.id,
      'Entregue',
      'pago',
      undefined,
      'entregue',
      selectedRider,
      {
        receiverName: receiverName.trim(),
        receiverDoc: receiverDoc.trim() || undefined,
        deliverySignature: signatureDataUrl,
        deliveredAt: new Date().toISOString(),
      }
    );

    showToast(`Entrega concluída para ${receiverName.trim()}!`, 'success');
    setActiveStep('feed');
    setActiveOrder(null);
    setRouteStep(0);
    setReceiverName('');
    setReceiverDoc('');
    setHasSigned(false);
  };

  const handleConfirmExit = () => {
    if (exitPin === '123456' || exitPin === '1234') {
      setShowExitModal(false);
      onExitPortal();
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 2000);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Compact Native Top App Bar (<= 56px) */}
      <header className="sticky top-0 z-30 h-14 px-4 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {activeStep === 'delivery_detail' || activeStep === 'signature' ? (
            <button
              type="button"
              onClick={() => {
                if (activeStep === 'signature') {
                  setActiveStep('delivery_detail');
                } else {
                  setActiveStep('feed');
                  setActiveOrder(null);
                  setRouteStep(0);
                }
              }}
              className="min-h-[44px] min-w-[44px] -ml-2 px-2 flex items-center justify-center rounded-xl text-slate-200 hover:bg-slate-800 active:scale-95 transition-transform cursor-pointer"
              aria-label="Voltar"
            >
              <ChevronLeft size={22} />
            </button>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-pink-600 flex items-center justify-center text-white shrink-0">
              <Truck size={18} />
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-base font-bold text-white truncate leading-tight">
              {activeStep === 'login'
                ? 'Entregador AP2'
                : activeStep === 'delivery_detail'
                  ? `Rota #${String(activeOrder?.id || '').toUpperCase()}`
                  : activeStep === 'signature'
                    ? 'Confirmar Entrega'
                    : 'Minhas Entregas'}
            </h1>
            {activeStep !== 'login' && (
              <p className="text-xs text-slate-400 truncate leading-tight">
                {selectedRider.split('(')[0].trim()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeStep === 'feed' && currentUser?.role !== 'Entregador' && (
            <button
              type="button"
              onClick={() => setActiveStep('login')}
              className="min-h-[44px] px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 cursor-pointer whitespace-nowrap"
            >
              Trocar Motoboy
            </button>
          )}

          {currentUser?.role === 'Entregador' ? (
            <button
              type="button"
              onClick={onLogout}
              className="min-h-[44px] px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <LogOut size={15} />
              <span>Sair</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setExitPin('');
                setShowExitModal(true);
              }}
              className="min-h-[44px] px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Lock size={14} />
              <span>Painel</span>
            </button>
          )}
        </div>
      </header>

      {/* Offline warning bar (only when browser is actually offline) */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs py-2 px-4 font-semibold flex items-center justify-center gap-2">
          <WifiOff size={15} />
          <span>Sem conexão com a internet — alterações salvas localmente</span>
        </div>
      )}

      {/* Main Responsive Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 flex flex-col">
        {/* STEP 1: RIDER PROFILE SELECTION */}
        {activeStep === 'login' && (
          <div className="flex-1 flex flex-col justify-between max-w-xl w-full mx-auto py-4 gap-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">Quem está em rota hoje?</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Selecione seu nome abaixo para visualizar os pedidos destinados a você, abrir a rota no GPS e coletar assinaturas de entrega.
                </p>
              </div>

              <div className="space-y-2.5">
                {riders.map((r) => {
                  const selected = selectedRider === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRider(r)}
                      className={`w-full min-h-[56px] px-4 py-3.5 rounded-2xl text-left flex items-center justify-between border transition-colors cursor-pointer ${
                        selected
                          ? 'bg-pink-600/15 border-pink-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            selected ? 'bg-pink-600 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <User size={18} />
                        </div>
                        <span className="text-base font-semibold truncate">{r}</span>
                      </div>
                      {selected && <Check size={20} className="text-pink-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveStep('feed')}
              className="w-full h-13 rounded-2xl bg-pink-600 hover:bg-pink-700 active:scale-[0.99] text-white font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-pink-600/20"
            >
              <span>Acessar Minhas Entregas</span>
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* STEP 2: DELIVERY FEED */}
        {activeStep === 'feed' && (
          <div className="space-y-5 pb-6">
            {/* Quick Summary Numbers */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
                <span className="text-xs text-slate-400 block">Pendentes</span>
                <span className="text-2xl font-bold text-amber-400 tabular-nums mt-0.5 block">
                  {stats.pending}
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
                <span className="text-xs text-slate-400 block">Em Rota</span>
                <span className="text-2xl font-bold text-pink-400 tabular-nums mt-0.5 block">
                  {stats.inRoute}
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
                <span className="text-xs text-slate-400 block">Entregues</span>
                <span className="text-2xl font-bold text-emerald-400 tabular-nums mt-0.5 block">
                  {stats.completed}
                </span>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="grid grid-cols-2 bg-slate-900 p-1 rounded-2xl border border-slate-800 sm:w-80">
                <button
                  type="button"
                  onClick={() => setFeedTab('pending')}
                  className={`min-h-[44px] px-3 rounded-xl text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    feedTab === 'pending'
                      ? 'bg-pink-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  A Entregar ({feedFilter === 'mine' ? myPendingCount : unassignedPendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFeedTab('completed')}
                  className={`min-h-[44px] px-3 rounded-xl text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    feedTab === 'completed'
                      ? 'bg-pink-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Concluídas ({stats.completed})
                </button>
              </div>

              <div className="grid grid-cols-2 bg-slate-900 p-1 rounded-2xl border border-slate-800 sm:w-80">
                <button
                  type="button"
                  onClick={() => setFeedFilter('mine')}
                  className={`min-h-[44px] px-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    feedFilter === 'mine'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Meus Pedidos
                </button>
                <button
                  type="button"
                  onClick={() => setFeedFilter('all')}
                  className={`min-h-[44px] px-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    feedFilter === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Disponíveis ({unassignedPendingCount})
                </button>
              </div>
            </div>

            {/* Deliveries Grid / List */}
            {filteredFeedOrders.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Package size={28} />
                </div>
                <h3 className="text-lg font-bold text-white">Nenhuma entrega nesta fila</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                  {feedFilter === 'mine'
                    ? 'Quando houver pedidos atribuídos a você, eles aparecerão aqui. Você também pode conferir a aba Disponíveis.'
                    : 'Todos os pedidos pendentes já estão atribuídos a entregadores.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFeedOrders.map((ord: any) => {
                  const statusLower = (ord.status || '').toLowerCase();
                  const paid = isOrderPaid(ord);
                  const totalFormatted = formatBRL(ord.total);

                  return (
                    <article
                      key={ord.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-3.5">
                        {/* Unboxed metadata row */}
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                          <div className="flex items-center gap-2 font-mono tabular-nums">
                            <span className="text-pink-400 font-bold uppercase">#{ord.id}</span>
                            <span aria-hidden="true">·</span>
                            <span>{ord.status}</span>
                          </div>
                          <span
                            className={`font-bold ${
                              paid ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {paid ? `Pago · ${totalFormatted}` : `Cobrar ${totalFormatted}`}
                          </span>
                        </div>

                        {/* Customer Name & Phone */}
                        <div>
                          <h3 className="text-lg font-bold text-white leading-snug">
                            {ord.clientName}
                          </h3>
                          {ord.phone && (
                            <p className="text-sm text-slate-400 mt-0.5 tabular-nums">
                              {ord.phone}
                            </p>
                          )}
                        </div>

                        {/* Clean Address Surface */}
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <MapPin size={18} className="text-pink-400 shrink-0 mt-0.5" />
                            <p className="text-sm sm:text-base font-medium text-slate-100 leading-snug break-words select-all">
                              {ord.address || 'Endereço não informado'}
                            </p>
                          </div>
                          {ord.address && (
                            <button
                              type="button"
                              onClick={() => handleCopyAddress(ord.address)}
                              className="min-h-[40px] min-w-[40px] rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center justify-center shrink-0 cursor-pointer"
                              title="Copiar endereço"
                              aria-label="Copiar endereço"
                            >
                              <Copy size={16} />
                            </button>
                          )}
                        </div>

                        {/* Items list */}
                        {ord.items && ord.items.length > 0 && (
                          <p className="text-sm text-slate-400 leading-relaxed">
                            <span className="text-slate-300 font-semibold">Peças: </span>
                            {ord.items
                              .map((it: any) => `${it.quantity}x ${it.productName || 'Peça'}`)
                              .join(', ')}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                        {/* Navigation & Contact Shortcuts */}
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenGoogleMaps(ord.address)}
                            className="min-h-[46px] px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Navigation size={16} className="text-pink-400 shrink-0" />
                            <span>Maps</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenWaze(ord.address)}
                            className="min-h-[46px] px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Compass size={16} className="text-cyan-400 shrink-0" />
                            <span>Waze</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleOpenWhatsAppClient(ord.phone, ord.clientName, ord.address)
                            }
                            className="min-h-[46px] px-2 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/40 text-emerald-300 text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <MessageSquare size={16} className="text-emerald-400 shrink-0" />
                            <span>Whats</span>
                          </button>
                        </div>

                        {/* Main Workflow CTA */}
                        {['pago', 'pronto', 'separando', 'pendente'].includes(statusLower) ? (
                          <button
                            type="button"
                            onClick={() => {
                              const assigned =
                                !ord.motoboy || ord.motoboy.trim() === '' ? selectedRider : undefined;
                              handleStartRoute(ord, assigned);
                            }}
                            className="w-full h-12 rounded-xl bg-pink-600 hover:bg-pink-700 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <span>Iniciar Entrega</span>
                            <ChevronRight size={18} />
                          </button>
                        ) : statusLower === 'saiu para entrega' ? (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveOrder(ord);
                                setActiveStep('delivery_detail');
                              }}
                              className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Navigation size={16} />
                              <span>Abrir Rota</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveOrder(ord);
                                setActiveStep('signature');
                              }}
                              className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle2 size={16} />
                              <span>Finalizar</span>
                            </button>
                          </div>
                        ) : (
                          <div className="h-11 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 text-sm font-semibold flex items-center justify-center gap-2">
                            <CheckCircle2 size={16} />
                            <span>
                              Entregue{ord.receiverName ? ` · ${ord.receiverName}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: ACTIVE ROUTE & NATIVE GPS LAUNCHER */}
        {activeStep === 'delivery_detail' && activeOrder && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 pb-6">
            {/* Map Frame */}
            <div className="lg:col-span-7 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden min-h-[300px] h-[42dvh] lg:h-[calc(100dvh-7.5rem)] relative">
              <iframe
                title="Mapa da Entrega"
                src={
                  driverCoords
                    ? `https://maps.google.com/maps?saddr=${driverCoords.lat},${driverCoords.lng}&daddr=${encodeURIComponent(
                        activeOrder.address || ''
                      )}&output=embed`
                    : `https://maps.google.com/maps?q=${encodeURIComponent(
                        activeOrder.address || ''
                      )}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                }
                className="w-full h-full border-0"
                loading="lazy"
              />

              {/* Quiet GPS readout bar */}
              <div className="absolute top-3 left-3 right-3 pointer-events-none flex justify-between items-center">
                <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <Navigation size={14} className="text-pink-400 shrink-0" />
                  <span>
                    {gpsStatus === 'active' && driverCoords
                      ? `GPS ativo (±${driverCoords.accuracy || 10}m)`
                      : gpsStatus === 'denied'
                        ? 'Use os botões abaixo para abrir no Google Maps ou Waze'
                        : 'Buscando sinal GPS...'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Panel */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-mono text-pink-400 font-bold uppercase">
                    #{activeOrder.id}
                  </span>
                  <span
                    className={`font-bold ${
                      isOrderPaid(activeOrder) ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {isOrderPaid(activeOrder)
                      ? `Já Pago Online · ${formatBRL(activeOrder.total)}`
                      : `Cobrar na Entrega · ${formatBRL(activeOrder.total)}`}
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white leading-snug">
                    {activeOrder.clientName}
                  </h2>
                  {activeOrder.phone && (
                    <p className="text-sm text-slate-400 mt-1 tabular-nums">{activeOrder.phone}</p>
                  )}
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <MapPin size={14} className="text-pink-400" />
                      Destino da entrega
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyAddress(activeOrder.address)}
                      className="text-xs font-semibold text-pink-400 hover:text-pink-300 flex items-center gap-1 cursor-pointer min-h-[32px] px-2"
                    >
                      <Copy size={13} />
                      <span>Copiar</span>
                    </button>
                  </div>
                  <p className="text-base font-semibold text-white leading-snug select-all">
                    {activeOrder.address}
                  </p>
                  {activeOrder.notes && (
                    <p className="text-sm text-amber-300 pt-2 border-t border-slate-800 leading-snug">
                      Observação: {activeOrder.notes}
                    </p>
                  )}
                </div>

                {/* Big 1-Tap Turn-by-Turn GPS Launchers */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-400">
                    Abrir navegação por voz:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenGoogleMaps(activeOrder.address)}
                      className="h-13 rounded-xl bg-pink-600 hover:bg-pink-700 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Navigation size={18} />
                      <span>Google Maps</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenWaze(activeOrder.address)}
                      className="h-13 rounded-xl bg-cyan-700 hover:bg-cyan-600 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Compass size={18} />
                      <span>Waze</span>
                    </button>
                  </div>
                </div>

                {/* Client Contact */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleCallClient(activeOrder.phone)}
                    className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Phone size={17} />
                    <span>Ligar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenWhatsAppClient(
                        activeOrder.phone,
                        activeOrder.clientName,
                        activeOrder.address
                      )
                    }
                    className="h-12 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/40 text-emerald-300 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageSquare size={17} />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Complete Delivery Action */}
              <button
                type="button"
                onClick={() => {
                  onUpdateOrderStatus(activeOrder.id, 'Saiu para Entrega');
                  setActiveStep('signature');
                }}
                className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                <CheckCircle2 size={20} />
                <span>Cheguei · Coletar Assinatura</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SIGNATURE & DELIVERY PROOF */}
        {activeStep === 'signature' && activeOrder && (
          <form
            onSubmit={handleFinalizeDeliverySubmit}
            className="flex-1 flex flex-col justify-between max-w-xl w-full mx-auto gap-5 pb-6"
          >
            <div className="space-y-5">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-xs font-mono text-pink-400 font-bold uppercase block">
                    #{activeOrder.id}
                  </span>
                  <h2 className="text-base font-bold text-white truncate">
                    {activeOrder.clientName}
                  </h2>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-slate-400 block">
                    {isOrderPaid(activeOrder) ? 'Pago Online' : 'Cobrar na Entrega'}
                  </span>
                  <span
                    className={`text-base font-bold font-mono tabular-nums ${
                      isOrderPaid(activeOrder) ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {formatBRL(activeOrder.total)}
                  </span>
                </div>
              </div>

              {/* Receiver Name (16px font prevents iOS/Android auto-zoom) */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200 block">
                  Quem recebeu o pacote?
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome completo de quem recebeu"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full h-12 bg-slate-900 border border-slate-700 rounded-xl px-4 text-base text-white placeholder:text-slate-500 focus:outline-hidden focus:border-pink-500"
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  {[activeOrder.clientName || 'Próprio cliente', 'Portaria / Zelador', 'Familiar'].map(
                    (quick) => (
                      <button
                        key={quick}
                        type="button"
                        onClick={() => setReceiverName(quick)}
                        className="min-h-[38px] px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 cursor-pointer"
                      >
                        {quick}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Optional Document */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200 block">
                  CPF ou RG (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Somente se necessário"
                  value={receiverDoc}
                  onChange={(e) => setReceiverDoc(e.target.value)}
                  className="w-full h-12 bg-slate-900 border border-slate-700 rounded-xl px-4 text-base text-white placeholder:text-slate-500 focus:outline-hidden focus:border-pink-500"
                />
              </div>

              {/* Full-Width Responsive Touch Signature Pad */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-200">
                    Assinatura na tela
                  </label>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="min-h-[36px] px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-pink-400 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eraser size={14} />
                    <span>Limpar</span>
                  </button>
                </div>

                <div
                  ref={canvasContainerRef}
                  className="w-full bg-white border-2 border-slate-700 rounded-2xl overflow-hidden relative"
                >
                  <canvas
                    ref={canvasRef}
                    height={180}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[180px] touch-none cursor-crosshair block"
                  />
                  {!hasSigned && (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-400 font-medium">
                      Assine com o dedo aqui
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              <CheckCircle2 size={20} />
              <span>Confirmar Entrega Concluída</span>
            </button>
          </form>
        )}
      </main>

      {/* WHATSAPP TRANSIT CONFIRMATION MODAL */}
      {showWhatsappModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <MessageSquare size={22} />
              </div>
              <div>
                <h4 className="text-white font-bold text-base">Avisar cliente no WhatsApp</h4>
                <p className="text-slate-400 text-xs">
                  Status atualizado para Saiu para Entrega
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl max-h-36 overflow-y-auto">
              <p className="text-sm text-emerald-300 leading-relaxed whitespace-pre-wrap select-all">
                {showWhatsappModal.message}
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <a
                href={showWhatsappModal.link}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowWhatsappModal(null)}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 no-underline"
              >
                <MessageSquare size={18} />
                <span>Enviar Aviso no WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={() => setShowWhatsappModal(null)}
                className="w-full h-11 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm rounded-xl cursor-pointer"
              >
                Agora não · Ir para a Rota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN EXIT PIN MODAL */}
      {showExitModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-pink-600/15 rounded-2xl flex items-center justify-center text-pink-400 shrink-0">
                <Lock size={20} />
              </div>
              <div>
                <h4 className="text-white font-bold text-base">Voltar ao Painel</h4>
                <p className="text-slate-400 text-xs">Digite o PIN gerencial para sair do modo entregador</p>
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="password"
                inputMode="numeric"
                placeholder="Digite o PIN"
                value={exitPin}
                onChange={(e) => setExitPin(e.target.value)}
                className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-center text-white focus:outline-hidden focus:border-pink-500 tracking-widest text-base"
              />
              {pinError && (
                <p className="text-rose-400 text-xs text-center font-semibold">
                  PIN inválido. Tente novamente.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="h-12 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmExit}
                className="h-12 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-sm cursor-pointer"
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
