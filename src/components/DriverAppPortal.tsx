/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Smartphone, 
  MapPin, 
  Phone, 
  CheckCircle, 
  Truck, 
  Navigation, 
  Lock, 
  ChevronRight, 
  Check, 
  Sparkles, 
  DollarSign, 
  User, 
  Wifi, 
  WifiOff, 
  Battery, 
  Compass, 
  ExternalLink,
  MessageSquare,
  RefreshCw,
  LogOut,
  Brush
} from 'lucide-react';
// Locally extend OnlineOrder to cover standard fields
interface DriverAppPortalProps {
  onlineOrders: any[];
  onUpdateOrderStatus: (orderId: string, status: any) => void;
  onExitPortal: () => void;
  currentUser?: any;
  onLogout?: () => void;
}

export default function DriverAppPortal({ onlineOrders, onUpdateOrderStatus, onExitPortal, currentUser, onLogout }: DriverAppPortalProps) {
  // Current logged riders
  const riders = ['Bruno Ramos', 'Lucas Correia', 'Thales Silva'];
  const [selectedRider, setSelectedRider] = useState<string>('Bruno Ramos');
  const [activeStep, setActiveStep] = useState<'login' | 'feed' | 'delivery_detail' | 'signature'>('login');

  // Automatically adapt to logged deliveries driver
  useEffect(() => {
    if (currentUser && currentUser.role === 'Entregador') {
      // Find matching rider
      const matched = riders.find(r => r.toLowerCase().includes(currentUser.name.toLowerCase()) || currentUser.name.toLowerCase().includes(r.toLowerCase()));
      setSelectedRider(matched || currentUser.name);
      setActiveStep('feed');
    }
  }, [currentUser]);
  
  // Active delivery selected inside the smartphone
  const [activeOrder, setActiveOrder] = useState<any | null>(null);

  // Connection State for Offline simulation
  const [isOnline, setIsOnline] = useState(true);

  // Signature Pad State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [receiverDoc, setReceiverDoc] = useState('');
  const [signatureSaved, setSignatureSaved] = useState(false);

  // Administrative PIN state to exit driver mode
  const [showExitModal, setShowExitModal] = useState(false);
  const [exitPin, setExitPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // GPS navigation simulation state inside the detailed card
  const [routeStep, setRouteStep] = useState(0); // 0: Idle, 1: En Route, 2: Arrived
  const [simulatedDistance, setSimulatedDistance] = useState(4.2); // km
  
  // New tabs & filters for routing / logistics
  const [feedTab, setFeedTab] = useState<'pending' | 'completed'>('pending');
  const [feedFilter, setFeedFilter] = useState<'mine' | 'all'>('mine');
  const [showWhatsappModal, setShowWhatsappModal] = useState<any | null>(null);

  // Dynamically filter orders allocated to this specific rider
  const riderOrders = useMemo(() => {
    return onlineOrders.filter(o => {
      if (!o.motoboy) return false;
      return o.motoboy.toLowerCase().includes(selectedRider.toLowerCase());
    });
  }, [onlineOrders, selectedRider]);

  // Dynamically filter orders allocated for the visual feed list
  const filteredFeedOrders = useMemo(() => {
    return onlineOrders.filter(o => {
      const isAssignedToMe = o.motoboy && o.motoboy.toLowerCase().includes(selectedRider.toLowerCase());
      const isUnassigned = !o.motoboy || o.motoboy.trim() === '';
      
      const matchesRiderType = feedFilter === 'mine' ? isAssignedToMe : isUnassigned;
      const statusLower = (o.status || '').toLowerCase();
      
      if (feedTab === 'pending') {
        // Pending physical routes: Pago, Saiu para Entrega, Pronto
        const isPending = statusLower === 'pago' || statusLower === 'saiu para entrega' || statusLower === 'saiu para entrega' || statusLower === 'pronto';
        return matchesRiderType && isPending;
      } else {
        // Completed routes
        return matchesRiderType && statusLower === 'entregue';
      }
    });
  }, [onlineOrders, selectedRider, feedFilter, feedTab]);

  // Delivery total calculations
  const stats = useMemo(() => {
    const totalDeliveries = riderOrders.length;
    const completed = riderOrders.filter(o => {
      const s = (o.status || '').toLowerCase();
      return s === 'entregue';
    }).length;
    const pending = totalDeliveries - completed;
    return { totalDeliveries, completed, pending };
  }, [riderOrders]);

  // Handle signature drawing path start
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  // Draw coordinate updates
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureSaved(false);
  };

  // Launch Google Maps navigation
  const handleOpenGoogleMaps = (address: string) => {
    const encoded = encodeURIComponent(address);
    const url = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    window.open(url, '_blank');
  };

  // Simulate routing GPS animation
  useEffect(() => {
    let timer: any;
    if (routeStep === 1) {
      timer = setInterval(() => {
        setSimulatedDistance(prev => {
          if (prev <= 0.2) {
            setRouteStep(2);
            clearInterval(timer);
            // Notify status change on master system when driver reaches destination
            if (activeOrder) {
              onUpdateOrderStatus(activeOrder.id, 'Saiu para Entrega');
            }
            return 0;
          }
          return Number((prev - 0.4).toFixed(1));
        });
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [routeStep, activeOrder]);

  const handleStartRoute = (order: any) => {
    setActiveOrder(order);
    setRouteStep(1);
    setSimulatedDistance(4.5);
    onUpdateOrderStatus(order.id, 'Saiu para Entrega');

    // Build automated WhatsApp link and show modal
    const rawPhone = order.phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const clientPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const msg = `Olá, *${order.clientName}*! Seu pedido da *AP Moda Fitness* (ID: #${order.id.toUpperCase()}) está a caminho com o nosso entregador *${selectedRider}*. 🏍️💨\n\n📍 Endereço de Entrega: _${order.address}_\n\nPor favor, certifique-se de que há alguém disponível no local para receber. Obrigado!`;
    const link = `https://api.whatsapp.com/send?phone=${clientPhone}&text=${encodeURIComponent(msg)}`;

    setShowWhatsappModal({
      orderId: order.id,
      clientName: order.clientName,
      phone: rawPhone,
      message: msg,
      link: link
    });

    setActiveStep('delivery_detail');
  };

  // Complete Signature and close order
  const handleFinalizeDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverName) {
      alert('Por favor, informe quem recebeu a encomenda.');
      return;
    }

    onUpdateOrderStatus(activeOrder.id, 'Entregue');
    
    // Save locally or dispatch online
    alert(`Sucesso! Encomenda entregue para ${receiverName}. Assinatura salva no histórico.`);
    setActiveStep('feed');
    setActiveOrder(null);
    setRouteStep(0);
    setReceiverName('');
    setReceiverDoc('');
    setSignatureSaved(false);
  };

  // Lock bypass evaluation
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
    <div className="bg-slate-900 border border-slate-900 rounded-3xl p-6 shadow-2xl relative min-h-[85vh] flex flex-col justify-center items-center" id="driver-app-sandbox">
      {/* Decorative stars / ambient light */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-pink-900/40 border border-pink-500/20 px-3 py-1.5 rounded-full z-10">
        <Sparkles size={11} className="text-pink-400 shrink-0" />
        <span className="text-[10px] font-bold text-pink-200 uppercase font-mono">Modo Aplicativo do Entregador Conectado</span>
      </div>

      <div className="absolute top-6 left-6">
        {currentUser?.role === 'Entregador' ? (
          <button 
            onClick={onLogout}
            className="text-xs bg-pink-600 hover:bg-pink-700 font-bold p-1 py-1.5 px-3 rounded-xl text-white hover:text-white transition-all flex items-center gap-1 cursor-pointer border-0 outline-none"
          >
            <LogOut size={13} />
            <span>Sair do Sistema</span>
          </button>
        ) : (
          <button 
            onClick={() => {
              setExitPin('');
              setShowExitModal(true);
            }}
            className="text-xs bg-slate-800 hover:bg-slate-705 font-bold p-1 px-2.5 rounded-xl text-slate-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
          >
            <LogOut size={13} />
            <span>Voltar ao ERP</span>
          </button>
        )}
      </div>

      {/* Primary Simulator Screen Core */}
      <div className="relative w-[345px] h-[660px] bg-slate-950 rounded-[44px] shadow-2xl p-3 border-[6px] border-slate-800 flex flex-col scale-95 md:scale-100 transition-transform mt-5">
        
        {/* Notch details */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-xl z-50 flex items-center justify-between px-4">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-850" />
          <div className="w-12 h-1 bg-slate-800 rounded-full" />
          <div className="w-2 h-2 rounded-full bg-blue-900/40" />
        </div>

        {/* StatusBar details */}
        <div className="flex justify-between items-center px-6 pt-1 text-white text-[11px] font-bold tracking-tight select-none z-43">
          <span>09:41</span>
          <div className="flex items-center gap-1.5 opacity-90">
            <button 
              onClick={() => setIsOnline(!isOnline)} 
              title={isOnline ? 'Simular modo sem sinal' : 'Ativar Wi-fi'}
              className="hover:scale-105 active:scale-95 transition-all text-white"
            >
              {isOnline ? <Wifi size={12} className="text-emerald-400" /> : <WifiOff size={12} className="text-rose-500 animate-pulse" />}
            </button>
            <Compass size={11} className="text-slate-400" />
            <Battery size={13} className="text-slate-200 shrink-0" />
          </div>
        </div>

        {/* Smartphone Screen Viewport Background */}
        <div className="flex-1 bg-slate-900 rounded-[34px] overflow-hidden flex flex-col text-slate-100 font-sans mt-3 relative select-none">
          
          {/* OFFLINE STATUS BANNER */}
          {!isOnline && (
            <div className="bg-amber-600 text-white text-[10px] py-1 text-center font-bold flex items-center justify-center gap-1 animate-pulse z-40 select-none">
              <WifiOff size={11} />
              <span>Modo Offline - Sincronização Local Guardada</span>
            </div>
          )}

          {/* SCREEN: LOGIN / SELECTION */}
          {activeStep === 'login' && (
            <div className="flex-1 p-5 flex flex-col justify-between" id="driver-app-login">
              <div className="space-y-6 pt-12 text-center">
                <div className="w-14 h-14 bg-pink-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-xl mx-auto">
                  <Truck size={28} />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-white">AP MODA ENTREGAS</h3>
                  <p className="text-slate-400 text-[11px] mt-1 pr-4 pl-4 leading-normal">Ambiente do entregador. Acesse suas rotas de entrega e conclua recebimentos de forma segura</p>
                </div>

                <div className="pt-2 text-left space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Selecionar Entregador</label>
                  <div className="space-y-1.5">
                    {riders.map(r => (
                      <button
                        key={r}
                        onClick={() => setSelectedRider(r)}
                        className={`w-full text-left p-3 rounded-xl font-bold text-xs flex items-center justify-between border transition-all cursor-pointer
                          ${selectedRider === r 
                            ? 'bg-pink-600/20 border-pink-500 text-white shadow-lg shadow-pink-500/5' 
                            : 'bg-slate-850/60 border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                      >
                        <div className="flex items-center gap-2">
                          <User size={14} className={selectedRider === r ? 'text-pink-400' : 'text-slate-500'} />
                          <span>{r}</span>
                        </div>
                        {selectedRider === r && <Check size={14} className="text-pink-500 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveStep('feed')}
                className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold text-center text-xs rounded-xl shadow-lg shadow-pink-500/10 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Acessar Entregas</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* SCREEN: DELIVERY FEED LIST */}
          {activeStep === 'feed' && (
            <div className="flex-1 flex flex-col p-4 overflow-y-auto" id="driver-app-feed">
              <div className="flex justify-between items-center mb-3 pt-4 border-b border-slate-800 pb-2">
                <div>
                  <span className="text-[9px] font-bold text-pink-400 uppercase tracking-wide">Bem-vindo, {selectedRider.split(' ')[0]}!</span>
                  <h4 className="text-sm font-black text-white">Minhas Rotas</h4>
                </div>
                
                <button 
                  onClick={() => setActiveStep('login')}
                  className="p-1 px-2.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white text-[9px] font-bold cursor-pointer transition-colors"
                >
                  Alterar Perfil
                </button>
              </div>

              {/* Delivery stats pills */}
              <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                <div className="bg-slate-850/70 p-2 rounded-xl">
                  <span className="text-slate-500 text-[8px] font-bold block uppercase">Receber</span>
                  <span className="text-xs font-black text-slate-100">{stats.totalDeliveries}</span>
                </div>
                <div className="bg-slate-850/70 p-2 rounded-xl">
                  <span className="text-slate-500 text-[8px] font-bold block uppercase">Pendentes</span>
                  <span className="text-xs font-black text-amber-500">{stats.pending}</span>
                </div>
                <div className="bg-slate-850/70 p-2 rounded-xl">
                  <span className="text-slate-500 text-[8px] font-bold block uppercase">Feitas</span>
                  <span className="text-xs font-black text-emerald-500">{stats.completed}</span>
                </div>
              </div>

              {/* ROUTING TABS FOR LOGISTICS STATUS */}
              <div className="flex bg-slate-950 p-1 rounded-xl mb-3 border border-slate-800 shrink-0">
                <button
                  onClick={() => setFeedTab('pending')}
                  className={`flex-1 py-1.5 text-center text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${feedTab === 'pending' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  A Entregar ({onlineOrders.filter(o => o.motoboy?.toLowerCase().includes(selectedRider.toLowerCase()) && ['pago', 'saiu para entrega', 'saiu para entrega', 'pronto'].includes((o.status || '').toLowerCase())).length})
                </button>
                <button
                  onClick={() => setFeedTab('completed')}
                  className={`flex-1 py-1.5 text-center text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${feedTab === 'completed' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Concluídos ({onlineOrders.filter(o => o.motoboy?.toLowerCase().includes(selectedRider.toLowerCase()) && (o.status || '').toLowerCase() === 'entregue').length})
                </button>
              </div>

              {/* ASSIGNED VS UNASSIGNED TOGGLE */}
              <div className="flex justify-between items-center mb-3 text-[10px] bg-slate-900/40 p-1.5 rounded-lg border border-slate-850 shrink-0">
                <span className="font-bold text-slate-400">Filtrar Pedidos:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFeedFilter('mine')}
                    className={`px-2 py-0.5 rounded font-extrabold cursor-pointer transition-colors ${feedFilter === 'mine' ? 'bg-pink-900/20 text-pink-400 border border-pink-500/30' : 'text-slate-500 hover:text-slate-400'}`}
                  >
                    Meus
                  </button>
                  <button
                    onClick={() => setFeedFilter('all')}
                    className={`px-2 py-0.5 rounded font-extrabold cursor-pointer transition-colors ${feedFilter === 'all' ? 'bg-pink-900/20 text-pink-400 border border-pink-500/30' : 'text-slate-500 hover:text-slate-400'}`}
                  >
                    Sem Entregador ({onlineOrders.filter(o => (!o.motoboy || o.motoboy.trim() === '') && ['pago', 'pronto'].includes((o.status || '').toLowerCase())).length})
                  </button>
                </div>
              </div>

              {/* Active list container */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                {filteredFeedOrders.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <Truck size={30} className="text-slate-800 mx-auto" />
                    <p className="text-slate-400 italic text-[11px]">Nenhum pedido localizado nesta lista.</p>
                    <p className="text-[10px] text-slate-600 pr-2 pl-2 leading-relaxed">Pedidos pagos ou prontos aparecem aqui para roteirização física.</p>
                  </div>
                ) : (
                  filteredFeedOrders.map((ord: any) => {
                    const statusLower = (ord.status || '').toLowerCase();
                    return (
                      <div key={ord.id} className="bg-slate-850 border border-slate-800 rounded-2xl p-3 space-y-3 hover:border-slate-700 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold font-mono text-pink-400 bg-pink-900/20 px-2 py-0.5 rounded uppercase">
                            {ord.id}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full
                            ${statusLower === 'entregue' ? 'bg-emerald-900/30 text-emerald-400' : ''}
                            ${statusLower === 'saiu para entrega' ? 'bg-amber-900/30 text-amber-400 animate-pulse' : ''}
                            ${statusLower === 'pago' ? 'bg-indigo-900/30 text-indigo-400' : ''}
                            ${['pendente', 'separando', 'pronto'].includes(statusLower) ? 'bg-slate-800 text-slate-400' : ''}
                          `}>
                            {ord.status}
                          </span>
                        </div>

                        <div className="text-xs font-sans">
                          <p className="font-extrabold text-slate-200">{ord.clientName}</p>
                          
                          {/* Street-optimized high readability address box */}
                          <div className="bg-slate-900 border-l-4 border-pink-500 p-2.5 mt-2 rounded-r-xl space-y-1">
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 select-none">
                              <MapPin size={9} className="text-pink-400 shrink-0" />
                              <span>Endereço de Entrega</span>
                            </p>
                            <p className="font-extrabold text-slate-200 text-xs leading-normal select-all">
                              {ord.address}
                            </p>
                          </div>
                        </div>

                        {/* Order items snippet */}
                        {ord.items && ord.items.length > 0 && (
                          <div className="text-[9px] text-slate-400 font-sans border-t border-slate-800/40 pt-2 select-none">
                            <span className="font-bold text-slate-500">Itens: </span>
                            <span>{ord.items.map((it: any) => `${it.quantity}x ${it.productName || 'Peça'}`).join(', ')}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800 pt-2 font-mono">
                          <span>Total Coleta:</span>
                          <span className="font-extrabold text-pink-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ord.total + (ord.deliveryFee || 0))}</span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenGoogleMaps(ord.address)}
                            className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer border-0"
                          >
                            <Navigation size={10} />
                            <span>Abrir GPS</span>
                          </button>
                          
                          {statusLower === 'pago' || statusLower === 'pronto' || statusLower === 'pendente' ? (
                            <button
                              onClick={() => {
                                // Direct order claim from the street
                                if (!ord.motoboy || ord.motoboy.trim() === '') {
                                  ord.motoboy = selectedRider;
                                }
                                handleStartRoute(ord);
                              }}
                              className="flex-1 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer border-0"
                            >
                              <span>Iniciar Entrega</span>
                              <ChevronRight size={10} />
                            </button>
                          ) : statusLower === 'saiu para entrega' ? (
                            <button
                              onClick={() => {
                                setActiveOrder(ord);
                                setActiveStep('signature');
                              }}
                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer border-0"
                            >
                              <CheckCircle size={10} />
                              <span>Marcar como Entregue</span>
                            </button>
                          ) : (
                            <button
                              disabled
                              className="flex-1 py-1.5 bg-slate-800/50 text-slate-600 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-not-allowed border-0"
                            >
                              <CheckCircle size={10} className="text-emerald-500" />
                              <span>Entregue</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* SCREEN: ACTIVE DELIVERY GPS MAP SIMULATION */}
          {activeStep === 'delivery_detail' && activeOrder && (
            <div className="flex-1 flex flex-col justify-between" id="driver-app-detail">
              
              {/* Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => {
                    setActiveStep('feed');
                    setActiveOrder(null);
                    setRouteStep(0);
                  }}
                  className="text-slate-400 hover:text-white text-xs font-bold flex items-center cursor-pointer"
                >
                  ❮ Voltar
                </button>
                <span className="text-xs font-bold text-slate-200 font-mono uppercase">{activeOrder.id}</span>
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
              </div>

              {/* MAP SIMULATOR VISUAL CONTAINER */}
              <div className="flex-1 bg-slate-950 flex flex-col relative overflow-hidden select-none">
                
                {/* SVG vector custom visual path representation */}
                <div className="absolute inset-0 z-0 opacity-40">
                  <svg className="w-full h-full" viewBox="0 0 300 300" fill="none">
                    {/* Road networks */}
                    <path d="M 0 50 L 300 50 M 0 150 L 300 150 M 0 250 L 300 250" stroke="#334155" strokeWidth="6" />
                    <path d="M 50 0 L 50 300 M 150 0 L 150 300 M 250 0 L 250 300" stroke="#334155" strokeWidth="6" />
                    
                    {/* Simulated Delivery Path */}
                    <path d="M 50 150 L 150 150 L 150 50 L 250 50" stroke="#ec4899" strokeWidth="3" strokeDasharray="6 4" strokeLinecap="round" />
                    
                    {/* Base Store Marker */}
                    <circle cx="50" cy="150" r="10" fill="#db2777" />
                    <text x="35" y="132" fill="#fff" fontSize="9" fontWeight="bold">AP LOJA</text>

                    {/* Customer Destination Marker */}
                    <circle cx="250" cy="50" r="10" fill="#10b981" />
                    <text x="215" y="32" fill="#10b981" fontSize="9" fontWeight="bold">CLIENTE</text>
                  </svg>
                </div>

                {/* Simulated route status overlay */}
                <div className="p-3 bg-slate-900/90 border-b border-slate-800 z-10 m-3 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Navigation size={14} className="text-pink-400 animate-bounce" />
                    <div>
                      <p className="font-extrabold text-[11px]">Navegação Ativa (Simulada)</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Destino: {activeOrder.clientName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {routeStep === 1 ? (
                      <>
                        <p className="font-mono font-bold text-pink-400 animate-pulse">{simulatedDistance} km</p>
                        <p className="text-[9px] text-slate-400">Em curso...</p>
                      </>
                    ) : (
                      <>
                        <p className="font-mono font-bold text-emerald-400 flex items-center gap-1 justify-end">
                          <Check size={11} /> Chegou!
                        </p>
                        <p className="text-[9px] text-slate-400">Bater no local</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Simulation controls panel */}
                <div className="absolute bottom-3 inset-x-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 z-10 space-y-2 flex flex-col">
                  <div className="text-xs">
                    <p className="text-slate-400 uppercase text-[8px] font-bold">Endereço de Entrega</p>
                    <p className="font-bold text-slate-200 mt-0.5 leading-tight">{activeOrder.address}</p>
                    {activeOrder.notes && (
                      <p className="p-1 px-2 border border-blue-900/50 bg-blue-950/40 text-[9px] text-blue-400 rounded mt-1.5 leading-snug">
                        📝 {activeOrder.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5">
                    <span>A Cobrar:</span>
                    <strong className="text-pink-400 text-xs font-mono">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activeOrder.total + activeOrder.deliveryFee)}</strong>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleOpenGoogleMaps(activeOrder.address)}
                      className="py-2 bg-pink-700 hover:bg-pink-800 text-white font-bold text-[10px] rounded-lg cursor-pointer flex items-center justify-center gap-1"
                    >
                      <ExternalLink size={11} />
                      <span>Abrir GPS Real</span>
                    </button>

                    {routeStep === 2 ? (
                      <button
                        onClick={() => setActiveStep('signature')}
                        className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg cursor-pointer flex items-center justify-center gap-1 animate-pulse"
                      >
                        <Compass size={11} />
                        <span>Ir p/ Assinatura</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onUpdateOrderStatus(activeOrder.id, 'Saiu para Entrega');
                          setRouteStep(2); // fast-forward arrived
                        }}
                        className="py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                      >
                        Simular Chegada
                      </button>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* SCREEN: SIGNATURE & COMPLETED RECEIVED */}
          {activeStep === 'signature' && activeOrder && (
            <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto" id="driver-app-signature">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                    <CheckCircle size={15} className="text-pink-500 animate-pulse" />
                    <span>Confirmar Entrega</span>
                  </h4>
                  <button 
                    onClick={() => setActiveStep('delivery_detail')}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Voltar Rota
                  </button>
                </div>

                <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 leading-snug">
                  <p>Por favor, recolha o nome de quem está recebendo e a assinatura abaixo para arquivar o comprovante no ERP de vendas.</p>
                </div>

                <form onSubmit={handleFinalizeDeliverySubmit} className="space-y-2.5 text-xs text-slate-300">
                  {/* Name input */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Quem Recebeu? (Nome completo)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Ana Costa (própria) ou Porteiro"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-755 rounded-xl p-2 text-white focus:outline-hidden focus:border-pink-500 text-xs"
                    />
                  </div>

                  {/* Document (Optional) */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">CPF ou Identidade (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: 111.222.333-44"
                      value={receiverDoc}
                      onChange={(e) => setReceiverDoc(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-755 rounded-xl p-2 text-white focus:outline-hidden focus:border-pink-500 text-xs"
                    />
                  </div>

                  {/* Interactive Drawing Pad canvas */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500 block">Assinatura na Tela</label>
                      <button 
                        type="button" 
                        onClick={clearSignature}
                        className="text-[10px] text-pink-500 hover:text-pink-600 font-bold"
                      >
                        Limpar
                      </button>
                    </div>

                    <div className="border border-slate-800 bg-slate-100 rounded-xl overflow-hidden shadow-inner relative max-w-[320px]">
                      <canvas
                        ref={canvasRef}
                        width={300}
                        height={100}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-24 touch-none cursor-crosshair block"
                      />
                      <div className="absolute top-1 right-2 pointer-events-none text-slate-400 text-[8px] uppercase tracking-wider flex items-center gap-0.5">
                        <Brush size={8} />  Painel de toque
                      </div>
                    </div>
                  </div>

                  {/* Payment reminder block */}
                  <div className="p-2 bg-pink-900/10 border border-pink-500/20 text-pink-300 rounded-xl flex items-center justify-between text-[11px] font-bold">
                    <span>Valide a Cobrança:</span>
                    <span className="font-mono text-emerald-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activeOrder.total + activeOrder.deliveryFee)}</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs text-center rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                  >
                    Confirmar e Finalizar Recebimento ✅
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* WHATSAPP AUTOMATION MODAL */}
          {showWhatsappModal && (
            <div className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col justify-center p-5 text-center">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto animate-bounce">
                  <MessageSquare size={24} />
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-white font-extrabold text-sm">Aviso WhatsApp Cliente 🌸</h4>
                  <p className="text-slate-400 text-[10px] leading-relaxed">
                    Status do pedido atualizado para <span className="text-pink-400 font-bold">Saiu para entrega</span>! Envie o aviso de trânsito à cliente agora:
                  </p>
                </div>

                <div className="p-2.5 bg-slate-950 text-left border border-slate-800 rounded-xl max-h-32 overflow-y-auto">
                  <p className="text-[10px] font-mono text-emerald-400 leading-normal whitespace-pre-wrap select-all">
                    {showWhatsappModal.message}
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <a
                    href={showWhatsappModal.link}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      setShowWhatsappModal(null);
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all text-center no-underline hover:text-white"
                  >
                    <MessageSquare size={14} />
                    <span>Enviar Notificação</span>
                  </a>
                  <button
                    onClick={() => setShowWhatsappModal(null)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all border-0 cursor-pointer"
                  >
                    Prosseguir sem enviar
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ADMIN PIN LOCK MODAL WINDOW TO EXIT PORTAL */}
      {showExitModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5.5 max-w-sm w-full text-center space-y-4 shadow-2xl relative">
            <div className="w-11 h-11 bg-pink-600/10 rounded-full flex items-center justify-center text-pink-500 mx-auto">
              <Lock size={20} className={pinError ? 'animate-bounce text-rose-500' : ''} />
            </div>
            
            <div className="space-y-1">
              <h4 className="text-white font-bold text-sm">Controle de Acesso Gerencial</h4>
              <p className="text-slate-400 text-xs leading-normal">Insira a senha de saída de administrador para retornar ao painel ERP geral de gestão</p>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Código PIN Gerencial</label>
              <input
                type="password"
                placeholder="Código de segurança"
                value={exitPin}
                onChange={(e) => setExitPin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-center text-white focus:outline-hidden focus:border-pink-500 tracking-widest text-sm"
              />
              {pinError && <p className="text-rose-500 text-[10px] text-center font-bold font-sans">PIN Inválido! Use "123456" ou "1234"</p>}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Voltar pro App
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Desbloquear ERP 🔓
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
