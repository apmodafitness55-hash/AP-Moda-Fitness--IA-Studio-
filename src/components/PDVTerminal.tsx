/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';

export const metadata = { robots: { index: false, follow: false } };
import { 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingCart, 
  User, 
  Tag, 
  CheckCircle,
  HelpCircle,
  TrendingDown,
  Instagram,
  Laptop,
  Store,
  MessageCircle,
  Compass,
  FileText,
  DollarSign,
  Printer,
  Truck,
  Link,
  Camera,
  QrCode,
  FileSpreadsheet,
  Sparkles,
  Volume2,
  X,
  Check
} from 'lucide-react';
import { Product, SaleItem, Sale, Client, SalesChannel, ActiveTab } from '../types';
import { getCardMachinesConfig, CardMachineConfig } from '../lib/cardMachines';
import { validateCouponForCpf, calculateEligibleCouponDiscount } from '../utils/couponUtils';
import { getStoreConfig } from '../utils/storeConfig';
import ThermalReceipt from './ThermalReceipt';
import CorreiosLabel from './CorreiosLabel';
import { playSaleSuccessSound, playBarcodeBeepSound } from '../lib/audioFeedback';
import { Html5Qrcode } from 'html5-qrcode';
import { getLocalDateKey, safeLocalStorageSet, createUniqueId } from '../utils/dateUtils';
import { showToast } from '../lib/uiDialog';
import { getOptimizedImageUrl, handleImageFallback, getProductMainImage } from '../utils/imageUtils';

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

interface PDVTerminalProps {
  products: Product[];
  clients: Client[];
  sales?: Sale[];
  onAddSale: (sale: Sale) => void;
  onUpdateClients?: (clients: Client[]) => void;
  onAddClient: (client: Client) => void;
  setActiveTab: (tab: ActiveTab) => void;
  sellers?: string[];
  currentUser?: any;
}

export default function PDVTerminal({ 
  products: rawProducts, 
  clients: rawClients, 
  sales: rawSales = [],
  onAddSale, 
  onUpdateClients, 
  onAddClient, 
  setActiveTab, 
  sellers: rawSellers = [], 
  currentUser 
}: PDVTerminalProps) {
  const products = Array.isArray(rawProducts) ? rawProducts : [];
  const clients = Array.isArray(rawClients) ? rawClients : [];
  const sales = Array.isArray(rawSales) ? rawSales : [];
  const sellers = Array.isArray(rawSellers) ? rawSellers : [];

  const [selectedClientName, setSelectedClientName] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<SalesChannel>('Instagram');
  const [cart, setCart] = useState<{ product: Product; quantity: number; selectedSize?: string; selectedColor?: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [npsScore, setNpsScore] = useState<number>(10);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [isThermalReceiptOpen, setIsThermalReceiptOpen] = useState<boolean>(false);
  const [createdReceipt, setCreatedReceipt] = useState<Sale | null>(null);
  
  const [deliveryMethod, setDeliveryMethod] = useState<string>('retirada');
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [isShippingLabelOpen, setIsShippingLabelOpen] = useState<boolean>(false);

  // Camera scanner states
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string>('');
  const [lastScannedCode, setLastScannedCode] = useState<string>('');

  // Cash closure modal states
  const [isCashClosureModalOpen, setIsCashClosureModalOpen] = useState<boolean>(false);
  const [isExportingSheets, setIsExportingSheets] = useState<boolean>(false);

  // Camera Scanner instance handler
  const handleScannedBarcode = (code: string) => {
    if (!code || code === lastScannedCode) return;
    setLastScannedCode(code);
    playBarcodeBeepSound();

    const cleanCode = code.trim().toLowerCase();
    const matched = products.find(p => 
      p.sku.toLowerCase() === cleanCode || 
      p.id.toLowerCase() === cleanCode || 
      (p as any).barcode?.toLowerCase() === cleanCode ||
      p.name.toLowerCase().includes(cleanCode)
    );

    if (matched) {
      addToCart(matched);
      setScanMessage(`✨ Peça "${matched.name}" adicionada ao carrinho!`);
    } else {
      setScanMessage(`⚠️ Nenhum produto encontrado com o código: ${code}`);
    }

    setTimeout(() => {
      setLastScannedCode('');
      setScanMessage('');
    }, 2500);
  };

  useEffect(() => {
    if (!isCameraScannerOpen) return;
    let html5QrcodeScanner: Html5Qrcode | null = null;
    const elementId = 'pdv-camera-reader';

    const timer = setTimeout(() => {
      try {
        html5QrcodeScanner = new Html5Qrcode(elementId);
        html5QrcodeScanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 180 } },
          (decodedText) => {
            handleScannedBarcode(decodedText);
          },
          () => {}
        ).catch(err => {
          console.warn('[Camera Scanner] Error starting camera:', err);
        });
      } catch (e) {
        console.warn('[Camera Scanner] Exception:', e);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      if (html5QrcodeScanner) {
        try {
          html5QrcodeScanner.stop().catch(() => {}).then(() => {
            html5QrcodeScanner?.clear();
          });
        } catch (e) {}
      }
    };
  }, [isCameraScannerOpen]);

  const handleExportCashClosureToSheets = async () => {
    setIsExportingSheets(true);
    try {
      const todayStr = getLocalDateKey();
      const savedSales = localStorage.getItem('ap_moda_sales');
      const allSales: Sale[] = sales.length > 0 ? sales : (savedSales ? JSON.parse(savedSales) : []);
      const todaySales = allSales.filter(s => (s.createdAt || '').startsWith(todayStr));

      let totalGross = 0;
      let totalPix = 0;
      let totalCardCredit = 0;
      let totalCardDebit = 0;
      let totalCash = 0;
      let totalItemsSold = 0;

      todaySales.forEach(s => {
        totalGross += s.total || 0;
        if (s.items) {
          s.items.forEach(it => { totalItemsSold += it.quantity || 1; });
        }
        if (s.payments) {
          s.payments.forEach(p => {
            const amt = Number(p.amount) || 0;
            if (p.method === 'PIX') totalPix += amt;
            else if (p.method === 'Cartão de Crédito') totalCardCredit += amt;
            else if (p.method === 'Cartão de Débito') totalCardDebit += amt;
            else if (p.method === 'Dinheiro') totalCash += amt;
          });
        }
      });

      const headers = ['Data', 'Operador/Vendedor', 'Qtd Vendas', 'Itens Vendidos', 'PIX (R$)', 'Cartão Crédito (R$)', 'Cartão Débito (R$)', 'Dinheiro (R$)', 'Total Faturamento (R$)'];
      const row = [
        new Date().toLocaleDateString('pt-BR'),
        selectedSalesperson || 'Geral',
        todaySales.length,
        totalItemsSold,
        totalPix.toFixed(2),
        totalCardCredit.toFixed(2),
        totalCardDebit.toFixed(2),
        totalCash.toFixed(2),
        totalGross.toFixed(2)
      ];

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), row.join(',')].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `fechamento_caixa_ap_moda_${todayStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      let googleSynced = false;
      try {
        const googleToken = localStorage.getItem('ap_google_access_token');
        if (googleToken) {
          const res = await fetch('/api/google-workspace/sync-cash-closure', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${googleToken}`
            },
            body: JSON.stringify({
              date: todayStr,
              salesperson: selectedSalesperson,
              salesCount: todaySales.length,
              itemsSold: totalItemsSold,
              pix: totalPix,
              cardCredit: totalCardCredit,
              cardDebit: totalCardDebit,
              cash: totalCash,
              totalGross: totalGross
            })
          });
          googleSynced = res.ok;
        }
      } catch (apiErr) {
        // soft catch
      }

      playSaleSuccessSound();
      if (googleSynced) {
        showToast('Fechamento de Caixa exportado (CSV + Google Sheets)!', 'success');
      } else {
        showToast('Relatório CSV de Fechamento baixado! Conecte o Google Workspace para sincronizar planilhas na nuvem.', 'info');
      }
      setIsCashClosureModalOpen(false);
    } catch (err: any) {
      showToast(`Erro ao gerar fechamento de caixa: ${err.message || err}`, 'error');
    } finally {
      setIsExportingSheets(false);
    }
  };

  // PDV Variant Selection Modal states
  const [isVariantModalOpen, setIsVariantModalOpen] = useState<boolean>(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [modalSelectedSize, setModalSelectedSize] = useState<string>('');
  const [modalSelectedColor, setModalSelectedColor] = useState<string>('');
  const [modalQuantity, setModalQuantity] = useState<number>(1);

  const openVariantModal = (product: Product) => {
    setSelectedProductForModal(product);
    
    let firstWithStockSize = '';
    let firstWithStockColor = '';
    
    if (product.sizes && product.sizes.length > 0) {
      for (const sz of product.sizes) {
        const colorsList = product.sizeColors && product.sizeColors[sz]
          ? product.sizeColors[sz]
          : (product.colors && product.colors.length > 0 ? product.colors : ['Única']);
          
        for (const col of colorsList) {
          if (getPDVItemMaxStock(product, sz, col) > 0) {
            firstWithStockSize = sz;
            firstWithStockColor = col;
            break;
          }
        }
        if (firstWithStockSize) break;
      }
    } else {
      const colorsList = product.colors && product.colors.length > 0 ? product.colors : ['Única'];
      for (const col of colorsList) {
        if (getPDVItemMaxStock(product, 'M', col) > 0) {
          firstWithStockSize = 'M';
          firstWithStockColor = col;
          break;
        }
      }
    }
    
    const finalSize = firstWithStockSize || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'M');
    
    let finalColor = firstWithStockColor;
    if (!finalColor) {
      finalColor = product.colors && product.colors.length > 0 ? product.colors[0] : 'Única';
      if (product.sizeColors && product.sizeColors[finalSize] && product.sizeColors[finalSize].length > 0) {
        finalColor = product.sizeColors[finalSize][0];
      }
    }
    
    setModalSelectedSize(finalSize);
    setModalSelectedColor(finalColor);
    setModalQuantity(1);
    setIsVariantModalOpen(true);
  };

  const handleConfirmVariantAddToCart = () => {
    if (!selectedProductForModal) return;
    const maxStock = getPDVItemMaxStock(selectedProductForModal, modalSelectedSize, modalSelectedColor);
    
    if (maxStock <= 0) {
      showToast(`A combinação Tamanho ${modalSelectedSize} e Cor ${modalSelectedColor} está fora de estoque.`, 'warning');
      return;
    }
    if (modalQuantity > maxStock) {
      showToast(`Você selecionou ${modalQuantity} peças, mas só existem ${maxStock} disponíveis.`, 'warning');
      return;
    }
    
    setCart(prev => {
      const idx = prev.findIndex(item => 
        item.product.id === selectedProductForModal.id && 
        item.selectedSize === modalSelectedSize && 
        item.selectedColor === modalSelectedColor
      );

      if (idx > -1) {
        const currentQty = prev[idx].quantity;
        const targetQty = currentQty + modalQuantity;
        if (targetQty > maxStock) {
          showToast(`Limite de estoque excedido: Você já possui ${currentQty} no carrinho e o máximo é ${maxStock}.`, 'warning');
          return prev;
        }
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: targetQty };
        return updated;
      }
      return [...prev, { 
        product: selectedProductForModal, 
        quantity: modalQuantity, 
        selectedSize: modalSelectedSize, 
        selectedColor: modalSelectedColor 
      }];
    });

    setIsVariantModalOpen(false);
    setSelectedProductForModal(null);
  };

  // Find selected client object
  const selectedClientObject = useMemo(() => {
    return clients.find(c => c.name.toLowerCase() === selectedClientName.trim().toLowerCase());
  }, [clients, selectedClientName]);

  // Sync selected client in PDV to localStorage so Checkout/PublicCatalog can auto-import it
  React.useEffect(() => {
    if (selectedClientObject) {
      try {
        safeLocalStorageSet('ap_pdv_selected_client', JSON.stringify(selectedClientObject));
        safeLocalStorageSet('ap_last_client_data', JSON.stringify(selectedClientObject));
        window.dispatchEvent(new Event('ap-pdv-client-updated'));
      } catch (e) {
        console.warn('Error saving PDV selected client to localStorage:', e);
      }
    }
  }, [selectedClientObject]);

  const clientCashbackAvailable = useMemo(() => {
    return selectedClientObject?.cashbackBalance || 0;
  }, [selectedClientObject]);

  // Auto-fill shipping address when selected customer changes
  React.useEffect(() => {
    if (selectedClientObject) {
      const parts = [
        selectedClientObject.addressStreet,
        selectedClientObject.addressNum ? `Nº ${selectedClientObject.addressNum}` : '',
        selectedClientObject.addressComp ? `(${selectedClientObject.addressComp})` : '',
        selectedClientObject.addressBairro,
        selectedClientObject.addressCidade,
        selectedClientObject.addressEstado,
        selectedClientObject.addressCep ? `CEP: ${selectedClientObject.addressCep}` : ''
      ].filter(Boolean);
      
      if (parts.length > 0) {
        setShippingAddress(parts.join(', '));
      } else {
        setShippingAddress('');
      }
    } else {
      setShippingAddress('');
    }
  }, [selectedClientObject]);
  
  // Cashback usage states
  const [useCashback, setUseCashback] = useState<boolean>(false);

  // Reset cashback checkbox when client changes
  React.useEffect(() => {
    setUseCashback(false);
  }, [selectedClientName]);
  
  // Real seller listing
  const salespersonList = useMemo(() => {
    return sellers;
  }, [sellers]);

  const [selectedSalesperson, setSelectedSalesperson] = useState<string>(() => {
    if (currentUser?.role === 'Vendedor' && currentUser?.name) {
      return currentUser.name;
    }
    return sellers.length > 0 ? sellers[0] : 'Sem Vendedor';
  });

  // Keep state updated in case sellers update dynamically
  React.useEffect(() => {
    if (currentUser?.role === 'Vendedor' && currentUser?.name) {
      setSelectedSalesperson(currentUser.name);
      return;
    }
    if (sellers.length > 0) {
      if (!sellers.includes(selectedSalesperson)) {
        setSelectedSalesperson(sellers[0]);
      }
    } else {
      setSelectedSalesperson('Sem Vendedor');
    }
  }, [sellers, selectedSalesperson, currentUser]);

  // Quick Add Client states
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [quickPhone, setQuickPhone] = useState<string>('');
  const [quickEmail, setQuickEmail] = useState<string>('');
  const [quickCpf, setQuickCpf] = useState<string>('');
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState<boolean>(false);

  // Discount states
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    percent: number;
    fixedValue?: number;
    category?: string;
    partnerName?: string;
    partnerId?: string;
  } | null>(null);
  const [pixDiscountPercent, setPixDiscountPercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ap_pdv_pix_discount');
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
      const storePayCfg = localStorage.getItem('ap_moda_payment_config');
      if (storePayCfg) {
        const parsedCfg = JSON.parse(storePayCfg);
        if (parsedCfg && parsedCfg.pixDiscountPercent !== undefined) {
          const val = parseFloat(parsedCfg.pixDiscountPercent);
          if (!isNaN(val) && val >= 0) return val;
        }
      }
    } catch (e) {}
    return 5; // default to 5%
  });

  const handlePixDiscountPercentChange = (newVal: number) => {
    const clean = Number.isFinite(newVal) ? Math.max(0, Math.min(100, newVal)) : 0;
    setPixDiscountPercent(clean);
    safeLocalStorageSet('ap_pdv_pix_discount', clean.toString());
  };

  const cardTerminalsList = useMemo(() => {
    try {
      const saved = localStorage.getItem('ap_moda_card_terminals');
      const list = saved ? JSON.parse(saved) : [];
      return list.filter((t: any) => t.status === 'ativo');
    } catch (e) {
      return [];
    }
  }, []);

  // Combination of payment methods states
  const [payments, setPayments] = useState<{ 
    method: string; 
    amount: number;
    installments?: number;
    cardMachine?: string;
    cardFeePercent?: number;
    cardDiscountPercent?: number;
    netAmount?: number;
    receivedCash?: number;
    changeAmount?: number;
    changeMethod?: 'Espécie' | 'Pix';
    terminalId?: string;
  }[]>([
    { method: 'Link de Pagamento (InfinitePay)', amount: 0 }
  ]);

  const [generatedLinks, setGeneratedLinks] = useState<{[key: number]: string}>({});
  const [isGeneratingLinkMap, setIsGeneratingLinkMap] = useState<{[key: number]: boolean}>({});

  const generateStaticPix = (amount: number) => {
    const storeCfg = getStoreConfig();
    const rawPix = storeCfg.pixKey || storeCfg.cnpj || '67074681000103';
    const cnpjKey = (rawPix.includes('@') || /[a-zA-Z]/.test(rawPix))
      ? rawPix.trim()
      : rawPix.replace(/\D/g, '');
    const amountStr = amount.toFixed(2);
    const cleanMerchant = (storeCfg.name || 'AP MODA FITNESS').toUpperCase();
    const cleanCity = (storeCfg.city || 'SAO JOSE DE MIPIBU').toUpperCase();

    const p00 = '000201';
    const p01 = '010211'; // Static QR Code
    const sub00 = '0014br.gov.bcb.pix';
    const sub01 = `01${cnpjKey.length.toString().padStart(2, '0')}${cnpjKey}`;
    const value26 = `${sub00}${sub01}`;
    const p26 = `26${value26.length.toString().padStart(2, '0')}${value26}`;
    const p52 = '52040000';
    const p53 = '5303986';
    const p54 = `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`;
    const p58 = '5802BR';
    
    // Clean merchant: max 25 chars, uppercase, no accents
    const cleanMerchantPix = cleanMerchant
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .substring(0, 25);
    const p59 = `59${cleanMerchantPix.length.toString().padStart(2, '0')}${cleanMerchantPix}`;

    // Clean city: max 15 chars, uppercase, no accents
    const cleanCityPix = cleanCity
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .substring(0, 15);
    const p60 = `60${cleanCityPix.length.toString().padStart(2, '0')}${cleanCityPix}`;

    const p62 = '62070503***';
    const p63 = '6304';

    const basePayload = `${p00}${p01}${p26}${p52}${p53}${p54}${p58}${p59}${p60}${p62}${p63}`;

    // Calculate CRC16 CCITT
    let crc = 0xFFFF;
    const polynomial = 0x1021;
    for (let i = 0; i < basePayload.length; i++) {
      const code = basePayload.charCodeAt(i);
      crc ^= (code << 8);
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ polynomial) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }
      }
    }
    const crcStr = crc.toString(16).toUpperCase().padStart(4, '0');
    return `${basePayload}${crcStr}`;
  };

  const generateInfinitePayLinkForPos = async (idx: number, amount: number) => {
    if (amount <= 0) {
      showToast('Por favor, informe um valor maior que R$ 0,00 para gerar o link de pagamento.', 'warning');
      return;
    }
    setIsGeneratingLinkMap(prev => ({ ...prev, [idx]: true }));
    try {
      const orderId = createUniqueId('v-pdv');
      
      const targetCents = Math.round(Number(amount) * 100);
      let itensPayload: any[] = [];
      try {
        if (cart && cart.length > 0 && payments.length === 1 && targetCents > 0) {
          const rawItemsCents = cart.reduce((sum, item) => {
            return sum + Math.round(Number(item.product.price) * 100) * Math.max(1, Math.round(Number(item.quantity) || 1));
          }, 0);

          if (rawItemsCents > 0) {
            let accumulatedCents = 0;
            cart.forEach((item, cartIdx) => {
              const isLast = cartIdx === cart.length - 1;
              const qty = Math.max(1, Math.round(Number(item.quantity) || 1));
              const sizeColorInfo = [item.selectedColor, item.selectedSize].filter(Boolean).join(' - ');
              const desc = `${item.product.name}${sizeColorInfo ? ` (${sizeColorInfo})` : ''}`.trim() || 'Produto AP Moda Fitness';
              const lineRawCents = Math.round(Number(item.product.price) * 100) * qty;

              if (!isLast) {
                const proportionalLineCents = Math.round((lineRawCents / rawItemsCents) * targetCents);
                const unitCents = Math.max(0, Math.floor(proportionalLineCents / qty));
                const rem = proportionalLineCents - unitCents * qty;
                if (rem === 0 && unitCents > 0) {
                  itensPayload.push({ quantity: qty, price: unitCents, description: desc });
                  accumulatedCents += proportionalLineCents;
                } else if (qty > 1 && unitCents > 0) {
                  itensPayload.push({ quantity: qty - 1, price: unitCents, description: desc });
                  itensPayload.push({ quantity: 1, price: unitCents + rem, description: desc });
                  accumulatedCents += proportionalLineCents;
                } else if (proportionalLineCents > 0) {
                  itensPayload.push({ quantity: 1, price: proportionalLineCents, description: qty > 1 ? `${qty}x ${desc}` : desc });
                  accumulatedCents += proportionalLineCents;
                }
              } else {
                const remainingCents = Math.max(0, targetCents - accumulatedCents);
                if (remainingCents > 0) {
                  if (qty === 1 || remainingCents % qty === 0) {
                    itensPayload.push({ quantity: qty, price: Math.round(remainingCents / qty), description: desc });
                  } else {
                    const baseUnit = Math.floor(remainingCents / qty);
                    const extraUnit = remainingCents - baseUnit * (qty - 1);
                    if (baseUnit > 0) {
                      itensPayload.push({ quantity: qty - 1, price: baseUnit, description: desc });
                      itensPayload.push({ quantity: 1, price: extraUnit, description: desc });
                    } else {
                      itensPayload.push({ quantity: 1, price: remainingCents, description: `${qty}x ${desc}` });
                    }
                  }
                }
              }
            });
          }
        }
      } catch (mapErr) {
        console.warn('[InfinitePay POS] Erro ao varrer os itens do carrinho para o link:', mapErr);
      }

      // Fallback exato (inclusive para pagamentos divididos ou carrinho com 100% desconto parcial)
      if (!itensPayload || itensPayload.length === 0) {
        const itemsSummary = cart.length > 0
          ? `Venda PDV (${cart.map(i => `${i.quantity}x ${i.product.name}`).join(', ').slice(0, 80)})`
          : 'Venda PDV - AP Moda Fitness';
        itensPayload = [
          {
            quantity: 1,
            price: Math.max(100, targetCents),
            description: itemsSummary
          }
        ];
      }

      // Pre-fill customer/buyer and address data if a customer is selected in PDV to prevent double data entry
      let customerPayload: any = null;
      let shippingAddressPayload: any = null;
      let shippingPayload: any = null;
      let metadataPayload: any = null;

      if (selectedClientObject) {
        let cleanPhone = (selectedClientObject.phone || '').replace(/\D/g, '');
        if (cleanPhone.length === 10 || cleanPhone.length === 11) {
          // Automatically prefix with Brazil country code 55 (critical for checkout auto-fill validation on payment gateways)
          cleanPhone = '55' + cleanPhone;
        }
        const cleanCpf = (selectedClientObject.cpf || '').replace(/\D/g, '');
        const cleanCep = (selectedClientObject.addressCep || '').replace(/\D/g, '');

        const nameParts = (selectedClientObject.name || '').trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || firstName;

        const buyerData = {
          first_name: firstName,
          last_name: lastName,
          name: selectedClientObject.name,
          email: selectedClientObject.email ? selectedClientObject.email.trim() : `${firstName.toLowerCase()}@exemplo.com`,
          phone: cleanPhone || selectedClientObject.phone,
          phone_code: '55',
          phone_number: cleanPhone || selectedClientObject.phone,
          whatsapp: cleanPhone || selectedClientObject.phone,
          mobile: cleanPhone || selectedClientObject.phone,
          document: cleanCpf || selectedClientObject.cpf,
          cpf: cleanCpf || selectedClientObject.cpf,
          cnpj: cleanCpf || selectedClientObject.cpf,
          tax_id: cleanCpf || selectedClientObject.cpf
        };

        const addressData = {
          street: selectedClientObject.addressStreet || '',
          number: selectedClientObject.addressNum || '',
          complement: selectedClientObject.addressComp || '',
          neighborhood: selectedClientObject.addressBairro || '',
          bairro: selectedClientObject.addressBairro || '',
          city: selectedClientObject.addressCidade || '',
          state: selectedClientObject.addressEstado || '',
          zip: cleanCep || selectedClientObject.addressCep || '',
          cep: cleanCep || selectedClientObject.addressCep || '',
          zip_code: cleanCep || selectedClientObject.addressCep || '',
          postal_code: cleanCep || selectedClientObject.addressCep || '',
          country: 'BR'
        };

        customerPayload = {
          ...buyerData,
          address: addressData,
          billing_address: addressData,
          shipping_address: addressData
        };

        shippingAddressPayload = addressData;

        shippingPayload = {
          name: selectedClientObject.name,
          phone: cleanPhone || selectedClientObject.phone,
          phone_number: cleanPhone || selectedClientObject.phone,
          whatsapp: cleanPhone || selectedClientObject.phone,
          mobile: cleanPhone || selectedClientObject.phone,
          address: addressData,
          shipping_address: addressData,
          billing_address: addressData
        };

        metadataPayload = {
          customer_name: selectedClientObject.name,
          customer_email: selectedClientObject.email || `${firstName.toLowerCase()}@exemplo.com`,
          customer_phone: cleanPhone || selectedClientObject.phone,
          customer_cpf: cleanCpf || selectedClientObject.cpf,
          shipping_street: selectedClientObject.addressStreet || '',
          shipping_number: selectedClientObject.addressNum || '',
          shipping_complement: selectedClientObject.addressComp || '',
          shipping_neighborhood: selectedClientObject.addressBairro || '',
          shipping_city: selectedClientObject.addressCidade || '',
          shipping_state: selectedClientObject.addressEstado || '',
          shipping_zip: cleanCep || selectedClientObject.addressCep || '',
          shipping_cep: cleanCep || selectedClientObject.addressCep || '',
          shipping_zip_code: cleanCep || selectedClientObject.addressCep || ''
        };
      }

      const activeHandle = localStorage.getItem('infinitepay_handle') || "ap-moda-fitness";
      let data: any = null;
      try {
        console.log('[InfinitePay PDV] Enviando requisição POST direta para https://api.checkout.infinitepay.io/links com handle:', activeHandle);
        const directResponse = await fetch('https://api.checkout.infinitepay.io/links', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            handle: activeHandle,
            order_nsu: orderId,
            redirect_url: window.location.origin,
            items: itensPayload,
            itens: itensPayload,
            buyer: customerPayload || undefined,
            customer: customerPayload || undefined,
            shipping: shippingPayload || undefined,
            shipping_address: shippingAddressPayload || undefined,
            billing_address: shippingAddressPayload || undefined,
            address: shippingAddressPayload || undefined,
            metadata: metadataPayload || undefined
          })
        });

        if (directResponse.ok) {
          data = await directResponse.json();
          console.log('[InfinitePay PDV] Link criado diretamente:', data);
        } else {
          const errText = await directResponse.text();
          console.warn('[InfinitePay PDV] Falha na requisição direta, tentando via servidor proxy:', errText);
        }
      } catch (directErr) {
        console.warn('[InfinitePay PDV] Exceção na requisição direta, tentando via servidor proxy:', directErr);
      }

      if (!data || !data.url) {
        const response = await fetch('/api/infinitepay/create-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            handle: activeHandle,
            order_nsu: orderId,
            redirect_url: window.location.origin,
            itens: itensPayload,
            isCents: true,
            buyer: customerPayload || undefined,
            customer: customerPayload || undefined,
            shipping: shippingPayload || undefined,
            shipping_address: shippingAddressPayload || undefined,
            billing_address: shippingAddressPayload || undefined,
            address: shippingAddressPayload || undefined,
            metadata: metadataPayload || undefined
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || 'Erro ao gerar o link de pagamento na InfinitePay.');
        }

        data = await response.json();
      }
      if (data && data.url) {
        setGeneratedLinks(prev => ({ ...prev, [idx]: data.url }));
      } else {
        throw new Error('A API não retornou uma URL de pagamento.');
      }
    } catch (err: any) {
      console.error('[InfinitePay POS Error]:', err);
      showToast(`Erro ao gerar link de pagamento: ${err.message || err}`, 'error');
    } finally {
      setIsGeneratingLinkMap(prev => ({ ...prev, [idx]: false }));
    }
  };

  // Synchronize payment total automatically if only 1 method is present
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const cartCostTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.cost * item.quantity, 0);
  }, [cart]);

  const getPartners = (): any[] => {
    try {
      const saved = localStorage.getItem('ap_moda_partners');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch(e) {}
    return [];
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    const codeUpper = couponCode.trim().toUpperCase();

    if (appliedCoupon && appliedCoupon.code.toUpperCase() === codeUpper) {
      showToast(`O cupom ${codeUpper} já está aplicado nesta venda.`, 'info');
      return;
    }

    const previousCoupon = appliedCoupon?.code;
    const validation = validateCouponForCpf(
      codeUpper,
      selectedClientObject?.cpf,
      undefined,
      undefined,
      cart
    );

    if (!validation.valid || !validation.couponObj) {
      showToast(validation.message || 'Cupom não encontrado, expirado ou inválido.', 'warning');
      return;
    }

    const coupon = validation.couponObj;
    if (coupon.minPurchase && cartTotal < coupon.minPurchase) {
      showToast(`O cupom ${coupon.code} exige compra mínima de ${formatCurrency(coupon.minPurchase)}.`, 'warning');
      return;
    }

    const percent = coupon.type === 'percent' ? Number(coupon.value || 0) : 0;
    const fixedValue = coupon.type === 'fixed' ? Number(coupon.value || 0) : 0;

    setAppliedCoupon({
      code: coupon.code.toUpperCase(),
      percent,
      fixedValue,
      category: coupon.category,
      partnerName: coupon.partnerName,
      partnerId: coupon.partnerId
    });

    const replaceNotice = previousCoupon && previousCoupon !== coupon.code.toUpperCase()
      ? ` (substituiu ${previousCoupon})`
      : '';
    const discLabel = percent > 0 ? `${percent}%` : formatCurrency(fixedValue);
    const partnerNotice = coupon.partnerName ? ` de ${coupon.partnerName}` : '';
    showToast(`Cupom ${coupon.code}${partnerNotice} aplicado! Desconto de ${discLabel}.${replaceNotice}`, 'success');
  };

  const hasPixDiscount = useMemo(() => {
    return payments.some(p => p.method === 'PIX');
  }, [payments]);

  const paymentsTotalSum = useMemo(() => {
    return payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [payments]);

  const pdvDiscountBreakdown = useMemo(() => {
    const cartTotalCents = Math.round(cartTotal * 100);

    // 1. Commercial discounts in exact cents: manual % + manual fixed + coupon
    let commercialCents = 0;
    if (discountPercent > 0) {
      commercialCents += Math.round((cartTotalCents * discountPercent) / 100);
    }
    if (discountValue > 0) {
      commercialCents += Math.round(Number(discountValue) * 100);
    }
    let couponDiscountCents = 0;
    if (appliedCoupon) {
      const couponCalc = calculateEligibleCouponDiscount(
        {
          code: appliedCoupon.code,
          discountPercent: appliedCoupon.percent,
          fixedDiscount: appliedCoupon.fixedValue,
          category: appliedCoupon.category
        },
        cart
      );
      couponDiscountCents = Math.round(couponCalc.discountAmount * 100);
      commercialCents += couponDiscountCents;
    }
    commercialCents = Math.min(cartTotalCents, Math.max(0, commercialCents));
    const afterCommercialCents = Math.max(0, cartTotalCents - commercialCents);

    // 2. Payment-method discounts (PIX and Card) calculated stably in cents without circular loops
    let pixDiscountCents = 0;
    let cardDiscountCents = 0;

    if (payments.length === 1) {
      const onlyPayment = payments[0];
      if (onlyPayment.method === 'PIX' && pixDiscountPercent > 0 && afterCommercialCents > 0) {
        pixDiscountCents = Math.round((afterCommercialCents * pixDiscountPercent) / 100);
      } else if (
        (onlyPayment.method === 'Cartão de Crédito' || onlyPayment.method === 'Cartão de Débito') &&
        onlyPayment.cardDiscountPercent &&
        onlyPayment.cardDiscountPercent > 0 &&
        afterCommercialCents > 0
      ) {
        cardDiscountCents = Math.round((afterCommercialCents * onlyPayment.cardDiscountPercent) / 100);
      }
    } else if (payments.length > 1 && afterCommercialCents > 0) {
      // Solve analytically from each row's gross equivalent: gross = net / (1 - rate)
      let remainingGrossCents = afterCommercialCents;
      payments.forEach(p => {
        const netCents = Math.max(0, Math.round(Number(p.amount || 0) * 100));
        if (netCents <= 0 || remainingGrossCents <= 0) return;

        let rate = 0;
        let isPix = false;
        let isCard = false;
        if (p.method === 'PIX' && pixDiscountPercent > 0) {
          rate = Math.min(0.99, pixDiscountPercent / 100);
          isPix = true;
        } else if (
          (p.method === 'Cartão de Crédito' || p.method === 'Cartão de Débito') &&
          p.cardDiscountPercent &&
          p.cardDiscountPercent > 0
        ) {
          rate = Math.min(0.99, p.cardDiscountPercent / 100);
          isCard = true;
        }

        const rowGrossCents = rate > 0
          ? Math.min(remainingGrossCents, Math.round(netCents / (1 - rate)))
          : Math.min(remainingGrossCents, netCents);
        const rowDiscCents = rate > 0 ? Math.round(rowGrossCents * rate) : 0;

        if (isPix) pixDiscountCents += rowDiscCents;
        else if (isCard) cardDiscountCents += rowDiscCents;

        remainingGrossCents = Math.max(0, remainingGrossCents - rowGrossCents);
      });
    }

    if (pixDiscountCents + cardDiscountCents > afterCommercialCents) {
      const scale = afterCommercialCents / (pixDiscountCents + cardDiscountCents || 1);
      pixDiscountCents = Math.round(pixDiscountCents * scale);
      cardDiscountCents = Math.max(0, afterCommercialCents - pixDiscountCents);
    }

    // 3. Cashback applied over remaining balance
    const afterMethodCents = Math.max(0, afterCommercialCents - pixDiscountCents - cardDiscountCents);
    const cashbackAvailCents = Math.max(0, Math.round(clientCashbackAvailable * 100));
    const cashbackUsedCents = (useCashback && cashbackAvailCents > 0)
      ? Math.min(cashbackAvailCents, afterMethodCents)
      : 0;

    const totalDiscountsCents = Math.min(
      cartTotalCents,
      commercialCents + pixDiscountCents + cardDiscountCents + cashbackUsedCents
    );

    return {
      commercialDiscounts: Number((commercialCents / 100).toFixed(2)),
      couponDiscountVal: Number((couponDiscountCents / 100).toFixed(2)),
      pixDiscountVal: Number((pixDiscountCents / 100).toFixed(2)),
      cardDiscountsVal: Number((cardDiscountCents / 100).toFixed(2)),
      cashbackUsed: Number((cashbackUsedCents / 100).toFixed(2)),
      totalDiscountsVal: Number((totalDiscountsCents / 100).toFixed(2))
    };
  }, [cart, cartTotal, discountPercent, discountValue, appliedCoupon, pixDiscountPercent, useCashback, clientCashbackAvailable, payments]);

  const totalDiscounts = pdvDiscountBreakdown.totalDiscountsVal;

  const finalCartTotal = useMemo(() => {
    const cents = Math.max(0, Math.round(cartTotal * 100) - Math.round(totalDiscounts * 100));
    return Number((cents / 100).toFixed(2));
  }, [cartTotal, totalDiscounts]);

  React.useEffect(() => {
    setPayments(prev => {
      if (prev.length !== 1) return prev;
      const nextAmt = Number(finalCartTotal.toFixed(2));
      const row = prev[0];
      const isCard = row.method === 'Cartão de Crédito' || row.method === 'Cartão de Débito';
      const expectedNet = isCard && row.cardFeePercent !== undefined
        ? Number((nextAmt - (nextAmt * row.cardFeePercent / 100)).toFixed(2))
        : row.netAmount;

      if (Math.abs((row.amount || 0) - nextAmt) < 0.005 && (!isCard || expectedNet === row.netAmount)) {
        return prev;
      }

      const nextRow = { ...row, amount: nextAmt };
      if (isCard && nextRow.cardFeePercent !== undefined) {
        // nextAmt já está com o desconto comercial/maquininha aplicado; aplica apenas a taxa da maquininha
        nextRow.netAmount = Number((nextAmt - (nextAmt * nextRow.cardFeePercent / 100)).toFixed(2));
      } else if (nextRow.method === 'Dinheiro') {
        const recv = nextRow.receivedCash !== undefined && nextRow.receivedCash > nextAmt ? nextRow.receivedCash : nextAmt;
        nextRow.receivedCash = recv;
        nextRow.changeAmount = Math.max(0, Number((recv - nextAmt).toFixed(2)));
      }
      return [nextRow];
    });
  }, [finalCartTotal, payments.length]);

  const isPaymentValid = useMemo(() => {
    return Math.abs(paymentsTotalSum - finalCartTotal) < 0.02;
  }, [paymentsTotalSum, finalCartTotal]);

  const addPaymentRow = () => {
    const left = Math.max(0, finalCartTotal - paymentsTotalSum);
    const availableMethods = ['Link de Pagamento (InfinitePay)', 'PIX', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Boleto Bancário', 'Crediário'];
    const usedMethods = payments.map(p => p.method);
    const nextMethod = availableMethods.find(m => !usedMethods.includes(m)) || 'Dinheiro';
    setPayments(prev => [...prev, { method: nextMethod, amount: Number(left.toFixed(2)) }]);
  };

  const removePaymentRow = (index: number) => {
    if (payments.length <= 1) return;
    const removedAmount = payments[index].amount;
    const filtered = payments.filter((_, idx) => idx !== index);
    if (filtered.length > 0) {
      filtered[0].amount = Number((filtered[0].amount + removedAmount).toFixed(2));
    }
    setPayments(filtered);
  };

  const updatePaymentRow = (
    index: number, 
    fields: Partial<{ 
      method: string; 
      amount: number; 
      installments: number; 
      cardMachine: string; 
      cardFeePercent: number; 
      cardDiscountPercent: number;
      netAmount: number; 
      receivedCash: number;
      changeAmount: number;
      changeMethod: 'Espécie' | 'Pix';
      terminalId: string;
    }>
  ) => {
    setPayments(prev => prev.map((p, idx) => {
      if (idx === index) {
        const updated = { ...p, ...fields };
        
        // Se mudou o método de pagamento
        if (fields.method !== undefined) {
          if (fields.method === 'Cartão de Crédito' || fields.method === 'Cartão de Débito') {
            const mConfigs = getCardMachinesConfig();
            const defaultMach = mConfigs[0] || { id: 'infinitepay', debitFee: 1.38, debitDiscount: 0, creditDiscount: 0, creditInstallments: { 3: 4.98 } };
            updated.cardMachine = defaultMach.id;
            updated.installments = fields.method === 'Cartão de Crédito' ? 3 : 1;
            
            if (cardTerminalsList.length > 0) {
              updated.terminalId = cardTerminalsList[0].id;
            }

            const isCredit = fields.method === 'Cartão de Crédito';
            const feePercent = isCredit
              ? (defaultMach.creditInstallments[updated.installments] || 0)
              : defaultMach.debitFee;

            const discPercent = isCredit
              ? (defaultMach.creditDiscount || 0)
              : (defaultMach.debitDiscount || 0);
            
            updated.cardFeePercent = feePercent;
            updated.cardDiscountPercent = discPercent;

            // updated.amount já reflete o valor cobrado na maquininha; desconta apenas a taxa
            updated.netAmount = Number((updated.amount - (updated.amount * feePercent / 100)).toFixed(2));
            
            // Clean up Cash fields if changing from cash to card
            delete updated.receivedCash;
            delete updated.changeAmount;
            delete updated.changeMethod;
          } else {
            // Remove os dados do cartão se mudou para PIX, Dinheiro, etc.
            delete updated.cardMachine;
            delete updated.installments;
            delete updated.cardFeePercent;
            delete updated.cardDiscountPercent;
            delete updated.netAmount;
            delete updated.terminalId;
            
            if (fields.method === 'Dinheiro') {
              updated.receivedCash = updated.amount;
              updated.changeAmount = 0;
              updated.changeMethod = 'Espécie';
            } else {
              delete updated.receivedCash;
              delete updated.changeAmount;
              delete updated.changeMethod;
            }
          }
        } else {
          // Se mudou algum parâmetro do cartão
          const isCard = updated.method === 'Cartão de Crédito' || updated.method === 'Cartão de Débito';
          if (isCard) {
            const isCredit = updated.method === 'Cartão de Crédito';
            const mConfigs = getCardMachinesConfig();
            const activeMach = mConfigs.find(m => m.id === updated.cardMachine) || mConfigs[0];
            
            let rate = updated.cardFeePercent;
            let discountRate = updated.cardDiscountPercent !== undefined ? updated.cardDiscountPercent : (isCredit ? (activeMach.creditDiscount || 0) : (activeMach.debitDiscount || 0));

            if (fields.cardMachine !== undefined) {
              // Mudou de maquininha: recarrega taxas e desconto padrão
              discountRate = isCredit ? (activeMach.creditDiscount || 0) : (activeMach.debitDiscount || 0);
              rate = isCredit 
                ? (activeMach.creditInstallments[updated.installments || 3] || 0)
                : activeMach.debitFee;
              
              updated.cardFeePercent = rate;
              updated.cardDiscountPercent = discountRate;
            } else if (fields.installments !== undefined) {
              rate = activeMach.creditInstallments[updated.installments || 3] || 0;
              updated.cardFeePercent = rate;
            } else if (fields.cardFeePercent !== undefined) {
              rate = fields.cardFeePercent;
            } else if (fields.cardDiscountPercent !== undefined) {
              discountRate = fields.cardDiscountPercent;
            }
            
            const activeRate = rate !== undefined ? rate : 0;

            // updated.amount já representa o valor final cobrado no cartão (sem dupla dedução de cardDiscountPercent)
            updated.netAmount = Number((updated.amount - (updated.amount * activeRate / 100)).toFixed(2));
          } else if (updated.method === 'Dinheiro') {
            const recv = updated.receivedCash !== undefined ? updated.receivedCash : updated.amount;
            updated.receivedCash = recv;
            updated.changeAmount = Math.max(0, Number((recv - updated.amount).toFixed(2)));
            if (!updated.changeMethod) {
              updated.changeMethod = 'Espécie';
            }
          }
        }
        return updated;
      }
      return p;
    }));
  };

  const autoBalancePayments = () => {
    if (payments.length === 0) return;
    const afterCommercialAndCashback = Math.max(0, cartTotal - pdvDiscountBreakdown.commercialDiscounts - pdvDiscountBreakdown.cashbackUsed);
    const otherRows = payments.slice(0, -1);
    let otherGrossSum = 0;
    otherRows.forEach(r => {
      let rate = 0;
      if (r.method === 'PIX' && pixDiscountPercent > 0) rate = Math.min(0.99, pixDiscountPercent / 100);
      else if ((r.method === 'Cartão de Crédito' || r.method === 'Cartão de Débito') && r.cardDiscountPercent && r.cardDiscountPercent > 0) {
        rate = Math.min(0.99, r.cardDiscountPercent / 100);
      }
      otherGrossSum += rate > 0 ? (Number(r.amount || 0) / (1 - rate)) : Number(r.amount || 0);
    });

    const lastRow = payments[payments.length - 1];
    let lastRate = 0;
    if (lastRow.method === 'PIX' && pixDiscountPercent > 0) lastRate = Math.min(0.99, pixDiscountPercent / 100);
    else if ((lastRow.method === 'Cartão de Crédito' || lastRow.method === 'Cartão de Débito') && lastRow.cardDiscountPercent && lastRow.cardDiscountPercent > 0) {
      lastRate = Math.min(0.99, lastRow.cardDiscountPercent / 100);
    }

    const remainingGross = Math.max(0, afterCommercialAndCashback - otherGrossSum);
    const target = Number((remainingGross * (1 - lastRate)).toFixed(2));

    setPayments(prev => {
      const updated = prev.map((row, idx) => {
        if (idx !== prev.length - 1) return row;
        const nextRow = { ...row, amount: target };
        if ((nextRow.method === 'Cartão de Crédito' || nextRow.method === 'Cartão de Débito') && nextRow.cardFeePercent !== undefined) {
          nextRow.netAmount = Number((nextRow.amount - (nextRow.amount * nextRow.cardFeePercent / 100)).toFixed(2));
        } else if (nextRow.method === 'Dinheiro') {
          const recv = nextRow.receivedCash !== undefined && nextRow.receivedCash > target ? nextRow.receivedCash : target;
          nextRow.receivedCash = recv;
          nextRow.changeAmount = Math.max(0, Number((recv - target).toFixed(2)));
        }
        return nextRow;
      });
      return updated;
    });
  };

  const selectedClientHistory = useMemo(() => {
    if (!selectedClientName.trim()) return [];
    try {
      const saved = localStorage.getItem('ap_moda_sales');
      const allSales: Sale[] = sales.length > 0 ? sales : (saved ? JSON.parse(saved) : []);
      return allSales.filter(s => s.clientName.toLowerCase() === selectedClientName.trim().toLowerCase());
    } catch (e) {
      return [];
    }
  }, [selectedClientName, sales, cart, createdReceipt]);

  const handleQuickAddClient = () => {
    if (!selectedClientName.trim()) {
      showToast("Por favor, digite o nome completo da cliente antes de salvar.", "warning");
      return;
    }

    if (quickCpf.trim() && !validateCPF(quickCpf)) {
      showToast("O CPF informado é inválido. Digite um CPF válido ou deixe o campo em branco.", "warning");
      return;
    }

    const cleanQuickCpf = quickCpf.trim().replace(/\D/g, '');
    const cleanQuickPhone = quickPhone.trim().replace(/\D/g, '');
    const cleanQuickEmail = quickEmail.trim().toLowerCase();
    const exists = clients.find(c => 
      (cleanQuickCpf.length === 11 && c.cpf && c.cpf.replace(/\D/g, '') === cleanQuickCpf) ||
      (cleanQuickPhone.length >= 8 && (c.phone || c.whatsapp || '').replace(/\D/g, '') === cleanQuickPhone) ||
      (cleanQuickEmail.length > 0 && (c.email || '').trim().toLowerCase() === cleanQuickEmail)
    );
    if (exists) {
      showToast(`Cliente já cadastrado no sistema (${exists.name}). Selecionado automaticamente!`, 'info');
      setSelectedClientName(exists.name);
      setIsQuickAddOpen(false);
      return;
    }
    const newClient: Client = {
      id: createUniqueId('cli'),
      name: selectedClientName.trim(),
      email: quickEmail.trim() || '',
      phone: quickPhone.trim() || '',
      cpf: quickCpf.trim() || undefined,
      channel: selectedChannel,
      npsScore: npsScore,
      totalSpent: 0,
      ordersCount: 0,
      createdAt: new Date().toISOString()
    };
    onAddClient(newClient);
    try {
      safeLocalStorageSet('ap_pdv_selected_client', JSON.stringify(newClient));
      safeLocalStorageSet('ap_last_client_data', JSON.stringify(newClient));
      window.dispatchEvent(new Event('ap-pdv-client-updated'));
    } catch (e) {}
    setIsQuickAddOpen(false);
    setQuickPhone('');
    setQuickEmail('');
    setQuickCpf('');
    showToast(`Cliente "${selectedClientName.trim()}" cadastrada no sistema!`, 'success');
  };

  const categories = useMemo(() => {
    const list = new Set(products.map(p => p.category).filter(Boolean));
    return ['Todos', ...Array.from(list)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const getPDVItemMaxStock = (product: Product, size: string, color: string) => {
    if (product.sizeColorStocks && product.sizeColorStocks[size] && product.sizeColorStocks[size][color] !== undefined) {
      return product.sizeColorStocks[size][color];
    }
    if (product.colorStocks && product.colorStocks[color] !== undefined) {
      return product.colorStocks[color];
    }
    return product.stock;
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      showToast(`O produto "${product.name}" está esgotado! Recarregue o estoque em "Produtos & Estoque".`, 'warning');
      return;
    }

    const defaultSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'M';
    let defaultColor = product.colors && product.colors.length > 0 ? product.colors[0] : 'Única';
    if (product.sizeColors && product.sizeColors[defaultSize] && product.sizeColors[defaultSize].length > 0) {
      defaultColor = product.sizeColors[defaultSize][0];
    }

    const maxStock = getPDVItemMaxStock(product, defaultSize, defaultColor);
    if (maxStock <= 0) {
      showToast(`A combinação Tamanho ${defaultSize} e Cor ${defaultColor} deste produto está fora de estoque.`, 'warning');
      return;
    }

    setCart(prev => {
      const idx = prev.findIndex(item => 
        item.product.id === product.id && 
        item.selectedSize === defaultSize && 
        item.selectedColor === defaultColor
      );

      if (idx > -1) {
        const currentQty = prev[idx].quantity;
        if (currentQty >= maxStock) {
          showToast(`Limite de estoque disponível (${maxStock} peças) atingido para ${defaultSize}/${defaultColor}.`, 'warning');
          return prev;
        }
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: currentQty + 1 };
        return updated;
      }
      return [...prev, { product, quantity: 1, selectedSize: defaultSize, selectedColor: defaultColor }];
    });
  };

  const updateQuantity = (idx: number, amount: number) => {
    setCart(prev => {
      if (idx === -1 || idx >= prev.length) return prev;

      const item = prev[idx];
      const currentQty = item.quantity;
      const targetQty = currentQty + amount;

      if (targetQty <= 0) {
        return prev.filter((_, i) => i !== idx);
      }

      const maxStock = getPDVItemMaxStock(item.product, item.selectedSize || 'M', item.selectedColor || 'Única');
      if (targetQty > maxStock) {
        showToast(`Limite de estoque atingido para ${item.selectedSize}/${item.selectedColor}: ${maxStock}`, 'warning');
        return prev;
      }

      const updated = [...prev];
      updated[idx] = { ...updated[idx], quantity: targetQty };
      return updated;
    });
  };

  const removeFromCart = (idx: number) => {
    setCart(prev => prev.filter((_, i) => i !== idx));
  };

  const updateCartItemVariant = (index: number, sz: string, col: string | null) => {
    setCart(prev => {
      const updated = [...prev];
      if (!updated[index]) return prev;
      
      const item = updated[index];
      let targetColor = col;
      if (!targetColor) {
        if (item.product.sizeColors && item.product.sizeColors[sz] && item.product.sizeColors[sz].length > 0) {
          targetColor = item.product.sizeColors[sz][0];
        } else {
          targetColor = item.selectedColor || (item.product.colors && item.product.colors[0]) || '';
        }
      }
      
      const maxStock = getPDVItemMaxStock(item.product, sz, targetColor);
      if (item.quantity > maxStock) {
        showToast(`Estoque disponível para ${sz}/${targetColor}: ${maxStock} un. Ajustando quantidade...`, 'warning');
        updated[index] = {
          ...item,
          selectedSize: sz,
          selectedColor: targetColor,
          quantity: Math.max(1, maxStock)
        };
      } else {
        updated[index] = {
          ...item,
          selectedSize: sz,
          selectedColor: targetColor
        };
      }
      return updated;
    });
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('Seu carrinho de compras está vazio! Adicione peças antes de finalizar.', 'warning');
      return;
    }

    if (!isPaymentValid) {
      showToast(`A soma das formas de pagamento (${formatCurrency(paymentsTotalSum)}) deve ser igual ao total da venda (${formatCurrency(finalCartTotal)}).`, 'warning');
      return;
    }

    // Prepare Sale items
    const saleItems: SaleItem[] = cart.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
      cost: item.product.cost,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize
    }));

    // Find custom or existing client safely (CPF, Phone, or unique non-anonymous name — never create CRM entry for anonymous "Cliente Avulso")
    let finalClientName = selectedClientName.trim() || 'Cliente Avulso';
    const isAnonymousWalkIn = finalClientName.toLowerCase() === 'cliente avulso';
    const cleanedInputDigits = finalClientName.replace(/\D/g, '');
    const clientExists = isAnonymousWalkIn ? undefined : clients.find(c =>
      (cleanedInputDigits.length === 11 && c.cpf && c.cpf.replace(/\D/g, '') === cleanedInputDigits) ||
      (cleanedInputDigits.length >= 8 && (c.phone || c.whatsapp || '').replace(/\D/g, '') === cleanedInputDigits) ||
      c.name.toLowerCase() === finalClientName.toLowerCase()
    );

    const cashbackRate = (() => {
      try {
        const saved = localStorage.getItem('ap_moda_cashback_rate');
        const parsed = saved ? parseFloat(saved) : 5;
        return Number.isFinite(parsed) ? parsed : 5;
      } catch (e) {
        return 5;
      }
    })();

    let linkedClientId: string | undefined;
    let linkedClientDoc: string | undefined;

    if (clientExists) {
      finalClientName = clientExists.name;
      linkedClientId = clientExists.id;
      linkedClientDoc = clientExists.cpf || undefined;
      // deduct used cashback and add earned cashback WITHOUT mutating totalSpent/ordersCount (handled in App.handleAddSale)
      let currentCashback = clientExists.cashbackBalance || 0;
      if (useCashback && currentCashback > 0) {
        const cashbackDeducted = Math.min(currentCashback, pdvDiscountBreakdown.cashbackUsed);
        currentCashback = Math.max(0, currentCashback - cashbackDeducted);
      }
      const cashbackEarned = finalCartTotal * (cashbackRate / 100);
      const nextCashbackBalance = Number((currentCashback + cashbackEarned).toFixed(2));

      if (onUpdateClients) {
        onUpdateClients(
          clients.map(c =>
            c.id === clientExists.id ? { ...c, cashbackBalance: nextCashbackBalance } : c
          )
        );
      }
    } else if (!isAnonymousWalkIn) {
      const isCpfText = /^\d[\d.\-/]+$/.test(finalClientName);
      const cashbackEarned = finalCartTotal * (cashbackRate / 100);
      const newClientId = createUniqueId('cli');
      const resolvedCpf = isCpfText ? finalClientName : (quickCpf.trim() || undefined);
      const newClient: Client = {
        id: newClientId,
        name: isCpfText ? `Cliente CPF ${finalClientName}` : finalClientName,
        email: quickEmail.trim() || '',
        phone: quickPhone.trim() || '',
        cpf: resolvedCpf,
        channel: selectedChannel,
        npsScore: npsScore,
        totalSpent: 0,
        ordersCount: 0,
        cashbackBalance: Number(cashbackEarned.toFixed(2)),
        createdAt: new Date().toISOString()
      };
      onAddClient(newClient);
      finalClientName = newClient.name;
      linkedClientId = newClientId;
      linkedClientDoc = resolvedCpf;
    }

    const isCorreios = deliveryMethod === 'correios_pac' || deliveryMethod === 'correios_sedex';
    const generatedTracking = isCorreios ? (() => {
      const prefixes = ['QC', 'BR', 'PM', 'AL', 'JN', 'OB', 'XY'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const middleNum = Math.floor(100000000 + Math.random() * 900000000).toString();
      return `${prefix}${middleNum}BR`;
    })() : undefined;

    // Get selected card terminal ID
    const cardPaymentWithTerminal = payments.find(p => (p.method === 'Cartão de Crédito' || p.method === 'Cartão de Débito') && p.terminalId);
    const terminalIdForSale = cardPaymentWithTerminal ? cardPaymentWithTerminal.terminalId : undefined;

    const activeCouponCode = appliedCoupon?.code || undefined;
    let partnerForSale: any = undefined;
    if (activeCouponCode) {
      const allPartners = getPartners();
      partnerForSale = allPartners.find(p =>
        (appliedCoupon?.partnerId && p.id === appliedCoupon.partnerId) ||
        (p.couponCode && p.couponCode.toUpperCase() === activeCouponCode)
      );
    }
    const partnerNameForSale = appliedCoupon?.partnerName || partnerForSale?.name || undefined;
    const partnerIdForSale = appliedCoupon?.partnerId || partnerForSale?.id || undefined;
    const partnerCommRate = partnerForSale?.commissionRate || 10;

    const newSale: Sale = {
      id: createUniqueId('v-pdv'),
      clientId: linkedClientId,
      clientName: finalClientName,
      clientDoc: linkedClientDoc,
      channel: selectedChannel,
      items: saleItems,
      total: finalCartTotal,
      costTotal: cartCostTotal,
      status: 'Concluída',
      createdAt: new Date().toISOString(),
      payments: payments,
      salesperson: selectedSalesperson !== 'Sem Vendedor' ? selectedSalesperson : undefined,
      deliveryMethod: deliveryMethod !== 'retirada' ? (deliveryMethod === 'correios_pac' ? 'Correios PAC' : deliveryMethod === 'correios_sedex' ? 'Correios SEDEX' : 'Motoboy') : undefined,
      address: deliveryMethod !== 'retirada' ? shippingAddress : undefined,
      trackingCode: generatedTracking,
      terminalId: terminalIdForSale,
      couponCode: activeCouponCode,
      coupon: activeCouponCode,
      partnerCoupon: activeCouponCode,
      partnerName: partnerNameForSale,
      partnerId: partnerIdForSale,
      partner: partnerNameForSale,
      commissionRate: (partnerNameForSale || partnerIdForSale) ? partnerCommRate : undefined,
      commissionAmount: (partnerNameForSale || partnerIdForSale) ? Number(((finalCartTotal * partnerCommRate) / 100).toFixed(2)) : undefined,
      pixDiscount: pdvDiscountBreakdown.pixDiscountVal,
      couponDiscount: pdvDiscountBreakdown.couponDiscountVal,
      cashbackDiscount: pdvDiscountBreakdown.cashbackUsed,
      notes: activeCouponCode ? `Cupom: ${activeCouponCode}${partnerNameForSale ? ` | Parceira: ${partnerNameForSale}` : ''}` : undefined
    };

    onAddSale(newSale);
    playSaleSuccessSound();
    setCreatedReceipt(newSale);
    setCart([]);
    setDiscountPercent(0);
    setDiscountValue(0);
    setCouponCode('');
    setAppliedCoupon(null);
    setPayments([{ method: 'Link de Pagamento (InfinitePay)', amount: 0 }]); // Reset payment methods
    setGeneratedLinks({});
    setDeliveryMethod('retirada');
    setShippingAddress('');
    setIsSuccessModalOpen(true);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold font-sans text-slate-800 tracking-tight">PDV (Ponto de Venda)</h2>
          <p className="text-slate-400 text-sm">Registre rapidamente as vendas efetuadas presencialmente ou por canais digitais</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCashClosureModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            <span>Fechamento Caixa (Google Sheets)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fitwear Selection List (Left Column 2-span) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs space-y-3">
            {/* Search, Filters & Camera Scanner */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search size={16} />
                </span>
                <input 
                  id="pdv-search-input"
                  type="text"
                  placeholder="Filtrar por nome, categoria ou código SKU da peça..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-sans text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsCameraScannerOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
              >
                <Camera size={16} />
                <span className="hidden sm:inline">Escanear Barcode/QR</span>
              </button>
            </div>

            {/* Category Filter Pills inside PDV */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-50">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  id={`pdv-pill-cat-${cat}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-sans transition-all cursor-pointer
                    ${selectedCategory === cat 
                      ? 'bg-pink-600 text-white shadow-xs shadow-pink-500/10' 
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Products list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" id="pdv-products-grid">
            {filteredProducts.map((p) => {
              const isLowStock = p.stock < p.minStock;
              const isOutOfStock = p.stock === 0;

              return (
                <div 
                  key={p.id}
                  onClick={() => openVariantModal(p)}
                  className="bg-white border border-slate-100 rounded-2xl overflow-hidden p-3.5 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-pink-200 transition-all cursor-pointer group"
                >
                  <div className="relative h-32 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 mb-3">
                    <img 
                      src={p.image} 
                      alt={p.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full text-[9px] font-bold text-slate-600 font-sans border border-slate-100">
                      {p.category}
                    </div>
                    {isOutOfStock ? (
                      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-3xs flex items-center justify-center">
                        <span className="bg-rose-500 text-white font-sans font-bold text-[9px] uppercase px-2 py-1 rounded-md tracking-wider">
                          Esgotado
                        </span>
                      </div>
                    ) : isLowStock && (
                      <div className="absolute bottom-2 left-2 bg-amber-500 text-white font-sans font-bold text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1">
                        Pouco Estoque
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-xs text-slate-700 leading-tight group-hover:text-pink-600 transition-colors line-clamp-1">{p.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">SKU: {p.sku}</p>

                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Preço</span>
                        <span className="text-slate-800 font-bold font-mono text-sm">{formatCurrency(p.price)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Estoque</span>
                        <span className={`font-mono text-xs font-bold ${isOutOfStock ? 'text-rose-500' : isLowStock ? 'text-amber-500' : 'text-slate-600'}`}>
                          {p.stock} peças
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PDV Cart Sidebar (Right Column 1-span) */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 md:p-5 flex flex-col justify-between max-h-[80vh] sticky top-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-pink-600" />
              <h3 className="text-sm font-bold text-slate-800">Carrinho</h3>
            </div>
            <span className="bg-slate-100 text-slate-600 font-bold font-mono px-2 py-0.5 rounded-full text-[10px]">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} itens
            </span>
          </div>

          {/* Cart items scroll list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50 my-4 max-h-[40vh] pr-1">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <ShoppingCart size={32} className="text-slate-200 stroke-1" />
                <p className="text-xs font-sans max-w-[180px]">Clique nas peças fitness ao lado para montar a venda</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs font-sans">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-700 leading-tight truncate">{item.product.name}</p>
                    
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {/* Size Select */}
                      {item.product.sizes && item.product.sizes.length > 0 && (
                        <select
                          value={item.selectedSize || ''}
                          onChange={(e) => {
                            const newSz = e.target.value;
                            updateCartItemVariant(idx, newSz, null);
                          }}
                          className="text-[9px] font-bold bg-slate-50 border border-slate-100 rounded px-1 py-0.5 text-slate-600 font-mono outline-hidden focus:border-pink-500"
                        >
                          {item.product.sizes.map(sz => (
                            <option key={sz} value={sz}>T: {sz}</option>
                          ))}
                        </select>
                      )}
                      
                      {/* Color Select filtered by selectedSize if sizeColors is present */}
                      {(() => {
                        const availableColors = (item.product.sizeColors && item.selectedSize && item.product.sizeColors[item.selectedSize])
                          ? item.product.sizeColors[item.selectedSize]
                          : (item.product.colors || []);
                        if (availableColors.length === 0) return null;
                        return (
                          <select
                            value={item.selectedColor || ''}
                            onChange={(e) => {
                              updateCartItemVariant(idx, item.selectedSize || '', e.target.value);
                            }}
                            className="text-[9px] font-bold bg-slate-50 border border-slate-100 rounded px-1 py-0.5 text-slate-600 outline-hidden focus:border-pink-500"
                          >
                            {availableColors.map(col => (
                              <option key={col} value={col}>C: {col}</option>
                            ))}
                          </select>
                        );
                      })()}
                    </div>
                    
                    <p className="text-[10px] text-pink-600 font-bold font-mono mt-1">{formatCurrency(item.product.price)}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      type="button"
                      onClick={() => updateQuantity(idx, -1)}
                      className="p-1 rounded bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="font-mono font-bold text-slate-800 w-5 text-center">{item.quantity}</span>
                    <button 
                      type="button"
                      onClick={() => updateQuantity(idx, 1)}
                      className="p-1 rounded bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                    >
                      <Plus size={10} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => removeFromCart(idx)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors ml-1 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Customer & Channel details configuration forms */}
          <form onSubmit={handleCheckout} className="space-y-4 border-t border-slate-100 pt-4">
            {/* Customer select / field */}
            <div className="space-y-1.5 text-xs font-sans">
              <div className="flex items-center justify-between">
                <label className="text-slate-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1 select-none">
                  <User size={10} /> Nome da Cliente
                </label>
                <div className="flex gap-2">
                  {selectedClientHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsHistoryPanelOpen(!isHistoryPanelOpen)}
                      className="text-[9px] font-bold text-pink-600 hover:text-pink-700 bg-pink-50 hover:bg-pink-100 px-1.5 py-0.5 rounded cursor-pointer transition border-none"
                    >
                      {isHistoryPanelOpen ? '✕ Ocultar Histórico' : `📖 Histórico (${selectedClientHistory.length})`}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
                    className="text-[9px] font-bold text-slate-500 hover:text-pink-600 bg-slate-100 hover:bg-pink-50 px-1.5 py-0.5 rounded cursor-pointer transition border-none"
                  >
                    {isQuickAddOpen ? '✕ Fechar' : '⚡ Cadastro Rápido'}
                  </button>
                </div>
              </div>

              <div className="flex gap-1">
                <input 
                  id="pdv-client-input"
                  type="text"
                  list="pdv-clients-list"
                  required
                  value={selectedClientName}
                  onChange={(e) => {
                    const typed = e.target.value;
                    setSelectedClientName(typed);
                    if (isHistoryPanelOpen) setIsHistoryPanelOpen(false);
                    
                    // Match auto-resolve from CPF or Name
                    const cleanTyped = typed.replace(/\D/g, '');
                    const foundByCpfOrName = clients.find(c => 
                      (cleanTyped && c.cpf && c.cpf.replace(/\D/g, '') === cleanTyped) ||
                      (c.name.toLowerCase() === typed.trim().toLowerCase())
                    );
                    if (foundByCpfOrName) {
                      setSelectedClientName(foundByCpfOrName.name);
                    }
                  }}
                  placeholder="Busque por CPF ou Nome da cliente..."
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-sans text-slate-700 placeholder-slate-400 focus:outline-none focus:border-pink-500 transition-all font-medium"
                />
              </div>

              {/* Live Cashback & Loyalty Search Indicator for Seller */}
              {selectedClientObject && (
                <div className="bg-emerald-50 border border-emerald-200/65 rounded-xl p-3 mt-2 flex items-center justify-between gap-2.5 animate-fadeIn font-sans text-left">
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-[10.5px] text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                      <span>👑</span>
                      <span>Cliente VIP: {selectedClientObject.name}</span>
                    </p>
                    <p className="text-[9px] text-slate-500 font-medium">
                      {selectedClientObject.cpf ? `CPF: ${selectedClientObject.cpf}` : 'Sem CPF informado'} • Total Comprado: R$ {(selectedClientObject.totalSpent || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block text-slate-400 font-bold uppercase text-[7.5px] tracking-wider">Saldo Cashback</span>
                    <span className="font-mono font-black text-xs text-emerald-600 block">
                      R$ {(selectedClientObject.cashbackBalance || 0).toFixed(2)}
                    </span>
                    {(selectedClientObject.cashbackBalance || 0) > 0 ? (
                      <button
                        type="button"
                        onClick={() => setUseCashback(!useCashback)}
                        className={`mt-1 text-[8px] font-extrabold uppercase px-2 py-0.5 rounded transition cursor-pointer border-none ${useCashback ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'}`}
                      >
                        {useCashback ? 'Aplicado ✓' : 'Aplicar Desc.'}
                      </button>
                    ) : (
                      <span className="text-[7.5px] text-slate-400 font-semibold block uppercase">Sem Saldo</span>
                    )}
                  </div>
                </div>
              )}

              <datalist id="pdv-clients-list">
                {clients.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.cpf ? `CPF: ${c.cpf}` : 'Sem CPF'}
                  </option>
                ))}
                {clients.filter(c => c.cpf).map(c => (
                  <option key={`cpf-opt-${c.id}`} value={c.cpf}>
                    {c.name}
                  </option>
                ))}
              </datalist>

              {/* QUICK ADD COLLAPSIBLE FORM CARD */}
              {isQuickAddOpen && (
                <div className="p-3 bg-pink-50/50 border border-pink-100 rounded-xl space-y-2 mt-1 animate-fadeIn font-sans">
                  <span className="text-[10px] font-extrabold text-pink-600 uppercase block tracking-wider">⚡ Cadastro Rápido de Cliente</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="space-y-1 font-sans">
                      <label className="text-[9px] font-bold text-slate-500 uppercase block">CPF do Cliente</label>
                      <input 
                        type="text"
                        placeholder="000.000.000-00"
                        value={quickCpf}
                        onChange={(e) => setQuickCpf(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[10px] focus:outline-none focus:border-pink-500 font-mono text-slate-700"
                      />
                    </div>
                    <div className="space-y-1 font-sans">
                      <label className="text-[9px] font-bold text-slate-500 uppercase block">Telefone / WhatsApp</label>
                      <input 
                        type="text"
                        placeholder="(11) 99999-0000"
                        value={quickPhone}
                        onChange={(e) => setQuickPhone(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[10px] focus:outline-none focus:border-pink-500 font-mono text-slate-700"
                      />
                    </div>
                    <div className="space-y-1 font-sans">
                      <label className="text-[9px] font-bold text-slate-500 uppercase block">E-mail</label>
                      <input 
                        type="email"
                        placeholder="cliente@exemplo.com"
                        value={quickEmail}
                        onChange={(e) => setQuickEmail(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[10px] focus:outline-none focus:border-pink-500 font-mono text-slate-700"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickAddClient}
                    className="w-full py-1.5 bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-[10px] uppercase rounded transition tracking-wider shadow-sm cursor-pointer border-none font-sans"
                  >
                    Salvar Novo Cadastro
                  </button>
                </div>
              )}

              {/* PAST PURCHASES HISTORY PANEL CARD */}
              {isHistoryPanelOpen && selectedClientHistory.length > 0 && (
                <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl space-y-2.5 mt-1 font-sans max-h-40 overflow-y-auto scrollbar-thin">
                  <div className="flex items-center justify-between border-b border-purple-200/55 pb-1 font-sans">
                    <span className="text-[10px] font-extrabold text-purple-700 uppercase tracking-widest block flex items-center gap-1 font-sans">
                      📖 Histórico de {selectedClientName}
                    </span>
                    <span className="text-[10px] font-bold text-purple-600 font-sans">
                      Total Comprado: {formatCurrency(selectedClientHistory.reduce((s, o) => s + o.total, 0))}
                    </span>
                  </div>

                  <div className="space-y-1.5 font-sans">
                    {selectedClientHistory.map((sale, sIdx) => (
                      <div key={sIdx} className="text-[10px] bg-white border border-purple-100/50 rounded p-1.5 leading-tight shadow-2xs font-sans">
                        <div className="flex items-center justify-between text-slate-500 font-semibold text-[9px] mb-1 font-sans">
                          <span>Ref: {sale.id}</span>
                          <span>{new Date(sale.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="text-slate-700 font-medium font-sans">
                          {sale.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                        </div>
                        <div className="text-right text-pink-600 font-extrabold text-[10.5px] mt-0.5 font-mono">
                          Total Pago: {formatCurrency(sale.total)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Vendedora / Commission attribution */}
            <div className="space-y-1.5 text-xs font-sans">
              <label className="text-slate-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1 select-none font-sans">
                <User size={10} /> Vendedora Responsável
              </label>
              <select 
                id="pdv-salesperson-select"
                value={selectedSalesperson}
                onChange={(e) => setSelectedSalesperson(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-sans text-slate-700 focus:outline-hidden focus:border-pink-500 transition-all font-medium cursor-pointer"
              >
                {salespersonList.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
                <option value="Sem Vendedor">Sem Vendedora (Faturamento Direto)</option>
              </select>
            </div>

            {/* Sales Channel and NPS score (if new customer) */}
            <div className="grid grid-cols-2 gap-3 text-xs font-sans">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1 select-none">
                  <Tag size={10} /> Canal de Origem
                </label>
                <select 
                  id="pdv-channel-select"
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value as SalesChannel)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-sans text-slate-700 focus:outline-hidden focus:border-pink-500 transition-all font-medium"
                >
                  <option value="Instagram">Instagram</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Loja Física">Loja Física</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-0.5 select-none">
                  Score de NPS
                </label>
                <select
                  id="pdv-nps-select"
                  value={npsScore}
                  onChange={(e) => setNpsScore(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-sans text-slate-700 focus:outline-hidden focus:border-pink-500 transition-all font-medium"
                >
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            {/* Método de Envio / Entrega */}
            <div className="space-y-1.5 text-xs font-sans border-t border-slate-100 pt-3">
              <label className="text-slate-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1 select-none font-sans">
                <Truck size={10} /> Método de Entrega / Envio
              </label>
              <select
                id="pdv-delivery-select"
                value={deliveryMethod}
                onChange={(e) => setDeliveryMethod(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-sans text-slate-700 focus:outline-hidden focus:border-pink-500 transition-all font-bold cursor-pointer"
              >
                <option value="retirada">Retirada no Balcão 🏠</option>
                <option value="motoboy">Entrega via Motoboy 🏍️</option>
                <option value="correios_pac">Correios (PAC) 📦</option>
                <option value="correios_sedex">Correios (SEDEX) ⚡</option>
              </select>
            </div>

            {/* Condicional para Endereço de Envio se Correios ou Motoboy */}
            {deliveryMethod !== 'retirada' && (
              <div className="space-y-1.5 text-xs font-sans border border-pink-100 bg-pink-50/25 p-2.5 rounded-xl">
                <label className="text-pink-600 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1 select-none font-sans">
                  📍 Endereço de Entrega *
                </label>
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Rua, Número, Bairro, Cidade - Estado, CEP"
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-sans focus:outline-hidden focus:border-pink-500 min-h-[50px] resize-none text-slate-700"
                  required
                />
              </div>
            )}

            {/* Formas de Pagamento Combinadas */}
            <div className="space-y-2.5 text-xs font-sans border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <label className="text-slate-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1 select-none">
                  <DollarSign size={10} /> Forma de Pagamento (Combinação)
                </label>
                <button
                  type="button"
                  id="add-payment-method-row-btn"
                  onClick={addPaymentRow}
                  className="text-pink-600 hover:text-pink-700 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={10} /> Adicionar Forma
                </button>
              </div>

              <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1">
                {payments.map((p, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50/65 rounded-xl border border-slate-200/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={p.method}
                        onChange={(e) => updatePaymentRow(idx, { method: e.target.value })}
                        className="flex-1 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-sans text-slate-700 focus:outline-hidden focus:border-pink-500 font-medium"
                      >
                        <option value="Link de Pagamento (InfinitePay)">Link de Pagamento (InfinitePay)</option>
                        <option value="PIX">PIX</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                        <option value="Cartão de Débito">Cartão de Débito</option>
                        <option value="Boleto Bancário">Boleto Bancário</option>
                        <option value="Crediário">Crediário</option>
                      </select>

                      <div className="relative w-28 shrink-0">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-mono">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={p.amount || ''}
                          placeholder="0.00"
                          onChange={(e) => updatePaymentRow(idx, { amount: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700 font-bold focus:outline-hidden focus:border-pink-500"
                        />
                      </div>

                      {payments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePaymentRow(idx)}
                          className="p-1 px-2 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Remover forma de pagamento"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Opções de Maquininha e Parcelamento para Cartões */}
                    {(p.method === 'Cartão de Crédito' || p.method === 'Cartão de Débito') && (
                      <div className="bg-white border border-slate-200/60 p-2.5 rounded-lg text-[10px] space-y-2.5">
                        <div className="flex flex-wrap gap-2 items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-medium font-sans">Maquininha:</span>
                            <select
                              value={p.cardMachine || 'infinitepay'}
                              onChange={(e) => updatePaymentRow(idx, { cardMachine: e.target.value })}
                              className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] text-slate-700 focus:outline-hidden font-medium font-sans"
                            >
                              {getCardMachinesConfig().map(mach => (
                                <option key={mach.id} value={mach.id}>{mach.name}</option>
                              ))}
                            </select>
                          </div>

                          {p.method === 'Cartão de Crédito' && (
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400 font-medium font-sans">Parcelas:</span>
                              <select
                                value={p.installments || 3}
                                onChange={(e) => updatePaymentRow(idx, { installments: parseInt(e.target.value) })}
                                className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] text-slate-700 focus:outline-hidden font-medium font-sans"
                              >
                                {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                                  <option key={n} value={n}>{n}x</option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-medium font-sans">Desconto Máq:</span>
                            <div className="relative w-12">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={p.cardDiscountPercent !== undefined ? p.cardDiscountPercent : 0}
                                onChange={(e) => updatePaymentRow(idx, { cardDiscountPercent: parseFloat(e.target.value) || 0 })}
                                className="w-full text-right bg-slate-50 border border-slate-200 rounded px-1 pr-3 py-0.5 text-[10px] font-mono text-emerald-700 font-bold focus:outline-hidden"
                              />
                              <span className="absolute right-0.5 top-0.5 text-slate-400 text-[8.5px] font-bold">%</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-medium font-sans">Taxa:</span>
                            <div className="relative w-12">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={p.cardFeePercent !== undefined ? p.cardFeePercent : 0}
                                onChange={(e) => updatePaymentRow(idx, { cardFeePercent: parseFloat(e.target.value) || 0 })}
                                className="w-full text-right bg-slate-50 border border-slate-200 rounded px-1 pr-3 py-0.5 text-[10px] font-mono text-slate-700 focus:outline-hidden"
                              />
                              <span className="absolute right-0.5 top-0.5 text-slate-400 text-[8.5px] font-bold">%</span>
                            </div>
                          </div>
                        </div>

                        {cardTerminalsList.length > 0 && (
                          <div className="flex items-center gap-1.5 border-t border-slate-100/70 pt-2 w-full justify-between">
                            <span className="text-pink-600 font-extrabold font-sans flex items-center gap-1 shrink-0">
                              <span>📟 Maquininha Física:</span>
                            </span>
                            <select
                              value={p.terminalId || ''}
                              onChange={(e) => updatePaymentRow(idx, { terminalId: e.target.value })}
                              className="bg-pink-50 border border-pink-200 rounded px-1.5 py-1 text-[10px] text-pink-900 focus:outline-hidden font-bold font-sans flex-1 max-w-[220px]"
                            >
                              <option value="">-- Selecione a Maquininha/Operadora --</option>
                              {cardTerminalsList.map((t: any) => (
                                <option key={t.id} value={t.id}>
                                  {t.name} ({t.brand.toUpperCase()})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Valor Líquido/Taxas formatado */}
                        <div className="flex items-center justify-between text-[9px] border-t border-slate-100 pt-1.5 text-slate-500 font-mono">
                          {((p.cardDiscountPercent || 0) > 0) ? (
                            <span>
                              Desc ({p.cardDiscountPercent}%):{' '}
                              <strong className="text-emerald-600 font-mono">
                                -R$ {((p.amount * (p.cardDiscountPercent || 0)) / 100).toFixed(2)}
                              </strong>
                            </span>
                          ) : (
                            <span className="text-slate-400">Sem desconto</span>
                          )}
                          <span>
                            Tarifa ({p.cardFeePercent}%):{' '}
                            <strong className="text-rose-500 font-mono">
                              R$ {(((p.amount - (p.amount * (p.cardDiscountPercent || 0)) / 100) * (p.cardFeePercent || 0)) / 100).toFixed(2)}
                            </strong>
                          </span>
                          <span>
                            Líquido:{' '}
                            <strong className="text-emerald-600 font-extrabold font-mono">
                              R$ {
                                (
                                  (p.amount - (p.amount * (p.cardDiscountPercent || 0)) / 100) -
                                  ((p.amount - (p.amount * (p.cardDiscountPercent || 0)) / 100) * (p.cardFeePercent || 0)) / 100
                                ).toFixed(2)
                              }
                            </strong>
                          </span>
                        </div>
                      </div>
                    )}

                    {p.method === 'Link de Pagamento (InfinitePay)' && (
                      <div className="bg-white border border-pink-200 p-3 rounded-lg text-[10px] space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-pink-600 tracking-wide uppercase text-[8.5px]">Link de Pagamento InfinitePay</span>
                          <span className="bg-pink-100 text-pink-700 font-bold text-[7.5px] px-1.5 py-0.5 rounded-full uppercase">API Integrada</span>
                        </div>

                        {!generatedLinks[idx] ? (
                          <button
                            type="button"
                            disabled={isGeneratingLinkMap[idx] || (p.amount || 0) <= 0}
                            onClick={() => generateInfinitePayLinkForPos(idx, p.amount)}
                            className="w-full py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-400 border-none"
                          >
                            {isGeneratingLinkMap[idx] ? (
                              <>
                                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                                <span>Gerando Link...</span>
                              </>
                            ) : (
                              <>
                                <Link size={12} />
                                <span>Gerar Link de Pagamento (R$ {(p.amount || 0).toFixed(2)})</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded p-1">
                              <input
                                type="text"
                                readOnly
                                value={generatedLinks[idx]}
                                className="flex-1 bg-transparent border-none text-[9.5px] font-mono text-slate-700 focus:outline-hidden"
                              />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(generatedLinks[idx]);
                                  showToast('Link de pagamento copiado para a área de transferência!', 'success');
                                }}
                                className="flex-1 py-1 bg-pink-100 hover:bg-pink-200 text-pink-700 rounded font-extrabold text-[9.5px] transition flex items-center justify-center gap-1 cursor-pointer border-none"
                              >
                                📋 Copiar Link
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const text = `Olá! Segue o link seguro para o pagamento do seu pedido de R$ ${(p.amount || 0).toFixed(2)}: ${generatedLinks[idx]}`;
                                  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                                  const a = document.createElement('a');
                                  a.href = waUrl;
                                  a.target = '_blank';
                                  a.rel = 'noopener noreferrer';
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                }}
                                className="flex-1 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded font-extrabold text-[9.5px] transition flex items-center justify-center gap-1 cursor-pointer border-none"
                              >
                                🟢 Compartilhar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {p.method === 'PIX' && (
                      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-[10px] space-y-2.5 font-sans">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-emerald-700 tracking-wide uppercase text-[8.5px]">PIX Estático (CNPJ)</span>
                          <span className="bg-emerald-100 text-emerald-800 font-bold text-[7.5px] px-1.5 py-0.5 rounded-full uppercase">Visual e Manual</span>
                        </div>

                        <div className="flex flex-col items-center justify-center p-2 bg-white rounded-lg border border-emerald-100/70">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(generateStaticPix(p.amount))}`}
                            alt="PIX QR Code"
                            className="w-36 h-36 border border-slate-100 p-1 bg-white rounded"
                            referrerPolicy="no-referrer"
                          />
                          <p className="text-[9px] text-slate-500 font-medium mt-1.5 text-center">
                            Chave PIX: <strong className="text-slate-700">{getStoreConfig().pixKey || getStoreConfig().cnpj}</strong>
                          </p>
                          <p className="text-[9.5px] text-emerald-700 font-extrabold font-mono mt-0.5">
                            R$ {(p.amount || 0).toFixed(2)}
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(generateStaticPix(p.amount));
                              showToast('Copia e Cola do PIX copiado para a área de transferência!', 'success');
                            }}
                            className="w-full py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[9.5px] transition flex items-center justify-center gap-1 cursor-pointer border-none"
                          >
                            📋 Copiar Código Copia e Cola
                          </button>
                        </div>
                        
                        <div className="bg-emerald-100/50 p-1.5 rounded text-[8.5px] text-emerald-800 leading-relaxed text-center">
                          ⚠️ <strong>Atenção Operador:</strong> A conferência deste pagamento é <strong>estritamente visual</strong>. Confirme o saldo na conta da empresa antes de finalizar a venda.
                        </div>
                      </div>
                    )}

                    {/* Dinheiro (Calcular Troco) */}
                    {p.method === 'Dinheiro' && (
                      <div className="bg-emerald-50/40 border border-emerald-100/70 p-2.5 rounded-lg text-[10px] space-y-2 font-sans">
                        <div className="flex flex-wrap gap-2.5 items-center justify-between">
                          <div className="flex items-center gap-1 flex-1 min-w-[120px]">
                            <span className="text-slate-500 font-medium">Valor Recebido:</span>
                            <div className="relative flex-1 max-w-[100px]">
                              <span className="absolute left-1.5 top-0.5 font-mono text-slate-400 text-[9px]">R$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={p.receivedCash !== undefined ? p.receivedCash : ''}
                                placeholder={p.amount.toFixed(2)}
                                onChange={(e) => {
                                  const received = parseFloat(e.target.value) || 0;
                                  const change = Math.max(0, received - p.amount);
                                  updatePaymentRow(idx, {
                                    receivedCash: received,
                                    changeAmount: Number(change.toFixed(2)),
                                    changeMethod: p.changeMethod || 'Espécie'
                                  });
                                }}
                                className="w-full text-right bg-white border border-slate-200 rounded px-1 pl-4.5 py-0.5 text-[10px] font-mono text-slate-700 font-bold focus:outline-hidden"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 font-medium">Forma do Troco:</span>
                            <select
                              value={p.changeMethod || 'Espécie'}
                              onChange={(e) => {
                                updatePaymentRow(idx, { changeMethod: e.target.value as 'Espécie' | 'Pix' });
                              }}
                              className="bg-white border border-slate-200 rounded px-1 py-0.5 text-[9.5px] text-slate-700 font-medium font-sans focus:outline-hidden"
                            >
                              <option value="Espécie">Em Espécie (Dinheiro)</option>
                              <option value="Pix">Via PIX (Transferência)</option>
                            </select>
                          </div>
                        </div>

                        {((p.receivedCash || 0) > p.amount) && (
                          <div className="flex items-center justify-between text-[10px] border-t border-dashed border-emerald-100 pt-1.5 mt-0.5 font-sans">
                            <span className="text-slate-600 font-semibold">Troco Devolvido:</span>
                            <span className="text-emerald-700 font-extrabold font-mono text-xs bg-emerald-100/80 px-2 py-0.5 rounded-md">
                              R$ {((p.receivedCash || 0) - p.amount).toFixed(2)} ({p.changeMethod === 'Pix' ? 'Via PIX' : 'Em Dinheiro'})
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Validation helper status block */}
              {payments.length > 1 && (
                <div className={`p-2 rounded-lg text-[10px] font-medium flex items-center justify-between gap-2 border font-sans ${isPaymentValid ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                  <div>
                    {isPaymentValid ? (
                      <span className="font-bold flex items-center gap-1">✓ Valor Total Combinado!</span>
                    ) : (
                      <div className="leading-tight">
                        <span className="font-bold">Atenção:</span> Soma (R$ {paymentsTotalSum.toFixed(2)}) ≠ Total (R$ {finalCartTotal.toFixed(2)}).{' '}
                        {paymentsTotalSum < finalCartTotal ? (
                          <span>Falta: <strong className="font-mono">R$ {(finalCartTotal - paymentsTotalSum).toFixed(2)}</strong></span>
                        ) : (
                          <span>Excedeu: <strong className="font-mono">R$ {(paymentsTotalSum - finalCartTotal).toFixed(2)}</strong></span>
                        )}
                      </div>
                    )}
                  </div>
                  {!isPaymentValid && (
                    <button
                      type="button"
                      onClick={autoBalancePayments}
                      className="px-1.5 py-0.5 bg-white border border-amber-200 hover:border-pink-300 text-pink-600 rounded text-[9px] font-bold shadow-2xs font-sans transition-all cursor-pointer"
                    >
                      Ajustar Último
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* SECTION: Descontos & Parcerias */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-sans space-y-2.5 mt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="font-bold text-slate-700 tracking-wide">Descontos & Parcerias</span>
                <span className="text-[10px] text-pink-600 font-bold bg-pink-50 px-1.5 py-0.5 rounded">PDV Inteligente</span>
              </div>

              {/* Cashback Disponível */}
              {clientCashbackAvailable > 0 && (
                <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200/50 rounded-lg p-2.5 flex items-center justify-between gap-2 transition-all">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-pink-700 block uppercase tracking-wider leading-none">✨ Cashback Clube AP Fitness</span>
                    <span className="font-sans font-bold text-slate-800 text-[10.5px]">
                      Disponível: <strong className="font-mono text-pink-600 font-extrabold">{formatCurrency(clientCashbackAvailable)}</strong>
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={useCashback}
                      onChange={(e) => setUseCashback(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-600"></div>
                    <span className="ml-1.5 text-[9px] font-bold text-slate-500 uppercase">{useCashback ? 'Ativo' : 'Usar'}</span>
                  </label>
                </div>
              )}

              {/* Percent and Cash discounts fields */}
              <div className="grid grid-cols-2 gap-2 font-sans">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Desconto (%)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent || ''}
                      onChange={(e) => {
                        setDiscountPercent(Number(e.target.value));
                        setDiscountValue(0); 
                      }}
                      className="w-full pl-2 pr-6 py-1 bg-white border border-slate-200 rounded text-slate-700 focus:outline-hidden focus:border-pink-500 font-mono text-[11px]"
                      placeholder="0"
                    />
                    <span className="absolute right-2 top-1 text-[10px] text-slate-400 font-bold">%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Desconto (R$)</label>
                  <div className="relative font-sans">
                    <input 
                      type="number"
                      min="0"
                      value={discountValue || ''}
                      onChange={(e) => {
                        setDiscountValue(Number(e.target.value));
                        setDiscountPercent(0); 
                      }}
                      className="w-full pl-6 pr-2 py-1 bg-white border border-slate-200 rounded text-slate-700 focus:outline-hidden focus:border-pink-500 font-mono text-[11px]"
                      placeholder="0.00"
                    />
                    <span className="absolute left-2 top-1 text-[10px] text-slate-400 font-bold font-sans">R$</span>
                  </div>
                </div>
              </div>

              {/* Partner Coupons */}
              <div className="space-y-1 font-sans">
                <label className="text-[9px] font-bold text-slate-500 uppercase block">Cupom de Parceiro</label>
                <div className="flex gap-1.5 font-sans">
                  <input 
                    type="text"
                    placeholder="Ex: MARINAFIT10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 focus:outline-hidden focus:border-pink-500 font-mono text-[10px] uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-2.5 py-1 bg-pink-100 hover:bg-pink-200 hover:text-pink-700 text-pink-600 rounded font-bold text-[10px] transition cursor-pointer border-none font-sans"
                  >
                    Validar
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded p-1 text-[10px] text-emerald-700 font-medium">
                    <span>Cupom <strong>{appliedCoupon.code}</strong> ativo ({appliedCoupon.percent > 0 ? `-${appliedCoupon.percent}%` : `-${formatCurrency(appliedCoupon.fixedValue || 0)}`})</span>
                    <button 
                      type="button" 
                      onClick={() => setAppliedCoupon(null)}
                      className="text-emerald-500 hover:text-rose-600 font-bold cursor-pointer transition border-none bg-transparent"
                    >
                      Remover
                    </button>
                  </div>
                )}
              </div>

              {/* Automated Payment-based discounts displays */}
              {hasPixDiscount && (
                <div className="bg-pink-50 border border-pink-200/60 rounded-xl p-2.5 text-[10px] text-pink-700 font-semibold space-y-1.5 font-sans">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">✨ Desconto Automático PIX Ativo</span>
                    <span className="font-mono text-[10.5px] font-extrabold text-pink-800">
                      -{formatCurrency(pdvDiscountBreakdown.pixDiscountVal)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-[8.5px] text-pink-600 font-bold uppercase tracking-wide">Desconto Pix (%):</span>
                    <div className="flex items-center bg-white border border-pink-300 rounded-md shadow-2xs overflow-hidden w-16">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={pixDiscountPercent}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          handlePixDiscountPercentChange(isNaN(val) ? 0 : val);
                        }}
                        className="w-full text-center text-xs font-mono font-bold text-pink-700 py-0.5 border-none outline-none focus:ring-0 bg-transparent"
                      />
                      <span className="text-[9px] font-bold text-slate-400 pr-1 select-none">%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Price values and Checkout action */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-sans space-y-1.5 font-mono mt-2">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Faturamento Bruto</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              
              {totalDiscounts > 0 && (
                <div className="flex justify-between text-rose-500 text-[11px] font-medium">
                  <span>(-) Total Descontos</span>
                  <span>-{formatCurrency(totalDiscounts)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-700 font-bold border-t border-slate-100 pt-1.5 text-xs">
                <span className="font-sans text-xs">Total Líquido</span>
                <span className="text-sm font-extrabold text-pink-600">{formatCurrency(finalCartTotal)}</span>
              </div>
            </div>

            <button 
              id="pdv-checkout-btn"
              type="submit"
              disabled={cart.length === 0 || !isPaymentValid}
              className={`w-full py-2.5 font-sans font-bold text-white text-xs rounded-xl transition-all cursor-pointer shadow-md text-center flex items-center justify-center gap-2
                ${(cart.length === 0 || !isPaymentValid) 
                  ? 'bg-slate-300 shadow-none cursor-not-allowed text-slate-500' 
                  : 'bg-pink-600 hover:bg-pink-700 shadow-pink-500/10'}`}
            >
              <span>Concluir Venda</span>
            </button>
          </form>
        </div>
      </div>

      {/* Sale Success Modal Recibo print */}
      {isSuccessModalOpen && createdReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto text-xl">
              ✓
            </div>
            <div>
              <h4 className="font-bold font-sans text-slate-800 text-sm">Venda Realizada com Sucesso!</h4>
              <p className="text-slate-400 text-xs mt-1">Os estoques foram subtraídos e o painel faturamento foi atualizado.</p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-sans font-mono space-y-1">
              <p className="text-[10px] text-slate-400">RECIBO #{createdReceipt.id.toUpperCase()}</p>
              <p className="text-sm font-bold text-slate-700 mt-1">{formatCurrency(createdReceipt.total)}</p>
              
              {createdReceipt.payments && createdReceipt.payments.length > 0 && (
                <div className="pt-2 border-t border-slate-100/55 mt-2 text-left space-y-1">
                  <p className="text-[9px] font-sans font-bold text-slate-400 uppercase tracking-wider">Formas de Pagamento:</p>
                  {createdReceipt.payments.map((p, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] text-slate-600 font-sans">
                      <span>{p.method}</span>
                      <span className="font-bold font-mono text-xs">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100/55 mt-2 flex justify-between">
                <span className="text-slate-400">Cliente:</span>
                <span className="font-bold font-sans text-slate-600">{createdReceipt.clientName}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2.5">
              <button 
                type="button"
                id="pdv-modal-print-receipt-btn"
                onClick={() => {
                  setIsThermalReceiptOpen(true);
                }}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold font-sans transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer active:scale-97"
              >
                <Printer size={14} />
                <span>Imprimir Cupom / PDF</span>
              </button>

              {createdReceipt?.trackingCode && (
                <button 
                  type="button"
                  id="pdv-modal-print-label-btn"
                  onClick={() => {
                    setIsShippingLabelOpen(true);
                  }}
                  className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold font-sans transition-all flex items-center justify-center gap-1.5 shadow-md shadow-pink-500/10 cursor-pointer active:scale-97"
                >
                  <Printer size={14} />
                  <span>Imprimir Etiqueta de Envio</span>
                </button>
              )}

              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    setIsSuccessModalOpen(false);
                    setActiveTab(ActiveTab.DASHBOARD);
                  }}
                  className="flex-1 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 transition-colors rounded-lg text-[11px] font-bold font-sans cursor-pointer"
                >
                  Ver no Dashboard
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setIsSuccessModalOpen(false);
                    setCreatedReceipt(null);
                  }}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors rounded-lg text-[11px] font-bold font-sans cursor-pointer"
                >
                  Fazer Outra Venda
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDV Variant Selection Modal */}
      {isVariantModalOpen && selectedProductForModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
                  <img 
                    src={getOptimizedImageUrl(getProductMainImage(selectedProductForModal), 300)} 
                    alt={selectedProductForModal.name} 
                    className="w-full h-full object-cover"
                    onError={handleImageFallback}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-pink-600 tracking-wide font-mono">
                    {selectedProductForModal.sku}
                  </span>
                  <h4 className="font-bold font-sans text-slate-800 text-sm mt-0.5">
                    {selectedProductForModal.name}
                  </h4>
                  <p className="text-slate-500 font-mono text-xs mt-1 font-bold">
                    {formatCurrency(selectedProductForModal.price)}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsVariantModalOpen(false);
                  setSelectedProductForModal(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg font-sans leading-none cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1">
              {/* Sizes Selection */}
              {selectedProductForModal.sizes && selectedProductForModal.sizes.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold font-sans text-slate-500 uppercase tracking-wider mb-2">
                    Selecione o Tamanho:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedProductForModal.sizes.map((sz) => {
                      // Check if size has any available stock in any color
                      let hasStockInAnyColor = false;
                      if (selectedProductForModal.sizeColors && selectedProductForModal.sizeColors[sz]) {
                        hasStockInAnyColor = selectedProductForModal.sizeColors[sz].some(col => 
                          getPDVItemMaxStock(selectedProductForModal, sz, col) > 0
                        );
                      } else {
                        // fallback to overall stock check
                        hasStockInAnyColor = selectedProductForModal.stock > 0;
                      }

                      const isSelected = modalSelectedSize === sz;

                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => {
                            setModalSelectedSize(sz);
                            // auto select first available color for this size
                            let defaultColor = selectedProductForModal.colors && selectedProductForModal.colors.length > 0 ? selectedProductForModal.colors[0] : 'Única';
                            if (selectedProductForModal.sizeColors && selectedProductForModal.sizeColors[sz] && selectedProductForModal.sizeColors[sz].length > 0) {
                              const withStock = selectedProductForModal.sizeColors[sz].find(c => getPDVItemMaxStock(selectedProductForModal, sz, c) > 0);
                              defaultColor = withStock || selectedProductForModal.sizeColors[sz][0];
                            }
                            setModalSelectedColor(defaultColor);
                            setModalQuantity(1);
                          }}
                          className={`min-w-10 px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer font-sans
                            ${isSelected 
                              ? 'bg-pink-600 border-pink-600 text-white shadow-xs shadow-pink-500/10' 
                              : hasStockInAnyColor
                                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                                : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 opacity-65'}`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Colors Selection */}
              <div>
                <label className="block text-[11px] font-bold font-sans text-slate-500 uppercase tracking-wider mb-2">
                  Selecione a Cor:
                </label>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const colorsList = selectedProductForModal.sizeColors && selectedProductForModal.sizeColors[modalSelectedSize]
                      ? selectedProductForModal.sizeColors[modalSelectedSize]
                      : (selectedProductForModal.colors && selectedProductForModal.colors.length > 0 ? selectedProductForModal.colors : ['Única']);

                    return colorsList.map((col) => {
                      const stockVal = getPDVItemMaxStock(selectedProductForModal, modalSelectedSize, col);
                      const hasStock = stockVal > 0;
                      const isSelected = modalSelectedColor === col;

                      return (
                        <button
                          key={col}
                          type="button"
                          onClick={() => {
                            setModalSelectedColor(col);
                            setModalQuantity(1);
                          }}
                          className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer font-sans flex items-center gap-1.5
                            ${isSelected 
                              ? 'bg-pink-600 border-pink-600 text-white shadow-xs shadow-pink-500/10' 
                              : hasStock
                                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                                : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 opacity-65'}`}
                        >
                          <span>{col}</span>
                          <span className={`text-[9px] px-1 py-0.5 rounded font-mono font-normal
                            ${isSelected 
                              ? 'bg-pink-700 text-pink-100' 
                              : hasStock
                                ? 'bg-slate-100 text-slate-500'
                                : 'bg-rose-50 text-rose-500 font-bold'}`}
                          >
                            {hasStock ? `${stockVal} un` : 'Esgotado'}
                          </span>
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Dynamic stock preview */}
              {(() => {
                const currentStock = getPDVItemMaxStock(selectedProductForModal, modalSelectedSize, modalSelectedColor);
                return (
                  <div className={`p-3 rounded-xl border text-xs font-sans flex items-center justify-between
                    ${currentStock > 0 
                      ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' 
                      : 'bg-rose-50/50 border-rose-100 text-rose-800'}`}
                  >
                    <span className="font-semibold">Estoque disponível para a combinação:</span>
                    <span className="font-bold font-mono text-sm">
                      {currentStock > 0 ? `${currentStock} peças` : 'Esgotado'}
                    </span>
                  </div>
                );
              })()}

              {/* Quantity Selector */}
              {(() => {
                const currentStock = getPDVItemMaxStock(selectedProductForModal, modalSelectedSize, modalSelectedColor);
                if (currentStock <= 0) return null;

                return (
                  <div>
                    <label className="block text-[11px] font-bold font-sans text-slate-500 uppercase tracking-wider mb-2">
                      Quantidade:
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                        <button
                          type="button"
                          disabled={modalQuantity <= 1}
                          onClick={() => setModalQuantity(prev => Math.max(1, prev - 1))}
                          className="px-3.5 py-2 font-sans font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-4 py-2 font-mono font-bold text-sm text-slate-700 min-w-10 text-center bg-white border-x border-slate-200">
                          {modalQuantity}
                        </span>
                        <button
                          type="button"
                          disabled={modalQuantity >= currentStock}
                          onClick={() => setModalQuantity(prev => Math.min(currentStock, prev + 1))}
                          className="px-3.5 py-2 font-sans font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 font-sans">
                        Mínimo 1, Máximo {currentStock} un.
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            {(() => {
              const currentStock = getPDVItemMaxStock(selectedProductForModal, modalSelectedSize, modalSelectedColor);
              const isInvalid = currentStock <= 0 || modalQuantity > currentStock || modalQuantity <= 0;

              return (
                <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsVariantModalOpen(false);
                      setSelectedProductForModal(null);
                    }}
                    className="flex-1 py-2.5 font-sans font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer text-xs text-center"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={isInvalid}
                    onClick={handleConfirmVariantAddToCart}
                    className={`flex-[2] py-2.5 font-sans font-bold text-white text-xs rounded-xl transition-all cursor-pointer shadow-md text-center flex items-center justify-center gap-1.5
                      ${isInvalid 
                        ? 'bg-slate-300 shadow-none cursor-not-allowed text-slate-500' 
                        : 'bg-pink-600 hover:bg-pink-700 shadow-pink-500/10 active:scale-97'}`}
                  >
                    <span>Adicionar ao Carrinho</span>
                    <span className="font-mono text-[10px] font-normal bg-pink-700 px-1.5 py-0.5 rounded-md">
                      {modalQuantity} un
                    </span>
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Interactive Thermal Receipt Modal popup */}
      {isThermalReceiptOpen && createdReceipt && (
        <ThermalReceipt 
          sale={createdReceipt} 
          onClose={() => {
            setIsThermalReceiptOpen(false);
          }}
        />
      )}

      {/* Interactive Shipping Label Modal popup */}
      {isShippingLabelOpen && createdReceipt && (
        <CorreiosLabel 
          sale={createdReceipt} 
          onClose={() => {
            setIsShippingLabelOpen(false);
          }}
        />
      )}

      {/* Camera Barcode / QR Code Scanner Modal */}
      {isCameraScannerOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 font-sans space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-pink-50 text-pink-600 rounded-xl">
                  <Camera size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Scanner de Código de Barras / QR Code</h3>
                  <p className="text-[11px] text-slate-400">Aponte a câmera do celular para a etiqueta da peça</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCameraScannerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Video Camera Preview Stream Container */}
            <div className="relative bg-slate-900 rounded-xl overflow-hidden min-h-[260px] flex flex-col items-center justify-center border border-slate-800">
              <div id="pdv-camera-reader" className="w-full h-full min-h-[260px] object-cover"></div>
              
              {/* Scan Message overlay */}
              {scanMessage && (
                <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 backdrop-blur-md text-white text-xs font-bold p-3 rounded-xl border border-pink-500/50 shadow-lg text-center animate-bounce">
                  {scanMessage}
                </div>
              )}
            </div>

            {/* Manual Code Fallback */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase block">Ou digite o código SKU / Código de Barras:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: FIT-LEG-001..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value;
                      if (val) {
                        handleScannedBarcode(val);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-hidden focus:border-pink-500"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCameraScannerOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition-colors"
              >
                Concluir Leitura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Sheets Cash Closure Modal */}
      {isCashClosureModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 font-sans space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Fechamento do Caixa do Dia</h3>
                  <p className="text-[11px] text-slate-400">Geração e sincronização com Google Sheets</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCashClosureModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 bg-emerald-50/50 border border-emerald-100/80 p-3.5 rounded-xl text-xs">
              <div className="flex justify-between items-center text-slate-700">
                <span className="font-medium">Data do Fechamento:</span>
                <span className="font-bold font-mono text-emerald-700">{new Date().toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="font-medium">Vendedor/Operador:</span>
                <span className="font-bold">{selectedSalesperson || 'Geral'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="font-medium">Planilha de Destino:</span>
                <span className="font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded text-[10px]">AP_Moda_Caixa_2026.xlsx</span>
              </div>
            </div>

            <div className="text-xs text-slate-500 leading-relaxed">
              O relatório compilará automaticamente todos os recebimentos em PIX, Cartão de Crédito, Débito e Dinheiro do dia em formato tabular de alta precisão pronto para abrir no Google Planilhas.
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCashClosureModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isExportingSheets}
                onClick={handleExportCashClosureToSheets}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
              >
                <FileSpreadsheet size={16} />
                <span>{isExportingSheets ? 'Gerando Planilha...' : 'Gerar Fechamento no Google Sheets'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
