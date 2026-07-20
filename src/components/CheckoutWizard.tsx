import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  X, 
  Trash2, 
  Sparkles, 
  Truck, 
  Package, 
  Handshake, 
  MapPin, 
  Clock, 
  QrCode, 
  CreditCard, 
  ArrowLeft, 
  ArrowRight,
  MessageCircle,
  User,
  Info,
  Plus,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { validateCPF } from './PublicCatalog'; // Import CPF validation helper if exported, or define it locally
import { getSupabaseClient } from '../supabase';

interface CheckoutWizardProps {
  cart: {
    product: any;
    color: string;
    size: string;
    quantity: number;
    priceAtTime: number;
    isUpsell?: boolean;
  }[];
  handleUpdateItemQty: (index: number, delta: number) => void;
  products?: any[];
  onAddProductToCart?: (product: any, color: string, size: string, priceAtTime: number, isUpsell?: boolean) => void;
  clientName: string;
  setClientName: (val: string) => void;
  clientPhone: string;
  setClientPhone: (val: string) => void;
  clientEmail: string;
  setClientEmail: (val: string) => void;
  clientCpf: string;
  setClientCpf: (val: string) => void;
  clientBirthDate: string;
  setClientBirthDate: (val: string) => void;
  deliveryMethod: any;
  setDeliveryMethod: (val: any) => void;
  addressStreet: string;
  setAddressStreet: (val: string) => void;
  addressNum: string;
  setAddressNum: (val: string) => void;
  addressComp: string;
  setAddressComp: (val: string) => void;
  addressBairro: string;
  setAddressBairro: (val: string) => void;
  addressCidade: string;
  setAddressCidade: (val: string) => void;
  addressEstado: string;
  setAddressEstado: (val: string) => void;
  addressCep: string;
  setAddressCep: (val: string) => void;
  clientNotes: string;
  setClientNotes: (val: string) => void;
  pickupDate: string;
  setPickupDate: (val: string) => void;
  pickupTime: string;
  setPickupTime: (val: string) => void;
  couponCode: string;
  setCouponCode: (val: string) => void;
  isApplyingCoupon: boolean;
  handleApplyCoupon: () => void;
  couponError: string | null;
  couponSuccess: string | null;
  appliedCoupon: any;
  loggedClient: any;
  useCashback: boolean;
  setUseCashback: (val: boolean) => void;
  paymentMethod: any;
  setPaymentMethod: (val: any) => void;
  selectedFreightFee: number | null;
  setSelectedFreightFee: (val: number | null) => void;
  selectedFreightName: string;
  setSelectedFreightName: (val: string) => void;
  selectedFreightId: string;
  setSelectedFreightId: (val: string) => void;
  isMelhorEnvioLoading: boolean;
  melhorEnvioError: string | null;
  melhorEnvioOptions: any[];
  handleCalculateMelhorEnvio: (cep: string) => void;
  pixDiscountPercent: number;
  pixPayload: string;
  storePixKey: string;
  isCopiedPix: boolean;
  handleCopyPix: () => void;
  checkoutError: string | null;
  setCheckoutError: (val: string | null) => void;
  isVipRegisteredJustNow: boolean;
  vipMessage: string;
  cartSubtotal: number;
  cartDiscount: number;
  vipDiscount?: number;
  pixDiscount: number;
  cashbackDiscount: number;
  cartTotal: number;
  completedOrder?: any;
  setCompletedOrder?: (val: any) => void;
  handleCheckoutWhatsApp: () => Promise<void>;
  isGeneratingPaymentLink: boolean;
  setIsCartOpen: (val: boolean) => void;
  setIsProfileModalOpen: (val: boolean) => void;
  initialStep?: number;
}

export function CheckoutWizard({
  cart,
  handleUpdateItemQty,
  products,
  onAddProductToCart,
  clientName,
  setClientName,
  clientPhone,
  setClientPhone,
  clientEmail,
  setClientEmail,
  clientCpf,
  setClientCpf,
  clientBirthDate,
  setClientBirthDate,
  deliveryMethod,
  setDeliveryMethod,
  addressStreet,
  setAddressStreet,
  addressNum,
  setAddressNum,
  addressComp,
  setAddressComp,
  addressBairro,
  setAddressBairro,
  addressCidade,
  setAddressCidade,
  addressEstado,
  setAddressEstado,
  addressCep,
  setAddressCep,
  clientNotes,
  setClientNotes,
  pickupDate,
  setPickupDate,
  pickupTime,
  setPickupTime,
  couponCode,
  setCouponCode,
  isApplyingCoupon,
  handleApplyCoupon,
  couponError,
  couponSuccess,
  appliedCoupon,
  loggedClient,
  useCashback,
  setUseCashback,
  paymentMethod,
  setPaymentMethod,
  selectedFreightFee,
  setSelectedFreightFee,
  selectedFreightName,
  setSelectedFreightName,
  selectedFreightId,
  setSelectedFreightId,
  isMelhorEnvioLoading,
  melhorEnvioError,
  melhorEnvioOptions,
  handleCalculateMelhorEnvio,
  pixDiscountPercent,
  pixPayload,
  storePixKey,
  isCopiedPix,
  handleCopyPix,
  checkoutError,
  setCheckoutError,
  isVipRegisteredJustNow,
  vipMessage,
  cartSubtotal,
  cartDiscount,
  vipDiscount = 0,
  pixDiscount,
  cashbackDiscount,
  cartTotal,
  completedOrder,
  setCompletedOrder,
  handleCheckoutWhatsApp,
  isGeneratingPaymentLink,
  setIsCartOpen,
  setIsProfileModalOpen,
  initialStep
}: CheckoutWizardProps) {
  const [checkoutStep, setCheckoutStep] = useState<number>(initialStep || 1);

  useEffect(() => {
    if (initialStep !== undefined) {
      setCheckoutStep(initialStep);
    }
  }, [initialStep]);
  const [activeAnimation, setActiveAnimation] = useState(() => {
    return localStorage.getItem('ap_vitrine_active_animation') || 'shimmer-luxury';
  });

  const [orderPaymentStatus, setOrderPaymentStatus] = useState<string>('pendente');

  // Reset payment status when completedOrder is cleared
  useEffect(() => {
    if (!completedOrder) {
      setOrderPaymentStatus('pendente');
    }
  }, [completedOrder]);

  // Real-time polling to monitor webhook updates on the order payment status
  useEffect(() => {
    if (!completedOrder || completedOrder.paymentMethod !== 'pix' || orderPaymentStatus === 'pago') {
      return;
    }

    console.log(`[CheckoutWizard] Monitorando status do Pix para o pedido: ${completedOrder.id}`);
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/proxy/online-orders');
        if (response.ok) {
          const data = await response.json();
          const currentOrder = data.find((o: any) => o.id === completedOrder.id);
          if (currentOrder) {
            const status = String(currentOrder.status || '').toLowerCase();
            const statusPag = String(currentOrder.status_pagamento || '').toLowerCase();
            if (status === 'pago' || statusPag === 'pago') {
              console.log(`[CheckoutWizard] Pix confirmado em tempo real para o pedido: ${completedOrder.id}`);
              setOrderPaymentStatus('pago');
              clearInterval(interval);
            }
          }
        }
      } catch (err) {
        console.warn('[CheckoutWizard] Erro na verificação automática de Pix:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [completedOrder, orderPaymentStatus]);

  const suggestedProduct = React.useMemo(() => {
    if (products && products.length > 0) {
      const items = products.filter((p: any) => {
        const cat = (p.category || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        return (cat.includes('acessór') || cat.includes('acessor') || cat.includes('top') || cat.includes('cropped') || name.includes('garrafa') || name.includes('meia') || name.includes('boné') || name.includes('viseira') || name.includes('top')) && p.stock > 0;
      });
      const notInCart = items.filter((p: any) => !cart.some((c: any) => c.product.id === p.id));
      if (notInCart.length > 0) return notInCart[0];
      if (items.length > 0) return items[0];
      const anyNotInCart = products.filter((p: any) => p.stock > 0 && !cart.some((c: any) => c.product.id === p.id));
      if (anyNotInCart.length > 0) return anyNotInCart[0];
      return products[0];
    }
    return {
      id: 'fallback-upsell-top',
      name: 'Top Fitness Confort Cross-Back AP',
      category: 'Tops',
      price: 89.90,
      image: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400&q=80',
      stock: 15,
      sizes: ['P', 'M', 'G'],
      colors: ['Preto', 'Branco', 'Pink'],
      colorStocks: { 'Preto': 5, 'Branco': 5, 'Pink': 5 },
      sizeColorStocks: {
        'P': { 'Preto': 2, 'Branco': 2, 'Pink': 1 },
        'M': { 'Preto': 2, 'Branco': 2, 'Pink': 2 },
        'G': { 'Preto': 1, 'Branco': 1, 'Pink': 2 }
      }
    };
  }, [products, cart]);

  const isUpsellInCart = React.useMemo(() => {
    return cart.some((item: any) => item.isUpsell || (suggestedProduct && item.product.id === suggestedProduct.id));
  }, [cart, suggestedProduct]);

  const deliveryFee = React.useMemo(() => {
    if (deliveryMethod === 'retirada' || deliveryMethod === 'combinar') return 0;
    if (appliedCoupon?.code === 'FRETEGRATIS' || cartSubtotal >= 399) return 0;
    if (selectedFreightFee !== null) return selectedFreightFee;
    return 0;
  }, [deliveryMethod, cartSubtotal, appliedCoupon, selectedFreightFee]);

  useEffect(() => {
    const handleStorageSynced = () => {
      const savedAnim = localStorage.getItem('ap_vitrine_active_animation');
      if (savedAnim) setActiveAnimation(savedAnim);
    };
    window.addEventListener('ap-storage-synced', handleStorageSynced);
    return () => window.removeEventListener('ap-storage-synced', handleStorageSynced);
  }, []);

  const [cpfVerified, setCpfVerified] = useState<boolean>(false);
  const [isCheckingCpf, setIsCheckingCpf] = useState<boolean>(false);
  const [isExistingClient, setIsExistingClient] = useState<boolean>(false);
  const [clientAddresses, setClientAddresses] = useState<any[]>([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | 'new' | null>(null);
  const [showAddressForm, setShowAddressForm] = useState<boolean>(false);
  const [copiedOrderId, setCopiedOrderId] = useState<boolean>(false);
  const [copiedSuccessPix, setCopiedSuccessPix] = useState<boolean>(false);

  // Auto populate date/time when deliveryMethod === 'retirada'
  useEffect(() => {
    if (deliveryMethod === 'retirada') {
      if (!pickupDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');
        setPickupDate(`${yyyy}-${mm}-${dd}`);
      }
      if (!pickupTime) {
        setPickupTime('10:00');
      }
    }
  }, [deliveryMethod, pickupDate, pickupTime, setPickupDate, setPickupTime]);

  // Auto identify when loggedClient changes
  useEffect(() => {
    if (loggedClient && loggedClient.cpf) {
      setCpfVerified(true);
      setIsExistingClient(true);
      setClientCpf(loggedClient.cpf);
      setClientName(loggedClient.name || '');
      setClientPhone(loggedClient.phone || loggedClient.whatsapp || '');
      setClientEmail(loggedClient.email || '');
      setClientBirthDate(loggedClient.birthDate || '');
      
      const addresses: any[] = [];
      if (loggedClient.addressStreet && loggedClient.addressCep) {
        addresses.push({
          id: 'profile',
          label: 'Endereço de Cadastro',
          street: loggedClient.addressStreet,
          num: loggedClient.addressNum || '',
          comp: loggedClient.addressComp || '',
          bairro: loggedClient.addressBairro || '',
          cidade: loggedClient.addressCidade || '',
          estado: loggedClient.addressEstado || '',
          cep: loggedClient.addressCep || ''
        });
      }
      setClientAddresses(addresses);
      if (addresses.length > 0) {
        setSelectedAddressIndex(0);
        setShowAddressForm(false);
        setAddressStreet(addresses[0].street);
        setAddressNum(addresses[0].num);
        setAddressComp(addresses[0].comp);
        setAddressBairro(addresses[0].bairro);
        setAddressCidade(addresses[0].cidade);
        setAddressEstado(addresses[0].estado);
        setAddressCep(addresses[0].cep);
      } else {
        setSelectedAddressIndex('new');
        setShowAddressForm(true);
      }
    }
  }, [loggedClient]);

  const handleCheckCPF = async () => {
    setCheckoutError(null);
    const cleanCpf = clientCpf.replace(/\D/g, '');
    if (!cleanCpf) {
      setCheckoutError('Por favor, informe o seu CPF.');
      return;
    }
    if (!localValidateCPF(clientCpf)) {
      setCheckoutError('Por favor, informe um CPF válido (com 11 dígitos, seguindo o padrão nacional).');
      return;
    }

    setIsCheckingCpf(true);
    try {
      const db = getSupabaseClient();
      if (!db) {
        throw new Error('Supabase client is not configured.');
      }
      
      const formattedCpf = clientCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      
      // Query clients matching the CPF (either clean or formatted)
      const { data: clients, error: clientError } = await db
        .from('ap_clients')
        .select('*')
        .or(`cpf.eq.${cleanCpf},cpf.eq.${formattedCpf}`);
        
      if (clientError) {
        throw clientError;
      }
      
      if (clients && clients.length > 0) {
        // Existing customer found!
        const foundClient = clients[0];
        setIsExistingClient(true);
        
        // Populate personal data
        setClientName(foundClient.name || '');
        setClientPhone(foundClient.phone || foundClient.whatsapp || '');
        setClientEmail(foundClient.email || '');
        setClientBirthDate(foundClient.birthDate || '');
        
        // Build address options from client profile
        const addresses: any[] = [];
        
        // 1. Add profile address if it has street and cep
        if (foundClient.addressStreet && foundClient.addressCep) {
          addresses.push({
            id: 'profile',
            label: 'Endereço de Cadastro',
            street: foundClient.addressStreet,
            num: foundClient.addressNum || '',
            comp: foundClient.addressComp || '',
            bairro: foundClient.addressBairro || '',
            cidade: foundClient.addressCidade || '',
            estado: foundClient.addressEstado || '',
            cep: foundClient.addressCep || ''
          });
        }
        
        // 2. Fetch unique past addresses from sales
        try {
          const { data: sales, error: salesError } = await db
            .from('ap_sales')
            .select('address')
            .or(`clientDoc.eq.${cleanCpf},clientDoc.eq.${formattedCpf}`);
            
          if (!salesError && sales) {
            const seenAddresses = new Set<string>();
            if (foundClient.addressStreet && foundClient.addressCep) {
              const profileStr = `${foundClient.addressStreet}, ${foundClient.addressNum || ''}, ${foundClient.addressBairro || ''}, ${foundClient.addressCidade || ''}`.toLowerCase().trim();
              seenAddresses.add(profileStr);
            }
            
            sales.forEach((sale: any, index: number) => {
              const rawAddr = sale.address;
              if (rawAddr && typeof rawAddr === 'string' && rawAddr.trim()) {
                const addrLower = rawAddr.toLowerCase().trim();
                if (!seenAddresses.has(addrLower)) {
                  seenAddresses.add(addrLower);
                  
                  // Simple heuristic parsing
                  const parts = rawAddr.split(',').map(p => p.trim());
                  let parsedCep = '';
                  let parsedEstado = 'RN';
                  let parsedCidade = 'Natal';
                  let parsedBairro = '';
                  let parsedNum = '';
                  let parsedStreet = parts[0] || '';
                  
                  parts.forEach((p, idx) => {
                    const cepMatch = p.match(/\d{5}-\d{3}/) || p.match(/\d{8}/);
                    if (cepMatch) {
                      parsedCep = cepMatch[0].replace(/\D/g, '');
                    }
                    if (p.length === 2 && p === p.toUpperCase() && idx > 0) {
                      parsedEstado = p;
                    }
                  });
                  
                  addresses.push({
                    id: `sale-${index}`,
                    label: `Endereço de Pedido Anterior`,
                    street: parts[0] || '',
                    num: parts[1] || '',
                    comp: parts[2] && parts[2].includes('CEP') ? '' : (parts[2] || ''),
                    bairro: parts[3] || '',
                    cidade: parts[4] || '',
                    estado: parsedEstado,
                    cep: parsedCep || foundClient.addressCep || ''
                  });
                }
              }
            });
          }
        } catch (e) {
          console.warn('Could not fetch historical sales addresses:', e);
        }
        
        setClientAddresses(addresses);
        setCpfVerified(true);
        
        if (addresses.length > 0) {
          // Select the first address by default
          setSelectedAddressIndex(0);
          setShowAddressForm(false);
          
          // Auto fill address state
          const firstAddr = addresses[0];
          setAddressStreet(firstAddr.street);
          setAddressNum(firstAddr.num);
          setAddressComp(firstAddr.comp);
          setAddressBairro(firstAddr.bairro);
          setAddressCidade(firstAddr.cidade);
          setAddressEstado(firstAddr.estado);
          setAddressCep(firstAddr.cep);
          
          // Trigger freight calculation if delivery method is correios or motoboy
          if (firstAddr.cep && (deliveryMethod === 'correios' || deliveryMethod === 'motoboy')) {
            handleCalculateMelhorEnvio(firstAddr.cep);
          }
        } else {
          // No addresses on file, show address form to enter one
          setSelectedAddressIndex('new');
          setShowAddressForm(true);
        }
      } else {
        // New client!
        setIsExistingClient(false);
        setClientAddresses([]);
        setSelectedAddressIndex('new');
        setShowAddressForm(true);
        setCpfVerified(true);
        
        // Do NOT overwrite CPF but clean other fields so they can fill them fresh
        setClientName('');
        setClientPhone('');
        setClientEmail('');
        setClientBirthDate('');
        
        setAddressStreet('');
        setAddressNum('');
        setAddressComp('');
        setAddressBairro('');
        setAddressCidade('');
        setAddressEstado('RN');
        setAddressCep('');
      }
    } catch (err: any) {
      console.error('Error checking CPF in Supabase:', err);
      // Fallback to offline registration so checkout remains unblocked
      setIsExistingClient(false);
      setSelectedAddressIndex('new');
      setShowAddressForm(true);
      setCpfVerified(true);
    } finally {
      setIsCheckingCpf(false);
    }
  };

  const handleResetCpf = () => {
    setCpfVerified(false);
    setIsExistingClient(false);
    setClientAddresses([]);
    setSelectedAddressIndex(null);
    setShowAddressForm(false);
  };

  // Auto calculate Melhor Envio when Cep is 8 digits in step 2
  useEffect(() => {
    const cleanCep = addressCep.replace(/\D/g, '');
    if (cleanCep.length === 8 && (deliveryMethod === 'correios' || deliveryMethod === 'motoboy')) {
      handleCalculateMelhorEnvio(addressCep);
    }
  }, [addressCep, deliveryMethod]);

  const handleStep1Submit = () => {
    if (cart.length === 0) {
      setCheckoutError('Seu carrinho está vazio.');
      return;
    }
    setCheckoutError(null);
    setCheckoutStep(2);
  };

  const localValidateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    let sum = 0;
    let remainder;
    for (let i = 1; i <= 9; i++) sum = sum + parseInt(cleanCPF.substring(i-1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) sum = sum + parseInt(cleanCPF.substring(i-1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11))  remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
    
    return true;
  };

  const handleStep2Submit = () => {
    setCheckoutError(null);
    if (!clientName.trim()) {
      setCheckoutError('Por favor, preencha o seu Nome Completo.');
      return;
    }
    if (!clientCpf.trim()) {
      setCheckoutError('Por favor, preencha o seu CPF.');
      return;
    }
    if (!localValidateCPF(clientCpf)) {
      setCheckoutError('Por favor, informe um CPF válido (com 11 dígitos, seguindo o padrão nacional).');
      return;
    }
    if (!clientPhone.trim()) {
      setCheckoutError('Por favor, preencha o seu número de Celular / WhatsApp.');
      return;
    }
    if (!clientEmail.trim()) {
      setCheckoutError('Por favor, preencha o seu E-mail de contato.');
      return;
    }
    
    if (deliveryMethod !== 'retirada' && deliveryMethod !== 'combinar') {
      if (!addressStreet.trim() || !addressNum.trim() || !addressBairro.trim() || !addressCidade.trim() || !addressEstado.trim() || !addressCep.trim()) {
        setCheckoutError('Por favor, preencha todos os campos obrigatórios do endereço de entrega (Rua, Número, Bairro, Cidade, Estado e CEP).');
        return;
      }
    }

    if (deliveryMethod === 'retirada') {
      if (!pickupDate || !pickupTime) {
        setCheckoutError('Por favor, agende uma Data e Horário para a retirada do seu pedido na loja.');
        return;
      }
    }

    setCheckoutStep(3);
  };

  return (
    <div className="flex flex-col justify-between h-full">
      {/* Header & Steps indicators */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5">
            <ShoppingBag size={16} className="text-pink-600 animate-pulse" />
            <span className="font-extrabold text-slate-800 text-xs md:text-sm uppercase tracking-wider">
              {completedOrder ? 'Pedido Confirmado' : checkoutStep === 1 ? 'Minha Sacola' : checkoutStep === 2 ? 'Identificação & Entrega' : 'Pagamento'}
            </span>
          </div>
          <button 
            onClick={() => {
              setIsCartOpen(false);
              if (completedOrder && setCompletedOrder) {
                setCompletedOrder(null);
              }
            }}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full transition text-slate-600 cursor-pointer border-none"
          >
            <X size={15} />
          </button>
        </div>

        {cart.length > 0 && !completedOrder && (
          <div className="flex items-center justify-between px-1 py-1 border-b border-slate-100/80 pb-3 select-none">
            <button 
              type="button"
              onClick={() => setCheckoutStep(1)}
              className="flex flex-col items-center gap-1 group flex-1 cursor-pointer border-none bg-transparent"
            >
              <div className="flex items-center justify-center">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${checkoutStep === 1 ? 'bg-pink-600 text-white shadow-xs scale-110' : checkoutStep > 1 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-450'}`}>
                  {checkoutStep > 1 ? '✓' : '1'}
                </span>
              </div>
              <span className={`text-[10px] font-bold transition-colors ${checkoutStep === 1 ? 'text-pink-600 font-extrabold' : 'text-slate-450 group-hover:text-slate-600'}`}>Sacola</span>
            </button>
            <div className={`h-0.5 flex-grow transition-all duration-300 ${checkoutStep >= 2 ? 'bg-pink-500' : 'bg-slate-100'}`} />
            
            <button 
              type="button"
              onClick={() => { if (cart.length > 0) setCheckoutStep(2); }}
              disabled={cart.length === 0}
              className="flex flex-col items-center gap-1 group flex-1 cursor-pointer border-none bg-transparent"
            >
              <div className="flex items-center justify-center">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${checkoutStep === 2 ? 'bg-pink-600 text-white shadow-xs scale-110' : checkoutStep > 2 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-450'}`}>
                  {checkoutStep > 2 ? '✓' : '2'}
                </span>
              </div>
              <span className={`text-[10px] font-bold transition-colors ${checkoutStep === 2 ? 'text-pink-600 font-extrabold' : 'text-slate-450 group-hover:text-slate-600'}`}>Entrega</span>
            </button>
            <div className={`h-0.5 flex-grow transition-all duration-300 ${checkoutStep >= 3 ? 'bg-pink-500' : 'bg-slate-100'}`} />
            
            <button 
              type="button"
              onClick={() => { if (cart.length > 0 && clientName.trim() && clientCpf.trim()) setCheckoutStep(3); }}
              disabled={cart.length === 0 || !clientName.trim() || !clientCpf.trim()}
              className="flex flex-col items-center gap-1 group flex-1 cursor-pointer border-none bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${checkoutStep === 3 ? 'bg-pink-600 text-white shadow-xs scale-110' : 'bg-slate-100 text-slate-450'}`}>
                  3
                </span>
              </div>
              <span className={`text-[10px] font-bold transition-colors ${checkoutStep === 3 ? 'text-pink-600 font-extrabold' : 'text-slate-450'}`}>Pagamento</span>
            </button>
          </div>
        )}
      </div>

      {/* Steps contents rendering */}
      <div className="flex-1 min-h-0 flex flex-col text-slate-700">
        {completedOrder ? (
          <div className="flex flex-col justify-between h-full min-h-0 space-y-4 py-4 text-center animate-in fade-in duration-300">
            <div className="flex-1 overflow-y-auto pr-1 space-y-5 scrollbar-thin text-center">
              {/* Pulsing check icon */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 animate-pulse border border-emerald-100">
                  <CheckCircle2 size={36} />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 font-sans tracking-tight">Pedido Realizado com Sucesso! 🎉</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">Sua reserva de moda fitness foi efetuada no sistema e está pendente de confirmação de pagamento.</p>
              </div>

              {/* Receipt Box */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left space-y-3 shadow-xs">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                  <span className="text-slate-450 font-bold">Código do Pedido</span>
                  <div className="flex items-center gap-1.5 font-mono font-black text-slate-800 bg-white px-2 py-1 rounded-lg border border-slate-100">
                    <span>{completedOrder.id}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(completedOrder.id);
                        setCopiedOrderId(true);
                        setTimeout(() => setCopiedOrderId(false), 2000);
                      }}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none p-0 flex items-center h-4"
                      title="Copiar Código"
                    >
                      {copiedOrderId ? <span className="text-[9px] text-emerald-500 font-bold">Copiado</span> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                {completedOrder.trackingCode && (
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                    <span className="text-slate-450 font-bold">Código de Rastreio (Correios)</span>
                    <div className="flex items-center gap-1.5 font-mono font-black text-pink-600 bg-white px-2 py-1 rounded-lg border border-slate-100">
                      <span>{completedOrder.trackingCode}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(completedOrder.trackingCode);
                        }}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none p-0 flex items-center"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Order Info Rows */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-450 font-semibold">Forma de Recebimento</span>
                    <span className="text-slate-800 font-extrabold">
                      {completedOrder.deliveryMethod === 'motoboy' ? 'Motoboy 🏍️' :
                       completedOrder.deliveryMethod === 'correios' ? 'Correios 📦' :
                       completedOrder.deliveryMethod === 'retirada' ? 'Retirada na Loja 🏠' : 'A Combinar 🤝'}
                    </span>
                  </div>
                  {completedOrder.deliveryMethod === 'retirada' && completedOrder.pickupDate && (
                    <div className="flex justify-between">
                      <span className="text-slate-450 font-semibold">Data de Retirada</span>
                      <span className="text-slate-800 font-extrabold">
                        {new Date(completedOrder.pickupDate).toLocaleDateString('pt-BR')} às {completedOrder.pickupTime}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-450 font-semibold">Forma de Pagamento</span>
                    <span className="text-slate-800 font-extrabold uppercase">
                      {completedOrder.paymentMethod === 'pix' ? 'PIX ⚡' : 'Cartão de Crédito 💳'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100 font-bold">
                    <span className="text-slate-500">Valor Total Pago</span>
                    <span className="text-pink-600 font-black text-sm">R$ {completedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Call-to-Action */}
              {completedOrder.paymentMethod === 'pix' ? (
                <div className="space-y-4 bg-emerald-50/50 border border-emerald-100 rounded-3xl p-4 text-left">
                  {orderPaymentStatus === 'pago' ? (
                    <div className="space-y-3 text-center py-4 font-sans animate-in zoom-in-95 duration-300">
                      <div className="mx-auto w-12 h-12 bg-emerald-100 border border-emerald-200 rounded-full flex items-center justify-center text-emerald-600 animate-bounce">
                        <CheckCircle2 size={24} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-sm text-emerald-950 uppercase tracking-wide">Pagamento Confirmado!</h4>
                        <p className="text-[11px] text-emerald-800 font-bold leading-normal">Seu pedido já está sendo preparado.</p>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-relaxed max-w-xs mx-auto text-center">
                        Identificamos o seu pagamento via Pix de forma automatizada pelo nosso sistema de conciliação. Suas peças exclusivas de alta performance já estão em separação no nosso estoque!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 font-sans text-left">
                      <div className="space-y-2 text-center">
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-black text-[9px] uppercase px-2 py-0.5 rounded-full tracking-wider">
                          ⚡ Desconto de PIX Aplicado!
                        </span>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-medium text-center">
                          Escaneie o QR Code dinâmico abaixo ou copie o código Pix Copia e Cola para efetuar a transferência rápida:
                        </p>
                      </div>

                      {/* QR Code and Code box */}
                      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-2.5 rounded-xl border border-emerald-100 shadow-xs">
                        <div className="p-1 border border-slate-100 rounded-lg bg-slate-50 shrink-0">
                          <img 
                            src={completedOrder?.qrcode_image || `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(completedOrder?.emv || completedOrder?.pixPayload || pixPayload)}`}
                            alt="Pix QR Code"
                            className="w-20 h-20 object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 w-full text-left space-y-2">
                          <div className="space-y-1">
                            <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest block font-mono">PIX Copia e Cola</span>
                            <div className="flex gap-1">
                              <input 
                                type="text"
                                readOnly
                                value={completedOrder?.emv || completedOrder?.pixPayload || pixPayload}
                                className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[9px] font-mono focus:outline-hidden"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(completedOrder?.emv || completedOrder?.pixPayload || pixPayload);
                                  setCopiedSuccessPix(true);
                                  setTimeout(() => setCopiedSuccessPix(false), 2000);
                                }}
                                className="px-2 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg text-[9px] transition cursor-pointer shrink-0 py-1 border-none"
                              >
                                {copiedSuccessPix ? "Copiado!" : "Copiar"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-1.5 py-1 text-[9.5px] text-slate-500 font-bold">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span>Verificando recebimento de pagamento em tempo real...</span>
                      </div>
                    </div>
                  )}

                  {/* Big WhatsApp CTA to submit proof of payment */}
                  <button
                    type="button"
                    onClick={() => {
                      const whatsappUrl = `https://api.whatsapp.com/send?phone=${completedOrder.phone || '5585994269151'}&text=${encodeURIComponent(completedOrder.orderMsg)}`;
                      window.open(whatsappUrl, '_blank');
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/15 transition-all flex items-center justify-center gap-2 cursor-pointer border-none active:scale-97"
                  >
                    <MessageCircle size={15} />
                    <span>Enviar Comprovante via WhatsApp 💬</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 bg-pink-50/50 border border-pink-100 rounded-3xl p-4">
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Caso o pagamento seguro da InfinitePay não tenha se aberto automaticamente em uma nova janela, clique no botão pulsante abaixo para concluir sua transação:
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      if (completedOrder.paymentUrl) {
                        window.open(completedOrder.paymentUrl, '_blank');
                      }
                    }}
                    className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-black shadow-lg shadow-pink-500/15 transition-all flex items-center justify-center gap-2 cursor-pointer border-none active:scale-97 animate-pulse"
                  >
                    <CreditCard size={15} />
                    <span>Concluir Pagamento no InfinitePay 💳</span>
                    <ExternalLink size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Back button to clear and exit - placed outside scrollable area */}
            <button
              type="button"
              onClick={() => {
                if (setCompletedOrder) setCompletedOrder(null);
                setIsCartOpen(false);
              }}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold transition-all cursor-pointer border-none shrink-0"
            >
              Voltar para a Vitrine 🛍️
            </button>
          </div>
        ) : cart.length === 0 ? (
          <div className="py-16 text-center text-slate-450 space-y-3">
            <ShoppingBag size={40} className="mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 text-sm">Sua sacola de compras está vazia.</p>
            <p className="text-[11px]">Aproveite para rechear de conjuntos lindos!</p>
          </div>
        ) : (
          <>
            {/* STEP 1: REVIEW CART ITEMS */}
            {checkoutStep === 1 && (
              <div className="flex flex-col justify-between h-full min-h-0 space-y-4">
                {/* Scrollable upper area containing Items list, Upsell, Delivery and Coupon */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin text-left">
                  {/* List of items */}
                  <div className="space-y-2.5">
                  {cart.map((item, idx) => {
                    const isUpsellItem = item.isUpsell || (suggestedProduct && item.product.id === suggestedProduct.id);
                    const displayPrice = isUpsellItem ? item.product.price * 0.9 : item.priceAtTime;
                    return (
                      <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-xl relative">
                        <div className="flex items-center gap-2.5 text-left">
                          <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0 border border-slate-100">
                            <img src={item.product.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="leading-snug">
                            <p className="font-extrabold text-slate-800 text-[11px] truncate max-w-[140px]">{item.product.name}</p>
                            <p className="text-[9px] text-slate-500 font-bold font-mono mt-0.5">Cor: {item.color} | Tam: {item.size}</p>
                            {isUpsellItem ? (
                              <div className="flex flex-col mt-0.5">
                                <span className="text-[10px] text-[#1E3A42] font-black font-mono">
                                  R$ {displayPrice.toFixed(2)} <span className="text-[8.5px] text-slate-400 font-normal line-through">R$ {item.product.price.toFixed(2)}</span>
                                </span>
                                <span className="text-[8px] text-emerald-600 font-bold tracking-tight">
                                  ✓ Desconto Progressivo Applied!
                                </span>
                              </div>
                            ) : (
                              <p className="text-[10px] text-pink-600 font-black font-mono">R$ {item.priceAtTime.toFixed(2)} un.</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Selector */}
                          <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-xs">
                            <button 
                              type="button"
                              onClick={() => handleUpdateItemQty(idx, -1)}
                              className="w-5 h-5 bg-white text-slate-650 hover:bg-slate-50 flex items-center justify-center cursor-pointer font-bold border-none"
                            >
                              -
                            </button>
                            <span className="text-[10px] font-black font-mono w-5 text-center text-slate-800">{item.quantity}</span>
                            <button 
                              type="button"
                              onClick={() => handleUpdateItemQty(idx, 1)}
                              className="w-5 h-5 bg-white text-slate-650 hover:bg-slate-50 flex items-center justify-center cursor-pointer font-bold border-none"
                            >
                              +
                            </button>
                          </div>

                          {/* Trash */}
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(idx, -item.quantity)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer border-none bg-transparent"
                            title="Remover item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* COMPRE JUNTO COM DESCONTO PROGRESSIVO (UPSELL ESTRUTURADO) */}
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2.5 text-left">
                  <div className="flex items-center gap-1.5 text-[#1E3A42] font-extrabold text-[9.5px] uppercase tracking-wider">
                    <Sparkles size={11} className="text-pink-500 animate-pulse" />
                    <span>Aproveite e Leve Junto</span>
                    <span className="ml-auto text-[7.5px] bg-pink-100 text-pink-750 font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      Combo Progressivo
                    </span>
                  </div>

                  {!isUpsellInCart ? (
                    <div className="flex items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-150 border border-slate-100 shrink-0">
                          <img src={suggestedProduct.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="leading-snug">
                          <p className="font-extrabold text-slate-800 text-[10px] line-clamp-1 max-w-[150px]">
                            {suggestedProduct.name}
                          </p>
                          <p className="text-[9px] text-slate-450 font-medium">Peça de giro rápido</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-pink-600 font-black font-mono">
                              R$ {(suggestedProduct.price * 0.9).toFixed(2)}
                            </span>
                            <span className="text-[8.5px] text-slate-400 line-through font-mono">
                              R$ {suggestedProduct.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const size = suggestedProduct.sizes && suggestedProduct.sizes.length > 0 ? suggestedProduct.sizes[0] : 'M';
                          const color = suggestedProduct.colors && suggestedProduct.colors.length > 0 ? suggestedProduct.colors[0] : 'Única';
                          if (onAddProductToCart) {
                            onAddProductToCart(suggestedProduct, color, size, suggestedProduct.price * 0.9, true);
                          }
                        }}
                        className="py-1.5 px-2.5 bg-[#1E3A42] hover:bg-[#1E3A42]/90 text-white font-bold text-[9px] rounded-lg transition-all flex items-center gap-1 shadow-xs border-none cursor-pointer"
                      >
                        <Plus size={10} />
                        <span>Adicionar por R$ {(suggestedProduct.price * 0.9).toFixed(2)}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-emerald-50/70 border border-emerald-100 p-2.5 rounded-xl flex items-center justify-between text-emerald-850 animate-in fade-in duration-300">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0 animate-bounce" />
                        <span className="text-[10px] font-medium tracking-wide">
                          Peça complementar adicionada! <strong className="font-extrabold text-emerald-900">Desconto Progressivo Aplicado!</strong>
                        </span>
                      </div>
                      <span className="text-[8px] font-black bg-emerald-150 text-emerald-800 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                        -10% OFF
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-3 border-t border-slate-100/65">
                  {/* Delivery Type Selector and Free Shipping Progress */}
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3.5 space-y-3 text-left">
                    <label className="text-slate-500 font-bold text-[9px] uppercase tracking-wider block">Como deseja receber seu pedido?</label>
                    <div className="grid grid-cols-2 p-1 bg-slate-200/55 rounded-xl font-sans font-bold text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          if (deliveryMethod === 'retirada') {
                            setDeliveryMethod('correios');
                          }
                        }}
                        className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none font-extrabold ${
                          deliveryMethod !== 'retirada'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'bg-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Truck size={12} />
                        <span>Entrega</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryMethod('retirada');
                          if (!pickupDate) {
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            const yyyy = tomorrow.getFullYear();
                            const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
                            const dd = String(tomorrow.getDate()).padStart(2, '0');
                            setPickupDate(`${yyyy}-${mm}-${dd}`);
                          }
                          if (!pickupTime) {
                            setPickupTime('10:00');
                          }
                        }}
                        className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none font-extrabold ${
                          deliveryMethod === 'retirada'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'bg-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <MapPin size={12} />
                        <span>Retirada na Loja</span>
                      </button>
                    </div>

                    {deliveryMethod === 'retirada' ? (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <MapPin size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-[9px] text-emerald-850 block uppercase tracking-wide">Ponto de Retirada Física (Frete R$ 0,00)</span>
                          <p className="text-[10px] text-emerald-700 font-semibold leading-snug">Disponível para retirada na loja física em Assu, RN</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cartSubtotal >= 399 ? (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 flex items-center justify-between animate-in fade-in duration-200">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">✓</span>
                              <div>
                                <span className="font-extrabold text-[9px] text-emerald-850 block uppercase tracking-wide">Frete Grátis Ativado</span>
                                <p className="text-[9.5px] text-emerald-650 font-medium leading-none">Sua compra superou R$ 399,00!</p>
                              </div>
                            </div>
                            <span className="bg-emerald-600 text-white font-sans text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm animate-pulse">
                              Frete Grátis Aplicado!
                            </span>
                          </div>
                        ) : (
                          <div className="bg-white/85 border border-slate-150 rounded-xl p-2.5 space-y-2">
                            <div className="flex justify-between items-center text-[9px]">
                              <span className="text-slate-500 font-bold uppercase tracking-wide">Frete Grátis acima de R$ 399,00</span>
                              <span className="text-pink-600 font-extrabold font-mono text-[9.5px]">Faltam R$ {(399 - cartSubtotal).toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-pink-500 to-pink-600 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, (cartSubtotal / 399) * 100)}%` }}
                              />
                            </div>
                            <p className="text-[9px] text-slate-450 font-medium leading-relaxed">
                              Faltam apenas <span className="font-bold text-pink-600">R$ {(399 - cartSubtotal).toFixed(2)}</span> para você garantir Frete Grátis!
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Coupon Component */}
                  <div className="text-left bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                    <label className="text-slate-500 font-bold text-[9px] uppercase tracking-wider block">Possui Cupom Promocional?</label>
                    <div className="flex gap-1.5 mt-0.5">
                      <input 
                        type="text"
                        placeholder="Ex: FITNESS10"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={isApplyingCoupon}
                        className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs uppercase font-mono font-bold text-rose-600 disabled:opacity-50 focus:outline-none focus:border-pink-550"
                      />
                      <button 
                        type="button" 
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon}
                        className="px-3.5 bg-slate-800 hover:bg-slate-900 font-bold text-white h-[30px] rounded-lg transition text-[10px] cursor-pointer flex items-center justify-center gap-1.5 disabled:bg-slate-400 disabled:cursor-not-allowed border-none"
                      >
                        {isApplyingCoupon ? (
                          <>
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                            <span>...</span>
                          </>
                        ) : (
                          <span>Aplicar</span>
                        )}
                      </button>
                    </div>
                    <span className="text-[8px] text-slate-450 block leading-tight">Dica: Use <strong>FITNESS10</strong> (10% OFF), <strong>BEMVINDA50</strong> (R$ 50 OFF) ou <strong>FRETEGRATIS</strong> para testar.</span>
                    {couponError && (
                      <span className="text-[9.5px] text-rose-600 font-bold block">⚠️ {couponError}</span>
                    )}
                    {couponSuccess && (
                      <span className="text-[9.5px] text-emerald-600 font-bold block">✓ {couponSuccess}</span>
                    )}
                  </div>

                  {/* Financial summary */}
                  <div className="space-y-1.5 text-slate-600 text-xs font-sans">
                    <div className="flex justify-between">
                      <span>Subtotal das Peças:</span>
                      <span className="font-bold text-slate-800">R$ {cartSubtotal.toFixed(2)}</span>
                    </div>
                    
                    {isUpsellInCart && (
                      <div className="flex justify-between text-emerald-600 font-sans font-light tracking-wide italic text-[10px] animate-pulse">
                        <span>Combo Progressivo:</span>
                        <span>Desconto Progressivo Applied!</span>
                      </div>
                    )}
                    
                    {appliedCoupon && (
                      <div className="flex justify-between text-rose-600 font-bold">
                        <span>Desconto Especial ({appliedCoupon.code}):</span>
                        <span>-R$ {cartDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    {vipDiscount > 0 && (
                      <div className="flex justify-between text-amber-700 font-extrabold bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded text-[10px]">
                        <span>👑 Desconto Clube VIP (10% OFF):</span>
                        <span>-R$ {vipDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>Frete / Envio:</span>
                      <span className="font-bold text-slate-850">
                        {deliveryMethod === 'retirada' ? (
                          <span className="text-emerald-600 font-bold uppercase text-[9.5px]">Grátis (Retirada)</span>
                        ) : cartSubtotal >= 399 || appliedCoupon?.code === 'FRETEGRATIS' ? (
                          <span className="text-emerald-600 font-bold uppercase text-[9.5px]">Frete Grátis Applied</span>
                        ) : selectedFreightFee !== null ? (
                          `R$ ${selectedFreightFee.toFixed(2)}`
                        ) : (
                          <span className="text-slate-400 font-normal">Calculado no próximo passo</span>
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-900 font-bold text-xs pt-1.5 border-t border-slate-100">
                      <span>Total Parcial:</span>
                      <span className="text-pink-600 font-extrabold font-mono text-sm">
                        R$ {(cartSubtotal - cartDiscount - vipDiscount + (deliveryMethod === 'retirada' || cartSubtotal >= 399 || appliedCoupon?.code === 'FRETEGRATIS' ? 0 : (selectedFreightFee || 0))).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky/Fixed Actions at the bottom */}
                <div className="space-y-3 pt-3 border-t border-slate-100 shrink-0">
                  {checkoutError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-bold p-3 rounded-xl animate-in fade-in duration-200 text-left">
                      ⚠️ {checkoutError}
                    </div>
                  )}

                  {/* Advance button */}
                  <button
                    type="button"
                    onClick={handleStep1Submit}
                    className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer border-none shadow-pink-500/15 active:scale-98 shrink-0"
                  >
                    <span>Continuar Compra</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: IDENTIFICATION & SHIPPING */}
            {checkoutStep === 2 && (
              <div className="flex flex-col justify-between h-full min-h-0 space-y-4">
                <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin text-left">
                  {!cpfVerified ? (
                    <div className="space-y-4 text-center py-6 animate-in fade-in duration-200">
                      <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-2 text-pink-600">
                        <User size={24} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-sm text-slate-800">Identificação Rápida</h4>
                        <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                          Digite seu CPF para resgatar seus dados, consultar benefícios VIP e agilizar a sua entrega.
                        </p>
                      </div>

                      <div className="max-w-xs mx-auto space-y-3">
                        <div className="text-left">
                          <label className="text-slate-500 font-bold text-[9px] uppercase tracking-wider block mb-1">Digite seu CPF *</label>
                          <input 
                            type="text"
                            required
                            placeholder="Ex: 123.456.789-00"
                            value={clientCpf}
                            onChange={(e) => {
                              // live mask
                              let val = e.target.value.replace(/\D/g, '');
                              if (val.length > 11) val = val.slice(0, 11);
                              if (val.length > 9) {
                                val = val.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
                              } else if (val.length > 6) {
                                val = val.replace(/^(\d{3})(\d{3})(\d{1,3})$/, "$1.$2.$3");
                              } else if (val.length > 3) {
                                val = val.replace(/^(\d{3})(\d{1,3})$/, "$1.$2");
                              }
                              setClientCpf(val);
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs text-center focus:outline-none focus:border-pink-550 focus:ring-1 focus:ring-pink-550 font-mono"
                          />
                        </div>

                        {checkoutError && (
                          <div className="bg-rose-50 border border-rose-100 text-rose-800 text-[10px] font-bold p-2.5 rounded-lg text-left">
                            ⚠️ {checkoutError}
                          </div>
                        )}

                        <button
                          type="button"
                          disabled={isCheckingCpf}
                          onClick={handleCheckCPF}
                          className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer border-none shadow-md shadow-pink-500/10 disabled:opacity-75"
                        >
                          {isCheckingCpf ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                              <span>Buscando Cadastro...</span>
                            </>
                          ) : (
                            <>
                              <span>Continuar</span>
                              <ArrowRight size={13} />
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCheckoutError(null);
                            setCheckoutStep(1);
                          }}
                          className="w-full py-1.5 text-slate-500 hover:text-slate-700 font-extrabold text-[10px] uppercase tracking-wider transition cursor-pointer bg-transparent border-none"
                        >
                          Voltar para a sacola
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      {isExistingClient ? (
                        <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100/70 space-y-1">
                          <div className="flex items-center gap-1.5 text-emerald-800">
                            <Sparkles size={12} className="animate-pulse" />
                            <span className="font-extrabold text-[10px] tracking-wider uppercase">Olá de volta! Confirmamos seus dados.</span>
                          </div>
                          <p className="text-[9.5px] text-slate-650 leading-normal">
                            Que bom ter você aqui novamente, <strong>{clientName}</strong>! Identificamos o seu cadastro. Confira os dados e escolha seu endereço de entrega.
                          </p>
                          <div className="pt-1.5 flex items-center justify-between text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">
                            <span>CPF: {clientCpf}</span>
                            <button 
                              type="button" 
                              onClick={handleResetCpf} 
                              className="text-pink-600 hover:text-pink-700 hover:underline cursor-pointer bg-transparent border-none"
                            >
                              Alterar CPF
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-pink-50/50 p-3 rounded-2xl border border-pink-100/40 space-y-0.5">
                          <div className="flex items-center gap-1.5 text-pink-700">
                            <Sparkles size={11} className="animate-pulse" />
                            <span className="font-extrabold text-[10px] tracking-wider uppercase">Fidelidade VIP & Entrega (Novo Cadastro)</span>
                          </div>
                          <p className="text-[9px] text-slate-500 font-medium">Cadastre-se rapidamente abaixo para garantir cashback de 5% nesta compra, brindes e suporte VIP!</p>
                          <div className="pt-1 flex items-center justify-between text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">
                            <span>CPF: {clientCpf}</span>
                            <button 
                              type="button" 
                              onClick={handleResetCpf} 
                              className="text-pink-600 hover:text-pink-700 hover:underline cursor-pointer bg-transparent border-none"
                            >
                              Alterar CPF
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3.5 text-xs">
                        {/* Only show personal fields to edit or fill if it's a new customer or if they want to edit */}
                        {!isExistingClient && (
                          <>
                            <div>
                              <label className="text-slate-450 font-bold text-[9px] uppercase tracking-wider block">Seu Nome Completo *</label>
                              <input 
                                type="text"
                                required
                                placeholder="Ex: Gabriela Duarte"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-xs focus:outline-none focus:border-pink-550"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-slate-450 font-bold text-[9px] uppercase tracking-wider block">Data de Nascimento (Opcional)</label>
                                <input 
                                  type="date"
                                  value={clientBirthDate}
                                  onChange={(e) => setClientBirthDate(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-xs focus:outline-none focus:border-pink-550 font-mono"
                                />
                              </div>
                              <div>
                                <label className="text-slate-450 font-bold text-[9px] uppercase tracking-wider block">Celular / WhatsApp *</label>
                                <input 
                                  type="text"
                                  required
                                  placeholder="Ex: (11) 99999-8888"
                                  value={clientPhone}
                                  onChange={(e) => setClientPhone(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-xs focus:outline-none focus:border-pink-550 font-mono"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-slate-450 font-bold text-[9px] uppercase tracking-wider block">E-mail *</label>
                              <input 
                                type="email"
                                required
                                placeholder="Ex: gabriela@email.com"
                                value={clientEmail}
                                onChange={(e) => setClientEmail(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-xs focus:outline-none focus:border-pink-550"
                              />
                            </div>
                          </>
                        )}

                        {/* Addresses list for Old Customer */}
                        {isExistingClient && clientAddresses.length > 0 && (
                          <div className="space-y-2">
                            <label className="text-slate-450 font-bold text-[9px] uppercase tracking-wider block">Selecione o Endereço de Entrega *</label>
                            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                              {clientAddresses.map((addr, idx) => {
                                const isSelected = selectedAddressIndex === idx && !showAddressForm;
                                return (
                                  <div
                                    key={addr.id}
                                    onClick={() => {
                                      setSelectedAddressIndex(idx);
                                      setShowAddressForm(false);
                                      setAddressStreet(addr.street);
                                      setAddressNum(addr.num);
                                      setAddressComp(addr.comp);
                                      setAddressBairro(addr.bairro);
                                      setAddressCidade(addr.cidade);
                                      setAddressEstado(addr.estado);
                                      setAddressCep(addr.cep);
                                      
                                      // Trigger auto freight calculation
                                      if (addr.cep && (deliveryMethod === 'correios' || deliveryMethod === 'motoboy')) {
                                        handleCalculateMelhorEnvio(addr.cep);
                                      }
                                    }}
                                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative
                                      ${isSelected 
                                        ? 'bg-pink-50/30 border-pink-400 shadow-xs ring-1 ring-pink-400' 
                                        : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                                  >
                                    <div className="flex items-start gap-2.5">
                                      <div className={`mt-0.5 w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-pink-500 bg-pink-500' : 'border-slate-300'}`}>
                                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                      </div>
                                      <div className="space-y-0.5">
                                        <span className="text-[8px] font-extrabold uppercase tracking-wide text-pink-600 bg-pink-50/55 px-1.5 py-0.5 rounded-md border border-pink-100/40 font-sans">
                                          {addr.label}
                                        </span>
                                        <p className="text-[11px] font-bold text-slate-800 pt-0.5 font-sans">
                                          {addr.street}, {addr.num} {addr.comp && `- ${addr.comp}`}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-medium font-sans">
                                          {addr.bairro} • {addr.cidade} - {addr.estado} • CEP {addr.cep}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAddressIndex('new');
                                  setShowAddressForm(true);
                                  setAddressStreet('');
                                  setAddressNum('');
                                  setAddressComp('');
                                  setAddressBairro('');
                                  setAddressCidade('');
                                  setAddressEstado('RN');
                                  setAddressCep('');
                                }}
                                className={`w-full p-3 rounded-xl border border-dashed text-left transition-all cursor-pointer flex items-center justify-center gap-2 text-[10px] font-extrabold font-sans
                                  ${showAddressForm 
                                    ? 'bg-slate-50 border-slate-400 text-slate-700' 
                                    : 'border-slate-300 text-slate-500 hover:text-slate-700 hover:border-slate-400'}`}
                              >
                                <Plus size={12} />
                                <span>+ Adicionar Novo Endereço</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Delivery selection buttons */}
                    <div>
                      <label className="text-slate-450 font-bold text-[9px] uppercase tracking-wider block mb-1">Forma de Retirada/Envio *</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 font-sans font-bold">
                        <button
                          type="button"
                          onClick={() => setDeliveryMethod('motoboy')}
                          className={`py-1.5 transition rounded-lg text-[9px] flex flex-col items-center justify-center gap-1 cursor-pointer border
                            ${deliveryMethod === 'motoboy' 
                              ? 'bg-slate-900 border-slate-900 text-white' 
                              : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'}`}
                        >
                          <Truck size={12} />
                          <span>Motoboy</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeliveryMethod('correios')}
                          className={`py-1.5 transition rounded-lg text-[9px] flex flex-col items-center justify-center gap-1 cursor-pointer border
                            ${deliveryMethod === 'correios' 
                              ? 'bg-slate-900 border-slate-900 text-white' 
                              : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'}`}
                        >
                          <Package size={12} />
                          <span>Correios/Transp.</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeliveryMethod('combinar')}
                          className={`py-1.5 transition rounded-lg text-[9px] flex flex-col items-center justify-center gap-1 cursor-pointer border
                            ${deliveryMethod === 'combinar' 
                              ? 'bg-slate-900 border-slate-900 text-white' 
                              : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'}`}
                        >
                          <Handshake size={12} />
                          <span>Combinar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeliveryMethod('retirada');
                            if (!pickupDate) {
                              const tomorrow = new Date();
                              tomorrow.setDate(tomorrow.getDate() + 1);
                              const yyyy = tomorrow.getFullYear();
                              const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
                              const dd = String(tomorrow.getDate()).padStart(2, '0');
                              setPickupDate(`${yyyy}-${mm}-${dd}`);
                            }
                            if (!pickupTime) {
                              setPickupTime('10:00');
                            }
                          }}
                          className={`py-1.5 transition rounded-lg text-[9px] flex flex-col items-center justify-center gap-1 cursor-pointer border
                            ${deliveryMethod === 'retirada' 
                              ? 'bg-slate-900 border-slate-900 text-white' 
                              : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'}`}
                        >
                          <MapPin size={12} />
                          <span>Retirar</span>
                        </button>
                      </div>
                    </div>

                    {/* Pickup Scheduler for Retirada */}
                    {deliveryMethod === 'retirada' && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-250 space-y-2.5 bg-pink-50/25 border border-pink-100/40 rounded-xl p-3">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-pink-600 animate-pulse" />
                          <p className="font-extrabold text-[10px] uppercase tracking-wider text-pink-700">Agendar Retirada na Loja</p>
                        </div>
                        <p className="text-[9px] text-slate-500 leading-normal">
                          Escolha o melhor dia e horário estimado para retirar seu pedido fitness na nossa loja matriz.
                        </p>
                        
                        <div className="bg-emerald-50 border border-emerald-100/80 rounded-xl p-2.5 flex items-start gap-2">
                          <MapPin size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-[9px] text-emerald-850 block uppercase tracking-wide">Ponto de Retirada Física (Frete R$ 0,00)</span>
                            <p className="text-[10px] text-emerald-700 font-semibold leading-snug">Disponível para retirada na loja física em Assu, RN</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-slate-500 font-bold text-[8px] uppercase tracking-wider block mb-1">Data de Retirada *</label>
                            <input 
                              type="date"
                              required
                              value={pickupDate}
                              min={new Date().toISOString().split('T')[0]}
                              onChange={(e) => setPickupDate(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[10px] bg-white font-semibold focus:outline-none focus:border-pink-550"
                            />
                          </div>
                          <div>
                            <label className="text-slate-500 font-bold text-[8px] uppercase tracking-wider block mb-1">Horário Estimado *</label>
                            <select
                              required
                              value={pickupTime}
                              onChange={(e) => setPickupTime(e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-[10px] bg-white font-semibold focus:outline-none focus:border-pink-550"
                            >
                              <option value="">Selecione...</option>
                              <option value="09:00">09:00 (Abertura)</option>
                              <option value="10:00">10:00</option>
                              <option value="11:00">11:00</option>
                              <option value="12:00">12:00 (Almoço)</option>
                              <option value="13:00">13:00</option>
                              <option value="14:00">14:00</option>
                              <option value="15:00">15:00</option>
                              <option value="16:00">16:00</option>
                              <option value="17:00">17:00</option>
                              <option value="18:00">18:00 (Fechamento)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Address form fields */}
                    {deliveryMethod !== 'retirada' && deliveryMethod !== 'combinar' && (
                      <div className="animate-in fade-in duration-200 space-y-2 border-t border-slate-100/60 pt-2.5">
                        <p className="font-extrabold text-[9px] uppercase tracking-wider text-slate-500">Endereço de Destino para Entrega</p>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-1">
                            <label className="text-slate-450 font-bold text-[8px] uppercase tracking-wider block">CEP *</label>
                            <input 
                              type="text"
                              required
                              placeholder="Ex: 01311200"
                              value={addressCep}
                              onChange={(e) => setAddressCep(e.target.value)}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium focus:outline-none focus:border-pink-550 font-mono"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-slate-450 font-bold text-[8px] uppercase tracking-wider block">Rua / Logradouro *</label>
                            <input 
                              type="text"
                              required
                              placeholder="Ex: Avenida Paulista"
                              value={addressStreet}
                              onChange={(e) => setAddressStreet(e.target.value)}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium focus:outline-none focus:border-pink-550"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-slate-450 font-bold text-[8px] uppercase tracking-wider block">Número *</label>
                            <input 
                              type="text"
                              required
                              placeholder="Ex: 100"
                              value={addressNum}
                              onChange={(e) => setAddressNum(e.target.value)}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium focus:outline-none focus:border-pink-550"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-slate-450 font-bold text-[8px] uppercase tracking-wider block">Complemento</label>
                            <input 
                              type="text"
                              placeholder="Ex: Apto 101"
                              value={addressComp}
                              onChange={(e) => setAddressComp(e.target.value)}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-slate-450 font-bold text-[8px] uppercase tracking-wider block">Bairro *</label>
                            <input 
                              type="text"
                              required
                              placeholder="Ex: Cerqueira"
                              value={addressBairro}
                              onChange={(e) => setAddressBairro(e.target.value)}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-slate-450 font-bold text-[8px] uppercase tracking-wider block">Cidade *</label>
                            <input 
                              type="text"
                              required
                              placeholder="Ex: São Paulo"
                              value={addressCidade}
                              onChange={(e) => setAddressCidade(e.target.value)}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-slate-450 font-bold text-[8px] uppercase tracking-wider block">Estado *</label>
                            <input 
                              type="text"
                              required
                              placeholder="Ex: SP"
                              value={addressEstado}
                              onChange={(e) => setAddressEstado(e.target.value)}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium focus:outline-none uppercase font-mono"
                            />
                          </div>
                        </div>

                        {/* Live Freight Options */}
                        <div className="mt-3 bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-left space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Opções de Envio (Melhor Envio)</span>
                            {isMelhorEnvioLoading && (
                              <span className="text-[8px] text-pink-600 font-bold flex items-center gap-1 animate-pulse">
                                <span className="w-1.5 h-1.5 border-2 border-pink-600 border-t-transparent rounded-full animate-spin inline-block" />
                                Cotando...
                              </span>
                            )}
                          </div>

                          {addressCep.replace(/\D/g, '').length < 8 ? (
                            <p className="text-[9px] text-slate-400">Por favor, digite um CEP válido de 8 dígitos para consultar prazos e valores de frete.</p>
                          ) : isMelhorEnvioLoading ? (
                            <div className="py-4 text-center">
                              <span className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin inline-block" />
                              <p className="text-[9px] text-slate-400 mt-1">Buscando as melhores taxas de frete...</p>
                            </div>
                          ) : melhorEnvioError ? (
                            <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-[9px] font-semibold">
                              {melhorEnvioError}
                              <button
                                type="button"
                                onClick={() => handleCalculateMelhorEnvio(addressCep)}
                                className="ml-2 underline text-rose-800 hover:text-rose-900 font-bold cursor-pointer"
                              >
                                Tentar Novamente
                              </button>
                            </div>
                          ) : melhorEnvioOptions.length > 0 ? (
                            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                              {melhorEnvioOptions.map((option) => {
                                const isSelected = selectedFreightName === option.name && selectedFreightFee === option.price;
                                return (
                                  <div
                                    key={option.id}
                                    onClick={() => {
                                      setSelectedFreightFee(option.price);
                                      setSelectedFreightName(option.name);
                                      setSelectedFreightId(option.id);
                                    }}
                                    className={`p-2 rounded-xl border transition-all flex items-center justify-between cursor-pointer
                                      ${isSelected 
                                        ? 'bg-pink-50/50 border-pink-300 shadow-xs' 
                                        : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-pink-500 bg-pink-500' : 'border-slate-300'}`}>
                                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-slate-800">
                                          {option.company} - {option.name}
                                        </p>
                                        <p className="text-[8px] text-slate-450 font-medium">Prazo estimado: {option.delivery_time} {option.delivery_time === 1 ? 'dia útil' : 'dias úteis'}</p>
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-black text-pink-600 font-mono">
                                      R$ {Number(option.price).toFixed(2)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-[9px] text-slate-400">Insira um CEP para ver as opções de frete disponíveis.</p>
                          )}
                        </div>
                      </div>
                    )}

                      <div>
                        <label className="text-slate-450 font-bold text-[9px] uppercase tracking-wider block">Nota / Observação Especial (Opcional)</label>
                        <input 
                          type="text"
                          placeholder="Ex: Embrulhar para presente, deixar na portaria..."
                          value={clientNotes}
                          onChange={(e) => setClientNotes(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons for Step 2 */}
                {cpfVerified && (
                  <div className="space-y-3 pt-3 border-t border-slate-100/70 shrink-0">
                    {checkoutError && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-bold p-3 rounded-xl animate-in fade-in duration-200 text-left font-sans">
                        ⚠️ {checkoutError}
                      </div>
                    )}

                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setCheckoutError(null);
                          setCheckoutStep(1);
                        }}
                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
                      >
                        <ArrowLeft size={13} />
                        <span>Voltar</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleStep2Submit}
                        className="flex-2 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer border-none shadow-pink-500/15"
                      >
                        <span>Ir para Pagamento</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: PAYMENT METHOD */}
            {checkoutStep === 3 && (
              <div className="flex flex-col justify-between h-full min-h-0 space-y-4">
                <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin text-left">
                  {/* Cashback Club VIP */}
                  <div className="space-y-2">
                    <p className="font-extrabold text-[9px] uppercase tracking-wider text-slate-500">Clube VIP & Cashback</p>
                    {loggedClient ? (
                      <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-xl p-3.5 flex flex-col gap-2 text-left animate-in fade-in duration-250">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wide">
                            ✨ Cliente VIP Identificado
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold font-mono">
                            Saldo: R$ {loggedClient.cashbackBalance?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-600 leading-normal">
                          Olá, <strong>{loggedClient.name}</strong>! Deseja resgatar seu cashback acumulado como desconto nesta compra?
                        </p>
                        {(loggedClient.cashbackBalance || 0) > 0 ? (
                          <label className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-emerald-100 cursor-pointer shadow-xs hover:bg-emerald-50/30 transition">
                            <input 
                              type="checkbox"
                              checked={useCashback}
                              onChange={(e) => setUseCashback(e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                            />
                            <span className="text-[10px] font-bold text-slate-700">
                              Sim, usar R$ {Math.min(loggedClient.cashbackBalance || 0, cartSubtotal - cartDiscount - pixDiscount).toFixed(2)} de desconto! 🎁
                            </span>
                          </label>
                        ) : (
                          <div className="text-[9px] text-slate-500 italic font-medium leading-normal">
                            Você ainda não possui cashback disponível. Esta compra gerará 5% de cashback para o seu próximo pedido! 🌸
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-left">
                        <p className="text-[9px] text-slate-650 leading-relaxed font-medium">
                          Consulte seu saldo de Cashback na <strong>Área VIP</strong> (ícone de perfil no topo do site) para resgatá-lo nesta compra!
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCartOpen(false); // Close cart
                            setIsProfileModalOpen(true); // Open login modal
                          }}
                          className="mt-2 text-pink-600 hover:text-pink-700 font-extrabold text-[9px] uppercase tracking-wider flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-xs cursor-pointer"
                        >
                          <User size={10} /> Entrar na Área VIP →
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Payment Selection */}
                  <div className="space-y-3">
                    <p className="font-extrabold text-[9px] uppercase tracking-wider text-slate-500">Escolha a Forma de Pagamento</p>
                    
                    <div className="grid grid-cols-2 gap-2 font-sans font-bold">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('pix')}
                        className={`py-2 px-2.5 transition rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer border
                          ${paymentMethod === 'pix' 
                            ? 'bg-pink-50 border-pink-550 text-pink-700 font-extrabold ring-1 ring-pink-550/20' 
                            : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'}`}
                      >
                        <QrCode size={13} className={paymentMethod === 'pix' ? "text-pink-600" : "text-slate-400"} />
                        <div className="text-left leading-normal font-sans">
                          <span className="block font-extrabold text-[10.5px]">Pagar com PIX</span>
                          <span className="block text-[7.5px] text-emerald-600 font-medium leading-none">Ganhe {pixDiscountPercent}% OFF Extra! ⚡</span>
                        </div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cartao')}
                        className={`py-2 px-2.5 transition rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer border
                          ${paymentMethod === 'cartao' 
                            ? 'bg-pink-50 border-pink-550 text-pink-700 font-extrabold ring-1 ring-pink-550/20' 
                            : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'}`}
                      >
                        <CreditCard size={13} className={paymentMethod === 'cartao' ? "text-pink-600" : "text-slate-400"} />
                        <div className="text-left leading-normal font-sans">
                          <span className="block font-extrabold text-[10.5px]">Cartão de Crédito</span>
                          <span className="block text-[7.5px] text-slate-500 font-medium leading-none">Até 6x sem juros 💳</span>
                        </div>
                      </button>
                    </div>

                    {/* Dynamic Details based on Method */}
                    {paymentMethod === 'pix' && (
                      <div className="bg-emerald-50/40 rounded-2xl border border-emerald-100 p-4 space-y-4 font-sans animate-in fade-in duration-200 text-left">
                        <div className="flex items-start gap-2.5">
                          <div className="p-1.5 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl shrink-0">
                            <Sparkles size={12} className="animate-pulse" />
                          </div>
                          <div className="text-left leading-snug">
                            <p className="font-extrabold text-xs text-emerald-900 uppercase tracking-wide">Pague Seguro via PIX</p>
                            <p className="text-[10px] text-emerald-700 font-semibold leading-normal">Sua compra foi bonificada com <strong>{pixDiscountPercent}% de desconto extra</strong>!</p>
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-emerald-150 shadow-xs space-y-3 relative overflow-hidden">
                          <p className="text-[11px] font-bold text-slate-700 leading-normal">
                            O seu <strong>QR Code legítimo e código Pix Copia e Cola dinâmico</strong> serão gerados em tempo real pela <strong>InfinitePay</strong> assim que você clicar em "Enviar Pedido".
                          </p>
                          <p className="text-[10.5px] text-slate-500 font-semibold leading-normal">
                            Após a conclusão do pagamento, o sistema dará baixa automática no estoque de forma instantânea! 🌸
                          </p>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'cartao' && (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 font-sans animate-in fade-in duration-200 text-left">
                        <div className="bg-white p-4 rounded-xl border border-pink-200 shadow-xs space-y-3 relative overflow-hidden">
                          <div className="absolute right-3 top-3 text-pink-500 opacity-20">
                            <CreditCard size={40} />
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-pink-600 font-extrabold text-sm font-sans tracking-wide">InfinitePay</span>
                            <span className="bg-pink-100 text-pink-700 font-bold text-[8px] uppercase px-1.5 py-0.5 rounded-full">Checkout Integrado</span>
                          </div>

                          <p className="text-[11px] font-bold text-slate-700 leading-normal">
                            Você será redirecionado para o ambiente seguro da <strong>InfinitePay</strong> para concluir o seu pagamento com total segurança.
                          </p>

                          <ul className="text-[9.5px] text-slate-500 space-y-1 font-medium">
                            <li className="flex items-center gap-1.5">
                              <span className="text-pink-650 font-bold">✔</span> Parcelamento com excelentes taxas no cartão
                            </li>
                            <li className="flex items-center gap-1.5">
                              <span className="text-pink-650 font-bold">✔</span> Aprovação imediata e 100% protegida
                            </li>
                            <li className="flex items-center gap-1.5">
                              <span className="text-pink-650 font-bold">✔</span> Conectado direto com nosso sistema de estoque
                            </li>
                          </ul>
                        </div>
                        
                        <p className="text-[8.5px] font-medium text-slate-450 text-center leading-normal">
                          🔒 Ambiente seguro auditado pela InfinitePay. Não armazenamos seus dados bancários.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial overview and Final action button */}
                <div className="border-t border-slate-100 pt-3 mt-4 space-y-3">
                  {isVipRegisteredJustNow && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl space-y-1.5 animate-in fade-in duration-300">
                      <p className="font-bold text-[11px] uppercase tracking-wide flex items-center gap-1 text-emerald-800">
                        <span>🎉</span>
                        <span>Cadastro Sincronizado!</span>
                      </p>
                      <p className="text-[10px] text-emerald-750 font-medium leading-relaxed">
                        {vipMessage}
                      </p>
                    </div>
                  )}

                  <div className="space-y-1 text-slate-650 text-xs font-sans">
                    <div className="flex justify-between">
                      <span>Subtotal das Peças:</span>
                      <span className="font-bold text-slate-800">R$ {cartSubtotal.toFixed(2)}</span>
                    </div>
                    
                    {isUpsellInCart && (
                      <div className="flex justify-between text-emerald-600 font-sans font-light tracking-wide italic text-[10px] animate-pulse">
                        <span>Combo Progressivo:</span>
                        <span>Desconto Progressivo Applied!</span>
                      </div>
                    )}
                    
                    {appliedCoupon && (
                      <div className="flex justify-between text-rose-600 font-bold">
                        <span>Desconto Especial ({appliedCoupon.code}):</span>
                        <span>-R$ {cartDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    {vipDiscount > 0 && (
                      <div className="flex justify-between text-amber-700 font-extrabold bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded text-[10px]">
                        <span>👑 Desconto Clube VIP (10% OFF):</span>
                        <span>-R$ {vipDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    {paymentMethod === 'pix' && pixDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>Desconto Extra Pix ({pixDiscountPercent}% OFF):</span>
                        <span>-R$ {pixDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    {useCashback && cashbackDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>Desconto Cashback VIP:</span>
                        <span>-R$ {cashbackDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>Taxa de Envio:</span>
                      <span className="font-bold text-slate-800 text-right">
                        {deliveryMethod === 'retirada' ? (
                          "Retirar na Loja 🏠 (R$ 0,00)"
                        ) : deliveryMethod === 'combinar' ? (
                          "A combinar 🤝"
                        ) : selectedFreightFee !== null ? (
                          <span className="flex flex-col items-end">
                            <span>R$ {selectedFreightFee.toFixed(2)}</span>
                            {selectedFreightName && <span className="text-[7.5px] text-slate-450 font-medium leading-none mt-0.5">({selectedFreightName})</span>}
                          </span>
                        ) : (
                          "R$ 0,00"
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-100">
                      <span>Total da Encomenda:</span>
                      <span className="text-pink-600 text-base font-extrabold font-mono">R$ {cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Sticky/Fixed Actions at the bottom */}
                <div className="space-y-3 pt-3 border-t border-slate-100/70 shrink-0">
                  {checkoutError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-bold p-3 rounded-xl animate-in fade-in duration-200 text-left">
                      ⚠️ {checkoutError}
                    </div>
                  )}

                  <div className="flex gap-2.5 font-sans">
                    <button
                      type="button"
                      onClick={() => {
                        setCheckoutError(null);
                        setCheckoutStep(2);
                      }}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
                    >
                      <ArrowLeft size={13} />
                      <span>Voltar</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCheckoutWhatsApp}
                      disabled={isGeneratingPaymentLink}
                      className={`flex-2 py-3 text-white rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer border-none active:scale-97 ${
                        isGeneratingPaymentLink 
                          ? 'bg-slate-400 cursor-not-allowed shadow-none' 
                          : paymentMethod === 'cartao' 
                            ? 'bg-pink-600 hover:bg-pink-700 shadow-pink-500/15' 
                            : 'bg-green-600 hover:bg-green-700 shadow-green-500/15'
                      } ${activeAnimation && activeAnimation !== 'none' ? `anim-${activeAnimation}` : ''}`}
                    >
                      {isGeneratingPaymentLink ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                          <span>Gerando Link...</span>
                        </>
                      ) : paymentMethod === 'cartao' ? (
                        <>
                          <CreditCard size={15} />
                          <span>Pagar Seguro</span>
                        </>
                      ) : (
                        <>
                          <MessageCircle size={15} />
                          <span>Enviar Pedido</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
