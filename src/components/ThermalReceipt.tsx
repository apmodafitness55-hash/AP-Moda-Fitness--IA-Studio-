/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Printer, 
  X, 
  MapPin, 
  Phone, 
  FileText, 
  DollarSign, 
  Award, 
  QrCode, 
  CheckCircle,
  Copy,
  Edit2,
  Settings,
  Scaling,
  Scissors,
  Check,
  Tag,
  Smile,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Eye,
  Palette,
  Search
} from 'lucide-react';
import { Sale } from '../types';
import { pushSystemConfigToFirebase } from '../firebase';

interface CompanyInfo {
  name: string;
  subName: string;
  cnpj: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  slogan: string;
  website: string;
  instructions: string;
  pixKey: string;
}

const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: 'AP MODA FITNESS',
  subName: '',
  cnpj: '',
  addressLine1: '',
  addressLine2: '',
  phone: '',
  slogan: 'Estilo, Conforto e Performance no seu Treino',
  website: '',
  instructions: '',
  pixKey: ''
};

interface ThermalReceiptProps {
  sale: Sale;
  onClose: () => void;
}

export default function ThermalReceipt({ sale, onClose }: ThermalReceiptProps) {
  // Load company config with localStorage fallback and dynamic system configuration parsing
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    // 1. Check if there is an explicit saved ap_moda_company_info
    const saved = localStorage.getItem('ap_moda_company_info');
    let parsed: Partial<CompanyInfo> = {};
    if (saved) {
      try {
        parsed = JSON.parse(saved);
      } catch (e) {
        parsed = {};
      }
    }

    // 2. Read from system global localStorage keys, with dynamic clean fallbacks (no fake data)
    const sysName = localStorage.getItem('ap_store_name');
    const sysSlogan = localStorage.getItem('ap_store_slogan');
    const sysCnpj = localStorage.getItem('ap_store_cnpj');
    const sysAddress = localStorage.getItem('ap_store_address');
    const sysPhone = localStorage.getItem('ap_store_phone');
    const sysFooter = localStorage.getItem('ap_store_footer');

    // Helper to clean up mock fallback data
    const cleanValue = (val: string | null, defaultValue: string = '') => {
      if (!val) return defaultValue;
      const trimmed = val.trim();
      const lowered = trimmed.toLowerCase();
      if (
        lowered.includes('12.345.678') || 
        lowered.includes('paulista') || 
        lowered.includes('copacabana') ||
        lowered.includes('98888-7777') ||
        lowered.includes('99123-4567')
      ) {
        return defaultValue;
      }
      return trimmed;
    };

    // Split address into addressLine1 and addressLine2 if needed
    const rawAddress = cleanValue(sysAddress);
    let addr1 = rawAddress;
    let addr2 = '';
    if (rawAddress && rawAddress.includes(' - ')) {
      const parts = rawAddress.split(' - ');
      addr1 = parts[0];
      addr2 = parts.slice(1).join(' - ');
    }

    return {
      name: (cleanValue(parsed.name) || cleanValue(sysName) || 'AP MODA FITNESS').trim(),
      subName: (cleanValue(parsed.subName) || cleanValue(sysName) || '').trim(),
      cnpj: (cleanValue(parsed.cnpj) || cleanValue(sysCnpj) || '').trim(),
      addressLine1: (cleanValue(parsed.addressLine1) || addr1 || '').trim(),
      addressLine2: (cleanValue(parsed.addressLine2) || addr2 || '').trim(),
      phone: (cleanValue(parsed.phone) || cleanValue(sysPhone) || '').trim(),
      slogan: (cleanValue(parsed.slogan) || cleanValue(sysSlogan) || 'Estilo, Conforto e Performance no seu Treino').trim(),
      website: (cleanValue(parsed.website) || '').trim(),
      instructions: (cleanValue(parsed.instructions) || cleanValue(sysFooter) || '').trim(),
      pixKey: (cleanValue(parsed.pixKey) || cleanValue(localStorage.getItem('ap_pix_key')) || '').trim()
    };
  });

  // Client documentation CPF model editable live for printing
  const [clientCpf, setClientCpf] = useState<string>(() => {
    return sale.clientDoc || '000.000.000-00';
  });

  // Custom live discount on printing template (if they want to adjust, or use existing calculations)
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isCopiedPayString, setIsCopiedPayString] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);

  // Printer customizations
  const [selectedPrinter, setSelectedPrinter] = useState<'80mm' | '58mm' | 'A4' | 'label' | '100x150'>(() => {
    return (localStorage.getItem('ap_moda_selected_printer') as '80mm' | '58mm' | 'A4' | 'label' | '100x150') || '80mm';
  });

  const [fontSize, setFontSize] = useState<'xs' | 'sm' | 'md' | 'lg'>(() => {
    return (localStorage.getItem('ap_moda_receipt_font_size') as 'xs' | 'sm' | 'md' | 'lg') || 'sm';
  });

  const [showQrCode, setShowQrCode] = useState<boolean>(() => {
    const saved = localStorage.getItem('ap_moda_receipt_show_qr');
    return saved !== null ? saved === 'true' : true;
  });

  const [showLogo, setShowLogo] = useState<boolean>(() => {
    const saved = localStorage.getItem('ap_moda_receipt_show_logo');
    return saved !== null ? saved === 'true' : true;
  });

  const [showAddress, setShowAddress] = useState<boolean>(() => {
    const saved = localStorage.getItem('ap_moda_receipt_show_addr');
    return saved !== null ? saved === 'true' : true;
  });

  const [cutLinesCount, setCutLinesCount] = useState<number>(() => {
    const saved = localStorage.getItem('ap_moda_receipt_cut_lines');
    return saved !== null ? Number(saved) : 2;
  });

  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [previewBg, setPreviewBg] = useState<'slate' | 'gray' | 'wood' | 'dark'>('gray');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLocalLoading, setIsLocalLoading] = useState<boolean>(true);

  useEffect(() => {
    // Confirm and delay slightly to ensure Firebase database data is fully loaded and synced
    const timer = setTimeout(() => {
      setIsLocalLoading(false);
    }, 850);
    return () => clearTimeout(timer);
  }, []);

  // Sync settings
  useEffect(() => {
    localStorage.setItem('ap_moda_company_info', JSON.stringify(companyInfo));
    pushSystemConfigToFirebase('ap_moda_company_info', JSON.stringify(companyInfo));

    if (companyInfo.pixKey) {
      localStorage.setItem('ap_pix_key', companyInfo.pixKey);
      pushSystemConfigToFirebase('ap_pix_key', companyInfo.pixKey);

      // Keep ap_moda_payment_config updated in sync
      try {
        const paymentConfigSaved = localStorage.getItem('ap_moda_payment_config');
        if (paymentConfigSaved) {
          const parsed = JSON.parse(paymentConfigSaved);
          if (parsed.pixKey !== companyInfo.pixKey) {
            parsed.pixKey = companyInfo.pixKey;
            localStorage.setItem('ap_moda_payment_config', JSON.stringify(parsed));
            pushSystemConfigToFirebase('ap_moda_payment_config', JSON.stringify(parsed));
          }
        }
      } catch (err) {}
    }
  }, [companyInfo]);

  useEffect(() => {
    localStorage.setItem('ap_moda_selected_printer', selectedPrinter);
  }, [selectedPrinter]);

  useEffect(() => {
    localStorage.setItem('ap_moda_receipt_font_size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('ap_moda_receipt_show_qr', String(showQrCode));
  }, [showQrCode]);

  useEffect(() => {
    localStorage.setItem('ap_moda_receipt_show_logo', String(showLogo));
  }, [showLogo]);

  useEffect(() => {
    localStorage.setItem('ap_moda_receipt_show_addr', String(showAddress));
  }, [showAddress]);

  useEffect(() => {
    localStorage.setItem('ap_moda_receipt_cut_lines', String(cutLinesCount));
  }, [cutLinesCount]);

  const subtotal = useMemo(() => {
    return sale.total;
  }, [sale]);

  const discountAmount = useMemo(() => {
    return Number(((subtotal * discountPercent) / 100).toFixed(2));
  }, [subtotal, discountPercent]);

  const finalTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Live dynamic Pix payload for scan copy-paste
  const pixPayload = useMemo(() => {
    const rawKey = companyInfo.pixKey || 'pagamentos@exemplo.com';
    const amountStr = finalTotal.toFixed(2);
    
    // Clean and sanitize the Pix key according to BACEN standards
    let key = rawKey.trim();
    if (key.includes('@')) {
      key = key.toLowerCase();
    } else {
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(key);
      if (isUuid) {
        key = key.toLowerCase();
      } else {
        const digits = key.replace(/\D/g, '');
        if (digits.length === 11) {
          key = digits; // CPF: only digits
        } else if (digits.length === 14) {
          key = digits; // CNPJ: only digits
        } else if (digits.length >= 8 && digits.length <= 11) {
          key = `+55${digits}`; // Phone without country code: add +55
        } else if (digits.length === 12 || digits.length === 13) {
          key = `+${digits}`; // Phone with country code: add +
        } else {
          key = key.replace(/\s+/g, '');
        }
      }
    }
    
    // Parse city from addressLine2 (format: "Cidade - Estado")
    let rawCity = 'Sao Paulo';
    if (companyInfo.addressLine2) {
      const parts = companyInfo.addressLine2.split('-');
      if (parts[0]) {
        rawCity = parts[0].trim();
      }
    }
    
    // Clean city name: remove accents, special chars, keep only letters, max 15 chars
    const cleanCity = rawCity
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-zA-Z\s]/g, '') // keep only letters and spaces
      .replace(/\s+/g, '') // remove all spaces for safe EMV Co payload
      .trim()
      .substring(0, 15) || 'SaoPaulo';
      
    // Clean merchant name
    const cleanMerchant = (companyInfo.name || 'AP Moda Fitness')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z]/g, '')
      .trim()
      .substring(0, 25) || 'APModaFitness';

    // 00 (Payload Format Indicator) - fixed 01
    const p00 = '000201';
    
    // 01 (Point of Initiation Method) - 11 (Static QR Code)
    const p01 = '010211';
    
    // 26 (Merchant Account Information)
    const sub00 = '0014br.gov.bcb.pix';
    const sub01 = `01${key.length.toString().padStart(2, '0')}${key}`;
    const value26 = `${sub00}${sub01}`;
    const p26 = `26${value26.length.toString().padStart(2, '0')}${value26}`;
    
    // 52 (Merchant Category Code) - fixed 0000
    const p52 = '52040000';
    
    // 53 (Transaction Currency) - fixed Real 986
    const p53 = '5303986';
    
    // 54 (Transaction Amount) - dynamic length
    const p54 = `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`;
    
    // 58 (Country Code) - fixed BR
    const p58 = '5802BR';
    
    // 59 (Merchant Name) - dynamic length (max 25 chars)
    const p59 = `59${cleanMerchant.length.toString().padStart(2, '0')}${cleanMerchant}`;
    
    // 60 (Merchant City) - dynamic length (max 15 chars)
    const p60 = `60${cleanCity.length.toString().padStart(2, '0')}${cleanCity}`;
    
    // 62 (Additional Data Field Template)
    // Strict format requested: '62070503***'
    const p62 = '62070503***';
    
    // 63 (CRC16 Header) - fixed 04
    const p63 = '6304';
    
    const basePayload = `${p00}${p01}${p26}${p52}${p53}${p54}${p58}${p59}${p60}${p62}${p63}`;
    
    // Calculate CRC16 CCITT (0x1021 polynomial, 0xFFFF initial value)
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
  }, [companyInfo.pixKey, companyInfo.addressLine2, companyInfo.name, finalTotal]);

  const handleCopyPixString = () => {
    navigator.clipboard.writeText(pixPayload);
    setIsCopiedPayString(true);
    setTimeout(() => setIsCopiedPayString(false), 2000);
  };

  const handlePrint = () => {
    // Add print trigger styles dynamically to avoid affecting other screens permanently
    const style = document.createElement('style');
    style.id = 'thermal-receipt-print-styles';
    
    // Width map for print target
    const widthMap = {
      '58mm': '53mm',
      '80mm': '76mm',
      'label': '46mm',
      '100x150': '96mm',
      'A4': '190mm'
    };
    
    const fontSelector = {
      'xs': '9px',
      'sm': '11px',
      'md': '13px',
      'lg': '15px'
    };

    style.innerHTML = `
      @media print {
        @page { 
          size: auto; 
          margin: 0; 
        }
        body { 
          margin: 0; 
          padding: 0; 
          background: white !important;
          color: black !important;
        }
        .no-print { 
          display: none !important; 
        }

        #printable-thermal-receipt {
          display: block !important;
          visibility: visible !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          transform: none !important;
          width: ${widthMap[selectedPrinter]} !important;
          max-width: 100% !important;
          height: auto !important;
          page-break-inside: avoid !important;
          margin: 0 !important;
          padding: ${selectedPrinter === 'A4' ? '12mm' : selectedPrinter === '100x150' ? '6mm' : '1.5mm'} !important;
          border: none !important;
          box-shadow: none !important;
          background: white !important;
          font-family: ${selectedPrinter === 'A4' ? "'Inter', system-ui, sans-serif" : "'JetBrains Mono', Courier, monospace"} !important;
          font-size: ${fontSelector[fontSize]} !important;
        }
        /* Ensure descendants of printable container are visible and styled properly */
        #printable-thermal-receipt * {
          visibility: visible !important;
          color: #000000 !important;
          background: transparent !important;
        }
        /* Ensure no layout distortion */
        html, body {
          background: white !important;
          width: 100% !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
        }
        .modal-overlay-thermal {
          display: none !important;
          background: transparent !important;
        }
        
        /* Adjustments for labels */
        ${selectedPrinter === 'label' || selectedPrinter === '100x150' ? `
          #printable-thermal-receipt * {
            line-height: 1.15 !important;
          }
        ` : ''}
      }
    `;
    document.head.appendChild(style);

    window.print();

    // Clean up style tag after window print opens
    setTimeout(() => {
      const addedStyle = document.getElementById('thermal-receipt-print-styles');
      if (addedStyle) {
        addedStyle.remove();
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto modal-overlay-thermal transition-all">
      {isLocalLoading ? (
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center justify-center text-center space-y-4 animate-pulse">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          <div>
            <h3 className="text-sm font-extrabold text-slate-850">Sincronizando com Firebase</h3>
            <p className="text-[10.5px] text-slate-450 mt-1">Carregando dados da venda em tempo real para evitar páginas de PDF em branco...</p>
          </div>
        </div>
      ) : (
        <div className={`bg-slate-50 rounded-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row h-full md:max-h-[85vh] transition-all duration-300 ${isFullscreen ? 'max-w-5xl' : 'max-w-4xl'}`}>
        
        {/* Controls Configuration Panel - left on desktop */}
        {!isFullscreen && (
          <div className="flex-1 p-5 md:p-6 space-y-4 border-r border-slate-150 overflow-y-auto bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight font-sans flex items-center gap-2">
                <Printer size={16} className="text-pink-600 animate-pulse" />
                Emissão & Configuração do Cupom
              </h3>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5">Ajuste os dados de emissão e os rodapés em tempo real</p>
            </div>
            
            <button 
              onClick={() => setIsEditingSettings(!isEditingSettings)}
              className="text-xs text-pink-600 hover:text-pink-700 font-bold font-sans flex items-center gap-1 bg-pink-50 hover:bg-pink-100/70 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all"
            >
              <Edit2 size={12} />
              <span>{isEditingSettings ? 'Ver Impressão' : 'Editar Empresa'}</span>
            </button>
          </div>

          {isEditingSettings ? (
            /* CONFIG PANEL FORM */
            <div className="space-y-3.5 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide select-none">Nome Fantasia (Cabeçalho principal)</label>
                <input 
                  type="text"
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono focus:outline-hidden focus:border-pink-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide select-none">Razão Social / Nome Estendido</label>
                <input 
                  type="text"
                  value={companyInfo.subName}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, subName: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide select-none">CNPJ Emissor</label>
                  <input 
                    type="text"
                    placeholder="00.000.000/0001-00"
                    value={companyInfo.cnpj}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, cnpj: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono focus:outline-hidden focus:border-pink-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide select-none">Telefone / Whats</label>
                  <input 
                    type="text"
                    value={companyInfo.phone}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono focus:outline-hidden focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide select-none">Endereço Logradouro (Nº, Bairro)</label>
                <input 
                  type="text"
                  placeholder="Ex: Rua Dr Luiz Carlos, 560"
                  value={companyInfo.addressLine1}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, addressLine1: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:border-pink-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide select-none">Cidade - Estado</label>
                <input 
                  type="text"
                  placeholder="Ex: Assú - RN"
                  value={companyInfo.addressLine2}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, addressLine2: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:border-pink-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide select-none">Chave Pix de Recebimento</label>
                <input 
                  type="text"
                  placeholder="E-mail, CPF, celular ou chave aleatória"
                  value={companyInfo.pixKey}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, pixKey: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-mono focus:outline-hidden focus:border-pink-500 font-semibold"
                />
                <p className="text-[10px] text-slate-450 mt-0.5 font-sans">Forneça sua chave para gerar o QR code Pix impresso de forma automática!</p>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide select-none">Slogan / Texto Sub-rodapé</label>
                <input 
                  type="text"
                  placeholder="Ex: Performance de Elite"
                  value={companyInfo.slogan}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, slogan: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:border-pink-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide select-none">Mensagem WhatsApp Rodapé</label>
                <input 
                  type="text"
                  placeholder="Ex: Para solicitar Nota Fiscal oficial entre em contato"
                  value={companyInfo.instructions}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, instructions: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:border-pink-500"
                />
              </div>
            </div>
          ) : (
            /* PRINT CONTROLS PANEL */
            <div className="space-y-4 text-xs font-sans">
              
              {/* BRAND NEW: PRINTER SELECTOR SECTION */}
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-1.5 text-slate-700 font-extrabold text-[11px] uppercase tracking-wider select-none">
                  <Settings size={14} className="text-pink-600" />
                  <span>Selecione a Impressora & Formato</span>
                </div>
                <p className="text-[10px] text-slate-450 leading-relaxed -mt-1 font-medium">Adapte a largura e diagramação de acordo com sua máquina:</p>
                
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Option 1: 80mm standard */}
                  <button
                    type="button"
                    onClick={() => setSelectedPrinter('80mm')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between h-[68px] outline-hidden
                      ${selectedPrinter === '80mm' 
                        ? 'bg-pink-50/50 border-pink-400 text-pink-950 shadow-xs' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350'
                      }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="font-extrabold text-[10.5px]">Térmica 80mm</span>
                      {selectedPrinter === '80mm' && <Check size={11} className="text-pink-600" />}
                    </div>
                    <span className="text-[9px] text-slate-450 font-medium">Padrão p/ bobinas largas (76mm úteis).</span>
                  </button>

                  {/* Option 2: 58mm POS */}
                  <button
                    type="button"
                    onClick={() => setSelectedPrinter('58mm')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between h-[68px] outline-hidden
                      ${selectedPrinter === '58mm' 
                        ? 'bg-pink-50/50 border-pink-400 text-pink-950 shadow-xs' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350'
                      }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="font-extrabold text-[10.5px]">Mini POS 58mm</span>
                      {selectedPrinter === '58mm' && <Check size={11} className="text-pink-600" />}
                    </div>
                    <span className="text-[9px] text-slate-450 font-medium">Bobinas estreitas, bluetooth e maquininhas.</span>
                  </button>

                  {/* Option 3: Label Sticker */}
                  <button
                    type="button"
                    onClick={() => setSelectedPrinter('label')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between h-[68px] outline-hidden
                      ${selectedPrinter === 'label' 
                        ? 'bg-pink-50/50 border-pink-400 text-pink-950 shadow-xs' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350'
                      }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="font-extrabold text-[10.5px]">Etiqueta Mini</span>
                      {selectedPrinter === 'label' && <Check size={11} className="text-pink-600" />}
                    </div>
                    <span className="text-[9px] text-slate-450 font-medium">Adesivos de gôndola e fita fina (46mm).</span>
                  </button>

                  {/* Option 3.5: 100x150mm Sticker */}
                  <button
                    id="format-10x15"
                    type="button"
                    onClick={() => setSelectedPrinter('100x150')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between h-[68px] outline-hidden
                      ${selectedPrinter === '100x150' 
                        ? 'bg-pink-50/50 border-pink-400 text-pink-950 shadow-xs' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350'
                      }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="font-extrabold text-[10.5px]">Etiqueta Envio 10x15</span>
                      {selectedPrinter === '100x150' && <Check size={11} className="text-pink-600" />}
                    </div>
                    <span className="text-[9px] text-slate-450 font-medium">Padrão e-commerce (100mm x 150mm).</span>
                  </button>

                  {/* Option 4: A4 common sheets */}
                  <button
                    type="button"
                    onClick={() => setSelectedPrinter('A4')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between h-[68px] outline-hidden
                      ${selectedPrinter === 'A4' 
                        ? 'bg-pink-50/50 border-pink-400 text-pink-950 shadow-xs' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350'
                      }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="font-extrabold text-[10.5px]">Folha A4 / Carta</span>
                      {selectedPrinter === 'A4' && <Check size={11} className="text-pink-600" />}
                    </div>
                    <span className="text-[9px] text-slate-450 font-medium">Impressora jato/laser tradicional e PDFs A4.</span>
                  </button>
                </div>
              </div>

              {/* FONT SIZE CUSTOMIZER */}
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-slate-700 font-extrabold text-[11px] uppercase tracking-wider select-none">
                  <Scaling size={13} className="text-pink-600" />
                  <span>Ajuste de Escala (Fonte)</span>
                </div>
                
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 gap-1">
                  {(['xs', 'sm', 'md', 'lg'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setFontSize(sz)}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition-all border-0 outline-hidden uppercase
                        ${fontSize === sz 
                          ? 'bg-pink-600 text-white shadow-xs' 
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                    >
                      {sz === 'xs' ? 'Muito Peq.' : sz === 'sm' ? 'Padrão' : sz === 'md' ? 'Médio' : 'Grande'}
                    </button>
                  ))}
                </div>
              </div>

              {/* TOGGLES PANEL */}
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-1.5 text-slate-700 font-extrabold text-[11px] uppercase tracking-wider select-none">
                  <FileText size={13} className="text-pink-600" />
                  <span>Configurações Estéticas do Comprovante</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Toggle Logo */}
                  <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100/50 transition-colors">
                    <input 
                      type="checkbox"
                      checked={showLogo}
                      onChange={(e) => setShowLogo(e.target.checked)}
                      className="rounded border-slate-300 text-pink-600 focus:ring-pink-500 h-4.5 w-4.5 accent-pink-600"
                    />
                    <span className="text-[10.5px] font-bold text-slate-650">Exibir Logo</span>
                  </label>

                  {/* Toggle Address */}
                  <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100/50 transition-colors">
                    <input 
                      type="checkbox"
                      checked={showAddress}
                      onChange={(e) => setShowAddress(e.target.checked)}
                      className="rounded border-slate-300 text-pink-600 focus:ring-pink-500 h-4.5 w-4.5 accent-pink-600"
                    />
                    <span className="text-[10.5px] font-bold text-slate-650">Exibir Endereço</span>
                  </label>

                  {/* Toggle QR Code */}
                  <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100/50 transition-colors">
                    <input 
                      type="checkbox"
                      checked={showQrCode}
                      onChange={(e) => setShowQrCode(e.target.checked)}
                      className="rounded border-slate-300 text-pink-600 focus:ring-pink-500 h-4.5 w-4.5 accent-pink-600"
                    />
                    <span className="text-[10.5px] font-bold text-slate-650">QR Code Pix</span>
                  </label>

                  {/* Toggle Margins spacer */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-bold text-slate-450 uppercase">Linhas Vazias de Rodapé</label>
                    <select
                      value={cutLinesCount}
                      onChange={(e) => setCutLinesCount(Number(e.target.value))}
                      className="bg-white border border-slate-200 text-slate-700 text-[10.5px] font-bold rounded-lg px-2 py-1 focus:outline-hidden focus:border-pink-550 cursor-pointer"
                    >
                      <option value={0}>Sem avanço</option>
                      <option value={1}>1 linha (Curto)</option>
                      <option value={2}>2 linhas (Médio)</option>
                      <option value={3}>3 linhas (Espaçado)</option>
                      <option value={5}>5 linhas (Longo feed)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* CLIENT DETAILS AND DISCOUNTS */}
              <div className="bg-pink-50/40 p-4 border border-pink-100 rounded-2xl space-y-3.5">
                <h4 className="font-bold text-pink-700 flex items-center gap-1.5 text-[11px] uppercase tracking-wider select-none">
                  <Award size={13} /> Dados da Cliente & Descontos
                </h4>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">CPF / CNPJ da Cliente (na impressão)</label>
                  <input 
                    type="text"
                    value={clientCpf}
                    onChange={(e) => setClientCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-mono font-bold focus:outline-hidden focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Lançar Desconto de Amostragem (%)</label>
                    <span className="text-slate-700 font-mono font-bold">{discountPercent}%</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full accent-pink-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium font-sans">
                    <span>Sem desconto</span>
                    <span>Abatimento: {formatCurrency(discountAmount)}</span>
                    <span>Máx. 50%</span>
                  </div>
                </div>
              </div>

              {/* PIX scan copy and paste */}
              {companyInfo.pixKey && (
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1 select-none">
                      <QrCode size={12} className="text-slate-450" /> Pix Copia e Cola / Chave Emissora
                    </span>
                    <button
                      onClick={handleCopyPixString}
                      className="text-[10px] font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 cursor-pointer"
                    >
                      {isCopiedPayString ? <span className="text-emerald-500 font-sans">Copiado!</span> : <><Copy size={11} /> <span>Copiar Chave</span></>}
                    </button>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 bg-white p-2 border border-slate-100 rounded-lg truncate break-all leading-tight select-all">
                    {pixPayload}
                  </div>
                </div>
              )}

              {/* Helpful tips */}
              <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100 text-[10px] font-medium leading-relaxed text-slate-450">
                <p>💡 <strong>Dica de Impressora:</strong> Para bobinas térmicas (58mm e 80mm), lembre-se de configurar a escala correta de tamanho de letra ao lado. Nas configurações de página do seu navegador, marque "Gráficos de segundo plano" e desmarque "Cabeçalhos e rodapés" para ocultar URLs da folha!</p>
              </div>
            </div>
          )}

          {/* Dialog Action buttons bottom */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
            <button 
              onClick={handlePrint}
              className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold font-sans transition-all text-center shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 text-xs cursor-pointer active:scale-95"
            >
              <Printer size={15} />
              <span>💾 Salvar como PDF / Imprimir</span>
            </button>
            <button 
              onClick={onClose}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold font-sans transition-all text-center text-xs cursor-pointer active:scale-95"
            >
              Fechar
            </button>
          </div>
        </div>
        )}

        {/* Real Thermal Paper simulation Preview Panel - right on desktop */}
        <div className={`flex-1 flex flex-col min-h-[400px] overflow-hidden transition-all duration-300 ${
          previewBg === 'gray' ? 'bg-slate-200' :
          previewBg === 'slate' ? 'bg-slate-800 bg-[radial-gradient(#334155_1px,transparent_1px)] bg-[size:16px_16px]' :
          previewBg === 'dark' ? 'bg-slate-950 text-slate-400' :
          'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-amber-950 to-slate-950'
        }`}>
          {/* CONTROL BAR FOR PREVIEW AREA */}
          <div className="no-print bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs select-none shadow-xs z-10">
            <div className="flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-extrabold text-[10px] text-slate-700 tracking-wider uppercase flex items-center gap-1 font-sans">
                <Eye size={12} className="text-pink-600" />
                Prévia Oficial do Cupom
              </span>
              <span className="bg-pink-50 text-pink-700 font-mono font-bold text-[8.5px] px-2 py-0.5 rounded tracking-wide uppercase">
                {selectedPrinter === '80mm' ? 'Térmica 80mm' : selectedPrinter === '58mm' ? 'Mini POS 58mm' : selectedPrinter === 'label' ? 'Etiqueta' : selectedPrinter === '100x150' ? 'Etiqueta Envio 10x15' : 'A4 Padrão'}
              </span>
            </div>

            {/* Scale/Zoom controllers */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 shadow-inner">
              <button
                type="button"
                onClick={() => setZoomScale(s => Math.max(0.6, s - 0.1))}
                title="Diminuir Zoom"
                className="w-6 h-6 rounded-md hover:bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center cursor-pointer border-0 transition-colors bg-transparent outline-hidden"
              >
                <ZoomOut size={13} />
              </button>
              <span className="text-[10px] font-mono font-bold text-slate-700 min-w-[34px] text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale(s => Math.min(1.5, s + 0.1))}
                title="Aumentar Zoom"
                className="w-6 h-6 rounded-md hover:bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center cursor-pointer border-0 transition-colors bg-transparent outline-hidden"
              >
                <ZoomIn size={13} />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(1.0)}
                title="Resetar Zoom"
                className="w-5 h-5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer border-0 transition-colors bg-transparent outline-hidden"
              >
                <RotateCcw size={10} />
              </button>
            </div>

            {/* Background selection */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 shadow-inner">
              <span className="text-[8.5px] text-slate-500 font-extrabold px-1.5 uppercase font-sans">Visual:</span>
              {(['gray', 'slate', 'dark', 'wood'] as const).map((bgType) => (
                <button
                  key={bgType}
                  type="button"
                  onClick={() => setPreviewBg(bgType)}
                  className={`px-1.5 py-0.5 text-[8.5px] font-extrabold rounded-md cursor-pointer transition-all border-0 uppercase ${
                    previewBg === bgType 
                      ? 'bg-white text-slate-950 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                  }`}
                >
                  {bgType === 'gray' ? 'Cinza' : bgType === 'slate' ? 'Balcão' : bgType === 'dark' ? 'Preto' : 'Madeira'}
                </button>
              ))}
            </div>

            {/* Fullscreen focus toggle & print toggle */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={`px-2.5 py-1 rounded-lg text-[9.5px] font-extrabold flex items-center gap-1 border transition-all cursor-pointer ${
                  isFullscreen 
                    ? 'bg-pink-600 text-white border-pink-600 hover:bg-pink-700' 
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 size={12} />
                    <span>Ver Ajustes</span>
                  </>
                ) : (
                  <>
                    <Maximize2 size={12} />
                    <span>Foco Prévia</span>
                  </>
                )}
              </button>

              {isFullscreen && (
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-1 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg text-[9.5px] font-black flex items-center gap-1 cursor-pointer transition-colors border-0 animate-pulse"
                >
                  <Printer size={12} />
                  <span>Imprimir Comprovante</span>
                </button>
              )}
            </div>
          </div>

          {/* VIEWPORT AREA OF PREVIEW */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-start justify-center">
            {/* Zoom Wrapper */}
            <div 
              style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }} 
              className="transition-transform duration-200 origin-top flex justify-center w-full min-h-max py-2"
            >
              {/* Printable container simulating paper */}
              <div 
                id="printable-thermal-receipt" 
                className={`bg-white border select-all border-slate-350 shadow-xl transition-all duration-300 relative flex flex-col text-slate-800
                  ${selectedPrinter === '58mm' ? 'max-w-[240px] p-3 text-[10px] font-mono leading-snug' :
                    selectedPrinter === 'label' ? 'max-w-[210px] p-2 text-[9px] font-mono leading-tight' :
                    selectedPrinter === '100x150' ? 'w-[378px] h-[567px] p-6 text-[10px] font-mono leading-normal overflow-hidden rounded-md' :
                    selectedPrinter === 'A4' ? 'max-w-[620px] p-10 text-[12px] font-sans leading-relaxed' :
                    'max-w-[340px] p-5 text-[11px] font-mono leading-relaxed'
                  }
                `}
                style={{
                  fontSize: fontSize === 'xs' ? '8.5px' : fontSize === 'sm' ? '10px' : fontSize === 'md' ? '11.5px' : '13.5px'
                }}
              >
            {/* Paper custom border details top & bottom */}
            {selectedPrinter !== 'A4' && selectedPrinter !== '100x150' && (
              <div className="absolute top-0 inset-x-0 h-1.5 bg-radial from-transparent to-white bg-repeat-x bg-[length:8px_4px] opacity-10" />
            )}

            {/* Logo/Title */}
            {showLogo && (
              <div className="text-center space-y-1">
                <h2 className={`font-black tracking-widest uppercase leading-tight select-all
                  ${selectedPrinter === 'A4' ? 'text-xl text-slate-900 border-b border-slate-200 pb-2 mb-2' : 'text-base text-slate-800'}
                `}>
                  {companyInfo.name || 'AP MODA FITNESS'}
                </h2>
                {companyInfo.subName && (
                  <p className="text-[10px] text-slate-600 font-sans leading-tight">
                    {companyInfo.subName}
                  </p>
                )}
                {companyInfo.cnpj && (
                  <p className="text-[9px] text-slate-500">
                    CNPJ: {companyInfo.cnpj}
                  </p>
                )}
                {showAddress && (companyInfo.addressLine1 || companyInfo.addressLine2) && (
                  <div className="text-[9px] text-slate-500 leading-tight">
                    {companyInfo.addressLine1 && <p>{companyInfo.addressLine1}</p>}
                    {companyInfo.addressLine2 && <p>{companyInfo.addressLine2}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Dynamic Divider */}
            <div className="border-t border-dashed border-slate-300 my-2" />

            {/* COMPROVANTE BOX */}
            <div className="border border-dashed border-slate-300 p-2 text-center text-[10px] space-y-0.5 leading-tight select-none rounded bg-slate-50/50">
              <p className="font-black tracking-wider text-slate-700">COMPROVANTE DE VENDA</p>
              <p className="text-slate-500 text-[8px] uppercase tracking-wide">Este documento não possui valor fiscal</p>
              <p className="text-slate-500 text-[8px] uppercase tracking-wide">Não substitui a NF-e oficial</p>
            </div>

            {/* Dynamic Divider */}
            <div className="border-t border-dashed border-slate-300 my-2" />

            {/* Cupom number and timestamp */}
            <div className="flex justify-between text-[10px] text-slate-700">
              <div>
                <span>Cupom No: </span>
                <span className="font-bold">{sale.id.replace('v-', '').toUpperCase()}</span>
              </div>
              <span className="font-medium text-slate-600">
                {new Date(sale.createdAt).toLocaleDateString('pt-BR')} {new Date(sale.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Customer name and CPF */}
            <div className="flex justify-between text-[10px] mt-1 text-slate-700">
              <span className="truncate pr-2">Cliente: <strong className="font-bold text-slate-800">{sale.clientName}</strong></span>
              {clientCpf && <span className="shrink-0 font-medium text-slate-650">CPF: {clientCpf}</span>}
            </div>

            {sale.salesperson && (
              <div className="flex justify-between text-[10px] text-slate-700">
                <span>Vendedora: <strong className="font-bold text-slate-800">{sale.salesperson}</strong></span>
              </div>
            )}

            {/* Product items section divider */}
            <div className="border-b border-double border-slate-300 py-1" />

            {/* Goods Items section */}
            <div className="py-2">
              <p className="font-black text-slate-700 tracking-wider text-[10px] mb-1.5 uppercase">Itens da Compra</p>
              
              {selectedPrinter === 'A4' ? (
                /* A4 structured table */
                <table className="w-full text-left border-collapse border border-slate-200 text-[10.5px] rounded-lg overflow-hidden my-1">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200">
                      <th className="p-2 font-bold text-slate-700 w-1/2">Descrição</th>
                      <th className="p-2 font-bold text-slate-700 text-center">Qtde.</th>
                      <th className="p-2 font-bold text-slate-700 text-right">Preço Un.</th>
                      <th className="p-2 font-bold text-slate-700 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sale.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2 text-slate-800 font-medium">{item.name}</td>
                        <td className="p-2 text-center text-slate-600 font-bold">{item.quantity}</td>
                        <td className="p-2 text-right text-slate-600">{formatCurrency(item.price)}</td>
                        <td className="p-2 text-right font-extrabold text-slate-900">{formatCurrency(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                /* POS traditional receipt list */
                <div className="space-y-1.5 divide-y divide-slate-100 max-h-56 overflow-y-auto pr-0.5">
                  {sale.items.map((item, idx) => (
                    <div key={idx} className="pt-1.5 first:pt-0 leading-tight">
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-850 truncate max-w-[170px]">{item.name}</span>
                        <span className="font-extrabold pr-0.5">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                      <p className="text-[9px] text-slate-500 font-sans mt-0.5">
                        {item.quantity} un x {formatCurrency(item.price)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calculations subtotals divider */}
            <div className="border-t border-dashed border-slate-300 my-1.5" />

            {/* Calculations subtotals */}
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal dos itens</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-500 font-medium">
                  <span>Desconto de Amostragem ({discountPercent}%)</span>
                  <span>- {formatCurrency(discountAmount)}</span>
                </div>
              )}
            </div>

            {/* TOTAL high contrast layout style block */}
            <div className="bg-slate-900 text-white rounded-xl p-3 flex items-center justify-between mt-2.5 my-1.5 tracking-wide select-all">
              <span className="text-[10px] font-extrabold">TOTAL COMPROVADO</span>
              <span className="text-sm font-black">{formatCurrency(finalTotal)}</span>
            </div>

            {/* Payment layout block */}
            <div className="py-1 flex flex-col space-y-1 text-[10px] text-slate-700">
              <div className="flex justify-between border-b border-dashed border-slate-200 pb-1">
                <span className="font-medium text-slate-450 uppercase text-[9px]">Meio de Pagamento</span>
                {sale.payments && sale.payments.length > 0 ? (
                  <span className="font-bold text-slate-800 uppercase tracking-wider">{sale.payments.map(p => p.method).join(' + ')}</span>
                ) : (
                  <span className="font-bold text-slate-800">PIX</span>
                )}
              </div>
              
              {sale.payments && sale.payments.length > 0 && (
                <div className="space-y-0.5 pl-2 font-sans text-[10px]">
                  {sale.payments.map((p, idx) => {
                    const extra = (p as any).installments 
                      ? ` (${(p as any).installments}x na ${((p as any).cardMachine || '').toUpperCase()})`
                      : '';
                    const discountRate = (p as any).cardDiscountPercent || 0;
                    const feeRate = (p as any).cardFeePercent || 0;
                    const receivedAmount = (p as any).receivedCash || 0;
                    const changeVal = (p as any).changeAmount || 0;
                    const cMethod = (p as any).changeMethod || 'Espécie';

                    return (
                      <div key={idx} className="border-b border-dashed border-slate-100 last:border-0 pb-1 mb-1">
                        <div className="flex justify-between text-slate-600 font-medium">
                          <span>• {p.method}{extra}</span>
                          <span className="font-mono font-bold text-slate-755">{formatCurrency(p.amount)}</span>
                        </div>
                        {discountRate > 0 && (
                          <div className="text-[8.5px] text-emerald-600 ml-3 flex justify-between">
                            <span>↳ Desc. Maquininha ({discountRate}%)</span>
                            <span>-{formatCurrency(p.amount * discountRate / 100)}</span>
                          </div>
                        )}
                        {feeRate > 0 && (
                          <div className="text-[8.5px] text-rose-500 ml-3 flex justify-between">
                            <span>↳ Tarifa Máquina ({feeRate}%)</span>
                            <span>{formatCurrency(p.amount * feeRate / 100)}</span>
                          </div>
                        )}
                        {p.method === 'Dinheiro' && receivedAmount > p.amount && (
                          <div className="ml-3 text-[8.5px] text-slate-500 space-y-0.5">
                            <div className="flex justify-between">
                              <span>↳ Recebido em Dinheiro:</span>
                              <span>{formatCurrency(receivedAmount)}</span>
                            </div>
                            <div className="flex justify-between text-emerald-600 font-semibold">
                              <span>↳ Troco Devolvido ({cMethod === 'Pix' ? 'Via PIX' : 'Em Dinheiro'}):</span>
                              <span>{formatCurrency(changeVal || (receivedAmount - p.amount))}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer space divider */}
            <div className="border-t border-dashed border-slate-300 my-2" />

            {/* Footers information Slogan */}
            <div className="text-center text-[10px] text-slate-600 space-y-0.5 font-sans leading-normal">
              <p className="font-medium">Obrigado pela preferência e confiança!</p>
              {companyInfo.slogan && (
                <p className="font-mono text-[9px] font-extrabold text-slate-800 uppercase">
                  {companyInfo.slogan}
                </p>
              )}
              {companyInfo.addressLine2 && (
                <p className="text-[9px]">
                  {companyInfo.addressLine2}
                </p>
              )}
            </div>

            {/* Pix key dynamic QRCode section in layout */}
            {showQrCode && companyInfo.pixKey ? (
              <div className="py-1 select-all mt-2.5 text-center font-sans space-y-2 flex flex-col items-center justify-center">
                <div className="border-t border-dashed border-slate-300 w-full mb-1" />
                <p className="text-[9px] font-bold text-slate-550 uppercase tracking-widest select-none">Pague com Pix instantâneo</p>
                <div id="pix-qr-print-wrapper" className="p-2 border border-slate-200 rounded-xl bg-white w-28 h-28 flex items-center justify-center">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(pixPayload)}`}
                    alt="Pix QR Code"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-0.5 leading-snug">
                  <p className="text-[8px] text-slate-400 uppercase">Chave Pix Emissor:</p>
                  <p className="text-[9px] font-bold text-slate-700 font-mono select-all truncate max-w-[200px] lowercase">{companyInfo.pixKey}</p>
                </div>
              </div>
            ) : null}

            {/* Dynamic reference and thank you */}
            <div className="border-t border-dashed border-slate-300 my-2" />
            <div className="text-center text-[8px] leading-snug text-slate-450 mt-1 space-y-0.5">
              <p className="font-mono select-all">Ref: 800{sale.id.replace('v-', '')}4474-{sale.createdAt.slice(-2)}y</p>
              {companyInfo.instructions && (
                <p className="font-sans leading-normal px-2 max-w-[240px] mx-auto text-slate-500">
                  {companyInfo.instructions}
                </p>
              )}
            </div>

            {/* Blank tear spacer Lines */}
            {cutLinesCount > 0 && selectedPrinter !== '100x150' && (
              <div 
                className="no-print select-none border-t border-dashed border-slate-200 text-center text-slate-400 relative mt-4 pt-1"
                style={{ height: `${cutLinesCount * 22}px` }}
              >
                <div className="flex items-center justify-center gap-1.5 text-[8.5px] font-mono mt-1 font-semibold">
                  <Scissors size={10} className="text-slate-400" />
                  <span>Corte após avanço da bobina</span>
                </div>
              </div>
            )}

            {/* Paper jagged footer simulation */}
            {selectedPrinter !== 'A4' && selectedPrinter !== '100x150' && (
              <div className="absolute bottom-0 inset-x-0 h-1.5 bg-radial from-transparent to-white bg-repeat-x bg-[length:8px_4px] transform rotate-180 opacity-10" />
            )}
          </div>
          
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
