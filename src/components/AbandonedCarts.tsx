import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  MessageSquare, 
  MessageCircle,
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Sparkles, 
  Search, 
  Trash2, 
  Send, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  DollarSign,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface CheckoutItem {
  productName: string;
  productId: string;
  quantity: number;
  price: number;
  color?: string;
  size?: string;
}

interface Checkout {
  id: string;
  clientName: string;
  phone: string;
  email: string;
  items: CheckoutItem[];
  total: number;
  status: 'pendente' | 'concluido' | 'recuperado';
  createdAt: string;
  updatedAt: string;
}

interface AbandonedCartsProps {
  checkouts: Checkout[];
  setCheckouts: React.Dispatch<React.SetStateAction<Checkout[]>>;
  onSyncCheckouts?: () => void;
}

export default function AbandonedCarts({ checkouts = [], setCheckouts, onSyncCheckouts }: AbandonedCartsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'abandonados' | 'recuperados'>('todos');
  const [selectedCheckout, setSelectedCheckout] = useState<Checkout | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 15 minutes helper
  const isAbandonedMoreThan15Min = (checkout: Checkout) => {
    if (checkout.status !== 'pendente') return false;
    const createdTime = new Date(checkout.updatedAt || checkout.createdAt).getTime();
    const diffMin = (Date.now() - createdTime) / (1000 * 60);
    return diffMin >= 15;
  };

  // Filtered checkouts
  const filteredCheckouts = useMemo(() => {
    return checkouts.filter(c => {
      // Exclude checkouts that actually completed successfully ('concluido')
      if (c.status === 'concluido') return false;

      const matchesSearch = 
        c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase());

      const isAbandoned = isAbandonedMoreThan15Min(c) || c.status === 'pendente';
      
      if (filterStatus === 'abandonados') {
        return matchesSearch && isAbandoned && c.status === 'pendente';
      }
      if (filterStatus === 'recuperados') {
        return matchesSearch && c.status === 'recuperado';
      }
      return matchesSearch;
    });
  }, [checkouts, searchQuery, filterStatus]);

  // Statistics calculation
  const stats = useMemo(() => {
    let totalPending = 0;
    let totalAbandonedOver15 = 0;
    let totalRecovered = 0;
    let recoveredValue = 0;
    let lostValue = 0;

    checkouts.forEach(c => {
      if (c.status === 'concluido') return;
      
      if (c.status === 'recuperado') {
        totalRecovered++;
        recoveredValue += c.total;
      } else if (c.status === 'pendente') {
        totalPending++;
        lostValue += c.total;
        if (isAbandonedMoreThan15Min(c)) {
          totalAbandonedOver15++;
        }
      }
    });

    return {
      totalPending,
      totalAbandonedOver15,
      totalRecovered,
      recoveredValue,
      lostValue
    };
  }, [checkouts]);

  // Helper to send recovery message via backend API if WHATSAPP_API_TOKEN is configured
  const sendWhatsAppRecoveryMessage = async (checkout: Checkout, messageText: string) => {
    try {
      const response = await fetch('/api/whatsapp/recover-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkoutId: checkout.id,
          clientName: checkout.clientName,
          phone: checkout.phone,
          message: messageText
        })
      });
      const data = await response.json();
      if (data && data.success) {
        alert(`Mensagem enviada com sucesso de forma automática via API oficial do WhatsApp!`);
        return true;
      }
    } catch (e) {
      console.warn('API Whatsapp Recover error:', e);
    }
    return false;
  };

  // Helper to generate a direct wa.me link
  const getDirectWhatsAppLink = (phone: string, message: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 11 && !cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    } else if (cleanPhone.length === 10 && !cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    }
    const encodedText = encodeURIComponent(message);
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  };

  // Trigger AI WhatsApp Message Generation
  const handleGenerateRecoveryMessage = async (checkout: Checkout) => {
    setIsGenerating(true);
    setErrorMessage('');
    setGeneratedMessage('');
    setSelectedCheckout(checkout);

    try {
      const storedKey = localStorage.getItem('ap_gemini_key') || '';
      const response = await fetch('/api/gemini/recovery-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': storedKey
        },
        body: JSON.stringify({
          clientName: checkout.clientName,
          cartItems: checkout.items,
          total: checkout.total
        })
      });

      const data = await response.json();
      if (data.success) {
        const linkDoCarrinho = `${window.location.origin}/?recuperar=${checkout.id}`;
        const finalMessage = `${data.text}\n\nSegue o link para concluir: ${linkDoCarrinho}`;
        setGeneratedMessage(finalMessage);
      } else {
        setErrorMessage(data.error || 'Erro desconhecido ao acionar inteligência artificial.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro de comunicação com o servidor.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Submit and open WhatsApp Web/App
  const handleOpenWhatsApp = async (checkout: Checkout, textMessage: string) => {
    // Update checkout status to 'recuperado'
    const updatedCheckouts = checkouts.map(c => 
      c.id === checkout.id 
        ? { ...c, status: 'recuperado' as const, updatedAt: new Date().toISOString() } 
        : c
    );
    setCheckouts(updatedCheckouts);
    localStorage.setItem('ap_moda_checkouts', JSON.stringify(updatedCheckouts));

    // Try background API notification first, then fallback to direct window open
    const sentApi = await sendWhatsAppRecoveryMessage(checkout, textMessage);
    if (!sentApi) {
      const waUrl = getDirectWhatsAppLink(checkout.phone, textMessage);
      window.open(waUrl, '_blank');
    }
    
    setSelectedCheckout(null);
  };

  // Quick 1-click WhatsApp Recovery with 5% discount coupon
  const handleQuickRecoveryWhatsApp = async (checkout: Checkout) => {
    const linkDoCarrinho = `${window.location.origin}/?recuperar=${checkout.id}`;
    const message = `Olá ${checkout.clientName}, notamos que você deixou um look lindo da AP Moda Fitness salvo no seu carrinho! Quer que eu te ajude a finalizar o pedido com o seu desconto? Segue o link para concluir: ${linkDoCarrinho}`;

    // Mark as recovered
    const updatedCheckouts = checkouts.map(c => 
      c.id === checkout.id 
        ? { ...c, status: 'recuperado' as const, updatedAt: new Date().toISOString() } 
        : c
    );
    setCheckouts(updatedCheckouts);
    localStorage.setItem('ap_moda_checkouts', JSON.stringify(updatedCheckouts));

    // Try background API notification first, then fallback to direct window open
    const sentApi = await sendWhatsAppRecoveryMessage(checkout, message);
    if (!sentApi) {
      const waUrl = getDirectWhatsAppLink(checkout.phone, message);
      window.open(waUrl, '_blank');
    }
  };

  // Clear checkout record
  const handleDeleteCheckout = async (id: string) => {
    if (window.confirm('Deseja realmente arquivar/remover este registro de carrinho abandonado?')) {
      const updated = checkouts.filter(c => c.id !== id);
      setCheckouts(updated);
      localStorage.setItem('ap_moda_checkouts', JSON.stringify(updated));

      try {
        await fetch(`/api/proxy/checkouts/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Erro ao excluir checkout no servidor:', err);
      }

      if (selectedCheckout?.id === id) {
        setSelectedCheckout(null);
      }
    }
  };

  return (
    <div id="abandoned-carts-wrapper" className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2 font-sans">
            <ShoppingBag className="text-pink-600" size={18} />
            Módulo de Recuperação Inteligente de Carrinhos Abandonados (IA)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Monitore checkouts iniciados que não foram concluídos e dispare abordagens personalizadas com a inteligência do Google Gemini.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onSyncCheckouts && (
            <button
              id="sync-checkouts-btn"
              onClick={onSyncCheckouts}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} className="animate-spin-slow" />
              Sincronizar
            </button>
          )}
          <span className="px-2.5 py-1 bg-pink-50 text-pink-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
            Fase 4: Última Etapa
          </span>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aguardando Finalizar</div>
            <div className="text-xl font-extrabold text-slate-850 font-mono mt-0.5">{stats.totalPending}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Checkouts em aberto</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg animate-pulse">
            <AlertCircle size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Abandonados (+15 min)</div>
            <div className="text-xl font-extrabold text-slate-850 font-mono mt-0.5">{stats.totalAbandonedOver15}</div>
            <div className="text-[10px] text-rose-600 font-semibold mt-0.5">Alerta de recuperação ativo</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recuperados por IA</div>
            <div className="text-xl font-extrabold text-slate-850 font-mono mt-0.5">{stats.totalRecovered}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">R$ {stats.recoveredValue.toFixed(2)} salvos</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-pink-50 text-pink-600 rounded-lg">
            <DollarSign size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor em Risco</div>
            <div className="text-xl font-extrabold text-rose-600 font-mono mt-0.5">R$ {stats.lostValue.toFixed(2)}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Oportunidade de vendas</div>
          </div>
        </div>

      </div>

      {/* Main Grid: Filters, Search and List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (Span 2): Checkouts Table list */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          
          {/* List Toolbar */}
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden max-w-xs w-full px-2.5 py-1.5 items-center gap-1.5">
              <Search size={14} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por nome, WhatsApp..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-xs outline-none w-full text-slate-700"
              />
            </div>

            {/* Status filters */}
            <div className="flex items-center gap-1 bg-slate-200 p-0.5 rounded-lg text-[10px] font-bold">
              <button
                onClick={() => setFilterStatus('todos')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${filterStatus === 'todos' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterStatus('abandonados')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${filterStatus === 'abandonados' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Pendente &gt;15m
              </button>
              <button
                onClick={() => setFilterStatus('recuperados')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${filterStatus === 'recuperados' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Recuperados
              </button>
            </div>

          </div>

          {/* List Content */}
          <div className="overflow-x-auto">
            {filteredCheckouts.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag size={18} className="text-slate-400" />
                </div>
                <h3 className="text-xs font-bold text-slate-700">Nenhum carrinho encontrado</h3>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  Não há checkouts correspondentes aos filtros selecionados no momento.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Contato</th>
                    <th className="p-4">Itens</th>
                    <th className="p-4">Valor / Tempo</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCheckouts.map((c) => {
                    const isOver15 = isAbandonedMoreThan15Min(c);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/55 transition-colors text-xs text-slate-600">
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{c.clientName}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Clock size={10} />
                            Iniciado em: {new Date(c.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="p-4 space-y-0.5">
                          <div className="font-mono text-[11px] font-medium flex items-center gap-1 text-slate-700">
                            <Phone size={10} className="text-slate-400" />
                            {c.phone || 'Sem WhatsApp'}
                          </div>
                          {c.email && (
                            <div className="text-[10px] text-slate-450 flex items-center gap-1">
                              <Mail size={10} />
                              {c.email}
                            </div>
                          )}
                        </td>
                        <td className="p-4 max-w-[180px]">
                          <div className="line-clamp-2 space-y-0.5">
                            {c.items && c.items.map((it, idx) => (
                              <div key={idx} className="text-[10px] text-slate-600 truncate">
                                <span className="font-bold text-slate-700 font-mono">{it.quantity}x</span> {it.productName || 'Peça Fitness'}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-850 font-mono">R$ {c.total.toFixed(2)}</div>
                          <div className="mt-1">
                            {c.status === 'recuperado' ? (
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[9px] rounded-full uppercase tracking-wider flex items-center gap-0.5 w-max">
                                <CheckCircle size={8} /> Recuperado
                              </span>
                            ) : isOver15 ? (
                              <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 font-extrabold text-[9px] rounded-full uppercase tracking-wider flex items-center gap-0.5 w-max animate-pulse">
                                <AlertCircle size={8} /> Abandono (+15m)
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 font-bold text-[9px] rounded-full uppercase tracking-wider flex items-center gap-0.5 w-max">
                                <Clock size={8} /> Pendente recente
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleQuickRecoveryWhatsApp(c)}
                              className="px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-xs hover:scale-102 border-none"
                              title="Recuperação Rápida (Mensagem Automática + Cupom 5% em 1 Clique)"
                            >
                              <MessageCircle size={11} />
                              <span>Recuperação Rápida (5% OFF)</span>
                            </button>
                            <button
                              id={`recover-btn-${c.id}`}
                              onClick={() => handleGenerateRecoveryMessage(c)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-xs hover:scale-102"
                              title="Gerar Abordagem Personalizada com IA"
                            >
                              <Sparkles size={11} />
                              Recuperar via WhatsApp
                            </button>
                            <button
                              onClick={() => handleDeleteCheckout(c.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              title="Remover Registro"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        </div>

        {/* Right Column: AI Conversation Message Generator Workspace */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="text-pink-600 animate-pulse" size={14} />
              Área de Abordagem IA (Gemini)
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">
              Selecione um cliente ao lado para criar uma mensagem personalizada, amigável e persuasiva.
            </p>
          </div>

          {selectedCheckout ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              
              <div className="space-y-3.5">
                {/* Client brief */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Cliente em Atendimento</div>
                  <div className="font-extrabold text-slate-800 text-xs mt-0.5">{selectedCheckout.clientName}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{selectedCheckout.phone}</div>
                  
                  {/* Cart preview */}
                  <div className="mt-2.5 border-t border-slate-200/60 pt-2">
                    <div className="text-[9px] font-bold text-slate-400 uppercase">Itens da Sacola:</div>
                    <div className="space-y-1 mt-1 max-h-[100px] overflow-y-auto">
                      {selectedCheckout.items && selectedCheckout.items.map((it, idx) => (
                        <div key={idx} className="text-[10px] text-slate-700 flex justify-between font-sans">
                          <span>{it.quantity}x {it.productName || 'Peça'}</span>
                          <span className="font-mono text-slate-500">R$ {it.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-right font-mono font-bold text-[11px] text-slate-800 mt-1.5">
                      Total: R$ {selectedCheckout.total.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* AI Working State */}
                {isGenerating ? (
                  <div className="p-8 text-center bg-pink-50/20 border border-dashed border-pink-200 rounded-xl space-y-3">
                    <Loader2 size={24} className="text-pink-600 animate-spin mx-auto" />
                    <div className="text-xs font-bold text-slate-700">Google Gemini estruturando roteiro...</div>
                    <p className="text-[10px] text-slate-450 leading-relaxed max-w-[220px] mx-auto">
                      Analisando primeiro nome, as peças esquecidas e desenhando uma abordagem calorosa, empática e sem tom robótico.
                    </p>
                  </div>
                ) : errorMessage ? (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
                    <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                      <AlertCircle size={14} />
                      Falha ao gerar com IA
                    </div>
                    <p className="text-[10px] text-rose-600 leading-relaxed">
                      {errorMessage}
                    </p>
                    <button
                      onClick={() => handleGenerateRecoveryMessage(selectedCheckout)}
                      className="px-2.5 py-1 bg-white text-rose-700 text-[10px] font-bold border border-rose-200 rounded-md hover:bg-rose-50 transition-all cursor-pointer"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                ) : generatedMessage ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mensagem Persuasiva Gerada por IA:</label>
                    <textarea
                      value={generatedMessage}
                      onChange={(e) => setGeneratedMessage(e.target.value)}
                      rows={10}
                      className="w-full text-xs text-slate-700 bg-emerald-50/15 border border-slate-200 rounded-lg p-3 font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
                    />
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Sparkles size={11} className="text-emerald-500" />
                      Você pode revisar ou editar o texto livremente antes de disparar.
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <button
                      id="ai-generate-first-btn"
                      onClick={() => handleGenerateRecoveryMessage(selectedCheckout)}
                      className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-md mx-auto"
                    >
                      <Sparkles size={13} />
                      Gerar Abordagem com IA
                    </button>
                  </div>
                )}
              </div>

              {/* Confirm send button */}
              {generatedMessage && !isGenerating && (
                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenWhatsApp(selectedCheckout, generatedMessage)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <Send size={13} />
                    Abrir WhatsApp &amp; Iniciar Recuperação
                  </button>
                </div>
              )}

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center mb-3 animate-pulse">
                <Sparkles size={20} />
              </div>
              <h4 className="text-xs font-bold text-slate-700">Selecione um cliente para começar</h4>
              <p className="text-[10px] text-slate-450 mt-1 max-w-[180px] mx-auto">
                Dispararemos uma análise inteligente e personalizada sobre o primeiro nome e produtos esquecidos.
              </p>
            </div>
          )}

          {/* AI Blueprint details section */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/60 text-[10px] text-slate-500 leading-relaxed space-y-1.5 font-sans">
            <div className="font-bold text-slate-700 flex items-center gap-1">
              <AlertCircle size={12} className="text-pink-600" />
              Modelo de Prompt Estruturado:
            </div>
            <p className="italic">
              "Você é a Consultora da 'AP Moda Fitness' ... use o primeiro nome ... demonstre entusiasmo pelas peças escolhidas ... ofereça incentivo delicado ... sem tom robótico."
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
