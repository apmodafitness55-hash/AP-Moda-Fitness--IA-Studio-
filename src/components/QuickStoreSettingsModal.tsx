/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Phone, 
  Instagram, 
  Store, 
  QrCode, 
  MapPin, 
  Check, 
  ExternalLink, 
  Loader2, 
  Sparkles,
  MessageCircle
} from 'lucide-react';
import { getStoreConfig, saveStoreConfig, formatWhatsAppNumber, formatInstagramHandle } from '../utils/storeConfig';

interface QuickStoreSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickStoreSettingsModal({ isOpen, onClose }: QuickStoreSettingsModalProps) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [instagram, setInstagram] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [slogan, setSlogan] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load latest configurations when modal opens
  useEffect(() => {
    if (isOpen) {
      const cfg = getStoreConfig();
      setPhone(cfg.phone || '');
      setName(cfg.name || '');
      setInstagram(cfg.instagram || '');
      setPixKey(cfg.pixKey || '');
      setAddress(cfg.address || '');
      setCity(cfg.city || '');
      setState(cfg.state || '');
      setSlogan(cfg.slogan || '');
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cleanPhone = formatWhatsAppNumber(phone);
  const testWhatsAppUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Olá! Teste de WhatsApp da ' + (name || 'loja'))}`;
  const cleanInsta = formatInstagramHandle(instagram).replace('@', '');
  const testInstaUrl = `https://www.instagram.com/${cleanInsta}/`;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      alert('Por favor, informe o telefone de contato / WhatsApp da loja.');
      return;
    }

    setIsSaving(true);
    try {
      const updates: Record<string, string> = {
        ap_store_phone: phone.trim(),
        ap_store_name: name.trim() || 'AP2 Moda Fitness',
        ap_store_instagram: instagram.trim(),
        ap_pix_key: pixKey.trim(),
        ap_store_address: address.trim(),
        ap_store_city: city.trim(),
        ap_store_state: state.trim(),
        ap_store_slogan: slogan.trim()
      };

      await saveStoreConfig(updates);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      alert('Erro ao salvar configurações: ' + (err?.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <MessageCircle size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Dados da Loja & WhatsApp</h3>
              <p className="text-[11px] text-pink-100 font-medium">Altere telefone, Instagram e Pix sem burocracia</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-all cursor-pointer border-none"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form id="quick-store-settings-form" onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto text-xs text-slate-700 font-sans flex-1">
          {/* Notification on success */}
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 font-bold animate-in fade-in">
              <Check size={16} className="text-emerald-600" />
              <span>Dados da loja atualizados com sucesso na nuvem e no site!</span>
            </div>
          )}

          {/* 1. Telefone / WhatsApp de Contato */}
          <div className="space-y-1.5 bg-pink-50/50 p-3.5 rounded-xl border border-pink-200">
            <div className="flex items-center justify-between">
              <label className="text-pink-900 font-extrabold uppercase text-[10px] tracking-wide flex items-center gap-1.5">
                <Phone size={13} className="text-pink-600" />
                Telefone / WhatsApp de Contato Oficial *
              </label>
              {phone && (
                <a 
                  href={testWhatsAppUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 transition-all"
                >
                  <span>Testar WhatsApp</span>
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
            <input 
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: (84) 99198-2963 ou 84991982963"
              className="w-full px-3 py-2 bg-white border border-pink-300 rounded-lg text-sm font-mono font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
            />
            <div className="flex items-center justify-between text-[9.5px] text-slate-500 pt-0.5">
              <span>Este número receberá mensagens de pedidos e botões do WhatsApp.</span>
              <button
                type="button"
                onClick={() => setPhone('(84) 99198-2963')}
                className="text-pink-600 hover:underline font-bold bg-transparent border-0 cursor-pointer p-0"
              >
                Restaurar Padrão
              </button>
            </div>
          </div>

          {/* 2. Nome da Loja */}
          <div className="space-y-1">
            <label className="text-slate-600 font-bold uppercase text-[9.5px] tracking-wide flex items-center gap-1.5">
              <Store size={13} className="text-slate-500" />
              Nome da Loja
            </label>
            <input 
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: AP2 Moda Fitness"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden focus:border-pink-500"
            />
          </div>

          {/* 3. Instagram Oficial */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-600 font-bold uppercase text-[9.5px] tracking-wide flex items-center gap-1.5">
                <Instagram size={13} className="text-pink-600" />
                Instagram Oficial (@usuario ou link)
              </label>
              {instagram && (
                <a 
                  href={testInstaUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-pink-700 hover:text-pink-800 flex items-center gap-1 bg-pink-50 hover:bg-pink-100 px-2 py-0.5 rounded-md border border-pink-200 transition-all"
                >
                  <span>Abrir Instagram</span>
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
            <input 
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="Ex: @ap_moda_fitness2"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 focus:outline-hidden focus:border-pink-500"
            />
          </div>

          {/* 4. Chave Pix Oficial */}
          <div className="space-y-1">
            <label className="text-slate-600 font-bold uppercase text-[9.5px] tracking-wide flex items-center gap-1.5">
              <QrCode size={13} className="text-emerald-600" />
              Chave Pix Oficial da Loja
            </label>
            <input 
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="Ex: 67.074.681/0001-03 ou celular ou e-mail"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 focus:outline-hidden focus:border-pink-500"
            />
          </div>

          {/* 5. Endereço & Localização */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-3 space-y-1">
              <label className="text-slate-600 font-bold uppercase text-[9.5px] tracking-wide flex items-center gap-1.5">
                <MapPin size={13} className="text-rose-500" />
                Endereço da Loja
              </label>
              <input 
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Travessa Jose Jorge, 51, Centro"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:border-pink-500"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide block">Cidade</label>
              <input 
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Sao Jose de Mipibu"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:border-pink-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide block">Estado (UF)</label>
              <input 
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="RN"
                maxLength={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold font-mono text-slate-800 uppercase focus:outline-hidden focus:border-pink-500 text-center"
              />
            </div>
          </div>

          {/* 6. Slogan */}
          <div className="space-y-1">
            <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide block">Slogan da Loja</label>
            <input 
              type="text"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder="Ex: Onde o seu limite vira ponto de partida"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:border-pink-500"
            />
          </div>
        </form>

        {/* Sticky Action Footer (Always Visible on Laptop/Notebook displays) */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex gap-2.5 shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-all cursor-pointer border border-slate-250 text-center text-xs shadow-2xs"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            form="quick-store-settings-form"
            disabled={isSaving}
            className="flex-1 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold rounded-xl transition-all shadow-md shadow-pink-600/20 cursor-pointer border-none flex items-center justify-center gap-1.5 text-xs disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Salvando na Nuvem...</span>
              </>
            ) : (
              <>
                <Check size={15} />
                <span>Salvar Dados Agora</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
