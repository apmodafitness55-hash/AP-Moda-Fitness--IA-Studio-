/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  MapPin, 
  Phone, 
  X, 
  MessageCircle, 
  ChevronRight, 
  ChevronLeft,
  Play, 
  Tag, 
  Sparkles, 
  Truck, 
  Info,
  Check,
  Gift,
  Plus,
  Minus,
  Send,
  Video,
  Heart,
  Star,
  Menu,
  User,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Lock,
  ThumbsUp,
  CreditCard,
  Eye,
  Edit,
  Trash2,
  Palette,
  Layout,
  Megaphone,
  Save,
  QrCode,
  Handshake,
  Ruler,
  Clock,
  Package
} from 'lucide-react';
import { Product, Client } from '../types';
import { pushSystemConfigToSupabase } from '../supabase';
import { CheckoutWizard } from './CheckoutWizard';

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

const COLOR_HEXES: Record<string, string> = {
  'fúcsia': '#d946ef',
  'fucsia': '#d946ef',
  'magenta': '#d946ef',
  'marrom': '#78350f',
  'roxo imperial': '#6b21a8',
  'verde militar': '#15803d',
  'militar': '#15803d',
  'vermelho duo': '#991b1b',
  'vinho': '#991b1b',
  'bordô': '#991b1b',
  'bordo': '#991b1b',
  'preto': '#0f172a',
  'black': '#0f172a',
  'branco': '#ffffff',
  'white': '#ffffff',
  'pink glow': '#ec4899',
  'azul celeste': '#0ea5e9',
  'azul marinho': '#1e3a8a',
  'marinho': '#1e3a8a',
  'azul': '#3b82f6',
  'vermelho': '#ef4444',
  'verde': '#22c55e',
  'rosa': '#f472b6',
  'amarelo': '#eab308',
  'amarelo neon': '#ccff00',
  'roxo': '#a855f7',
  'lilas': '#c084fc',
  'lilás': '#c084fc',
  'lilais': '#c084fc',
  'violeta': '#7c3aed',
  'cinza': '#64748b',
  'gray': '#64748b',
  'grey': '#64748b',
  'chumbo': '#475569',
  'grafite': '#334155',
  'bege': '#e4d5be',
  'beige': '#e4d5be',
  'caqui': '#e4d5be',
  'creme': '#e4d5be',
  'coral': '#f97316',
  'salmao': '#f97316',
  'salmão': '#f97316'
};

const getColorHex = (name: string | undefined | null) => {
  if (!name || typeof name !== 'string') return '#cccccc';
  const norm = name.trim().toLowerCase();
  
  // 1. Look up in dynamic custom color map first
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('ap_custom_color_map');
      if (saved) {
        const map = JSON.parse(saved);
        if (map[norm]) return map[norm];
      }
    }
  } catch (e) {
    // ignore
  }

  if (COLOR_HEXES[norm]) return COLOR_HEXES[norm];
  
  // Try sub-matches for compound color names like "verde militar" or "azul marinho"
  if (norm.includes('preto') || norm.includes('black')) return '#0f172a';
  if (norm.includes('branco') || norm.includes('white')) return '#ffffff';
  if (norm.includes('rosa') || norm.includes('pink')) return '#ec4899';
  if (norm.includes('fucsia') || norm.includes('fúcsia') || norm.includes('magenta')) return '#d946ef';
  if (norm.includes('marinho')) return '#1e3a8a';
  if (norm.includes('azul')) return '#3b82f6';
  if (norm.includes('militar') || norm.includes('verde')) return '#15803d';
  if (norm.includes('vinho') || norm.includes('bordo') || norm.includes('bordô')) return '#991b1b';
  if (norm.includes('vermelho')) return '#ef4444';
  if (norm.includes('amarelo')) return '#eab308';
  if (norm.includes('cinza') || norm.includes('gray') || norm.includes('grey') || norm.includes('chumbo') || norm.includes('grafite')) return '#64748b';
  if (norm.includes('laranja')) return '#ea580c';
  if (norm.includes('roxo') || norm.includes('purple') || norm.includes('violeta')) return '#7c3aed';
  if (norm.includes('lilas') || norm.includes('lilás') || norm.includes('lilais')) return '#c084fc';
  if (norm.includes('bege') || norm.includes('beige') || norm.includes('caqui') || norm.includes('creme')) return '#e4d5be';
  if (norm.includes('marrom')) return '#78350f';
  if (norm.includes('coral') || norm.includes('salmao') || norm.includes('salmão')) return '#f97316';

  // Custom hash logic to get a deterministic nice light color
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = norm.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 65%, 55%)`;
};

const getCategoryThumbnail = (category: string): string => {
  const cat = (category || '').toLowerCase();
  if (cat === 'todos') {
    return 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=150&h=150&fit=crop&q=80';
  }
  if (cat.includes('blusa') || cat.includes('camiseta') || cat.includes('top') || cat.includes('cropped') || cat.includes('dry-fit') || cat.includes('dryfit')) {
    return 'https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=150&h=150&fit=crop&q=80';
  }
  if (cat.includes('legging') || cat.includes('calça') || cat.includes('calca') || cat.includes('shorts') || cat.includes('bermuda') || cat.includes('calças')) {
    return 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?w=150&h=150&fit=crop&q=80';
  }
  if (cat.includes('conjunto') || cat.includes('conjuntos')) {
    return 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop&q=80';
  }
  if (cat.includes('slim') || cat.includes('fit')) {
    return 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=150&h=150&fit=crop&q=80';
  }
  if (cat.includes('plus') || cat.includes('size')) {
    return 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=150&h=150&fit=crop&q=80';
  }
  if (cat.includes('macacão') || cat.includes('macacao') || cat.includes('body')) {
    return 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=150&h=150&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=150&h=150&fit=crop&q=80';
};

const getProductDynamicSizes = (product: any): string[] => {
  const sizesSet = new Set<string>();
  if (product && Array.isArray(product.sizes)) {
    product.sizes.forEach((s: any) => {
      if (s) sizesSet.add(String(s));
    });
  }
  if (product && product.sizeColorStocks) {
    Object.keys(product.sizeColorStocks).forEach((s: any) => {
      if (s) sizesSet.add(String(s));
    });
  }
  return Array.from(sizesSet);
};

const getProductDynamicColors = (product: any): string[] => {
  const colorsSet = new Set<string>();
  if (product && Array.isArray(product.colors)) {
    product.colors.forEach((c: any) => {
      if (c) colorsSet.add(String(c));
    });
  }
  if (product && product.colorStocks) {
    Object.keys(product.colorStocks).forEach((c: any) => {
      if (c) colorsSet.add(String(c));
    });
  }
  if (product && product.sizeColorStocks) {
    Object.values(product.sizeColorStocks).forEach((colorObj: any) => {
      if (colorObj && typeof colorObj === 'object') {
        Object.keys(colorObj).forEach((c: any) => {
          if (c) colorsSet.add(String(c));
        });
      }
    });
  }
  return Array.from(colorsSet);
};

interface PublicCatalogProps {
  products: Product[];
  onAddOnlineOrder?: (order: any) => void;
  onAddCheckout?: (checkout: any) => void;
  clients: Client[];
  onAddClient: (newClient: Client) => void;
  onUpdateClients?: (updatedList: Client[]) => void;
  onExitCustomerView?: () => void;
  currentUser?: any;
  sales?: any[];
  onlineOrders?: any[];
}

export default function PublicCatalog({ 
  products, 
  onAddOnlineOrder, 
  onAddCheckout,
  clients = [], 
  onAddClient, 
  onUpdateClients,
  onExitCustomerView,
  currentUser,
  sales = [],
  onlineOrders = []
}: PublicCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Custom states for interactive lookbook carousel
  const [currentSlide, setCurrentSlide] = useState(0);

  const [storeName, setStoreName] = useState(() => {
    return localStorage.getItem('ap_vitrine_store_name') || "AP Moda Fitness";
  });
  const [storeSub, setStoreSub] = useState(() => {
    return localStorage.getItem('ap_vitrine_store_sub') || "Moda Fitness Premium";
  });
  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem('ap_vitrine_theme_color') || "#db2777";
  });
  const [activeAnimation, setActiveAnimation] = useState(() => {
    return localStorage.getItem('ap_vitrine_active_animation') || "shimmer-luxury";
  });

  const [lookbookSlides, setLookbookSlides] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('ap_vitrine_slides');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
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

  // Dynamic Announcement Ticker
  const [tickerConfig, setTickerConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('ap_vitrine_announcement');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return {
      show: true,
      text: "⚡ ENVIAMOS PARA TODO BRASIL • FRETE GRÁTIS ACIMA DE R$ 399 ATÉ 6X SEM JUROS ⚡",
      bgColor: "#db2777", // pink-600
      textColor: "#ffffff"
    };
  });

  // Category highlight box banners
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

  // Floating campaign promotion banner configuration
  const [floatingBanner, setFloatingBanner] = useState<any>(() => {
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
      bgColor: "#ec4899", // pink-500
      textColor: "#ffffff"
    };
  });

  const [benefitCards, setBenefitCards] = useState<any[]>(() => {
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

  const [isFloatingDismissed, setIsFloatingDismissed] = useState(false);

  // Sync edits to localStorage
  useEffect(() => {
    localStorage.setItem('ap_vitrine_store_name', storeName);
    localStorage.setItem('ap_vitrine_store_sub', storeSub);
    localStorage.setItem('ap_vitrine_theme_color', themeColor);
  }, [storeName, storeSub, themeColor]);

  useEffect(() => {
    localStorage.setItem('ap_vitrine_benefit_cards', JSON.stringify(benefitCards));
  }, [benefitCards]);

  useEffect(() => {
    localStorage.setItem('ap_vitrine_slides', JSON.stringify(lookbookSlides));
  }, [lookbookSlides]);

  useEffect(() => {
    localStorage.setItem('ap_vitrine_announcement', JSON.stringify(tickerConfig));
  }, [tickerConfig]);

  useEffect(() => {
    localStorage.setItem('ap_vitrine_category_banners', JSON.stringify(categoryBanners));
  }, [categoryBanners]);

  useEffect(() => {
    localStorage.setItem('ap_vitrine_floating_banner', JSON.stringify(floatingBanner));
  }, [floatingBanner]);

  // Configure SEO tags for public vitrine indexation
  useEffect(() => {
    // 1. Set the clean retail meta title
    document.title = "AP Moda Fitness | Moda Fitness Premium";

    // 2. Add or update canonical link pointing directly to the public vitrine url
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', 'https://apmodafitness.com.br/vitrine');

    // 3. Ensure robots meta is set to index, follow for public catalog
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', 'index, follow');
  }, []);

  // Listen for background sync updates to immediately reflect across screens
  useEffect(() => {
    const handleStorageSynced = () => {
      console.log('[PublicCatalog] Sincronizando dados locais da vitrine a partir do localStorage.');
      const savedName = localStorage.getItem('ap_vitrine_store_name');
      if (savedName) setStoreName(savedName);

      const savedSub = localStorage.getItem('ap_vitrine_store_sub');
      if (savedSub) setStoreSub(savedSub);

      const savedTheme = localStorage.getItem('ap_vitrine_theme_color');
      if (savedTheme) setThemeColor(savedTheme);

      const savedAnim = localStorage.getItem('ap_vitrine_active_animation');
      if (savedAnim) setActiveAnimation(savedAnim);

      try {
        const savedSlides = localStorage.getItem('ap_vitrine_slides');
        if (savedSlides) {
          const parsed = JSON.parse(savedSlides);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLookbookSlides(parsed.map((slide, idx) => ({
              ...slide,
              category: slide.category || (idx === 0 ? 'Todos' : idx === 1 ? 'Conjuntos' : 'Slim Fit')
            })));
          }
        }
      } catch (e) {}

      try {
        const savedAnn = localStorage.getItem('ap_vitrine_announcement');
        if (savedAnn) setTickerConfig(JSON.parse(savedAnn));
      } catch (e) {}

      try {
        const savedCat = localStorage.getItem('ap_vitrine_category_banners');
        if (savedCat) setCategoryBanners(JSON.parse(savedCat));
      } catch (e) {}

      try {
        const savedFlo = localStorage.getItem('ap_vitrine_floating_banner');
        if (savedFlo) setFloatingBanner(JSON.parse(savedFlo));
      } catch (e) {}

      try {
        const savedBenefit = localStorage.getItem('ap_vitrine_benefit_cards');
        if (savedBenefit) setBenefitCards(JSON.parse(savedBenefit));
      } catch (e) {}
    };

    window.addEventListener('ap-storage-synced', handleStorageSynced);
    return () => window.removeEventListener('ap-storage-synced', handleStorageSynced);
  }, []);

  // Auto-advance banner slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % lookbookSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [lookbookSlides.length]);

  // Collapsible Accordions in Product Detailed view
  const [activeAccordion, setActiveAccordion] = useState<'desc' | 'detalhes' | 'tamanhos' | 'cuidados' | null>('desc');

  // Detail modal options selection
  const [selectedColor, setSelectedColor] = useState('Fúcsia');
  const [selectedSize, setSelectedSize] = useState('M');

  // Provador Virtual (Virtual Fitting Room) States
  const [isFittingRoomOpen, setIsFittingRoomOpen] = useState(false);
  const [fitHeight, setFitHeight] = useState<string>(() => localStorage.getItem('ap_fit_height') || '');
  const [fitWeight, setFitWeight] = useState<string>(() => localStorage.getItem('ap_fit_weight') || '');
  const [fitAge, setFitAge] = useState<string>(() => localStorage.getItem('ap_fit_age') || '');
  const [fitPreference, setFitPreference] = useState<'justo' | 'normal' | 'largo'>(() => (localStorage.getItem('ap_fit_preference') as any) || 'normal');
  const [fitRecommendation, setFitRecommendation] = useState<string | null>(null);

  const [productQty, setProductQty] = useState(1);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  // Auto-adjust quantity based on selected variation stock
  useEffect(() => {
    if (!selectedProduct) return;
    
    let available = selectedProduct.stock;
    if (selectedProduct.sizeColorStocks && selectedProduct.sizeColorStocks[selectedSize] && selectedProduct.sizeColorStocks[selectedSize][selectedColor] !== undefined) {
      available = selectedProduct.sizeColorStocks[selectedSize][selectedColor];
    } else if (selectedProduct.colorStocks && selectedProduct.colorStocks[selectedColor] !== undefined) {
      available = selectedProduct.colorStocks[selectedColor];
    }
    
    if (available <= 0) {
      if (productQty !== 0) {
        setProductQty(0);
      }
    } else {
      if (productQty <= 0) {
        setProductQty(1);
      } else if (productQty > available) {
        setProductQty(available);
      }
    }
  }, [selectedProduct?.id, selectedSize, selectedColor, productQty]);

  // Keep selectedProduct and cart in sync with real-time products prop updates from Admin Panel
  useEffect(() => {
    if (!products || products.length === 0) return;

    if (selectedProduct) {
      const fresh = products.find(p => p.id === selectedProduct.id);
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(selectedProduct)) {
        setSelectedProduct(fresh);
      }
    }

    setCart(prevCart => {
      if (!prevCart || prevCart.length === 0) return prevCart;
      let hasChanges = false;
      const updatedCart = prevCart.map(item => {
        const fresh = products.find(p => p.id === item.product.id);
        if (fresh && JSON.stringify(fresh) !== JSON.stringify(item.product)) {
          hasChanges = true;
          return { ...item, product: fresh };
        }
        return item;
      });
      return hasChanges ? updatedCart : prevCart;
    });
  }, [products]);

  // Mock alternative angles / views inside product details
  const [detailImageIdx, setDetailImageIdx] = useState(0);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);

  // CEP simulation states
  const [cepNumber, setCepNumber] = useState('');
  const [cepResult, setCepResult] = useState<string | null>(null);
  const [isCalculatingCep, setIsCalculatingCep] = useState(false);

  // Review states per product
  const [productReviews, setProductReviews] = useState<{[key: string]: {author: string; date: string; comment: string; stars: number}[]}>({
    default: [
      { author: "Priscila Lima", date: "29/09/2025", comment: "Simplesmente maravilhoso! O tecido é super grosso, não tem transparência nenhuma. O elástico segura muito bem no treino.", stars: 5 },
      { author: "Ana Keity", date: "03/07/2025", comment: "Excelente caimento. Comprei o tamanho M e vestiu perfeitamente. Com certeza comprarei mais cores!", stars: 5 }
    ]
  });
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewStars, setNewReviewStars] = useState(5);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);

  // Wishlist / Likes simulation state
  const [wishlistLikes, setWishlistLikes] = useState<{[key: string]: {count: number; active: boolean}}>({});

  // Newsletter form state
  const [newsletterName, setNewsletterName] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isNewsletterSubmitted, setIsNewsletterSubmitted] = useState(false);

  // UX Optimizations States
  const [selectedSizesFilter, setSelectedSizesFilter] = useState<string[]>([]);
  const [selectedColorsFilter, setSelectedColorsFilter] = useState<string[]>([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Trigger loading briefly on filter/search changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery, selectedSizesFilter, selectedColorsFilter]);

  // Cart state persisted in localStorage
  const [cart, setCart] = useState<{
    product: Product;
    color: string;
    size: string;
    quantity: number;
    priceAtTime: number;
    isUpsell?: boolean;
  }[]>(() => {
    try {
      const saved = localStorage.getItem('ap_vitrine_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('[Cart Load Error]:', e);
    }
    return [];
  });

  // Automatically save cart state to localStorage whenever modified
  useEffect(() => {
    try {
      localStorage.setItem('ap_vitrine_cart', JSON.stringify(cart));
      if (cart.length > 0) {
        localStorage.setItem('ap_vitrine_cart_backup', JSON.stringify(cart));
      }
    } catch (e) {
      console.error('[Cart Save Error]:', e);
    }
  }, [cart]);

  const mixMatchPairs = useMemo(() => {
    // 1. Exclude complete Conjuntos
    const singleProducts = products.filter(p => {
      const name = (p.name || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      const isConjunto = name.includes('conjunto') || name.includes('conj.') || 
                          cat.includes('conjunto') || cat.includes('conj.');
      return !isConjunto;
    });

    // 2. Separate into single Tops and single Bottoms
    const tops = singleProducts.filter(p => {
      const cat = (p.category || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return cat.includes('top') || cat.includes('cropped') || cat.includes('blusa') || cat.includes('camiseta') || name.includes('top') || name.includes('cropped') || name.includes('regata');
    });

    const bottoms = singleProducts.filter(p => {
      const cat = (p.category || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return cat.includes('legging') || cat.includes('calça') || cat.includes('calca') || cat.includes('shorts') || cat.includes('bermuda') || name.includes('legging') || name.includes('calça') || name.includes('calca') || name.includes('shorts') || name.includes('corsário');
    });

    const pairs: { top: Product; bottom: Product }[] = [];
    const usedTops = new Set<string>();
    const usedBottoms = new Set<string>();

    // First, try to pair with matching colors/themes
    tops.forEach(top => {
      if (usedTops.has(top.id)) return;
      const topColor = (top.colors && top.colors[0]) || '';
      
      const matchingBottom = bottoms.find(b => 
        b.id !== top.id &&
        !usedBottoms.has(b.id) && 
        b.colors && 
        b.colors.some(col => col.toLowerCase() === topColor.toLowerCase())
      );
      
      if (matchingBottom) {
        pairs.push({ top, bottom: matchingBottom });
        usedTops.add(top.id);
        usedBottoms.add(matchingBottom.id);
      }
    });

    // Second, pair remaining unused tops with unused bottoms
    tops.forEach(top => {
      if (pairs.length >= 3) return;
      if (usedTops.has(top.id)) return;
      
      const matchingBottom = bottoms.find(b => b.id !== top.id && !usedBottoms.has(b.id));
      if (matchingBottom) {
        pairs.push({ top, bottom: matchingBottom });
        usedTops.add(top.id);
        usedBottoms.add(matchingBottom.id);
      }
    });

    // Third, if we still need more pairs, reuse tops or bottoms to make unique pairs (guaranteeing top and bottom are distinct)
    if (pairs.length < 3 && tops.length > 0 && bottoms.length > 0) {
      for (let t of tops) {
        if (pairs.length >= 3) break;
        for (let b of bottoms) {
          if (pairs.length >= 3) break;
          if (t.id !== b.id) {
            // Check if this specific pair combination already exists
            const alreadyExists = pairs.some(p => p.top.id === t.id && p.bottom.id === b.id);
            if (!alreadyExists) {
              pairs.push({ top: t, bottom: b });
            }
          }
        }
      }
    }

    // Strictly ensure no duplications, only allow top in 'top' position and bottom in 'bottom' position
    return pairs.filter(p => p.top && p.bottom && p.top.id !== p.bottom.id).slice(0, 3);
  }, [products]);

  const handleAddMixMatchPairToCart = (top: Product, bottom: Product) => {
    const topSize = top.sizes && top.sizes.includes('M') ? 'M' : (top.sizes && top.sizes.length > 0 ? top.sizes[0] : 'M');
    const topColor = top.colors && top.colors.length > 0 ? top.colors[0] : 'Preto';
    
    const bottomSize = bottom.sizes && bottom.sizes.includes('M') ? 'M' : (bottom.sizes && bottom.sizes.length > 0 ? bottom.sizes[0] : 'M');
    const bottomColor = bottom.colors && bottom.colors.length > 0 ? bottom.colors[0] : 'Preto';

    let topStock = top.stock;
    if (top.sizeColorStocks && top.sizeColorStocks[topSize] && top.sizeColorStocks[topSize][topColor] !== undefined) {
      topStock = top.sizeColorStocks[topSize][topColor];
    }
    let bottomStock = bottom.stock;
    if (bottom.sizeColorStocks && bottom.sizeColorStocks[bottomSize] && bottom.sizeColorStocks[bottomSize][bottomColor] !== undefined) {
      bottomStock = bottom.sizeColorStocks[bottomSize][bottomColor];
    }

    if (topStock <= 0 || bottomStock <= 0) {
      alert('Desculpe, uma das peças deste look está temporariamente sem estoque neste tamanho/cor.');
      return;
    }

    const topPriceWithDiscount = top.price * 0.95;
    const bottomPriceWithDiscount = bottom.price * 0.95;

    setCart(prev => {
      let updated = [...prev];
      const existingTopIdx = updated.findIndex(item => item.product.id === top.id && item.color === topColor && item.size === topSize);
      if (existingTopIdx > -1) {
        updated[existingTopIdx] = {
          ...updated[existingTopIdx],
          quantity: updated[existingTopIdx].quantity + 1,
          priceAtTime: topPriceWithDiscount
        };
      } else {
        updated.push({
          product: top,
          color: topColor,
          size: topSize,
          quantity: 1,
          priceAtTime: topPriceWithDiscount
        });
      }

      const existingBottomIdx = updated.findIndex(item => item.product.id === bottom.id && item.color === bottomColor && item.size === bottomSize);
      if (existingBottomIdx > -1) {
        updated[existingBottomIdx] = {
          ...updated[existingBottomIdx],
          quantity: updated[existingBottomIdx].quantity + 1,
          priceAtTime: bottomPriceWithDiscount
        };
      } else {
        updated.push({
          product: bottom,
          color: bottomColor,
          size: bottomSize,
          quantity: 1,
          priceAtTime: bottomPriceWithDiscount
        });
      }

      return updated;
    });

    alert(`Look Completo adicionado à sacola com 5% de desconto!\n- ${top.name} (${topSize} / ${topColor})\n- ${bottom.name} (${bottomSize} / ${bottomColor})`);
    handleOpenCart(1);
  };

  // Cart drawer open state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartInitialStep, setCartInitialStep] = useState<number>(1);

  const handleOpenCart = (step: number = 1) => {
    setCartInitialStep(step);
    setIsCartOpen(true);
  };

  const [checkoutStep, setCheckoutStep] = useState<number>(1);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  useEffect(() => {
    if (isCartOpen) {
      setCheckoutStep(1);
      setCheckoutError(null);
      setCompletedOrder(null);
    }
  }, [isCartOpen]);

  // Recover cart backup if returning from payment gateway without finishing
  useEffect(() => {
    try {
      const backup = localStorage.getItem('ap_vitrine_cart_backup');
      const currentCart = localStorage.getItem('ap_vitrine_cart');
      const hasActiveOrder = !!completedOrder;
      
      if (backup && (!currentCart || currentCart === '[]' || currentCart === 'null') && !hasActiveOrder) {
        setCart(JSON.parse(backup));
        localStorage.removeItem('ap_vitrine_cart_backup');
      }
    } catch (e) {
      console.error('[Cart Recovery Error]:', e);
    }
  }, [completedOrder]);

  // Checkout form info with localStorage fallback persistence
  const [clientName, setClientName] = useState(() => {
    try {
      const saved = localStorage.getItem('ap_checkout_client_data') || localStorage.getItem('ap_last_client_data') || localStorage.getItem('ap_pdv_selected_client');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.name || parsed.clientName || '';
      }
    } catch (e) {}
    return '';
  });
  const [clientPhone, setClientPhone] = useState(() => {
    try {
      const saved = localStorage.getItem('ap_checkout_client_data') || localStorage.getItem('ap_last_client_data') || localStorage.getItem('ap_pdv_selected_client');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.phone || parsed.whatsapp || '';
      }
    } catch (e) {}
    return '';
  });
  const [clientEmail, setClientEmail] = useState(() => {
    try {
      const saved = localStorage.getItem('ap_checkout_client_data') || localStorage.getItem('ap_last_client_data') || localStorage.getItem('ap_pdv_selected_client');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.email || '';
      }
    } catch (e) {}
    return '';
  });
  const [clientCpf, setClientCpf] = useState(() => {
    try {
      const saved = localStorage.getItem('ap_checkout_client_data') || localStorage.getItem('ap_last_client_data') || localStorage.getItem('ap_pdv_selected_client');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.cpf || parsed.clientCpf || parsed.clientDoc || '';
      }
    } catch (e) {}
    return '';
  });
  const [clientBirthDate, setClientBirthDate] = useState(() => {
    try {
      const saved = localStorage.getItem('ap_checkout_client_data') || localStorage.getItem('ap_last_client_data') || localStorage.getItem('ap_pdv_selected_client');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.birthDate || parsed.birth_date || '';
      }
    } catch (e) {}
    return '';
  });
  
  // Structured address components
  const [addressStreet, setAddressStreet] = useState(() => {
    try {
      const saved = localStorage.getItem('ap_checkout_client_data') || localStorage.getItem('ap_last_client_data') || localStorage.getItem('ap_pdv_selected_client');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.addressStreet || parsed.street || parsed.rua || '';
      }
    } catch (e) {}
    return '';
  });
  const [addressNum, setAddressNum] = useState(() => {
    try {
      const saved = localStorage.getItem('ap_checkout_client_data') || localStorage.getItem('ap_last_client_data') || localStorage.getItem('ap_pdv_selected_client');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.addressNum || parsed.number || parsed.numero || '';
      }
    } catch (e) {}
    return '';
  });
  const [addressComp, setAddressComp] = useState(() => {
    try {
      const saved = localStorage.getItem('ap_checkout_client_data') || localStorage.getItem('ap_last_client_data') || localStorage.getItem('ap_pdv_selected_client');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.addressComp || parsed.complement || parsed.complemento || '';
      }
    } catch (e) {}
    return '';
  });
  const [addressBairro, setAddressBairro] = useState(() => {
    try {
      const saved = localStorage.getItem('ap_checkout_client_data') || localStorage.getItem('ap_last_client_data') || localStorage.getItem('ap_pdv_selected_client');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.addressBairro || parsed.bairro || parsed.neighborhood || '';
      }
    } catch (e) {}
    return '';
  });
  const [addressCidade, setAddressCidade] = useState(() => {
    try {
      const saved = localStorage.getItem('ap_checkout_client_data') || localStorage.getItem('ap_last_client_data') || localStorage.getItem('ap_pdv_selected_client');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.addressCidade || parsed.city || parsed.cidade || '';
      }
    } catch (e) {}
    return '';
  });
  const [addressEstado, setAddressEstado] = useState(() => {
    try {
      const saved = localStorage.getItem('ap_checkout_client_data') || localStorage.getItem('ap_last_client_data') || localStorage.getItem('ap_pdv_selected_client');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.addressEstado || parsed.state || parsed.estado || '';
      }
    } catch (e) {}
    return '';
  });
  const [addressCep, setAddressCep] = useState(() => {
    try {
      const saved = localStorage.getItem('ap_checkout_client_data') || localStorage.getItem('ap_last_client_data') || localStorage.getItem('ap_pdv_selected_client');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.addressCep || parsed.cep || '';
      }
    } catch (e) {}
    return '';
  });

  const [deliveryMethod, setDeliveryMethod] = useState<'motoboy' | 'correios' | 'retirada' | 'combinar'>('motoboy');
  const motoboyRegions = useMemo(() => {
    try {
      const saved = localStorage.getItem('ap_motoboy_regions');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: '1', city: 'Natal', name: 'Zona Sul (Capim Macio, Ponta Negra, Candelária, Neópolis)', price: 10 },
      { id: '2', city: 'Natal', name: 'Zona Leste (Tirol, Petrópolis, Areia Preta, Alecrim)', price: 12 },
      { id: '3', city: 'Natal', name: 'Zona Oeste (Dix-Sept Rosado, Quintas, Felipe Camarão)', price: 15 },
      { id: '4', city: 'Natal', name: 'Zona Norte (Potengi, Igapó, Redinha)', price: 18 },
      { id: '5', city: 'Parnamirim', name: 'Nova Parnamirim / Emaús / Cohabinal', price: 15 },
      { id: '6', city: 'Parnamirim', name: 'Litoral (Cotovelo, Pirangi)', price: 25 },
      { id: '7', city: 'São Gonçalo do Amarante', name: 'Aeroporto / Centro', price: 28 },
      { id: '8', city: 'Grande Natal', name: 'Região metropolitana - outras áreas', price: 30 },
      { id: '9', city: 'Outra Região', name: 'A Combinar com o Lojista no WhatsApp', price: 0 }
    ];
  }, []);
  const [clientAddress, setClientAddress] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [couponCode, setCouponCode] = useState(() => {
    try {
      return localStorage.getItem('ap_coupon_code') || '';
    } catch (e) {
      return '';
    }
  });
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number; fixedDiscount: number } | null>(() => {
    try {
      const saved = localStorage.getItem('ap_applied_coupon');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  // Sync applied coupon with localStorage
  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem('ap_applied_coupon', JSON.stringify(appliedCoupon));
        localStorage.setItem('ap_coupon_code', appliedCoupon.code);
      } else {
        localStorage.removeItem('ap_applied_coupon');
        localStorage.removeItem('ap_coupon_code');
      }
    } catch (e) {}
  }, [appliedCoupon]);

  // Melhor Envio delivery calculation states
  const [selectedFreightFee, setSelectedFreightFee] = useState<number | null>(null);
  const [selectedFreightName, setSelectedFreightName] = useState<string>('');
  const [selectedFreightId, setSelectedFreightId] = useState<string>('');
  const [melhorEnvioOptions, setMelhorEnvioOptions] = useState<any[]>([]);
  const [isMelhorEnvioLoading, setIsMelhorEnvioLoading] = useState<boolean>(false);
  const [melhorEnvioError, setMelhorEnvioError] = useState<string | null>(null);

  // Recover checkout / cart from URL query parameter (?recuperar=ID or ?checkout=ID)
  useEffect(() => {
    if (!products || products.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const checkoutId = params.get('recuperar') || params.get('checkout');

    if (checkoutId) {
      const fetchAndRestoreCheckout = async () => {
        try {
          const res = await fetch(`/api/proxy/checkouts/${checkoutId}`);
          if (!res.ok) {
            throw new Error('Falha ao buscar checkout para recuperação.');
          }
          const data = await res.json();
          if (data && data.id) {
            const restoredCart: any[] = [];
            
            // Map items
            const checkoutItems = Array.isArray(data.items) ? data.items : [];
            for (const item of checkoutItems) {
              const prod = products.find(p => p.id === item.productId || p.name === item.productName || (item.productName && item.productName.startsWith(p.name)));
              if (prod) {
                restoredCart.push({
                  product: prod,
                  color: item.color || prod.colors?.[0] || 'Única',
                  size: item.size || prod.sizes?.[0] || 'U',
                  quantity: item.quantity || 1,
                  priceAtTime: Number(item.price || prod.price)
                });
              }
            }

            if (restoredCart.length > 0) {
              setCart(restoredCart);
              
              if (data.client_name && data.client_name !== 'Cliente Anônimo') {
                setClientName(data.client_name);
              }
              if (data.phone) {
                setClientPhone(data.phone);
              }
              if (data.email) {
                setClientEmail(data.email);
              }

              localStorage.setItem('ap_current_checkout_id', data.id);
              handleOpenCart(1);
              setCheckoutStep(1);
            }
          }
        } catch (err) {
          console.error('[PublicCatalog] Erro ao recuperar carrinho abandonado:', err);
        } finally {
          // Clean the recovery query parameters from the URL safely
          const newUrl = window.location.pathname + window.location.search.replace(/[?&](recuperar|checkout)=[^&]+/g, '');
          window.history.replaceState(null, '', newUrl);
        }
      };

      fetchAndRestoreCheckout();
    }
  }, [products]);

  // Auto load PDV / CRM selected client data when catalog loads or cart opens
  useEffect(() => {
    const loadPdvClient = () => {
      try {
        const pdvSaved = localStorage.getItem('ap_pdv_selected_client') || localStorage.getItem('ap_last_client_data') || localStorage.getItem('ap_checkout_client_data');
        if (pdvSaved) {
          const parsed = JSON.parse(pdvSaved);
          if (parsed) {
            if (!clientName && (parsed.name || parsed.clientName)) {
              setClientName(parsed.name || parsed.clientName || '');
            }
            if (!clientPhone && (parsed.phone || parsed.whatsapp || parsed.mobile)) {
              setClientPhone(parsed.phone || parsed.whatsapp || parsed.mobile || '');
            }
            if (!clientEmail && parsed.email) {
              setClientEmail(parsed.email || '');
            }
            if (!clientCpf && (parsed.cpf || parsed.document)) {
              setClientCpf(parsed.cpf || parsed.document || '');
            }
            if (!clientBirthDate && (parsed.birthDate || parsed.birth_date)) {
              setClientBirthDate(parsed.birthDate || parsed.birth_date || '');
            }
            if (!addressStreet && (parsed.addressStreet || parsed.street)) {
              setAddressStreet(parsed.addressStreet || parsed.street || '');
            }
            if (!addressNum && (parsed.addressNum || parsed.number)) {
              setAddressNum(parsed.addressNum || parsed.number || '');
            }
            if (!addressComp && (parsed.addressComp || parsed.complement)) {
              setAddressComp(parsed.addressComp || parsed.complement || '');
            }
            if (!addressBairro && (parsed.addressBairro || parsed.bairro || parsed.neighborhood)) {
              setAddressBairro(parsed.addressBairro || parsed.bairro || parsed.neighborhood || '');
            }
            if (!addressCidade && (parsed.addressCidade || parsed.city)) {
              setAddressCidade(parsed.addressCidade || parsed.city || '');
            }
            if (!addressEstado && (parsed.addressEstado || parsed.state)) {
              setAddressEstado(parsed.addressEstado || parsed.state || '');
            }
            if (!addressCep && (parsed.addressCep || parsed.cep || parsed.zip)) {
              setAddressCep(parsed.addressCep || parsed.cep || parsed.zip || '');
            }
          }
        }
      } catch (e) {
        console.warn('[PDV Client Load Error]', e);
      }
    };

    loadPdvClient();
    window.addEventListener('ap-pdv-client-updated', loadPdvClient);
    return () => window.removeEventListener('ap-pdv-client-updated', loadPdvClient);
  }, [clientName, clientCpf]);

  const handleCalculateMelhorEnvio = async (cepToCalculate: string) => {
    const cleanCep = cepToCalculate.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setMelhorEnvioError('Digite um CEP válido com 8 dígitos.');
      return;
    }

    setIsMelhorEnvioLoading(true);
    setMelhorEnvioError(null);
    // Não limpa imediatamente as opções anteriores para evitar piscada brusca na tela
    try {
      const response = await fetch('/api/melhor-envio/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to_cep: cleanCep,
          items: cart.map(item => ({
            product: { id: item.product.id, price: item.product.price },
            priceAtTime: item.priceAtTime,
            quantity: item.quantity
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao obter cotações de frete.');
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.options)) {
        setMelhorEnvioOptions(data.options);
        if (data.options.length === 0) {
          setMelhorEnvioError("Não foi possível cotar o frete no momento. Por favor, tente novamente ou escolha a opção 'Combinar com o lojista'");
        }
      } else {
        throw new Error(data.error || 'Erro na resposta da cotação.');
      }
    } catch (err: any) {
      console.error('[Melhor Envio Calculation Error]', err);
      setMelhorEnvioError("Não foi possível cotar o frete no momento. Por favor, tente novamente ou escolha a opção 'Combinar com o lojista'");
    } finally {
      setIsMelhorEnvioLoading(false);
    }
  };

  // Reset selected freight options whenever CEP or Delivery Method changes to guarantee initially zeroed fee
  useEffect(() => {
    setSelectedFreightFee(null);
    setSelectedFreightName('');
    setSelectedFreightId('');
    setMelhorEnvioOptions([]);
    setMelhorEnvioError(null);
  }, [deliveryMethod, addressCep]);

  // Busca inteligente de CEP (ViaCEP) no formulário de endereço + Cálculo Automático de Frete
  useEffect(() => {
    const cleanCep = addressCep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      // 1. Busca Logradouro / Cidade
      fetch(`/api/viacep/${cleanCep}`)
        .then(res => {
          if (!res.ok) throw new Error('Falha no servidor de busca de CEP.');
          return res.json();
        })
        .then(data => {
          if (!data.erro) {
            setAddressStreet(data.logradouro || '');
            setAddressBairro(data.bairro || '');
            setAddressCidade(data.localidade || '');
            setAddressEstado(data.uf || '');
          }
        })
        .catch(err => console.error('[ViaCEP Error] Falha ao consultar CEP:', err));

      // 2. Dispara cálculo do frete no Melhor Envio se o método de frete exigir endereço
      if (deliveryMethod === 'correios') {
        handleCalculateMelhorEnvio(cleanCep);
      } else if (deliveryMethod === 'motoboy') {
        const savedRegionId = localStorage.getItem('ap_selected_motoboy_region') || '';
        const reg = motoboyRegions.find((r: any) => r.id === savedRegionId);
        if (reg) {
          setSelectedFreightFee(reg.price);
          setSelectedFreightName(`Motoboy - ${reg.name}`);
          setSelectedFreightId(`motoboy-${reg.id}`);
        } else {
          setSelectedFreightFee(12);
          setSelectedFreightName('Motoboy Express');
          setSelectedFreightId('motoboy-express');
        }
      }
    }
  }, [addressCep, deliveryMethod]);

  const [isVipRegisteredJustNow, setIsVipRegisteredJustNow] = useState(false);
  const [vipMessage, setVipMessage] = useState('');

  // Perfil / Área VIP Cliente States
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [loggedClient, setLoggedClient] = useState<Client | null>(null);
  const [loginCpf, setLoginCpf] = useState('');
  const [loginError, setLoginError] = useState('');
  const [useCashback, setUseCashback] = useState(false);

  // UX Optimization States
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddingToCartBuyNow, setIsAddingToCartBuyNow] = useState(false);
  const [isAddingCombo, setIsAddingCombo] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [showCouponToast, setShowCouponToast] = useState(false);
  const [couponToastMsg, setCouponToastMsg] = useState('');
  const [cepResultError, setCepResultError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Lead Capture states for Wishlist Trapping
  const [isLeadCaptureOpen, setIsLeadCaptureOpen] = useState(false);
  const [leadAuthMode, setLeadAuthMode] = useState<'register' | 'login'>('register');
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadCpf, setLeadCpf] = useState('');
  const [leadPassword, setLeadPassword] = useState('');
  const [leadLoginUser, setLeadLoginUser] = useState('');
  const [leadLoginPassword, setLeadLoginPassword] = useState('');
  const [leadError, setLeadError] = useState('');
  const [isLeadSubmitting, setIsLeadSubmitting] = useState(false);
  const [pendingFavoriteProductId, setPendingFavoriteProductId] = useState<string | null>(null);

  // Sync client wishlist with state
  useEffect(() => {
    if (loggedClient && loggedClient.wishlist) {
      const ids = loggedClient.wishlist.split(',').map(s => s.trim()).filter(Boolean);
      setWishlistLikes(prev => {
        const updated = { ...prev };
        ids.forEach(id => {
          if (!updated[id]) {
            updated[id] = { count: Math.floor(Math.random() * 45) + 12, active: true };
          } else {
            updated[id] = { ...updated[id], active: true };
          }
        });
        return updated;
      });
    }
  }, [loggedClient]);
  
  // Retirada Agendamento
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');

  // Payment states in storefront Checkout
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao'>('pix');
  const [isCopiedPix, setIsCopiedPix] = useState(false);
  const [isGeneratingPaymentLink, setIsGeneratingPaymentLink] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardInstallments, setCardInstallments] = useState('1');

  // InfinitePay Dynamic Pix States
  const [checkoutOrderId, setCheckoutOrderId] = useState<string>('');
  const [dynamicPixCode, setDynamicPixCode] = useState<string>('');
  const [isFetchingPix, setIsFetchingPix] = useState<boolean>(false);

  // Initialize a stable checkoutOrderId when the cart drawer is opened
  useEffect(() => {
    if (isCartOpen && !checkoutOrderId) {
      setCheckoutOrderId(`ped-web-${Date.now().toString().slice(-4)}`);
    }
  }, [isCartOpen, checkoutOrderId]);

  // Reset order id and dynamic Pix code when cart drawer is closed
  useEffect(() => {
    if (!isCartOpen) {
      setCheckoutOrderId('');
      setDynamicPixCode('');
    }
  }, [isCartOpen]);

  // Request real-time dynamic Pix from the InfinitePay API
  const fetchDynamicPix = async (orderId: string, amount: number) => {
    if (!orderId || amount <= 0 || isFetchingPix || dynamicPixCode) return;
    setIsFetchingPix(true);
    try {
      console.log(`[InfinitePay] Solicitando Pix Dinâmico para Pedido ${orderId}, Valor: R$ ${amount}`);
      const response = await fetch('/api/infinitepay/create-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          amount: Math.round(amount * 100) // valor em centavos
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.qr_code) {
          console.log('[InfinitePay] Pix dinâmico gerado com sucesso:', data.qr_code);
          setDynamicPixCode(data.qr_code);
        } else {
          console.warn('[InfinitePay] Usando Pix local (chave estática):', data.message || 'Sem dados de QR Code');
        }
      } else {
        console.warn('[InfinitePay] Erro de resposta HTTP ao gerar Pix dinâmico. Usando fallback.');
      }
    } catch (err) {
      console.warn('[InfinitePay] Falha ao conectar com endpoint de Pix dinâmico. Usando fallback:', err);
    } finally {
      setIsFetchingPix(false);
    }
  };

  // Lists categories
  const categoriesList = useMemo(() => {
    const list = new Set(products.map(p => p.category).filter(Boolean));
    return ['Todos', ...Array.from(list)];
  }, [products]);

  // Dynamic sizes and colors for filter drawer
  const sizeOrder = useMemo(() => ['P', 'M', 'G', 'GG', 'G1', 'G2', 'G3'], []);
  const allSizes = useMemo(() => {
    const sizes = new Set<string>();
    products.forEach(p => {
      if (p.sizes && Array.isArray(p.sizes)) {
        p.sizes.forEach(sz => sizes.add(sz));
      }
    });
    return Array.from(sizes).sort((a, b) => {
      const idxA = sizeOrder.indexOf(a);
      const idxB = sizeOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [products, sizeOrder]);

  const allColors = useMemo(() => {
    const colors = new Set<string>();
    products.forEach(p => {
      if (p.colors && Array.isArray(p.colors)) {
        p.colors.forEach(c => colors.add(c));
      }
    });
    return Array.from(colors).sort();
  }, [products]);

  // Filter products that have stock
  const visibleProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (p.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || 
                              p.category === selectedCategory ||
                              (selectedCategory === 'Slim Fit' && p.name.toLowerCase().includes('slim')) ||
                              (selectedCategory === 'Plus Size' && (p.name.toLowerCase().includes('plus') || p.category?.toLowerCase().includes('plus')));
      
      const matchesSizes = selectedSizesFilter.length === 0 || 
                           (p.sizes && p.sizes.some(sz => selectedSizesFilter.includes(sz)));
      
      const matchesColors = selectedColorsFilter.length === 0 || 
                            (p.colors && p.colors.some(c => selectedColorsFilter.includes(c)));

      return matchesSearch && matchesCategory && matchesSizes && matchesColors && p.stock > 0;
    });
  }, [products, searchQuery, selectedCategory, selectedSizesFilter, selectedColorsFilter]);

  // Handle open item details modal
  const handleOpenProduct = (product: Product) => {
    setSelectedProduct(product);
    
    // Track click interaction in localStorage
    try {
      const clickMap = JSON.parse(localStorage.getItem('ap_product_clicks_map') || '{}');
      clickMap[product.id] = (clickMap[product.id] || 0) + 1;
      localStorage.setItem('ap_product_clicks_map', JSON.stringify(clickMap));
    } catch (e) {
      console.warn(e);
    }
    
    const dynamicSizes = getProductDynamicSizes(product);
    let defaultSize = dynamicSizes.length > 0 ? dynamicSizes[0] : 'Único';
    let defaultColor = 'Única';
    
    // Find the first size and color combo that has stock > 0
    let foundStockCombo = false;
    for (const sz of dynamicSizes) {
      if (product.sizeColorStocks && product.sizeColorStocks[sz]) {
        for (const col of Object.keys(product.sizeColorStocks[sz])) {
          if ((Number(product.sizeColorStocks[sz][col]) || 0) > 0) {
            defaultSize = sz;
            defaultColor = col;
            foundStockCombo = true;
            break;
          }
        }
      }
      if (foundStockCombo) break;
    }

    if (!foundStockCombo) {
      const dynamicColors = getProductDynamicColors(product);
      defaultColor = dynamicColors.length > 0 ? dynamicColors[0] : 'Única';
    }
    
    setSelectedSize(defaultSize);
    setSelectedColor(defaultColor);
    setProductQty(1);
    setDetailImageIdx(0);
    setIsVideoPlaying(false);
    setCepResult(null);
    setCepNumber('');
    setIsReviewFormOpen(false);
    
    // Add default likes if not set
    if (!wishlistLikes[product.id]) {
      setWishlistLikes(prev => ({
        ...prev,
        [product.id]: { count: Math.floor(Math.random() * 45) + 12, active: false }
      }));
    }
  };

  // Toggle wishlist heart icon with counting (Intercepted for Lead Capture and Supabase sync)
  const handleToggleWishlist = (pId: string) => {
    if (!loggedClient) {
      setPendingFavoriteProductId(pId);
      setIsLeadCaptureOpen(true);
      return;
    }

    setWishlistLikes(prev => {
      const item = prev[pId] || { count: Math.floor(Math.random() * 45) + 12, active: false };
      const nextActive = !item.active;
      const nextLikes = {
        ...prev,
        [pId]: {
          count: nextActive ? item.count + 1 : Math.max(0, item.count - 1),
          active: nextActive
        }
      };

      // Sync updated wishlist to loggedClient & Supabase immediately
      const activeIds = Object.keys(nextLikes).filter(id => nextLikes[id].active);
      const updatedClient = {
        ...loggedClient,
        wishlist: activeIds.join(',')
      };
      setLoggedClient(updatedClient);
      onAddClient(updatedClient);

      return nextLikes;
    });
  };

  // Helper to apply phone/WhatsApp mask format
  const formatWhatsApp = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 11);
    if (clean.length <= 2) return clean;
    if (clean.length <= 6) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
    }
    if (clean.length <= 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    }
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  };

  // Helper to apply CPF mask format
  const formatCPFInput = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 11);
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) {
      return `${clean.slice(0, 3)}.${clean.slice(3)}`;
    }
    if (clean.length <= 9) {
      return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
    }
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
  };

  // Handler for Lead Capture Submission (Unified Login/Cadastro Rápido)
  const handleUnifiedAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadError('');
    setIsLeadSubmitting(true);

    try {
      if (leadAuthMode === 'register') {
        if (!leadName.trim() || !leadPhone.trim() || !leadCpf.trim() || !leadPassword.trim()) {
          setLeadError('Por favor, preencha todos os campos obrigatórios (Nome, CPF, WhatsApp e Senha).');
          setIsLeadSubmitting(false);
          return;
        }

        if (!validateCPF(leadCpf)) {
          setLeadError('Por favor, informe um CPF válido.');
          setIsLeadSubmitting(false);
          return;
        }

        // Prepare client object
        const newClient: Client = {
          id: `lead-${Date.now()}`,
          name: leadName.trim(),
          email: leadEmail.trim() || '',
          phone: leadPhone.trim(),
          whatsapp: leadPhone.trim(),
          cpf: leadCpf.trim(),
          password: leadPassword.trim(),
          channel: 'E-commerce',
          npsScore: 10,
          totalSpent: 0,
          ordersCount: 0,
          createdAt: new Date().toISOString()
        };

        if (pendingFavoriteProductId) {
          newClient.wishlist = pendingFavoriteProductId;
        }

        // Call registration API
        const response = await fetch('/api/clients/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newClient)
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Erro ao realizar cadastro.');
        }

        const registeredClient = data.client;

        // Propagate to parent CRM and locally
        onAddClient(registeredClient);
        setLoggedClient(registeredClient);
        setClientName(registeredClient.name);
        setClientPhone(registeredClient.phone);
        setClientEmail(registeredClient.email || '');
        setClientCpf(registeredClient.cpf || '');

        // Prepopulate checkout address fields if available
        if (registeredClient.addressStreet) setAddressStreet(registeredClient.addressStreet);
        if (registeredClient.addressNum) setAddressNum(registeredClient.addressNum);
        if (registeredClient.addressComp) setAddressComp(registeredClient.addressComp);
        if (registeredClient.addressBairro) setAddressBairro(registeredClient.addressBairro);
        if (registeredClient.addressCidade) setAddressCidade(registeredClient.addressCidade);
        if (registeredClient.addressEstado) setAddressEstado(registeredClient.addressEstado);
        if (registeredClient.addressCep) setAddressCep(registeredClient.addressCep);

        // Toggle heart local state
        if (pendingFavoriteProductId) {
          setWishlistLikes(prev => {
            const item = prev[pendingFavoriteProductId] || { count: Math.floor(Math.random() * 45) + 12, active: false };
            return {
              ...prev,
              [pendingFavoriteProductId]: {
                count: item.count + 1,
                active: true
              }
            };
          });
        }

        // Close and notify
        setIsLeadCaptureOpen(false);
        setLeadName('');
        setLeadEmail('');
        setLeadPhone('');
        setLeadCpf('');
        setLeadPassword('');
        setPendingFavoriteProductId(null);
        alert('Conta criada e produto favoritado com sucesso! Boas compras! 💖');

      } else {
        // LOGIN MODE
        if (!leadLoginUser.trim() || !leadLoginPassword.trim()) {
          setLeadError('Por favor, preencha o campo de Identificação e Senha.');
          setIsLeadSubmitting(false);
          return;
        }

        const response = await fetch('/api/clients/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            login: leadLoginUser.trim(),
            password: leadLoginPassword.trim(),
            pendingFavoriteProductId
          })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Credenciais inválidas.');
        }

        const loggedInClient = data.client;

        // Propagate to local state & CRM
        setLoggedClient(loggedInClient);
        setClientName(loggedInClient.name);
        setClientPhone(loggedInClient.phone || loggedInClient.whatsapp || '');
        setClientEmail(loggedInClient.email || '');
        setClientCpf(loggedInClient.cpf || '');

        // Prepopulate address fields
        if (loggedInClient.addressStreet) setAddressStreet(loggedInClient.addressStreet);
        if (loggedInClient.addressNum) setAddressNum(loggedInClient.addressNum);
        if (loggedInClient.addressComp) setAddressComp(loggedInClient.addressComp);
        if (loggedInClient.addressBairro) setAddressBairro(loggedInClient.addressBairro);
        if (loggedInClient.addressCidade) setAddressCidade(loggedInClient.addressCidade);
        if (loggedInClient.addressEstado) setAddressEstado(loggedInClient.addressEstado);
        if (loggedInClient.addressCep) setAddressCep(loggedInClient.addressCep);

        // Toggle heart local state
        if (pendingFavoriteProductId) {
          setWishlistLikes(prev => {
            const item = prev[pendingFavoriteProductId] || { count: Math.floor(Math.random() * 45) + 12, active: false };
            return {
              ...prev,
              [pendingFavoriteProductId]: {
                count: item.count + 1,
                active: true
              }
            };
          });
        }

        // Close and notify
        setIsLeadCaptureOpen(false);
        setLeadLoginUser('');
        setLeadLoginPassword('');
        setPendingFavoriteProductId(null);
        alert(`Bem-vinda de volta, ${loggedInClient.name}! Produto favoritado com sucesso. 💖`);
      }
    } catch (err: any) {
      console.error('[Unified Auth Error]', err);
      setLeadError(err.message || 'Ocorreu um erro ao processar. Verifique os dados e tente novamente.');
    } finally {
      setIsLeadSubmitting(false);
    }
  };

  // Add review submission
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!newReviewAuthor.trim() || !newReviewText.trim()) {
      alert("Por favor, preencha o seu nome e sua avaliação.");
      return;
    }

    const newRev = {
      author: newReviewAuthor.trim(),
      date: new Date().toLocaleDateString('pt-BR'),
      comment: newReviewText.trim(),
      stars: newReviewStars
    };

    const pId = selectedProduct.id;
    setProductReviews(prev => {
      const currentList = prev[pId] || prev.default || [];
      return {
        ...prev,
        [pId]: [newRev, ...currentList]
      };
    });

    setNewReviewAuthor('');
    setNewReviewText('');
    setNewReviewStars(5);
    setIsReviewFormOpen(false);
    alert("Obrigada! Sua avaliação foi enviada com sucesso e cadastrada na vitrine. 🌸");
  };

  // CEP Freight simulate calculation
  const handleCalculateCep = (e: React.FormEvent) => {
    e.preventDefault();
    setCepResultError(null);
    setCepResult(null);

    const cleanCep = cepNumber.replace(/\D/g, '');
    if (cleanCep.length < 8) {
      setCepResultError("Por favor, informe um CEP válido com 8 dígitos.");
      return;
    }
    
    setIsCalculatingCep(true);
    setTimeout(() => {
      const values = [
        "Sedex Expresso: R$ 15,00 (2 dias úteis) - Ideal para urgência! ⚡",
        "PAC Econômico: R$ 9,00 (5 dias úteis) 📦",
        "Motoboy Local: R$ 12,00 (Entrega HOJE!) 🏍️",
        "Retirada Grátis em nossa Loja: R$ 0,00 🏠"
      ];
      setCepResult(values[Math.floor(Math.random() * values.length)]);
      setIsCalculatingCep(false);
    }, 600);
  };

  // Deterministic calculation for review volume maintaining 5 stars
  const getProductReviewCount = (productId: string, name: string = '', category: string = ''): number => {
    let hash = 0;
    const str = productId || '';
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);

    const isTopOrConjunto = 
      (category || '').toLowerCase().includes('tops') || 
      (category || '').toLowerCase().includes('conjuntos') || 
      (name || '').toLowerCase().includes('top');

    if (isTopOrConjunto) {
      // minimum 125, ranging between 125 and 138 (inclusive)
      return 125 + (hash % 14); // 125 to 138
    } else {
      // ranging between 62 and 135 (inclusive)
      return 62 + (hash % 74); // 62 to 135
    }
  };

  // Provador Virtual: Cálculo matemático baseado no IMC, Altura, Peso, Idade, Preferência de Caimento e Tabela de Medidas
  const calculateRecommendedSize = (
    heightCm: number, 
    weightKg: number, 
    ageYears: number,
    fit: 'justo' | 'normal' | 'largo'
  ): string => {
    if (!heightCm || !weightKg) return 'M';
    
    const product = selectedProduct || {} as any;

    // 1. Estimar medidas corporais aproximadas com base no IMC, altura, peso e idade
    // Fórmulas antropométricas simplificadas para biotipo fitness feminino/unissex
    let estimatedBusto = (weightKg * 1.25) + (heightCm * 0.08) - 22;
    let estimatedCintura = (weightKg * 1.05) - (heightCm * 0.12) + 12;
    let estimatedQuadril = (weightKg * 1.38) + (heightCm * 0.05) - 20;

    // Correção por idade (mudanças naturais de distribuição de massa muscular/gordura)
    if (ageYears > 35) {
      estimatedCintura += 1.5;
      estimatedBusto += 1.0;
    }

    // Ajuste baseado na preferência de caimento do cliente
    if (fit === 'justo') {
      estimatedBusto -= 2.5;
      estimatedCintura -= 2.5;
      estimatedQuadril -= 2.5;
    } else if (fit === 'largo') {
      estimatedBusto += 2.5;
      estimatedCintura += 2.5;
      estimatedQuadril += 2.5;
    }

    // --- ANALISAR COMPOSIÇÃO DO PRODUTO PARA MARGEM DE SEGURANÇA E ELASTICIDADE ---
    const composition = (product.composition || '').toLowerCase();
    
    // Identificar teor de elastano
    let elastanoPercent = 10; // Padrão médio padrão da loja se não preenchido
    const elastanoMatch = composition.match(/(\d+)\s*%\s*(?:de\s*)?elastano/i);
    if (elastanoMatch) {
      elastanoPercent = parseInt(elastanoMatch[1], 10);
    }

    // Identificar tecido principal
    const hasPolyester = composition.includes('poliéster') || composition.includes('poliester');
    const hasPolyamide = composition.includes('poliamida');
    
    let isPolyesterPredominant = false;
    if (hasPolyester) {
      if (!hasPolyamide) {
        isPolyesterPredominant = true;
      } else {
        // Se ambos estiverem presentes, comparar percentagem
        const polyMatch = composition.match(/(\d+)\s*%\s*(?:de\s*)?poli[eé]ster/i);
        const polyamideMatch = composition.match(/(\d+)\s*%\s*(?:de\s*)?poliamida/i);
        if (polyMatch && polyamideMatch) {
          const polyVal = parseInt(polyMatch[1], 10);
          const polyamideVal = parseInt(polyamideMatch[1], 10);
          isPolyesterPredominant = polyVal > polyamideVal;
        } else {
          // Se não há números, verificar qual palavra aparece primeiro
          isPolyesterPredominant = composition.indexOf('poliester') < composition.indexOf('poliamida') || 
                                   composition.indexOf('poliéster') < composition.indexOf('poliamida');
        }
      }
    }

    // Se poliéster predominante com baixo elastano (ex: < 10% elastano)
    const isPolyesterLowElastane = isPolyesterPredominant && elastanoPercent < 10;

    // 2. Tabela padrão de fábrica (fallback inteligente se o lojista não preencheu dados customizados)
    const fallbackSpecs: Record<string, { bustoMin: number; bustoMax: number; cinturaMin: number; cinturaMax: number; quadrilMin: number; quadrilMax: number }> = {
      P: { bustoMin: 80, bustoMax: 88, cinturaMin: 60, cinturaMax: 68, quadrilMin: 88, quadrilMax: 96 },
      M: { bustoMin: 89, bustoMax: 96, cinturaMin: 69, cinturaMax: 76, quadrilMin: 97, quadrilMax: 104 },
      G: { bustoMin: 97, bustoMax: 104, cinturaMin: 77, cinturaMax: 84, quadrilMin: 105, quadrilMax: 112 },
      GG: { bustoMin: 105, bustoMax: 112, cinturaMin: 85, cinturaMax: 92, quadrilMin: 113, quadrilMax: 120 }
    };

    const getSpecs = (sz: string, adjustForFabric: boolean) => {
      const normSz = sz.toUpperCase().trim();
      let spec = { bustoMin: 90, bustoMax: 98, cinturaMin: 70, cinturaMax: 78, quadrilMin: 98, quadrilMax: 106 };

      if (product.measurementSpecs && product.measurementSpecs[sz]) {
        spec = { ...product.measurementSpecs[sz] };
      } else if (product.measurementSpecs && product.measurementSpecs[normSz]) {
        spec = { ...product.measurementSpecs[normSz] };
      } else if (fallbackSpecs[normSz]) {
        spec = { ...fallbackSpecs[normSz] };
      }

      // Se poliéster predominante com baixo elastano, reduz a tolerância de estiramento em 15%
      if (adjustForFabric && isPolyesterLowElastane) {
        const bustoTol = spec.bustoMax - spec.bustoMin;
        const cinturaTol = spec.cinturaMax - spec.cinturaMin;
        const quadrilTol = spec.quadrilMax - spec.quadrilMin;

        spec.bustoMax = spec.bustoMin + bustoTol * 0.85;
        spec.cinturaMax = spec.cinturaMin + cinturaTol * 0.85;
        spec.quadrilMax = spec.quadrilMin + quadrilTol * 0.85;
      }

      return spec;
    };

    const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['P', 'M', 'G', 'GG'];
    
    let bestSize = sizes[0] || 'M';
    let bestScore = -999999;

    sizes.forEach(sz => {
      // Usar a tabela com as tolerâncias ajustadas pelo tipo de tecido se poliéster baixo elastano
      const spec = getSpecs(sz, true);
      let score = 0;

      // 1. Match de Busto (Importante para tops e croppeds)
      if (estimatedBusto >= spec.bustoMin && estimatedBusto <= spec.bustoMax) {
        score += 10;
      } else {
        const dist = Math.min(Math.abs(estimatedBusto - spec.bustoMin), Math.abs(estimatedBusto - spec.bustoMax));
        score -= dist * 2;
      }

      // 2. Match de Cintura
      if (estimatedCintura >= spec.cinturaMin && estimatedCintura <= spec.cinturaMax) {
        score += 10;
      } else {
        const dist = Math.min(Math.abs(estimatedCintura - spec.cinturaMin), Math.abs(estimatedCintura - spec.cinturaMax));
        score -= dist * 2;
      }

      // 3. Match de Quadril (Crítico para leggings, shorts e calças fitness)
      if (estimatedQuadril >= spec.quadrilMin && estimatedQuadril <= spec.quadrilMax) {
        score += 15;
      } else {
        const dist = Math.min(Math.abs(estimatedQuadril - spec.quadrilMin), Math.abs(estimatedQuadril - spec.quadrilMax));
        score -= dist * 3.5; // maior penalização por erro no quadril em moda fitness
      }

      if (score > bestScore) {
        bestScore = score;
        bestSize = sz;
      }
    });

    // Se o tecido for poliéster baixo elastano, fazemos verificação de upgrade explícita:
    // Caso as medidas projetadas da cliente batam acima de 85% do limite máximo do tamanho, recomendamos o tamanho maior.
    if (isPolyesterLowElastane) {
      const standardSpec = getSpecs(bestSize, false); // Pegar os limites sem ajuste (originais da fábrica)
      
      const bustoThreshold = standardSpec.bustoMin + (standardSpec.bustoMax - standardSpec.bustoMin) * 0.85;
      const cinturaThreshold = standardSpec.cinturaMin + (standardSpec.cinturaMax - standardSpec.cinturaMin) * 0.85;
      const quadrilThreshold = standardSpec.quadrilMin + (standardSpec.quadrilMax - standardSpec.quadrilMin) * 0.85;

      const isAbove85PercentLimit = 
        estimatedBusto > bustoThreshold || 
        estimatedCintura > cinturaThreshold || 
        estimatedQuadril > quadrilThreshold;

      if (isAbove85PercentLimit) {
        const currentIndex = sizes.indexOf(bestSize);
        if (currentIndex !== -1 && currentIndex < sizes.length - 1) {
          bestSize = sizes[currentIndex + 1];
        }
      }
    }

    return bestSize;
  };

  // Re-calculate recommendation on mount/product change if we have saved measurements
  useEffect(() => {
    if (fitHeight && fitWeight && fitAge) {
      const currentHeight = Number(fitHeight);
      const currentWeight = Number(fitWeight);
      const currentAge = Number(fitAge);
      const rec = calculateRecommendedSize(currentHeight, currentWeight, currentAge, fitPreference);
      setFitRecommendation(rec);
    }
  }, [fitHeight, fitWeight, fitAge, fitPreference, selectedProduct]);

  const handleApplyRecommendedSize = (size: string) => {
    setSelectedSize(size);
    setIsFittingRoomOpen(false);
    // Persist and keep the values so that they are persistent for other products!
  };

  // Compre o Look: Algoritmo de inteligência de cross-selling de peças fitness complementares
  const getComplementaryProduct = (product: Product): Product | null => {
    if (!product || !products || products.length === 0) return null;

    const cat = (product.category || '').toLowerCase();
    const name = (product.name || '').toLowerCase();

    // Identificação de grupos (Topwear vs Bottomwear)
    const isTopGroup = cat.includes('top') || cat.includes('cropped') || cat.includes('regata') || cat.includes('t-shirt') || cat.includes('camiseta') || cat.includes('blusa') || name.includes('top') || name.includes('cropped') || name.includes('regata');
    const isBottomGroup = cat.includes('shorts') || cat.includes('legging') || cat.includes('calça') || cat.includes('bermuda') || cat.includes('saia') || name.includes('shorts') || name.includes('legging') || name.includes('calça') || name.includes('bermuda');

    let matched: Product | null = null;

    if (isTopGroup) {
      // Procura uma peça de baixo
      matched = products.find(p => {
        if (p.id === product.id) return false;
        const pCat = (p.category || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();
        return pCat.includes('legging') || pCat.includes('shorts') || pCat.includes('calça') || pName.includes('legging') || pName.includes('shorts') || pName.includes('calça');
      }) || null;
    } else if (isBottomGroup) {
      // Procura uma peça de cima
      matched = products.find(p => {
        if (p.id === product.id) return false;
        const pCat = (p.category || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();
        return pCat.includes('top') || pCat.includes('cropped') || pCat.includes('regata') || pName.includes('top') || pName.includes('cropped') || pName.includes('regata');
      }) || null;
    }

    // Fallback 1: Caso não pertença a um grupo claro, busca outro produto de categoria diferente
    if (!matched) {
      matched = products.find(p => p.id !== product.id && p.category !== product.category) || null;
    }

    // Fallback 2: Qualquer outro produto que não seja ele mesmo
    if (!matched) {
      matched = products.find(p => p.id !== product.id) || null;
    }

    return matched;
  };

  // Adicionar Combo Look Inteiro à Sacola de forma transparente aplicando desconto de 5% em ambos
  const handleAddComboToCart = (compProduct: Product) => {
    if (!selectedProduct) return;

    // Estoque do produto principal
    let mainMaxStock = selectedProduct.stock;
    if (selectedProduct.sizeColorStocks && selectedProduct.sizeColorStocks[selectedSize] && selectedProduct.sizeColorStocks[selectedSize][selectedColor] !== undefined) {
      mainMaxStock = selectedProduct.sizeColorStocks[selectedSize][selectedColor];
    } else if (selectedProduct.colorStocks && selectedProduct.colorStocks[selectedColor] !== undefined) {
      mainMaxStock = selectedProduct.colorStocks[selectedColor];
    }

    if (mainMaxStock <= 0) {
      alert(`Desculpe, o tamanho ${selectedSize} na cor ${selectedColor} do produto principal está esgotado.`);
      return;
    }

    // Define cor e tamanho para o produto complementar correspondente
    // Tenta usar o mesmo tamanho para harmonia, senão usa o primeiro disponível
    const compSize = compProduct.sizes && compProduct.sizes.includes(selectedSize) 
      ? selectedSize 
      : (compProduct.sizes && compProduct.sizes.length > 0 ? compProduct.sizes[0] : 'M');
    
    // Tenta pegar a primeira cor disponível para o tamanho complementar
    const compAvailableColors = compProduct.sizeColors && compProduct.sizeColors[compSize] && compProduct.sizeColors[compSize].length > 0
      ? compProduct.sizeColors[compSize]
      : (compProduct.colors && compProduct.colors.length > 0 ? compProduct.colors : ['Única']);
    
    const compColor = Array.isArray(compAvailableColors) ? compAvailableColors[0] : compAvailableColors;

    let compMaxStock = compProduct.stock;
    if (compProduct.sizeColorStocks && compProduct.sizeColorStocks[compSize] && compProduct.sizeColorStocks[compSize][compColor] !== undefined) {
      compMaxStock = compProduct.sizeColorStocks[compSize][compColor];
    } else if (compProduct.colorStocks && compProduct.colorStocks[compColor] !== undefined) {
      compMaxStock = compProduct.colorStocks[compColor];
    }

    if (compMaxStock <= 0) {
      alert(`Desculpe, o tamanho ${compSize} na cor ${compColor} do produto complementar está esgotado.`);
      return;
    }

    setIsAddingCombo(compProduct.id);

    setTimeout(() => {
      // Calcula preços com desconto de 5%
      const discountedMainPrice = selectedProduct.price * 0.95;
      const discountedCompPrice = compProduct.price * 0.95;

      setCart(prev => {
        let updated = [...prev];

        // 1. Adicionar/Atualizar Produto Principal
        const mainExistingIdx = updated.findIndex(item => 
          item.product.id === selectedProduct.id && 
          item.color === selectedColor && 
          item.size === selectedSize
        );

        if (mainExistingIdx > -1) {
          const newQty = updated[mainExistingIdx].quantity + 1;
          updated[mainExistingIdx].quantity = Math.min(newQty, mainMaxStock);
          updated[mainExistingIdx].priceAtTime = discountedMainPrice;
        } else {
          updated.push({
            product: selectedProduct,
            color: selectedColor,
            size: selectedSize,
            quantity: 1,
            priceAtTime: discountedMainPrice
          });
        }

        // 2. Adicionar/Atualizar Produto Complementar
        const compExistingIdx = updated.findIndex(item => 
          item.product.id === compProduct.id && 
          item.color === compColor && 
          item.size === compSize
        );

        if (compExistingIdx > -1) {
          const newQty = updated[compExistingIdx].quantity + 1;
          updated[compExistingIdx].quantity = Math.min(newQty, compMaxStock);
          updated[compExistingIdx].priceAtTime = discountedCompPrice;
        } else {
          updated.push({
            product: compProduct,
            color: compColor,
            size: compSize,
            quantity: 1,
            priceAtTime: discountedCompPrice
          });
        }

        return updated;
      });

      setIsAddingCombo(null);
      setIsCartOpen(true);
      alert(`🎉 Look Completo Adicionado! Aplicamos 5% de desconto de cross-selling em ambas as peças! 🌸`);
    }, 450);
  };

  // Add item to custom checkout cart
  const handleAddToCart = () => {
    if (!selectedProduct) return;

    // Determine max available stock for selected combination
    let maxStockAvailable = selectedProduct.stock;
    if (selectedProduct.sizeColorStocks && selectedProduct.sizeColorStocks[selectedSize] && selectedProduct.sizeColorStocks[selectedSize][selectedColor] !== undefined) {
      maxStockAvailable = selectedProduct.sizeColorStocks[selectedSize][selectedColor];
    } else if (selectedProduct.colorStocks && selectedProduct.colorStocks[selectedColor] !== undefined) {
      maxStockAvailable = selectedProduct.colorStocks[selectedColor];
    }

    if (maxStockAvailable <= 0) {
      alert(`Desculpe, o tamanho ${selectedSize} na cor ${selectedColor} está fora de estoque.`);
      return;
    }

    setIsAddingToCart(true);

    setTimeout(() => {
      setCart(prev => {
        const existingIdx = prev.findIndex(item => 
          item.product.id === selectedProduct.id && 
          item.color === selectedColor && 
          item.size === selectedSize
        );

        if (existingIdx > -1) {
          const updated = [...prev];
          const newQty = updated[existingIdx].quantity + productQty;
          if (newQty > maxStockAvailable) {
            alert(`Desculpe, só há ${maxStockAvailable} unidades disponíveis desta combinação.`);
            updated[existingIdx].quantity = maxStockAvailable;
          } else {
            updated[existingIdx].quantity = newQty;
          }
          return updated;
        }

        const finalQty = Math.min(productQty, maxStockAvailable);
        return [...prev, {
          product: selectedProduct,
          color: selectedColor,
          size: selectedSize,
          quantity: finalQty,
          priceAtTime: selectedProduct.price
        }];
      });

      setIsAddingToCart(false);
      setSelectedProduct(null);
      handleOpenCart(1);
    }, 400);
  };

  // Add item and go straight to checkout screen
  const handleBuyNow = () => {
    if (!selectedProduct) return;

    // Determine max available stock for selected combination
    let maxStockAvailable = selectedProduct.stock;
    if (selectedProduct.sizeColorStocks && selectedProduct.sizeColorStocks[selectedSize] && selectedProduct.sizeColorStocks[selectedSize][selectedColor] !== undefined) {
      maxStockAvailable = selectedProduct.sizeColorStocks[selectedSize][selectedColor];
    } else if (selectedProduct.colorStocks && selectedProduct.colorStocks[selectedColor] !== undefined) {
      maxStockAvailable = selectedProduct.colorStocks[selectedColor];
    }

    if (maxStockAvailable <= 0) {
      alert(`Desculpe, o tamanho ${selectedSize} na cor ${selectedColor} está fora de estoque.`);
      return;
    }

    setIsAddingToCartBuyNow(true);

    setTimeout(() => {
      setCart(prev => {
        const existingIdx = prev.findIndex(item => 
          item.product.id === selectedProduct.id && 
          item.color === selectedColor && 
          item.size === selectedSize
        );

        if (existingIdx > -1) {
          const updated = [...prev];
          const newQty = updated[existingIdx].quantity + productQty;
          if (newQty > maxStockAvailable) {
            updated[existingIdx].quantity = maxStockAvailable;
          } else {
            updated[existingIdx].quantity = newQty;
          }
          return updated;
        }

        const finalQty = Math.min(productQty, maxStockAvailable);
        return [...prev, {
          product: selectedProduct,
          color: selectedColor,
          size: selectedSize,
          quantity: finalQty,
          priceAtTime: selectedProduct.price
        }];
      });

      setIsAddingToCartBuyNow(false);
      setSelectedProduct(null);
      handleOpenCart(2); // Goes directly to Checkout Form Step 2 (Identificação & Entrega)
    }, 400);
  };

  // Direct quick addition of a special variant from product grid
  const handleQuickAdd = (product: Product, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Find first size and color with stock > 0
    let selectedSz = '';
    let selectedCol = '';
    
    const getStockValue = (sz: string, col: string) => {
      if (product.sizeColorStocks && product.sizeColorStocks[sz] && product.sizeColorStocks[sz][col] !== undefined) {
        return product.sizeColorStocks[sz][col];
      }
      if (product.colorStocks && product.colorStocks[col] !== undefined) {
        return product.colorStocks[col];
      }
      return product.stock;
    };
    
    if (product.sizes && product.sizes.length > 0) {
      for (const sz of product.sizes) {
        const colorsList = product.sizeColors && product.sizeColors[sz]
          ? product.sizeColors[sz]
          : (product.colors && product.colors.length > 0 ? product.colors : ['Única']);
          
        for (const col of colorsList) {
          if (getStockValue(sz, col) > 0) {
            selectedSz = sz;
            selectedCol = col;
            break;
          }
        }
        if (selectedSz) break;
      }
    } else {
      const colorsList = product.colors && product.colors.length > 0 ? product.colors : ['Única'];
      for (const col of colorsList) {
        if (getStockValue('M', col) > 0) {
          selectedSz = 'M';
          selectedCol = col;
          break;
        }
      }
    }
    
    const defaultSz = selectedSz || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'M');
    let defaultCol = selectedCol;
    if (!defaultCol) {
      defaultCol = product.colors && product.colors.length > 0 ? product.colors[0] : 'Única';
      if (product.sizeColors && product.sizeColors[defaultSz] && product.sizeColors[defaultSz].length > 0) {
        defaultCol = product.sizeColors[defaultSz][0];
      }
    }
    
    const maxStockAvailable = getStockValue(defaultSz, defaultCol);
    if (maxStockAvailable <= 0) {
      alert(`Desculpe, todas as combinações deste produto estão temporariamente fora de estoque.`);
      return;
    }

    setCart(prev => {
      const idx = prev.findIndex(item => item.product.id === product.id && item.color === defaultCol && item.size === defaultSz);
      if (idx > -1) {
        const updated = [...prev];
        const newQty = updated[idx].quantity + 1;
        if (newQty > maxStockAvailable) {
          alert(`Limite de estoque de ${maxStockAvailable} un. atingido para esta combinação.`);
          updated[idx].quantity = maxStockAvailable;
        } else {
          updated[idx].quantity = newQty;
        }
        return updated;
      }
      return [...prev, {
        product,
        color: defaultCol,
        size: defaultSz,
        quantity: 1,
        priceAtTime: product.price
      }];
    });

    handleOpenCart(1);
  };

  const handleUpdateItemQty = (idx: number, amount: number) => {
    setCart(prev => {
      const updated = [...prev];
      const item = updated[idx];
      
      let maxStockAvailable = item.product.stock;
      if (item.product.sizeColorStocks && item.product.sizeColorStocks[item.size] && item.product.sizeColorStocks[item.size][item.color] !== undefined) {
        maxStockAvailable = item.product.sizeColorStocks[item.size][item.color];
      } else if (item.product.colorStocks && item.product.colorStocks[item.color] !== undefined) {
        maxStockAvailable = item.product.colorStocks[item.color];
      }

      const newQty = item.quantity + amount;
      if (newQty <= 0) {
        updated.splice(idx, 1);
      } else if (newQty > maxStockAvailable) {
        alert(`Desculpe, só há ${maxStockAvailable} unidades disponíveis desta combinação.`);
        updated[idx].quantity = maxStockAvailable;
      } else {
        updated[idx].quantity = newQty;
      }
      return updated;
    });
  };

  const handleAddProductToCartWithPrice = (product: any, color: string, size: string, priceAtTime: number, isUpsell?: boolean) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.product.id === product.id && item.color === color && item.size === size);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        if (isUpsell) {
          updated[idx].isUpsell = true;
          updated[idx].priceAtTime = priceAtTime;
        }
        return updated;
      }
      return [...prev, {
        product,
        color,
        size,
        quantity: 1,
        priceAtTime,
        isUpsell
      }];
    });
  };

  // Coupons simulation
  const extractCampaignCoupon = () => {
    try {
      const text = `${floatingBanner?.title || ''} ${floatingBanner?.subtitle || ''}`;
      const matches = text.match(/[A-Z0-9]{4,15}/g);
      if (matches) {
        const ignored = ["CUPOM", "OFF", "CARRINHO", "GRATIS", "SINAL", "VIP", "DESCONTO", "SEMANA", "GANHAR", "FRETE", "APROVEITAR", "INSERA"];
        const found = matches.find(w => !ignored.includes(w));
        if (found) return found;
      }
    } catch (e) {}
    return 'APMODAFIT';
  };

  const handleApplyCoupon = () => {
    const cleanCode = couponCode.trim().toUpperCase();
    if (!cleanCode) return;

    setCouponError(null);
    setCouponSuccess(null);
    setIsApplyingCoupon(true);

    const campaignCoupon = extractCampaignCoupon().toUpperCase();

    setTimeout(() => {
      setIsApplyingCoupon(false);
      if (cleanCode === 'FITNESS10' || cleanCode === 'VERAO10' || cleanCode === 'QUERO10') {
        setAppliedCoupon({ code: cleanCode, discountPercent: 10, fixedDiscount: 0 });
        setCouponSuccess(`Cupom ${cleanCode} (10% de desconto) aplicado com sucesso!`);
      } else if (cleanCode === 'BEMVINDA50' || cleanCode === 'MODAFIT50') {
        setAppliedCoupon({ code: cleanCode, discountPercent: 0, fixedDiscount: 50 });
        setCouponSuccess(`Cupom ${cleanCode} (R$ 50,00 de desconto) aplicado com sucesso!`);
      } else if (cleanCode === 'FRETEGRATIS') {
        setAppliedCoupon({ code: 'FRETEGRATIS', discountPercent: 0, fixedDiscount: 0 });
        setCouponSuccess('Cupom FRETEGRATIS ativado com sucesso!');
      } else if (cleanCode === campaignCoupon || cleanCode === 'APMODAFIT' || cleanCode === 'APMODAFITNESS') {
        setAppliedCoupon({ code: cleanCode, discountPercent: 5, fixedDiscount: 0 });
        setCouponSuccess(`Cupom ${cleanCode} (5% OFF e Frete Grátis) aplicado com sucesso!`);
      } else {
        setCouponError(`Este cupom promocional expirou ou é inválido. Tente ${campaignCoupon} ou FITNESS10.`);
      }
    }, 550);
  };

  // Computations
  const suggestedProduct = useMemo(() => {
    if (products && products.length > 0) {
      const items = products.filter(p => {
        const cat = (p.category || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        return (cat.includes('acessór') || cat.includes('acessor') || cat.includes('top') || cat.includes('cropped') || name.includes('garrafa') || name.includes('meia') || name.includes('boné') || name.includes('viseira') || name.includes('top')) && p.stock > 0;
      });
      const notInCart = items.filter(p => !cart.some(c => c.product.id === p.id));
      if (notInCart.length > 0) return notInCart[0];
      if (items.length > 0) return items[0];
      const anyNotInCart = products.filter(p => p.stock > 0 && !cart.some(c => c.product.id === p.id));
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

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const isUpsellItem = item.isUpsell || (suggestedProduct && item.product.id === suggestedProduct.id);
      const price = isUpsellItem ? item.product.price * 0.9 : item.priceAtTime;
      return sum + (price * item.quantity);
    }, 0);
  }, [cart, suggestedProduct]);

  const deliveryFee = useMemo(() => {
    if (deliveryMethod === 'retirada' || deliveryMethod === 'combinar') return 0;
    if (appliedCoupon?.code === 'FRETEGRATIS' || cartSubtotal >= 399) return 0;
    if (deliveryMethod === 'motoboy') return selectedFreightFee !== null ? selectedFreightFee : 12;
    if (selectedFreightFee !== null) return selectedFreightFee;
    return 0; // Se não preencheu CEP ou não escolheu frete, a taxa de envio é exibida zerada (R$ 0,00)
  }, [deliveryMethod, cartSubtotal, appliedCoupon, selectedFreightFee]);

  const cartDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountPercent > 0) {
      return Number(((cartSubtotal * appliedCoupon.discountPercent) / 100).toFixed(2));
    }
    return Math.min(cartSubtotal, appliedCoupon.fixedDiscount);
  }, [appliedCoupon, cartSubtotal]);

  // Load payment configs dynamically from local storage
  const paymentConfig = useMemo(() => {
    try {
      const saved = localStorage.getItem('ap_moda_payment_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Backward compatibility with legacy company info
    try {
      const savedLegacy = localStorage.getItem('ap_moda_company_info');
      if (savedLegacy) {
        const parsed = JSON.parse(savedLegacy);
        if (parsed && parsed.pixKey) {
          return {
            pixActive: true,
            pixKey: parsed.pixKey,
            pixKeyType: 'E-mail',
            pixDiscountPercent: 5
          };
        }
      }
    } catch (e) {}
    return {
      pixActive: true,
      pixKey: 'apmodafitness55@gmail.com',
      pixKeyType: 'E-mail',
      pixDiscountPercent: 5
    };
  }, []);

  const storeInfo = useMemo(() => {
    let name = 'AP Moda Fitness';
    let city = 'Natal';
    let state = 'RN';
    let phone = '5521991234567';

    try {
      const savedName = localStorage.getItem('ap_store_name');
      if (savedName) name = savedName;

      const savedCity = localStorage.getItem('ap_store_city');
      if (savedCity) city = savedCity;

      const savedState = localStorage.getItem('ap_store_state');
      if (savedState) state = savedState;

      const savedPhone = localStorage.getItem('ap_store_phone');
      if (savedPhone) phone = savedPhone;

      // Fallback check legacy company info
      const savedLegacy = localStorage.getItem('ap_moda_company_info');
      if (savedLegacy) {
        const parsed = JSON.parse(savedLegacy);
        if (parsed) {
          if (!savedName && parsed.name) name = parsed.name;
          if (!savedPhone && parsed.phone) phone = parsed.phone;
          if (parsed.addressLine2 && !savedCity) {
            const parts = parsed.addressLine2.split('-');
            if (parts[0]) city = parts[0].trim();
            if (parts[1]) state = parts[1].trim();
          }
        }
      }
    } catch (e) {}

    // Clean merchant name for Pix
    const cleanMerchant = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z]/g, '')
      .trim()
      .substring(0, 25) || 'APModaFitness';
    const merchantLen = String(cleanMerchant.length).padStart(2, '0');

    // Clean city for Pix
    const cleanCity = city
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z\s]/g, '')
      .replace(/\s+/g, '')
      .trim()
      .substring(0, 15) || 'SaoPaulo';
    const cityLen = String(cleanCity.length).padStart(2, '0');

    // Clean phone
    const cleanPhone = phone.replace(/\D/g, '');
    let finalPhone = cleanPhone;
    if (cleanPhone.length >= 10 && cleanPhone.length <= 11 && !cleanPhone.startsWith('55')) {
      finalPhone = `55${cleanPhone}`;
    }
    if (finalPhone.length === 0) {
      finalPhone = '5521991234567';
    }

    return {
      name,
      city,
      state,
      phone: finalPhone,
      cleanMerchant,
      merchantLen,
      cleanCity,
      cityLen
    };
  }, []);

  const storePixKey = useMemo(() => {
    return paymentConfig.pixKey || 'apmodafitness55@gmail.com';
  }, [paymentConfig]);

  const pixDiscountPercent = useMemo(() => {
    return paymentConfig.pixDiscountPercent ?? 5;
  }, [paymentConfig]);

  const pixDiscount = useMemo(() => {
    if (paymentMethod !== 'pix') return 0;
    // Dynamic discount on the product subtotal (after coupon discount)
    return Number(((cartSubtotal - cartDiscount) * (pixDiscountPercent / 100)).toFixed(2));
  }, [paymentMethod, cartSubtotal, cartDiscount, pixDiscountPercent]);

  const vipDiscount = useMemo(() => {
    if (loggedClient && (loggedClient as any).vip) {
      return Number((cartSubtotal * 0.10).toFixed(2));
    }
    return 0;
  }, [loggedClient, cartSubtotal]);

  const loggedClientSales = useMemo(() => {
    if (!loggedClient) return [];
    const clientCpfClean = (loggedClient.cpf || '').replace(/\D/g, '');
    return (sales || []).filter(s => {
      const saleCpfClean = (s.clientDoc || '').replace(/\D/g, '');
      return (clientCpfClean && saleCpfClean === clientCpfClean) || 
             (s.clientName?.toLowerCase().trim() === loggedClient.name?.toLowerCase().trim());
    });
  }, [sales, loggedClient]);

  const loggedClientOnlineOrders = useMemo(() => {
    if (!loggedClient) return [];
    const clientCpfClean = (loggedClient.cpf || '').replace(/\D/g, '');
    return (onlineOrders || []).filter(o => {
      let orderCpf = o.cpf || '';
      if (!orderCpf && o.notes) {
        const match = o.notes.match(/CPF:\s*([0-9.-]+)/i);
        if (match && match[1]) {
          orderCpf = match[1].trim();
        }
      }
      const orderCpfClean = orderCpf.replace(/\D/g, '');
      return (clientCpfClean && orderCpfClean === clientCpfClean) ||
             (o.clientName?.toLowerCase().trim() === loggedClient.name?.toLowerCase().trim());
    });
  }, [onlineOrders, loggedClient]);

  const mergedClientOrders = useMemo(() => {
    const map = new Map<string, any>();
    
    // Add sales first (sales might have richer details)
    for (const s of loggedClientSales) {
      map.set(s.id, {
        id: s.id,
        date: s.createdAt,
        total: s.total,
        status: s.status,
        status_pagamento: s.status === 'Concluída' ? 'pago' : 'pendente',
        items: (s.items || []).map((it: any) => `${it.quantity}x ${it.name}`).join(', '),
        deliveryMethod: s.deliveryMethod || 'combinar',
        trackingCode: s.trackingCode,
        status_logistico: s.status_logistico || (s.status === 'Concluída' ? 'entregue' : 'pendente'),
        address: s.address
      });
    }

    // Add onlineOrders to map (might override or supplement)
    for (const o of loggedClientOnlineOrders) {
      const existing = map.get(o.id);
      if (existing) {
        map.set(o.id, {
          ...existing,
          deliveryMethod: o.deliveryMethod || existing.deliveryMethod,
          trackingCode: o.trackingCode || existing.trackingCode,
          status_logistico: o.status_logistico || o.status_envio || existing.status_logistico,
          status_pagamento: o.status_pagamento || existing.status_pagamento,
          pickupDate: o.pickupDate,
          pickupTime: o.pickupTime
        });
      } else {
        map.set(o.id, {
          id: o.id,
          date: o.createdAt,
          total: o.total,
          status: o.status,
          status_pagamento: o.status_pagamento || 'pendente',
          items: Array.isArray(o.items) ? o.items.map((it: any) => `${it.quantity}x ${it.productName || it.name}`).join(', ') : '',
          deliveryMethod: o.deliveryMethod || 'combinar',
          trackingCode: o.trackingCode,
          status_logistico: o.status_logistico || o.status_envio || 'pendente',
          address: o.address,
          pickupDate: o.pickupDate,
          pickupTime: o.pickupTime
        });
      }
    }

    // Sort by date descending
    return Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [loggedClientSales, loggedClientOnlineOrders]);

  const availableCashback = useMemo(() => {
    return loggedClient ? (loggedClient.cashbackBalance || 0) : 0;
  }, [loggedClient]);

  const cashbackDiscount = useMemo(() => {
    if (!useCashback) return 0;
    const maxDiscountable = Math.max(0, cartSubtotal - cartDiscount - vipDiscount - pixDiscount);
    return Number(Math.min(availableCashback, maxDiscountable).toFixed(2));
  }, [useCashback, availableCashback, cartSubtotal, cartDiscount, vipDiscount, pixDiscount]);

  const cartTotal = useMemo(() => {
    return Math.max(0, Number((cartSubtotal - cartDiscount - vipDiscount - pixDiscount - cashbackDiscount + deliveryFee).toFixed(2)));
  }, [cartSubtotal, cartDiscount, vipDiscount, pixDiscount, cashbackDiscount, deliveryFee]);

  const pixPayload = useMemo(() => {
    const rawKey = storePixKey || 'apmodafitness55@gmail.com';
    const amountStr = cartTotal.toFixed(2);
    const cleanMerchant = storeInfo.cleanMerchant || 'APModaFitness';
    const cleanCity = storeInfo.cleanCity || 'SaoPaulo';

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
  }, [storePixKey, cartTotal, storeInfo]);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(dynamicPixCode || pixPayload);
    setIsCopiedPix(true);
    setTimeout(() => setIsCopiedPix(false), 2000);
  };

  // Trigger dynamic Pix generation reactively as soon as we enter checkout with Pix payment method active
  useEffect(() => {
    if (paymentMethod === 'pix' && checkoutOrderId && cartTotal > 0 && isCartOpen) {
      fetchDynamicPix(checkoutOrderId, cartTotal);
    }
  }, [paymentMethod, checkoutOrderId, cartTotal, isCartOpen]);

  // Synchronize/monitor checkout initiation as soon as cart and some contact info exists
  useEffect(() => {
    if (cart.length > 0 && (clientName.trim() || clientPhone.trim() || clientEmail.trim())) {
      const timer = setTimeout(() => {
        let checkoutId = localStorage.getItem('ap_current_checkout_id');
        if (!checkoutId) {
          checkoutId = `chk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          localStorage.setItem('ap_current_checkout_id', checkoutId);
        }

        const checkoutData = {
          id: checkoutId,
          clientName: clientName.trim() || 'Cliente Anônimo',
          phone: clientPhone.trim() || '',
          email: clientEmail.trim() || '',
          items: cart.map(it => ({
            productName: `${it.product.name} (${it.color} - ${it.size})`,
            productId: it.product.id,
            quantity: it.quantity,
            price: it.priceAtTime,
            color: it.color,
            size: it.size
          })),
          total: cartTotal,
          status: 'pendente', // status is 'pendente' until final order submission
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (onAddCheckout) {
          onAddCheckout(checkoutData);
        }
      }, 1000); // 1s debounce to avoid spamming while typing

      return () => clearTimeout(timer);
    }
  }, [clientName, clientPhone, clientEmail, cart, cartTotal, onAddCheckout]);

  // Checkout submission
  const handleCheckoutWhatsApp = async () => {
    setCheckoutError(null);

    if (cart.length === 0) {
      setCheckoutError('Seu carrinho está vazio para finalizar.');
      return;
    }
    if (!clientName.trim()) {
      setCheckoutError('Por favor, preencha o seu Nome Completo.');
      return;
    }
    if (!clientCpf.trim()) {
      setCheckoutError('Por favor, preencha o seu CPF.');
      return;
    }
    if (!validateCPF(clientCpf)) {
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

    // Cartão validations are bypassed because we redirect to InfinitePay Secure Checkout

    let finalAddress = 'Retirada no Local';
    if (deliveryMethod === 'combinar') {
      finalAddress = 'A combinar via WhatsApp';
    } else if (deliveryMethod !== 'retirada') {
      finalAddress = `${addressStreet.trim()}, ${addressNum.trim()}${addressComp.trim() ? ` (${addressComp.trim()})` : ''} - Bairro: ${addressBairro.trim()} - ${addressCidade.trim()}/${addressEstado.trim()} - CEP: ${addressCep.trim()}`;
    }

    const orderId = checkoutOrderId || `ped-web-${Date.now().toString().slice(-4)}`;

    // Compose order detail message
    const itemsListText = cart.map(item => {
      const isUpsellItem = item.isUpsell || (suggestedProduct && item.product.id === suggestedProduct.id);
      const price = isUpsellItem ? item.product.price * 0.9 : item.product.price;
      const tag = isUpsellItem ? ' (Desconto Progressivo -10%!)' : '';
      return `• *${item.quantity}x* ${item.product.name}\n  [Cor: ${item.color} | Tam: ${item.size}] (R$ ${price.toFixed(2)} un.)${tag}`;
    }).join('\n\n');

    const couponInfo = appliedCoupon ? `\n🏷️ Cupom: *${appliedCoupon.code}* (-R$ ${cartDiscount.toFixed(2)})` : '';
    const vipDiscountInfoText = vipDiscount > 0 ? `\n👑 Desconto Clube VIP (10% OFF): -R$ ${vipDiscount.toFixed(2)}` : '';
    const pixDiscountInfo = paymentMethod === 'pix' ? `\n⚡ Desconto Pix (${pixDiscountPercent}% OFF Extra): -R$ ${pixDiscount.toFixed(2)}` : '';
    const cashbackDiscountInfo = useCashback && cashbackDiscount > 0 ? `\n✨ Desconto Cashback Clube VIP: -R$ ${cashbackDiscount.toFixed(2)}` : '';
    const pickupSchedInfo = deliveryMethod === 'retirada' 
      ? `\n📅 *Agendamento de Retirada na Loja:*\n  Dia: *${new Date(pickupDate).toLocaleDateString('pt-BR')}* às *${pickupTime}*\n` 
      : '';

    const deliveryTypeLabel = 
      deliveryMethod === 'motoboy' ? 'Entrega por Motoboy 🏍️' :
      deliveryMethod === 'correios' ? 'Envio / Transportadora 📦' :
      deliveryMethod === 'combinar' ? 'Combinar Entrega 🤝' :
      'Retirar no Local de Venda 🏠';

    const paymentLabelText = paymentMethod === 'pix' 
      ? `PIX (Pago via QR Code/Chave Pix de destino: ${storePixKey}) ⚡`
      : `Cartão de Crédito - Checkout InfinitePay 💳`;

    const birthDateText = clientBirthDate.trim() ? `🎂 *Nascimento:* ${clientBirthDate.trim()}\n` : '';

    const orderMsg = 
      `🌸 *PEDIDO CONFIRMADO: AP MODA FITNESS* 🌸\n\n` +
      `👤 *Cliente:* ${clientName.trim()}\n` +
      `🆔 *CPF:* ${clientCpf.trim()}\n` +
      birthDateText +
      `📧 *E-mail:* ${clientEmail.trim()}\n` +
      `📞 *WhatsApp:* ${clientPhone.trim()}\n\n` +
      `🛍️ *Produtos Solicitados:*\n${itemsListText}\n` +
      `---------------------------------\n` +
      `💵 *Subtotal:* R$ ${cartSubtotal.toFixed(2)}\n` +
      `${couponInfo}` +
      `${vipDiscountInfoText}` +
      `${pixDiscountInfo}` +
      `${cashbackDiscountInfo}\n` +
      `🚚 *Taxa de Entrega:* R$ ${deliveryFee.toFixed(2)}${selectedFreightName ? ` (${selectedFreightName})` : ''}\n` +
      `💰 *Total Geral:* R$ ${cartTotal.toFixed(2)}\n\n` +
      `💳 *Forma de Pagamento:* ${paymentLabelText}\n` +
      `📍 *Forma de Recebimento:* ${deliveryTypeLabel}\n` +
      `${pickupSchedInfo}` +
      (deliveryMethod !== 'retirada' && deliveryMethod !== 'combinar' ? `🏠 *Endereço Completo:*\n  Rua: ${addressStreet.trim()}, Nº ${addressNum.trim()}\n  Bairro: ${addressBairro.trim()}\n  Cidade: ${addressCidade.trim()}/${addressEstado.trim()} - CEP: ${addressCep.trim()}${addressComp.trim() ? `\n  Compl.: ${addressComp.trim()}` : ''}\n` : '') +
      (clientNotes.trim() ? `📝 *Observações:* ${clientNotes.trim()}\n` : '') +
      `\nOlá! Acabei de finalizar meu pedido e efetuar o pagamento via ${paymentMethod === 'pix' ? 'PIX (comprovante anexo)' : `Cartão de Crédito`}. Aguardo a entrega das minhas lidas peças! Gratidão! 🌸✨`;

    const isCorreios = deliveryMethod === 'correios';
    const generatedTracking = isCorreios ? (() => {
      const prefixes = ['QC', 'BR', 'PM', 'AL', 'JN', 'OB', 'XY'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const middleNum = Math.floor(100000000 + Math.random() * 900000000).toString();
      return `${prefix}${middleNum}BR`;
    })() : undefined;

    // Process order back to the administration orders system via hook
    if (onAddOnlineOrder) {
      const orderData = {
        id: orderId,
        clientName: clientName.trim(),
        phone: clientPhone.trim(),
        cpf: clientCpf.trim(),
        items: cart.map(it => ({
          productName: `${it.product.name} (${it.color} - ${it.size})`,
          productId: it.product.id,
          quantity: it.quantity,
          price: it.priceAtTime,
          color: it.color,
          size: it.size
        })),
        total: cartTotal,
        status: 'Pendente',
        status_pagamento: 'pendente',
        createdAt: new Date().toISOString(),
        address: finalAddress,
        deliveryFee: deliveryFee,
        deliveryMethod: deliveryMethod,
        trackingCode: generatedTracking,
        selectedFreightId: selectedFreightId,
        selectedFreightName: selectedFreightName,
        pickupDate: deliveryMethod === 'retirada' ? pickupDate : undefined,
        pickupTime: deliveryMethod === 'retirada' ? pickupTime : undefined,
        paymentMethod: paymentMethod,
        notes: `Cor: ${cart.map(c=>c.color).join(', ')} | CPF: ${clientCpf.trim()} | Pg: ${paymentMethod === 'pix' ? 'PIX' : `Cartão (${cardInstallments}x)`} | Obs: ${clientNotes.trim()}`
      };
      
      onAddOnlineOrder(orderData);
    }

    // Mark checkout as concluded and clear current checkout ID
    const currentCheckoutId = localStorage.getItem('ap_current_checkout_id');
    if (currentCheckoutId && onAddCheckout) {
      const checkoutData = {
        id: currentCheckoutId,
        clientName: clientName.trim(),
        phone: clientPhone.trim(),
        email: clientEmail.trim(),
        items: cart.map(it => ({
          productName: `${it.product.name} (${it.color} - ${it.size})`,
          productId: it.product.id,
          quantity: it.quantity,
          price: it.priceAtTime,
          color: it.color,
          size: it.size
        })),
        total: cartTotal,
        status: 'concluido',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      onAddCheckout(checkoutData);
      localStorage.removeItem('ap_current_checkout_id');
    }

    // Save or update Customer details in CRM system
    const cleanedPhone = clientPhone.replace(/\D/g, '');
    const cleanedName = clientName.trim();
    const cleanedCpf = clientCpf.replace(/\D/g, '');
    
    // Calculate cashback accumulation: 5% of order total
    const cashbackEarned = Number((cartTotal * 0.05).toFixed(2));
    const appliedCashbackDiscount = useCashback ? cashbackDiscount : 0;

    const existingClientIndex = (clients || []).findIndex(c => {
      const matchPhone = c.phone.replace(/\D/g, '') === cleanedPhone && cleanedPhone.length > 0;
      const matchCpf = c.cpf && c.cpf.replace(/\D/g, '') === cleanedCpf && cleanedCpf.length > 0;
      const matchName = c.name.toLowerCase() === cleanedName.toLowerCase();
      return matchPhone || matchCpf || matchName;
    });

    if (existingClientIndex !== -1) {
      const existingClient = clients[existingClientIndex];
      const updatedList = [...clients];
      const nextBalance = Math.max(0, Number(((existingClient.cashbackBalance || 0) - appliedCashbackDiscount + cashbackEarned).toFixed(2)));

      updatedList[existingClientIndex] = {
        ...existingClient,
        email: clientEmail.trim() || existingClient.email,
        cpf: clientCpf.trim() || existingClient.cpf,
        birthDate: clientBirthDate.trim() || existingClient.birthDate,
        whatsapp: clientPhone.trim() || existingClient.whatsapp,
        addressStreet: addressStreet.trim() || existingClient.addressStreet,
        addressNum: addressNum.trim() || existingClient.addressNum,
        addressComp: addressComp.trim() || existingClient.addressComp,
        addressBairro: addressBairro.trim() || existingClient.addressBairro,
        addressCidade: addressCidade.trim() || existingClient.addressCidade,
        addressEstado: addressEstado.trim() || existingClient.addressEstado,
        addressCep: addressCep.trim() || existingClient.addressCep,
        totalSpent: Number((existingClient.totalSpent + cartTotal).toFixed(2)),
        ordersCount: (existingClient.ordersCount || 0) + 1,
        cashbackBalance: nextBalance
      };
      if (onUpdateClients) {
        onUpdateClients(updatedList);
      }
      setVipMessage(`Fidelidade Ativa! Cashback atualizado: você acumulou R$ ${cashbackEarned.toFixed(2)} nesta compra e possui R$ ${nextBalance.toFixed(2)} disponíveis para novos pedidos! 🌸`);
    } else {
      const newClient: Client = {
        id: `cli-${Date.now()}`,
        name: cleanedName,
        email: clientEmail.trim() || `${cleanedName.toLowerCase().replace(/\s+/g, '')}@exemplo.com`,
        phone: clientPhone.trim(),
        cpf: clientCpf.trim() || undefined,
        birthDate: clientBirthDate.trim() || undefined,
        whatsapp: clientPhone.trim(),
        addressStreet: addressStreet.trim() || undefined,
        addressNum: addressNum.trim() || undefined,
        addressComp: addressComp.trim() || undefined,
        addressBairro: addressBairro.trim() || undefined,
        addressCidade: addressCidade.trim() || undefined,
        addressEstado: addressEstado.trim() || undefined,
        addressCep: addressCep.trim() || undefined,
        channel: 'E-commerce',
        npsScore: 10,
        totalSpent: Number(cartTotal.toFixed(2)),
        ordersCount: 1,
        cashbackBalance: cashbackEarned,
        createdAt: new Date().toISOString()
      };
      onAddClient(newClient);
      setVipMessage(`Seja bem-vinda, ${cleanedName}! Seu cadastro de cliente VIP foi salvo automaticamente no sistema. ✨ Você acumulou R$ ${cashbackEarned.toFixed(2)} de cashback nesta compra!`);
    }

    // Reset login states
    setLoggedClient(null);
    setUseCashback(false);
    setIsVipRegisteredJustNow(true);

    // Unified payment link generation via real InfinitePay API (Rule 2)
    setIsGeneratingPaymentLink(true);
    try {
      const ratio = cartTotal / (cartSubtotal || 1);
      let accumulated = 0;
      const itensPayload = cart.map((it, idx) => {
        const isLast = idx === cart.length - 1;
        let adjustedPrice = Number((it.priceAtTime * ratio).toFixed(2));
        if (isLast) {
          const currentSum = accumulated + (adjustedPrice * it.quantity);
          const diff = cartTotal - currentSum;
          adjustedPrice = Number((adjustedPrice + (diff / it.quantity)).toFixed(2));
        } else {
          accumulated += adjustedPrice * it.quantity;
        }
        return {
          quantity: it.quantity,
          price: Math.round(adjustedPrice * 100), // convert unit price to cents (inteiro)
          description: `${it.product.name} (${it.color} - ${it.size})`
        };
      });

      if (deliveryFee > 0) {
        itensPayload.push({
          quantity: 1,
          price: Math.round(deliveryFee * 100), // convert unit price to cents (inteiro)
          description: 'Taxa de Entrega'
        });
      }

      // Pre-fill customer/buyer and address data for InfinitePay Checkout to prevent double data entry
      let cleanPhone = (clientPhone || '').replace(/\D/g, '');
      if (cleanPhone.length === 10 || cleanPhone.length === 11) {
        // Automatically prefix with Brazil country code 55 (critical for checkout auto-fill validation on payment gateways)
        cleanPhone = '55' + cleanPhone;
      }
      
      const cleanCpf = (clientCpf || '').replace(/\D/g, '');
      const cleanCep = (addressCep || '').replace(/\D/g, '');

      const nameParts = (clientName || '').trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || firstName;

      const buyerData = {
        first_name: firstName,
        last_name: lastName,
        name: clientName,
        email: clientEmail.trim() || `${firstName.toLowerCase()}@exemplo.com`,
        phone: cleanPhone || clientPhone,
        phone_code: '55',
        phone_number: cleanPhone || clientPhone,
        whatsapp: cleanPhone || clientPhone,
        mobile: cleanPhone || clientPhone,
        document: cleanCpf || clientCpf,
        cpf: cleanCpf || clientCpf,
        cnpj: cleanCpf || clientCpf,
        tax_id: cleanCpf || clientCpf
      };

      const addressData = {
        street: addressStreet || '',
        number: addressNum || '',
        complement: addressComp || '',
        neighborhood: addressBairro || '',
        bairro: addressBairro || '',
        district: addressBairro || '',
        city: addressCidade || '',
        cidade: addressCidade || '',
        state: addressEstado || '',
        uf: addressEstado || '',
        zip: cleanCep || addressCep || '',
        cep: cleanCep || addressCep || '',
        zip_code: cleanCep || addressCep || '',
        postal_code: cleanCep || addressCep || '',
        country: 'BR',
        logradouro: addressStreet || '',
        numero: addressNum || ''
      };

      // Highly redundant payloads to support all historical and current schema variants of InfinitePay Checkout Links
      const customerPayload = {
        ...buyerData,
        address: addressData,
        billing_address: addressData,
        shipping_address: addressData
      };

      const shippingPayload = {
        name: clientName,
        phone: cleanPhone || clientPhone,
        phone_number: cleanPhone || clientPhone,
        whatsapp: cleanPhone || clientPhone,
        mobile: cleanPhone || clientPhone,
        address: addressData,
        shipping_address: addressData,
        billing_address: addressData
      };

      const metadataPayload = {
        customer_name: clientName,
        customer_email: clientEmail,
        customer_phone: cleanPhone || clientPhone,
        customer_cpf: cleanCpf || clientCpf,
        shipping_street: addressStreet,
        shipping_number: addressNum,
        shipping_complement: addressComp,
        shipping_neighborhood: addressBairro,
        shipping_city: addressCidade,
        shipping_state: addressEstado,
        shipping_zip: cleanCep || addressCep,
        shipping_cep: cleanCep || addressCep,
        shipping_zip_code: cleanCep || addressCep
      };

      let linkData: any = null;
      try {
        console.log('[InfinitePay Checkout] Enviando requisição POST direta para https://api.checkout.infinitepay.io/links');
        const directResponse = await fetch('https://api.checkout.infinitepay.io/links', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            handle: "ap-moda-fitness",
            order_nsu: orderId,
            redirect_url: window.location.href,
            items: itensPayload,
            itens: itensPayload,
            buyer: customerPayload,
            customer: customerPayload,
            shipping: shippingPayload,
            shipping_address: addressData,
            billing_address: addressData,
            address: addressData,
            metadata: metadataPayload
          })
        });

        if (directResponse.ok) {
          linkData = await directResponse.json();
          console.log('[InfinitePay Checkout] Link criado diretamente com dados de cliente preenchidos:', linkData);
        } else {
          const errText = await directResponse.text();
          console.warn('[InfinitePay Checkout] Falha na requisição direta, tentando via servidor proxy:', errText);
        }
      } catch (directErr) {
        console.warn('[InfinitePay Checkout] Exceção na requisição direta, tentando via servidor proxy:', directErr);
      }

      if (!linkData || !linkData.url) {
        const response = await fetch('/api/infinitepay/create-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            order_nsu: orderId,
            redirect_url: window.location.href,
            itens: itensPayload,
            isCents: true,
            buyer: customerPayload,
            customer: customerPayload,
            shipping: shippingPayload,
            shipping_address: addressData,
            billing_address: addressData,
            address: addressData,
            metadata: metadataPayload
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || 'Erro ao criar o link de pagamento na InfinitePay.');
        }

        linkData = await response.json();
      }

      if (linkData && linkData.url) {
        // Capture Pix data if returned by InfinitePay API response (Rule 3)
        let qrCodeImage = linkData.qrcode_image || linkData.qr_code_image || linkData.pix?.qrcode_image || linkData.pix?.qr_code_image || linkData.metadata?.qrcode_image || linkData.metadata?.qr_code_image || '';
        let emvString = linkData.emv || linkData.pix_code || linkData.pix || linkData.pix?.emv || linkData.pix?.copia_e_cola || linkData.metadata?.emv || linkData.metadata?.pix || '';
        let hasDynamicPix = !!(qrCodeImage || emvString);

        if (paymentMethod === 'pix') {
          console.log('[InfinitePay Checkout] Processando Pix Dinâmico legítimo:', { hasDynamicPix, qrCodeImage, emvString });
          setCompletedOrder({
            id: orderId,
            total: cartTotal,
            subtotal: cartSubtotal,
            discount: cartDiscount,
            pixDiscount: pixDiscount,
            cashbackDiscount: cashbackDiscount,
            deliveryFee: deliveryFee,
            paymentMethod: 'pix',
            deliveryMethod: deliveryMethod,
            trackingCode: generatedTracking,
            pickupDate: deliveryMethod === 'retirada' ? pickupDate : undefined,
            pickupTime: deliveryMethod === 'retirada' ? pickupTime : undefined,
            items: cart.map(it => ({
              productName: `${it.product.name} (${it.color} - ${it.size})`,
              quantity: it.quantity,
              price: it.priceAtTime,
              color: it.color,
              size: it.size
            })),
            qrcode_image: qrCodeImage,
            emv: emvString,
            pixPayload: emvString || pixPayload, // fallback to static key if completely missing
            paymentUrl: linkData.url,
            orderMsg: orderMsg
          });

          localStorage.setItem('ap_vitrine_cart_backup', JSON.stringify(cart));
          setCart([]);
          setIsGeneratingPaymentLink(false);

          if (!hasDynamicPix) {
            console.log('[InfinitePay Checkout] Resposta sem Pix direto. Redirecionando cliente para checkout Pix externo:', linkData.url);
            window.location.href = linkData.url;
          }
        } else {
          // Credit card flow: keep exactly intact and redirect to external checkout page!
          console.log('[InfinitePay Checkout] Redirecionando cliente para checkout seguro de Cartão:', linkData.url);
          setCompletedOrder({
            id: orderId,
            total: cartTotal,
            subtotal: cartSubtotal,
            discount: cartDiscount,
            pixDiscount: pixDiscount,
            cashbackDiscount: cashbackDiscount,
            deliveryFee: deliveryFee,
            paymentMethod: 'cartao',
            deliveryMethod: deliveryMethod,
            trackingCode: generatedTracking,
            pickupDate: deliveryMethod === 'retirada' ? pickupDate : undefined,
            pickupTime: deliveryMethod === 'retirada' ? pickupTime : undefined,
            items: cart.map(it => ({
              productName: `${it.product.name} (${it.color} - ${it.size})`,
              quantity: it.quantity,
              price: it.priceAtTime,
              color: it.color,
              size: it.size
            })),
            paymentUrl: linkData.url,
            orderMsg: orderMsg
          });

          localStorage.setItem('ap_vitrine_cart_backup', JSON.stringify(cart));
          setCart([]);
          setIsGeneratingPaymentLink(false);
          window.location.href = linkData.url;
        }
      } else {
        throw new Error('URL de pagamento não recebida do servidor.');
      }
    } catch (err: any) {
      console.error('[InfinitePay Client Error]:', err);
      setCheckoutError(`Não foi possível gerar o link de pagamento InfinitePay: ${err.message || err}. Por favor, tente novamente.`);
      setIsGeneratingPaymentLink(false);
      return;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-pink-100 selection:text-pink-600 pb-16 relative">
      
      {/* Main E-Commerce Scrollable Vitrine Body Block */}
      <div className="flex-1 mt-0 relative transition-all duration-300">
        
        {/* 1. Ticker Announcement Bar */}
        {tickerConfig.show && (
          <div 
            className="text-white py-2 px-4 shadow-sm relative overflow-hidden h-9"
            style={{ backgroundColor: tickerConfig.bgColor, color: tickerConfig.textColor }}
          >
            <div className="absolute inset-x-0 top-0 flex items-center justify-center h-full animate-pulse">
              <p className="text-[10px] md:text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>{tickerConfig.text}</span>
              </p>
            </div>
          </div>
        )}

        {/* 1.5 Active Coupon Banner */}
        {appliedCoupon && (
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white py-1.5 px-4 text-center text-[11px] md:text-xs font-bold flex items-center justify-center gap-2 shadow-sm animate-in fade-in duration-300">
            <span>
              🏷️ Cupom <strong className="font-mono bg-white/20 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">{appliedCoupon.code}</strong> Ativo! 
              {appliedCoupon.discountPercent > 0 ? ` (${appliedCoupon.discountPercent}% OFF e Frete Grátis na sacola)` : ` (R$ ${appliedCoupon.fixedDiscount.toFixed(2)} OFF na sacola)`}
            </span>
            <button 
              type="button" 
              onClick={() => handleOpenCart(1)}
              className="bg-white text-emerald-800 hover:bg-emerald-50 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs transition ml-1 cursor-pointer border-none"
            >
              Ver Sacola →
            </button>
            <button 
              type="button" 
              onClick={() => {
                setAppliedCoupon(null);
                setCouponCode('');
                setCouponSuccess(null);
                try {
                  localStorage.removeItem('ap_applied_coupon');
                  localStorage.removeItem('ap_coupon_code');
                } catch (e) {}
              }} 
              className="text-white/80 hover:text-white text-[10px] ml-2 p-1 font-normal cursor-pointer border-none bg-transparent"
              title="Remover cupom"
            >
              ✕
            </button>
          </div>
        )}

      {/* 2. Main Premium Sticky Header */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 px-4 md:px-8 py-3 flex justify-between items-center max-w-7xl mx-auto rounded-b-3xl">
        {/* Left Side menu indicators */}
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setIsMenuDrawerOpen(true)}
            className="p-2 text-slate-700 hover:text-pink-600 hover:bg-slate-50 rounded-full transition cursor-pointer"
          >
            <Menu size={20} />
          </button>
          <button 
            type="button"
            onClick={() => {
              const el = document.getElementById('search-catalog-bar');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="p-2 text-slate-700 hover:text-pink-600 hover:bg-slate-50 rounded-full transition cursor-pointer"
          >
            <Search size={18} />
          </button>
        </div>

        {/* Center: Curvy Elegant Serif Brand Name Logo */}
        <div className="flex flex-col items-center">
          <span className="font-serif italic text-2xl md:text-3xl font-normal leading-none tracking-normal text-slate-950 select-none cursor-pointer">
            {storeName}
          </span>
          <span className="text-[8px] font-bold uppercase tracking-widest mt-0.5 font-sans" style={{ color: themeColor }}>
            {storeSub}
          </span>
        </div>

        {/* Right side user elements & cart badging */}
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className={`p-2 rounded-full transition cursor-pointer relative ${loggedClient ? 'bg-pink-50 text-pink-700 border border-pink-200/50' : 'text-slate-700 hover:text-pink-600 hover:bg-slate-50'}`}
            title={loggedClient ? `Olá, ${loggedClient.name} (Clube VIP)` : "Área VIP Cliente & Cashback"}
          >
            <User size={18} />
            {loggedClient && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </button>
          
          <button 
            onClick={() => handleOpenCart(1)}
            className="relative p-2.5 bg-pink-50/50 hover:bg-pink-100 text-pink-600 hover:text-pink-700 rounded-full transition duration-300 cursor-pointer border border-pink-100/40"
            title="Minha Sacola"
          >
            <ShoppingBag size={18} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-600 text-white border-2 border-white rounded-full flex items-center justify-center text-[9px] font-extrabold tracking-tight animate-bounce">
                {cart.reduce((s, c) => s + c.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 3. High quality Lookbook Banner Autoplay Slider */}
      <section className="w-full mt-4">
        {isLoading ? (
          <div className="relative rounded-none overflow-hidden bg-[#1E3A42]/5 border border-[#1E3A42]/10 min-h-[260px] md:min-h-[340px] flex items-center justify-start pl-6 md:pl-16 animate-pulse">
            <div className="space-y-4 max-w-xl">
              <div className="h-5 w-24 bg-[#1E3A42]/10 rounded-full" />
              <div className="h-10 w-80 bg-[#1E3A42]/15 rounded-sm" />
              <div className="h-4 w-60 bg-[#1E3A42]/10 rounded-sm" />
              <div className="h-10 w-36 bg-[#1E3A42]/15 rounded-full" />
            </div>
          </div>
        ) : (
          <div className="relative rounded-none overflow-hidden bg-slate-900 text-white min-h-[260px] md:min-h-[340px] flex items-center shadow-lg transition-all duration-700">
            
            {/* Animated Background image based on lookbook model collection */}
            <div 
              onClick={() => {
                const slide = lookbookSlides[currentSlide];
                const cat = slide.category || 'Todos';
                setSelectedCategory(cat);
                const target = document.getElementById('colecao-run-anchor');
                if (target) target.scrollIntoView({ behavior: 'smooth' });
              }}
              className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-102 cursor-pointer hover:scale-[1.03]"
              style={{ 
                backgroundImage: `url('${lookbookSlides[currentSlide].image}')`,
                filter: 'brightness(0.65)'
              }}
              title={`Clique para ver a coleção de ${lookbookSlides[currentSlide].category || 'novidades'}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-slate-900/10 pointer-events-none" />

            {/* Slogan overlaid details with slide elements */}
            <div 
              onClick={() => {
                const slide = lookbookSlides[currentSlide];
                const cat = slide.category || 'Todos';
                setSelectedCategory(cat);
                const target = document.getElementById('colecao-run-anchor');
                if (target) target.scrollIntoView({ behavior: 'smooth' });
              }}
              className="relative max-w-xl pl-6 pr-6 md:pl-16 space-y-4 z-10 text-left cursor-pointer hover:opacity-95"
            >
              <span style={{ backgroundColor: themeColor }} className="inline-flex items-center gap-1.5 text-white font-sans font-extrabold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                <Sparkles size={10} />
                <span>{lookbookSlides[currentSlide].tag}</span>
              </span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight uppercase font-sans">
                {lookbookSlides[currentSlide].title}
              </h2>
              <p className="text-[11px] md:text-xs text-slate-250 leading-relaxed max-w-md font-medium">
                {lookbookSlides[currentSlide].desc}
              </p>
              <div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const slide = lookbookSlides[currentSlide];
                    const cat = slide.category || 'Todos';
                    setSelectedCategory(cat);
                    const target = document.getElementById('colecao-run-anchor');
                    if (target) target.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-white hover:bg-pink-600 text-slate-900 hover:text-white font-bold text-[10px] uppercase tracking-wider py-2.5 px-5 rounded-full transition duration-300 shadow-md cursor-pointer border-none"
                >
                  {lookbookSlides[currentSlide].category && lookbookSlides[currentSlide].category !== 'Todos' 
                    ? `Ver ${lookbookSlides[currentSlide].category} →` 
                    : 'Comprar Coleção'}
                </button>
              </div>
            </div>

            {/* Indicators dots for carousel state */}
            <div className="absolute bottom-5 right-1/2 translate-x-1/2 flex gap-2 z-25">
              {lookbookSlides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlide(idx);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300
                    ${currentSlide === idx ? 'w-5 bg-white' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 3.5. Instagram Stories-style Horizontal Categories Carousel */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 mt-5 select-none animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Explorar Coleções</span>
          {selectedCategory !== 'Todos' && (
            <button 
              onClick={() => setSelectedCategory('Todos')}
              className="text-[10px] font-extrabold uppercase tracking-wider cursor-pointer border-none bg-transparent p-0 transition"
              style={{ color: themeColor }}
            >
              Ver Todas ×
            </button>
          )}
        </div>
        <div className="flex items-center gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {categoriesList.map(cat => {
            const isSelected = selectedCategory === cat;
            const thumbnail = getCategoryThumbnail(cat);
            return (
              <button
                key={`story-cat-${cat}`}
                onClick={() => {
                  setSelectedCategory(cat);
                  // Smooth scroll to catalog grid
                  const gridAnchor = document.getElementById('colecao-run-anchor');
                  if (gridAnchor) {
                    gridAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="flex flex-col items-center gap-1.5 focus:outline-hidden group cursor-pointer border-none bg-transparent p-0 flex-shrink-0"
              >
                {/* Round card outer border styled like Instagram Stories */}
                <div 
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center p-[2px] transition-all duration-300 transform group-hover:scale-105 active:scale-95
                    ${isSelected 
                      ? 'border border-pink-500' 
                      : 'border border-slate-200/80 hover:border-slate-400'} ${activeAnimation && activeAnimation !== 'none' ? `anim-${activeAnimation}` : ''}`}
                  style={isSelected ? { borderColor: themeColor, boxShadow: `0 0 0 2px ${themeColor}` } : {}}
                >
                  {/* Round image container */}
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-50 border border-white">
                    <img 
                      src={thumbnail} 
                      alt={cat} 
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                {/* Category label */}
                <span 
                  className={`text-[10px] md:text-xs font-bold transition-colors truncate max-w-[70px] md:max-w-[85px] text-center
                    ${isSelected ? 'font-black' : 'text-slate-600 group-hover:text-slate-900'}`}
                  style={isSelected ? { color: themeColor } : {}}
                >
                  {cat}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Core Benefits & Trust Icons Rows */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 mt-5 border-t border-b border-[#1E3A42]/10 py-4">
        <div className="grid grid-cols-4 gap-1.5 md:gap-4 items-center justify-items-center text-center">
          {benefitCards.map((card, idx) => {
            const Icon = idx === 0 ? Truck : idx === 1 ? CreditCard : idx === 2 ? Lock : Sparkles;
            
            // Clean/shorten label heuristically for absolute slim elegance
            let displayTitle = card.title;
            let displaySubtitle = card.subtitle;
            if (displayTitle === 'Envio para todo o Brasil') {
              displayTitle = 'Frete Grátis';
              displaySubtitle = 'Todo o Brasil';
            } else if (displayTitle === 'Até 6x no Cartão') {
              displayTitle = 'Até 6x Sem Juros';
              displaySubtitle = 'Parcelas no cartão';
            } else if (displayTitle === 'Compra 100% Segura') {
              displayTitle = 'Compra Segura';
              displaySubtitle = 'Dados protegidos';
            } else if (displayTitle === 'Desconto Extra no Pix') {
              displayTitle = 'Desconto no PIX';
              displaySubtitle = '5% OFF extra';
            }

            return (
              <div key={card.id || idx} className="flex flex-col items-center justify-center gap-1">
                <div className="text-[#1E3A42] flex items-center justify-center flex-shrink-0">
                  <Icon size={16} strokeWidth={2.5} />
                </div>
                <div className="text-center">
                  <p className="font-sans font-extrabold text-[#1E3A42] text-[9px] md:text-[11px] leading-tight tracking-wider uppercase">{displayTitle}</p>
                  <p className="text-[#1E3A42]/60 text-[8px] md:text-[9.5px] font-medium leading-none mt-0.5">{displaySubtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Bento Category Highlights: Slim Fit vs Plus Size */}
      <section className="w-full mt-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2 md:gap-3 w-full animate-pulse">
            <div className="h-36 md:h-48 bg-[#1E3A42]/5 border border-[#1E3A42]/10 rounded-none flex items-end p-4">
              <div className="space-y-1">
                <div className="h-6 w-24 bg-[#1E3A42]/10 rounded" />
                <div className="h-3 w-32 bg-[#1E3A42]/10 rounded" />
              </div>
            </div>
            <div className="h-36 md:h-48 bg-[#1E3A42]/5 border border-[#1E3A42]/10 rounded-none flex items-end p-4">
              <div className="space-y-1">
                <div className="h-6 w-24 bg-[#1E3A42]/10 rounded" />
                <div className="h-3 w-32 bg-[#1E3A42]/10 rounded" />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            
            {/* Box 1: Slim Fit highlighting model in activewear */}
            <div 
              onClick={() => setSelectedCategory('Slim Fit')}
              className={`group rounded-none h-36 md:h-48 overflow-hidden relative cursor-pointer shadow-xs border transition duration-300
                ${selectedCategory === 'Slim Fit' ? 'border-[#1E3A42] scale-[1.01] ring-2 ring-[#1E3A42]/10' : 'border-transparent hover:border-[#1E3A42]/20'}`}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center group-hover:scale-103 transition duration-500"
                style={{ backgroundImage: `url('${categoryBanners.slimFit}')` }}
              />
              <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/30 transition duration-300" />
              
              <div className="absolute inset-0 flex flex-col justify-end p-4 text-left">
                <p className="font-serif italic text-2xl md:text-3xl font-medium text-white tracking-wide">Slim Fit</p>
                <p className="text-[9px] md:text-10px font-bold text-[#FAF9F6]/80 tracking-widest uppercase">Coleção modeladora</p>
              </div>
            </div>

            {/* Box 2: Plus Size highlighting model in dark activewear */}
            <div 
              onClick={() => setSelectedCategory('Plus Size')}
              className={`group rounded-none h-36 md:h-48 overflow-hidden relative cursor-pointer shadow-xs border transition duration-300
                ${selectedCategory === 'Plus Size' ? 'border-[#1E3A42] scale-[1.01] ring-2 ring-[#1E3A42]/10' : 'border-transparent hover:border-[#1E3A42]/20'}`}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center group-hover:scale-103 transition duration-500"
                style={{ backgroundImage: `url('${categoryBanners.plusSize}')` }}
              />
              <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/30 transition duration-300" />
              
              <div className="absolute inset-0 flex flex-col justify-end p-4 text-left">
                <p className="font-serif italic text-2xl md:text-3xl font-medium text-white tracking-wide">Plus Size</p>
                <p className="text-[9px] md:text-10px font-bold text-[#FAF9F6]/80 tracking-widest uppercase">Caimento esculpido</p>
              </div>
            </div>

          </div>
        )}
      </section>

      {/* Mix & Match Section */}
      {mixMatchPairs.length > 0 && (
        <section className="w-full mt-10">
          {/* Full-width, completely straight corner banner */}
          <div className="w-full bg-[#1E3A42] text-[#FAF9F6] py-10 px-6 md:px-12 rounded-none text-center relative overflow-hidden flex flex-col items-center justify-center">
            {/* Subtle background abstract lines or brand aesthetic */}
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#FAF9F6_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="relative z-10 max-w-3xl space-y-2">
              <span className="inline-flex items-center gap-1.5 text-white/90 font-sans font-extrabold text-[9px] uppercase tracking-widest px-3.5 py-1 rounded-full bg-[#FAF9F6]/10">
                ⚡ Combinações Inteligentes
              </span>
              <h3 className="font-serif italic text-3xl md:text-4xl font-light tracking-tight text-white pt-2">
                Mix & Match — Confira os looks mais pedidos!
              </h3>
              <p className="text-[12px] text-[#FAF9F6]/80 font-light tracking-wide max-w-xl mx-auto">
                Peças selecionadas pela nossa curadoria para criar o conjunto perfeito com caimento de alto padrão.
              </p>
              <div className="inline-block mt-3 bg-white/10 text-white border border-white/20 px-4 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-widest">
                ⭐ Ganhe 5% OFF no Look Completo!
              </div>
            </div>
          </div>

          {/* Product grid with elegant spacing */}
          <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mixMatchPairs.map((pair, idx) => (
                <div 
                  key={idx} 
                  className="bg-white border border-[#1E3A42]/5 hover:border-[#1E3A42]/15 rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 group"
                >
                  <div className="space-y-4">
                    {/* Visual side-by-side pair */}
                    <div className="grid grid-cols-2 gap-2 relative">
                      <div 
                        onClick={() => handleOpenProduct(pair.top)}
                        className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-50 border border-[#1E3A42]/5 cursor-pointer hover:scale-102 transition duration-300"
                      >
                        <img 
                          src={pair.top.image} 
                          alt={pair.top.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/50 backdrop-blur-xs py-0.5 px-1 rounded text-[8px] font-bold text-white uppercase text-center truncate">
                          {pair.top.category || 'Peça Superior'}
                        </div>
                      </div>

                      <div 
                        onClick={() => handleOpenProduct(pair.bottom)}
                        className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-50 border border-[#1E3A42]/5 cursor-pointer hover:scale-102 transition duration-300"
                      >
                        <img 
                          src={pair.bottom.image} 
                          alt={pair.bottom.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/50 backdrop-blur-xs py-0.5 px-1 rounded text-[8px] font-bold text-white uppercase text-center truncate">
                          {pair.bottom.category || 'Peça Inferior'}
                        </div>
                      </div>

                      {/* Connection plus icon */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1E3A42] text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm shadow-md border border-white">
                        +
                      </div>
                    </div>

                    <div className="text-left space-y-1.5">
                      <p className="text-[11px] font-bold text-[#1E3A42] uppercase tracking-wider opacity-85">Conjunto {idx + 1}</p>
                      <h4 className="text-[12px] font-semibold text-slate-800 line-clamp-2 leading-tight">
                        {pair.top.name} + {pair.bottom.name}
                      </h4>
                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-[10px] text-slate-450 line-through font-mono">
                          R$ {(pair.top.price + pair.bottom.price).toFixed(2)}
                        </span>
                        <span className="text-[14px] font-extrabold text-[#1E3A42] font-mono">
                          R$ {((pair.top.price + pair.bottom.price) * 0.95).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddMixMatchPairToCart(pair.top, pair.bottom)}
                    className={`mt-4 w-full bg-[#1E3A42] hover:bg-[#13242A] text-white py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-97 cursor-pointer ${activeAnimation && activeAnimation !== 'none' ? `anim-${activeAnimation}` : ''}`}
                  >
                    <ShoppingBag size={12} />
                    <span>Adicionar Look Completo (5% OFF)</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Brand title block separator */}
      <span id="colecao-run-anchor" className="block h-1 scroll-mt-20" />

      {/* 6. Main Catalog grid blocks listing */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-4 md:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">
        
        {/* Left Side options list (Hidden on Mobile for immediate product visibility) */}
        <div className="hidden lg:block lg:col-span-3 space-y-5">
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4">
            
            {/* Search items bar */}
            <div id="search-catalog-bar" className="space-y-1.5 scroll-mt-24">
              <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Consultar Vitrine</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-450 pointer-events-none">
                  <Search size={14} className="text-slate-400" />
                </span>
                <input 
                  type="text"
                  placeholder="Pesquisar calça, top, macacão..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2 pl-9 pr-3 text-xs placeholder-slate-400 focus:outline-hidden focus:border-pink-500 font-medium"
                />
              </div>
            </div>

            {/* Trust highlights info */}
            <div className="border-t border-slate-50 pt-4 space-y-3 text-[11px] text-slate-500 font-medium font-sans">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-xs font-bold">✓</div>
                <span>Zero Transparência Garantida</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-xs font-bold">✓</div>
                <span>Finalização rápida em 1 clique</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-xs font-bold">✓</div>
                <span>Atendimento humano pelo WhatsApp</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side grid listing */}
        <div className="col-span-12 lg:col-span-9 space-y-6 text-center">
          
          {/* Centered Collection header from videos */}
          <div className="space-y-2 text-center py-2">
            <h3 className="font-serif italic text-3xl font-medium tracking-tight text-slate-900">
              Coleção Run
            </h3>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
              Confira nossa nova coleção!
            </p>

            {/* Discrete filter trigger button */}
            <div className="flex items-center justify-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#1E3A42]/15 hover:border-[#1E3A42]/30 text-[#1E3A42] bg-[#FAF9F6] rounded-full text-[10px] md:text-[11px] font-extrabold uppercase tracking-widest transition shadow-xs cursor-pointer active:scale-95"
              >
                <Palette size={12} className="text-[#1E3A42]" />
                <span>Filtrar</span>
                {(selectedSizesFilter.length > 0 || selectedColorsFilter.length > 0) && (
                  <span className="ml-1 w-4 h-4 bg-[#1E3A42] text-white text-[9px] rounded-full flex items-center justify-center font-bold font-mono">
                    {selectedSizesFilter.length + selectedColorsFilter.length}
                  </span>
                )}
              </button>

              {(selectedSizesFilter.length > 0 || selectedColorsFilter.length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSizesFilter([]);
                    setSelectedColorsFilter([]);
                  }}
                  className="text-[9px] text-[#1E3A42]/60 hover:text-[#1E3A42] underline font-extrabold uppercase tracking-wider cursor-pointer bg-transparent border-none p-0"
                >
                  Limpar filtros
                </button>
              )}
            </div>

            {/* Compact Search Bar for Mobile view */}
            <div className="block lg:hidden max-w-sm mx-auto px-2 pt-1" id="search-catalog-bar-mobile">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Search size={14} />
                </span>
                <input 
                  type="text"
                  placeholder="Pesquisar calça, top, macacão..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs placeholder-slate-400 focus:outline-hidden focus:border-pink-500 font-medium shadow-xs"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={`skeleton-prod-${i}`} className="flex flex-col space-y-3 animate-pulse">
                  <div className="aspect-[3/4] w-full rounded-2xl bg-[#1E3A42]/5 border border-[#1E3A42]/10" />
                  <div className="space-y-2 text-left">
                    <div className="h-3 w-1/3 bg-[#1E3A42]/10 rounded-sm" />
                    <div className="h-4 w-3/4 bg-[#1E3A42]/15 rounded-sm" />
                    <div className="h-3 w-1/2 bg-[#1E3A42]/10 rounded-sm" />
                    <div className="flex items-center gap-2 pt-1">
                      <div className="h-4 w-16 bg-[#1E3A42]/15 rounded-sm" />
                      <div className="h-3 w-12 bg-[#1E3A42]/10 rounded-sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400 max-w-md mx-auto">
              <ShoppingBag size={42} className="mx-auto text-slate-300 mb-3" />
              <p className="font-bold text-slate-600 text-xs">Nenhum produto em estoque encontrado.</p>
              <p className="text-[11px] mt-1 text-slate-400">Tente buscar por termos alternativos ou limpe os filtros selecionados.</p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory('Todos'); setSelectedSizesFilter([]); setSelectedColorsFilter([]); }}
                className="mt-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 border-none text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {visibleProducts.map(prod => {
                const isItemLiked = wishlistLikes[prod.id]?.active || false;
                const totalWishCount = getProductReviewCount(prod.id, prod.name, prod.category);
                return (
                  <div 
                    key={prod.id} 
                    className="bg-transparent overflow-hidden transition-all flex flex-col justify-between text-left group relative"
                  >
                    
                    {/* Portrait Style Frame with layout ratio of the fashion site */}
                    <div className="relative aspect-[3/4] w-full rounded-2xl bg-white overflow-hidden shadow-xs cursor-pointer border border-slate-100/65" onClick={() => handleOpenProduct(prod)}>
                      {prod.image ? (
                        <img 
                          src={prod.image} 
                          alt={prod.name} 
                          className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-4 text-center text-slate-400 group-hover:bg-slate-100 transition-colors duration-500">
                          <ShoppingBag size={24} className="text-slate-350 stroke-[1.5] mb-2 animate-pulse" />
                          <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">AP Moda Fitness</span>
                          <span className="text-[9px] text-slate-400 font-medium">Foto em breve</span>
                        </div>
                      )}
                      
                      {/* Heart Like micro indicator absolute overlay */}
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleWishlist(prod.id);
                        }}
                        className={`absolute top-3.5 right-3.5 bg-white/90 backdrop-blur-xs p-2 rounded-full shadow-xs hover:scale-110 active:scale-95 transition
                          ${isItemLiked ? 'text-pink-600' : 'text-slate-400 hover:text-pink-600'}`}
                      >
                        <Heart size={14} className={isItemLiked ? 'fill-pink-600 text-pink-600' : ''} />
                      </button>

                      {/* Video Play preview Overlay if product is recorded */}
                      {prod.videoUrl && (
                        <span className="absolute bottom-3 left-3 bg-pink-600/95 text-white py-1 px-2.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-pink-600/20">
                          <Play size={8} className="fill-white" />
                          <span>Vídeo</span>
                        </span>
                      )}

                      {/* Stock safety highlight */}
                      {prod.stock <= 3 && (
                        <span className="absolute top-3 left-3 bg-rose-600 text-white px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide">
                          ÚLTIMAS PEÇAS!
                        </span>
                      )}
                    </div>

                    {/* Highly polished borderless detailing cards matching design stills */}
                    <div className="pt-3 pb-2.5 px-1 space-y-1">
                      
                      {/* Interactive Gold Stars rating */}
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={11} className="fill-yellow-400 text-yellow-400" />
                        ))}
                        <span className="text-[9px] text-slate-400 font-bold ml-1">({totalWishCount})</span>
                      </div>

                      {/* Product Name Title */}
                      <p className="text-[12.5px] font-medium text-slate-850 leading-snug tracking-tight group-hover:text-pink-600 transition-colors truncate">
                        {prod.name}
                      </p>

                      {/* Size Tags indicator row preview */}
                      {prod.sizes && prod.sizes.length > 0 && (
                        <div className="flex gap-1 py-0.5 select-none">
                          {prod.sizes.map(sz => (
                            <span key={sz} className="text-[8.5px] font-bold text-slate-400 font-mono border border-slate-200/50 px-1 rounded-sm">
                              {sz}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Bold price tag */}
                      <div className="pt-0.5 flex justify-between items-center">
                        <div className="flex flex-col text-left">
                          {prod.compare_at_price && prod.compare_at_price > prod.price ? (
                            <>
                              <span className="text-[10px] text-slate-400 line-through font-mono leading-none mb-1">
                                R$ {prod.compare_at_price.toFixed(2)}
                              </span>
                              <span className="font-extrabold text-[15px] text-slate-900 leading-none">
                                R$ {prod.price.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="font-extrabold text-[15px] text-slate-900 leading-none">
                              R$ {prod.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        
                        {/* Quick Add icon */}
                        <button
                          type="button"
                          onClick={(e) => handleQuickAdd(prod, e)}
                          className="w-7 h-7 bg-slate-900 hover:bg-pink-600 hover:scale-105 active:scale-95 text-white rounded-full flex items-center justify-center transition cursor-pointer"
                          title="Compra Rápida"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>

      {/* 7. Beautiful Immersive Product Detail Overlay (Product Page Restructuring) */}
      {selectedProduct && (() => {
        const dynamicSizes = getProductDynamicSizes(selectedProduct);
        const dynamicColors = getProductDynamicColors(selectedProduct);

        const isComboOutOfStock = (sz: string, col: string) => {
          if (selectedProduct.sizeColorStocks && selectedProduct.sizeColorStocks[sz]) {
            const qty = selectedProduct.sizeColorStocks[sz][col];
            return qty === undefined || Number(qty) <= 0;
          }
          if (selectedProduct.colorStocks) {
            const qty = selectedProduct.colorStocks[col];
            return qty === undefined || Number(qty) <= 0;
          }
          return selectedProduct.stock <= 0;
        };

        const availableStock = (() => {
          let available = selectedProduct.stock;
          if (selectedProduct.sizeColorStocks && selectedProduct.sizeColorStocks[selectedSize] && selectedProduct.sizeColorStocks[selectedSize][selectedColor] !== undefined) {
            available = selectedProduct.sizeColorStocks[selectedSize][selectedColor];
          } else if (selectedProduct.colorStocks && selectedProduct.colorStocks[selectedColor] !== undefined) {
            available = selectedProduct.colorStocks[selectedColor];
          }
          return available;
        })();
        const isEsgotado = availableStock <= 0;

        const isSizeOutOfStock = (sz: string) => {
          if (selectedProduct.sizeColorStocks && selectedProduct.sizeColorStocks[sz]) {
            const colorsObj = selectedProduct.sizeColorStocks[sz];
            const totalStock = Object.values(colorsObj).reduce((acc, qty) => acc + (Number(qty) || 0), 0);
            return totalStock <= 0;
          }
          if (selectedProduct.sizeColorStocks && !selectedProduct.sizeColorStocks[sz]) {
            return true;
          }
          if (selectedProduct.stock <= 0) {
            return true;
          }
          return false;
        };

        const imagesPoolRaw = selectedProduct.images && selectedProduct.images.length > 0 
          ? selectedProduct.images 
          : [selectedProduct.image];
        const imagesPool = imagesPoolRaw.filter(Boolean);
        const currentIdx = detailImageIdx % imagesPool.length;
        const activeImage = imagesPool[currentIdx] || selectedProduct.image;

        return (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-[150] p-3 md:p-6 font-sans">
            <div className="bg-[#FAF9F6] rounded-[24px] max-w-5xl w-full shadow-2xl border border-[#1E3A42]/10 overflow-hidden text-slate-800 flex flex-col md:flex-row h-full max-h-[95vh] md:max-h-[700px] animate-in fade-in zoom-in-95 duration-300 relative">
              
              {/* Close Button top-right (absolute) */}
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white text-slate-900 hover:text-red-600 rounded-full p-2 md:p-2.5 transition cursor-pointer shadow-md z-[160] font-bold text-sm border-none"
                title="Fechar detalhes"
              >
                ✕
              </button>

              {/* LEFT COLUMN: Gallery with Zoom suave ao passar o mouse */}
              <div className="w-full md:w-1/2 bg-[#1E3A42]/5 relative min-h-[300px] md:min-h-full flex flex-col justify-between p-4 md:p-6 border-r border-[#1E3A42]/10 overflow-hidden">
                
                {/* Main Image View */}
                <div className="flex-1 w-full relative rounded-2xl overflow-hidden aspect-[4/5] bg-[#FAF9F6] border border-[#1E3A42]/10 flex items-center justify-center">
                  {isVideoPlaying && selectedProduct.videoUrl ? (
                    <div className="absolute inset-0 bg-black flex flex-col justify-between">
                      <video 
                        src={selectedProduct.videoUrl} 
                        autoPlay 
                        controls 
                        loop 
                        muted 
                        playsInline 
                        className="w-full h-full object-contain"
                      />
                      <button 
                        onClick={() => setIsVideoPlaying(false)}
                        className="absolute top-4 right-4 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full p-1.5 transition cursor-pointer z-30"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="w-full h-full overflow-hidden relative cursor-zoom-in"
                      onMouseMove={(e) => {
                        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                        const x = ((e.clientX - left) / width) * 100;
                        const y = ((e.clientY - top) / height) * 100;
                        setZoomPos({ x, y });
                      }}
                      onMouseEnter={() => setIsZooming(true)}
                      onMouseLeave={() => setIsZooming(false)}
                    >
                      <img 
                        src={activeImage} 
                        alt={selectedProduct.name} 
                        className="w-full h-full object-cover transition-transform duration-300 ease-out"
                        style={{
                          transform: isZooming ? 'scale(1.5)' : 'scale(1)',
                          transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`
                        }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Play video overlay badge if link exists & not playing */}
                  {selectedProduct.videoUrl && !isVideoPlaying && (
                    <button
                      onClick={() => setIsVideoPlaying(true)}
                      className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-[#1E3A42] hover:text-[#1E3A42]/80 px-3 py-2 rounded-full flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer z-20 text-[10px] font-extrabold uppercase tracking-wider border-none"
                      title="Assistir demonstração de caimento"
                    >
                      <Play size={12} className="fill-[#1E3A42]" />
                      <span>Ver Vídeo de Caimento</span>
                    </button>
                  )}

                  {/* Hearts wishlist interactive feedback */}
                  <button 
                    type="button" 
                    onClick={() => handleToggleWishlist(selectedProduct.id)}
                    className="absolute top-4 left-4 p-2.5 bg-white/90 backdrop-blur-xs rounded-full shadow-md text-slate-700 hover:scale-115 active:scale-95 transition z-10 border-none cursor-pointer"
                  >
                    <Heart 
                      size={16} 
                      className={wishlistLikes[selectedProduct.id]?.active ? 'fill-pink-600 text-pink-600' : 'text-slate-600'} 
                    />
                  </button>
                </div>

                {/* Gallery Thumbnails Below */}
                {imagesPool.length > 1 && (
                  <div className="flex gap-2.5 mt-4 overflow-x-auto py-1 justify-center scrollbar-none">
                    {imagesPool.map((imgUrl, idx) => {
                      const isCurrent = currentIdx === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onMouseEnter={() => setDetailImageIdx(idx)}
                          onClick={() => setDetailImageIdx(idx)}
                          className={`w-12 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-white cursor-pointer
                            ${isCurrent ? 'border-[#1E3A42]' : 'border-transparent opacity-75 hover:opacity-100'}`}
                        >
                          <img 
                            src={imgUrl} 
                            alt={`${selectedProduct.name} vista ${idx + 1}`} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Product details (Boutique styled with Off-White Creme background) */}
              <div className="w-full md:w-1/2 p-5 md:p-8 overflow-y-auto max-h-[55vh] md:max-h-full flex flex-col justify-between space-y-6">
                
                <div className="space-y-6">
                  {/* Category and SKU */}
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="bg-[#1E3A42]/10 text-[#1E3A42] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                      {selectedProduct.category || "Coleção Run"}
                    </span>
                    <span className="text-slate-400 font-bold font-mono">
                      Cód: {selectedProduct.sku || `CA${selectedProduct.id.slice(-4)}`} • AP
                    </span>
                  </div>

                  {/* Title & Reviews */}
                  <div className="space-y-2 text-left">
                    <h2 className="text-2xl md:text-3xl font-light font-sans text-[#1E3A42] tracking-tight leading-tight">
                      {selectedProduct.name}
                    </h2>
                    <div className="flex items-center gap-1">
                      <div className="flex text-yellow-450 gap-0.5">
                        {[...Array(5)].map((_, i) => <Star key={i} size={11} className="fill-yellow-400 text-yellow-400" />)}
                      </div>
                      <span className="text-[10px] text-[#1E3A42]/70 font-bold ml-1">★ 5.0 ({getProductReviewCount(selectedProduct.id, selectedProduct.name, selectedProduct.category)} avaliações de clientes)</span>
                    </div>
                  </div>

                  {/* Price Tag with institutional Teal color */}
                  <div className="flex items-baseline gap-2.5 py-2 text-left">
                    {selectedProduct.compare_at_price && selectedProduct.compare_at_price > selectedProduct.price ? (
                      <>
                        <span className="text-sm text-slate-450 line-through font-mono">
                          R$ {selectedProduct.compare_at_price.toFixed(2)}
                        </span>
                        <p className="font-semibold text-2xl md:text-3xl text-[#1E3A42] font-mono">
                          R$ {selectedProduct.price.toFixed(2)}
                        </p>
                      </>
                    ) : (
                      <p className="font-semibold text-2xl md:text-3xl text-[#1E3A42] font-mono">
                        R$ {selectedProduct.price.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* Sizes and Measurements Chart sutil link */}
                  <div className="space-y-3 border-t border-[#1E3A42]/10 pt-4 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-450 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                        <Maximize2 size={11} className="text-[#1E3A42]" />
                        <span>Selecione o Tamanho:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsSizeChartOpen(true)}
                        className="text-[#1E3A42] hover:underline text-xs font-semibold flex items-center gap-1.5 bg-transparent border-none p-0 cursor-pointer"
                      >
                        <Ruler size={14} className="text-[#1E3A42]" />
                        <span>Tabela de Medidas</span>
                      </button>
                    </div>

                    {/* Squares Minimalist Size Blocks */}
                    <div className="flex flex-wrap gap-3">
                      {dynamicSizes.map((sz) => {
                        const isSelected = selectedSize === sz;
                        const isOutOfStock = isSizeOutOfStock(sz);
                        return (
                          <button
                            key={sz}
                            type="button"
                            disabled={isOutOfStock}
                            id={`size-btn-${sz}`}
                            onClick={() => {
                              if (!isOutOfStock) {
                                setSelectedSize(sz);
                                const firstInStockColor = dynamicColors.find(col => !isComboOutOfStock(sz, col));
                                if (firstInStockColor) {
                                  setSelectedColor(firstInStockColor);
                                } else if (dynamicColors.length > 0) {
                                  setSelectedColor(dynamicColors[0]);
                                }
                              }
                            }}
                            className={`w-12 h-12 flex items-center justify-center font-bold text-xs border transition-all duration-200 relative overflow-hidden cursor-pointer
                              ${isOutOfStock 
                                ? 'opacity-35 bg-slate-100 border-slate-200 text-slate-450 cursor-not-allowed' 
                                : isSelected
                                  ? 'bg-[#1E3A42] border-[#1E3A42] text-white shadow-md scale-105'
                                  : 'bg-white border-slate-200 text-slate-800 hover:border-[#1E3A42]/50'}`}
                          >
                            {sz}
                            {isOutOfStock && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-[141%] h-[1px] bg-slate-400 rotate-45 transform origin-center" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Botão de Acesso Discreto do Provador Virtual */}
                    <div className="pt-1">
                      <button
                        type="button"
                        id="open-virtual-fitting-room-btn"
                        onClick={() => {
                          setIsFittingRoomOpen(true);
                          try {
                            const count = parseInt(localStorage.getItem('ap_provador_uses') || '0', 10);
                            localStorage.setItem('ap_provador_uses', (count + 1).toString());
                          } catch (e) {
                            console.warn(e);
                          }
                        }}
                        className="text-[#1E3A42] hover:text-[#1E3A42]/80 text-xs font-semibold flex items-center gap-2 bg-transparent border-none p-0 cursor-pointer transition-colors hover:underline"
                      >
                        <Ruler size={14} className="text-[#1E3A42]" />
                        <span>Descubra seu Tamanho (Provador Virtual)</span>
                      </button>
                    </div>
                  </div>

                  {/* Colors Row filtered by Selected Size */}
                  {(() => {
                    const colorsToRender = dynamicColors.length > 0 ? dynamicColors : ['Única'];

                    return (
                      <div className="space-y-3 text-left">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-405 font-extrabold uppercase tracking-widest">
                          <Palette size={11} className="text-[#1E3A42]" />
                          <span>Selecione a Cor:</span>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                          {colorsToRender.map(color => {
                            const isSelected = selectedColor === color;
                            const isOutOfStock = isComboOutOfStock(selectedSize, color);
                            const hex = getColorHex(color);
                            return (
                              <button
                                key={color}
                                type="button"
                                disabled={isOutOfStock}
                                id={`color-btn-${color}`}
                                onClick={() => {
                                  if (!isOutOfStock) {
                                    setSelectedColor(color);
                                  }
                                }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer relative overflow-hidden active:scale-95
                                  ${isOutOfStock 
                                    ? 'opacity-35 bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                                    : isSelected 
                                      ? 'bg-[#1E3A42] border-[#1E3A42] text-white shadow-sm scale-105' 
                                      : 'bg-white border-slate-200 hover:border-slate-300 text-[#1E3A42]'}`}
                              >
                                <span className="w-3.5 h-3.5 rounded-full border border-slate-200 shadow-3xs" style={{ backgroundColor: hex }} />
                                <span className={isOutOfStock ? 'line-through' : ''}>{color}</span>
                                {isOutOfStock && (
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-[110%] h-[1px] bg-slate-400 rotate-12 transform origin-center" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Active Choice Overview Feedback */}
                  <div className="bg-[#1E3A42]/5 p-3 rounded-xl border border-[#1E3A42]/10 text-xs text-[#1E3A42] font-semibold flex justify-between items-center text-left">
                    <span>Selecionado: {selectedColor} — Tamanho {selectedSize}</span>
                    {availableStock > 0 ? (
                      <span className="text-[10px] text-emerald-600 font-bold">
                        {availableStock} un. disponíveis! 🔥
                      </span>
                    ) : (
                      <span className="text-[10px] text-rose-500 font-bold animate-pulse">
                        Esgotado nesta variação ⚠️
                      </span>
                    )}
                  </div>

                  {/* Counter units selector */}
                  <div className="flex items-center justify-between border-t border-[#1E3A42]/10 pt-4">
                    <span className="text-[10px] text-slate-450 font-extrabold uppercase tracking-widest block text-left">Quantidade Desejada</span>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center rounded-xl py-1 px-1.5 border ${isEsgotado ? 'bg-slate-100 border-slate-200 opacity-60' : 'bg-white border-slate-300'}`}>
                        <button 
                          type="button"
                          disabled={isEsgotado}
                          onClick={() => !isEsgotado && setProductQty(Math.max(1, productQty - 1))}
                          className={`p-1.5 rounded-md transition text-slate-650 ${isEsgotado ? 'cursor-not-allowed opacity-40' : 'hover:bg-slate-100 cursor-pointer border-none'}`}
                        >
                          <Minus size={11} />
                        </button>
                        <span className="w-8 text-center font-bold text-xs leading-none font-mono text-slate-800">{productQty}</span>
                        <button 
                          type="button"
                          disabled={isEsgotado}
                          onClick={() => !isEsgotado && setProductQty(Math.min(availableStock, productQty + 1))}
                          className={`p-1.5 rounded-md transition text-slate-655 ${isEsgotado ? 'cursor-not-allowed opacity-40' : 'hover:bg-slate-100 cursor-pointer border-none'}`}
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* BOTÕES DE COMPRA DIRETOS */}
                  <div className="pt-4 border-t border-[#1E3A42]/10 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      disabled={isEsgotado || isAddingToCart || isAddingToCartBuyNow}
                      id="add-to-bag-btn"
                      onClick={handleAddToCart}
                      className="flex-grow sm:flex-1 py-3 px-4 bg-white hover:bg-slate-50 text-[#1E3A42] font-sans font-extrabold rounded-2xl text-[11px] tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 border border-[#1E3A42]/35 disabled:opacity-50 cursor-pointer shadow-xs active:scale-97"
                    >
                      {isAddingToCart ? (
                        <>
                          <span className="w-4 h-4 border-2 border-[#1E3A42] border-t-transparent rounded-full animate-spin inline-block" />
                          <span>Adicionando...</span>
                        </>
                      ) : (
                        <>
                          {!isEsgotado && <ShoppingBag size={14} />}
                          <span>{isEsgotado ? 'Esgotado' : 'Adicionar à Sacola'}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isEsgotado || isAddingToCart || isAddingToCartBuyNow}
                      id="buy-now-btn"
                      onClick={handleBuyNow}
                      className="flex-grow sm:flex-1 py-3 px-4 bg-[#1E3A42] hover:bg-[#1E3A42]/90 text-white font-sans font-extrabold rounded-2xl text-[11px] tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 border-none disabled:opacity-50 cursor-pointer shadow-md active:scale-97"
                    >
                      {isAddingToCartBuyNow ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                          <span>Processando...</span>
                        </>
                      ) : (
                        <>
                          {!isEsgotado && <Sparkles size={14} className="text-white animate-pulse" />}
                          <span>Comprar Agora</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* FREIGHT SHIPPING CALCULATOR SYSTEM */}
                  <div className="border-t border-[#1E3A42]/10 pt-4 space-y-2 text-left">
                    <span className="text-[10px] text-slate-405 font-extrabold uppercase tracking-widest block">Simular Frete & Prazo</span>
                    <form onSubmit={handleCalculateCep} className="flex gap-2">
                      <input 
                        type="text"
                        maxLength={9}
                        placeholder="Digite seu CEP (Ex: 01001-000)"
                        value={cepNumber}
                        onChange={(e) => setCepNumber(e.target.value)}
                        className="flex-1 bg-white border border-[#1E3A42]/15 rounded-xl px-3 py-2 text-xs focus:outline-hidden text-slate-800"
                      />
                      <button
                        type="submit"
                        className="bg-[#1E3A42] text-white hover:bg-[#1E3A42]/90 text-[10px] font-bold px-4 py-2 rounded-xl transition cursor-pointer border-none"
                      >
                        {isCalculatingCep ? 'Calculando...' : 'OK'}
                      </button>
                    </form>
                    {cepResult && (
                      <div className="text-[10px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-100 p-2 rounded-xl animate-in fade-in duration-200 text-left">
                        {cepResult}
                      </div>
                    )}
                    {cepResultError && (
                      <div className="text-[10px] text-rose-800 font-bold bg-rose-50 border border-rose-100 p-2 rounded-xl animate-in fade-in duration-200 text-left">
                        ⚠️ {cepResultError}
                      </div>
                    )}
                  </div>

                  {/* COMBINE E MONTE SEU LOOK (CROSS-SELLING) */}
                  {(() => {
                    const compProduct = getComplementaryProduct(selectedProduct);
                    if (!compProduct) return null;

                    const originalTotal = selectedProduct.price + compProduct.price;
                    const comboTotal = originalTotal * 0.95;

                    return (
                      <div className="border border-[#1E3A42]/15 rounded-2xl bg-white p-4 space-y-3 shadow-2xs text-left">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Sparkles size={12} className="text-[#1E3A42] animate-pulse" />
                            <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-800">Combine e Monte seu Look 🌸</span>
                          </div>
                          <span className="bg-[#1E3A42]/10 text-[#1E3A42] text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                            Combo 5% OFF!
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center">
                            <img 
                              src={compProduct.image} 
                              alt={compProduct.name} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <h5 className="text-[11px] font-extrabold text-slate-800 truncate leading-tight">
                              {compProduct.name}
                            </h5>
                            <p className="text-[10px] text-slate-400 font-bold leading-tight mt-0.5">
                              Categoria: {compProduct.category}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[11px] font-extrabold text-pink-600">
                                R$ {compProduct.price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 pt-1">
                          <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl flex items-center justify-between text-[10px] text-slate-600 font-bold">
                            <span>Total do Look: <span className="line-through text-slate-400">R$ {originalTotal.toFixed(2)}</span></span>
                            <span className="text-[#1E3A42] font-black text-xs">R$ {comboTotal.toFixed(2)}</span>
                          </div>
                          
                          <button
                            type="button"
                            disabled={isEsgotado || isAddingCombo !== null}
                            id="add-combo-btn"
                            onClick={() => handleAddComboToCart(compProduct)}
                            className="w-full py-2.5 bg-[#1E3A42] hover:bg-[#1E3A42]/90 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition border-none cursor-pointer disabled:opacity-50"
                          >
                            {isEsgotado ? 'Esgotado' : (isAddingCombo === compProduct.id ? 'Adicionando Combo...' : 'Adicionar Look Completo (5% OFF)')}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ACCORDION COLLAPSIBLES */}
                  <div className="border-t border-[#1E3A42]/10 pt-4 space-y-2 text-left">
                    
                    {/* Descrição Accordion */}
                    <div className="border border-[#1E3A42]/10 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'desc' ? null : 'desc')}
                        className="w-full px-3 py-2 bg-white text-[11px] font-bold text-slate-800 flex justify-between items-center border-none cursor-pointer"
                      >
                        <span>Descrição Detalhada</span>
                        <span>{activeAccordion === 'desc' ? '−' : '+'}</span>
                      </button>
                      {activeAccordion === 'desc' && (
                        <div className="p-3 text-[10px] text-slate-500 leading-relaxed bg-white border-t border-[#1E3A42]/10">
                          {selectedProduct.description || "Confeccionadas em tecido suplex power de 310g, nossas peças garantem alta elasticidade, ajuste perfeito ao corpo e zero transparência. O tecido é ultra resistente, confortável e totalmente ideal para quem busca estilo em treinos intensos."}
                        </div>
                      )}
                    </div>

                    {/* Detalhes Accordion Checklist */}
                    <div className="border border-[#1E3A42]/10 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'detalhes' ? null : 'detalhes')}
                        className="w-full px-3 py-2 bg-white text-[11px] font-bold text-slate-800 flex justify-between items-center border-none cursor-pointer"
                      >
                        <span>Ficha Técnica & Detalhes</span>
                        <span>{activeAccordion === 'detalhes' ? '−' : '+'}</span>
                      </button>
                      {activeAccordion === 'detalhes' && (
                        <div className="p-3 bg-white border-t border-[#1E3A42]/10 grid grid-cols-1 md:grid-cols-2 gap-1.5 text-[10px]">
                          <p className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <Check size={11} className="text-[#1E3A42] font-bold" />
                            <span>Tecido: Suplex Power 310g</span>
                          </p>
                          <p className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <Check size={11} className="text-[#1E3A42] font-bold" />
                            <span>Composição: 90% Poliéster, 10% Elastano</span>
                          </p>
                          <p className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <Check size={11} className="text-[#1E3A42] font-bold" />
                            <span>Bojo: Removível de alta sustentação</span>
                          </p>
                          <p className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <Check size={11} className="text-[#1E3A42] font-bold" />
                            <span>Zero Transparência Certificada</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* REAL CLIENTS REVIEWS LOGS SYSTEM */}
                  <div className="border-t border-[#1E3A42]/10 pt-4 space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-455 font-extrabold uppercase tracking-widest">Avaliações das Clientes ({productReviews[selectedProduct.id]?.length || productReviews.default.length})</span>
                      <button
                        type="button"
                        onClick={() => setIsReviewFormOpen(!isReviewFormOpen)}
                        className="text-[9px] text-[#1E3A42] hover:underline font-bold border-none bg-transparent cursor-pointer"
                      >
                        Deixar avaliação
                      </button>
                    </div>

                    {isReviewFormOpen && (
                      <form onSubmit={handleSubmitReview} className="bg-white p-3 rounded-2xl border border-[#1E3A42]/10 space-y-2 animate-in slide-in-from-top duration-200">
                        <div>
                          <input 
                            type="text"
                            required
                            placeholder="Seu nome"
                            value={newReviewAuthor}
                            onChange={(e) => setNewReviewAuthor(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10.5px] focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <textarea
                            required
                            rows={2}
                            placeholder="O que achou da peça?"
                            value={newReviewText}
                            onChange={(e) => setNewReviewText(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10.5px] focus:outline-hidden"
                          />
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Nota:</span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() => setNewReviewStars(n)}
                                  className="text-yellow-400 border-none bg-transparent cursor-pointer"
                                >
                                  {newReviewStars >= n ? '★' : '☆'}
                                </button>
                              ))}
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="bg-[#1E3A42] text-white hover:bg-[#1E3A42]/90 px-3 py-1 rounded-lg text-[9px] font-bold border-none cursor-pointer"
                          >
                            Publicar
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="space-y-3">
                      {(productReviews[selectedProduct.id] || productReviews.default).map((rev, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-2xl border border-[#1E3A42]/10 space-y-1">
                          <div className="flex justify-between items-center">
                            <p className="font-extrabold text-[11px] text-slate-800">{rev.author}</p>
                            <span className="text-[8px] text-slate-400 font-bold font-mono">{rev.date}</span>
                          </div>
                          <div className="flex gap-0.5 text-[9px]">
                            {[...Array(rev.stars)].map((_, i) => <Star key={i} size={10} className="fill-yellow-400 text-yellow-400" />)}
                          </div>
                          <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                            {rev.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PRODUTOS RELACIONADOS CAROUSEL */}
                  <div className="border-t border-[#1E3A42]/10 pt-5 space-y-3 text-left">
                    <span className="text-[10px] text-slate-405 font-extrabold uppercase tracking-widest block">Produtos Relacionados</span>
                    <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
                      {products.filter(p => p.id !== selectedProduct.id && p.stock > 0).slice(0, 4).map(rel => (
                        <div 
                          key={rel.id} 
                          onClick={() => handleOpenProduct(rel)}
                          className="w-28 shrink-0 space-y-1.5 cursor-pointer bg-white hover:bg-slate-50 p-2 border border-slate-100 rounded-xl"
                        >
                          <div className="aspect-[3/4] rounded-lg overflow-hidden relative">
                            <img src={rel.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="text-left leading-tight text-[9px]">
                            <p className="font-extrabold text-slate-700 truncate">{rel.name}</p>
                            <p className="text-[#1E3A42] font-bold font-mono mt-0.5">R$ {rel.price.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* STICKY BOTTOM ACTIONS BAR */}
                <div className="pt-4 border-t border-[#1E3A42]/10 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="w-full py-3 bg-white hover:bg-slate-100 font-sans font-extrabold text-slate-700 border border-[#1E3A42]/15 rounded-2xl transition cursor-pointer text-center text-[11px] tracking-wider uppercase shadow-xs active:scale-97"
                  >
                    Voltar para o Catálogo
                  </button>
                </div>

              </div>

            </div>
          </div>
        );
      })()}

      {/* 8. Junte-se a nós / Obtenha Descontos Exclusivos Newsletter Footer Card */}
      <section id="newsletter-section" className="max-w-4xl mx-auto px-4 md:px-8 mt-12 mb-6">
        <div className="bg-gradient-to-r from-pink-600 to-rose-450 text-white rounded-3xl p-6 md:p-8 text-center space-y-4 shadow-lg relative overflow-hidden">
          {/* Subtle graphic shape elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full transform translate-x-10 -translate-y-10" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-white/5 rounded-full" />
          
          <div className="max-w-md mx-auto space-y-2 relative z-10">
            <span className="inline-block bg-white/20 border border-white/20 text-white text-[8px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest">JUNTE-SE A NÓS</span>
            <h4 className="text-xl md:text-2xl font-extrabold font-serif italic tracking-wide">Obtenha Descontos Exclusivos</h4>
            <p className="text-[11px] text-pink-100 leading-normal max-w-sm mx-auto">Cadastre-se na nossa Lista de Clientes VIPs para receber alertas semanais de lançamentos, cupons secretos e promoções com até 50% OFF!</p>
          </div>

          {!isNewsletterSubmitted ? (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!newsletterName.trim() || !newsletterEmail.trim()) return;
                
                // Add dummy VIP back into parent CRM
                const newVIP: Client = {
                  id: `nws-${Date.now()}`,
                  name: newsletterName.trim(),
                  email: newsletterEmail.trim(),
                  phone: "(21) 99999-1234",
                  channel: "E-commerce",
                  npsScore: 10,
                  totalSpent: 0,
                  ordersCount: 0,
                  createdAt: new Date().toISOString()
                };
                onAddClient(newVIP);

                setIsNewsletterSubmitted(true);
              }}
              className="max-w-md mx-auto space-y-2.5 font-sans pt-1 relative z-10"
            >
              <input 
                type="text"
                required
                placeholder="Seu nome completo"
                value={newsletterName}
                onChange={(e) => setNewsletterName(e.target.value)}
                className="w-full bg-white text-slate-800 text-xs px-4 py-2.5 rounded-xl placeholder-slate-400 focus:outline-hidden font-medium"
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="email"
                  required
                  placeholder="Digite seu melhor e-mail"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 bg-white text-slate-800 text-xs px-4 py-2.5 rounded-xl placeholder-slate-400 focus:outline-hidden font-medium"
                />
                <button
                  type="submit"
                  className="bg-slate-900 border-none hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-5 rounded-xl transition cursor-pointer"
                >
                  Inscrever-se
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white/10 p-4 rounded-2xl max-w-xs mx-auto animate-in fade-in duration-300 relative z-10">
              <span className="text-xl">🎉</span>
              <p className="font-bold text-xs text-white mt-1">Bem-vinda à nossa lista VIP!</p>
              <p className="text-[10px] text-pink-100 mt-0.5">Seu cadastro foi salvo automaticamente em nosso CRM do sistema!</p>
            </div>
          )}

        </div>
      </section>

      {/* Custom footer signature line */}
      <div className="text-center py-4 bg-transparent border-t border-slate-100 select-none text-[10px] text-slate-400 font-bold tracking-wider uppercase font-sans">
        © {new Date().getFullYear()} AP Moda Fitness • Desenvolvido exclusivamente para você render o máximo.
      </div>

      {/* 9. Interactive Float WhatsApp Button with notify sticker */}
      <a 
        href={`https://api.whatsapp.com/send?phone=${storeInfo.phone}&text=Ol%C3%A1!%20Gostaria%20de%20tirar%20uma%20d%C3%BAvida%20sobre%20as%20pe%C3%A7as%20da%20vitrine%20AP%20Moda%20Fitness%20🌸`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-green-500 hover:bg-green-600 p-3.5 rounded-full shadow-lg text-white hover:scale-110 active:scale-95 transition-all text-center flex items-center justify-center animate-bounce duration-3000 cursor-pointer"
        title="Atendimento pelo WhatsApp"
      >
        <MessageCircle size={24} className="fill-white text-green-500" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border border-white rounded-full animate-ping" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border border-white rounded-full flex items-center justify-center text-[7px] font-extrabold text-white">1</span>
      </a>

      {/* 13. Elegant Size Chart Modal */}
      {isSizeChartOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[220] flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setIsSizeChartOpen(false)}
        >
          <div 
            className="bg-[#FAF9F6] border border-[#1E3A42]/10 rounded-2xl w-full max-w-lg shadow-2xl p-6 md:p-8 space-y-6 relative animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => setIsSizeChartOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-[#1E3A42]/5 hover:bg-[#1E3A42]/10 rounded-full transition text-[#1E3A42] cursor-pointer border-none"
            >
              ✕
            </button>

            {/* Header */}
            <div className="text-center space-y-1">
              <span className="text-[10px] font-extrabold text-[#1E3A42]/60 uppercase tracking-widest block">Guia de Medidas Oficial</span>
              <h3 className="font-serif italic text-2xl md:text-3xl text-[#1E3A42] font-semibold">Tabela de Medidas AP</h3>
              <p className="text-xs text-[#1E3A42]/70">Encontre o caimento perfeito para o seu corpo com a nossa tabela inteligente.</p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-[#1E3A42]/10 rounded-xl bg-white shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#1E3A42]/5 text-[#1E3A42] font-extrabold uppercase tracking-wider text-[10px] border-b border-[#1E3A42]/10">
                    <th className="py-3 px-4">Tamanho</th>
                    <th className="py-3 px-4">Busto</th>
                    <th className="py-3 px-4">Cintura</th>
                    <th className="py-3 px-4">Quadril</th>
                    <th className="py-3 px-4">Equivalência</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 divide-y divide-[#1E3A42]/5 font-medium">
                  <tr className="hover:bg-[#1E3A42]/5 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#1E3A42]">P</td>
                    <td className="py-3.5 px-4 font-mono">80 - 88 cm</td>
                    <td className="py-3.5 px-4 font-mono">60 - 68 cm</td>
                    <td className="py-3.5 px-4 font-mono">88 - 96 cm</td>
                    <td className="py-3.5 px-4 bg-[#1E3A42]/5 font-bold text-[#1E3A42]/80">34 ao 36</td>
                  </tr>
                  <tr className="hover:bg-[#1E3A42]/5 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#1E3A42]">M</td>
                    <td className="py-3.5 px-4 font-mono">89 - 96 cm</td>
                    <td className="py-3.5 px-4 font-mono">69 - 76 cm</td>
                    <td className="py-3.5 px-4 font-mono">97 - 104 cm</td>
                    <td className="py-3.5 px-4 bg-[#1E3A42]/5 font-bold text-[#1E3A42]/80">38 ao 40</td>
                  </tr>
                  <tr className="hover:bg-[#1E3A42]/5 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#1E3A42]">G</td>
                    <td className="py-3.5 px-4 font-mono">97 - 104 cm</td>
                    <td className="py-3.5 px-4 font-mono">77 - 84 cm</td>
                    <td className="py-3.5 px-4 font-mono">105 - 112 cm</td>
                    <td className="py-3.5 px-4 bg-[#1E3A42]/5 font-bold text-[#1E3A42]/80">42 ao 44</td>
                  </tr>
                  <tr className="hover:bg-[#1E3A42]/5 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#1E3A42]">GG</td>
                    <td className="py-3.5 px-4 font-mono">105 - 112 cm</td>
                    <td className="py-3.5 px-4 font-mono">85 - 92 cm</td>
                    <td className="py-3.5 px-4 font-mono">113 - 120 cm</td>
                    <td className="py-3.5 px-4 bg-[#1E3A42]/5 font-bold text-[#1E3A42]/80">46 ao 50</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Tip */}
            <div className="bg-[#1E3A42]/5 border border-[#1E3A42]/10 p-4 rounded-xl text-xs text-[#1E3A42] flex items-start gap-2.5 text-left">
              <span className="text-base leading-none">💡</span>
              <p className="leading-relaxed font-medium">
                <strong>Dica de caimento:</strong> Nossas peças são confeccionadas em Suplex Power de alta elasticidade com costura dupla. Se você prefere uma peça mais justa, opte pelo tamanho padrão; se prefere um ajuste mais confortável, sugerimos um tamanho maior.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsSizeChartOpen(false)}
              className="w-full py-3 bg-[#1E3A42] hover:bg-[#1E3A42]/90 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition border-none cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Provador Virtual Modal */}
      {isFittingRoomOpen && selectedProduct && (
        <div className="fixed inset-0 bg-[#1E3A42]/60 backdrop-blur-md flex items-center justify-center z-[250] p-4 font-sans animate-in fade-in duration-200">
          <div className="bg-[#FAF9F6] rounded-[24px] max-w-sm w-full shadow-2xl border border-[#1E3A42]/10 overflow-hidden text-slate-800 flex flex-col p-6 space-y-5 animate-in zoom-in-95 duration-250 relative">
            
            {/* Close button */}
            <button 
              onClick={() => setIsFittingRoomOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 p-1.5 rounded-full transition cursor-pointer border-none bg-transparent flex items-center justify-center w-8 h-8 font-bold"
              title="Fechar Provador"
            >
              ✕
            </button>

            {/* Header */}
            <div className="text-center space-y-1">
              <div className="w-11 h-11 rounded-full bg-[#1E3A42]/5 flex items-center justify-center mx-auto text-[#1E3A42]">
                <Ruler size={20} />
              </div>
              <h3 className="text-lg font-bold text-[#1E3A42] tracking-tight">
                Provador Virtual Inteligente
              </h3>
              <p className="text-[10.5px] text-slate-500 leading-normal max-w-xs mx-auto">
                Insira suas medidas para descobrir seu tamanho ideal na AP Moda Fitness.
              </p>
            </div>

            {/* Form Fields - clean, well-spaced, slim input fields */}
            <div className="space-y-4">
              <div className="space-y-3">
                {/* Idade Field */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Idade (anos)
                  </label>
                  <input 
                    type="number"
                    placeholder="Ex: 30"
                    min="1"
                    max="120"
                    value={fitAge}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFitAge(val);
                      localStorage.setItem('ap_fit_age', val);
                      const currentHeight = Number(fitHeight) || 165;
                      const currentWeight = Number(fitWeight) || 60;
                      const currentAge = Number(val) || 30;
                      const rec = calculateRecommendedSize(currentHeight, currentWeight, currentAge, fitPreference);
                      setFitRecommendation(rec);
                    }}
                    className="w-full px-4 py-2.5 bg-white border border-[#1E3A42]/10 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#1E3A42] placeholder:text-slate-300 font-mono"
                  />
                </div>

                {/* Peso Field */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Peso (kg)
                  </label>
                  <input 
                    type="number"
                    placeholder="Ex: 60"
                    min="1"
                    max="300"
                    value={fitWeight}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFitWeight(val);
                      localStorage.setItem('ap_fit_weight', val);
                      const currentHeight = Number(fitHeight) || 165;
                      const currentWeight = Number(val) || 60;
                      const currentAge = Number(fitAge) || 30;
                      const rec = calculateRecommendedSize(currentHeight, currentWeight, currentAge, fitPreference);
                      setFitRecommendation(rec);
                    }}
                    className="w-full px-4 py-2.5 bg-white border border-[#1E3A42]/10 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#1E3A42] placeholder:text-slate-300 font-mono"
                  />
                </div>

                {/* Altura Field */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Altura (cm)
                  </label>
                  <input 
                    type="number"
                    placeholder="Ex: 165"
                    min="1"
                    max="250"
                    value={fitHeight}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFitHeight(val);
                      localStorage.setItem('ap_fit_height', val);
                      const currentHeight = Number(val) || 165;
                      const currentWeight = Number(fitWeight) || 60;
                      const currentAge = Number(fitAge) || 30;
                      const rec = calculateRecommendedSize(currentHeight, currentWeight, currentAge, fitPreference);
                      setFitRecommendation(rec);
                    }}
                    className="w-full px-4 py-2.5 bg-white border border-[#1E3A42]/10 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#1E3A42] placeholder:text-slate-300 font-mono"
                  />
                </div>
              </div>

              {/* Fit Preference choice row for better custom flow */}
              <div className="space-y-1.5 text-left">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Estilo de Caimento:</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['justo', 'normal', 'largo'] as const).map((pref) => {
                    const isSel = fitPreference === pref;
                    const labels = { justo: 'Justo 🏃‍♀️', normal: 'Normal 👍', largo: 'Solto 👕' };
                    return (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => {
                          setFitPreference(pref);
                          localStorage.setItem('ap_fit_preference', pref);
                          const currentHeight = Number(fitHeight) || 165;
                          const currentWeight = Number(fitWeight) || 60;
                          const currentAge = Number(fitAge) || 30;
                          const rec = calculateRecommendedSize(currentHeight, currentWeight, currentAge, pref);
                          setFitRecommendation(rec);
                        }}
                        className={`py-2 text-[10px] font-bold rounded-xl border transition-all text-center cursor-pointer select-none
                          ${isSel 
                            ? 'bg-[#1E3A42] border-[#1E3A42] text-white shadow-xs' 
                            : 'bg-white border-[#1E3A42]/10 text-slate-700 hover:border-[#1E3A42]/20'}`}
                      >
                        {labels[pref]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recommendation Result Display block */}
            {fitHeight && fitWeight ? (
              <div className="bg-[#1E3A42]/5 border border-[#1E3A42]/10 p-4 rounded-2xl space-y-3 text-center animate-in fade-in zoom-in-95 duration-200">
                <span className="text-[10px] text-[#1E3A42] font-extrabold uppercase tracking-widest block">Tamanho Recomendado:</span>
                <span className="text-4xl font-extrabold font-mono text-[#1E3A42] block">
                  {fitRecommendation || 'M'}
                </span>
                
                {/* Specific recommended text format requested by the user */}
                <p className="text-[11px] text-slate-700 font-bold leading-relaxed max-w-xs mx-auto">
                  Com base no seu perfil, recomendamos o tamanho <span className="text-[#1E3A42] font-black">{fitRecommendation || 'M'}</span> para este modelo.
                </p>

                {(() => {
                  const h = Number(fitHeight || 165);
                  const w = Number(fitWeight || 60);
                  const a = Number(fitAge || 30);
                  let estBusto = (w * 1.25) + (h * 0.08) - 22;
                  let estCintura = (w * 1.05) - (h * 0.12) + 12;
                  let estQuadril = (w * 1.38) + (h * 0.05) - 20;
                  if (a > 35) { estCintura += 1.5; estBusto += 1.0; }
                  if (fitPreference === 'justo') { estBusto -= 2.5; estCintura -= 2.5; estQuadril -= 2.5; }
                  else if (fitPreference === 'largo') { estBusto += 2.5; estCintura += 2.5; estQuadril += 2.5; }

                  return (
                    <div className="text-[9px] text-slate-500 font-bold bg-white/75 py-1.5 px-2 rounded-lg border border-[#1E3A42]/5 flex justify-center gap-3">
                      <span>Busto: ~{Math.round(estBusto)} cm</span>
                      <span>Cintura: ~{Math.round(estCintura)} cm</span>
                      <span>Quadril: ~{Math.round(estQuadril)} cm</span>
                    </div>
                  );
                })()}

                {/* Apply Button */}
                <button
                  type="button"
                  id="apply-recommended-size-btn"
                  onClick={() => handleApplyRecommendedSize(fitRecommendation || 'M')}
                  className="w-full py-2.5 bg-[#1E3A42] hover:bg-[#1E3A42]/90 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer border-none"
                >
                  <Check size={14} />
                  <span>Aplicar Tamanho Recomendado</span>
                </button>
              </div>
            ) : (
              <div className="bg-white/60 border border-[#1E3A42]/5 p-4 rounded-2xl text-center text-slate-400 text-[10.5px] font-medium leading-normal">
                💡 Preencha seus dados acima para ver a recomendação personalizada.
              </div>
            )}

            {/* Information Footnote */}
            <div className="flex gap-1.5 items-start text-left text-[9.5px] text-slate-400 leading-normal pt-1">
              <Info size={12} className="text-[#1E3A42]/40 mt-0.5 flex-shrink-0" />
              <span className="font-medium">Nossas fôrmas seguem a tabela padrão de roupas fitness femininas de alta compressão.</span>
            </div>

          </div>
        </div>
      )}

      {/* Cart Drawer & Checkout Form */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex justify-end z-[190] text-[11px] md:text-xs animate-in fade-in duration-200" onClick={() => setIsCartOpen(false)}>
          <div className="bg-white w-full h-full md:max-w-md md:h-[calc(100%-2rem)] md:my-4 md:mr-4 md:rounded-3xl shadow-2xl p-5 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-250 font-sans text-slate-800" onClick={(e) => e.stopPropagation()}>
            <CheckoutWizard
              cart={cart}
              clients={clients}
              initialStep={cartInitialStep}
              handleUpdateItemQty={handleUpdateItemQty}
              products={products}
              onAddProductToCart={handleAddProductToCartWithPrice}
              clientName={clientName}
              setClientName={setClientName}
              clientPhone={clientPhone}
              setClientPhone={setClientPhone}
              clientEmail={clientEmail}
              setClientEmail={setClientEmail}
              clientCpf={clientCpf}
              setClientCpf={setClientCpf}
              clientBirthDate={clientBirthDate}
              setClientBirthDate={setClientBirthDate}
              deliveryMethod={deliveryMethod}
              setDeliveryMethod={setDeliveryMethod}
              addressStreet={addressStreet}
              setAddressStreet={setAddressStreet}
              addressNum={addressNum}
              setAddressNum={setAddressNum}
              addressComp={addressComp}
              setAddressComp={setAddressComp}
              addressBairro={addressBairro}
              setAddressBairro={setAddressBairro}
              addressCidade={addressCidade}
              setAddressCidade={setAddressCidade}
              addressEstado={addressEstado}
              setAddressEstado={setAddressEstado}
              addressCep={addressCep}
              setAddressCep={setAddressCep}
              clientNotes={clientNotes}
              setClientNotes={setClientNotes}
              pickupDate={pickupDate}
              setPickupDate={setPickupDate}
              pickupTime={pickupTime}
              setPickupTime={setPickupTime}
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              isApplyingCoupon={isApplyingCoupon}
              handleApplyCoupon={handleApplyCoupon}
              couponError={couponError}
              couponSuccess={couponSuccess}
              appliedCoupon={appliedCoupon}
              loggedClient={loggedClient}
              useCashback={useCashback}
              setUseCashback={setUseCashback}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              selectedFreightFee={selectedFreightFee}
              setSelectedFreightFee={setSelectedFreightFee}
              selectedFreightName={selectedFreightName}
              setSelectedFreightName={setSelectedFreightName}
              selectedFreightId={selectedFreightId}
              setSelectedFreightId={setSelectedFreightId}
              isMelhorEnvioLoading={isMelhorEnvioLoading}
              melhorEnvioError={melhorEnvioError}
              melhorEnvioOptions={melhorEnvioOptions}
              handleCalculateMelhorEnvio={handleCalculateMelhorEnvio}
              pixDiscountPercent={pixDiscountPercent}
              pixPayload={dynamicPixCode || pixPayload}
              storePixKey={storePixKey}
              isCopiedPix={isCopiedPix}
              handleCopyPix={handleCopyPix}
              checkoutError={checkoutError}
              setCheckoutError={setCheckoutError}
              isVipRegisteredJustNow={isVipRegisteredJustNow}
              vipMessage={vipMessage}
              cartSubtotal={cartSubtotal}
              cartDiscount={cartDiscount}
              vipDiscount={vipDiscount}
              pixDiscount={pixDiscount}
              cashbackDiscount={cashbackDiscount}
              cartTotal={cartTotal}
              completedOrder={completedOrder}
              setCompletedOrder={setCompletedOrder}
              handleCheckoutWhatsApp={handleCheckoutWhatsApp}
              isGeneratingPaymentLink={isGeneratingPaymentLink}
              setIsCartOpen={setIsCartOpen}
              setIsProfileModalOpen={setIsProfileModalOpen}
            />
          </div>
        </div>
      )}

      </div>

      {/* 10. Floating Banner / Popup Card */}
      {floatingBanner.show && !isFloatingDismissed && (
        <div className="fixed bottom-6 right-6 z-[60] max-w-sm w-80 bg-white border border-rose-100 rounded-3xl p-4 shadow-2xl shadow-pink-600/15 animate-bounce-subtle font-sans transition-all duration-300">
          <button 
            type="button"
            onClick={() => setIsFloatingDismissed(true)}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition cursor-pointer border-none bg-transparent flex items-center justify-center h-6 w-6"
          >
            <X size={12} />
          </button>
          
          <div className="space-y-3 font-sans mt-1">
            {floatingBanner.image && (
              <img 
                src={floatingBanner.image} 
                className="w-full h-28 object-cover rounded-2xl" 
                alt="Banner Promocional"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="space-y-1 text-left font-sans">
              <span className="text-[8px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full" style={{ backgroundColor: `${floatingBanner.bgColor}15`, color: floatingBanner.bgColor }}>
                Campanha Ativa
              </span>
              <h4 className="text-xs font-extrabold text-slate-800 pt-1 tracking-tight">{floatingBanner.title}</h4>
              <p className="text-[10px] text-slate-500 font-medium leading-normal">{floatingBanner.subtitle}</p>
            </div>
            
            <button 
              type="button"
              onClick={() => {
                const campaignCoupon = extractCampaignCoupon();
                const couponObj = { code: campaignCoupon, discountPercent: 5, fixedDiscount: 0 };
                setAppliedCoupon(couponObj);
                setCouponCode(campaignCoupon);
                const msg = `Cupom ${campaignCoupon} (5% OFF e Frete Grátis) ativado com sucesso para sua sacola! 🎉`;
                setCouponSuccess(msg);
                setCouponToastMsg(msg);
                setShowCouponToast(true);
                setIsFloatingDismissed(true);

                try {
                  localStorage.setItem('ap_applied_coupon', JSON.stringify(couponObj));
                  localStorage.setItem('ap_coupon_code', campaignCoupon);
                } catch (e) {}

                setTimeout(() => {
                  const anchor = document.getElementById('search-catalog-bar') || document.getElementById('colecao-run-anchor');
                  if (anchor) {
                    anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 100);
              }}
              className="block w-full text-center py-2 px-4 rounded-xl text-[10px] font-bold text-white transition hover:opacity-90 tracking-wide border-none cursor-pointer"
              style={{ backgroundColor: floatingBanner.bgColor }}
            >
              {floatingBanner.ctaText || "Aproveitar Desconto"}
            </button>
          </div>
        </div>
      )}

      {/* 10.5 Active Coupon Toast Feedback */}
      {showCouponToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[92%] bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl flex-shrink-0">
              🏷️
            </div>
            <div className="text-left">
              <h5 className="font-extrabold text-xs text-emerald-400 uppercase tracking-wider">Cupom de Desconto Ativado!</h5>
              <p className="text-[11px] text-slate-200 leading-tight mt-0.5">{couponToastMsg || `Cupom ${couponCode} adicionado à sua sacola!`}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowCouponToast(false);
                handleOpenCart(1);
              }}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition shadow-sm cursor-pointer border-none"
            >
              Ver Sacola
            </button>
            <button
              type="button"
              onClick={() => setShowCouponToast(false)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer border-none bg-transparent flex items-center justify-center h-6 w-6"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 11. Profile Modal / Clube VIP e Cashback */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-[100] p-4 text-[11px] md:text-xs">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col font-sans text-slate-800">
            
            {/* Header */}
            <div className="bg-pink-600 text-white p-5 flex justify-between items-center relative">
              <div className="flex items-center gap-2">
                <Gift size={18} className="animate-bounce" />
                <div>
                  <h3 className="font-extrabold text-sm md:text-base tracking-tight uppercase">Área do Cliente & Clube VIP 🌸</h3>
                  <p className="text-[10px] text-pink-100 font-medium">Acompanhe seus pedidos, rastreio de entregas e saldo de cashback</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  setLoginError('');
                }}
                className="p-1.5 bg-pink-700/50 hover:bg-pink-850/80 rounded-full transition text-white border-none cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Content body */}
            <div className="p-6 space-y-4 text-left">
              {loggedClient ? (
                // LOGGED VIP VIEW
                <div className="space-y-4">
                  <div className="bg-pink-50/40 border border-pink-100 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-pink-600 text-white flex items-center justify-center font-black text-sm">
                        {loggedClient.name.split(' ')[0][0].toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-850 text-sm leading-tight">{loggedClient.name}</h4>
                        {loggedClient.vip ? (
                          <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider block w-max mt-0.5 flex items-center gap-0.5 animate-pulse">
                            Membro VIP 👑
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-650 border border-slate-200 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider block w-max mt-0.5">
                            Cliente Cadastrado 👤
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-pink-100/50 pt-3 grid grid-cols-2 gap-3 text-slate-650 text-[10px]">
                      <div>
                        <span className="block text-slate-400 font-bold uppercase text-[8px]">Pedidos Realizados</span>
                        <strong className="text-slate-800 text-xs font-mono">{loggedClient.ordersCount || 1} compras</strong>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-bold uppercase text-[8px]">Investimento Acumulado</span>
                        <strong className="text-slate-800 text-xs font-mono">R$ {(loggedClient.totalSpent || 0).toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Cashback Display Card */}
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-5 shadow-md shadow-emerald-500/10 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute right-2 -bottom-2 opacity-10 pointer-events-none transform rotate-12">
                      <Gift size={96} />
                    </div>
                    <div className="space-y-1 relative z-10">
                      <span className="text-[9px] font-extrabold tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded-full block w-max">
                        Seu Saldo Disponível
                      </span>
                      <h3 className="text-2xl font-black font-mono tracking-tight pt-1">
                        R$ {(loggedClient.cashbackBalance || 0).toFixed(2)}
                      </h3>
                      <p className="text-[9px] text-emerald-100 leading-normal max-w-[220px]">
                        Insira itens na sacola para resgatar seu saldo como desconto no Checkout!
                      </p>
                    </div>
                    <div className="bg-white/10 p-2.5 rounded-xl border border-white/10 flex items-center justify-center">
                      <span className="text-xl">💰</span>
                    </div>
                  </div>

                  {/* Meus Pedidos & Rastreamento Geral */}
                  <div className="border-t border-slate-100 pt-4 space-y-3 font-sans">
                    <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-xs">
                      <span>🛍️ Meus Pedidos & Rastreamento</span>
                    </div>

                    {mergedClientOrders.length === 0 ? (
                      <div className="bg-slate-50 border border-slate-100 text-center py-5 px-4 rounded-2xl text-slate-400 text-[10px] font-medium">
                        Nenhum pedido localizado para o seu CPF ainda. Faça seu primeiro pedido no catálogo para iniciar o seu histórico! 💕
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                        {mergedClientOrders.map((order) => {
                          const orderDateFormatted = new Date(order.date).toLocaleDateString('pt-BR');
                          
                          // Logistic Status Labels
                          const logStatus = String(order.status_logistico || '').toLowerCase().trim();
                          let logStatusLabel = 'Aguardando Separação';
                          let logStatusColor = 'bg-slate-100 text-slate-700';

                          if (logStatus === 'saiu para entrega' || logStatus === 'saiu_para_entrega' || logStatus === 'a_caminho') {
                            logStatusLabel = '🏍️ Saiu para Entrega';
                            logStatusColor = 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse';
                          } else if (logStatus === 'entregue' || logStatus === 'finalizado' || logStatus === 'concluído' || logStatus === 'concluido') {
                            logStatusLabel = '✅ Entregue';
                            logStatusColor = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
                          } else if (logStatus === 'enviado' || logStatus === 'postado') {
                            logStatusLabel = '📦 Enviado / Postado';
                            logStatusColor = 'bg-blue-100 text-blue-800 border border-blue-200';
                          } else if (logStatus === 'cancelado') {
                            logStatusLabel = '❌ Cancelado';
                            logStatusColor = 'bg-rose-100 text-rose-800 border border-rose-200';
                          }

                          // Payment Status Labels
                          const payStatus = String(order.status_pagamento || '').toLowerCase().trim();
                          let payStatusLabel = 'Pendente';
                          let payStatusColor = 'bg-amber-100 text-amber-800 border border-amber-100';

                          if (payStatus === 'pago' || payStatus === 'confirmado' || payStatus === 'concluido' || payStatus === 'concluído') {
                            payStatusLabel = 'Pago';
                            payStatusColor = 'bg-emerald-100 text-emerald-800 border border-emerald-150';
                          } else if (payStatus === 'cancelado' || payStatus === 'estornado') {
                            payStatusLabel = 'Cancelado';
                            payStatusColor = 'bg-rose-100 text-rose-800 border border-rose-150';
                          }

                          return (
                            <div key={order.id} className="bg-slate-50 border border-slate-150 hover:border-pink-200 rounded-2xl p-3.5 space-y-2.5 transition-all text-[11px]">
                              {/* Order Identification & Total */}
                              <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/50">
                                <span className="font-mono font-bold text-slate-800 uppercase">#{order.id.substring(0,8)}</span>
                                <span className="text-[10px] text-slate-450">{orderDateFormatted}</span>
                              </div>

                              {/* Items Summary */}
                              <div className="text-slate-650 leading-relaxed font-sans">
                                <span className="text-slate-400 font-bold block uppercase text-[8px] tracking-wider mb-0.5">Peças</span>
                                <p className="font-semibold text-slate-700 leading-normal">{order.items}</p>
                              </div>

                              {/* Badges for status */}
                              <div className="flex flex-wrap gap-2 pt-1">
                                <div className="space-y-0.5">
                                  <span className="text-[8px] text-slate-400 font-bold uppercase block">Financeiro</span>
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9.5px] font-extrabold ${payStatusColor}`}>
                                    {payStatusLabel}
                                  </span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[8px] text-slate-400 font-bold uppercase block">Logística</span>
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9.5px] font-extrabold ${logStatusColor}`}>
                                    {logStatusLabel}
                                  </span>
                                </div>
                              </div>

                              {/* Delivery Type & Instructions / Tracking */}
                              <div className="bg-white rounded-xl p-2.5 border border-slate-150 font-sans space-y-1 mt-1 text-[10px]">
                                {order.deliveryMethod === 'retirada' ? (
                                  <div className="space-y-1 text-slate-650 leading-relaxed">
                                    <p className="font-extrabold text-pink-700 flex items-center gap-1">🏠 Retirada Combinada na Loja</p>
                                    {order.pickupDate ? (
                                      <p className="font-bold text-slate-700">📅 Agendado para: <span className="font-mono">{new Date(order.pickupDate).toLocaleDateString('pt-BR')}</span> às <span className="font-mono">{order.pickupTime || ''}</span></p>
                                    ) : (
                                      <p className="text-slate-500 font-medium">Aguardando vendedora confirmar o agendamento de retirada.</p>
                                    )}
                                    <p className="text-slate-500 text-[9px] bg-pink-50/50 p-1.5 rounded-lg border border-pink-100/30 leading-snug">
                                      📍 <strong>Instruções de Retirada:</strong> Compareça no nosso Showroom trazendo um documento de identificação com foto. Se for enviar motoboy próprio para coletar, avise nossa equipe no WhatsApp!
                                    </p>
                                  </div>
                                ) : order.deliveryMethod === 'motoboy' ? (
                                  <div className="space-y-1 text-slate-650 leading-relaxed">
                                    <p className="font-extrabold text-blue-700 flex items-center gap-1">🏍️ Entrega via Motoboy Express</p>
                                    {logStatus === 'saiu para entrega' || logStatus === 'saiu_para_entrega' || logStatus === 'a_caminho' ? (
                                      <p className="font-bold text-amber-700 animate-pulse bg-amber-50 p-1 px-2 rounded-lg border border-amber-100">🛵 O entregador está com seu pedido na rota de entrega! Tenha alguém no endereço para recebimento.</p>
                                    ) : logStatus === 'entregue' ? (
                                      <p className="text-emerald-750 font-bold">🎉 Pedido entregue! Esperamos que ame seus looks novos. Divirta-se nos treinos!</p>
                                    ) : (
                                      <p className="text-slate-500 font-medium">Seu pedido está sendo separado com muito amor e carinho em nosso centro de distribuição.</p>
                                    )}
                                  </div>
                                ) : order.deliveryMethod === 'correios' ? (
                                  <div className="space-y-1 text-slate-650 leading-relaxed">
                                    <p className="font-extrabold text-purple-700 flex items-center gap-1">📦 Envio via Correios / Transportadora</p>
                                    {order.trackingCode ? (
                                      <div className="flex flex-col gap-1">
                                        <p className="font-bold text-slate-700">Rastreio Correios:</p>
                                        <div className="flex items-center gap-1">
                                          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[10.5px] text-slate-800 border border-slate-200 font-bold">{order.trackingCode}</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              navigator.clipboard.writeText(order.trackingCode);
                                              alert('Código de rastreio copiado para a área de transferência! 📋');
                                            }}
                                            className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 rounded font-bold transition text-slate-755 text-[8.5px] cursor-pointer border-none"
                                          >
                                            Copiar
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-slate-450 font-medium italic">Código de rastreamento será gerado assim que postado nos Correios.</p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-1 text-slate-650 leading-relaxed">
                                    <p className="font-extrabold text-slate-700 flex items-center gap-1">🤝 Entrega Combinada com Vendedora</p>
                                    <p className="text-slate-500 font-medium">Aguardando contato via WhatsApp para definir a melhor data e local.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <p className="text-[9px] text-slate-400 text-center leading-normal">
                    Fidelidade garantida: 5% de cashback sobre o valor pago é devolvido em cada nova compra concluída!
                  </p>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileModalOpen(false);
                        handleOpenCart(1);
                      }}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold transition text-center cursor-pointer border-none shadow-sm"
                    >
                      Ver Minha Sacola
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoggedClient(null);
                        setUseCashback(false);
                      }}
                      className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-bold transition text-center cursor-pointer border-none"
                    >
                      Sair da Conta
                    </button>
                  </div>
                </div>
              ) : (
                // LOGIN FORM VIEW
                <div className="space-y-4 font-sans">
                  <p className="text-slate-600 text-[10.5px] leading-relaxed">
                    Acesse seu espaço exclusivo! Insira o seu <strong>CPF cadastrado</strong> para visualizar seu histórico de compras, status das entregas e benefícios do Clube VIP.
                  </p>
                  
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold text-[9px] uppercase tracking-wider block">Insira seu CPF *</label>
                    <input 
                      type="text"
                      required
                      placeholder="000.000.000-00"
                      value={loginCpf}
                      onChange={(e) => setLoginCpf(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-pink-500 font-medium font-mono tracking-wide"
                    />
                  </div>

                  {loginError && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-700 p-2.5 rounded-xl text-[9.5px] font-bold leading-normal">
                      ⚠ {loginError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const cleaned = loginCpf.replace(/\D/g, '');
                      if (!cleaned) {
                        setLoginError('Por favor, informe seu CPF.');
                        return;
                      }
                      
                      let found = (clients || []).find(c => c.cpf && c.cpf.replace(/\D/g, '') === cleaned);
                      if (!found) {
                        // Check local storage for saved clients
                        try {
                          const storedClients = localStorage.getItem('ap_moda_clients');
                          if (storedClients) {
                            const parsed = JSON.parse(storedClients);
                            if (Array.isArray(parsed)) {
                              found = parsed.find((c: any) => c.cpf && c.cpf.replace(/\D/g, '') === cleaned);
                            }
                          }
                        } catch (e) {}
                      }

                      if (!found) {
                        // Let's look in onlineOrders to see if there is an order with this CPF!
                        const matchedOrder = (onlineOrders || []).find(o => {
                          let orderCpf = o.cpf || '';
                          if (!orderCpf && o.notes) {
                            const match = o.notes.match(/CPF:\s*([0-9.-]+)/i);
                            if (match && match[1]) {
                              orderCpf = match[1].trim();
                            }
                          }
                          return orderCpf.replace(/\D/g, '') === cleaned;
                        });
                        if (matchedOrder) {
                          found = {
                            id: `cli-${Date.now()}`,
                            name: matchedOrder.clientName || 'Cliente',
                            phone: matchedOrder.phone || '',
                            email: matchedOrder.email || '',
                            cpf: cleaned,
                            totalSpent: matchedOrder.total,
                            ordersCount: 1,
                            channel: 'E-commerce',
                            createdAt: matchedOrder.createdAt || new Date().toISOString(),
                            vip: false
                          };
                        }
                      }

                      if (found) {
                        setLoggedClient(found);
                        const cName = found.name || '';
                        const cPhone = found.phone || found.whatsapp || '';
                        const cEmail = found.email || '';
                        const cCpf = found.cpf || '';
                        const cBirth = found.birthDate || '';
                        const cStreet = found.addressStreet || found.street || '';
                        const cNum = found.addressNum || found.number || '';
                        const cComp = found.addressComp || found.complement || '';
                        const cBairro = found.addressBairro || found.bairro || '';
                        const cCidade = found.addressCidade || found.city || '';
                        const cEstado = found.addressEstado || found.state || '';
                        const cCep = found.addressCep || found.cep || '';

                        setClientName(cName);
                        setClientPhone(cPhone);
                        setClientEmail(cEmail);
                        setClientCpf(cCpf);
                        setClientBirthDate(cBirth);
                        setAddressStreet(cStreet);
                        setAddressNum(cNum);
                        setAddressComp(cComp);
                        setAddressBairro(cBairro);
                        setAddressCidade(cCidade);
                        setAddressEstado(cEstado);
                        setAddressCep(cCep);

                        try {
                          const clientData = {
                            id: found.id,
                            name: cName,
                            phone: cPhone,
                            email: cEmail,
                            cpf: cCpf,
                            birthDate: cBirth,
                            addressStreet: cStreet,
                            addressNum: cNum,
                            addressComp: cComp,
                            addressBairro: cBairro,
                            addressCidade: cCidade,
                            addressEstado: cEstado,
                            addressCep: cCep
                          };
                          localStorage.setItem('ap_checkout_client_data', JSON.stringify(clientData));
                          localStorage.setItem('ap_last_client_data', JSON.stringify(clientData));
                          localStorage.setItem('ap_pdv_selected_client', JSON.stringify(clientData));
                          window.dispatchEvent(new Event('ap-pdv-client-updated'));
                        } catch (e) {}

                        setLoginError('');
                      } else {
                        setLoginError('CPF não localizado em nosso sistema. Faça seu primeiro pedido para se cadastrar automaticamente!');
                      }
                    }}
                    className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-pink-500/10 transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 font-sans"
                  >
                    <span>Entrar na Área do Cliente</span>
                  </button>

                  <div className="border-t border-slate-100 pt-3 text-center">
                    <span className="text-[9.5px] text-slate-450 leading-normal block">
                      Ainda não comprou conosco? Ao realizar seu primeiro pedido, você será cadastrado automaticamente, ganhará descontos exclusivos e acumulará <strong>5% de cashback</strong> para as próximas compras. ✨
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 11.5. Unified Access Modal (Wishlist Trapping) */}
      {isLeadCaptureOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-[200] p-4 text-[11px] md:text-xs">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col font-sans text-slate-800">
            {/* Header */}
            <div className="bg-pink-600 text-white p-5 flex justify-between items-center relative" style={{ backgroundColor: themeColor }}>
              <div className="flex items-center gap-2">
                <Heart size={18} className="animate-pulse fill-white text-white" />
                <div>
                  <h3 className="font-extrabold text-sm md:text-base tracking-tight uppercase">
                    {leadAuthMode === 'register' ? 'Salvar Favoritos 💖' : 'Acessar Conta 🔑'}
                  </h3>
                  <p className="text-[10px] text-pink-100 font-medium">
                    {leadAuthMode === 'register' ? 'Não perca seus modelos preferidos de vista!' : 'Sincronize seus favoritos em tempo real!'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsLeadCaptureOpen(false);
                  setPendingFavoriteProductId(null);
                  setLeadError('');
                }}
                className="p-1.5 bg-pink-700/50 hover:bg-pink-850/80 rounded-full transition text-white border-none cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleUnifiedAuthSubmit} className="p-6 space-y-4 text-left">
              <div className="bg-pink-50/50 border border-pink-100 rounded-2xl p-4 text-center space-y-1.5">
                <p className="text-[10px] text-pink-700 font-extrabold uppercase tracking-wider">
                  {leadAuthMode === 'register' ? 'Desconto Exclusivo Esperando Você! 🎁' : 'Seu Saldo e Favoritos Sincronizados! ✨'}
                </p>
                <p className="text-slate-650 text-[11px] leading-relaxed">
                  {leadAuthMode === 'register' ? (
                    <>Salve seus modelos favoritos! Crie sua conta rapidinho para não perder suas escolhas e receber cupons de desconto exclusivos da <strong>{storeName}</strong>.</>
                  ) : (
                    <>Entre na sua conta para sincronizar seus favoritos em todos os seus aparelhos e acessar seu saldo do Clube VIP.</>
                  )}
                </p>
              </div>

              {leadError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 p-2.5 rounded-xl text-[10px] font-bold leading-normal">
                  ⚠ {leadError}
                </div>
              )}

              {leadAuthMode === 'register' ? (
                /* REGISTRATION FORM */
                <div className="space-y-3 animate-in fade-in duration-200">
                  {/* Nome */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Maria Silva"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs font-semibold focus:outline-hidden focus:border-pink-500 transition"
                    />
                  </div>

                  {/* E-mail */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">E-mail (Opcional)</label>
                    <input
                      type="email"
                      placeholder="Ex: maria@email.com (opcional)"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs font-semibold focus:outline-hidden focus:border-pink-500 transition"
                    />
                  </div>

                  {/* CPF */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">CPF *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 000.000.000-00"
                      value={leadCpf}
                      onChange={(e) => setLeadCpf(formatCPFInput(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs font-mono font-bold focus:outline-hidden focus:border-pink-500 transition"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">WhatsApp *</label>
                    <input
                      type="text"
                      required
                      placeholder="(00) 00000-0000"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(formatWhatsApp(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs font-mono font-bold focus:outline-hidden focus:border-pink-500 transition"
                    />
                  </div>

                  {/* Senha */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Crie uma Senha *</label>
                    <input
                      type="password"
                      required
                      placeholder="Mínimo 6 caracteres"
                      value={leadPassword}
                      onChange={(e) => setLeadPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs font-semibold focus:outline-hidden focus:border-pink-500 transition"
                    />
                  </div>
                </div>
              ) : (
                /* LOGIN FORM */
                <div className="space-y-3 animate-in fade-in duration-200">
                  {/* Identificação */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">E-mail, CPF ou WhatsApp *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: maria@email.com ou seu CPF"
                      value={leadLoginUser}
                      onChange={(e) => setLeadLoginUser(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs font-semibold focus:outline-hidden focus:border-pink-500 transition"
                    />
                  </div>

                  {/* Senha */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Sua Senha de Acesso *</label>
                    <input
                      type="password"
                      required
                      placeholder="Sua senha criada ou o padrão '123'"
                      value={leadLoginPassword}
                      onChange={(e) => setLeadLoginPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs font-semibold focus:outline-hidden focus:border-pink-500 transition"
                    />
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                type="submit"
                disabled={isLeadSubmitting}
                className="w-full py-3 bg-pink-600 hover:bg-pink-700 disabled:bg-slate-300 text-white font-extrabold text-xs rounded-xl shadow-md shadow-pink-500/10 transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 font-sans"
                style={{ backgroundColor: isLeadSubmitting ? '#cbd5e1' : themeColor }}
              >
                {isLeadSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <Heart size={14} className="fill-white" />
                    <span>{leadAuthMode === 'register' ? 'Cadastrar & Salvar Favorito' : 'Acessar Conta & Salvar Favorito'}</span>
                  </>
                )}
              </button>

              {/* Toggle Switch */}
              <div className="border-t border-slate-100 pt-3 text-center">
                {leadAuthMode === 'register' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setLeadAuthMode('login');
                      setLeadError('');
                    }}
                    className="text-[11px] text-pink-600 font-extrabold hover:underline cursor-pointer border-none bg-transparent"
                  >
                    Já possui cadastro conosco? Entrar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setLeadAuthMode('register');
                      setLeadError('');
                    }}
                    className="text-[11px] text-pink-600 font-extrabold hover:underline cursor-pointer border-none bg-transparent"
                  >
                    Não possui cadastro? Criar uma conta
                  </button>
                )}
              </div>

              <div className="text-center">
                <span className="text-[9.5px] text-slate-450 font-medium">
                  🔒 Seus dados estão 100% seguros e protegidos.
                </span>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 12.5. Slim Filter Drawer (Left to Right) */}
      {isFilterDrawerOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[170] transition-opacity duration-300 animate-in fade-in"
          onClick={() => setIsFilterDrawerOpen(false)}
        >
          <div 
            className="fixed inset-y-0 left-0 w-80 max-w-[95%] bg-[#FAF9F6] shadow-2xl flex flex-col justify-between z-[180] animate-in slide-in-from-left duration-300 border-r border-[#1E3A42]/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#1E3A42]/10 flex justify-between items-center bg-[#FAF9F6]">
              <div className="flex flex-col">
                <span className="font-serif italic text-lg font-bold text-[#1E3A42]">
                  Filtrar Vitrine
                </span>
                <span className="text-[8px] font-bold uppercase tracking-widest mt-0.5 text-[#1E3A42]/60">
                  Navegação Precisa
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="p-1.5 bg-[#1E3A42]/5 hover:bg-[#1E3A42]/10 rounded-full transition text-[#1E3A42] cursor-pointer border-none"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Filters Content */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              
              {/* Sizes Filter */}
              <div className="space-y-3">
                <p className="font-extrabold text-[10px] uppercase tracking-wider text-[#1E3A42]">Tamanhos</p>
                <div className="grid grid-cols-4 gap-2">
                  {allSizes.map(size => {
                    const isSelected = selectedSizesFilter.includes(size);
                    return (
                      <button
                        key={`filter-size-${size}`}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedSizesFilter(selectedSizesFilter.filter(s => s !== size));
                          } else {
                            setSelectedSizesFilter([...selectedSizesFilter, size]);
                          }
                        }}
                        className={`py-2 rounded-lg text-xs font-bold transition-all text-center border cursor-pointer
                          ${isSelected 
                            ? 'bg-[#1E3A42] text-white border-[#1E3A42] shadow-sm' 
                            : 'bg-white text-[#1E3A42] border-[#1E3A42]/15 hover:bg-slate-100'}`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colors Filter */}
              <div className="space-y-3">
                <p className="font-extrabold text-[10px] uppercase tracking-wider text-[#1E3A42]">Cores</p>
                <div className="space-y-1.5">
                  {allColors.map(color => {
                    const isSelected = selectedColorsFilter.includes(color);
                    return (
                      <button
                        key={`filter-color-${color}`}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedColorsFilter(selectedColorsFilter.filter(c => c !== color));
                          } else {
                            setSelectedColorsFilter([...selectedColorsFilter, color]);
                          }
                        }}
                        className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold transition-all text-left flex items-center justify-between cursor-pointer border
                          ${isSelected 
                            ? 'bg-white border-[#1E3A42] text-[#1E3A42] shadow-sm font-extrabold' 
                            : 'bg-white border-[#1E3A42]/10 text-[#1E3A42]/70 hover:bg-slate-100'}`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span 
                            className="w-3 h-3 rounded-full border border-slate-205" 
                            style={{ 
                              backgroundColor: 
                                color.toLowerCase() === 'preto' ? '#000000' :
                                color.toLowerCase() === 'rosa' ? '#f472b6' :
                                color.toLowerCase() === 'azul' ? '#2563eb' :
                                color.toLowerCase() === 'verde' ? '#16a34a' :
                                color.toLowerCase() === 'cinza' ? '#6b7280' :
                                color.toLowerCase() === 'vinho' || color.toLowerCase() === 'bordô' ? '#7f1d1d' :
                                color.toLowerCase() === 'branco' ? '#ffffff' : '#94a3b8'
                            }} 
                          />
                          {color}
                        </span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-[#1E3A42]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Bottom Actions Drawer */}
            <div className="p-4 border-t border-[#1E3A42]/10 bg-[#FAF9F6] space-y-2">
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="w-full py-2.5 bg-[#1E3A42] hover:bg-[#1E3A42]/90 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition border-none cursor-pointer"
              >
                Aplicar Filtros
              </button>
              {(selectedSizesFilter.length > 0 || selectedColorsFilter.length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSizesFilter([]);
                    setSelectedColorsFilter([]);
                  }}
                  className="w-full py-2 bg-transparent text-[#1E3A42]/70 hover:text-[#1E3A42] font-bold text-[10px] uppercase tracking-wider transition border border-[#1E3A42]/10 rounded-xl cursor-pointer"
                >
                  Limpar Todos os Filtros
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 12. Public Sidebar Category Drawer */}
      {isMenuDrawerOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[150] transition-opacity duration-300 animate-in fade-in"
          onClick={() => setIsMenuDrawerOpen(false)}
        >
          <div 
            className="fixed inset-y-0 left-0 w-80 max-w-[90%] bg-white shadow-2xl flex flex-col z-[160] animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-pink-50/20">
              <div className="flex flex-col">
                <span className="font-serif italic text-lg font-bold text-slate-950">
                  {storeName}
                </span>
                <span className="text-[8px] font-bold uppercase tracking-widest mt-0.5" style={{ color: themeColor }}>
                  {storeSub}
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setIsMenuDrawerOpen(false)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full transition text-slate-700 cursor-pointer border-none"
              >
                <X size={16} />
              </button>
            </div>

            {/* Categories Navigation */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div className="space-y-3">
                <p className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400">Navegar por Categorias</p>
                <div className="space-y-1">
                  {categoriesList.map(cat => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={`menu-cat-${cat}`}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setIsMenuDrawerOpen(false);
                          // Scroll to catalog section if needed
                          const section = document.getElementById('search-catalog-bar');
                          if (section) {
                            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer border border-transparent
                          ${isSelected 
                            ? 'bg-pink-600 text-white shadow-md shadow-pink-500/10' 
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100/80 active:bg-slate-200/50'}`}
                        style={isSelected ? { backgroundColor: themeColor } : {}}
                      >
                        <span className="flex items-center gap-2">
                          {cat === 'Todos' ? '🌸' : '⚡'} {cat}
                        </span>
                        <ChevronRight size={14} className={isSelected ? 'text-white' : 'text-slate-400'} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick advantages */}
              <div className="border-t border-slate-100 pt-5 space-y-4 text-[11px] text-slate-500 font-medium">
                <p className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400 block">Vantagens da Loja</p>
                
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🚚</span>
                  <span>Frete Grátis acima de R$ 399</span>
                </div>
                
                <div className="flex items-center gap-2.5">
                  <span className="text-base">💳</span>
                  <span>Até 6x Sem Juros no Cartão</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-base">👑</span>
                  <span>Ganhe 5% de Cashback VIP</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-base">🔒</span>
                  <span>Compra 100% Protegida</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 text-center">
              <span>{storeName} • Todos os direitos reservados.</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
