/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { pushSystemConfigToFirebase } from '../firebase';
import { 
  CreditCard, 
  QrCode, 
  DollarSign, 
  Save, 
  Settings, 
  Sparkles, 
  Tv, 
  Check, 
  Plus, 
  Trash2, 
  HelpCircle, 
  Info, 
  Cpu, 
  Zap, 
  ToggleLeft, 
  ToggleRight 
} from 'lucide-react';

export interface CardTerminal {
  id: string;
  name: string;
  brand: string; // e.g. 'Stone', 'PagSeguro', 'Cielo', 'Mercado Pago'
  serialNumber?: string;
  status: 'Ativo' | 'Inativo';
  notes?: string;
}

export interface StorefrontPaymentConfigData {
  pixActive: boolean;
  pixKey: string;
  pixKeyType: string;
  pixDiscountPercent: number;
  pixInstructions: string;
  
  cardActive: boolean;
  cardMaxInstallments: number;
  cardMinInstallmentAmount: number;
  cardGateway: string;
  
  cashActive: boolean; // Dinheiro / espécie na entrega ou retirada
  cashInstructions: string;
}

export default function StorefrontPaymentConfig() {
  // Config data state
  const [config, setConfig] = useState<StorefrontPaymentConfigData>(() => {
    const saved = localStorage.getItem('ap_moda_payment_config');
    if (saved) return JSON.parse(saved);
    return {
      pixActive: true,
      pixKey: 'apmodafitness55@gmail.com',
      pixKeyType: 'E-mail',
      pixDiscountPercent: 5,
      pixInstructions: 'Copie o código Pix copia e cola ou escaneie o QR Code no seu banco para pagar instantaneamente. Depois nos envie o comprovante no WhatsApp.',
      
      cardActive: true,
      cardMaxInstallments: 6,
      cardMinInstallmentAmount: 30,
      cardGateway: 'AP Rede Gateway SSL',
      
      cashActive: true,
      cashInstructions: 'Pague em dinheiro físico diretamente no momento de retirada no showroom/local ou na entrega via motoboy.'
    };
  });

  // Card reader terminals state
  const [terminals, setTerminals] = useState<CardTerminal[]>(() => {
    const saved = localStorage.getItem('ap_moda_card_terminals');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'term-1', name: 'Maquininha Presencial Stone AP01', brand: 'Stone Verde T3', serialNumber: 'ST-90182-AA', status: 'Ativo', notes: 'Fica com o motoboy principal do showroom.' },
      { id: 'term-2', name: 'Leitor Point Pro Mercado Pago', brand: 'Mercado Pago', serialNumber: 'MP-88210-BC', status: 'Ativo', notes: 'Utilizada no caixa do ponto de venda físico.' },
      { id: 'term-3', name: 'Minizinha Chip 3 PagSeguro', brand: 'PagSeguro', serialNumber: 'PS-10293-XZ', status: 'Inativo', notes: 'Reserva para eventos e feiras fitness.' }
    ];
  });

  // Keep state synced
  useEffect(() => {
    localStorage.setItem('ap_moda_payment_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('ap_moda_card_terminals', JSON.stringify(terminals));
  }, [terminals]);

  // Terminal form states
  const [isAddTerminalOpen, setIsAddTerminalOpen] = useState(false);
  const [termName, setTermName] = useState('');
  const [termBrand, setTermBrand] = useState('Stone Verde T3');
  const [termSerial, setTermSerial] = useState('');
  const [termNotes, setTermNotes] = useState('');

  // Listen for cloud sync changes
  useEffect(() => {
    const handleStorageSynced = () => {
      console.log('[StorefrontPaymentConfig] Sincronizando dados locais a partir do localStorage.');
      const savedConfig = localStorage.getItem('ap_moda_payment_config');
      if (savedConfig) {
        try {
          setConfig(JSON.parse(savedConfig));
        } catch (e) {}
      }
      const savedTerminals = localStorage.getItem('ap_moda_card_terminals');
      if (savedTerminals) {
        try {
          setTerminals(JSON.parse(savedTerminals));
        } catch (e) {}
      }
    };

    window.addEventListener('ap-storage-synced', handleStorageSynced);
    return () => window.removeEventListener('ap-storage-synced', handleStorageSynced);
  }, []);

  // Handle saving configurations
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const handleSaveConfig = async () => {
    const jsonStr = JSON.stringify(config);
    localStorage.setItem('ap_moda_payment_config', jsonStr);
    
    // Also push to Firebase
    await pushSystemConfigToFirebase('ap_moda_payment_config', jsonStr);

    // Also retroactively mirror / keep in sync company_info pixKey and ap_pix_key for backwards compatibility
    try {
      localStorage.setItem('ap_pix_key', config.pixKey);
      await pushSystemConfigToFirebase('ap_pix_key', config.pixKey);

      const companyInfoSaved = localStorage.getItem('ap_moda_company_info');
      const parsed = companyInfoSaved ? JSON.parse(companyInfoSaved) : {};
      parsed.pixKey = config.pixKey;
      const updatedCompanyStr = JSON.stringify(parsed);
      localStorage.setItem('ap_moda_company_info', updatedCompanyStr);
      await pushSystemConfigToFirebase('ap_moda_company_info', updatedCompanyStr);
    } catch (e) {
      console.error('Failed to sync legacy company info:', e);
    }

    setIsSavedSuccess(true);
    setTimeout(() => setIsSavedSuccess(false), 3000);
    alert('Configurações de formas de pagamentos da Vitrine salvas e sincronizadas na nuvem com sucesso!');
  };

  // Handle adding card reader terminal
  const handleAddTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termName.trim()) return;

    const newTerm: CardTerminal = {
      id: `term-${Date.now()}`,
      name: termName.trim(),
      brand: termBrand,
      serialNumber: termSerial.trim() || undefined,
      status: 'Ativo',
      notes: termNotes.trim() || undefined
    };

    const updated = [...terminals, newTerm];
    setTerminals(updated);
    localStorage.setItem('ap_moda_card_terminals', JSON.stringify(updated));
    await pushSystemConfigToFirebase('ap_moda_card_terminals', JSON.stringify(updated));

    setIsAddTerminalOpen(false);
    setTermName('');
    setTermSerial('');
    setTermNotes('');
  };

  // Handle deleting card reader terminal
  const handleDeleteTerminal = async (id: string) => {
    if (confirm('Deseja excluir este terminal de maquininha do cadastro?')) {
      const updated = terminals.filter(t => t.id !== id);
      setTerminals(updated);
      localStorage.setItem('ap_moda_card_terminals', JSON.stringify(updated));
      await pushSystemConfigToFirebase('ap_moda_card_terminals', JSON.stringify(updated));
    }
  };

  const toggleTerminalStatus = async (id: string) => {
    const updated = terminals.map(t => t.id === id ? { ...t, status: (t.status === 'Ativo' ? 'Inativo' : 'Ativo') as 'Ativo' | 'Inativo' } : t);
    setTerminals(updated);
    localStorage.setItem('ap_moda_card_terminals', JSON.stringify(updated));
    await pushSystemConfigToFirebase('ap_moda_card_terminals', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100/80 shadow-xs text-left">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-sky-50 border border-sky-100 text-sky-600 rounded-xl">
            <Settings size={22} className="animate-spin duration-10000" />
          </div>
          <div className="space-y-0.5 leading-snug">
            <h1 className="text-slate-800 font-extrabold text-base tracking-tight uppercase">Métodos de Pagamento da Vitrine</h1>
            <p className="text-slate-500 text-[11px] font-medium leading-none">Configure chaves Pix, parcelamentos de cartão de crédito e as maquininhas de entrega</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveConfig}
          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-pink-600/10 active:scale-95 border-0"
        >
          <Save size={14} />
          <span>{isSavedSuccess ? 'Configurações Salvas!' : 'Salvar Alterações'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Direct Configurations of Storefront Checkout */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* SECTION 1: PIX PAYMENT METHOD */}
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs text-left">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <QrCode size={16} className="text-emerald-600 animate-pulse" />
                <span className="font-extrabold text-xs text-slate-800 uppercase tracking-tight">1. Pagamento Digital via PIX</span>
              </div>
              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, pixActive: !prev.pixActive }))}
                className="focus:outline-hidden bg-transparent border-0 cursor-pointer"
              >
                {config.pixActive ? (
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded-full uppercase tracking-wider border border-emerald-100">Ativo</span>
                ) : (
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-400 text-[9px] font-black rounded-full uppercase tracking-wider border border-slate-200">Desabilitado</span>
                )}
              </button>
            </div>

            {config.pixActive && (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-1">Chave Pix Comercial *</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: apmodafitness55@gmail.com"
                      value={config.pixKey}
                      onChange={(e) => setConfig(prev => ({ ...prev, pixKey: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-1">Tipo de Chave Pix</label>
                    <select
                      value={config.pixKeyType}
                      onChange={(e) => setConfig(prev => ({ ...prev, pixKeyType: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500 cursor-pointer text-slate-750 font-bold"
                    >
                      <option value="E-mail">E-mail Comercial</option>
                      <option value="CNPJ">CNPJ da Empresa</option>
                      <option value="Celular">Telefone / Celular</option>
                      <option value="CPF">CPF da Titular</option>
                      <option value="Chave Aleatória">Chave Aleatória (EVP)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-1"> % Desconto Extra p/ Pix</label>
                    <div className="flex items-center bg-slate-50 border border-slate-250 rounded-lg overflow-hidden pr-3">
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        value={config.pixDiscountPercent}
                        onChange={(e) => setConfig(prev => ({ ...prev, pixDiscountPercent: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-1.5 bg-transparent border-none text-xs font-mono font-bold text-emerald-600 outline-none"
                      />
                      <span className="text-xs font-bold text-slate-400 shrink-0 select-none">% OFF</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-1">Instruções de Pix aos Clientes</label>
                  <textarea 
                    rows={2}
                    value={config.pixInstructions}
                    onChange={(e) => setConfig(prev => ({ ...prev, pixInstructions: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500 font-sans"
                  />
                  <span className="text-[8.5px] text-slate-400 block mt-1 leading-tight">
                    💡 Esse texto é apresentado na vitrine para orientar o comprador após ele escolher a opção de PIX.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: CREDIT CARD PAYMENT METHOD */}
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs text-left">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-pink-600" />
                <span className="font-extrabold text-xs text-slate-800 uppercase tracking-tight">2. Cartão de Crédito Online (Gateway)</span>
              </div>
              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, cardActive: !prev.cardActive }))}
                className="focus:outline-hidden bg-transparent border-0 cursor-pointer"
              >
                {config.cardActive ? (
                  <span className="px-2.5 py-1 bg-pink-50 text-pink-700 text-[9px] font-black rounded-full uppercase tracking-wider border border-pink-100">Ativo</span>
                ) : (
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-400 text-[9px] font-black rounded-full uppercase tracking-wider border border-slate-200">Desabilitado</span>
                )}
              </button>
            </div>

            {config.cardActive && (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-1">Máximo de Parcelas Permitidas</label>
                    <select
                      value={config.cardMaxInstallments}
                      onChange={(e) => setConfig(prev => ({ ...prev, cardMaxInstallments: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500 cursor-pointer text-slate-750 font-bold"
                    >
                      <option value="1">1x (Somente à vista)</option>
                      <option value="2">Até 2x sem juros</option>
                      <option value="3">Até 3x sem juros</option>
                      <option value="4">Até 4x sem juros</option>
                      <option value="5">Até 5x sem juros</option>
                      <option value="6">Até 6x sem juros</option>
                      <option value="10">Até 10x sem juros</option>
                      <option value="12">Até 12x sem juros</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-1">Valor Mínimo da Parcela (R$)</label>
                    <input 
                      type="number"
                      min="5"
                      value={config.cardMinInstallmentAmount}
                      onChange={(e) => setConfig(prev => ({ ...prev, cardMinInstallmentAmount: parseFloat(e.target.value) || 30 }))}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-1">Marca/Gateway do Processador</label>
                    <input 
                      type="text"
                      placeholder="Ex: Rede SSL Gateway"
                      value={config.cardGateway}
                      onChange={(e) => setConfig(prev => ({ ...prev, cardGateway: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500"
                    />
                  </div>
                </div>

                <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 flex gap-2.5 items-start">
                  <Info size={14} className="text-sky-600 shrink-0 mt-0.5 animate-bounce" />
                  <p className="text-[10px] text-sky-700 font-medium leading-normal">
                    🔒 <strong>Segurança SSL Integrada:</strong> Os dados de cartão simulados na vitrine passam por auditoria antifraude e os pedidos são sinalizados instantaneamente no dashboard administrativo com as parcelas calculadas automaticamente.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: CASH PAYMENT METHOD / LOCAL PICKUP */}
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs text-left">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-slate-650" />
                <span className="font-extrabold text-xs text-slate-800 uppercase tracking-tight">3. Espécie (Dinheiro) na Entrega ou Retirada</span>
              </div>
              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, cashActive: !prev.cashActive }))}
                className="focus:outline-hidden bg-transparent border-0 cursor-pointer"
              >
                {config.cashActive ? (
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded-full uppercase tracking-wider border border-emerald-100">Ativo</span>
                ) : (
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-400 text-[9px] font-black rounded-full uppercase tracking-wider border border-slate-200">Desabilitado</span>
                )}
              </button>
            </div>

            {config.cashActive && (
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-1">Diretrizes de Pagamento Presencial</label>
                  <textarea 
                    rows={2}
                    value={config.cashInstructions}
                    onChange={(e) => setConfig(prev => ({ ...prev, cashInstructions: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500 font-sans"
                  />
                  <span className="text-[8.5px] text-slate-400 block mt-1 leading-tight">
                    💡 Ideal para quando o cliente seleciona "Retirada no Local" ou "Entrega por Motoboy" e prefere pagar fisicamente na entrega.
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Physical Card Terminal Registration ("Maquininhas") */}
        <div className="space-y-6 text-left">
          
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Tv size={15} className="text-pink-600 animate-pulse" />
                <span className="font-extrabold text-xs text-slate-800 uppercase tracking-tight">Maquininhas de Cartão</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddTerminalOpen(true)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-950 text-white font-bold text-[8.5px] uppercase tracking-wider rounded-md cursor-pointer border-0"
              >
                + Adicionar
              </button>
            </div>

            <div className="p-4 space-y-3.5">
              
              <p className="text-[9.5px] text-slate-500 font-semibold leading-normal">
                Faça o controle de rastreio das suas maquininhas de cartão levadas pelos motoboys ou fixas no PDV:
              </p>

              {terminals.length > 0 ? (
                <div className="space-y-3">
                  {terminals.map(term => (
                    <div 
                      key={term.id} 
                      className={`border p-3 rounded-xl transition duration-150 space-y-2
                        ${term.status === 'Ativo' ? 'bg-white border-slate-150' : 'bg-slate-50 border-slate-200'}`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <div>
                          <h4 className="font-extrabold text-[#111111] text-xs leading-none">{term.name}</h4>
                          <span className="inline-block px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-550 text-[7px] font-black rounded-sm uppercase tracking-wide font-mono mt-1.5 leading-none">
                            {term.brand}
                          </span>
                        </div>
                        
                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleTerminalStatus(term.id)}
                            className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded-xs cursor-pointer border-0 outline-none
                              ${term.status === 'Ativo' 
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                          >
                            {term.status}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTerminal(term.id)}
                            className="p-1 px-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-sm border-0 cursor-pointer outline-none"
                            title="Deletar Maquininha"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>

                      {term.serialNumber && (
                        <p className="text-[8.5px] text-slate-500 font-mono tracking-wider">
                          Nº de Série: <strong>{term.serialNumber}</strong>
                        </p>
                      )}

                      {term.notes && (
                        <div className="bg-slate-50 p-1.5 text-[9px] text-slate-500 border border-slate-100 rounded-md">
                          {term.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/20">
                  <Cpu size={24} className="text-slate-350 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider font-mono">Nenhuma maquininha cadastrada</p>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

      {/* MODAL: ADD TERMINAL */}
      {isAddTerminalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-lg overflow-hidden animate-in fade-in duration-200 text-left">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <span className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Tv size={13} className="text-pink-500" /> Nova Maquininha de Cartão
              </span>
              <button 
                onClick={() => setIsAddTerminalOpen(false)}
                className="text-slate-400 hover:text-white font-bold uppercase text-[9px] bg-transparent border-none cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleAddTerminalSubmit} className="p-5 space-y-3 font-sans">
              <div>
                <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-0.5">Identificação / Apelido *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Stone Moto 01"
                  value={termName}
                  onChange={(e) => setTermName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-0.5">Operadora / Modelo</label>
                <select
                  value={termBrand}
                  onChange={(e) => setTermBrand(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500 cursor-pointer text-slate-700"
                >
                  <option value="Stone Verde T3">Stone Verde T3</option>
                  <option value="Mercado Pago Pro">Mercado Pago Pro</option>
                  <option value="PagSeguro Moderninha">PagSeguro Moderninha</option>
                  <option value="Cielo Lio">Cielo Lio</option>
                  <option value="Rede Smart Tap">Rede Smart Tap</option>
                  <option value="SumUp Solo">SumUp Solo</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-0.5">Número de Série (S/N)</label>
                <input 
                  type="text"
                  placeholder="Ex: SN-10294-88A"
                  value={termSerial}
                  onChange={(e) => setTermSerial(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500 font-mono text-[11px] tracking-wider"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-0.5">Observações / Quem utiliza</label>
                <input 
                  type="text"
                  placeholder="Ex: Fica sob responsabilidade do motoboy Júlio."
                  value={termNotes}
                  onChange={(e) => setTermNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTerminalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-550 border border-slate-200 rounded-lg font-bold text-[10.5px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-extrabold text-[10.5px] uppercase tracking-wide cursor-pointer border-0 shadow-sm"
                >
                  Cadastrar Maquininha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
