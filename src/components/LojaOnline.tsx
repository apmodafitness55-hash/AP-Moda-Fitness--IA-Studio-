/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Percent, 
  ShoppingBag, 
  Copy, 
  ExternalLink, 
  Tag, 
  Plus, 
  Check, 
  Flame, 
  Smartphone, 
  Clock, 
  Trash2, 
  MessageCircle,
  Eye,
  Filter,
  Instagram,
  Share2,
  Settings,
  Image,
  Undo,
  Save,
  Sliders,
  ChevronRight,
  HelpCircle,
  AlertTriangle,
  Search,
  X,
  ChevronLeft,
  Megaphone
} from 'lucide-react';
import { Product } from '../types';
import { getCatalogUrl } from '../config';
import AbandonedCarts from './AbandonedCarts';
import { pushSystemConfigToFirebase } from '../firebase';
import ImageUploader from './ImageUploader';
import { MarketingSalesHub } from './MarketingSalesHub';

interface LojaOnlineProps {
  products: Product[];
  onEnterCustomerView?: () => void;
  activeSubTab?: 'compartilhar' | 'cupons' | 'vitrine' | 'recuperacao' | 'marketing';
  setActiveSubTab?: (subTab: 'compartilhar' | 'cupons' | 'vitrine' | 'recuperacao' | 'marketing') => void;
  checkouts?: any[];
  setCheckouts?: React.Dispatch<React.SetStateAction<any[]>>;
  onSyncCheckouts?: () => void;
  onAddProduct?: (product: Product) => void;
  onUpdateProduct?: (product: Product) => void;
}

export interface Coupon {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minPurchase: number;
  limitUses: number;
  usedCount: number;
  validUntil: string;
}

export default function LojaOnline({ 
  products, 
  onEnterCustomerView,
  activeSubTab: propActiveSubTab,
  setActiveSubTab: propSetActiveSubTab,
  checkouts = [],
  setCheckouts = () => {},
  onSyncCheckouts,
  onAddProduct,
  onUpdateProduct
}: LojaOnlineProps) {
  const [internalActiveSubTab, setInternalActiveSubTab] = useState<'compartilhar' | 'cupons' | 'vitrine' | 'recuperacao' | 'marketing'>('compartilhar');
  const activeSubTab = propActiveSubTab || internalActiveSubTab;
  const setActiveSubTab = propSetActiveSubTab || setInternalActiveSubTab;
  const [copiedLink, setCopiedLink] = useState(false);

  // Bio state handlers with localStorage persistence
  const [instaBio, setInstaBio] = useState(() => {
    return localStorage.getItem('ap_insta_bio') || 
`🌸 AP Moda Fitness • Moda Premium
✨ Looks de alta compressão e zero transparência
👇 Monte seu carrinho de compras e finalize no WhatsApp:
{link}`;
  });

  const [whatsappBio, setWhatsappBio] = useState(() => {
    return localStorage.getItem('ap_whatsapp_bio') || 
`AP Moda Fitness • Peças de alta tecnologia e caimento perfeito. Acesse nosso catálogo online e veja as novidades: {link}`;
  });

  const [isSavedBios, setIsSavedBios] = useState(false);
  const [copiedInsta, setCopiedInsta] = useState(false);
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);

  const handleSaveBios = () => {
    localStorage.setItem('ap_insta_bio', instaBio);
    localStorage.setItem('ap_whatsapp_bio', whatsappBio);
    setIsSavedBios(true);
    setTimeout(() => setIsSavedBios(false), 2000);
  };

  const handleCopyInstaBio = () => {
    const text = instaBio.replace('{link}', getCatalogLink());
    navigator.clipboard.writeText(text);
    setCopiedInsta(true);
    setTimeout(() => setCopiedInsta(false), 2000);
  };

  const handleCopyWhatsappBio = () => {
    const text = whatsappBio.replace('{link}', getCatalogLink());
    navigator.clipboard.writeText(text);
    setCopiedWhatsapp(true);
    setTimeout(() => setCopiedWhatsapp(false), 2000);
  };

  const handleApplyPresetInsta = (preset: string) => {
    setInstaBio(preset);
  };

  const handleApplyPresetWhatsapp = (preset: string) => {
    setWhatsappBio(preset);
  };

  const getCatalogLink = () => {
    return getCatalogUrl();
  };

  const handleCopyCatalogLink = () => {
    const link = getCatalogLink();
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Coupon listing state
  const [coupons, setCoupons] = useState<Coupon[]>([
    { code: 'FITNESS10', type: 'percent', value: 10, minPurchase: 150, limitUses: 100, usedCount: 32, validUntil: '2026-06-30' },
    { code: 'BEMVINDA50', type: 'fixed', value: 50, minPurchase: 300, limitUses: 50, usedCount: 15, validUntil: '2026-07-15' },
    { code: 'FRETEGRATIS', type: 'percent', value: 0, minPurchase: 399, limitUses: 500, usedCount: 88, validUntil: '2026-12-31' }
  ]);

  // Form states for creating new coupon
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'percent' | 'fixed'>('percent');
  const [newValue, setNewValue] = useState(10);
  const [newMinPurchase, setNewMinPurchase] = useState(100);
  const [newLimitUses, setNewLimitUses] = useState(100);
  const [newValidUntil, setNewValidUntil] = useState('2026-07-31');

  // Interactive Public Showcase State (Mock e-commerce preview)
  const [previewCategory, setPreviewCategory] = useState('Todos');
  const [vitrineCart, setVitrineCart] = useState<{ product: Product; qty: number }[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponInput, setCouponInput] = useState('');

  // Storefront dynamic settings with localStorage & Firebase syncing
  const [storeName, setStoreName] = useState(() => localStorage.getItem('ap_vitrine_store_name') || 'AP Moda Fitness');
  const [storeSub, setStoreSub] = useState(() => localStorage.getItem('ap_vitrine_store_sub') || 'Moda Fitness Premium');
  const [themeColor, setThemeColor] = useState(() => localStorage.getItem('ap_vitrine_theme_color') || '#db2777');
  const [activeAnimation, setActiveAnimation] = useState(() => localStorage.getItem('ap_vitrine_active_animation') || 'shimmer-luxury');

  const [benefitCards, setBenefitCards] = useState(() => {
    try {
      const saved = localStorage.getItem('ap_vitrine_benefit_cards');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 4) return parsed;
      }
    } catch (e) {}
    return [
      { id: 1, title: 'Envio para todo o Brasil', subtitle: 'Correios ou Transportadora' },
      { id: 2, title: 'Até 6x no Cartão', subtitle: 'Parcelamento facilitado' },
      { id: 3, title: 'Compra 100% Segura', subtitle: 'Seus dados protegidos' },
      { id: 4, title: 'Desconto Extra no Pix', subtitle: 'Ganhe 5% OFF Extra!' }
    ];
  });

  const [lookbookSlides, setLookbookSlides] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('ap_vitrine_slides');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = parsed.map((slide, idx) => {
            const updated = {
              ...slide,
              category: slide.category || (idx === 0 ? 'Todos' : idx === 1 ? 'Conjuntos' : 'Slim Fit')
            };
            const hasWholesale = idx === 0 || 
              (updated.title && (updated.title.toLowerCase().includes("atacado") || updated.title.toLowerCase().includes("lote"))) ||
              (updated.desc && (updated.desc.toLowerCase().includes("atacado") || updated.desc.toLowerCase().includes("lote"))) ||
              (updated.tag && (updated.tag.toLowerCase().includes("atacado") || updated.tag.toLowerCase().includes("lote")));
            
            if (hasWholesale) {
              updated.title = "COLEÇÃO EXCLUSIVA — ALTA PERFORMANCE";
              updated.desc = "Tecnologia respirável com costura reforçada e poliamida biodegradável premium para o seu treino.";
              updated.tag = "COLEÇÃO EXCLUSIVA";
            }
            return updated;
          });
          localStorage.setItem('ap_vitrine_slides', JSON.stringify(sanitized));
          return sanitized;
        }
      }
    } catch (e) {}
    return [
      {
        image: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=1100&q=80",
        tag: "COLEÇÃO EXCLUSIVA",
        title: "COLEÇÃO EXCLUSIVA — ALTA PERFORMANCE",
        desc: "Tecnologia respirável com costura reforçada e poliamida biodegradável premium para o seu treino.",
        category: "Todos"
      },
      {
        image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1100&q=80",
        tag: "NOVA COLEÇÃO 2 EM 1",
        title: "COLEÇÃO DUO",
        desc: "Experimente peças de alta compressão e toque sensorial único. Confira Lançamentos!",
        category: "Conjuntos"
      },
      {
        image: "https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?w=1100&q=80",
        tag: "ALTA PERFORMANCE",
        title: "SUA JORNADA RUN",
        desc: "Tecnologia respirável com costura reforçada e poliamida biodegradável premium.",
        category: "Slim Fit"
      }
    ];
  });

  const [tickerConfig, setTickerConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('ap_vitrine_announcement');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return {
      show: true,
      text: "⚡ ENVIAMOS PARA TODO BRASIL • FRETE GRÁTIS ACIMA DE R$ 399 ATÉ 6X SEM JUROS ⚡",
      bgColor: "#db2777",
      textColor: "#ffffff"
    };
  });

  const [categoryBanners, setCategoryBanners] = useState(() => {
    try {
      const saved = localStorage.getItem('ap_vitrine_category_banners');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return {
      slimFit: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600&q=80",
      plusSize: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&q=80"
    };
  });

  const [floatingBanner, setFloatingBanner] = useState(() => {
    try {
      const saved = localStorage.getItem('ap_vitrine_floating_banner');
      if (saved) return JSON.parse(saved);
    } catch(e){}
    return {
      show: true,
      title: "✨ CUPOM DA SEMANA",
      subtitle: "Insira APMODAFIT no carrinho para ganhar 5% OFF e frete grátis!",
      ctaText: "Aproveitar Desconto",
      ctaLink: "https://wa.me/5511999990000?text=Quero%20aproveitar%20o%20cupom%20de%20desconto",
      bgColor: "#ec4899",
      textColor: "#ffffff"
    };
  });

  // States for Quick Product Creation
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Conjuntos');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCost, setNewProdCost] = useState('');
  const [newProdStock, setNewProdStock] = useState('10');
  const [newProdMinStock, setNewProdMinStock] = useState('3');
  const [newProdImage, setNewProdImage] = useState('https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&q=80');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdSizes, setNewProdSizes] = useState<string[]>(['P', 'M', 'G']);
  const [newProdColors, setNewProdColors] = useState<string[]>(['Preto', 'Bordô']);

  const [isSavingConfigs, setIsSavingConfigs] = useState(false);
  const [activeConfigTab, setActiveConfigTab] = useState<'textos' | 'banners' | 'categorias' | 'cadastro' | 'estoque'>('textos');

  // Customer experience interactive states
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [detailQty, setDetailQty] = useState<number>(1);

  // Simulated CEP / Freight Calculator
  const [cepInput, setCepInput] = useState<string>('');
  const [isCalculatingFreight, setIsCalculatingFreight] = useState<boolean>(false);
  const [freightCalculated, setFreightCalculated] = useState<boolean>(false);
  const [selectedFreightOption, setSelectedFreightOption] = useState<'pac' | 'sedex' | null>(null);
  const [freightCost, setFreightCost] = useState<number>(0);
  const [freightDuration, setFreightDuration] = useState<string>('');

  // Inventory Quick Management Filter State
  const [inventorySearch, setInventorySearch] = useState<string>('');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockVal, setEditingStockVal] = useState<number>(0);

  // Lookbook slider active index
  const [activeSlideIdx, setActiveSlideIdx] = useState<number>(0);

  const handleSaveStorefrontTexts = async () => {
    setIsSavingConfigs(true);
    try {
      localStorage.setItem('ap_vitrine_store_name', storeName);
      localStorage.setItem('ap_vitrine_store_sub', storeSub);
      localStorage.setItem('ap_vitrine_theme_color', themeColor);
      localStorage.setItem('ap_vitrine_active_animation', activeAnimation);
      
      await pushSystemConfigToFirebase('ap_vitrine_store_name', storeName);
      await pushSystemConfigToFirebase('ap_vitrine_store_sub', storeSub);
      await pushSystemConfigToFirebase('ap_vitrine_theme_color', themeColor);
      await pushSystemConfigToFirebase('ap_vitrine_active_animation', activeAnimation);
      
      // Dispatch custom storage sync event to notify PublicCatalog instantly
      window.dispatchEvent(new Event('ap-storage-synced'));
      
      alert('Configurações de Identidade e Efeitos Sazonais salvas e sincronizadas com o Firebase com sucesso!');
    } catch (e) {
      console.error(e);
      alert('Erro ao sincronizar com o Firebase, mas os dados foram salvos localmente.');
    } finally {
      setIsSavingConfigs(false);
    }
  };

  const handleSaveTickerConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfigs(true);
    try {
      localStorage.setItem('ap_vitrine_announcement', JSON.stringify(tickerConfig));
      await pushSystemConfigToFirebase('ap_vitrine_announcement', JSON.stringify(tickerConfig));
      alert('Anúncio Rotativo (Ticker) salvo e sincronizado com o Firebase com sucesso!');
    } catch (e) {
      console.error(e);
      alert('Salvo localmente.');
    } finally {
      setIsSavingConfigs(false);
    }
  };

  const handleSaveBenefitCards = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfigs(true);
    try {
      localStorage.setItem('ap_vitrine_benefit_cards', JSON.stringify(benefitCards));
      await pushSystemConfigToFirebase('ap_vitrine_benefit_cards', JSON.stringify(benefitCards));
      alert('Cards de Benefícios salvos e sincronizados com o Firebase com sucesso!');
      
      // Dispatch storage synced event to update immediately
      window.dispatchEvent(new Event('ap-storage-synced'));
    } catch (e) {
      console.error(e);
      alert('Erro ao sincronizar com o Firebase, mas os dados foram salvos localmente.');
    } finally {
      setIsSavingConfigs(false);
    }
  };

  const handleSaveFloatingBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfigs(true);
    try {
      localStorage.setItem('ap_vitrine_floating_banner', JSON.stringify(floatingBanner));
      await pushSystemConfigToFirebase('ap_vitrine_floating_banner', JSON.stringify(floatingBanner));
      alert('Banner Flutuante Promocional salvo e sincronizado com o Firebase com sucesso!');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingConfigs(false);
    }
  };

  const handleSaveLookbookSlides = async (updatedSlides: any[]) => {
    setIsSavingConfigs(true);
    try {
      setLookbookSlides(updatedSlides);
      localStorage.setItem('ap_vitrine_slides', JSON.stringify(updatedSlides));
      await pushSystemConfigToFirebase('ap_vitrine_slides', JSON.stringify(updatedSlides));
      alert('Banners de Slide do Lookbook salvos e sincronizados com o Firebase com sucesso!');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingConfigs(false);
    }
  };

  const handleSaveCategoryBanners = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfigs(true);
    try {
      localStorage.setItem('ap_vitrine_category_banners', JSON.stringify(categoryBanners));
      await pushSystemConfigToFirebase('ap_vitrine_category_banners', JSON.stringify(categoryBanners));
      alert('Imagens de Destaque das Categorias salvas e sincronizadas com o Firebase com sucesso!');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingConfigs(false);
    }
  };

  const handleQuickAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice) {
      alert('Por favor, insira o nome e o preço da nova peça!');
      return;
    }

    const priceNum = parseFloat(newProdPrice);
    const costNum = newProdCost ? parseFloat(newProdCost) : parseFloat((priceNum * 0.45).toFixed(2));

    const newProductObj: Product = {
      id: 'prod-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name: newProdName,
      sku: newProdSku || 'PECA-' + Math.floor(1000 + Math.random() * 9000),
      category: newProdCategory,
      price: priceNum,
      cost: costNum,
      stock: parseInt(newProdStock) || 0,
      minStock: parseInt(newProdMinStock) || 0,
      image: newProdImage || 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&q=80',
      description: newProdDescription || 'Peça fitness premium modeladora de alta qualidade.',
      sizes: newProdSizes,
      colors: newProdColors,
      salesCount: 0
    };

    if (onAddProduct) {
      onAddProduct(newProductObj);
      alert(`Peça "${newProdName}" cadastrada com sucesso e sincronizada em tempo real com o banco de dados Firebase!`);
      // Clear form fields
      setNewProdName('');
      setNewProdSku('');
      setNewProdPrice('');
      setNewProdCost('');
      setNewProdStock('10');
      setNewProdMinStock('3');
      setNewProdDescription('');
    } else {
      alert('Função de adição de produtos não encontrada no componente pai (App.tsx), mas simulada com sucesso!');
    }
  };

  // Extract categories for vitrine
  const categoriesList = useMemo(() => {
    const list = new Set(products.map(p => p.category));
    return ['Todos', ...Array.from(list)];
  }, [products]);

  // Filter products for vitrine
  const vitrineProducts = useMemo(() => {
    return products.filter(p => {
      const categoryMatch = previewCategory === 'Todos' || p.category === previewCategory;
      return categoryMatch && p.stock > 0; // Show only instock items on the e-commerce client view!
    });
  }, [products, previewCategory]);

  // Actions for Vitrine Cart
  const handleAddToVitrineCart = (product: Product) => {
    setVitrineCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const handleRemoveFromVitrineCart = (prodId: string) => {
    setVitrineCart(prev => prev.filter(item => item.product.id !== prodId));
  };

  const handleApplyCouponInVitrine = () => {
    const matched = coupons.find(c => c.code.toUpperCase() === couponInput.toUpperCase().trim());
    if (!matched) {
      alert('Cupom de desconto inválido ou inexistente!');
      return;
    }
    setAppliedCoupon(matched);
    alert(`Cupom ${matched.code} aplicado com sucesso na Vitrine Online!`);
  };

  // Cart financial computations
  const cartSubtotal = useMemo(() => {
    return vitrineCart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
  }, [vitrineCart]);

  const cartDiscountAmt = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (cartSubtotal < appliedCoupon.minPurchase) {
      return 0; // Below minimum purchase requirement
    }
    if (appliedCoupon.type === 'percent') {
      return Number(((cartSubtotal * appliedCoupon.value) / 100).toFixed(2));
    } else {
      return appliedCoupon.value;
    }
  }, [appliedCoupon, cartSubtotal]);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - cartDiscountAmt + (freightCost || 0));
  }, [cartSubtotal, cartDiscountAmt, freightCost]);

  // Generate WhatsApp payload for vitrine order checkout
  const sendVitrineOrderWhatsApp = () => {
    if (vitrineCart.length === 0) {
      alert('Seu carrinho está vazio para checkout!');
      return;
    }

    const itemsText = vitrineCart.map(it => `• ${it.qty}x ${it.product.name} (R$ ${it.product.price.toFixed(2)})`).join('\n');
    const discountText = appliedCoupon ? `\n🏷️ Cupom Aplicado: *${appliedCoupon.code}* (-R$ ${cartDiscountAmt.toFixed(2)})` : '';
    const shippingText = freightCost > 0 ? `\n🚚 Frete (${selectedFreightOption?.toUpperCase()}): R$ ${freightCost.toFixed(2)} (Prazo: ${freightDuration})\n📍 CEP Destino: ${cepInput}` : '';
    const totalPecas = Math.max(0, cartSubtotal - cartDiscountAmt);
    
    const message = `Olá, AP Moda Fitness! 🌸\n\nAcabei de ver suas peças na sua *Vitrine Online* e montei meu carrinho de compras!\n\n🛍️ *Meu Carrinho:*\n${itemsText}${discountText}${shippingText}\n\n💵 *Subtotal:* R$ ${cartSubtotal.toFixed(2)}\n💸 *Total das Peças:* R$ ${totalPecas.toFixed(2)}\n💰 *Valor Final com Frete:* R$ ${cartTotal.toFixed(2)}\n\nPode confirmar se essas peças estão disponíveis e os prazos? Obrigada!`;

    try {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
    } catch {
      alert(`Mensagem do carrinho enviada de forma simulada:\n\n${message}`);
    }
  };

  const handleCreateCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || newValue < 0) {
      alert('Preencha o código do cupom e o valor de desconto!');
      return;
    }

    const uppercaseCode = newCode.trim().toUpperCase();
    if (coupons.some(c => c.code === uppercaseCode)) {
      alert('Este código de cupom já existe no sistema!');
      return;
    }

    const newCouponItem: Coupon = {
      code: uppercaseCode,
      type: newType,
      value: Number(newValue),
      minPurchase: Number(newMinPurchase),
      limitUses: Number(newLimitUses),
      usedCount: 0,
      validUntil: newValidUntil
    };

    setCoupons(prev => [newCouponItem, ...prev]);
    setNewCode('');
    setNewValue(10);
    setNewMinPurchase(100);
    alert(`Cupom ${uppercaseCode} cadastrado com sucesso e já está ativo para uso!`);
  };

  const handleDeleteCoupon = (code: string) => {
    if (confirm(`Excluir o cupom ${code}? Ele não poderá mais ser usado por clientes.`)) {
      setCoupons(prev => prev.filter(c => c.code !== code));
    }
  };

  const openLojaHtmlNewTab = () => {
    // Generate a beautiful popup simulating opening loja.html to test e-commerce
    alert('Boutique Online Integrada!\n\nSeu catálogo de pedidos rápido "loja.html" foi carregado com conexão direta ao banco Firebase e cache offline localStorage. Você pode testá-lo usando a Vitrine Virtual no painel ao lado para ver exatamente como sua cliente visualiza a vitrine de qualquer celular ou tablet!');
  };

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-sans text-slate-800 tracking-tight">Loja Online, Vitrine & Cupons</h2>
          <p className="text-slate-400 text-sm">Gerencie cupons ativos, crie códigos promocionais temporários e simule a vitrine do seu e-commerce</p>
        </div>

        {/* Action Link buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopyCatalogLink}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-sans font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer active:scale-97 shadow-xs text-center"
          >
            {copiedLink ? <Check size={14} className="text-green-400" /> : <Copy size={13} />}
            <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link do Catálogo'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.open(getCatalogLink(), '_blank')}
            className="inline-flex items-center gap-2 bg-pink-100 hover:bg-pink-200 text-pink-700 font-sans font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer active:scale-97 text-center"
          >
            <ExternalLink size={14} />
            <span>Ver Catálogo Online (Cliente)</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveSubTab('compartilhar')}
          className={`px-4 py-2.5 font-sans text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap
            ${activeSubTab === 'compartilhar' 
              ? 'border-pink-600 text-pink-600' 
              : 'border-transparent text-slate-450 hover:text-slate-700'}`}
        >
          <Share2 size={14} className={activeSubTab === 'compartilhar' ? 'text-pink-600' : 'text-slate-400'} />
          <span>Compartilhar Vitrine & Bios</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('cupons')}
          className={`px-4 py-2.5 font-sans text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap
            ${activeSubTab === 'cupons' 
              ? 'border-pink-600 text-pink-600' 
              : 'border-transparent text-slate-450 hover:text-slate-700'}`}
        >
          <Percent size={14} className={activeSubTab === 'cupons' ? 'text-pink-600' : 'text-slate-400'} />
          <span>Gestão de Cupons Promocionais</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('vitrine')}
          className={`px-4 py-2.5 font-sans text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap
            ${activeSubTab === 'vitrine' 
              ? 'border-pink-600 text-pink-600' 
              : 'border-transparent text-slate-450 hover:text-slate-700'}`}
        >
          <Smartphone size={14} className={activeSubTab === 'vitrine' ? 'text-pink-600' : 'text-slate-400'} />
          <span>Vitrine de Clientes (Preview)</span>
        </button>
        <button
          id="tab-recuperacao-btn"
          type="button"
          onClick={() => setActiveSubTab('recuperacao')}
          className={`px-4 py-2.5 font-sans text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap
            ${activeSubTab === 'recuperacao' 
              ? 'border-pink-600 text-pink-600' 
              : 'border-transparent text-slate-450 hover:text-slate-700'}`}
        >
          <Sparkles size={14} className={activeSubTab === 'recuperacao' ? 'text-pink-600' : 'text-slate-400'} />
          <span>Carrinhos Abandonados (IA)</span>
        </button>
        <button
          id="tab-marketing-btn"
          type="button"
          onClick={() => setActiveSubTab('marketing')}
          className={`px-4 py-2.5 font-sans text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap
            ${activeSubTab === 'marketing' 
              ? 'border-pink-600 text-pink-600' 
              : 'border-transparent text-slate-450 hover:text-slate-700'}`}
        >
          <Megaphone size={14} className={activeSubTab === 'marketing' ? 'text-pink-600' : 'text-slate-400'} />
          <span>Central de Marketing & Vendas</span>
        </button>
      </div>

      {/* Tab: Compartilhar & Bios de Redes Sociais */}
      {activeSubTab === 'compartilhar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
          
          {/* Main settings column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Link & QR Code Section */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5">
              <div className="flex flex-col md:flex-row items-center gap-6">
                
                {/* Simulated Beautiful QR Code Card with scanning animation */}
                <div className="w-full md:w-44 shrink-0 flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-150 rounded-2xl relative overflow-hidden group select-none">
                  {/* Subtle scan bar animating over mockup */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-pink-500 shadow-md shadow-pink-400 animate-bounce duration-3000 pointer-events-none" />
                  
                  {/* Mini Grid resembling QR Code */}
                  <div className="w-32 h-32 bg-white rounded-lg p-2 border border-slate-200/60 flex flex-col justify-between relative shadow-xs">
                    <div className="flex justify-between">
                      <div className="w-7 h-7 border-4 border-slate-800 rounded-sm flex items-center justify-center">
                        <div className="w-2 h-2 bg-slate-800 rounded-xs" />
                      </div>
                      <div className="w-7 h-7 border-4 border-slate-800 rounded-sm flex items-center justify-center">
                        <div className="w-2 h-2 bg-slate-800 rounded-xs" />
                      </div>
                    </div>

                    {/* Dotted texture resembling QR payload */}
                    <div className="flex-1 py-1 flex flex-col justify-around">
                      <div className="flex justify-around gap-1 px-1">
                        <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                        <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                        <span className="w-1.5 h-1.5 bg-slate-700 rounded-full" />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                      </div>
                      <div className="flex justify-around gap-1 px-1">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                        <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                        <span className="w-1.5 h-1.5 bg-pink-600 rounded-full" />
                        <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                        <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                      </div>
                      <div className="flex justify-around gap-1 px-1">
                        <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
                        <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                        <span className="w-1.5 h-1.5 bg-pink-600 rounded-full" />
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <div className="w-7 h-7 border-4 border-slate-800 rounded-sm flex items-center justify-center">
                        <div className="w-2 h-2 bg-slate-800 rounded-xs" />
                      </div>
                      {/* Logo center accent */}
                      <span className="text-[10px] font-black text-pink-600 absolute inset-0 m-auto w-fit h-fit bg-white px-1.5 py-0.5 border border-slate-200 shadow-xs rounded">AP</span>
                      
                      <div className="w-7 p-0.5 flex flex-wrap gap-0.5 justify-end">
                        <span className="w-1.5 h-1.5 bg-slate-800 rounded-xs" />
                        <span className="w-1.5 h-1.5 bg-slate-800 rounded-xs" />
                        <span className="w-1.5 h-1.5 bg-slate-800 rounded-xs" />
                        <span className="w-1.5 h-1.5 bg-slate-800 rounded-xs" />
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold tracking-wider mt-2.5 uppercase">QR Code da Vitrine</span>
                </div>

                {/* Info and action */}
                <div className="flex-1 space-y-3.5 text-center md:text-left">
                  <div>
                    <span className="bg-pink-100/70 border border-pink-200/50 text-pink-700 font-bold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider inline-block">Sua vitrine está pronta</span>
                    <h3 className="text-base font-bold text-slate-800 mt-1.5">Catalogo de Pedidos Online</h3>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">Você já pode enviar o link direto para suas clientes em canais de chat ou fixá-lo na seção de "Link da Bio" nas suas redes oficiais!</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 flex items-center justify-between gap-3 overflow-hidden">
                    <span className="font-mono text-xs text-slate-650 truncate select-all">{getCatalogLink()}</span>
                    <button
                      type="button"
                      onClick={handleCopyCatalogLink}
                      className="shrink-0 inline-flex items-center gap-1.5 text-pink-600 hover:text-pink-700 font-bold text-xs"
                    >
                      {copiedLink ? <Check size={14} className="text-green-500" /> : <Copy size={13} />}
                      <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2.5 justify-center md:justify-start">
                    <button
                      type="button"
                      onClick={() => window.open(getCatalogLink(), '_blank')}
                      className="inline-flex items-center gap-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 font-bold text-xs px-3.5 py-2 rounded-xl transition"
                    >
                      <ExternalLink size={13} />
                      <span>Ver como cliente</span>
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-white bg-pink-600 hover:bg-pink-700 font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer"
                      onClick={() => alert(`Para exportar o QR Code para panfletos ou tags de roupas:\n\n1. Imprima ou tire um print desta página\n2. Use em canais do Instagram e WhatsApp!`)}
                    >
                      <span>Imprimir Etiquetas QR</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Bios Editing Area */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5">
                <div className="flex justify-between items-center border-b border-slate-50 pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Instagram size={15} className="text-pink-600" />
                      <span>Bios Customizáveis para Redes Sociais</span>
                    </h3>
                    <p className="text-slate-400 text-[11px] mt-0.5">Use o caractere <code className="font-mono bg-slate-100 px-1 rounded text-pink-600 font-semibold">&#123;link&#125;</code> onde deseja que seu link exclusivo seja injetado.</p>
                  </div>

                  {/* Save feedback indicator */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveBios}
                      className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-1.5 rounded-xl transition"
                    >
                      {isSavedBios ? '✓ Salvo!' : 'Salvar Textos'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Instagram Bio config card */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-slate-750 text-xs font-bold flex items-center gap-1">
                        <span>Instagram Bio</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleCopyInstaBio}
                        className="text-[10px] text-pink-600 hover:text-pink-700 font-bold flex items-center gap-1"
                        title="Copiar texto final já com link"
                      >
                        {copiedInsta ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                        <span>{copiedInsta ? 'Link + Bio Copiado!' : 'Copiar c/ Link'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={5}
                      value={instaBio}
                      onChange={(e) => setInstaBio(e.target.value)}
                      placeholder="Bio do Instagram..."
                      className="w-full text-xs font-sans p-3 bg-slate-50 border border-slate-150 rounded-xl focus:outline-hidden text-slate-755 leading-relaxed resize-none"
                    />
                  </div>

                  {/* WhatsApp Bio config card */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-slate-750 text-xs font-bold flex items-center gap-1">
                        <span>WhatsApp Recado / Grupo Info</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleCopyWhatsappBio}
                        className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                        title="Copiar recado final"
                      >
                        {copiedWhatsapp ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                        <span>{copiedWhatsapp ? 'Link + Bio Copiado!' : 'Copiar c/ Link'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={5}
                      value={whatsappBio}
                      onChange={(e) => setWhatsappBio(e.target.value)}
                      placeholder="Status do WhatsApp..."
                      className="w-full text-xs font-sans p-3 bg-slate-50 border border-slate-150 rounded-xl focus:outline-hidden text-slate-755 leading-relaxed resize-none"
                    />
                  </div>
                </div>

                {/* Previews wrapper */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6 pt-5 border-t border-slate-100">
                  
                  {/* INSTAGRAM MOCKUP PREVIEW */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-150 p-4 font-sans select-none relative overflow-hidden">
                    <span className="absolute right-3 top-3 text-[8px] bg-slate-200 text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase">Preview no Instagram</span>
                    
                    {/* Header profile info mockup */}
                    <div className="flex items-center gap-3.5 mb-2.5">
                      <div className="w-12 h-12 rounded-full ring-2 ring-pink-500 p-0.5 bg-white flex-shrink-0">
                        <div className="w-full h-full bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-400 text-xs">AP</div>
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-xs text-slate-800">apmodafitness</p>
                        <div className="flex gap-2.5 text-[10px] text-slate-500 font-medium">
                          <span><strong>142</strong> posts</span>
                          <span><strong>3.8k</strong> seguidores</span>
                        </div>
                      </div>
                    </div>

                    {/* Bio Rendered Text markup with link converted to blue */}
                    <div className="text-[11px] text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                      <p className="font-semibold text-slate-900">AP Moda Fitness | Premium</p>
                      {instaBio.split('{link}')[0]}
                      <span className="text-blue-600 font-medium break-all underline cursor-pointer hover:text-blue-800">{getCatalogLink()}</span>
                      {instaBio.split('{link}')[1] || ''}
                    </div>
                  </div>

                  {/* WHATSAPP MOCKUP PREVIEW */}
                  <div className="bg-emerald-50/40 rounded-2xl border border-emerald-100 p-4 font-sans select-none relative overflow-hidden">
                    <span className="absolute right-3 top-3 text-[8px] bg-emerald-100 text-emerald-600 font-bold px-1.5 py-0.5 rounded uppercase">Preview no WhatsApp</span>
                    
                    {/* Green chat bar simulator */}
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-extrabold text-xs">AP</div>
                      <div>
                        <p className="font-bold text-xs text-slate-800">AP Moda Fitness (Catálogo)</p>
                        <p className="text-slate-400 text-[8px]">Recado de status ativo</p>
                      </div>
                    </div>

                    {/* Bio message simulation */}
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-100/50 shadow-xs max-w-xs text-[11px] text-slate-850 whitespace-pre-wrap leading-relaxed relative">
                      {whatsappBio.split('{link}')[0]}
                      <span className="text-emerald-600 font-semibold break-all underline cursor-pointer">{getCatalogLink()}</span>
                      {whatsappBio.split('{link}')[1] || ''}
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>

          {/* Campaign presets & helper column */}
          <div className="space-y-6">
            
            {/* Presets Card */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-4">
              <h4 className="text-xs font-bold font-sans uppercase tracking-wider text-slate-650 mb-3 flex items-center gap-1.5">
                <Sparkles size={13} className="text-pink-600" />
                <span>Presets Prontos p/ Copiar</span>
              </h4>
              <p className="text-slate-400 text-[10.5px] leading-relaxed mb-4">Escolha abaixo templates criados por especialistas para atualizar suas redes de forma instantânea com temas estratégicos:</p>

              <div className="space-y-3">
                {/* Instagram Presets */}
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Modelos de Bio Instagram</span>
                  <div className="space-y-2">
                    {[
                      {
                        title: "🔥 Looks de Alta Compressão",
                        text: `🌸 AP Moda Fitness • Premium
✨ Looks de altíssima compressão e zero transparência
👇 Monte seu carrinho de compras e finalize no WhatsApp para atendimento VIP:
{link}`
                      },
                      {
                        title: "🎉 Oferta Ativa & Cupom",
                        text: `🛍️ AP Moda Fitness • Pratique com Estilo!
🏷️ 10% OFF EXTRA usando o cupom FITNESS10 no carrinho
👇 Acesse nossa vitrine online atualizada agora:
{link}`
                      },
                      {
                        title: "❄️ Nova Coleção Inverno",
                        text: `⚡ Coleção Nova AP MODA FITNESS Liberada!
📦 Peças exclusivas, confortáveis e premium para seu treino.
👇 Compre fácil pelo link abaixo direto do catálogo:
{link}`
                      }
                    ].map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleApplyPresetInsta(p.text)}
                        className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 active:bg-slate-150 border border-slate-150 rounded-xl transition cursor-pointer text-[11px] font-medium text-slate-700 flex justify-between items-center group"
                      >
                        <span className="truncate pr-2">{p.title}</span>
                        <span className="text-[9px] text-pink-600 font-bold opacity-0 group-hover:opacity-100 transition duration-150">Aplicar →</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* WhatsApp Presets */}
                <div className="pt-2 border-t border-slate-50">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Modelos para WhatsApp</span>
                  <div className="space-y-2">
                    {[
                      {
                        title: "💬 Recado Oficial",
                        text: `Atendimento AP Moda Fitness 🌸 Confira nosso catálogo online atualizado, escolha suas cores e tamanhos favoritos e me envie por aqui! 👇 {link}`
                      },
                      {
                        title: "👗 Conforto & Elasticidade",
                        text: `AP Moda Fitness • Peças lindas que elevam seu treino. Siga-nos no Instagram. Veja novidades no link: {link}`
                      }
                    ].map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleApplyPresetWhatsapp(p.text)}
                        className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 active:bg-slate-150 border border-slate-150 rounded-xl transition cursor-pointer text-[11px] font-medium text-slate-700 flex justify-between items-center group"
                      >
                        <span className="truncate pr-2">{p.title}</span>
                        <span className="text-[9px] text-emerald-600 font-bold opacity-0 group-hover:opacity-100 transition duration-150">Aplicar →</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Helper Tips Card */}
            <div className="bg-grad-sidebar p-4.5 rounded-2xl border border-pink-100/40 space-y-3 font-sans">
              <h4 className="text-xs font-bold text-pink-700 uppercase tracking-wide flex items-center gap-1">
                <span>💡</span>
                <span>Dicas para Bombar de Vender</span>
              </h4>
              <ul className="space-y-2 text-[11px] text-pink-955 leading-relaxed font-medium">
                <li className="flex gap-1.5 items-start">
                  <span>✨</span>
                  <span><strong>Fixe na Bio do Instagram:</strong> Com a bio configurada e copiada, acerte seu perfil no Instagram e coloque o link do catálogo!</span>
                </li>
                <li className="flex gap-1.5 items-start">
                  <span>📱</span>
                  <span><strong>Figurinha nos Stories:</strong> Crie um story mostrando os detalhes de uma peça (como a elasticidade ou tecido) e adicione uma figurinha de "Link" direcionando para seu catálogo.</span>
                </li>
                <li className="flex gap-1.5 items-start">
                  <span>💬</span>
                  <span><strong>Lista de Transmissão:</strong> Envie o link personalizado em massa com um textinho gentil avisando: "Oi flor, chegou reposição da nossa calça favorita, corre pra garantir antes que esgote!"</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      )}

      {/* Tab 1: Coupon Manager */}
      {activeSubTab === 'cupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* List existing coupons */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-4">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1">
                <Tag size={15} className="text-pink-600" />
                <span>Cupons Ativos na Loja Virtual</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coupons.map(coupon => (
                  <div key={coupon.code} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col justify-between hover:shadow-xs transition-all relative overflow-hidden font-sans">
                    {/* Background badge decorative */}
                    <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 opacity-5 pointer-events-none scale-150">
                      <Tag size={80} className="text-slate-900" />
                    </div>

                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono font-bold text-rose-600 tracking-wide bg-rose-50 px-2 py-0.5 rounded text-xs">
                            {coupon.code}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-1">Validade: {coupon.validUntil}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(coupon.code)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Remover Cupom"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="mt-3.5 space-y-1 text-xs text-slate-700">
                        <p className="font-medium">
                          Desconto: <strong className="text-slate-800">{coupon.type === 'percent' ? `${coupon.value}%` : `R$ ${coupon.value.toFixed(2)}`}</strong>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Compra Mínima: <strong className="text-slate-650">R$ {coupon.minPurchase.toFixed(2)}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-slate-200/50 flex justify-between items-center text-[10px] text-slate-400">
                      <span>Usos: <strong className="text-slate-650">{coupon.usedCount} / {coupon.limitUses}</strong></span>
                      <div className="w-24 bg-slate-200 h-1 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-1" style={{ width: `${(coupon.usedCount / coupon.limitUses) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Create Coupon Form */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-4">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-50 pb-2">
              <Plus size={15} className="text-pink-600" />
              <h3 className="text-xs font-bold font-sans uppercase text-slate-700 tracking-wider">Criar Novo Cupom</h3>
            </div>

            <form onSubmit={handleCreateCouponSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Código do Cupom</label>
                <input
                  type="text"
                  required
                  placeholder="EX: APVERAO20"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 font-mono font-bold uppercase focus:outline-hidden text-rose-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Tipo Desconto</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as 'percent' | 'fixed')}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                  >
                    <option value="percent">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Desconto</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newValue}
                    onChange={(e) => setNewValue(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Pedido Mínimo (R$)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newMinPurchase}
                    onChange={(e) => setNewMinPurchase(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Limite de Uso</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newLimitUses}
                    onChange={(e) => setNewLimitUses(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Data Validade</label>
                <input
                  type="date"
                  required
                  value={newValidUntil}
                  onChange={(e) => setNewValidUntil(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-center"
              >
                Cadastrar Código na Nuvem
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Vitrine/Catalog Showcase Preview */}
      {activeSubTab === 'vitrine' && (
        <div className="space-y-4 font-sans">
          {/* Banner calling attention to the new high-fidelity fullscreen catalog */}
          <div className="bg-pink-50 border border-pink-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs font-sans">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-pink-100 rounded-xl text-pink-600 font-bold shrink-0 animate-bounce">
                🌸
              </div>
              <div className="text-left leading-snug">
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">NOVIDADE: Vitrine VIP Premium Ativada!</h4>
                <p className="text-[11px] text-slate-500 font-medium">Lançamos os novos carrosséis de vídeos, lookbooks dinâmicos interativos, calculador de frete por CEP realista e checkout automático via CRM integrado.</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (onEnterCustomerView) {
                  onEnterCustomerView();
                } else {
                  const btn = document.getElementById('sidebar-toggle-btn') || document.querySelector('[title*="cliente"]');
                  if (btn) (btn as HTMLElement).click();
                }
              }}
              className="shrink-0 bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-[10px] md:text-[11px] uppercase tracking-wider px-4 py-2 rounded-full cursor-pointer transition shadow-sm border-none"
            >
              Experimentar Tela Cheia 🚀
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* E-commerce showcase catalog mockup */}
          <div className="lg:col-span-8 bg-slate-900 ring-4 ring-slate-850 rounded-3xl p-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                <span className="text-[10px] text-slate-500 font-mono ml-2">https://apmodafitness.com.br/vitrine</span>
              </div>
              <span className="text-[9px] bg-pink-600/25 border border-pink-500/20 text-pink-400 font-bold px-2 py-0.5 rounded-full select-none">Preview Cliente (E-commerce)</span>
            </div>

            {/* In-Preview Public Header */}
            <div className="bg-slate-950 p-3 rounded-2xl flex justify-between items-center text-xs selection:bg-pink-600 mb-4 border border-slate-850">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-pink-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-pink-500/10">AP</div>
                <span className="font-bold text-white tracking-wide">AP Vitrine Online</span>
              </div>

              {/* public pills category selection */}
              <div className="flex gap-1 overflow-x-auto max-w-xs scrollbar-none py-1">
                {categoriesList.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setPreviewCategory(cat)}
                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors cursor-pointer select-none
                      ${previewCategory === cat ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-850'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* PUBLIC HERO BANNER (SLIDER / CATEGORY HEADER) */}
            {previewCategory === 'Todos' ? (
              /* LOOKBOOK SLIDE CAROUSEL */
              <div className="relative h-44 rounded-2xl overflow-hidden mb-4 bg-slate-950 group">
                {/* Active Slide Background */}
                <div className="absolute inset-0">
                  <img
                    src={lookbookSlides[activeSlideIdx]?.image || "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=1100&q=80"}
                    alt={lookbookSlides[activeSlideIdx]?.title}
                    className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition duration-1000"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20" />
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-4 text-left select-none">
                  <span className="text-[8px] tracking-widest font-extrabold text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full uppercase w-max mb-1">
                    {lookbookSlides[activeSlideIdx]?.tag || 'COLEÇÃO EXCLUSIVA'}
                  </span>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-tight line-clamp-1">
                    {lookbookSlides[activeSlideIdx]?.title || 'CONJUNTO ZERO TRANSPARÊNCIA'}
                  </h3>
                  <p className="text-[10px] text-slate-300 font-medium line-clamp-2 max-w-md">
                    {lookbookSlides[activeSlideIdx]?.desc || 'Looks fitness modeladores com poliamida tecnológica e caimento anatômico.'}
                  </p>
                </div>

                {/* Left/Right controls */}
                <button
                  type="button"
                  onClick={() => setActiveSlideIdx(prev => prev === 0 ? lookbookSlides.length - 1 : prev - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-900/60 hover:bg-pink-600 text-white rounded-full flex items-center justify-center cursor-pointer transition border-none text-[9px] z-10 font-bold"
                >
                  ◀
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlideIdx(prev => prev === lookbookSlides.length - 1 ? 0 : prev + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-900/60 hover:bg-pink-600 text-white rounded-full flex items-center justify-center cursor-pointer transition border-none text-[9px] z-10 font-bold"
                >
                  ▶
                </button>

                {/* Indicators dots */}
                <div className="absolute bottom-2 right-4 flex gap-1 z-10">
                  {lookbookSlides.map((_, idx) => (
                    <span
                      key={idx}
                      onClick={() => setActiveSlideIdx(idx)}
                      className={`w-1 h-1 rounded-full cursor-pointer transition-all ${activeSlideIdx === idx ? 'bg-pink-500 w-2.5' : 'bg-slate-500'}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* SPECIFIC CATEGORY BANNER */
              <div className="relative h-28 rounded-2xl overflow-hidden mb-4 bg-slate-950">
                <div className="absolute inset-0">
                  <img
                    src={previewCategory === 'Calças e Leggings' ? categoryBanners.slimFit : previewCategory === 'Conjuntos' ? categoryBanners.plusSize : "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600&q=80"}
                    alt={previewCategory}
                    className="w-full h-full object-cover opacity-50"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                </div>

                <div className="absolute inset-0 flex flex-col justify-end p-4 text-left select-none">
                  <span className="text-[8px] font-extrabold uppercase tracking-wider text-pink-400 bg-pink-500/10 border border-pink-500/20 px-1.5 py-0.5 rounded-md w-max mb-1">PRODUTOS PREMIUM</span>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Coleção {previewCategory}</h3>
                  <p className="text-[9px] text-slate-400 font-medium">Os melhores lançamentos fitness em tecido tecnológico de alta densidade.</p>
                </div>
              </div>
            )}

            {/* PRODUCT DETAILS MODAL (SIMULATED SMARTPHONE POPUP IN SMARTPHONE FRAME) */}
            {selectedDetailProduct && (
              <div className="absolute inset-x-2 bottom-2 top-14 z-50 bg-slate-950/98 backdrop-blur-md flex flex-col p-4 overflow-y-auto select-none rounded-2xl text-left text-white border border-slate-800">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setSelectedDetailProduct(null)}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white bg-transparent border-none cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    <span>Voltar</span>
                  </button>
                  <span className="text-[9px] bg-pink-600/30 border border-pink-500/20 text-pink-400 font-bold px-2 py-0.5 rounded-full">Visualizar Peça</span>
                </div>

                {/* Body Content */}
                <div className="flex-grow space-y-3.5 overflow-y-auto pr-1">
                  {/* Photo & Category */}
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-900">
                    <img src={selectedDetailProduct.image} alt={selectedDetailProduct.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <span className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-xs text-[8px] font-bold text-pink-400 px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                      {selectedDetailProduct.category}
                    </span>
                  </div>

                  {/* Title & Price */}
                  <div>
                    <h3 className="font-extrabold text-xs text-white tracking-wide">{selectedDetailProduct.name}</h3>
                    <p className="text-[8px] text-slate-500 font-mono">REF: {selectedDetailProduct.sku}</p>
                    
                    <div className="mt-1.5 flex items-baseline gap-1.5">
                      <span className="font-extrabold text-sm text-pink-400 font-mono">R$ {selectedDetailProduct.price.toFixed(2)}</span>
                      <span className="text-[9px] text-slate-500 font-medium line-through">R$ {(selectedDetailProduct.price * 1.35).toFixed(2)}</span>
                      <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded">Atacado 35% OFF</span>
                    </div>
                  </div>

                  {/* Tech specs highlights / benefits */}
                  <div className="bg-slate-900/60 border border-slate-900 p-2.5 rounded-xl space-y-1 text-[9px]">
                    <div className="flex items-center gap-1 text-emerald-400">
                      <Check size={10} className="stroke-[3]" />
                      <span className="text-slate-300"><strong>Zero Transparência:</strong> Tecido duplo de alta gramatura</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-400">
                      <Check size={10} className="stroke-[3]" />
                      <span className="text-slate-300"><strong>Alta Compressão:</strong> Modela cintura de forma anatômica</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-400">
                      <Check size={10} className="stroke-[3]" />
                      <span className="text-slate-300"><strong>Alta Performance:</strong> Tecnologia respirável e proteção UV50+</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Destaque da Peça</span>
                    <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                      {selectedDetailProduct.description || "Peça fitness premium modeladora de alta qualidade. Confeccionada com elastano original para maior durabilidade e conforto em treinos intensos."}
                    </p>
                  </div>

                  {/* Size Selector */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Selecione o Tamanho</span>
                      <button
                        type="button"
                        onClick={() => {
                          alert(`📐 Guia de Medidas AP Moda Fitness:\n\n• PP: 34 (Busto: 76-81cm | Cintura: 58-63cm | Quadril: 86-91cm)\n• P: 36-38 (Busto: 82-87cm | Cintura: 64-69cm | Quadril: 92-97cm)\n• M: 40-42 (Busto: 88-93cm | Cintura: 70-75cm | Quadril: 98-103cm)\n• G: 44 (Busto: 94-99cm | Cintura: 76-81cm | Quadril: 104-109cm)\n• GG: 46 (Busto: 100-105cm | Cintura: 82-87cm | Quadril: 110-115cm)`);
                        }}
                        className="text-[8px] text-pink-400 font-bold hover:underline bg-transparent border-none cursor-pointer"
                      >
                        Tabela de Medidas 📐
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(selectedDetailProduct.sizes && selectedDetailProduct.sizes.length > 0 ? selectedDetailProduct.sizes : ['P', 'M', 'G']).map(sz => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          className={`w-8 h-7 text-[10px] font-bold rounded-lg transition-all border-none cursor-pointer
                            ${selectedSize === sz ? 'bg-pink-600 text-white font-extrabold' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Selector */}
                  <div className="space-y-1">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Selecione a Cor</span>
                    <div className="flex flex-wrap gap-1">
                      {(selectedDetailProduct.colors && selectedDetailProduct.colors.length > 0 ? selectedDetailProduct.colors : ['Preto', 'Bordô']).map(col => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setSelectedColor(col)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all border cursor-pointer
                            ${selectedColor === col ? 'bg-white text-slate-950 font-extrabold border-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
                        >
                          {col}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity Controller */}
                  <div className="space-y-1">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Quantidade</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailQty(prev => Math.max(1, prev - 1))}
                        className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 flex items-center justify-center font-bold text-white cursor-pointer border-none text-[12px]"
                      >
                        -
                      </button>
                      <span className="font-mono text-xs font-bold w-5 text-center">{detailQty}</span>
                      <button
                        type="button"
                        onClick={() => setDetailQty(prev => prev + 1)}
                        className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 flex items-center justify-center font-bold text-white cursor-pointer border-none text-[12px]"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Add button */}
                <div className="mt-3 pt-2.5 border-t border-slate-900 flex gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const sz = selectedSize || (selectedDetailProduct.sizes?.[0] || 'M');
                      const col = selectedColor || (selectedDetailProduct.colors?.[0] || 'Preto');
                      
                      const productWithMeta = {
                        ...selectedDetailProduct,
                        name: `${selectedDetailProduct.name} (${sz} / ${col})`
                      };

                      setVitrineCart(prev => {
                        const existing = prev.find(item => item.product.id === selectedDetailProduct.id && item.product.name === productWithMeta.name);
                        if (existing) {
                          return prev.map(item => (item.product.id === selectedDetailProduct.id && item.product.name === productWithMeta.name) ? { ...item, qty: item.qty + detailQty } : item);
                        }
                        return [...prev, { product: productWithMeta, qty: detailQty }];
                      });

                      setSelectedDetailProduct(null);
                    }}
                    className="flex-grow py-2 bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-[10px] rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-pink-500/10 cursor-pointer border-none"
                  >
                    <ShoppingBag size={11} />
                    <span>Adicionar • R$ {(selectedDetailProduct.price * detailQty).toFixed(2)}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Grid of items */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
              {vitrineProducts.map(prod => (
                <div key={prod.id} className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 hover:border-pink-600/30 transition-all flex flex-col justify-between">
                  <div>
                    <div 
                      className="aspect-square w-full rounded-lg overflow-hidden bg-slate-850 relative mb-1.5 cursor-pointer"
                      onClick={() => {
                        setSelectedDetailProduct(prod);
                        setSelectedSize(prod.sizes?.[0] || 'M');
                        setSelectedColor(prod.colors?.[0] || 'Preto');
                        setDetailQty(1);
                      }}
                    >
                      <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <span className="absolute top-1 left-1.5 bg-slate-900/85 backdrop-blur-xs text-[8px] font-bold text-pink-400 px-1 py-0.5 rounded uppercase font-mono">{prod.category}</span>
                    </div>
                    <p 
                      className="text-[10px] font-bold text-white leading-tight line-clamp-2 cursor-pointer hover:text-pink-400 transition"
                      onClick={() => {
                        setSelectedDetailProduct(prod);
                        setSelectedSize(prod.sizes?.[0] || 'M');
                        setSelectedColor(prod.colors?.[0] || 'Preto');
                        setDetailQty(1);
                      }}
                    >
                      {prod.name}
                    </p>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="font-bold text-[11px] text-pink-400 font-mono">R$ {prod.price.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDetailProduct(prod);
                        setSelectedSize(prod.sizes?.[0] || 'M');
                        setSelectedColor(prod.colors?.[0] || 'Preto');
                        setDetailQty(1);
                      }}
                      className="bg-pink-600 hover:bg-pink-700 text-white px-2 py-1 rounded-lg text-[9px] font-extrabold transition-all flex items-center gap-1 cursor-pointer border-none"
                    >
                      <span>Ver Peça</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Public customer cart drawer */}
          <div className="lg:col-span-4 bg-white border border-slate-100 rounded-3xl p-4 shadow-sm flex flex-col justify-between font-sans">
            
            <div>
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-3">
                <ShoppingBag size={15} className="text-pink-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Minha Sacola ({vitrineCart.length} itens)</h3>
              </div>

              {/* Cart List */}
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {vitrineCart.length === 0 ? (
                  <p className="text-slate-400 text-center py-6 text-[11px]">Adicione peças clicando nos produtos da vitrine ao lado!</p>
                ) : (
                  vitrineCart.map(item => (
                    <div key={item.product.id} className="flex justify-between items-center text-xs text-slate-700 p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-800 truncate max-w-[140px]">{item.product.name}</p>
                        <p className="text-slate-400 text-[10px] mt-0.5 font-mono">{item.qty}x R$ {item.product.price.toFixed(2)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromVitrineCart(item.product.id)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Coupon input */}
              {vitrineCart.length > 0 && (
                <div className="mt-4 pt-3.5 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">Cupom de Desconto</span>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="EX: FITNESS10"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-grow bg-slate-50 border border-slate-150 rounded-lg p-1.5 focus:outline-hidden font-mono text-[11px] font-bold text-rose-600 uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCouponInVitrine}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg border-none cursor-pointer"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}

              {/* CEP / Freight Calculator */}
              {vitrineCart.length > 0 && (
                <div className="mt-4 pt-3.5 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1 text-left">📍 Calcular Frete</span>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Digite seu CEP (ex: 01311-200)"
                      value={cepInput}
                      onChange={(e) => setCepInput(e.target.value)}
                      className="flex-grow bg-slate-50 border border-slate-150 rounded-lg p-1.5 focus:outline-hidden font-mono text-[11px] font-bold text-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!cepInput.trim()) {
                          alert('Por favor, informe um CEP válido.');
                          return;
                        }
                        setIsCalculatingFreight(true);
                        setTimeout(() => {
                          setIsCalculatingFreight(false);
                          setFreightCalculated(true);
                          // Default to PAC on calculation
                          setSelectedFreightOption('pac');
                          const price = cartSubtotal >= 250 ? 0 : 14.90;
                          setFreightCost(price);
                          setFreightDuration('5 a 8 dias úteis');
                        }, 700);
                      }}
                      disabled={isCalculatingFreight}
                      className="bg-slate-800 hover:bg-slate-950 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg border-none cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      {isCalculatingFreight ? 'Calculando...' : 'Calcular'}
                    </button>
                  </div>

                  {/* Freight Options Selection */}
                  {freightCalculated && (
                    <div className="mt-2.5 space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-150 text-[11px] text-left">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Opções de Entrega para {cepInput}:</p>
                      
                      {/* Option 1: PAC */}
                      <label 
                        className={`flex items-center justify-between p-1.5 rounded-lg border cursor-pointer transition
                          ${selectedFreightOption === 'pac' ? 'bg-pink-50/50 border-pink-400' : 'bg-white border-slate-150'}`}
                        onClick={() => {
                          setSelectedFreightOption('pac');
                          const price = cartSubtotal >= 250 ? 0 : 14.90;
                          setFreightCost(price);
                          setFreightDuration('5 a 8 dias úteis');
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <input 
                            type="radio" 
                            name="freight" 
                            checked={selectedFreightOption === 'pac'} 
                            onChange={() => {}} 
                            className="text-pink-600 focus:ring-pink-500"
                          />
                          <div className="text-slate-700 font-medium leading-tight">
                            <span>PAC Correios</span>
                            <span className="block text-[9px] text-slate-400 mt-0.5">Prazo: 5 a 8 dias úteis</span>
                          </div>
                        </div>
                        <span className="font-bold text-slate-800 font-mono text-[10px]">
                          {cartSubtotal >= 250 ? 'Grátis' : 'R$ 14,90'}
                        </span>
                      </label>

                      {/* Option 2: SEDEX */}
                      <label 
                        className={`flex items-center justify-between p-1.5 rounded-lg border cursor-pointer transition
                          ${selectedFreightOption === 'sedex' ? 'bg-pink-50/50 border-pink-400' : 'bg-white border-slate-150'}`}
                        onClick={() => {
                          setSelectedFreightOption('sedex');
                          setFreightCost(28.90);
                          setFreightDuration('1 a 3 dias úteis');
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <input 
                            type="radio" 
                            name="freight" 
                            checked={selectedFreightOption === 'sedex'} 
                            onChange={() => {}} 
                            className="text-pink-600 focus:ring-pink-500"
                          />
                          <div className="text-slate-700 font-medium leading-tight">
                            <span>SEDEX Express</span>
                            <span className="block text-[9px] text-slate-400 mt-0.5">Prazo: 1 a 3 dias úteis</span>
                          </div>
                        </div>
                        <span className="font-bold text-slate-800 font-mono text-[10px]">R$ 28,90</span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Calculations and checkout */}
            {vitrineCart.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-bold text-slate-800">R$ {cartSubtotal.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-rose-600">
                      <span>Desconto ({appliedCoupon.code}):</span>
                      <span>-R$ {cartDiscountAmt.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Valor Peças:</span>
                    <span className="font-bold text-slate-800">R$ {Math.max(0, cartSubtotal - cartDiscountAmt).toFixed(2)}</span>
                  </div>
                  {freightCalculated && selectedFreightOption && (
                    <div className="flex justify-between text-slate-600">
                      <span>Frete ({selectedFreightOption.toUpperCase()}):</span>
                      <span className="font-mono font-bold text-slate-800">
                        {freightCost === 0 ? 'Grátis' : `R$ ${freightCost.toFixed(2)}`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-850 pt-1.5 border-t border-slate-100 font-extrabold">
                    <span>Total Final:</span>
                    <span className="text-pink-600 tracking-tight font-mono text-sm">R$ {cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={sendVitrineOrderWhatsApp}
                  className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-green-500/10 cursor-pointer active:scale-97"
                >
                  <MessageCircle size={14} />
                  <span>Pedir via WhatsApp</span>
                </button>
              </div>
            )}

          </div>
        </div>

        {/* PAINEL DE CONTROLE DA VITRINE (ADMIN) */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mt-6 font-sans">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-pink-50 text-pink-600 rounded-xl">
                <Settings size={20} className="animate-pulse" />
              </div>
              <div className="text-left">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Painel Administrativo da Vitrine</h3>
                <p className="text-[10px] text-slate-500 font-medium">Altere textos, banners rotativos, seções de destaque e cadastre peças com sincronização Firebase instantânea.</p>
              </div>
            </div>

            {/* Tabs inside Admin Panel */}
            <div className="flex gap-1 bg-slate-50 p-1 rounded-xl self-start md:self-auto overflow-x-auto max-w-full scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveConfigTab('textos')}
                className={`px-3 py-1.5 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer whitespace-nowrap border-none ${activeConfigTab === 'textos' ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Identidade & Textos
              </button>
              <button
                type="button"
                onClick={() => setActiveConfigTab('banners')}
                className={`px-3 py-1.5 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer whitespace-nowrap border-none ${activeConfigTab === 'banners' ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Banners (Slide)
              </button>
              <button
                type="button"
                onClick={() => setActiveConfigTab('categorias')}
                className={`px-3 py-1.5 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer whitespace-nowrap border-none ${activeConfigTab === 'categorias' ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Seções / Categorias
              </button>
              <button
                type="button"
                onClick={() => setActiveConfigTab('cadastro')}
                className={`px-3 py-1.5 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer whitespace-nowrap border-none ${activeConfigTab === 'cadastro' ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Cadastrar Peça 🛍️
              </button>
              <button
                type="button"
                onClick={() => setActiveConfigTab('estoque')}
                className={`px-3 py-1.5 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer whitespace-nowrap border-none ${activeConfigTab === 'estoque' ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Estoque Rápido & Margens 📊
              </button>
            </div>
          </div>

          {/* Config: Identidade & Textos */}
          {activeConfigTab === 'textos' && (
            <div className="space-y-6 text-left">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nome Comercial da Loja</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-xs font-medium focus:ring-1 focus:ring-pink-500 focus:outline-hidden"
                    placeholder="Ex: AP Moda Fitness"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Subtítulo / Descrição da Vitrine</label>
                  <input
                    type="text"
                    value={storeSub}
                    onChange={(e) => setStoreSub(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-xs font-medium focus:ring-1 focus:ring-pink-500 focus:outline-hidden"
                    placeholder="Ex: Moda Fitness Premium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Cor do Tema (Hex)</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="w-10 h-10 border border-slate-150 rounded-lg cursor-pointer bg-transparent p-0"
                    />
                    <input
                      type="text"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="flex-grow bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-xs font-mono focus:ring-1 focus:ring-pink-500 focus:outline-hidden"
                      placeholder="#db2777"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Efeito Sazonal / Micro-interação Ativa</label>
                  <select
                    value={activeAnimation}
                    onChange={(e) => setActiveAnimation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-xs font-medium focus:ring-1 focus:ring-pink-500 focus:outline-hidden"
                  >
                    <option value="pulse-soft">⚡ pulse-soft (Pulsação Elegante - ex: Outubro Rosa)</option>
                    <option value="shimmer-luxury">✨ shimmer-luxury (Brilho Metálico Metropolitano - ex: Black Friday / Natal)</option>
                    <option value="float-minimal">🍃 float-minimal (Flutuação Minimalista para Cards e Destaques)</option>
                    <option value="border-glow">🌟 border-glow (Borda com Brilho Pulsante Sutil)</option>
                    <option value="none">📴 Nenhuma Animação (Visual Estático Padrão)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-b border-slate-100 pb-6">
                <button
                  type="button"
                  onClick={handleSaveStorefrontTexts}
                  disabled={isSavingConfigs}
                  className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition shadow-xs border-none"
                >
                  <Save size={14} />
                  <span>{isSavingConfigs ? 'Salvando...' : 'Salvar Textos & Identidade'}</span>
                </button>
              </div>

              {/* Sub-section: Ticker & Announcement */}
              <form onSubmit={handleSaveTickerConfig} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-left">
                <div className="md:col-span-12">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                    <span>⚡ Anúncio Rotativo (Ticker Superior)</span>
                  </h4>
                  <p className="text-[10px] text-slate-500">Exibido no topo da vitrine para avisos urgentes, frete grátis ou cupons especiais.</p>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Mostrar Ticker?</label>
                  <select
                    value={tickerConfig.show ? "true" : "false"}
                    onChange={(e) => setTickerConfig({ ...tickerConfig, show: e.target.value === "true" })}
                    className="w-full bg-white border border-slate-150 rounded-lg p-2 text-xs focus:outline-hidden"
                  >
                    <option value="true">Sim (Ativo)</option>
                    <option value="false">Não (Inativo)</option>
                  </select>
                </div>

                <div className="md:col-span-6 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Texto do Anúncio</label>
                  <input
                    type="text"
                    value={tickerConfig.text}
                    onChange={(e) => setTickerConfig({ ...tickerConfig, text: e.target.value })}
                    className="w-full bg-white border border-slate-150 rounded-lg p-2 text-xs font-medium focus:outline-hidden"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Cor de Fundo</label>
                  <div className="flex gap-1.5">
                    <input
                      type="color"
                      value={tickerConfig.bgColor}
                      onChange={(e) => setTickerConfig({ ...tickerConfig, bgColor: e.target.value })}
                      className="w-8 h-8 border border-slate-150 rounded-md cursor-pointer p-0"
                    />
                    <input
                      type="text"
                      value={tickerConfig.bgColor}
                      onChange={(e) => setTickerConfig({ ...tickerConfig, bgColor: e.target.value })}
                      className="w-full bg-white border border-slate-150 rounded-lg p-1 text-[10px] font-mono focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Cor da Fonte</label>
                  <div className="flex gap-1.5">
                    <input
                      type="color"
                      value={tickerConfig.textColor}
                      onChange={(e) => setTickerConfig({ ...tickerConfig, textColor: e.target.value })}
                      className="w-8 h-8 border border-slate-150 rounded-md cursor-pointer p-0"
                    />
                    <input
                      type="text"
                      value={tickerConfig.textColor}
                      onChange={(e) => setTickerConfig({ ...tickerConfig, textColor: e.target.value })}
                      className="w-full bg-white border border-slate-150 rounded-lg p-1 text-[10px] font-mono focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="md:col-span-12 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingConfigs}
                    className="bg-slate-800 hover:bg-slate-950 text-white font-bold text-[11px] px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition border-none"
                  >
                    <Save size={13} />
                    <span>{isSavingConfigs ? 'Salvando...' : 'Salvar Ticker'}</span>
                  </button>
                </div>
              </form>

              {/* Sub-section: Floating Promo Banner */}
              <form onSubmit={handleSaveFloatingBanner} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-pink-50/20 p-4 rounded-2xl border border-pink-100 text-left">
                <div className="md:col-span-12">
                  <h4 className="text-xs font-bold text-pink-700 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                    <span>🎁 Banner Promocional Flutuante (Cupom Ativo)</span>
                  </h4>
                  <p className="text-[10px] text-slate-500">Exibido de forma elegante na parte inferior da tela para engajar clientes no fechamento.</p>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Mostrar Banner?</label>
                  <select
                    value={floatingBanner.show ? "true" : "false"}
                    onChange={(e) => setFloatingBanner({ ...floatingBanner, show: e.target.value === "true" })}
                    className="w-full bg-white border border-slate-150 rounded-lg p-2 text-xs focus:outline-hidden"
                  >
                    <option value="true">Sim (Ativo)</option>
                    <option value="false">Não (Inativo)</option>
                  </select>
                </div>

                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Título Principal</label>
                  <input
                    type="text"
                    value={floatingBanner.title}
                    onChange={(e) => setFloatingBanner({ ...floatingBanner, title: e.target.value })}
                    className="w-full bg-white border border-slate-150 rounded-lg p-2 text-xs font-medium focus:outline-hidden"
                  />
                </div>

                <div className="md:col-span-4 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Subtítulo Informativo</label>
                  <input
                    type="text"
                    value={floatingBanner.subtitle}
                    onChange={(e) => setFloatingBanner({ ...floatingBanner, subtitle: e.target.value })}
                    className="w-full bg-white border border-slate-150 rounded-lg p-2 text-xs font-medium focus:outline-hidden"
                  />
                </div>

                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Link de Destino do Botão</label>
                  <input
                    type="text"
                    value={floatingBanner.ctaLink}
                    onChange={(e) => setFloatingBanner({ ...floatingBanner, ctaLink: e.target.value })}
                    className="w-full bg-white border border-slate-150 rounded-lg p-2 text-xs font-medium focus:outline-hidden"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Texto do Botão</label>
                  <input
                    type="text"
                    value={floatingBanner.ctaText}
                    onChange={(e) => setFloatingBanner({ ...floatingBanner, ctaText: e.target.value })}
                    className="w-full bg-white border border-slate-150 rounded-lg p-2 text-xs font-medium focus:outline-hidden"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Cor de Fundo</label>
                  <div className="flex gap-1">
                    <input
                      type="color"
                      value={floatingBanner.bgColor}
                      onChange={(e) => setFloatingBanner({ ...floatingBanner, bgColor: e.target.value })}
                      className="w-8 h-8 border border-slate-150 rounded-md cursor-pointer p-0"
                    />
                    <input
                      type="text"
                      value={floatingBanner.bgColor}
                      onChange={(e) => setFloatingBanner({ ...floatingBanner, bgColor: e.target.value })}
                      className="w-full bg-white border border-slate-150 rounded-lg p-1 text-[9px] font-mono focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="md:col-span-8 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingConfigs}
                    className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-[11px] px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow-xs border-none"
                  >
                    <Save size={13} />
                    <span>{isSavingConfigs ? 'Salvando...' : 'Salvar Banner Flutuante'}</span>
                  </button>
                </div>
              </form>

              {/* Sub-section: 4 Cards de Benefícios Dinâmicos (InfoCards) */}
              <form onSubmit={handleSaveBenefitCards} className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-left mt-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                    <span>💳 Cards de Benefícios Dinâmicos (InfoCards)</span>
                  </h4>
                  <p className="text-[10px] text-slate-500">Altere o texto dos 4 cartões de confiança que aparecem logo abaixo dos banners principais da loja.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {benefitCards.map((card, idx) => (
                    <div key={card.id || idx} className="bg-white p-3 rounded-xl border border-slate-150 space-y-2">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                        <span className="text-[10px] font-bold text-pink-600 uppercase">Card #{idx + 1} {idx === 0 ? '(Envio)' : idx === 1 ? '(Parcelamento)' : idx === 2 ? '(Segurança)' : '(Pix/Desconto)'}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Título</label>
                          <input
                            type="text"
                            value={card.title}
                            onChange={(e) => {
                              const updated = [...benefitCards];
                              updated[idx].title = e.target.value;
                              setBenefitCards(updated);
                            }}
                            className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 text-xs font-semibold focus:outline-hidden"
                            placeholder="Ex: Frete Grátis"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Subtítulo</label>
                          <input
                            type="text"
                            value={card.subtitle}
                            onChange={(e) => {
                              const updated = [...benefitCards];
                              updated[idx].subtitle = e.target.value;
                              setBenefitCards(updated);
                            }}
                            className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 text-xs font-medium focus:outline-hidden"
                            placeholder="Ex: Acima de R$ 300"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSavingConfigs}
                    className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-[11px] px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow-xs border-none"
                  >
                    <Save size={13} />
                    <span>{isSavingConfigs ? 'Salvando...' : 'Salvar Cards de Benefícios'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Config: Banners Rotativos (Slides) */}
          {activeConfigTab === 'banners' && (
            <div className="space-y-6 text-left">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                  <Sliders size={14} className="text-pink-600" />
                  <span>Gerenciar Lookbook de Slides Rotativos</span>
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">Banners dinâmicos em carrossel exibidos no catálogo público. Ideal para divulgar coleções sazonais, liquidações ou atacado.</p>
              </div>

              <div className="space-y-6">
                {lookbookSlides.map((slide, sIdx) => (
                  <div key={sIdx} className="bg-white border border-slate-150 rounded-2xl p-5 shadow-2xs relative hover:border-pink-200 transition-all">
                    <span className="absolute -top-2.5 -left-2.5 w-6 h-6 bg-slate-800 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm font-mono">
                      {sIdx + 1}
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Tag Indicadora (Balão)</label>
                        <input
                          type="text"
                          value={slide.tag}
                          onChange={(e) => {
                            const updated = [...lookbookSlides];
                            updated[sIdx].tag = e.target.value;
                            setLookbookSlides(updated);
                          }}
                          className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 text-xs font-bold focus:outline-hidden"
                          placeholder="EX: COLEÇÃO EXCLUSIVA"
                        />
                      </div>

                      <div className="md:col-span-4 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Título Principal do Slide</label>
                        <input
                          type="text"
                          value={slide.title}
                          onChange={(e) => {
                            const updated = [...lookbookSlides];
                            updated[sIdx].title = e.target.value;
                            setLookbookSlides(updated);
                          }}
                          className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 text-xs font-extrabold text-slate-800 focus:outline-hidden"
                          placeholder="EX: ATACADO PREMIUM"
                        />
                      </div>

                      <div className="md:col-span-5 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Imagem de Fundo</label>
                        <ImageUploader
                          currentImageUrl={slide.image}
                          onUploadSuccess={(url) => {
                            const updated = [...lookbookSlides];
                            updated[sIdx].image = url;
                            setLookbookSlides(updated);
                          }}
                        />
                        <p className="text-[10px] text-slate-400 font-medium mt-1">Dimensão ideal: 1920x800px (Texto centralizado)</p>
                      </div>

                      <div className="md:col-span-12 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Texto Descritivo / Chamada CTA</label>
                        <textarea
                          rows={2}
                          value={slide.desc}
                          onChange={(e) => {
                            const updated = [...lookbookSlides];
                            updated[sIdx].desc = e.target.value;
                            setLookbookSlides(updated);
                          }}
                          className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 text-xs focus:outline-hidden font-medium"
                          placeholder="Descreva as características especiais das peças do slide..."
                        />
                      </div>

                      <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Categoria Vinculada (Selecione)</label>
                          <select
                            value={categoriesList.includes(slide.category) ? slide.category : 'custom'}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = [...lookbookSlides];
                              if (val === 'custom') {
                                updated[sIdx].category = '';
                              } else {
                                updated[sIdx].category = val;
                              }
                              setLookbookSlides(updated);
                            }}
                            className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 text-xs font-bold text-slate-700 focus:outline-hidden"
                          >
                            {categoriesList.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                            <option value="custom">-- Digitar Categoria Customizada --</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Ou Digite o Filtro de Categoria</label>
                          <input
                            type="text"
                            value={slide.category || ''}
                            onChange={(e) => {
                              const updated = [...lookbookSlides];
                              updated[sIdx].category = e.target.value;
                              setLookbookSlides(updated);
                            }}
                            className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2 text-xs font-medium focus:outline-hidden"
                            placeholder="Todos, Conjuntos, Blusa Dry-Fit, etc."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveLookbookSlides(lookbookSlides)}
                  disabled={isSavingConfigs}
                  className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition shadow-xs border-none"
                >
                  <Save size={14} />
                  <span>{isSavingConfigs ? 'Salvando...' : 'Salvar Todos os Banners de Slide'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Config: Categorias / Seções */}
          {activeConfigTab === 'categorias' && (
            <form onSubmit={handleSaveCategoryBanners} className="space-y-6 text-left">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                  <Image size={14} className="text-pink-600" />
                  <span>Banners de Destaque das Seções</span>
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">As imagens abaixo aparecem como cabeçalhos das categorias de peças na navegação do cliente.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-150 rounded-2xl p-4 space-y-3 shadow-2xs">
                  <span className="bg-pink-100 text-pink-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider block w-max">SEÇÃO 1: SLIM FIT</span>
                  <div className="aspect-video w-full rounded-lg bg-slate-100 overflow-hidden border border-slate-150">
                    <img src={categoryBanners.slimFit} alt="Slim Fit Banner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Banner Slim Fit</label>
                    <ImageUploader
                      currentImageUrl={categoryBanners.slimFit}
                      onUploadSuccess={(url) => setCategoryBanners({ ...categoryBanners, slimFit: url })}
                    />
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Dimensão ideal: 800x800px ou 600x800px</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-150 rounded-2xl p-4 space-y-3 shadow-2xs">
                  <span className="bg-pink-100 text-pink-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider block w-max">SEÇÃO 2: PLUS SIZE / CURVAS</span>
                  <div className="aspect-video w-full rounded-lg bg-slate-100 overflow-hidden border border-slate-150">
                    <img src={categoryBanners.plusSize} alt="Plus Size Banner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Banner Plus Size</label>
                    <ImageUploader
                      currentImageUrl={categoryBanners.plusSize}
                      onUploadSuccess={(url) => setCategoryBanners({ ...categoryBanners, plusSize: url })}
                    />
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Dimensão ideal: 800x800px ou 600x800px</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingConfigs}
                  className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition shadow-xs border-none"
                >
                  <Save size={14} />
                  <span>{isSavingConfigs ? 'Salvando...' : 'Salvar Banners de Categoria'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Config: Cadastrar Nova Peça */}
          {activeConfigTab === 'cadastro' && (
            <form onSubmit={handleQuickAddProductSubmit} className="space-y-6 text-left">
              <div className="bg-pink-50/50 p-4 rounded-2xl border border-pink-100">
                <h4 className="text-xs font-bold text-pink-800 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                  <span>🛍️ Cadastro de Nova Peça / Produto centralizado</span>
                </h4>
                <p className="text-[10px] text-pink-700 font-medium">Cadastre novas peças diretamente no banco de dados central do Firebase. Aparece imediatamente na vitrine e no PDV.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Nome Comercial da Peça *</label>
                  <input
                    type="text"
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-xs font-medium focus:ring-1 focus:ring-pink-500 focus:outline-hidden"
                    placeholder="Ex: Legging Empina Bumbum Sensorial"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Referência (SKU)</label>
                  <input
                    type="text"
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-xs font-mono focus:ring-1 focus:ring-pink-500 focus:outline-hidden"
                    placeholder="Ex: LEG-09"
                  />
                </div>

                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Categoria da Peça *</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-pink-500 focus:outline-hidden"
                  >
                    <option value="Conjuntos">Conjuntos</option>
                    <option value="Blusa Dry-Fit">Blusa Dry-Fit</option>
                    <option value="Calças e Leggings">Calças e Leggings</option>
                    <option value="Tops e Macacões">Tops e Macacões</option>
                    <option value="Acessórios Fitness">Acessórios Fitness</option>
                  </select>
                </div>

                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Preço de Venda (R$) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-xs font-bold text-pink-600 focus:ring-1 focus:ring-pink-500 focus:outline-hidden"
                    placeholder="99.90"
                  />
                </div>

                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Preço de Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProdCost}
                    onChange={(e) => setNewProdCost(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-xs font-medium focus:ring-1 focus:ring-pink-500 focus:outline-hidden"
                    placeholder="40.00 (Opcional)"
                  />
                </div>

                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Estoque Inicial (Unidades)</label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-pink-500 focus:outline-hidden"
                    placeholder="10"
                  />
                </div>

                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Alerta Estoque Mínimo</label>
                  <input
                    type="number"
                    value={newProdMinStock}
                    onChange={(e) => setNewProdMinStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-pink-500 focus:outline-hidden"
                    placeholder="3"
                  />
                </div>

                <div className="md:col-span-12 space-y-1">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] gap-2">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] bg-slate-200/50 px-2 py-0.5 rounded">Calculadora de Precificação</span>
                    <div className="text-slate-700 font-medium text-left">
                      {(() => {
                        const p = parseFloat(newProdPrice) || 0;
                        const c = parseFloat(newProdCost) || parseFloat((p * 0.45).toFixed(2));
                        if (p <= 0) return "Digite o preço de venda para simular a margem.";
                        const profit = p - c;
                        const margin = (profit / p) * 100;
                        return (
                          <span>
                            Custo de <strong>R$ {c.toFixed(2)}</strong> e venda de <strong>R$ {p.toFixed(2)}</strong> gera um lucro bruto de <strong className="text-pink-600 font-extrabold">R$ {profit.toFixed(2)}</strong> por peça. Margem de lucro de <strong className={margin >= 45 ? "text-emerald-600 font-extrabold" : "text-amber-600 font-bold"}>{margin.toFixed(2)}%</strong>.
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-12 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">URL de Imagem da Peça</label>
                  <input
                    type="text"
                    value={newProdImage}
                    onChange={(e) => setNewProdImage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-xs font-mono focus:ring-1 focus:ring-pink-500 focus:outline-hidden"
                  />
                </div>

                <div className="md:col-span-6 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Tamanhos Disponíveis</label>
                  <div className="flex flex-wrap gap-2 pt-1.5">
                    {['PP', 'P', 'M', 'G', 'GG', 'XG'].map(sz => {
                      const hasSz = newProdSizes.includes(sz);
                      return (
                        <button
                          type="button"
                          key={sz}
                          onClick={() => {
                            if (hasSz) setNewProdSizes(newProdSizes.filter(s => s !== sz));
                            else setNewProdSizes([...newProdSizes, sz]);
                          }}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all border-none ${hasSz ? 'bg-pink-600 text-white' : 'bg-slate-50 text-slate-600 border border-slate-150'}`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="md:col-span-6 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Cores Disponíveis</label>
                  <div className="flex flex-wrap gap-2 pt-1.5">
                    {['Preto', 'Bordô', 'Azul Marinho', 'Cinza Mescla', 'Rosa Neon', 'Branco'].map(col => {
                      const hasCol = newProdColors.includes(col);
                      return (
                        <button
                          type="button"
                          key={col}
                          onClick={() => {
                            if (hasCol) setNewProdColors(newProdColors.filter(c => c !== col));
                            else setNewProdColors([...newProdColors, col]);
                          }}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all border-none ${hasCol ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-600 border border-slate-150'}`}
                        >
                          {col}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="md:col-span-12 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Descrição de Destaques Técnicos</label>
                  <textarea
                    rows={3}
                    value={newProdDescription}
                    onChange={(e) => setNewProdDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-pink-500 focus:outline-hidden font-medium"
                    placeholder="Descreva a compressão, toque sensorial, e outros detalhes importantes..."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-6 py-3 rounded-xl flex items-center gap-2 cursor-pointer transition shadow-md shadow-pink-500/10 border-none"
                >
                  <Plus size={16} />
                  <span>Cadastrar Peça na Nuvem & Vitrine 🚀</span>
                </button>
              </div>
            </form>
          )}

          {/* Config: Gestão Rápida de Estoque & Margens */}
          {activeConfigTab === 'estoque' && (
            <div id="quick-stock-panel" className="space-y-4 text-left">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                    <span>📊 Gestão Rápida de Estoque e Margem de Lucro</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">Controle de estoque instantâneo de peças da vitrine com avisos visuais de estoque crítico e cálculo automatizado de margem bruta.</p>
                </div>
                
                {/* Search */}
                <div className="relative w-full md:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar peça por nome ou SKU..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-pink-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Stats Counters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Total de Itens</span>
                  <span className="text-sm font-extrabold text-slate-800">{products.length} referências</span>
                </div>
                <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                  <span className="text-[9px] font-bold text-rose-500 block uppercase">Alerta de Crítico</span>
                  <span className="text-sm font-extrabold text-rose-700">
                    {products.filter(p => p.stock <= p.minStock).length} peças em risco
                  </span>
                </div>
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                  <span className="text-[9px] font-bold text-emerald-500 block uppercase">Margem Média Estimada</span>
                  <span className="text-sm font-extrabold text-emerald-700">
                    {(() => {
                      const list = products.filter(p => p.price > 0);
                      if (list.length === 0) return '0%';
                      const sum = list.reduce((acc, curr) => {
                        const cost = curr.cost || (curr.price * 0.45);
                        return acc + ((curr.price - cost) / curr.price);
                      }, 0);
                      return `${((sum / list.length) * 100).toFixed(0)}%`;
                    })()}
                  </span>
                </div>
                <div className="bg-pink-50/50 p-3 rounded-xl border border-pink-100">
                  <span className="text-[9px] font-bold text-pink-500 block uppercase">Peças Ativas Vitrine</span>
                  <span className="text-sm font-extrabold text-pink-700">
                    {products.filter(p => p.stock > 0).length} visíveis online
                  </span>
                </div>
              </div>

              {/* Product Grid / Table */}
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="p-3">Peça</th>
                        <th className="p-3">Preço Custo / Venda</th>
                        <th className="p-3">Margem Lucro</th>
                        <th className="p-3 text-center">Estoque Atual</th>
                        <th className="p-3 text-right">Ação Rápida</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products
                        .filter(p => {
                          if (!inventorySearch) return true;
                          const term = inventorySearch.toLowerCase();
                          return p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term);
                        })
                        .map(prod => {
                          const cost = prod.cost || parseFloat((prod.price * 0.45).toFixed(2));
                          const profit = prod.price - cost;
                          const margin = prod.price > 0 ? (profit / prod.price) * 100 : 0;
                          const isLowStock = prod.stock <= prod.minStock;

                          return (
                            <tr key={prod.id} className="hover:bg-slate-50/50 transition border-none">
                              <td className="p-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                                    <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-800 text-[11px] leading-tight line-clamp-1">{prod.name}</p>
                                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">{prod.sku} • {prod.category}</p>
                                  </div>
                                </div>
                              </td>

                              <td className="p-3">
                                <div className="space-y-0.5">
                                  <div className="text-[10px] text-slate-400">
                                    Custo: <span className="font-mono">R$ {cost.toFixed(2)}</span>
                                  </div>
                                  <div className="font-bold text-slate-800">
                                    Venda: <span className="font-mono text-pink-600">R$ {prod.price.toFixed(2)}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="p-3">
                                <div className="space-y-1">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono
                                    ${margin >= 50 ? 'bg-emerald-100 text-emerald-800' : margin >= 35 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                                    {margin.toFixed(0)}% Margem
                                  </span>
                                  <p className="text-[9px] text-slate-400">Lucro: R$ {profit.toFixed(1)}/un</p>
                                </div>
                              </td>

                              <td className="p-3 text-center">
                                <div className="inline-flex flex-col items-center">
                                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full
                                    ${isLowStock ? 'bg-amber-100 text-amber-800 font-extrabold' : 'bg-slate-100 text-slate-700'}`}>
                                    {prod.stock} un
                                  </span>
                                  {isLowStock && (
                                    <span className="text-[8px] font-bold text-amber-600 uppercase tracking-tight mt-0.5">Estoque Mínimo ({prod.minStock})</span>
                                  )}
                                </div>
                              </td>

                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onUpdateProduct) {
                                        onUpdateProduct({ ...prod, stock: Math.max(0, prod.stock - 1) });
                                      }
                                    }}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer transition border-none text-[10px] font-bold"
                                    title="Diminuir estoque"
                                  >
                                    -1
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onUpdateProduct) {
                                        onUpdateProduct({ ...prod, stock: prod.stock + 1 });
                                      }
                                    }}
                                    className="p-1.5 bg-pink-50 hover:bg-pink-100 text-pink-600 font-bold rounded-lg cursor-pointer transition border-none text-[10px]"
                                    title="Aumentar estoque"
                                  >
                                    +1
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newVal = prompt(`Definir novo estoque para "${prod.name}":`, prod.stock.toString());
                                      if (newVal !== null && !isNaN(parseInt(newVal))) {
                                        if (onUpdateProduct) {
                                          onUpdateProduct({ ...prod, stock: parseInt(newVal) });
                                        }
                                      }
                                    }}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold rounded-lg cursor-pointer transition border-none ml-1"
                                  >
                                    Ajustar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
      )}

      {/* Tab: Recuperação de Carrinhos Abandonados por IA */}
      {activeSubTab === 'recuperacao' && (
        <AbandonedCarts 
          checkouts={checkouts} 
          setCheckouts={setCheckouts}
          onSyncCheckouts={onSyncCheckouts}
        />
      )}

      {/* Tab: Central de Marketing & Vendas */}
      {activeSubTab === 'marketing' && (
        <MarketingSalesHub />
      )}

    </div>
  );
}
