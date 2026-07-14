/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  ShoppingBag, 
  Package, 
  Users, 
  DollarSign, 
  Menu, 
  X,
  Sparkles,
  Percent,
  CheckSquare,
  Truck,
  HelpCircle,
  Briefcase,
  TrendingUp,
  Sliders,
  BadgeAlert,
  Bot,
  Target,
  Search,
  Star,
  Gift,
  Compass,
  Award,
  Calendar,
  RefreshCcw,
  Instagram,
  Coins,
  FileText,
  MessageCircle,
  Sun,
  LogOut,
  Building2,
  CreditCard
} from 'lucide-react';
import { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  lowStockCount: number;
  onOpenDriverPortal?: () => void;
  themeAccent: 'neon' | 'verde' | 'roxo' | 'rosa';
  setThemeAccent: (accent: 'neon' | 'verde' | 'roxo' | 'rosa') => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  currentUser?: any;
  onLogout?: () => void;
  onSetOrdersLogisticsSubTab?: (subTab: 'pedidos' | 'trocas_crediario' | 'logistica' | 'condicional') => void;
  onSetCustomersCRMSubTab?: (subTab: 'diretorio' | 'funil' | 'followup' | 'parceiros' | 'fidelidade') => void;
  onSetSuppliersManagementSubTab?: (subTab: 'fornecedores' | 'compras') => void;
  onSetProductsSubTab?: (subTab: 'inventario' | 'restoque' | 'cadastro') => void;
  onSetLojaOnlineSubTab?: (subTab: 'compartilhar' | 'cupons' | 'vitrine' | 'recuperacao' | 'marketing') => void;
  onSetAiAgentsHubSubTab?: (subTab: 'descritor' | 'estilista' | 'whatsapp' | 'sentinela' | 'campanha' | 'consultoria' | 'tradutor' | 'precificador') => void;
  onSetGoogleWorkspaceSubTab?: (subTab: 'agenda' | 'tarefas' | 'docs' | 'gmail' | 'sheets' | 'drive' | 'config') => void;
  onSetSettingsSystemSubTab?: (subTab: 'empresa' | 'integracoes' | 'seguranca' | 'roadmap' | 'vitrine') => void;
  activeOrdersLogisticsSubTab?: 'pedidos' | 'trocas_crediario' | 'logistica' | 'condicional';
  activeCustomersCRMSubTab?: 'diretorio' | 'funil' | 'followup' | 'parceiros' | 'fidelidade';
  activeSuppliersManagementSubTab?: 'fornecedores' | 'compras';
  activeProductsSubTab?: 'inventario' | 'restoque' | 'cadastro';
  activeLojaOnlineSubTab?: 'compartilhar' | 'cupons' | 'vitrine' | 'recuperacao' | 'marketing';
  activeAiAgentsHubSubTab?: 'descritor' | 'estilista' | 'whatsapp' | 'sentinela' | 'campanha' | 'consultoria' | 'tradutor' | 'precificador';
  activeGoogleWorkspaceSubTab?: 'agenda' | 'tarefas' | 'docs' | 'gmail' | 'sheets' | 'drive' | 'config';
  activeSettingsSystemSubTab?: 'empresa' | 'integracoes' | 'seguranca' | 'roadmap' | 'vitrine';
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen, 
  lowStockCount, 
  onOpenDriverPortal,
  themeAccent,
  setThemeAccent,
  darkMode,
  setDarkMode,
  currentUser,
  onLogout,
  onSetOrdersLogisticsSubTab,
  onSetCustomersCRMSubTab,
  onSetSuppliersManagementSubTab,
  onSetProductsSubTab,
  onSetLojaOnlineSubTab,
  onSetAiAgentsHubSubTab,
  onSetGoogleWorkspaceSubTab,
  onSetSettingsSystemSubTab,
  activeOrdersLogisticsSubTab,
  activeCustomersCRMSubTab,
  activeSuppliersManagementSubTab,
  activeProductsSubTab,
  activeLojaOnlineSubTab,
  activeAiAgentsHubSubTab,
  activeGoogleWorkspaceSubTab,
  activeSettingsSystemSubTab
}: SidebarProps) {
  const [logoUrl, setLogoUrl] = useState(() => {
    return localStorage.getItem('ap_store_logo') || '';
  });

  useEffect(() => {
    const checkLogo = () => {
      const currentLogo = localStorage.getItem('ap_store_logo') || '';
      if (currentLogo !== logoUrl) {
        setLogoUrl(currentLogo);
      }
    };
    window.addEventListener('storage', checkLogo);
    const interval = setInterval(checkLogo, 1000);
    return () => {
      window.removeEventListener('storage', checkLogo);
      clearInterval(interval);
    };
  }, [logoUrl]);

  const [searchTerm, setSearchTerm] = useState('');
  const [menuMode, setMenuMode] = useState<'classico' | 'agrupado'>(() => {
    return (localStorage.getItem('ap_store_sidebar_mode') as 'classico' | 'agrupado') || 'classico';
  });

  const menuItems = menuMode === 'classico' ? [
    {
      group: 'PRINCIPAL',
      items: [
        { id: 'DASHBOARD', label: 'Dashboard Geral', icon: LayoutDashboard, keywords: 'painel index geral metricas graficos', tab: ActiveTab.DASHBOARD },
        { id: 'DASHBOARD_EXECUTIVO', label: 'Dashboard Executivo', icon: BarChart3, keywords: 'bi executivo dashboard relatorios', tab: ActiveTab.DASHBOARD_EXECUTIVO },
        { id: 'DASHBOARD_PERFORMANCE_ANALYTICS', label: 'Dashboard de Desempenho (Analytics)', icon: TrendingUp, keywords: 'analytics desempenho provador carrinhos vendas conversao', tab: ActiveTab.DASHBOARD_PERFORMANCE_ANALYTICS },
        { id: 'METAS', label: 'Simulador de Metas', icon: Target, keywords: 'metas simulador simulacao', tab: ActiveTab.METAS }
      ]
    },
    {
      group: 'VENDAS',
      items: [
        { id: 'PDV', label: 'PDV / Caixa', icon: DollarSign, keywords: 'pdv caixa registrar venda balcao terminal', tab: ActiveTab.PDV },
        { id: 'VENDAS', label: 'Histórico de Vendas', icon: Percent, keywords: 'vendas cupons descontos historico relatorio', tab: ActiveTab.VENDAS },
        { id: 'PEDIDOS_COMPLETOS', label: 'Pedidos & Sacolas', icon: ShoppingBag, keywords: 'pedidos sacola instagram internet', tab: ActiveTab.PEDIDOS, subTab: 'pedidos' },
        { id: 'PEDIDOS_DEVOLUCOES', label: 'Devoluções & Crediário', icon: RefreshCcw, keywords: 'devolucoes trocas crediario quitacao', tab: ActiveTab.PEDIDOS, subTab: 'trocas_crediario' },
        { id: 'PEDIDOS_CONDICIONAL', label: 'Mala de Condicional', icon: Briefcase, keywords: 'condicional sacola casa mala prova provador', tab: ActiveTab.PEDIDOS, subTab: 'condicional' }
      ]
    },
    {
      group: 'CATÁLOGO & ESTOQUE',
      items: [
        { id: 'ESTOQUE', label: 'Estoque / Produtos', icon: Package, badge: lowStockCount > 0 ? lowStockCount : undefined, keywords: 'produtos estoque catalogo sku mercadorias pecas', tab: ActiveTab.PRODUTOS, subTab: 'inventario' },
        { id: 'FORNECEDORES_CADASTRO', label: 'Parceiros Fornecedores', icon: Building2, keywords: 'fornecedores cadastrar parceiros', tab: ActiveTab.FORNECEDORES, subTab: 'fornecedores' },
        { id: 'FORNECEDORES_COMPRAS', label: 'Compras & Suprimentos', icon: Truck, keywords: 'compras suprimentos reposicao insumos', tab: ActiveTab.FORNECEDORES, subTab: 'compras' }
      ]
    },
    {
      group: 'CLIENTES',
      items: [
        { id: 'CLIENTES_DIRETORIO', label: 'Diretório de Clientes', icon: Users, keywords: 'clientes crm fichario contatos', tab: ActiveTab.CLIENTES, subTab: 'diretorio' },
        { id: 'CLIENTES_FUNIL', label: 'Funil de Vendas (NPS)', icon: TrendingUp, keywords: 'funil kanban leads oportunidades pipeline', tab: ActiveTab.CLIENTES, subTab: 'funil' },
        { id: 'CLIENTES_REGUA', label: 'Cobranças & Follow-ups', icon: CheckSquare, keywords: 'recobranca followup pos-vendas', tab: ActiveTab.CLIENTES, subTab: 'followup' },
        { id: 'CLIENTES_EMBAIXADORES', label: 'Programa de Embaixadores', icon: Award, keywords: 'influenciadores afiliados parceiros marketing', tab: ActiveTab.CLIENTES, subTab: 'parceiros' },
        { id: 'CLIENTES_FIDELIDADE', label: 'Clube Fidelidade & Cashback', icon: Coins, keywords: 'fidelidade cashback pontos clube bonus premium vip', tab: ActiveTab.CLIENTES, subTab: 'fidelidade' }
      ]
    },
    {
      group: 'LOGÍSTICA',
      items: [
        { id: 'PEDIDOS_LOGISTICA', label: 'Painel de Logística', icon: Compass, keywords: 'logistica entregas entregador rota de despacho', tab: ActiveTab.PEDIDOS, subTab: 'logistica' }
      ]
    },
    {
      group: 'FINANCEIRO',
      items: [
        { id: 'FINANCEIRO_CAIXA', label: 'Fluxo de Caixa & Contas', icon: Coins, keywords: 'financeiro accounts contas caixa transacoes', tab: ActiveTab.FINANCEIRO },
        { id: 'METODOS_PAGAMENTO', label: 'Métodos de Pagamento', icon: CreditCard, keywords: 'pagamento pix specie maquininha cartao vitrine', tab: ActiveTab.METODOS_PAGAMENTO }
      ]
    },
    {
      group: 'VITRINE ONLINE',
      items: [
        { id: 'LOJA_ONLINE', label: 'Loja Online (Vitrine)', icon: ShoppingBag, keywords: 'site e-commerce vitrine loja online', tab: ActiveTab.LOJA_ONLINE }
      ]
    },
    {
      group: 'INTELIGÊNCIA & IA',
      items: [
        { id: 'AGENTES_IA', label: 'Copilotos & Agentes IA', icon: Bot, keywords: 'ia inteligente agentes robo whatsapp bot assistente', tab: ActiveTab.AGENTES_IA },
        { id: 'GOOGLE_WORKSPACE', label: 'Workspace Google', icon: Calendar, keywords: 'google agenda gmail docs spreadsheets drive tasks tarefas planilhas workspace', tab: ActiveTab.GOOGLE_WORKSPACE }
      ]
    },
    {
      group: 'CONFIGURAÇÕES',
      items: [
        { id: 'CONFIGURACOES', label: 'Configurações do Sistema', icon: Sliders, keywords: 'configuracoes api integracao webhook token database', tab: ActiveTab.CONFIGURACOES }
      ]
    }
  ] : [
    {
      group: 'PRINCIPAL',
      items: [
        { id: 'DASHBOARD', label: 'Dashboard Geral', icon: LayoutDashboard, keywords: 'painel index geral metricas graficos', tab: ActiveTab.DASHBOARD },
        { id: 'DASHBOARD_EXECUTIVO', label: 'Dashboard Executivo', icon: BarChart3, keywords: 'bi executivo dashboard relatorios', tab: ActiveTab.DASHBOARD_EXECUTIVO },
        { id: 'DASHBOARD_PERFORMANCE_ANALYTICS', label: 'Dashboard de Desempenho (Analytics)', icon: TrendingUp, keywords: 'analytics desempenho provador carrinhos vendas conversao', tab: ActiveTab.DASHBOARD_PERFORMANCE_ANALYTICS },
        { id: 'METAS', label: 'Simulador de Metas', icon: Target, keywords: 'metas simulador simulacao', tab: ActiveTab.METAS }
      ]
    },
    {
      group: 'VENDAS',
      items: [
        { id: 'PDV', label: 'PDV / Caixa', icon: DollarSign, keywords: 'pdv caixa registrar venda balcao terminal', tab: ActiveTab.PDV },
        { id: 'VENDAS', label: 'Histórico de Vendas', icon: Percent, keywords: 'vendas cupons descontos historico relatorio', tab: ActiveTab.VENDAS },
        { 
          id: 'PEDIDOS', 
          label: 'Pedidos & Sacolas', 
          icon: ShoppingBag, 
          keywords: 'pedidos sacola instagram internet troca devolucoes', 
          tab: ActiveTab.PEDIDOS, 
          subLinks: [
            { label: 'Controle de Pedidos', subTab: 'pedidos' },
            { label: 'Devoluções & Crediário', subTab: 'trocas_crediario' },
            { label: 'Sacola Condicional', subTab: 'condicional' },
            { label: 'Painel de Logística', subTab: 'logistica' }
          ]
        }
      ]
    },
    {
      group: 'CATÁLOGO & ESTOQUE',
      items: [
        { 
          id: 'ESTOQUE', 
          label: 'Estoque / Produtos', 
          icon: Package, 
          badge: lowStockCount > 0 ? lowStockCount : undefined, 
          keywords: 'produtos estoque catalogo sku mercadorias pecas', 
          tab: ActiveTab.PRODUTOS,
          subLinks: [
            { label: 'Inventário de Peças', subTab: 'inventario' },
            { label: 'Entrada & Restoque', subTab: 'restoque' },
            { label: 'Cadastro de Modelos', subTab: 'cadastro' }
          ]
        },
        { 
          id: 'FORNECEDORES', 
          label: 'Fornecedores', 
          icon: Building2, 
          keywords: 'fornecedores cadastrar parceiros compras suprimentos', 
          tab: ActiveTab.FORNECEDORES, 
          subLinks: [
            { label: 'Parceiros Fornecedores', subTab: 'fornecedores' },
            { label: 'Compras & Suprimentos', subTab: 'compras' }
          ]
        }
      ]
    },
    {
      group: 'CLIENTES',
      items: [
        { 
          id: 'CLIENTES', 
          label: 'Clientes / CRM VIP', 
          icon: Users, 
          keywords: 'clientes crm fichario contatos', 
          tab: ActiveTab.CLIENTES, 
          subLinks: [
            { label: 'Diretório de Clientes', subTab: 'diretorio' },
            { label: 'Funil de Vendas (NPS)', subTab: 'funil' },
            { label: 'Cobranças & Follow-ups', subTab: 'followup' },
            { label: 'Programa de Embaixadores', subTab: 'parceiros' },
            { label: 'Clube Fidelidade & Cashback', subTab: 'fidelidade' }
          ]
        }
      ]
    },
    {
      group: 'FINANCEIRO',
      items: [
        { id: 'FINANCEIRO_CAIXA', label: 'Fluxo de Caixa & Contas', icon: Coins, keywords: 'financeiro accounts contas caixa transacoes', tab: ActiveTab.FINANCEIRO },
        { id: 'METODOS_PAGAMENTO', label: 'Métodos de Pagamento', icon: CreditCard, keywords: 'pagamento pix specie maquininha cartao vitrine', tab: ActiveTab.METODOS_PAGAMENTO }
      ]
    },
    {
      group: 'VITRINE ONLINE',
      items: [
        { 
          id: 'LOJA_ONLINE', 
          label: 'Loja Online (Vitrine)', 
          icon: ShoppingBag, 
          keywords: 'site e-commerce vitrine loja online links cupons', 
          tab: ActiveTab.LOJA_ONLINE,
          subLinks: [
            { label: 'Compartilhar Bio & Link', subTab: 'compartilhar' },
            { label: 'Cupons de Desconto', subTab: 'cupons' },
            { label: 'Vitrine Mobile & Campanhas', subTab: 'vitrine' },
            { label: 'Carrinhos Abandonados (IA)', subTab: 'recuperacao' },
            { label: 'Central de Marketing & Vendas', subTab: 'marketing' }
          ]
        }
      ]
    },
    {
      group: 'INTELIGÊNCIA & IA',
      items: [
        { 
          id: 'AGENTES_IA', 
          label: 'Copilotos & Agentes IA', 
          icon: Bot, 
          keywords: 'ia inteligente agentes robo whatsapp bot assistente', 
          tab: ActiveTab.AGENTES_IA,
          subLinks: [
            { label: 'Redator de Peças VIP', subTab: 'descritor' },
            { label: 'Estilista Lookbook', subTab: 'estilista' },
            { label: 'Copiloto WhatsApp', subTab: 'whatsapp' },
            { label: 'Sentinela de Estoque', subTab: 'sentinela' },
            { label: 'Planejador de Campanhas', subTab: 'campanha' },
            { label: 'Combinação de Cores', subTab: 'consultoria' },
            { label: 'Tradutor de Moda', subTab: 'tradutor' },
            { label: 'Precificador Inteligente', subTab: 'precificador' }
          ]
        },
        { 
          id: 'GOOGLE_WORKSPACE', 
          label: 'Workspace Google', 
          icon: Calendar, 
          keywords: 'google agenda gmail docs spreadsheets drive tasks tarefas planilhas workspace', 
          tab: ActiveTab.GOOGLE_WORKSPACE,
          subLinks: [
            { label: 'Status da Conta Google', subTab: 'config' },
            { label: 'Agenda Google', subTab: 'agenda' },
            { label: 'Google Tasks (Tarefas)', subTab: 'tarefas' },
            { label: 'Google Docs', subTab: 'docs' },
            { label: 'Gmail Inbox', subTab: 'gmail' },
            { label: 'Google Sheets', subTab: 'sheets' },
            { label: 'Google Drive', subTab: 'drive' }
          ]
        }
      ]
    },
    {
      group: 'CONFIGURAÇÕES',
      items: [
        { 
          id: 'CONFIGURACOES', 
          label: 'Configurações do Sistema', 
          icon: Sliders, 
          keywords: 'configuracoes api integracao webhook token database', 
          tab: ActiveTab.CONFIGURACOES,
          subLinks: [
            { label: 'Dados da Boutique & Logo', subTab: 'empresa' },
            { label: 'Bancos de Dados & APIs', subTab: 'integracoes' },
            { label: 'Hierarquia, Usuários & Auditoria', subTab: 'seguranca' },
            { label: 'Roadmap de Tecnologia', subTab: 'roadmap' },
            { label: 'Vitrine & Design Geral', subTab: 'vitrine' }
          ]
        }
      ]
    }
  ];

  const filteredMenuItems = menuItems.map(group => {
    let items = group.items;
    
    // Limit views for salespeople
    if (currentUser?.role === 'Vendedor') {
      const allowedSellersTabs = [ActiveTab.PDV, ActiveTab.CLIENTES, ActiveTab.METAS];
      items = items.filter(it => allowedSellersTabs.includes(it.tab)).map(item => {
        if (item.tab === ActiveTab.METAS) {
          return { ...item, label: 'Minhas Metas & Comissões' };
        }
        return item;
      });
    }

    // Limit views for managers (Gerente) - Oculta as abas críticas de infra e TI
    if (currentUser?.role === 'Gerente') {
      const hiddenGerenteTabs = [ActiveTab.CONFIGURACOES, ActiveTab.GOOGLE_WORKSPACE, ActiveTab.AGENTES_IA];
      items = items.filter(it => !hiddenGerenteTabs.includes(it.tab));
    }

    items = items.filter(item => {
      const term = searchTerm.toLowerCase();
      const matchLabel = item.label.toLowerCase().includes(term);
      const matchGroup = group.group.toLowerCase().includes(term);
      const matchKeywords = item.keywords ? item.keywords.toLowerCase().includes(term) : false;
      const matchSubLinks = item.subLinks ? item.subLinks.some(sub => sub.label.toLowerCase().includes(term)) : false;
      return matchLabel || matchGroup || matchKeywords || matchSubLinks;
    });
    return { ...group, items };
  }).filter(group => group.items.length > 0);

  const getActiveSubTabForTab = (tab: ActiveTab): string | undefined => {
    switch (tab) {
      case ActiveTab.PEDIDOS:
        return activeOrdersLogisticsSubTab;
      case ActiveTab.CLIENTES:
        return activeCustomersCRMSubTab;
      case ActiveTab.FORNECEDORES:
        return activeSuppliersManagementSubTab;
      case ActiveTab.PRODUTOS:
        return activeProductsSubTab;
      case ActiveTab.LOJA_ONLINE:
        return activeLojaOnlineSubTab;
      case ActiveTab.AGENTES_IA:
        return activeAiAgentsHubSubTab;
      case ActiveTab.GOOGLE_WORKSPACE:
        return activeGoogleWorkspaceSubTab;
      case ActiveTab.CONFIGURACOES:
        return activeSettingsSystemSubTab;
      default:
        return undefined;
    }
  };

  const handleTabClick = (tabId: ActiveTab, subTabId?: string) => {
    setActiveTab(tabId);
    
    if (subTabId) {
      if (tabId === ActiveTab.PEDIDOS && onSetOrdersLogisticsSubTab) {
        onSetOrdersLogisticsSubTab(subTabId as any);
      } else if (tabId === ActiveTab.CLIENTES && onSetCustomersCRMSubTab) {
        onSetCustomersCRMSubTab(subTabId as any);
      } else if (tabId === ActiveTab.FORNECEDORES && onSetSuppliersManagementSubTab) {
        onSetSuppliersManagementSubTab(subTabId as any);
      } else if (tabId === ActiveTab.PRODUTOS && onSetProductsSubTab) {
        onSetProductsSubTab(subTabId as any);
      } else if (tabId === ActiveTab.LOJA_ONLINE && onSetLojaOnlineSubTab) {
        onSetLojaOnlineSubTab(subTabId as any);
      } else if (tabId === ActiveTab.AGENTES_IA && onSetAiAgentsHubSubTab) {
        onSetAiAgentsHubSubTab(subTabId as any);
      } else if (tabId === ActiveTab.GOOGLE_WORKSPACE && onSetGoogleWorkspaceSubTab) {
        onSetGoogleWorkspaceSubTab(subTabId as any);
      } else if (tabId === ActiveTab.CONFIGURACOES && onSetSettingsSystemSubTab) {
        onSetSettingsSystemSubTab(subTabId as any);
      }
    }
    
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const selectColorTheme = (theme: 'neon' | 'verde' | 'roxo' | 'rosa') => {
    setThemeAccent(theme);
    setDarkMode(true);
  };

  const selectLightTheme = () => {
    setDarkMode(false);
    setThemeAccent('rosa');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          id="sidebar-backdrop"
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside 
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-50 transition-all duration-300 transform 
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 overflow-y-auto scrollbar-thin`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-pink-500/20 overflow-hidden">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="Logo AP Moda Fitness" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                      const parent = (e.target as HTMLElement).parentElement;
                      if (parent) {
                        parent.innerHTML = '<span class="font-bold text-lg text-white">AP</span>';
                      }
                    }}
                  />
                ) : (
                  "AP"
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-white font-bold text-sm tracking-wide truncate">{localStorage.getItem('ap_store_name') || 'AP Moda Fitness'}</h1>
                <p className="text-slate-400 text-[9px] font-mono tracking-wider font-semibold uppercase truncate">Gestão Completa</p>
              </div>
            </div>
            <button 
              id="close-sidebar-btn"
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Slogan */}
          <div className="text-[8px] text-slate-500 font-extrabold font-mono tracking-wider mb-3 leading-tight select-none uppercase">
            {localStorage.getItem('ap_store_slogan') || 'Onde o seu limite vira ponto de partida'}
          </div>

          {/* Dynamic Theme row matching video: Neon, Verde, Roxo, Claro */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <button 
              onClick={() => selectColorTheme('neon')}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded bg-slate-950/30 border text-[9px] font-sans font-bold transition-all cursor-pointer ${
                themeAccent === 'neon' && darkMode
                  ? 'border-cyan-500/80 bg-cyan-500/10 text-cyan-400 shadow-sm' 
                  : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mb-1" />
              <span>Neon</span>
            </button>
            <button 
              onClick={() => selectColorTheme('verde')}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded bg-slate-950/30 border text-[9px] font-sans font-bold transition-all cursor-pointer ${
                themeAccent === 'verde' && darkMode
                  ? 'border-emerald-500/80 bg-emerald-500/10 text-emerald-400 shadow-sm' 
                  : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mb-1" />
              <span>Verde</span>
            </button>
            <button 
              onClick={() => selectColorTheme('roxo')}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded bg-slate-950/30 border text-[9px] font-sans font-bold transition-all cursor-pointer ${
                themeAccent === 'roxo' && darkMode
                  ? 'border-purple-500/80 bg-purple-500/10 text-purple-400 shadow-sm' 
                  : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mb-1" />
              <span>Roxo</span>
            </button>
            <button 
              onClick={selectLightTheme}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded bg-slate-950/30 border text-[9px] font-sans font-bold transition-all cursor-pointer ${
                !darkMode 
                  ? 'border-amber-400/80 bg-amber-400/10 text-amber-500 shadow-sm' 
                  : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mb-1" />
              <span>Claro</span>
            </button>
          </div>
        </div>

        {/* Intelligent Search Input */}
        <div className="px-3 pt-3 pb-2 border-b border-slate-800/40 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar aba ou recurso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/45 text-slate-200 placeholder-slate-500 text-[11px] font-sans pl-8 pr-7 py-1.5 rounded-lg border border-slate-800 focus:border-pink-500/50 focus:bg-slate-950/90 focus:ring-0 transition-all outline-none"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-[10px] text-slate-500 hover:text-slate-350 font-bold uppercase tracking-wider bg-transparent border-0 outline-none"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Menu Mode Toggle */}
        <div className="px-3 pb-2 border-b border-slate-800/20 shrink-0">
          <div className="bg-slate-950/60 p-0.5 rounded-lg flex items-center gap-1 border border-slate-800/80">
            <button
              id="sidebar-btn-mode-classic"
              type="button"
              onClick={() => {
                setMenuMode('classico');
                localStorage.setItem('ap_store_sidebar_mode', 'classico');
              }}
              className={`flex-1 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border-0 outline-none
                ${menuMode === 'classico'
                  ? 'bg-pink-600 text-white shadow font-bold'
                  : 'text-slate-500 hover:text-slate-300 bg-transparent'
                }`}
            >
              Clássico (Todos)
            </button>
            <button
              id="sidebar-btn-mode-grouped"
              type="button"
              onClick={() => {
                setMenuMode('agrupado');
                localStorage.setItem('ap_store_sidebar_mode', 'agrupado');
              }}
              className={`flex-1 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border-0 outline-none
                ${menuMode === 'agrupado'
                  ? 'bg-pink-600 text-white shadow font-bold'
                  : 'text-slate-500 hover:text-slate-300 bg-transparent'
                }`}
            >
              Agrupados
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto min-h-0">
          {filteredMenuItems.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <span className="px-3 text-[9px] font-bold text-slate-500 tracking-wider font-sans uppercase">
                {group.group}
              </span>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const hasSubLinks = menuMode === 'agrupado' && item.subLinks && item.subLinks.length > 0;
                  const activeSubTab = getActiveSubTabForTab(item.tab);
                  
                  // Main item is active if it matches activeTab in modern mode, or if matched in classic mode
                  const isParentAccent = activeTab === item.tab;

                  // Active highlight calculation logic
                  const isClassicActive = activeTab === item.tab && (
                    !(item as any).subTab || 
                    (item.tab === ActiveTab.PEDIDOS && activeOrdersLogisticsSubTab === (item as any).subTab) ||
                    (item.tab === ActiveTab.CLIENTES && activeCustomersCRMSubTab === (item as any).subTab) ||
                    (item.tab === ActiveTab.FORNECEDORES && activeSuppliersManagementSubTab === (item as any).subTab) ||
                    (item.tab === ActiveTab.PRODUTOS && activeProductsSubTab === (item as any).subTab)
                  );

                  const isActive = menuMode === 'classico' ? isClassicActive : isParentAccent;

                  // Sub-links to display (filter if search term is active)
                  const matchingSubLinks = item.subLinks 
                    ? item.subLinks.filter(sub => sub.label.toLowerCase().includes(searchTerm.toLowerCase()))
                    : [];
                  const subLinksToRender = searchTerm ? matchingSubLinks : (item.subLinks || []);

                  return (
                    <li key={item.id} className="space-y-0.5">
                      <button
                         id={`sidebar-btn-${item.id}`}
                         onClick={() => {
                           if (menuMode === 'agrupado' && hasSubLinks && item.subLinks && item.subLinks.length > 0) {
                             handleTabClick(item.tab, item.subLinks[0].subTab);
                           } else {
                             handleTabClick(item.tab, (item as any).subTab);
                           }
                         }}
                         className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all duration-250 group cursor-pointer border-0 text-left outline-none bg-transparent
                           ${isActive 
                             ? menuMode === 'classico' || !hasSubLinks
                               ? 'bg-pink-600 text-white shadow-sm shadow-pink-500/10 font-bold' 
                               : 'bg-slate-800/40 text-white font-bold' 
                             : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                           }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <item.icon size={15} className={isActive ? (menuMode === 'agrupado' && hasSubLinks ? 'text-pink-500' : 'text-white') : 'text-slate-400 group-hover:text-pink-400 transition-colors'} />
                          <span>{item.label}</span>
                        </div>

                        {(item as any).badge !== undefined && (
                          <span className="bg-amber-500/20 text-amber-400 font-bold px-1.5 py-0.5 rounded-full text-[10px] animate-pulse">
                            {(item as any).badge}
                          </span>
                        )}
                      </button>

                      {/* Expanded & Indented sub-links */}
                      {hasSubLinks && subLinksToRender.length > 0 && (
                        <ul className="pl-6 pt-0.5 pb-1 space-y-0.5 border-l border-slate-800/60 ml-4.5">
                          {subLinksToRender.map((subLink, subIdx) => {
                            const isSubActive = activeTab === item.tab && activeSubTab === subLink.subTab;
                            
                            return (
                              <li key={subIdx}>
                                <button
                                  id={`sidebar-sub-btn-${item.id}-${subIdx}`}
                                  type="button"
                                  onClick={() => handleTabClick(item.tab, subLink.subTab)}
                                  className={`w-full flex items-center gap-2 px-3 py-1 rounded text-[11px] font-medium font-sans border-0 text-left outline-none cursor-pointer transition-all duration-150
                                    ${isSubActive 
                                      ? 'text-pink-400 font-bold bg-slate-850/40' 
                                      : 'text-slate-400 hover:text-white hover:bg-slate-850/10'
                                    }`}
                                >
                                  <span className={`w-1 h-1 rounded-full shrink-0 transition-colors ${isSubActive ? 'bg-pink-500' : 'bg-slate-650'}`} />
                                  <span className="truncate">{subLink.label}</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {filteredMenuItems.length === 0 && (
            <div className="px-3 py-10 text-center">
              <p className="text-slate-500 text-xs font-medium mb-2">Nenhuma aba corresponde à busca</p>
              <button 
                onClick={() => setSearchTerm('')}
                className="text-pink-500 hover:text-pink-400 text-[10px] font-bold uppercase tracking-wider underline cursor-pointer bg-transparent border-0"
              >
                Ver Todas as Abas
              </button>
            </div>
          )}
        </nav>

        {/* Isolated Driver Mode Gateway Button */}
        {onOpenDriverPortal && (
          <div className="px-3 pb-3">
            <button
              onClick={onOpenDriverPortal}
              className="w-full py-2.5 px-3 bg-pink-700 hover:bg-pink-800 text-white font-extrabold text-[11px] rounded-lg tracking-wide shadow-md shadow-pink-900/40 flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer hover:shadow-lg active:scale-95 border-0"
            >
              <span>🏍️ MODO ENTREGADOR APP</span>
            </button>
          </div>
        )}

        {/* User Footer / Pro Brand */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-pink-600/30 border border-pink-500/40 flex items-center justify-center text-pink-400 font-bold text-xs shrink-0 select-none uppercase">
                {currentUser?.name ? currentUser.name.slice(0, 2) : 'AP'}
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-white text-[11px] font-bold truncate leading-tight">
                  {currentUser?.name || "Administrador"}
                </p>
                <p className="text-slate-500 text-[9px] truncate leading-tight font-mono uppercase font-semibold">
                  {currentUser?.role || "ADMIN LEVEL"}
                </p>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Efetuar Logout / Trocar de Usuário"
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-pink-500 transition-all cursor-pointer border-none bg-transparent shrink-0 outline-none"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
