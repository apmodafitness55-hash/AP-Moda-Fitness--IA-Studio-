/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Menu, 
  X, 
  Bell, 
  Search, 
  Instagram, 
  Clock, 
  TrendingUp, 
  RefreshCw,
  Sliders,
  DollarSign,
  Package,
  ShoppingBag,
  Sun,
  Moon,
  CloudLightning
} from 'lucide-react';

import { ActiveTab, Product, Sale, Client, Transaction } from './types';
import { INITIAL_PRODUCTS, INITIAL_CLIENTS, INITIAL_SALES, INITIAL_TRANSACTIONS } from './data/mockData';

import Sidebar from './components/Sidebar';
import DashboardOverview from './components/DashboardOverview';
import DashboardExecutive from './components/DashboardExecutive';
import DashboardPerformanceAnalytics from './components/DashboardPerformanceAnalytics';
import PDVTerminal from './components/PDVTerminal';
import CatalogInventory from './components/CatalogInventory';
import CustomersCRM from './components/CustomersCRM';
import FinanceCashflow from './components/FinanceCashflow';
import OrdersLogistics from './components/OrdersLogistics';
import LojaOnline from './components/LojaOnline';
import SettingsSystem from './components/SettingsSystem';
import AIAgentsHub from './components/AIAgentsHub';
import SalesGoalSimulator from './components/SalesGoalSimulator';
import VendasList from './components/VendasList';
import DriverAppPortal from './components/DriverAppPortal';
import GoogleWorkspace from './components/GoogleWorkspace';

import PublicCatalog from './components/PublicCatalog';
import LoginScreen from './components/LoginScreen';
import PartnerPortal from './components/PartnerPortal';
import CustomerPortal from './components/CustomerPortal';
import SellerDashboard from './components/SellerDashboard';
import SuppliersManagement from './components/SuppliersManagement';
import StorefrontPaymentConfig from './components/StorefrontPaymentConfig';
import ErrorBoundary from './components/ErrorBoundary';
import { 
  getFirebaseConfig, 
  getFirebaseClient,
  initializeFirebaseConfig,
  fetchTeamMembersFromFirebase, 
  syncBulkTeamMembersToFirebase,
  pingFirebaseOnLogin,
  fetchProductsFromFirebase,
  syncBulkProductsToFirebase,
  deleteProductFromFirebase,
  deleteSaleFromFirebase,
  fetchClientsFromFirebase,
  syncBulkClientsToFirebase,
  fetchSalesFromFirebase,
  syncBulkSalesToFirebase,
  fetchTransactionsFromFirebase,
  syncBulkTransactionsToFirebase,
  fetchOnlineOrdersFromFirebase,
  syncBulkOnlineOrdersToFirebase,
  fetchCheckoutsFromFirebase,
  syncBulkCheckoutsToFirebase,
  syncSystemConfigsWithFirebase,
  fetchSystemConfigsFromFirebase,
  pushSystemConfigToFirebase,
  getTolerantValue,
  clearAllFirebaseData
} from './firebase';

export default function App() {
  // Reference to force instant background custom pushes on changes
  const performSyncRef = useRef<(() => Promise<void>) | null>(null);

  // Sidebar toggler
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.DASHBOARD);
  const [isDriverPortalOpen, setIsDriverPortalOpen] = useState(false);

  // Lifted subtab states for side navigation direct access
  const [ordersLogisticsSubTab, setOrdersLogisticsSubTab] = useState<'pedidos' | 'trocas_crediario' | 'logistica' | 'condicional'>('pedidos');
  const [customersCRMSubTab, setCustomersCRMSubTab] = useState<'diretorio' | 'funil' | 'followup' | 'parceiros' | 'fidelidade'>('diretorio');
  const [suppliersManagementSubTab, setSuppliersManagementSubTab] = useState<'fornecedores' | 'compras'>('fornecedores');
  const [productsSubTab, setProductsSubTab] = useState<'inventario' | 'restoque' | 'cadastro'>('inventario');
  const [lojaOnlineSubTab, setLojaOnlineSubTab] = useState<'compartilhar' | 'cupons' | 'vitrine' | 'recuperacao' | 'marketing'>('compartilhar');
  const [aiAgentsHubSubTab, setAiAgentsHubSubTab] = useState<'descritor' | 'estilista' | 'whatsapp' | 'sentinela' | 'campanha' | 'consultoria' | 'tradutor' | 'precificador'>('descritor');
  const [googleWorkspaceSubTab, setGoogleWorkspaceSubTab] = useState<'agenda' | 'tarefas' | 'docs' | 'gmail' | 'sheets' | 'drive' | 'config'>('config');
  const [settingsSystemSubTab, setSettingsSystemSubTab] = useState<'empresa' | 'integracoes' | 'seguranca' | 'roadmap' | 'vitrine'>('empresa');

  // Controle de Usuários e Acessos (Equipe)
  const [teamMembers, setTeamMembers] = useState<any[]>(() => {
    const saved = localStorage.getItem('ap_moda_team_users');
    let parsed = null;
    if (saved) {
      try {
        parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Auto-heal admin password on load to prevent cached localStorage mismatches
          parsed = parsed.map(m => {
            if (m.role === 'Admin' && m.login.toLowerCase() === 'admin') {
              return { ...m, password: 'Ap01695*' };
            }
            return m;
          });
        }
      } catch (err) {
        parsed = null;
      }
    }
    if (parsed) return parsed;
    return [
      { id: 'usr-1', name: 'Ana Paula Admin', login: 'admin', role: 'Admin', password: 'Ap01695*', details: 'Administradora Geral', createdAt: '2026-06-15T12:00:00Z', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-2', name: 'Juliana Cardoso', login: 'juliana', role: 'Gerente', password: '123', details: 'Gerente de Vendas', createdAt: '2026-06-15T12:05:00Z', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-3', name: 'Ana Carolina', login: 'ana', role: 'Vendedor', password: '123', details: 'Vendedora Sênior', createdAt: '2026-06-15T12:10:00Z', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-4', name: 'Beatriz Rocha', login: 'beatriz', role: 'Vendedor', password: '123', details: 'Vendedora Diamante', createdAt: '2026-06-15T12:12:00Z', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-5', name: 'Juliana Costa', login: 'julianacost', role: 'Vendedor', password: '123', details: 'Vendedora Prata', createdAt: '2026-06-15T12:13:00Z', avatar: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-6', name: 'Bruna Oliveira', login: 'bruna', role: 'Vendedor', password: '123', details: 'Vendedora Bronze', createdAt: '2026-06-15T12:14:00Z', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-7', name: 'Marina Fitness Coach', login: 'marina', role: 'Parceiro', password: '123', details: 'Influenciadora Fitness (@marina_fit)', createdAt: '2026-06-15T12:15:00Z', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-8', name: 'Julia Rezende', login: 'jurezende', role: 'Parceiro', password: '123', details: 'Parceira de Estilo (@jurezendedm)', createdAt: '2026-06-15T12:17:00Z', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-9', name: 'Amanda Runner', login: 'amanda', role: 'Parceiro', password: '123', details: 'Parceira Corrida (@amandarun)', createdAt: '2026-06-15T12:19:00Z', avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-10', name: 'Bruno Ramos (Moto 1)', login: 'bruno', role: 'Entregador', password: '123', details: 'Entregador Zona Sul', createdAt: '2026-06-15T12:20:00Z', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-11', name: 'Lucas Correia (Moto 2)', login: 'lucas', role: 'Entregador', password: '123', details: 'Entregador Zona Norte', createdAt: '2026-06-15T12:22:00Z', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-12', name: 'Thales Silva (Bike/Região Central)', login: 'thales', role: 'Entregador', password: '123', details: 'Entregador Centro', createdAt: '2026-06-15T12:24:00Z', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-13', name: 'Cláudio Santos (Parceiro Envio Rápido)', login: 'claudio', role: 'Entregador', password: '123', details: 'Entregador Parcerias', createdAt: '2026-06-15T12:26:00Z', avatar: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80' }
    ];
  });

  // Vendedores dinâmicos
  const [sellers, setSellers] = useState<string[]>(() => {
    const saved = localStorage.getItem('ap_moda_sellers');
    return saved ? JSON.parse(saved) : ['Ana Carolina', 'Beatriz Rocha', 'Juliana Costa', 'Bruna Oliveira'];
  });

  // Motoboys dinâmicos
  const [motoboys, setMotoboys] = useState<string[]>(() => {
    const saved = localStorage.getItem('ap_moda_motoboys');
    return saved ? JSON.parse(saved) : ['Bruno Ramos (Moto 1)', 'Lucas Correia (Moto 2)', 'Thales Silva (Bike/Região Central)', 'Cláudio Santos (Parceiro Envio Rápido)'];
  });

  // Keep sellers, motoboys, and partners in robust real-time synchrony with teamMembers
  useEffect(() => {
    localStorage.setItem('ap_moda_team_users', JSON.stringify(teamMembers));

    // Update sellers
    const extSellers = teamMembers.filter(m => m.role === 'Vendedor').map(m => m.name);
    setSellers(extSellers);
    localStorage.setItem('ap_moda_sellers', JSON.stringify(extSellers));

    // Update motoboys
    const extMotoboys = teamMembers.filter(m => m.role === 'Entregador').map(m => m.name);
    setMotoboys(extMotoboys);
    localStorage.setItem('ap_moda_motoboys', JSON.stringify(extMotoboys));

    // Update partners (influencers list) in localStorage
    try {
      const savedPartners = localStorage.getItem('ap_moda_partners');
      const currentPartnersList = savedPartners ? JSON.parse(savedPartners) : [];
      let changed = false;

      const teamPartners = teamMembers.filter(m => m.role === 'Parceiro');
      const updatedPartnersList = [...currentPartnersList];

      teamPartners.forEach(tp => {
        const index = updatedPartnersList.findIndex(p => p.name === tp.name);
        if (index === -1) {
          updatedPartnersList.push({
            id: tp.id,
            name: tp.name,
            instagram: tp.details || '@' + tp.login,
            couponCode: tp.login.toUpperCase() + '10',
            commissionRate: 10,
            salesCount: 0,
            totalGenerated: 0,
            availableBalance: 0
          });
          changed = true;
        }
      });

      // Prune partners that no longer exist in team
      const activePartnerNames = teamPartners.map(tp => tp.name);
      const filtered = updatedPartnersList.filter(p => activePartnerNames.includes(p.name));
      if (filtered.length !== currentPartnersList.length) {
        changed = true;
      }

      if (changed || currentPartnersList.length === 0) {
        localStorage.setItem('ap_moda_partners', JSON.stringify(filtered));
      }
    } catch (e) {
      console.error(e);
    }
  }, [teamMembers]);

  // Estado de login / Sessão do usuário
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    const saved = localStorage.getItem('ap_moda_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('ap_moda_sellers', JSON.stringify(sellers));
  }, [sellers]);

  useEffect(() => {
    localStorage.setItem('ap_moda_motoboys', JSON.stringify(motoboys));
  }, [motoboys]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ap_moda_current_user', JSON.stringify(currentUser));
      // Se for entregador, força o redirecionamento direto para o DriverAppPortal
      if (currentUser.role === 'Entregador') {
        setIsDriverPortalOpen(true);
      }
    } else {
      localStorage.removeItem('ap_moda_current_user');
      setIsDriverPortalOpen(false);
    }
  }, [currentUser]);

  // Keep logged in user session (currentUser) updated in real-time if their team member profile changes
  useEffect(() => {
    if (currentUser && teamMembers && teamMembers.length > 0) {
      const match = teamMembers.find(m => m.id === currentUser.id || m.login === currentUser.login);
      if (match) {
        if (
          match.name !== currentUser.name ||
          match.role !== currentUser.role ||
          match.details !== currentUser.details ||
          match.avatar !== currentUser.avatar ||
          match.password !== currentUser.password
        ) {
          console.log('[User Session Sync] Atualizando sessão do usuário logado baseado nas alterações do perfil do colaborador:', match.name);
          setCurrentUser({
            ...currentUser,
            name: match.name,
            role: match.role,
            details: match.details,
            avatar: match.avatar,
            password: match.password,
            supabaseData: match
          });
        }
      }
    }
  }, [teamMembers, currentUser]);

  // Tema Escuro System Mode
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('ap_darkMode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ap_darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ap_darkMode', 'false');
    }
  }, [darkMode]);

  // Tema de Acentuação ('neon' | 'verde' | 'roxo' | 'rosa')
  const [themeAccent, setThemeAccent] = useState<'neon' | 'verde' | 'roxo' | 'rosa'>(() => {
    return (localStorage.getItem('ap_themeAccent') as 'neon' | 'verde' | 'roxo' | 'rosa') || 'rosa';
  });

  useEffect(() => {
    document.body.classList.remove('theme-neon', 'theme-verde', 'theme-roxo', 'theme-rosa');
    document.body.classList.add(`theme-${themeAccent}`);
    localStorage.setItem('ap_themeAccent', themeAccent);
  }, [themeAccent]);

  // Custom client-side router state to invert routing: root is public catalog, /painel or /admin is internal admin area
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
  };

  const isCustomerView = useMemo(() => {
    // Force admin view if "?admin=true" or if on "/painel" or "/admin" paths
    if (window.location.search.includes('admin=true')) {
      return false;
    }
    if (currentPath === '/painel' || currentPath === '/admin') {
      return false;
    }
    // Default to customer view on root "/" or any other paths
    return true;
  }, [currentPath]);

  // Dynamic SEO Robots index block, Title customization, Canonical URL mapping, and High-resolution Favicon mapping
  useEffect(() => {
    // 1. Robots meta tag to block administrative pages indexing & set titles/canonical links
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }

    let canonicalLink = document.querySelector('link[rel="canonical"]');

    if (isCustomerView) {
      // Indexable Public Vitrine view
      robotsMeta.setAttribute('content', 'index, follow');
      document.title = "AP Moda Fitness | Moda Fitness Premium";
      
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', 'https://apmodafitness.com.br/vitrine');
    } else {
      // Non-indexable administrative panel/PDV/CRM views
      robotsMeta.setAttribute('content', 'noindex, nofollow');
      document.title = "AP Moda Fitness — Painel Administrativo";
      
      if (canonicalLink) {
        canonicalLink.remove();
      }
    }

    // 2. High-resolution Favicon mapping
    const savedLogo = localStorage.getItem('ap_store_logo');
    const faviconUrl = savedLogo || 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=128&h=128&fit=crop&q=80';

    // Remove existing default favicon/shortcut/apple icons to prevent conflicts
    const existingIcons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
    existingIcons.forEach(el => el.remove());

    // Create high-res main icon (minimum of 48x48px)
    const linkIcon = document.createElement('link');
    linkIcon.rel = 'icon';
    linkIcon.type = 'image/png';
    linkIcon.sizes = '128x128';
    linkIcon.href = faviconUrl;
    document.head.appendChild(linkIcon);

    const linkSmallIcon = document.createElement('link');
    linkSmallIcon.rel = 'icon';
    linkSmallIcon.type = 'image/png';
    linkSmallIcon.sizes = '48x48';
    linkSmallIcon.href = faviconUrl;
    document.head.appendChild(linkSmallIcon);

    // Create higher-res apple icon
    const linkAppleIcon = document.createElement('link');
    linkAppleIcon.rel = 'apple-touch-icon';
    linkAppleIcon.sizes = '180x180';
    linkAppleIcon.href = faviconUrl;
    document.head.appendChild(linkAppleIcon);
  }, [isCustomerView, activeTab, settingsSystemSubTab]);

  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const isSyncingRef = useRef(false);
  const isUpdatingFromSyncRef = useRef(false);

  const [isCloudSyncingOnLogin, setIsCloudSyncingOnLogin] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    status: 'idle' | 'running' | 'success' | 'error';
    step: string;
    details: string;
    stepsCompleted: string[];
  }>({ status: 'idle', step: '', details: '', stepsCompleted: [] });

  // Helper functions for tracking unsynced/dirty local changes
  const getDirtyIds = useCallback((key: string): string[] => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, []);

  const saveDirtyIds = useCallback((key: string, ids: string[]) => {
    localStorage.setItem(key, JSON.stringify(ids));
  }, []);

  // States with persistent localStorage fallback
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('ap_moda_products');
    try {
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return INITIAL_PRODUCTS;
  });

  // State for online orders synced across delivery components
  const [onlineOrders, setOnlineOrders] = useState(() => {
    const saved = localStorage.getItem('ap_moda_online_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // State for checkouts (abandoned carts) synced
  const [checkouts, setCheckouts] = useState<any[]>(() => {
    const saved = localStorage.getItem('ap_moda_checkouts');
    return saved ? JSON.parse(saved) : [];
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('ap_moda_clients');
    try {
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return INITIAL_CLIENTS;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('ap_moda_sales');
    try {
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return INITIAL_SALES;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('ap_moda_transactions');
    try {
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return INITIAL_TRANSACTIONS;
  });

  // State for notification dropdown
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Previous state refs for delta comparisons
  const prevProductsRef = useRef<Product[]>(products);
  const prevClientsRef = useRef<Client[]>(clients);
  const prevSalesRef = useRef<Sale[]>(sales);
  const prevTransactionsRef = useRef<Transaction[]>(transactions);
  const prevOnlineOrdersRef = useRef<any[]>(onlineOrders);
  const prevCheckoutsRef = useRef<any[]>(checkouts);
  const prevTeamMembersRef = useRef<any[]>(teamMembers);

  // Sync to localStorage & automatically track local mutations as dirty
  useEffect(() => {
    localStorage.setItem('ap_moda_products', JSON.stringify(products));
    if (!isUpdatingFromSyncRef.current) {
      const prevList = prevProductsRef.current || [];
      const prevMap = new Map(prevList.map(p => [p.id, p]));
      const dirtyIds = getDirtyIds('ap_dirty_products');
      let changed = false;

      for (const p of products) {
        const prevP = prevMap.get(p.id);
        if (!prevP || JSON.stringify(prevP) !== JSON.stringify(p)) {
          if (!dirtyIds.includes(p.id)) {
            dirtyIds.push(p.id);
            changed = true;
          }
        }
      }
      if (changed) {
        saveDirtyIds('ap_dirty_products', dirtyIds);
        setTimeout(() => { if (performSyncRef.current) performSyncRef.current(); }, 150);
      }
    }
    prevProductsRef.current = products;
  }, [products, getDirtyIds, saveDirtyIds]);

  useEffect(() => {
    localStorage.setItem('ap_moda_clients', JSON.stringify(clients));
    if (!isUpdatingFromSyncRef.current) {
      const prevList = prevClientsRef.current || [];
      const prevMap = new Map(prevList.map(c => [c.id, c]));
      const dirtyIds = getDirtyIds('ap_dirty_clients');
      let changed = false;

      for (const c of clients) {
        const prevC = prevMap.get(c.id);
        if (!prevC || JSON.stringify(prevC) !== JSON.stringify(c)) {
          if (!dirtyIds.includes(c.id)) {
            dirtyIds.push(c.id);
            changed = true;
          }
        }
      }
      if (changed) {
        saveDirtyIds('ap_dirty_clients', dirtyIds);
        setTimeout(() => { if (performSyncRef.current) performSyncRef.current(); }, 150);
      }
    }
    prevClientsRef.current = clients;
  }, [clients, getDirtyIds, saveDirtyIds]);

  useEffect(() => {
    localStorage.setItem('ap_moda_sales', JSON.stringify(sales));
    if (!isUpdatingFromSyncRef.current) {
      const prevList = prevSalesRef.current || [];
      const prevMap = new Map(prevList.map(s => [s.id, s]));
      const dirtyIds = getDirtyIds('ap_dirty_sales');
      let changed = false;

      for (const s of sales) {
        const prevS = prevMap.get(s.id);
        if (!prevS || JSON.stringify(prevS) !== JSON.stringify(s)) {
          if (!dirtyIds.includes(s.id)) {
            dirtyIds.push(s.id);
            changed = true;
          }
        }
      }
      if (changed) {
        saveDirtyIds('ap_dirty_sales', dirtyIds);
        setTimeout(() => { if (performSyncRef.current) performSyncRef.current(); }, 150);
      }
    }
    prevSalesRef.current = sales;
  }, [sales, getDirtyIds, saveDirtyIds]);

  useEffect(() => {
    localStorage.setItem('ap_moda_transactions', JSON.stringify(transactions));
    if (!isUpdatingFromSyncRef.current) {
      const prevList = prevTransactionsRef.current || [];
      const prevMap = new Map(prevList.map(t => [t.id, t]));
      const dirtyIds = getDirtyIds('ap_dirty_transactions');
      let changed = false;

      for (const t of transactions) {
        const prevT = prevMap.get(t.id);
        if (!prevT || JSON.stringify(prevT) !== JSON.stringify(t)) {
          if (!dirtyIds.includes(t.id)) {
            dirtyIds.push(t.id);
            changed = true;
          }
        }
      }
      if (changed) {
        saveDirtyIds('ap_dirty_transactions', dirtyIds);
        setTimeout(() => { if (performSyncRef.current) performSyncRef.current(); }, 150);
      }
    }
    prevTransactionsRef.current = transactions;
  }, [transactions, getDirtyIds, saveDirtyIds]);

  useEffect(() => {
    localStorage.setItem('ap_moda_online_orders', JSON.stringify(onlineOrders));
    if (!isUpdatingFromSyncRef.current) {
      const prevList = prevOnlineOrdersRef.current || [];
      const prevMap = new Map(prevList.map(o => [o.id, o]));
      const dirtyIds = getDirtyIds('ap_dirty_online_orders');
      let changed = false;

      for (const o of onlineOrders) {
        const prevO = prevMap.get(o.id);
        if (!prevO || JSON.stringify(prevO) !== JSON.stringify(o)) {
          if (!dirtyIds.includes(o.id)) {
            dirtyIds.push(o.id);
            changed = true;
          }
        }
      }
      if (changed) {
        saveDirtyIds('ap_dirty_online_orders', dirtyIds);
        setTimeout(() => { if (performSyncRef.current) performSyncRef.current(); }, 150);
      }
    }
    prevOnlineOrdersRef.current = onlineOrders;
  }, [onlineOrders, getDirtyIds, saveDirtyIds]);

  useEffect(() => {
    localStorage.setItem('ap_moda_checkouts', JSON.stringify(checkouts));
    if (!isUpdatingFromSyncRef.current) {
      const prevList = prevCheckoutsRef.current || [];
      const prevMap = new Map(prevList.map(c => [c.id, c]));
      const dirtyIds = getDirtyIds('ap_dirty_checkouts');
      let changed = false;

      for (const c of checkouts) {
        const prevC = prevMap.get(c.id);
        if (!prevC || JSON.stringify(prevC) !== JSON.stringify(c)) {
          if (!dirtyIds.includes(c.id)) {
            dirtyIds.push(c.id);
            changed = true;
          }
        }
      }
      if (changed) {
        saveDirtyIds('ap_dirty_checkouts', dirtyIds);
        setTimeout(() => { if (performSyncRef.current) performSyncRef.current(); }, 150);
      }
    }
    prevCheckoutsRef.current = checkouts;
  }, [checkouts, getDirtyIds, saveDirtyIds]);

  useEffect(() => {
    if (!isUpdatingFromSyncRef.current) {
      const prevList = prevTeamMembersRef.current || [];
      const prevMap = new Map(prevList.map(m => [m.id, m]));
      const dirtyIds = getDirtyIds('ap_dirty_team_members');
      let changed = false;

      for (const m of teamMembers || []) {
        const prevM = prevMap.get(m.id);
        if (!prevM || JSON.stringify(prevM) !== JSON.stringify(m)) {
          if (!dirtyIds.includes(m.id)) {
            dirtyIds.push(m.id);
            changed = true;
          }
        }
      }
      if (changed) {
        saveDirtyIds('ap_dirty_team_members', dirtyIds);
        setTimeout(() => { if (performSyncRef.current) performSyncRef.current(); }, 150);
      }
    }
    prevTeamMembersRef.current = teamMembers;
  }, [teamMembers, getDirtyIds, saveDirtyIds]);

  // Realiza um download completo, sequencial e forçado de todas as tabelas logo no login para evitar dados "picotados" ou atrasados
  const runFullSynchronousSetup = useCallback(async (user: any) => {
    if (!user) return;
    setIsCloudSyncingOnLogin(true);
    setSyncProgress({
      status: 'running',
      step: 'Conectando...',
      details: 'Conectando ao banco de dados seguro da AP Moda Fitness na nuvem...',
      stepsCompleted: []
    });

    isSyncingRef.current = true; // Lock standard background delta computations while writing initial database copies
    isUpdatingFromSyncRef.current = true;

    try {
      // 1. Acorda / testa o banco de dados
      await pingFirebaseOnLogin(user.name, user.role);

      // BEFORE DOWNLOADING: Sync any local changes (dirty items) that are pending to Firebase!
      // This protects local data from being overwritten on page reload/re-login.
      const config = getFirebaseConfig();
      if (config && !systemOffline) {
        // A. Team members
        const dirtyMembers = getDirtyIds('ap_dirty_team_members');
        if (dirtyMembers.length > 0) {
          const toUpload = lastTeamMembersRef.current.filter((m: any) => dirtyMembers.includes(m.id));
          if (toUpload.length > 0) {
            await syncBulkTeamMembersToFirebase(toUpload);
          }
        }

        // B. Products
        const dirtyProducts = getDirtyIds('ap_dirty_products');
        if (dirtyProducts.length > 0) {
          const toUpload = lastProductsRef.current.filter((p: any) => dirtyProducts.includes(p.id));
          if (toUpload.length > 0) {
            await syncBulkProductsToFirebase(toUpload);
          }
        }

        // C. Clients
        const dirtyClients = getDirtyIds('ap_dirty_clients');
        if (dirtyClients.length > 0) {
          const toUpload = lastClientsRef.current.filter((c: any) => dirtyClients.includes(c.id));
          if (toUpload.length > 0) {
            await syncBulkClientsToFirebase(toUpload);
          }
        }

        // D. Sales
        const dirtySales = getDirtyIds('ap_dirty_sales');
        if (dirtySales.length > 0) {
          const toUpload = lastSalesRef.current.filter((s: any) => dirtySales.includes(s.id));
          if (toUpload.length > 0) {
            await syncBulkSalesToFirebase(toUpload);
          }
        }

        // E. Transactions
        const dirtyTransactions = getDirtyIds('ap_dirty_transactions');
        if (dirtyTransactions.length > 0) {
          const toUpload = lastTransactionsRef.current.filter((t: any) => dirtyTransactions.includes(t.id));
          if (toUpload.length > 0) {
            await syncBulkTransactionsToFirebase(toUpload);
          }
        }

        // F. Online Orders
        const dirtyOrders = getDirtyIds('ap_dirty_online_orders');
        if (dirtyOrders.length > 0) {
          const toUpload = lastOnlineOrdersRef.current.filter((o: any) => dirtyOrders.includes(o.id));
          if (toUpload.length > 0) {
            await syncBulkOnlineOrdersToFirebase(toUpload);
          }
        }

        // G. Checkouts
        const dirtyCheckoutsList = getDirtyIds('ap_dirty_checkouts');
        if (dirtyCheckoutsList.length > 0) {
          const toUpload = lastCheckoutsRef.current.filter((c: any) => dirtyCheckoutsList.includes(c.id));
          if (toUpload.length > 0) {
            await syncBulkCheckoutsToFirebase(toUpload);
          }
        }
      }

      setSyncProgress(prev => ({
        ...prev,
        step: 'Sincronizando Login...',
        details: 'Validando acessos e baixando logins da equipe comercial...',
        stepsCompleted: [...prev.stepsCompleted, 'Conectando...']
      }));

      // Check if database has been seeded with standard demo data before
      let isSeeded = localStorage.getItem('ap_system_seeded') === 'true';
      try {
        const dbConfigs = await fetchSystemConfigsFromFirebase();
        if (dbConfigs && Array.isArray(dbConfigs)) {
          const hasSeededKey = dbConfigs.some((config: any) => config.key === 'ap_system_seeded' && config.value === 'true');
          if (hasSeededKey) {
            isSeeded = true;
            localStorage.setItem('ap_system_seeded', 'true');
          }
        }
      } catch (e) {
        console.warn('[Sync] Failed to verify ap_system_seeded config:', e);
      }

      // 2. Sincroniza logins da Equipe
      const dbMembers = await fetchTeamMembersFromFirebase();
      if (dbMembers && dbMembers.length > 0) {
        setTeamMembers(dbMembers);
        localStorage.setItem('ap_moda_team_users', JSON.stringify(dbMembers));
      } else {
        // Banco vazio? Faz o upload dos logins locais atuais
        const localMembers = lastTeamMembersRef.current && lastTeamMembersRef.current.length > 0 ? lastTeamMembersRef.current : teamMembers;
        if (localMembers && localMembers.length > 0) {
          console.log('[Firebase Sync] Semeando equipe/logins locais no Firebase vazio:', localMembers.length);
          await syncBulkTeamMembersToFirebase(localMembers);
        }
      }

      setSyncProgress(prev => ({
        ...prev,
        step: 'Sincronizando Produtos...',
        details: 'Baixando catálogo completo de mercadorias, tamanhos, cores e estoque...',
        stepsCompleted: [...prev.stepsCompleted, 'Sincronizando Login...']
      }));

      // 3. Sincroniza Catálogo de Produtos
      const dbProducts = await fetchProductsFromFirebase();
      if (dbProducts && dbProducts.length > 0) {
        setProducts(dbProducts);
        localStorage.setItem('ap_moda_products', JSON.stringify(dbProducts));
        if (!isSeeded) {
          isSeeded = true;
          localStorage.setItem('ap_system_seeded', 'true');
          await pushSystemConfigToFirebase('ap_system_seeded', 'true');
        }
      } else {
        if (isSeeded) {
          setProducts([]);
          localStorage.setItem('ap_moda_products', JSON.stringify([]));
        } else {
          // Firebase está vazio de produtos! Vamos proteger os dados locais e semear
          const localProducts = lastProductsRef.current && lastProductsRef.current.length > 0 ? lastProductsRef.current : products;
          if (localProducts && localProducts.length > 0) {
            console.log('[Firebase Sync] Enviando seus produtos locais da tela para o Firebase vazio:', localProducts.length);
            await syncBulkProductsToFirebase(localProducts);
          } else {
            console.log('[Firebase Sync] Semeando catálogo de Moda Fitness padrão (INITIAL_PRODUCTS) no Firebase vazio:', INITIAL_PRODUCTS.length);
            await syncBulkProductsToFirebase(INITIAL_PRODUCTS);
            setProducts(INITIAL_PRODUCTS);
            localStorage.setItem('ap_moda_products', JSON.stringify(INITIAL_PRODUCTS));
          }
        }
      }

      setSyncProgress(prev => ({
        ...prev,
        step: 'Sincronizando Clientes...',
        details: 'Carregando lista completa do CRM, contatos e saldos de cashback...',
        stepsCompleted: [...prev.stepsCompleted, 'Sincronizando Produtos...']
      }));

      // 4. Sincroniza Clientes
      const dbClients = await fetchClientsFromFirebase();
      if (dbClients && dbClients.length > 0) {
        setClients(dbClients);
        localStorage.setItem('ap_moda_clients', JSON.stringify(dbClients));
        if (!isSeeded) {
          isSeeded = true;
          localStorage.setItem('ap_system_seeded', 'true');
          await pushSystemConfigToFirebase('ap_system_seeded', 'true');
        }
      } else {
        if (isSeeded) {
          setClients([]);
          localStorage.setItem('ap_moda_clients', JSON.stringify([]));
        } else {
          const localClients = lastClientsRef.current && lastClientsRef.current.length > 0 ? lastClientsRef.current : clients;
          if (localClients && localClients.length > 0) {
            console.log('[Firebase Sync] Enviando seus clientes locais da tela para o Firebase vazio:', localClients.length);
            await syncBulkClientsToFirebase(localClients);
          } else {
            console.log('[Firebase Sync] Semeando lista de clientes (INITIAL_CLIENTS) no Firebase vazio:', INITIAL_CLIENTS.length);
            await syncBulkClientsToFirebase(INITIAL_CLIENTS);
            setClients(INITIAL_CLIENTS);
            localStorage.setItem('ap_moda_clients', JSON.stringify(INITIAL_CLIENTS));
          }
        }
      }

      setSyncProgress(prev => ({
        ...prev,
        step: 'Sincronizando Histórico de Vendas...',
        details: 'Sincronizando histórico de vendas realizadas em todos os caixas...',
        stepsCompleted: [...prev.stepsCompleted, 'Sincronizando Clientes...']
      }));

      // 5. Sincroniza Vendas
      const dbSales = await fetchSalesFromFirebase();
      if (dbSales && dbSales.length > 0) {
        setSales(dbSales);
        localStorage.setItem('ap_moda_sales', JSON.stringify(dbSales));
        if (!isSeeded) {
          isSeeded = true;
          localStorage.setItem('ap_system_seeded', 'true');
          await pushSystemConfigToFirebase('ap_system_seeded', 'true');
        }
      } else {
        if (isSeeded) {
          setSales([]);
          localStorage.setItem('ap_moda_sales', JSON.stringify([]));
        } else {
          const localSales = lastSalesRef.current && lastSalesRef.current.length > 0 ? lastSalesRef.current : sales;
          if (localSales && localSales.length > 0) {
            console.log('[Firebase Sync] Enviando suas vendas locais da tela para o Firebase vazio:', localSales.length);
            await syncBulkSalesToFirebase(localSales);
          } else {
            console.log('[Firebase Sync] Semeando histórico de vendas (INITIAL_SALES) no Firebase vazio:', INITIAL_SALES.length);
            await syncBulkSalesToFirebase(INITIAL_SALES);
            setSales(INITIAL_SALES);
            localStorage.setItem('ap_moda_sales', JSON.stringify(INITIAL_SALES));
          }
        }
      }

      setSyncProgress(prev => ({
        ...prev,
        step: 'Sincronizando Financeiro...',
        details: 'Baixando os lançamentos de caixa, sangrias, aportes e despesas...',
        stepsCompleted: [...prev.stepsCompleted, 'Sincronizando Histórico de Vendas...']
      }));

      // 6. Sincroniza Lançamentos Financeiros
      const dbTransactions = await fetchTransactionsFromFirebase();
      if (dbTransactions && dbTransactions.length > 0) {
        setTransactions(dbTransactions);
        localStorage.setItem('ap_moda_transactions', JSON.stringify(dbTransactions));
        if (!isSeeded) {
          isSeeded = true;
          localStorage.setItem('ap_system_seeded', 'true');
          await pushSystemConfigToFirebase('ap_system_seeded', 'true');
        }
      } else {
        if (isSeeded) {
          setTransactions([]);
          localStorage.setItem('ap_moda_transactions', JSON.stringify([]));
        } else {
          const localTxs = lastTransactionsRef.current && lastTransactionsRef.current.length > 0 ? lastTransactionsRef.current : transactions;
          if (localTxs && localTxs.length > 0) {
            console.log('[Firebase Sync] Enviando fluxo de caixa local para o Firebase vazio:', localTxs.length);
            await syncBulkTransactionsToFirebase(localTxs);
          } else {
            console.log('[Firebase Sync] Semeando fluxo de caixa padrão (INITIAL_TRANSACTIONS) no Firebase vazio:', INITIAL_TRANSACTIONS.length);
            await syncBulkTransactionsToFirebase(INITIAL_TRANSACTIONS);
            setTransactions(INITIAL_TRANSACTIONS);
            localStorage.setItem('ap_moda_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
          }
        }
      }

      if (!isSeeded) {
        localStorage.setItem('ap_system_seeded', 'true');
        await pushSystemConfigToFirebase('ap_system_seeded', 'true');
      }

      setSyncProgress(prev => ({
        ...prev,
        step: 'Sincronizando Pedidos Online...',
        details: 'Carregando sacolas de compras pendentes na vitrine de atacado/varejo...',
        stepsCompleted: [...prev.stepsCompleted, 'Sincronizando Financeiro...']
      }));

      // 7. Sincroniza Pedidos Online
      const dbOrders = await fetchOnlineOrdersFromFirebase();
      if (dbOrders && dbOrders.length > 0) {
        setOnlineOrders(dbOrders);
        localStorage.setItem('ap_moda_online_orders', JSON.stringify(dbOrders));
      } else {
        const localOrders = lastOnlineOrdersRef.current && lastOnlineOrdersRef.current.length > 0 ? lastOnlineOrdersRef.current : onlineOrders;
        if (localOrders && localOrders.length > 0) {
          console.log('[Firebase Sync] Enviando sacolas online locais para o Firebase vazio:', localOrders.length);
          await syncBulkOnlineOrdersToFirebase(localOrders);
        }
      }

      setSyncProgress(prev => ({
        ...prev,
        step: 'Sincronizando Carrinhos Abandonados...',
        details: 'Acompanhando checkouts iniciados não concluídos pela inteligência artificial...',
        stepsCompleted: [...prev.stepsCompleted, 'Sincronizando Pedidos Online...']
      }));

      // 7.5 Sincroniza Checkouts
      const dbCheckouts = await fetchCheckoutsFromFirebase();
      if (dbCheckouts) {
        setCheckouts(dbCheckouts);
        localStorage.setItem('ap_moda_checkouts', JSON.stringify(dbCheckouts));
      }

      setSyncProgress(prev => ({
        ...prev,
        step: 'Sincronizando Configurações Globais...',
        details: 'Sincronizando dados institucionais, banners do carrossel da vitrine e taxas de juros...',
        stepsCompleted: [...prev.stepsCompleted, 'Sincronizando Carrinhos Abandonados...']
      }));

      // 8. Sincroniza Configurações Globais
      await syncSystemConfigsWithFirebase();

      // Zera chaves de modificação local temporária (sujeira) para evitar re-uploads redundantes
      localStorage.setItem('ap_dirty_team_members', JSON.stringify([]));
      localStorage.setItem('ap_dirty_products', JSON.stringify([]));
      localStorage.setItem('ap_dirty_clients', JSON.stringify([]));
      localStorage.setItem('ap_dirty_sales', JSON.stringify([]));
      localStorage.setItem('ap_dirty_transactions', JSON.stringify([]));
      localStorage.setItem('ap_dirty_online_orders', JSON.stringify([]));
      localStorage.setItem('ap_dirty_checkouts', JSON.stringify([]));

      setSyncProgress(prev => ({
        ...prev,
        step: 'Pronto!',
        details: 'Aparelho pareado com sucesso! Todos os dados estão atualizados.',
        stepsCompleted: [...prev.stepsCompleted, 'Sincronizando Configurações Globais...']
      }));

      setTimeout(() => {
        setIsCloudSyncingOnLogin(false);
        setSyncProgress({ status: 'idle', step: '', details: '', stepsCompleted: [] });
        
        // Alerta de Bem-vinda
        setNotifications(prev => [
          {
            id: Date.now() + 9993,
            title: `Seja Bem-vindo(a), ${user.name}! 🌸`,
            detail: `Seu aparelho foi sincronizado com sucesso. Nível de acesso comercial: [${user.role}].`,
            read: false,
            type: 'goal' as const
          },
          ...prev
        ]);
      }, 1000);

    } catch (err: any) {
      console.warn('Falha severa na sincronização preliminar de credenciais:', err);
      setSyncProgress(prev => ({
        ...prev,
        status: 'error',
        step: 'X',
        details: 'Ocorreu um erro ao carregar as informações na nuvem. Verifique sua conexão e tente novamente.'
      }));
    } finally {
      isSyncingRef.current = false;
      isUpdatingFromSyncRef.current = false;
    }
  }, []);

  // Dynamic refs to always hold fresh copies for syncing interval (strictly avoids infinite component rendering loops in React)
  const lastProductsRef = useRef(products);
  const lastClientsRef = useRef(clients);
  const lastSalesRef = useRef(sales);
  const lastTransactionsRef = useRef(transactions);
  const lastOnlineOrdersRef = useRef(onlineOrders);
  const lastCheckoutsRef = useRef(checkouts);
  const lastTeamMembersRef = useRef(teamMembers);
  const currentUserRef = useRef(currentUser);
  const isCustomerViewRef = useRef(isCustomerView);
  const runFullSynchronousSetupRef = useRef<any>(null);

  useEffect(() => { lastProductsRef.current = products; }, [products]);
  useEffect(() => { lastClientsRef.current = clients; }, [clients]);
  useEffect(() => { lastSalesRef.current = sales; }, [sales]);
  useEffect(() => { lastTransactionsRef.current = transactions; }, [transactions]);
  useEffect(() => { lastOnlineOrdersRef.current = onlineOrders; }, [onlineOrders]);
  useEffect(() => { lastCheckoutsRef.current = checkouts; }, [checkouts]);
  useEffect(() => { lastTeamMembersRef.current = teamMembers; }, [teamMembers]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { isCustomerViewRef.current = isCustomerView; }, [isCustomerView]);
  useEffect(() => { runFullSynchronousSetupRef.current = runFullSynchronousSetup; }, [runFullSynchronousSetup]);

  // Limpar cache de dados estáticos e mockados para iniciar completamente vazio em todas as tabelas
  useEffect(() => {
    const isCleaned = localStorage.getItem('ap_moda_global_clean_v4');
    if (!isCleaned) {
      localStorage.removeItem('ap_moda_clients');
      localStorage.removeItem('ap_moda_sales');
      localStorage.removeItem('ap_moda_products');
      localStorage.removeItem('ap_moda_transactions');
      localStorage.removeItem('ap_moda_opportunities');
      localStorage.removeItem('ap_moda_followups');
      localStorage.removeItem('ap_moda_online_orders');
      localStorage.removeItem('ap_moda_checkouts');
      localStorage.removeItem('ap_moda_partners');
      localStorage.removeItem('ap_moda_trocas');
      localStorage.removeItem('ap_moda_motoboys_detailed');
      localStorage.setItem('ap_moda_global_clean_v4', 'true');
      setClients(INITIAL_CLIENTS);
      setSales(INITIAL_SALES);
      setProducts(INITIAL_PRODUCTS);
      setTransactions(INITIAL_TRANSACTIONS);
      setOnlineOrders([]);
      setCheckouts([]);
      
      localStorage.setItem('ap_moda_products', JSON.stringify(INITIAL_PRODUCTS));
      localStorage.setItem('ap_moda_clients', JSON.stringify(INITIAL_CLIENTS));
      localStorage.setItem('ap_moda_sales', JSON.stringify(INITIAL_SALES));
      localStorage.setItem('ap_moda_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
    }
  }, []);

  // Carregar usuários e credenciais do Firebase na inicialização, se houver
  useEffect(() => {
    async function initFirebaseSync() {
      // Primeiro sincroniza as credenciais do banco com o servidor central, garantindo que TODOS usem o mesmo banco de dados
      await initializeFirebaseConfig();

      const config = getFirebaseConfig();
      if (config) {
        console.log('Firebase configurado! Baixando logins e senhas em tempo real...');
        try {
          const dbMembers = await fetchTeamMembersFromFirebase();
          if (dbMembers && dbMembers.length > 0) {
            console.log(`Sucesso! ${dbMembers.length} logins baixados do Firebase.`);
            setTeamMembers(dbMembers);
          } else if (dbMembers === null) {
            console.warn('Tabela "ap_team_members" no Firebase não foi encontrada ou está vazia.');
          }
        } catch (err) {
          console.warn('Erro de conexão Firebase na inicialização:', err);
        }

        // Se houver um usuário ativo na inicialização, faz o pull profundo imediatamente
        const savedUser = localStorage.getItem('ap_moda_current_user');
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            if (parsed) {
              runFullSynchronousSetup(parsed);
            }
          } catch (e) {}
        } else {
          // Visão pública do catálogo / visitante: Puxa o catálogo do Firebase para não deixar o site vazio
          try {
            const dbProducts = await fetchProductsFromFirebase();
            if (dbProducts && dbProducts.length > 0) {
              setProducts(dbProducts);
              localStorage.setItem('ap_moda_products', JSON.stringify(dbProducts));
              console.log('[Public Catalog Init] Produtos carregados com sucesso do Firebase para visitantes:', dbProducts.length);
            } else {
              console.log('[Public Catalog Init] Banco de dados vazio ou sem conexão. Carregando catálogo padrão INITIAL_PRODUCTS.');
              setProducts(INITIAL_PRODUCTS);
              localStorage.setItem('ap_moda_products', JSON.stringify(INITIAL_PRODUCTS));
              try {
                await syncBulkProductsToFirebase(INITIAL_PRODUCTS);
              } catch (errSeed) {}
            }
          } catch (err) {
            console.warn('[Public Catalog Init] Falha ao carregar produtos na inicialização do visitante:', err);
            setProducts(INITIAL_PRODUCTS);
            localStorage.setItem('ap_moda_products', JSON.stringify(INITIAL_PRODUCTS));
          }
        }
      }
    }
    initFirebaseSync();
  }, [runFullSynchronousSetup]);

  // Listen to table missing warnings from Firebase schemas and display advice
  useEffect(() => {
    const handleSchemaWarning = (e: any) => {
      const msgText = e.detail?.message || '';
      setNotifications(prev => {
        // Prevent duplicate notices
        if (prev.some(n => n.detail === msgText)) return prev;
        return [
          {
            id: Date.now() + Math.random(),
            title: 'Configurar Tabelas no Firebase ⚠️',
            detail: msgText,
            read: false,
            type: 'stock'
          },
          ...prev
        ];
      });
    };
    window.addEventListener('firebase-schema-warning', handleSchemaWarning);
    return () => window.removeEventListener('firebase-schema-warning', handleSchemaWarning);
  }, []);

  // Calculations for sidebar badge alerts
  const lowStockCount = products.filter(p => p.stock < p.minStock).length;

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // Estado de Conexão Offline Seguro & Simulação
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [simulateOffline, setSimulateOffline] = useState(false);
  const [offlinePendingSync, setOfflinePendingSync] = useState<{ type: 'sale_completed' | 'stock_alert'; data: any }[]>(() => {
    const saved = localStorage.getItem('ap_moda_pending_sync');
    return saved ? JSON.parse(saved) : [];
  });

  const systemOffline = !isOnline || simulateOffline;

  useEffect(() => {
    localStorage.setItem('ap_moda_pending_sync', JSON.stringify(offlinePendingSync));
  }, [offlinePendingSync]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Intercepting and immediate-upload list wrappers for children components
  const handleUpdateClientsList = useCallback(async (updatedList: Client[] | ((prev: Client[]) => Client[])) => {
    setClients(prev => {
      const newList = typeof updatedList === 'function' ? updatedList(prev) : updatedList;
      const prevMap = new Map(prev.map(c => [c.id, c]));
      const changedClients = newList.filter(c => {
        const prevC = prevMap.get(c.id);
        return !prevC || JSON.stringify(prevC) !== JSON.stringify(c);
      });

      if (changedClients.length > 0) {
        const config = getFirebaseConfig();
        if (config && !systemOffline) {
          syncBulkClientsToFirebase(changedClients).then(success => {
            if (success) {
              const remaining = getDirtyIds('ap_dirty_clients').filter(id => !changedClients.some(cc => cc.id === id));
              saveDirtyIds('ap_dirty_clients', remaining);
            }
          }).catch(e => console.warn('Immediate clients update sync failed:', e));
        }
      }
      return newList;
    });
  }, [systemOffline, getDirtyIds, saveDirtyIds]);

  const handleUpdateProductsList = useCallback(async (updatedList: Product[] | ((prev: Product[]) => Product[])) => {
    setProducts(prev => {
      const newList = typeof updatedList === 'function' ? updatedList(prev) : updatedList;
      const prevMap = new Map(prev.map(p => [p.id, p]));
      const changedProducts = newList.filter(p => {
        const prevP = prevMap.get(p.id);
        return !prevP || JSON.stringify(prevP) !== JSON.stringify(p);
      });

      if (changedProducts.length > 0) {
        const config = getFirebaseConfig();
        if (config && !systemOffline) {
          syncBulkProductsToFirebase(changedProducts).then(success => {
            if (success) {
              const remaining = getDirtyIds('ap_dirty_products').filter(id => !changedProducts.some(cp => cp.id === id));
              saveDirtyIds('ap_dirty_products', remaining);
            }
          }).catch(e => console.warn('Immediate products update sync failed:', e));
        }
      }
      return newList;
    });
  }, [systemOffline, getDirtyIds, saveDirtyIds]);

  const handleUpdateSalesList = useCallback(async (updatedList: Sale[] | ((prev: Sale[]) => Sale[])) => {
    setSales(prev => {
      const newList = typeof updatedList === 'function' ? updatedList(prev) : updatedList;
      const prevMap = new Map(prev.map(s => [s.id, s]));
      const changedSales = newList.filter(s => {
        const prevS = prevMap.get(s.id);
        return !prevS || JSON.stringify(prevS) !== JSON.stringify(s);
      });

      if (changedSales.length > 0) {
        const config = getFirebaseConfig();
        if (config && !systemOffline) {
          syncBulkSalesToFirebase(changedSales).then(success => {
            if (success) {
              const remaining = getDirtyIds('ap_dirty_sales').filter(id => !changedSales.some(cs => cs.id === id));
              saveDirtyIds('ap_dirty_sales', remaining);
            }
          }).catch(e => console.warn('Immediate sales update sync failed:', e));
        }
      }
      return newList;
    });
  }, [systemOffline, getDirtyIds, saveDirtyIds]);

  const handleUpdateTransactionsList = useCallback(async (updatedList: Transaction[] | ((prev: Transaction[]) => Transaction[])) => {
    setTransactions(prev => {
      const newList = typeof updatedList === 'function' ? updatedList(prev) : updatedList;
      const prevMap = new Map(prev.map(t => [t.id, t]));
      const changedTransactions = newList.filter(t => {
        const prevT = prevMap.get(t.id);
        return !prevT || JSON.stringify(prevT) !== JSON.stringify(t);
      });

      if (changedTransactions.length > 0) {
        const config = getFirebaseConfig();
        if (config && !systemOffline) {
          syncBulkTransactionsToFirebase(changedTransactions).then(success => {
            if (success) {
              const remaining = getDirtyIds('ap_dirty_transactions').filter(id => !changedTransactions.some(ct => ct.id === id));
              saveDirtyIds('ap_dirty_transactions', remaining);
            }
          }).catch(e => console.warn('Immediate transactions update sync failed:', e));
        }
      }
      return newList;
    });
  }, [systemOffline, getDirtyIds, saveDirtyIds]);

  // Sincronização automática bilateral de TODO o ecossistema AP Moda Fitness com o Firebase
  const performSync = useCallback(async (isManual = false) => {
    if (isSyncingRef.current && !isManual) {
      console.log('[Firebase Sync] Sincronização concorrente ignorada para evitar colisões.');
      return;
    }

    if (systemOffline) {
      console.log('[Firebase Sync] Sistema offline. Sincronização suspensa.');
      if (isManual) {
        alert("Você está offline no momento. Ative a internet para realizar a sincronização na nuvem.");
      }
      return;
    }

    const prevUrl = localStorage.getItem('ap_firebase_url');
    const prevKey = localStorage.getItem('ap_firebase_key');

    // Sincroniza as credenciais de banco com o servidor central antes de qualquer sync, garantindo que TODOS usem o mesmo banco de dados se houver alteração em tempo real!
    await initializeFirebaseConfig();

    const config = getFirebaseConfig();
    if (!config) return;

    // Se houve alteração de banco no outro aparelho, recarrega os dados imediatamente
    const newUrl = localStorage.getItem('ap_firebase_url');
    const newKey = localStorage.getItem('ap_firebase_key');
    if (prevUrl !== newUrl || prevKey !== newKey) {
      console.log('[Firebase Sync] Detectado alteração nas credenciais em nuvem unificadas pelo servidor central!');
      // Reseta as flags de fila dirty locais para que não misturem dados de instâncias diferentes
      saveDirtyIds('ap_dirty_products', []);
      saveDirtyIds('ap_dirty_clients', []);
      saveDirtyIds('ap_dirty_sales', []);
      saveDirtyIds('ap_dirty_transactions', []);
      saveDirtyIds('ap_dirty_online_orders', []);
      saveDirtyIds('ap_dirty_team_members', []);

      if (currentUserRef.current) {
        // Se houver usuário ativo, força re-sincronização de tudo do novo banco
        await runFullSynchronousSetupRef.current(currentUserRef.current);
        return;
      } else if (isCustomerViewRef.current) {
        // Se for visão de cliente externo, puxa e carrega catálogo de produtos em massa do novo banco
        const dbProducts = await fetchProductsFromFirebase();
        if (dbProducts) {
          setProducts(dbProducts);
          localStorage.setItem('ap_moda_products', JSON.stringify(dbProducts));
        }
        return;
      }
    }

    if (isManual) {
      setIsSyncingNow(true);
    }

    // Set syncing flag so local change listener useEffects ignore these updates
    isSyncingRef.current = true;
    isUpdatingFromSyncRef.current = true;

    try {
      console.log('[Firebase Sync] Sincronizando dados bilateralmente com a nuvem Firebase...');

      let localStateModified = false;
      let remoteStateModified = false;

      // 1. Sincronização da Equipe (Logins e Cargos)
      const dbMembers = await fetchTeamMembersFromFirebase();
      if (dbMembers) {
        const dirtyMembers = getDirtyIds('ap_dirty_team_members');
        const currentMembers = lastTeamMembersRef.current || [];
        const localMap = new Map(currentMembers.map(m => [m.id, m]));
        const dbMap = new Map(dbMembers.map(m => [m.id, m]));
        let localModified = false;
        let remoteModified = false;
        const merged = [...currentMembers];

        for (const dbM of dbMembers) {
          const localM = localMap.get(dbM.id);
          if (!localM) {
            merged.push(dbM);
            localModified = true;
          } else if (!dirtyMembers.includes(dbM.id)) {
            if (JSON.stringify(localM) !== JSON.stringify(dbM)) {
              if (dbM.login === 'admin' && dbM.role === 'Admin') continue;
              const idx = merged.findIndex(x => x.id === dbM.id);
              if (idx >= 0) merged[idx] = dbM;
              localModified = true;
            }
          }
        }

        const toUpload = currentMembers.filter(lm => dirtyMembers.includes(lm.id));
        if (toUpload.length > 0) {
          const success = await syncBulkTeamMembersToFirebase(toUpload);
          if (success) {
            const remaining = getDirtyIds('ap_dirty_team_members').filter(id => !toUpload.some(u => u.id === id));
            saveDirtyIds('ap_dirty_team_members', remaining);
            remoteModified = true;
          }
        }

        if (localModified) {
          setTeamMembers(merged);
          localStateModified = true;
        }
        if (remoteModified || localModified) {
          remoteStateModified = true;
        }
      }

      // 2. Sincronização do Catálogo de Produtos da Boutique
      const dbProducts = await fetchProductsFromFirebase();
      if (dbProducts) {
        const dirtyProducts = getDirtyIds('ap_dirty_products');
        const currentProducts = lastProductsRef.current;
        const localMap = new Map(currentProducts.map(p => [p.id, p]));
        const dbMap = new Map(dbProducts.map(p => [p.id, p]));
        let localModified = false;
        let remoteModified = false;
        const merged = [...currentProducts];

        for (const dbP of dbProducts) {
          const localP = localMap.get(dbP.id);
          if (!localP) {
            merged.push(dbP);
            localModified = true;
          } else if (!dirtyProducts.includes(dbP.id)) {
            if (JSON.stringify(localP) !== JSON.stringify(dbP)) {
              const idx = merged.findIndex(x => x.id === dbP.id);
              if (idx >= 0) merged[idx] = dbP;
              localModified = true;
            }
          }
        }

        const toUpload = currentProducts.filter(lp => dirtyProducts.includes(lp.id));
        if (toUpload.length > 0) {
          const success = await syncBulkProductsToFirebase(toUpload);
          if (success) {
            const remaining = getDirtyIds('ap_dirty_products').filter(id => !toUpload.some(u => u.id === id));
            saveDirtyIds('ap_dirty_products', remaining);
            remoteModified = true;
          }
        }

        if (localModified) {
          setProducts(merged);
          localStateModified = true;
        }
        if (remoteModified || localModified) {
          remoteStateModified = true;
        }
      }

      // 3. Sincronização do CRM de Clientes
      const dbClients = await fetchClientsFromFirebase();
      if (dbClients) {
        const dirtyClients = getDirtyIds('ap_dirty_clients');
        const currentClients = lastClientsRef.current;
        const localMap = new Map(currentClients.map(c => [c.id, c]));
        const dbMap = new Map(dbClients.map(c => [c.id, c]));
        let localModified = false;
        let remoteModified = false;
        const merged = [...currentClients];

        for (const dbC of dbClients) {
          const localC = localMap.get(dbC.id);
          if (!localC) {
            merged.push(dbC);
            localModified = true;
          } else if (!dirtyClients.includes(dbC.id)) {
            if (JSON.stringify(localC) !== JSON.stringify(dbC)) {
              const idx = merged.findIndex(x => x.id === dbC.id);
              if (idx >= 0) merged[idx] = dbC;
              localModified = true;
            }
          }
        }

        const toUpload = currentClients.filter(lc => dirtyClients.includes(lc.id));
        if (toUpload.length > 0) {
          const success = await syncBulkClientsToFirebase(toUpload);
          if (success) {
            const remaining = getDirtyIds('ap_dirty_clients').filter(id => !toUpload.some(u => u.id === id));
            saveDirtyIds('ap_dirty_clients', remaining);
            remoteModified = true;
          }
        }

        if (localModified) {
          setClients(merged);
          localStateModified = true;
        }
        if (remoteModified || localModified) {
          remoteStateModified = true;
        }
      }

      // 4. Sincronização de Vendas Realizadas (PDV e Canais)
      const dbSales = await fetchSalesFromFirebase();
      if (dbSales) {
        const dirtySales = getDirtyIds('ap_dirty_sales');
        const currentSales = lastSalesRef.current;
        const localMap = new Map(currentSales.map(s => [s.id, s]));
        const dbMap = new Map(dbSales.map(s => [s.id, s]));
        let localModified = false;
        let remoteModified = false;
        const merged = [...currentSales];

        for (const dbS of dbSales) {
          const localS = localMap.get(dbS.id);
          if (!localS) {
            merged.push(dbS);
            localModified = true;
          } else if (!dirtySales.includes(dbS.id)) {
            if (JSON.stringify(localS) !== JSON.stringify(dbS)) {
              const idx = merged.findIndex(x => x.id === dbS.id);
              if (idx >= 0) merged[idx] = dbS;
              localModified = true;
            }
          }
        }

        const toUpload = currentSales.filter(ls => dirtySales.includes(ls.id));
        if (toUpload.length > 0) {
          const success = await syncBulkSalesToFirebase(toUpload);
          if (success) {
            const remaining = getDirtyIds('ap_dirty_sales').filter(id => !toUpload.some(u => u.id === id));
            saveDirtyIds('ap_dirty_sales', remaining);
            remoteModified = true;
          }
        }

        if (localModified) {
          setSales(merged);
          localStateModified = true;
        }
        if (remoteModified || localModified) {
          remoteStateModified = true;
        }
      }

      // 5. Sincronização Financeira (Lançamentos de Caixa)
      const dbTransactions = await fetchTransactionsFromFirebase();
      if (dbTransactions) {
        const dirtyTransactions = getDirtyIds('ap_dirty_transactions');
        const currentTransactions = lastTransactionsRef.current;
        const localMap = new Map(currentTransactions.map(t => [t.id, t]));
        const dbMap = new Map(dbTransactions.map(t => [t.id, t]));
        let localModified = false;
        let remoteModified = false;
        const merged = [...currentTransactions];

        for (const dbT of dbTransactions) {
          const localT = localMap.get(dbT.id);
          if (!localT) {
            merged.push(dbT);
            localModified = true;
          } else if (!dirtyTransactions.includes(dbT.id)) {
            if (JSON.stringify(localT) !== JSON.stringify(dbT)) {
              const idx = merged.findIndex(x => x.id === dbT.id);
              if (idx >= 0) merged[idx] = dbT;
              localModified = true;
            }
          }
        }

        const toUpload = currentTransactions.filter(lt => dirtyTransactions.includes(lt.id));
        if (toUpload.length > 0) {
          const success = await syncBulkTransactionsToFirebase(toUpload);
          if (success) {
            const remaining = getDirtyIds('ap_dirty_transactions').filter(id => !toUpload.some(u => u.id === id));
            saveDirtyIds('ap_dirty_transactions', remaining);
            remoteModified = true;
          }
        }

        if (localModified) {
          setTransactions(merged);
          localStateModified = true;
        }
        if (remoteModified || localModified) {
          remoteStateModified = true;
        }
      }

      // 6. Sincronização de Pedidos da Loja Online / Vitrine
      const dbOrders = await fetchOnlineOrdersFromFirebase();
      if (dbOrders) {
        const dirtyOrders = getDirtyIds('ap_dirty_online_orders');
        const currentOrders = lastOnlineOrdersRef.current;
        const localMap = new Map(currentOrders.map(o => [o.id, o]));
        const dbMap = new Map(dbOrders.map(o => [o.id, o]));
        let localModified = false;
        let remoteModified = false;
        const merged = [...currentOrders];

        for (const dbO of dbOrders) {
          const localO = localMap.get(dbO.id);
          if (!localO) {
            merged.push(dbO);
            localModified = true;
          } else if (!dirtyOrders.includes(dbO.id)) {
            if (JSON.stringify(localO) !== JSON.stringify(dbO)) {
              const idx = merged.findIndex(x => x.id === dbO.id);
              if (idx >= 0) merged[idx] = dbO;
              localModified = true;
            }
          }
        }

        const toUpload = currentOrders.filter(lo => dirtyOrders.includes(lo.id));
        if (toUpload.length > 0) {
          const success = await syncBulkOnlineOrdersToFirebase(toUpload);
          if (success) {
            const remaining = getDirtyIds('ap_dirty_online_orders').filter(id => !toUpload.some(u => u.id === id));
            saveDirtyIds('ap_dirty_online_orders', remaining);
            remoteModified = true;
          }
        }

        if (localModified) {
          setOnlineOrders(merged);
          localStateModified = true;
        }
        if (remoteModified || localModified) {
          remoteStateModified = true;
        }
      }

      // 6.5. Sincronização de Checkouts (Carrinhos Abandonados)
      const dbCheckouts = await fetchCheckoutsFromFirebase();
      if (dbCheckouts) {
        const dirtyCheckouts = getDirtyIds('ap_dirty_checkouts');
        const currentCheckouts = lastCheckoutsRef.current;
        const localMap = new Map(currentCheckouts.map(c => [c.id, c]));
        let localModified = false;
        let remoteModified = false;
        const merged = [...currentCheckouts];

        for (const dbC of dbCheckouts) {
          const localC = localMap.get(dbC.id);
          if (!localC) {
            merged.push(dbC);
            localModified = true;
          } else if (!dirtyCheckouts.includes(dbC.id)) {
            if (JSON.stringify(localC) !== JSON.stringify(dbC)) {
              const idx = merged.findIndex(x => x.id === dbC.id);
              if (idx >= 0) merged[idx] = dbC;
              localModified = true;
            }
          }
        }

        const toUpload = currentCheckouts.filter(lc => dirtyCheckouts.includes(lc.id));
        if (toUpload.length > 0) {
          const success = await syncBulkCheckoutsToFirebase(toUpload);
          if (success) {
            const remaining = getDirtyIds('ap_dirty_checkouts').filter(id => !toUpload.some(u => u.id === id));
            saveDirtyIds('ap_dirty_checkouts', remaining);
            remoteModified = true;
          }
        }

        if (localModified) {
          setCheckouts(merged);
          localStateModified = true;
        }
        if (remoteModified || localModified) {
          remoteStateModified = true;
        }
      }

      // 7. Sincronização de Configurações Globais (Microsoft/Google Workspace keys, dados de loja, logo, bandeiras, etc.)
      const localConfigsChanged = await syncSystemConfigsWithFirebase();
      if (localConfigsChanged) {
        console.log('[Firebase Sync] Chaves de integração, logs e dados da loja atualizados a partir da nuvem!');
        
        // Dispara evento para o SettingsSystem e outros para recarregarem os dados do localStorage na tela
        window.dispatchEvent(new Event('ap-storage-synced'));
      }

      if (localStateModified || remoteStateModified) {
        setNotifications(prev => [
          {
            id: Date.now() + 800,
            title: isManual ? 'Nuvem Sincronizada ☁️✨' : 'Sincronização Concluída ✨',
            detail: 'Todos os produtos, vendas, clientes, Google/Microsoft Workspace, logotipo e configurações compartilhados com este aparelho!',
            read: false,
            type: 'goal' as const
          },
          ...prev
        ]);
      }
      
      if (isManual) {
        alert("✅ Conectado & Pareado!\n\nDados totalmente sincronizados em tempo real com todos os celulares e computadores conectados na nuvem AP Moda Fitness!");
      }
    } catch (e) {
      console.warn('[Firebase Sync Exception] Erro severo na sincronização periódica:', e);
      if (isManual) {
        alert("⚠️ Falha ao sincronizar: " + (e as any).message);
      }
    } finally {
      if (isManual) {
        setIsSyncingNow(false);
      }
      // Allow React to bundle and update state before disabling syncing lock
      setTimeout(() => {
        isSyncingRef.current = false;
        isUpdatingFromSyncRef.current = false;
      }, 300);
    }
  }, [systemOffline, getDirtyIds, saveDirtyIds]);

  // Agenda um loop a cada 7 segundos e escuta o foco da janela para sincronizar em tempo real no segundo plano ao trocar de aparelho
  useEffect(() => {
    performSyncRef.current = performSync;
  }, [performSync]);

  useEffect(() => {
    const config = getFirebaseConfig();
    if (!config) return;

    if (!systemOffline) {
      performSync();
    }

    const interval = setInterval(() => {
      if (!systemOffline) {
        performSync();
      }
    }, 7000);

    const handleFocus = () => {
      console.log('[Firebase Sync] Janela focada! Sincronizando alterações em segundo plano...');
      if (!systemOffline) {
        performSync();
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [systemOffline, performSync]);

  // Assinatura em Tempo Real (Realtime) do Firebase para Sincronização Instantânea Multidispositivo
  useEffect(() => {
    if (systemOffline) return;

    const conf = getFirebaseConfig();
    if (!conf || !conf.url || !conf.key) return;

    const client = getFirebaseClient();
    if (!client) return;

    console.log('[Firebase Realtime] Inicializando canais de escuta em tempo real...');

    // Canal para todas as tabelas principais em tempo real
    const realtimeChannel = client.channel('custom-filter-channel');

    const handlePostgresChange = (tableName: string, payload: any) => {
      // Ignora alterações do próprio aparelho se estivermos no meio de um sync bilateral em lote para prevenir colisões ou loops redundantes
      if (isSyncingRef.current) {
        console.log(`[Firebase Realtime] Evento recebido, mas ignorado por lock de sincronização em andamento na tabela: ${tableName}`);
        return;
      }

      const { eventType, new: newRec, old: oldRec } = payload;
      console.log(`[Firebase Realtime Change Detected] Tabela: ${tableName} | Evento: ${eventType}`, payload);

      const user = currentUserRef.current;
      const userRole = user?.role; // 'Admin' | 'Gerente' | 'Vendedor' | 'Parceiro' | 'Entregador' | 'Cliente'

      // Filtro de Segurança por Perfil de Acesso em Tempo Real (Security Shield):
      if (userRole) {
        // 1. Dados Financeiros (ap_transactions) e faturamento restritos a administradores e gerentes
        if (tableName === 'ap_transactions') {
          if (userRole !== 'Admin' && userRole !== 'Gerente') {
            console.log(`[Firebase Realtime Blocked] Canal de transação bloqueado para perfil: ${userRole}`);
            return;
          }
        }

        // 2. Colaboradores da Equipe (ap_team_members) restritos a administradores e gerentes
        if (tableName === 'ap_team_members') {
          if (userRole !== 'Admin' && userRole !== 'Gerente') {
            console.log(`[Firebase Realtime Blocked] Canal de equipe bloqueado para perfil: ${userRole}`);
            return;
          }
        }

        // 3. Cadastros de Clientes (ap_clients) no CRM: Clientes VIP só atualizam seus próprios dados. Vendedores acessam tudo. Outros perfis ignoram.
        if (tableName === 'ap_clients') {
          if (userRole === 'Cliente') {
            const isMe = newRec && newRec.id === user.details?.id;
            if (!isMe) {
              console.log('[Firebase Realtime Filter] Registro de cliente externo ignorado.');
              return;
            }
          } else if (userRole !== 'Admin' && userRole !== 'Gerente' && userRole !== 'Vendedor') {
            console.log('[Firebase Realtime Filter] Cadastro de CRM indisponível para este perfil.');
            return;
          }
        }

        // 4. Fluxo de Vendas (ap_sales): 
        // Clientes só recebem suas próprias compras
        // Parceiros / Afiliados só recebem vendas associadas ao seu respectivo cupom
        // Entregadores ignoram faturamento das vendas
        if (tableName === 'ap_sales') {
          if (userRole === 'Cliente') {
            const isMySale = newRec && (
              (newRec.clientName && newRec.clientName.trim().toLowerCase() === user.name?.trim().toLowerCase()) ||
              (newRec.clientDoc && user.details?.cpf && newRec.clientDoc.replace(/\D/g, '') === user.details.cpf.replace(/\D/g, ''))
            );
            if (!isMySale) {
              console.log('[Firebase Realtime Filter] Venda externa omitida.');
              return;
            }
          } else if (userRole === 'Parceiro') {
            const isMyCoupon = newRec && (
              (newRec.salesperson && newRec.salesperson.trim().toLowerCase().includes(user.name?.trim().toLowerCase())) ||
              (newRec.items && JSON.stringify(newRec.items).toLowerCase().includes(user.name?.trim().toLowerCase()))
            );
            if (!isMyCoupon) {
              console.log('[Firebase Realtime Filter] Pedido de cupom de outra parceira ignorado.');
              return;
            }
          } else if (userRole === 'Entregador') {
            console.log('[Firebase Realtime Filter] Histórico fiduciário indisponível para entregador.');
            return;
          }
        }

        // 5. Pedidos de Encomendas Online (ap_online_orders) / Logística:
        // Clientes apenas acompanham o rastreio do seu próprio pedido online
        // Entregadores apenas visualizam encomendas especificamente atribuídas a eles (nome do motoboy)
        // Parceiros ignoram o painel operacional de envios
        if (tableName === 'ap_online_orders') {
          if (userRole === 'Cliente') {
            const isMyOrder = newRec && (
              (newRec.clientName && newRec.clientName.trim().toLowerCase() === user.name?.trim().toLowerCase()) ||
              (newRec.phone && user.details?.phone && newRec.phone.replace(/\D/g, '') === user.details.phone.replace(/\D/g, ''))
            );
            if (!isMyOrder) {
              console.log('[Firebase Realtime Filter] Pedido online de terceiros ocultado.');
              return;
            }
          } else if (userRole === 'Entregador') {
            const isMyDelivery = newRec && newRec.motoboy && (
              newRec.motoboy.trim().toLowerCase().includes(user.name?.trim().toLowerCase()) || 
              user.name?.trim().toLowerCase().includes(newRec.motoboy.trim().toLowerCase())
            );
            if (!isMyDelivery) {
              console.log(`[Firebase Realtime Filter] Pedido omitido (atribuído para outro motoboy).`);
              return;
            }
          } else if (userRole === 'Parceiro') {
            return;
          }
        }
      }

      if (tableName === 'ap_products') {
        setProducts(prev => {
          let updated = [...prev];
          if (eventType === 'INSERT' && newRec) {
            const mapped = {
              id: getTolerantValue(newRec, 'id'),
              name: getTolerantValue(newRec, 'name'),
              sku: getTolerantValue(newRec, 'sku'),
              category: getTolerantValue(newRec, 'category'),
              price: Number(getTolerantValue(newRec, 'price', 0)),
              cost: Number(getTolerantValue(newRec, 'cost', 0)),
              stock: Number(getTolerantValue(newRec, 'stock', 0)),
              minStock: Number(getTolerantValue(newRec, 'minStock', 0)),
              image: getTolerantValue(newRec, 'image'),
              images: Array.isArray(getTolerantValue(newRec, 'images')) ? getTolerantValue(newRec, 'images') : [],
              salesCount: Number(getTolerantValue(newRec, 'salesCount', 0)),
              description: getTolerantValue(newRec, 'description', ''),
              videoUrl: getTolerantValue(newRec, 'videoUrl', ''),
              colors: Array.isArray(getTolerantValue(newRec, 'colors')) ? getTolerantValue(newRec, 'colors') : [],
              sizes: Array.isArray(getTolerantValue(newRec, 'sizes')) ? getTolerantValue(newRec, 'sizes') : [],
              sizeColors: getTolerantValue(newRec, 'sizeColors', {}),
              colorStocks: getTolerantValue(newRec, 'colorStocks', {}),
              sizeColorStocks: getTolerantValue(newRec, 'sizeColorStocks', {})
            };
            if (!prev.some(p => p.id === mapped.id)) {
              updated = [mapped, ...prev];
            }
          } else if (eventType === 'UPDATE' && newRec) {
            const mapped = {
              id: getTolerantValue(newRec, 'id'),
              name: getTolerantValue(newRec, 'name'),
              sku: getTolerantValue(newRec, 'sku'),
              category: getTolerantValue(newRec, 'category'),
              price: Number(getTolerantValue(newRec, 'price', 0)),
              cost: Number(getTolerantValue(newRec, 'cost', 0)),
              stock: Number(getTolerantValue(newRec, 'stock', 0)),
              minStock: Number(getTolerantValue(newRec, 'minStock', 0)),
              image: getTolerantValue(newRec, 'image'),
              images: Array.isArray(getTolerantValue(newRec, 'images')) ? getTolerantValue(newRec, 'images') : [],
              salesCount: Number(getTolerantValue(newRec, 'salesCount', 0)),
              description: getTolerantValue(newRec, 'description', ''),
              videoUrl: getTolerantValue(newRec, 'videoUrl', ''),
              colors: Array.isArray(getTolerantValue(newRec, 'colors')) ? getTolerantValue(newRec, 'colors') : [],
              sizes: Array.isArray(getTolerantValue(newRec, 'sizes')) ? getTolerantValue(newRec, 'sizes') : [],
              sizeColors: getTolerantValue(newRec, 'sizeColors', {}),
              colorStocks: getTolerantValue(newRec, 'colorStocks', {}),
              sizeColorStocks: getTolerantValue(newRec, 'sizeColorStocks', {})
            };
            updated = prev.map(p => p.id === mapped.id ? mapped : p);
          } else if (eventType === 'DELETE' && oldRec) {
            updated = prev.filter(p => p.id !== oldRec.id);
          }
          localStorage.setItem('ap_moda_products', JSON.stringify(updated));
          return updated;
        });
      }

      else if (tableName === 'ap_clients') {
        setClients(prev => {
          let updated = [...prev];
          if (eventType === 'INSERT' && newRec) {
            const mapped = {
              id: newRec.id,
              name: newRec.name,
              email: newRec.email || '',
              phone: newRec.phone || '',
              cpf: newRec.cpf || '',
              birthDate: newRec.birthDate || '',
              whatsapp: newRec.whatsapp || '',
              addressStreet: newRec.addressStreet || '',
              addressNum: newRec.addressNum || '',
              addressComp: newRec.addressComp || '',
              addressBairro: newRec.addressBairro || '',
              addressCidade: newRec.addressCidade || '',
              addressEstado: newRec.addressEstado || '',
              addressCep: newRec.addressCep || '',
              channel: newRec.channel || 'Balcão',
              npsScore: Number(newRec.npsScore || 0),
              totalSpent: Number(newRec.totalSpent || 0),
              ordersCount: Number(newRec.ordersCount || 0),
              createdAt: newRec.created_at || new Date().toISOString(),
              cashbackBalance: Number(newRec.cashbackBalance || 0),
              busto: newRec.busto ? Number(newRec.busto) : undefined,
              cintura: newRec.cintura ? Number(newRec.cintura) : undefined,
              quadril: newRec.quadril ? Number(newRec.quadril) : undefined,
              coxa: newRec.coxa ? Number(newRec.coxa) : undefined,
              altura: newRec.altura ? Number(newRec.altura) : undefined,
              peso: newRec.peso ? Number(newRec.peso) : undefined
            };
            if (!prev.some(c => c.id === mapped.id)) {
              updated = [mapped, ...prev];
            }
          } else if (eventType === 'UPDATE' && newRec) {
            const mapped = {
              id: newRec.id,
              name: newRec.name,
              email: newRec.email || '',
              phone: newRec.phone || '',
              cpf: newRec.cpf || '',
              birthDate: newRec.birthDate || '',
              whatsapp: newRec.whatsapp || '',
              addressStreet: newRec.addressStreet || '',
              addressNum: newRec.addressNum || '',
              addressComp: newRec.addressComp || '',
              addressBairro: newRec.addressBairro || '',
              addressCidade: newRec.addressCidade || '',
              addressEstado: newRec.addressEstado || '',
              addressCep: newRec.addressCep || '',
              channel: newRec.channel || 'Balcão',
              npsScore: Number(newRec.npsScore || 0),
              totalSpent: Number(newRec.totalSpent || 0),
              ordersCount: Number(newRec.ordersCount || 0),
              createdAt: newRec.created_at || new Date().toISOString(),
              cashbackBalance: Number(newRec.cashbackBalance || 0),
              busto: newRec.busto ? Number(newRec.busto) : undefined,
              cintura: newRec.cintura ? Number(newRec.cintura) : undefined,
              quadril: newRec.quadril ? Number(newRec.quadril) : undefined,
              coxa: newRec.coxa ? Number(newRec.coxa) : undefined,
              altura: newRec.altura ? Number(newRec.altura) : undefined,
              peso: newRec.peso ? Number(newRec.peso) : undefined
            };
            updated = prev.map(c => c.id === mapped.id ? mapped : c);
          } else if (eventType === 'DELETE' && oldRec) {
            updated = prev.filter(c => c.id !== oldRec.id);
          }
          localStorage.setItem('ap_moda_clients', JSON.stringify(updated));
          return updated;
        });
      }

      else if (tableName === 'ap_sales') {
        setSales(prev => {
          let updated = [...prev];
          if (eventType === 'INSERT' && newRec) {
            const mapped = {
              id: newRec.id,
              clientName: newRec.clientName,
              clientDoc: newRec.clientDoc || '',
              channel: newRec.channel,
              items: Array.isArray(newRec.items) ? newRec.items : [],
              total: Number(newRec.total),
              costTotal: Number(newRec.costTotal || 0),
              status: newRec.status,
              createdAt: newRec.createdAt,
              payments: Array.isArray(newRec.payments) ? newRec.payments : [],
              salesperson: newRec.salesperson || ''
            };
            if (!prev.some(s => s.id === mapped.id)) {
              updated = [mapped, ...prev];
            }
          } else if (eventType === 'UPDATE' && newRec) {
            const mapped = {
              id: newRec.id,
              clientName: newRec.clientName,
              clientDoc: newRec.clientDoc || '',
              channel: newRec.channel,
              items: Array.isArray(newRec.items) ? newRec.items : [],
              total: Number(newRec.total),
              costTotal: Number(newRec.costTotal || 0),
              status: newRec.status,
              createdAt: newRec.createdAt,
              payments: Array.isArray(newRec.payments) ? newRec.payments : [],
              salesperson: newRec.salesperson || ''
            };
            updated = prev.map(s => s.id === mapped.id ? mapped : s);
          } else if (eventType === 'DELETE' && oldRec) {
            updated = prev.filter(s => s.id !== oldRec.id);
          }
          localStorage.setItem('ap_moda_sales', JSON.stringify(updated));
          return updated;
        });
      }

      else if (tableName === 'ap_transactions') {
        setTransactions(prev => {
          let updated = [...prev];
          if (eventType === 'INSERT' && newRec) {
            const mapped = {
              id: newRec.id,
              type: newRec.type,
              category: newRec.category,
              description: newRec.description,
              amount: Number(newRec.amount),
              date: newRec.date
            };
            if (!prev.some(t => t.id === mapped.id)) {
              updated = [mapped, ...prev];
            }
          } else if (eventType === 'UPDATE' && newRec) {
            const mapped = {
              id: newRec.id,
              type: newRec.type,
              category: newRec.category,
              description: newRec.description,
              amount: Number(newRec.amount),
              date: newRec.date
            };
            updated = prev.map(t => t.id === mapped.id ? mapped : t);
          } else if (eventType === 'DELETE' && oldRec) {
            updated = prev.filter(t => t.id !== oldRec.id);
          }
          localStorage.setItem('ap_moda_transactions', JSON.stringify(updated));
          return updated;
        });
      }

      else if (tableName === 'ap_online_orders') {
        setOnlineOrders(prev => {
          let updated = [...prev];
          if (eventType === 'INSERT' && newRec) {
            const mapped = {
              id: newRec.id,
              clientName: newRec.clientName,
              total: Number(newRec.total),
              status: newRec.status,
              items: Array.isArray(newRec.items) ? newRec.items : [],
              createdAt: newRec.createdAt,
              phone: newRec.phone || '',
              address: newRec.address || '',
              paymentMethod: newRec.paymentMethod || ''
            };
            if (!prev.some(o => o.id === mapped.id)) {
              updated = [mapped, ...prev];
            }
          } else if (eventType === 'UPDATE' && newRec) {
            const mapped = {
              id: newRec.id,
              clientName: newRec.clientName,
              total: Number(newRec.total),
              status: newRec.status,
              items: Array.isArray(newRec.items) ? newRec.items : [],
              createdAt: newRec.createdAt,
              phone: newRec.phone || '',
              address: newRec.address || '',
              paymentMethod: newRec.paymentMethod || ''
            };
            updated = prev.map(o => o.id === mapped.id ? mapped : o);
          } else if (eventType === 'DELETE' && oldRec) {
            updated = prev.filter(o => o.id !== oldRec.id);
          }
          localStorage.setItem('ap_moda_online_orders', JSON.stringify(updated));
          return updated;
        });
      }

      else if (tableName === 'ap_checkouts') {
        setCheckouts(prev => {
          let updated = [...prev];
          if (eventType === 'INSERT' && newRec) {
            const mapped = {
              id: newRec.id,
              clientName: newRec.client_name || newRec.clientName,
              phone: newRec.phone || '',
              email: newRec.email || '',
              items: Array.isArray(newRec.items) ? newRec.items : [],
              total: Number(newRec.total),
              status: newRec.status,
              createdAt: newRec.created_at || newRec.createdAt,
              updatedAt: newRec.updated_at || newRec.updatedAt
            };
            if (!prev.some(c => c.id === mapped.id)) {
              updated = [mapped, ...prev];
            }
          } else if (eventType === 'UPDATE' && newRec) {
            const mapped = {
              id: newRec.id,
              clientName: newRec.client_name || newRec.clientName,
              phone: newRec.phone || '',
              email: newRec.email || '',
              items: Array.isArray(newRec.items) ? newRec.items : [],
              total: Number(newRec.total),
              status: newRec.status,
              createdAt: newRec.created_at || newRec.createdAt,
              updatedAt: newRec.updated_at || newRec.updatedAt
            };
            updated = prev.map(c => c.id === mapped.id ? mapped : c);
          } else if (eventType === 'DELETE' && oldRec) {
            updated = prev.filter(c => c.id !== oldRec.id);
          }
          localStorage.setItem('ap_moda_checkouts', JSON.stringify(updated));
          return updated;
        });
      }

      else if (tableName === 'ap_team_members') {
        setTeamMembers(prev => {
          let updated = [...prev];
          if (eventType === 'INSERT' && newRec) {
            const mapped = {
              id: newRec.id,
              name: newRec.name,
              login: newRec.login,
              password: newRec.password,
              role: newRec.role,
              details: newRec.details || '',
              birthDate: newRec.birthDate || '',
              createdAt: newRec.createdAt || newRec.created_at || new Date().toISOString(),
              avatar: newRec.avatar || ''
            };
            if (!prev.some(m => m.id === mapped.id)) {
              updated = [mapped, ...prev];
            }
          } else if (eventType === 'UPDATE' && newRec) {
            const mapped = {
              id: newRec.id,
              name: newRec.name,
              login: newRec.login,
              password: newRec.password,
              role: newRec.role,
              details: newRec.details || '',
              birthDate: newRec.birthDate || '',
              createdAt: newRec.createdAt || newRec.created_at || new Date().toISOString(),
              avatar: newRec.avatar || ''
            };
            updated = prev.map(m => m.id === mapped.id ? mapped : m);
          } else if (eventType === 'DELETE' && oldRec) {
            updated = prev.filter(m => m.id !== oldRec.id);
          }
          localStorage.setItem('ap_moda_team_users', JSON.stringify(updated));
          return updated;
        });
      }

      else if (tableName === 'ap_system_configs') {
        console.log('[Firebase Realtime] Alteração nas configurações do sistema detectada. Sincronizando parâmetros em tempo real...');
        syncSystemConfigsWithFirebase().then((localModified) => {
          if (localModified) {
            console.log('[Firebase Realtime] Configurações administrativas atualizadas. Disparando evento de renderização...');
            const configEvent = new CustomEvent('ap-system-configs-refreshed');
            window.dispatchEvent(configEvent);
          }
        });
      }
    };

    realtimeChannel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ap_sales' }, (p) => handlePostgresChange('ap_sales', p))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ap_clients' }, (p) => handlePostgresChange('ap_clients', p))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ap_products' }, (p) => handlePostgresChange('ap_products', p))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ap_transactions' }, (p) => handlePostgresChange('ap_transactions', p))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ap_online_orders' }, (p) => handlePostgresChange('ap_online_orders', p))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ap_checkouts' }, (p) => handlePostgresChange('ap_checkouts', p))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ap_team_members' }, (p) => handlePostgresChange('ap_team_members', p))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ap_system_configs' }, (p) => handlePostgresChange('ap_system_configs', p))
      .subscribe((status) => {
        console.log(`[Firebase Realtime] Canal custom-filter-channel inscrito com status: ${status}`);
      });

    return () => {
      console.log('[Firebase Realtime] Cancelando assinaturas de tempo real (unsubscribing)...');
      realtimeChannel.unsubscribe();
    };
  }, [systemOffline]);

  // WhatsApp Business API triggers (com suporte a fila offline)
  const triggerWhatsAppAlert = async (type: 'sale_completed' | 'stock_alert', data: any, forceSync = false) => {
    // Se o sistema estiver offline e não for forçado, enfileira
    if (systemOffline && !forceSync) {
      setOfflinePendingSync(prev => [...prev, { type, data }]);
      const offlineNotify = {
        id: Date.now() + 200,
        title: 'Notificação Guardada (Offline)',
        detail: `Alerta do WhatsApp (${type === 'sale_completed' ? 'Venda realizada' : 'Estoque Baixo'}) salvo localmente e enfileirado para envio! 💾`,
        read: false,
        type: 'sale' as const
      };
      setNotifications(prev => [offlineNotify, ...prev]);
      return;
    }

    try {
      const token = localStorage.getItem('ap_whatsapp_token') || '';
      const phoneId = localStorage.getItem('ap_whatsapp_phone_id') || '';
      const recipient = localStorage.getItem('ap_whatsapp_recipient') || '';
      const enabled = localStorage.getItem('ap_whatsapp_enabled') !== 'false';

      if (!enabled) return;

      const response = await fetch('/api/whatsapp/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          phoneId,
          recipient,
          type,
          data
        })
      });

      const resData = await response.json();
      console.log('WhatsApp Alert result:', resData);
    } catch (err) {
      console.error('Failed to dispatch WhatsApp notification:', err);
    }
  };

  // Processa fila de notificações automaticamente quando restabelecer a conexão
  useEffect(() => {
    if (!systemOffline && offlinePendingSync.length > 0) {
      const syncMessages = async () => {
        const queueToProcess = [...offlinePendingSync];
        setOfflinePendingSync([]); // Limpa antes para evitar duplicated triggers na fila
        
        for (const item of queueToProcess) {
          await triggerWhatsAppAlert(item.type, item.data, true);
        }
        
        setNotifications(prev => [
          {
            id: Date.now() + 500,
            title: 'Sincronização Concluída! ⚡',
            detail: `Conexão restabelecida! ${queueToProcess.length} notificação(ões) pendente(s) do WhatsApp foram transmitidas com sucesso.`,
            read: false,
            type: 'sale' as const
          },
          ...prev
        ]);
      };
      syncMessages();
    }
  }, [systemOffline]);

  // Handlers
  const handleAddSale = (newSale: Sale) => {
    setSales(prev => [newSale, ...prev]);

    // Update product stock counts
    let updatedProducts: Product[] = [];
    setProducts(prevProducts => {
      const newList = prevProducts.map(prod => {
        const itemSold = newSale.items.find(it => it.productId === prod.id);
        if (itemSold) {
          const sz = (itemSold as any).selectedSize;
          const col = (itemSold as any).selectedColor;
          
          let updatedColorStocks = prod.colorStocks ? { ...prod.colorStocks } : {};
          let updatedSizeColorStocks = prod.sizeColorStocks ? JSON.parse(JSON.stringify(prod.sizeColorStocks)) : {};

          if (sz && col && updatedSizeColorStocks[sz] && updatedSizeColorStocks[sz][col] !== undefined) {
            updatedSizeColorStocks[sz][col] = Math.max(0, updatedSizeColorStocks[sz][col] - itemSold.quantity);
          }

          if (col && updatedColorStocks[col] !== undefined) {
            updatedColorStocks[col] = Math.max(0, updatedColorStocks[col] - itemSold.quantity);
          }

          const updatedProd = {
            ...prod,
            stock: Math.max(0, prod.stock - itemSold.quantity),
            salesCount: prod.salesCount + itemSold.quantity,
            colorStocks: updatedColorStocks,
            sizeColorStocks: updatedSizeColorStocks
          };
          updatedProducts.push(updatedProd);
          return updatedProd;
        }
        return prod;
      });
      return newList;
    });

    // Feed to cashflows / transactions
    const paymentDetailStr = newSale.payments && newSale.payments.length > 0
      ? ` (${newSale.payments.map(p => `${p.method}: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.amount)}`).join(' + ')})`
      : '';

    const newTx: Transaction = {
      id: `t-${Date.now()}`,
      type: 'Inflow',
      category: 'Venda',
      description: `Venda ${newSale.id.toUpperCase()} para ${newSale.clientName}${paymentDetailStr}`,
      amount: newSale.total,
      date: newSale.createdAt
    };
    setTransactions(prev => [newTx, ...prev]);

    // Load VIP rules configuration from localStorage
    let vipRules: any = null;
    try {
      const saved = localStorage.getItem('ap_vip_rules_config');
      if (saved) vipRules = JSON.parse(saved);
    } catch (e) {}

    if (!vipRules) {
      vipRules = {
        autoVipEnabled: true,
        minSpentEnabled: true,
        minSpent: 500,
        minOrdersEnabled: true,
        minOrders: 3,
        matchType: 'or'
      };
    }

    // Update Client spent bounds if they already exist
    let updatedClients: Client[] = [];
    setClients(prevClients => {
      const newList = prevClients.map(cli => {
        if (cli.name.toLowerCase() === newSale.clientName.toLowerCase()) {
          const newSpent = cli.totalSpent + newSale.total;
          const newOrders = cli.ordersCount + 1;
          
          let isVip = cli.vip || false;
          if (vipRules.autoVipEnabled) {
            const spentQualified = vipRules.minSpentEnabled ? (newSpent >= vipRules.minSpent) : false;
            const ordersQualified = vipRules.minOrdersEnabled ? (newOrders >= vipRules.minOrders) : false;
            
            if (vipRules.minSpentEnabled && vipRules.minOrdersEnabled) {
              if (vipRules.matchType === 'and') {
                isVip = isVip || (spentQualified && ordersQualified);
              } else {
                isVip = isVip || (spentQualified || ordersQualified);
              }
            } else if (vipRules.minSpentEnabled) {
              isVip = isVip || spentQualified;
            } else if (vipRules.minOrdersEnabled) {
              isVip = isVip || ordersQualified;
            }
          }

          const updatedCli = {
            ...cli,
            totalSpent: newSpent,
            ordersCount: newOrders,
            vip: isVip
          };
          updatedClients.push(updatedCli);
          return updatedCli;
        }
        return cli;
      });
      return newList;
    });

    // Mark entities as dirty initially, so if anything fails or we are offline, they will be retried in background sync!
    saveDirtyIds('ap_dirty_sales', Array.from(new Set([...getDirtyIds('ap_dirty_sales'), newSale.id])));
    saveDirtyIds('ap_dirty_transactions', Array.from(new Set([...getDirtyIds('ap_dirty_transactions'), newTx.id])));
    if (updatedProducts.length > 0) {
      saveDirtyIds('ap_dirty_products', Array.from(new Set([...getDirtyIds('ap_dirty_products'), ...updatedProducts.map(p => p.id)])));
    }
    if (updatedClients.length > 0) {
      saveDirtyIds('ap_dirty_clients', Array.from(new Set([...getDirtyIds('ap_dirty_clients'), ...updatedClients.map(c => c.id)])));
    }

    // Immediate Firebase sync for all affected entities!
    const config = getFirebaseConfig();
    if (config && !systemOffline) {
      syncBulkSalesToFirebase([newSale]).then(success => {
        if (success) {
          saveDirtyIds('ap_dirty_sales', getDirtyIds('ap_dirty_sales').filter(id => id !== newSale.id));
        }
      }).catch(e => console.error(e));

      syncBulkTransactionsToFirebase([newTx]).then(success => {
        if (success) {
          saveDirtyIds('ap_dirty_transactions', getDirtyIds('ap_dirty_transactions').filter(id => id !== newTx.id));
        }
      }).catch(e => console.error(e));

      if (updatedProducts.length > 0) {
        syncBulkProductsToFirebase(updatedProducts).then(success => {
          if (success) {
            const affectedIds = updatedProducts.map(p => p.id);
            saveDirtyIds('ap_dirty_products', getDirtyIds('ap_dirty_products').filter(id => !affectedIds.includes(id)));
          }
        }).catch(e => console.error(e));
      }

      if (updatedClients.length > 0) {
        syncBulkClientsToFirebase(updatedClients).then(success => {
          if (success) {
            const affectedIds = updatedClients.map(c => c.id);
            saveDirtyIds('ap_dirty_clients', getDirtyIds('ap_dirty_clients').filter(id => !affectedIds.includes(id)));
          }
        }).catch(e => console.error(e));
      }
    }

    // Check affected products for stock alerts and trigger WhatsApp alerts
    const alertsToTrigger: any[] = [];
    newSale.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        const newStock = Math.max(0, prod.stock - item.quantity);
        // Only trigger if new stock is below minimum AND the old stock was above or equal to minimum
        if (newStock < prod.minStock && prod.stock >= prod.minStock) {
          alertsToTrigger.push({
            name: prod.name,
            stock: newStock,
            minStock: prod.minStock,
            sku: prod.sku
          });
        }
      }
    });

    // Send WhatsApp sale completed alert
    triggerWhatsAppAlert('sale_completed', {
      id: newSale.id,
      clientName: newSale.clientName,
      itemsCount: newSale.items.length,
      total: newSale.total
    });

    // Send WhatsApp stock alerts if any products crossed threshold
    alertsToTrigger.forEach((alertData, idx) => {
      // Delay slightly to prevent race condition or spam block on the receiver
      setTimeout(() => {
        triggerWhatsAppAlert('stock_alert', alertData);
      }, (idx + 1) * 1200);

      // Also append a visual notification in the system
      const stockNotify = {
        id: Date.now() + 10 + idx,
        title: 'Estoque Mínimo Atingido!',
        detail: `"${alertData.name}" caiu para ${alertData.stock} un. Notificação de estoque mínimo enviada p/ WhatsApp.`,
        read: false,
        type: 'stock'
      };
      setNotifications(prev => [stockNotify, ...prev]);
    });

    // Add immediate sale notification
    const newNotify = {
      id: Date.now(),
      title: 'Nova Venda Concluída',
      detail: `${newSale.clientName} comprou ${newSale.items.length} peça(s) via ${newSale.channel} (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(newSale.total)}).`,
      read: false,
      type: 'sale'
    };
    setNotifications(prev => [newNotify, ...prev]);
  };

  const handleUpdateOnlineOrderStatus = (orderId: string, newStatus: any, statusPagamento?: string, trackingCode?: string, statusLogistico?: string) => {
    setOnlineOrders(prev => {
      const updated = prev.map(o => {
        if (o.id === orderId) {
          let updatedStatusPag = statusPagamento || o.status_pagamento || 'pendente';
          if (newStatus === 'Pago' || newStatus === 'Concluído' || newStatus === 'Entregue') {
            updatedStatusPag = 'pago';
          }

          const wasPaid = o.status_pagamento === 'pago' || o.status === 'Pago' || o.status === 'Entregue';
          const isPaidNow = updatedStatusPag === 'pago' || newStatus === 'Pago' || newStatus === 'Entregue';

          if (isPaidNow && !wasPaid) {
            const saleItems = o.items.map((it: any) => {
              const matchedProd = products.find(p => p.name.toLowerCase() === it.productName.toLowerCase());
              return {
                productId: matchedProd?.id || it.productId || `p-ext-${Date.now()}`,
                name: it.productName,
                quantity: Number(it.quantity || 1),
                price: Number(it.price || 0),
                cost: matchedProd?.cost || Math.round(it.price * 0.45),
                selectedColor: it.color || '',
                selectedSize: it.size || ''
              };
            });

            const newSale: Sale = {
              id: o.id, // Use order ID as sale ID to prevent duplication!
              clientName: o.clientName,
              clientDoc: o.cpf || '',
              channel: 'E-commerce',
              items: saleItems,
              total: o.total,
              costTotal: saleItems.reduce((currSum: number, it: any) => currSum + (it.cost * it.quantity), 0),
              status: 'Concluída',
              createdAt: o.createdAt || new Date().toISOString(),
              payments: [{ method: o.paymentMethod || 'Cartão/Pix', amount: o.total }],
              salesperson: o.motoboy || 'E-commerce',
              trackingCode: o.trackingCode || trackingCode || '',
              deliveryMethod: o.deliveryMethod || '',
              address: o.address || '',
              tipo_envio: o.deliveryMethod || 'correios',
              status_logistico: newStatus === 'Entregue' ? 'entregue' : 'pendente'
            };

            setTimeout(() => {
              handleAddSale(newSale);
            }, 100);
          }

          if (newStatus === 'Entregue' && o.status !== 'Entregue') {
            const driverDeliverNotification = {
              id: Date.now() + 50,
              title: 'Corrida Concluída! 🏍️',
              detail: `Encomenda #${orderId.toUpperCase()} foi entregue com sucesso para ${o.clientName}. Saldo de faturamento total adicionado no caixa!`,
              read: false,
              type: 'sale'
            };
            setNotifications(prevNot => [driverDeliverNotification, ...prevNot]);
          }
          return { 
            ...o, 
            status: newStatus, 
            status_pagamento: updatedStatusPag,
            ...(trackingCode !== undefined ? { trackingCode } : {}),
            ...(statusLogistico !== undefined ? { status_logistico: statusLogistico } : {})
          };
        }
        return o;
      });

      // Immediate Firebase sync for online order status update
      const config = getFirebaseConfig();
      if (config && !systemOffline) {
        const orderToSync = updated.find(o => o.id === orderId);
        if (orderToSync) {
          syncBulkOnlineOrdersToFirebase([orderToSync]).catch(e => console.warn('Error syncing order status update:', e));
        }
      }

      return updated;
    });
  };

  const handleAddClient = async (newClient: Client) => {
    // Load VIP rules configuration from localStorage
    let vipRules: any = null;
    try {
      const saved = localStorage.getItem('ap_vip_rules_config');
      if (saved) vipRules = JSON.parse(saved);
    } catch (e) {}

    if (!vipRules) {
      vipRules = {
        autoVipEnabled: true,
        minSpentEnabled: true,
        minSpent: 500,
        minOrdersEnabled: true,
        minOrders: 3,
        matchType: 'or'
      };
    }

    let isVip = newClient.vip || false;
    if (vipRules.autoVipEnabled) {
      const spentQualified = vipRules.minSpentEnabled ? (newClient.totalSpent >= vipRules.minSpent) : false;
      const ordersQualified = vipRules.minOrdersEnabled ? (newClient.ordersCount >= vipRules.minOrders) : false;
      
      if (vipRules.minSpentEnabled && vipRules.minOrdersEnabled) {
        if (vipRules.matchType === 'and') {
          isVip = spentQualified && ordersQualified;
        } else {
          isVip = spentQualified || ordersQualified;
        }
      } else if (vipRules.minSpentEnabled) {
        isVip = spentQualified;
      } else if (vipRules.minOrdersEnabled) {
        isVip = ordersQualified;
      }
    }

    const evaluatedClient = {
      ...newClient,
      vip: isVip
    };

    setClients(prev => [evaluatedClient, ...prev]);
    const config = getFirebaseConfig();
    if (config && !systemOffline) {
      try {
        await syncBulkClientsToFirebase([evaluatedClient]);
        const remaining = getDirtyIds('ap_dirty_clients').filter(id => id !== evaluatedClient.id);
        saveDirtyIds('ap_dirty_clients', remaining);
      } catch (e) {
        console.warn('Immediate client upload failed:', e);
      }
    }
  };

  const handleAddProduct = async (newProd: Product) => {
    setProducts(prev => [newProd, ...prev]);
    const config = getFirebaseConfig();
    if (config && !systemOffline) {
      try {
        await syncBulkProductsToFirebase([newProd]);
        const remaining = getDirtyIds('ap_dirty_products').filter(id => id !== newProd.id);
        saveDirtyIds('ap_dirty_products', remaining);
      } catch (e) {
        console.warn('Immediate product upload failed:', e);
        throw e;
      }
    }
  };

  const handleUpdateProduct = async (updatedProd: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProd.id ? updatedProd : p));
    const config = getFirebaseConfig();
    if (config && !systemOffline) {
      try {
        await syncBulkProductsToFirebase([updatedProd]);
        const remaining = getDirtyIds('ap_dirty_products').filter(id => id !== updatedProd.id);
        saveDirtyIds('ap_dirty_products', remaining);
      } catch (e) {
        console.warn('Immediate product update failed:', e);
        throw e;
      }
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    const config = getFirebaseConfig();
    if (config && !systemOffline) {
      try {
        await deleteProductFromFirebase(productId);
        const remaining = getDirtyIds('ap_dirty_products').filter(id => id !== productId);
        saveDirtyIds('ap_dirty_products', remaining);
      } catch (e) {
        console.warn('Immediate product delete failed:', e);
      }
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    setSales(prev => prev.filter(s => s.id !== saleId));
    const config = getFirebaseConfig();
    if (config && !systemOffline) {
      try {
        await deleteSaleFromFirebase(saleId);
        const remaining = getDirtyIds('ap_dirty_sales').filter(id => id !== saleId);
        saveDirtyIds('ap_dirty_sales', remaining);
      } catch (e) {
        console.warn('Immediate sale delete failed:', e);
      }
    }
  };

  const handleAddTransaction = async (newTx: Transaction) => {
    setTransactions(prev => [newTx, ...prev]);
    const config = getFirebaseConfig();
    if (config && !systemOffline) {
      try {
        await syncBulkTransactionsToFirebase([newTx]);
        const remaining = getDirtyIds('ap_dirty_transactions').filter(id => id !== newTx.id);
        saveDirtyIds('ap_dirty_transactions', remaining);
      } catch (e) {
        console.warn('Immediate transaction upload failed:', e);
      }
    }
  };

  const handleClearAllData = async () => {
    const adminUser = teamMembers.find(m => m.role === 'Admin');
    const adminPassword = adminUser ? adminUser.password : 'ApB1695*';
    
    const enteredPassword = prompt('Confirmação de Segurança: Por favor, insira a sua senha de ADMINISTRADOR para autorizar o reset e a formatação total dos dados fantasmas do Dashboard:');
    
    if (enteredPassword === null) {
      return; // cancellation
    }
    
    if (enteredPassword !== adminPassword) {
      alert('Acesso negado! A senha de administrador informada está incorreta. O reset foi cancelado por motivos de segurança.');
      return;
    }

    if (confirm('ATENÇÃO: Você confirmou a senha com sucesso! Deseja realmente apagar COMPLETAMENTE todos os produtos, clientes, vendas, despesas, caixa, equipe (mantendo apenas administradores) e pedidos do sistema para iniciar o trabalho do zero (Produção)?')) {
      
      // Clear all cloud data from Firebase if connected
      const client = getFirebaseClient();
      if (client) {
        try {
          await clearAllFirebaseData();
        } catch (err) {
          console.warn('Erro ao formatar banco de dados na nuvem:', err);
        }
      }

      const cleanTeam = teamMembers.filter(m => m.role === 'Admin');
      setTeamMembers(cleanTeam);
      localStorage.setItem('ap_moda_team_users', JSON.stringify(cleanTeam));

      localStorage.setItem('ap_moda_products', JSON.stringify([]));
      localStorage.setItem('ap_moda_clients', JSON.stringify([]));
      localStorage.setItem('ap_moda_sales', JSON.stringify([]));
      localStorage.setItem('ap_moda_transactions', JSON.stringify([]));
      localStorage.setItem('ap_moda_online_orders', JSON.stringify([]));
      localStorage.setItem('ap_moda_checkouts', JSON.stringify([]));
      localStorage.setItem('ap_moda_sellers', JSON.stringify([]));
      localStorage.setItem('ap_moda_motoboys', JSON.stringify([]));
      localStorage.setItem('ap_moda_opportunities', JSON.stringify([]));
      localStorage.setItem('ap_moda_followups', JSON.stringify([]));
      localStorage.setItem('ap_moda_partners', JSON.stringify([]));
      localStorage.setItem('ap_moda_trocas', JSON.stringify([]));
      localStorage.setItem('ap_moda_delivery_riders', JSON.stringify([]));
      localStorage.setItem('ap_moda_suppliers', JSON.stringify([]));
      localStorage.setItem('ap_moda_supplier_purchases', JSON.stringify([]));
      
      // Clear dirty arrays
      localStorage.removeItem('ap_dirty_products');
      localStorage.removeItem('ap_dirty_clients');
      localStorage.removeItem('ap_dirty_sales');
      localStorage.removeItem('ap_dirty_transactions');
      localStorage.removeItem('ap_dirty_online_orders');
      localStorage.removeItem('ap_dirty_checkouts');
      localStorage.removeItem('ap_dirty_team_members');

      setProducts([]);
      setClients([]);
      setSales([]);
      setTransactions([]);
      setOnlineOrders([]);
      setCheckouts([]);
      setSellers([]);
      setMotoboys([]);
      alert('Tudo limpo! O sistema está zerado e com todos os dados fantasmas excluídos tanto localmente quanto na nuvem Firebase, pronto para o seu uso oficial.');
      window.location.reload();
    }
  };

  const handleLoadDemoData = () => {
    if (confirm('Isso irá substituir os dados atuais pelas mercadorias e vendas de testes para demonstração da loja de Moda Fitness. Deseja prosseguir?')) {
      localStorage.setItem('ap_moda_products', JSON.stringify(INITIAL_PRODUCTS));
      localStorage.setItem('ap_moda_clients', JSON.stringify(INITIAL_CLIENTS));
      localStorage.setItem('ap_moda_sales', JSON.stringify(INITIAL_SALES));
      localStorage.setItem('ap_moda_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
      
      const defaultSellers = ['Ana Carolina', 'Beatriz Rocha', 'Juliana Costa', 'Bruna Oliveira'];
      const defaultMotoboys = ['Bruno Ramos (Moto 1)', 'Lucas Correia (Moto 2)', 'Thales Silva (Bike/Região Central)', 'Cláudio Santos (Parceiro Envio Rápido)'];
      localStorage.setItem('ap_moda_sellers', JSON.stringify(defaultSellers));
      localStorage.setItem('ap_moda_motoboys', JSON.stringify(defaultMotoboys));
      setSellers(defaultSellers);
      setMotoboys(defaultMotoboys);

      const demoOnlineOrders = [
        {
          id: 'ped-web-01',
          clientName: 'Ana Costa',
          phone: '(21) 99123-4567',
          items: [{ productName: 'Legging Ativa All-Black Cós Alto', quantity: 1, price: 159.90 }],
          total: 159.90,
          status: 'Pendente',
          createdAt: new Date().toISOString(),
          address: 'Av. Copacabana, 820 - Apto 402, Rio de Janeiro - RJ',
          deliveryFee: 15.00,
          notes: 'Entregar no período da tarde, se possível.'
        },
        {
          id: 'ped-web-02',
          clientName: 'Beatriz Pereira',
          phone: '(31) 98989-1234',
          items: [
            { productName: 'Top Sport Confort Alta Sustentação', quantity: 1, price: 99.90 },
            { productName: 'Shorts Biker Anatômico Alta Compressão', quantity: 1, price: 89.90 }
          ],
          total: 189.80,
          status: 'Separando',
          createdAt: new Date().toISOString(),
          address: 'Rua São Paulo, 1450 - Centro, Belo Horizonte - MG',
          deliveryFee: 18.00,
          motoboy: 'Lucas Correia',
          notes: 'Embalar para presente.'
        }
      ];
      localStorage.setItem('ap_moda_online_orders', JSON.stringify(demoOnlineOrders));

      const demoOpps = [
        { id: 'op-1', clientName: 'Gabriela Souza', value: 289.90, probability: 80, stage: 'Prospecção', itemInteresse: 'Conjunto Seamless Sculpt', notes: 'Quer para o aniversário dia 20.' },
        { id: 'op-2', clientName: 'Ana Costa', value: 159.90, probability: 50, stage: 'Foto Enviada', itemInteresse: 'Legging All-Black Cós Alto', notes: 'Gostou do cós alto anatômico.' },
        { id: 'op-3', clientName: 'Beatriz Pereira', value: 450.00, probability: 90, stage: 'Prova / Reserva', itemInteresse: 'Combo Macacão Wave + Tops', notes: 'Reserva expira amanhã.' }
      ];
      const demoFups = [
        { id: 'fup-1', clientName: 'Ana Costa', channel: 'WhatsApp', date: '2026-06-14', notes: 'Perguntar se gostou do tamanho M do Conjunto Seamless.', completed: false },
        { id: 'fup-2', clientName: 'Carla Oliveira', channel: 'Instagram', date: '2026-06-15', notes: 'Enviar as novidades de casaco corta-vento Dry.', completed: false },
        { id: 'fup-3', clientName: 'Julia Santos', channel: 'Call', date: '2026-06-13', notes: 'Ligar para acertar retirada de reserva.', completed: true }
      ];
      const demoPartners = [
        { id: 'part-1', name: 'Marina Fitness Coach', instagram: '@marina_fit', couponCode: 'MARINAFIT10', commissionRate: 10, salesCount: 15, totalGenerated: 4250.00 },
        { id: 'part-2', name: 'Julia Rezende', instagram: '@jurezendedm', couponCode: 'JU10', commissionRate: 8, salesCount: 8, totalGenerated: 1890.00 },
        { id: 'part-3', name: 'Amanda Runner', instagram: '@amandarun', couponCode: 'AMANDAPRO', commissionRate: 12, salesCount: 22, totalGenerated: 6200.00 }
      ];
      localStorage.setItem('ap_moda_opportunities', JSON.stringify(demoOpps));
      localStorage.setItem('ap_moda_followups', JSON.stringify(demoFups));
      localStorage.setItem('ap_moda_partners', JSON.stringify(demoPartners));

      setProducts(INITIAL_PRODUCTS);
      setClients(INITIAL_CLIENTS);
      setSales(INITIAL_SALES);
      setTransactions(INITIAL_TRANSACTIONS);
      setOnlineOrders(demoOnlineOrders);
      alert('Dados de demonstração carregados com sucesso! Sinta-se à vontade para navegar ou testar.');
      setActiveTab(ActiveTab.DASHBOARD);
    }
  };

  const handleResetData = () => {
    handleClearAllData();
  };

  const handleImportData = (imported: { products?: Product[]; sales?: Sale[]; clients?: Client[]; transactions?: Transaction[] }) => {
    if (imported.products) setProducts(imported.products);
    if (imported.clients) setClients(imported.clients);
    if (imported.sales) setSales(imported.sales);
    if (imported.transactions) setTransactions(imported.transactions);

    alert('Backup importado e restaurado com sucesso no sistema!');
    setActiveTab(ActiveTab.DASHBOARD);
  };

  const handleAddOnlineOrder = (newOrder: any) => {
    setOnlineOrders((prev: any[]) => {
      const orderExists = prev.some(o => o.id === newOrder.id);
      if (orderExists) return prev;
      return [newOrder, ...prev];
    });

    // Fire visual alert notification in management dashboard
    const newNotify = {
      id: Date.now(),
      title: 'Novo Pedido p/ WhatsApp! 🛍️',
      detail: `${newOrder.clientName} montou uma sacola no catálogo no valor de R$ ${newOrder.total.toFixed(2)}. Pedido guardado na aba de Logística.`,
      read: false,
      type: 'sale' as const
    };
    setNotifications((prev: any[]) => [newNotify, ...prev]);
  };

  const handleAddCheckout = (newCheckout: any) => {
    setCheckouts((prev: any[]) => {
      const exists = prev.some(c => c.id === newCheckout.id);
      if (exists) {
        return prev.map(c => c.id === newCheckout.id ? { ...c, ...newCheckout, updatedAt: new Date().toISOString() } : c);
      }
      return [newCheckout, ...prev];
    });
  };

  // Render the currently selected tab/page view
  const renderCurrentView = () => {
    switch (activeTab) {
      case ActiveTab.DASHBOARD:
        return (
          <DashboardOverview 
            products={products}
            sales={sales}
            clients={clients}
            transactions={transactions}
            setActiveTab={setActiveTab}
            setCustomersCRMSubTab={setCustomersCRMSubTab}
            setProductsSubTab={setProductsSubTab}
          />
        );
      case ActiveTab.DASHBOARD_EXECUTIVO:
        return (
          <DashboardExecutive 
            products={products}
            sales={sales}
            clients={clients}
            transactions={transactions}
            sellers={sellers}
          />
        );
      case ActiveTab.DASHBOARD_PERFORMANCE_ANALYTICS:
        return (
          <DashboardPerformanceAnalytics 
            products={products}
            sales={sales}
            clients={clients}
            checkouts={checkouts}
          />
        );
      case ActiveTab.VENDAS:
        return (
          <VendasList 
            products={products}
            setProducts={handleUpdateProductsList}
            sales={sales}
            setSales={handleUpdateSalesList}
            onDeleteSale={handleDeleteSale}
            setActiveTab={setActiveTab}
            onAddTransaction={handleAddTransaction}
          />
        );
      case ActiveTab.PDV:
        return (
          <PDVTerminal 
            products={products}
            clients={clients}
            onAddSale={handleAddSale}
            onUpdateClients={handleUpdateClientsList}
            onAddClient={handleAddClient}
            setActiveTab={setActiveTab}
            sellers={sellers}
            currentUser={currentUser}
          />
        );
      case ActiveTab.PEDIDOS:
        return (
          <OrdersLogistics 
            products={products}
            sales={sales}
            clients={clients}
            onAddSale={handleAddSale}
            onlineOrders={onlineOrders}
            setOnlineOrders={setOnlineOrders}
            onUpdateOnlineOrderStatus={handleUpdateOnlineOrderStatus}
            activeSubTab={ordersLogisticsSubTab}
            setActiveSubTab={setOrdersLogisticsSubTab}
            sellers={sellers}
          />
        );
      case ActiveTab.PRODUTOS:
        return (
          <CatalogInventory 
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            activeSubTab={productsSubTab}
            setActiveSubTab={setProductsSubTab}
          />
        );
      case ActiveTab.CLIENTES:
        return (
          <CustomersCRM 
            clients={clients}
            sales={sales}
            onAddClient={handleAddClient}
            onUpdateClients={handleUpdateClientsList}
            currentUser={currentUser}
            activeSubTab={customersCRMSubTab}
            setActiveSubTab={setCustomersCRMSubTab}
            teamMembers={teamMembers}
            onUpdateTeamMembers={setTeamMembers}
          />
        );
      case ActiveTab.FINANCEIRO:
        return (
          <FinanceCashflow 
            transactions={transactions}
            setTransactions={handleUpdateTransactionsList}
            onAddTransaction={handleAddTransaction}
            sales={sales}
            products={products}
          />
        );
      case ActiveTab.LOJA_ONLINE:
        return (
          <LojaOnline 
            products={products}
            onEnterCustomerView={() => navigateTo('/')}
            activeSubTab={lojaOnlineSubTab}
            setActiveSubTab={setLojaOnlineSubTab}
            checkouts={checkouts}
            setCheckouts={setCheckouts}
            onSyncCheckouts={() => performSync(true)}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
          />
        );
      case ActiveTab.AGENTES_IA:
        return (
          <AIAgentsHub 
            products={products}
            clients={clients}
          />
        );
      case ActiveTab.GOOGLE_WORKSPACE:
        return (
          <GoogleWorkspace 
            products={products}
            sales={sales}
            clients={clients}
          />
        );
      case ActiveTab.METAS:
        if (currentUser?.role === 'Vendedor') {
          return (
            <SellerDashboard 
              currentUser={currentUser}
              onLogout={() => setCurrentUser(null)}
              sales={sales}
            />
          );
        }
        return (
          <SalesGoalSimulator 
            sales={sales}
          />
        );
      case ActiveTab.CONFIGURACOES:
        return (
          <SettingsSystem 
            onResetData={handleResetData}
            onLoadDemoData={handleLoadDemoData}
            onClearAllData={handleClearAllData}
            products={products}
            sales={sales}
            clients={clients}
            transactions={transactions}
            onImportData={handleImportData}
            sellers={sellers}
            motoboys={motoboys}
            teamMembers={teamMembers}
            onUpdateTeamMembers={async (newList) => {
              setTeamMembers(newList);
              const config = getFirebaseConfig();
              if (config) {
                try {
                  await syncBulkTeamMembersToFirebase(newList);
                  console.log('Automated team users synchronization with Firebase complete.');
                } catch(e) {
                  console.warn('Failed to sync updated list to Firebase:', e);
                }
              }
            }}
            onAddSeller={(name) => {
              if (!sellers.includes(name)) {
                const updated = [...sellers, name];
                setSellers(updated);
                localStorage.setItem('ap_moda_sellers', JSON.stringify(updated));
              }
            }}
            onDeleteSeller={(name) => {
              const updated = sellers.filter(s => s !== name);
              setSellers(updated);
              localStorage.setItem('ap_moda_sellers', JSON.stringify(updated));
            }}
            onAddMotoboy={(name) => {
              if (!motoboys.includes(name)) {
                const updated = [...motoboys, name];
                setMotoboys(updated);
                localStorage.setItem('ap_moda_motoboys', JSON.stringify(updated));
              }
            }}
            onDeleteMotoboy={(name) => {
              const updated = motoboys.filter(m => m !== name);
              setMotoboys(updated);
              localStorage.setItem('ap_moda_motoboys', JSON.stringify(updated));
            }}
          />
        );
      case ActiveTab.FORNECEDORES:
        return (
          <SuppliersManagement 
            products={products}
            onUpdateProduct={handleUpdateProduct}
            onAddTransaction={handleAddTransaction}
            activeSubTab={suppliersManagementSubTab}
            setActiveSubTab={setSuppliersManagementSubTab}
          />
        );
      case ActiveTab.METODOS_PAGAMENTO:
        return (
          <StorefrontPaymentConfig />
        );
      default:
        return (
          <DashboardOverview 
            products={products}
            sales={sales}
            clients={clients}
            transactions={transactions}
            setActiveTab={setActiveTab}
            setCustomersCRMSubTab={setCustomersCRMSubTab}
            setProductsSubTab={setProductsSubTab}
          />
        );
    }
  };

  if (isCustomerView) {
    return (
      <PublicCatalog 
        products={products && products.length > 0 ? products : INITIAL_PRODUCTS}
        onAddOnlineOrder={handleAddOnlineOrder}
        onAddCheckout={handleAddCheckout}
        clients={clients}
        onAddClient={handleAddClient}
        onUpdateClients={handleUpdateClientsList}
        onExitCustomerView={() => navigateTo('/painel')}
        currentUser={currentUser}
        sales={sales}
        onlineOrders={onlineOrders}
      />
    );
  }

  if (!currentUser) {
    return (
      <LoginScreen 
        sellers={sellers}
        motoboys={motoboys}
        teamMembers={teamMembers}
        clients={clients}
        onLogin={async (user) => {
          setCurrentUser(user);
          await runFullSynchronousSetup(user);
        }}
      />
    );
  }

  if (currentUser?.role === 'Cliente') {
    return (
      <CustomerPortal 
        currentUser={currentUser}
        onLogout={() => setCurrentUser(null)}
        sales={sales}
        products={products}
        clients={clients}
        onUpdateClients={handleUpdateClientsList}
      />
    );
  }

  if (currentUser?.role === 'Parceiro') {
    return (
      <PartnerPortal 
        currentUser={currentUser}
        onLogout={() => setCurrentUser(null)}
        onlineOrders={onlineOrders}
        sales={sales}
      />
    );
  }

  if (isDriverPortalOpen) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <DriverAppPortal 
          onlineOrders={onlineOrders}
          onUpdateOrderStatus={handleUpdateOnlineOrderStatus}
          onExitPortal={() => setIsDriverPortalOpen(false)}
          currentUser={currentUser}
          onLogout={() => setCurrentUser(null)}
        />
      </div>
    );
  }

  const showBlockingLoader = isCloudSyncingOnLogin && products.length === 0;

  if (showBlockingLoader) {
    const stepsList = [
      'Conectando...',
      'Sincronizando Login...',
      'Sincronizando Produtos...',
      'Sincronizando Clientes...',
      'Sincronizando Histórico de Vendas...',
      'Sincronizando Financeiro...',
      'Sincronizando Pedidos Online...',
      'Sincronizando Configurações Globais...'
    ];

    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white font-sans p-6 overflow-y-auto">
        {/* Ambient high-tech neon details */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl p-1 pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl p-1 pointer-events-none animate-pulse" />
        
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 text-center space-y-6">
          <div className="flex flex-col items-center">
            {/* Elegant glowing active loader logo */}
            {syncProgress.status === 'error' ? (
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-4 animate-bounce">
                <span className="font-bold text-2xl">!</span>
              </div>
            ) : (
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-pink-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="inline-block w-3.5 h-3.5 bg-pink-500 rounded-full animate-ping" />
                </div>
              </div>
            )}
            
            <h2 className="text-xl font-bold tracking-tight text-white font-sans text-center">
              {syncProgress.status === 'error' ? 'Falha na Sincronização' : 'Sincronizando com a Nuvem'}
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed text-center">
              Olá, <strong className="text-pink-500">{currentUser?.name || 'Profissional'}</strong>. Estamos preparando e carregando todos os dados da loja em tempo real neste aparelho!
            </p>
          </div>

          {/* Steps Progress List */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4 text-left space-y-2.5 font-mono text-[11px]">
            {stepsList.map((stepItem, index) => {
              const isCompleted = syncProgress.stepsCompleted.includes(stepItem);
              const isActive = syncProgress.step === stepItem;
              
              let statusIndicator = <span className="w-1.5 h-1.5 rounded-full bg-slate-700 inline-block mr-2.5" />;
              let textColor = 'text-slate-500';
              
              if (isCompleted) {
                statusIndicator = <span className="text-emerald-500 font-bold mr-2 inline-block">✓</span>;
                textColor = 'text-slate-400 line-through decoration-slate-800';
              } else if (isActive) {
                statusIndicator = <span className="text-pink-500 font-bold mr-2 inline-block animate-pulse">➔</span>;
                textColor = 'text-pink-500 font-bold animate-pulse';
              }
              
              return (
                <div key={index} className={`flex items-center ${textColor}`}>
                  {statusIndicator}
                  <span>{stepItem}</span>
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            <p className="text-[11px] text-slate-400 italic bg-slate-850/40 p-3 rounded-lg border border-slate-800 text-center">
              "{syncProgress.details}"
            </p>

            {syncProgress.status === 'error' ? (
              <div className="flex gap-2">
                <button
                  onClick={() => runFullSynchronousSetup(currentUser)}
                  className="flex-1 py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl transition duration-300 cursor-pointer border-none"
                >
                  Tentar Novamente
                </button>
                <button
                  onClick={() => setIsCloudSyncingOnLogin(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition duration-300 cursor-pointer border-none"
                >
                  Entrar Offline
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 flex" id="main-app-container">
      {/* Sidebar navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        lowStockCount={lowStockCount}
        onOpenDriverPortal={() => setIsDriverPortalOpen(true)}
        themeAccent={themeAccent}
        setThemeAccent={setThemeAccent}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentUser={currentUser}
        onLogout={() => setCurrentUser(null)}
        onSetOrdersLogisticsSubTab={setOrdersLogisticsSubTab}
        onSetCustomersCRMSubTab={setCustomersCRMSubTab}
        onSetSuppliersManagementSubTab={setSuppliersManagementSubTab}
        onSetProductsSubTab={setProductsSubTab}
        onSetLojaOnlineSubTab={setLojaOnlineSubTab}
        onSetAiAgentsHubSubTab={setAiAgentsHubSubTab}
        onSetGoogleWorkspaceSubTab={setGoogleWorkspaceSubTab}
        onSetSettingsSystemSubTab={setSettingsSystemSubTab}
        activeOrdersLogisticsSubTab={ordersLogisticsSubTab}
        activeCustomersCRMSubTab={customersCRMSubTab}
        activeSuppliersManagementSubTab={suppliersManagementSubTab}
        activeProductsSubTab={productsSubTab}
        activeLojaOnlineSubTab={lojaOnlineSubTab}
        activeAiAgentsHubSubTab={aiAgentsHubSubTab}
        activeGoogleWorkspaceSubTab={googleWorkspaceSubTab}
        activeSettingsSystemSubTab={settingsSystemSubTab}
      />

      {/* Main Screen content block (shifted on desktop) */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Top Sticky Header */}
        <header className="sticky top-0 bg-white border-b border-slate-100 z-30 px-4 md:px-6 h-16 flex items-center justify-between shadow-xs">
          
          {/* Mobile hamburger menu toggle */}
          <div className="flex items-center gap-3">
            <button 
              id="sidebar-toggle-btn"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 text-slate-500 hover:text-pink-600 hover:bg-slate-55 rounded-md transition-all cursor-pointer"
            >
              <Menu size={20} />
            </button>

            {/* Quick stats indicator */}
            <div className="hidden sm:flex items-center gap-2 text-slate-400 text-xs font-medium">
              {systemOffline ? (
                <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-bold text-[10px] animate-pulse" title="Você está operando offline. Todos os dados estão sendo salvos localmente!">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  <span>Modo Offline Ativo ⚡</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold text-[10px]" title="Conectado à internet com segurança. Sincronização em tempo real!">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Conexão Segura</span>
                </div>
              )}
              <span className="text-slate-200">|</span>
              <button 
                onClick={() => navigateTo('/')}
                className="bg-pink-600 hover:bg-pink-700 active:scale-95 text-white flex items-center gap-1.5 font-bold text-xs px-3 py-1 bg-pink-600/90 rounded-full transition-all shadow-sm shadow-pink-600/20 cursor-pointer animate-pulse border-none"
                title="Navegar no catálogo moderno como se fosse sua cliente"
              >
                <ShoppingBag size={11} />
                <span>Ver Vitrine Cliente 🌸</span>
              </button>
              <span className="text-slate-200">|</span>
              <button 
                onClick={() => setIsDriverPortalOpen(true)}
                className="hover:text-pink-600 flex items-center gap-1 font-semibold text-slate-550 transition-colors cursor-pointer"
                title="Ativar modo App do Entregador isolado"
              >
                🏍️ App Entregador
              </button>
              <span className="text-slate-200">|</span>
              <button 
                onClick={() => setSimulateOffline(!simulateOffline)}
                title={simulateOffline ? "Reconectar sinal de Internet" : "Simular queda de Internet ou Energia"}
                className={`flex items-center gap-1.5 font-bold text-[11px] px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  simulateOffline 
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse' 
                    : 'text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-500/5'
                }`}
              >
                <span>🔌 {simulateOffline ? "Reconectar Internet" : "Simular Offline"}</span>
              </button>
              <span className="text-slate-200">|</span>
              <button 
                onClick={handleResetData}
                title="Restaurar dados originais"
                className="hover:text-pink-600 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
              >
                <RefreshCw size={12} />
                Restaurar Fábrica
              </button>
            </div>
          </div>

          {/* Quick global search text & notification alerts */}
          <div className="flex items-center gap-4">
            
            {/* Manual Cloud Sync Button (Instantly connects multiple devices to the same data) */}
            <button 
              onClick={() => performSync(true)}
              disabled={isSyncingNow}
              className={`flex items-center gap-1.5 font-bold text-xs px-3.5 py-2.5 sm:py-2 rounded-xl border-none cursor-pointer transition-all active:scale-95 text-white shadow-md ${
                isSyncingNow 
                  ? 'bg-amber-500 hover:bg-amber-600 animate-pulse cursor-not-allowed shadow-amber-500/25' 
                  : systemOffline
                    ? 'bg-slate-400 hover:bg-slate-500 shadow-slate-450/25'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
              }`}
              title="Clique para sincronizar, parear e compartilhar os dados em tempo real com todos os celulares e tablets conectados"
            >
              <CloudLightning size={14} className={isSyncingNow ? 'animate-spin text-white' : 'text-emerald-100'} />
              <span className="hidden sm:inline">{isSyncingNow ? 'Sincronizando...' : 'Sincronizar Vários Aparelhos ☁️'}</span>
              <span className="sm:hidden">{isSyncingNow ? 'Sincronizando...' : 'Sincronizar ☁️'}</span>
            </button>

            {/* Search mock bar */}
            <div className="relative hidden md:block w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={14} />
              </span>
              <input 
                id="global-search-input"
                type="text" 
                placeholder="Buscar produtos, clientes, vendas..." 
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-150 rounded-lg text-xs font-sans text-slate-650 placeholder-slate-400 focus:outline-hidden"
                onClick={() => alert("Dica: Use as buscas específicas de cada menu (PDV, Estoque ou CRM) para encontrar as informações com filtros avançados e fáceis!")}
              />
            </div>

            {/* Notifications ring with dropdown */}
            <div className="relative">
              <button 
                id="notification-bell-btn"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-1.5 text-slate-500 hover:text-pink-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer relative"
              >
                <Bell size={18} />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-pink-600 text-[9px] font-bold text-white rounded-full flex items-center justify-center animate-bounce">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Notification bubble menu */}
              {isNotificationsOpen && (
                <div id="notifications-menu" className="absolute right-0 mt-3 bg-white border border-slate-100 rounded-xl shadow-xl w-72 p-3 z-50 text-xs space-y-2 text-left animate-in fade-in-50 duration-200">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="font-bold text-slate-800">Mensagens do Sistema</span>
                    <button 
                      onClick={() => setNotifications(prev => prev.map(n => ({...n, read: true})))}
                      className="text-pink-600 hover:text-pink-700 font-bold text-[10px] cursor-pointer"
                    >
                      Marcar Lidas
                    </button>
                  </div>
                  <div className="divide-y divide-slate-50 max-h-56 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="py-4 text-center text-slate-400 text-[11px]">Nenhuma nova notificação</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`py-2 text-slate-700 leading-tight ${!n.read ? 'bg-pink-50/20 px-1 py-1 rounded' : ''}`}>
                          <p className="font-semibold">{n.title}</p>
                          <p className="text-slate-400 text-[10px] mt-0.5">{n.detail}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Toggle Dark Mode Button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 text-slate-500 hover:text-pink-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer flex items-center justify-center"
              title={darkMode ? "Ativar Modo Claro ☀️" : "Ativar Modo Escuro 🌙"}
            >
              {darkMode ? (
                <Sun size={18} className="text-amber-500 animate-[spin_8s_linear_infinite]" />
              ) : (
                <Moon size={18} className="text-slate-600" />
              )}
            </button>

            {/* User Profile matching screenshot */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-100 font-sans">
              <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 font-extrabold text-xs flex items-center justify-center uppercase overflow-hidden border border-pink-200">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  currentUser?.name ? currentUser.name.slice(0, 2) : 'AP'
                )}
              </div>
              <div className="hidden sm:block text-left select-none">
                <p className="text-xs font-bold text-slate-700 leading-none">{currentUser?.name || 'Administrador'}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{currentUser?.role || 'Acesso Geral'}</p>
              </div>
            </div>

          </div>
        </header>

        {systemOffline && (
          <div className="bg-amber-500 text-slate-950 font-sans px-4 py-2.5 text-xs flex flex-col md:flex-row justify-between items-center gap-2 font-bold shadow-inner relative z-20 transition-all duration-300 border-b border-amber-600">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-600 rounded-lg text-white font-mono text-[10px] shrink-0">⚡ OFFLINE</span>
              <p className="text-left leading-normal">
                MODO OFFLINE SEGURO: <span className="font-medium text-slate-900">Seu sinal caiu ou você ativou a simulação. Não se preocupe! O sistema está funcionando localmente. Novas vendas, caixa, estoque e clientes serão salvos no seu aparelho e sincronizados perfeitamente na próxima conexão.</span>
              </p>
            </div>
            {offlinePendingSync.length > 0 ? (
              <span className="bg-slate-900 text-amber-400 text-[10px] px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1.5 animate-pulse">
                <span>🔄 Fila local: {offlinePendingSync.length} no WhatsApp</span>
              </span>
            ) : (
              <span className="bg-amber-600/30 text-amber-950 text-[10px] px-2.5 py-1 rounded-full shrink-0 font-extrabold uppercase">
                ✔️ Banco de Dados Local Ativo
              </span>
            )}
          </div>
        )}

        {/* Dynamic Page container */}
        <main className="flex-grow p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderCurrentView()}
        </main>
      </div>

      {/* Modern, non-blocking floating cloud synchronization widget in the bottom-right corner */}
      {isCloudSyncingOnLogin && products.length > 0 && (
        <div 
          style={{ transition: 'all 0.4s ease' }}
          className="fixed bottom-4 right-4 z-[9999] w-80 bg-slate-900 text-white font-sans rounded-2xl p-4 shadow-2xl border border-slate-800 flex flex-col gap-3 animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 block animate-ping absolute inset-0" />
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 block relative" />
              </div>
              <span className="text-[10px] font-bold tracking-wide uppercase text-slate-400">
                Sincronização Ativa ☁️
              </span>
            </div>
            <button 
              onClick={() => setIsCloudSyncingOnLogin(false)}
              className="text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded-lg transition-colors border-none bg-transparent cursor-pointer text-xs"
              title="Ocultar painel"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5 text-left">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-slate-700 border-t-pink-500 animate-spin" />
              {syncProgress.step}
            </p>
            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              "{syncProgress.details}"
            </p>
          </div>

          <div className="flex items-center gap-2 justify-between border-t border-slate-800/80 pt-2.5">
            <div className="text-[9px] text-slate-500 font-mono">
              Processado: {syncProgress.stepsCompleted.length}/8 tabelas
            </div>
            <div className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase animate-pulse">
                Segundo Plano
              </span>
            </div>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
}
