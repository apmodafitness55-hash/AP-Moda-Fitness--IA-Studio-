/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

export const metadata = { robots: { index: false, follow: false } };
import { Lock, User, Shield, Users, Truck, Eye, EyeOff, Award, Sparkles } from 'lucide-react';
import { Client } from '../types';

interface LoginScreenProps {
  sellers: string[];
  motoboys: string[];
  clients?: Client[];
  teamMembers?: any[];
  onLogin: (user: { 
    name: string; 
    role: 'Admin' | 'Gerente' | 'Vendedor' | 'Parceiro' | 'Entregador' | 'Cliente'; 
    details?: any;
    supabaseData?: any;
  }) => void;
}

export default function LoginScreen({ sellers, motoboys, clients = [], teamMembers = [], onLogin }: LoginScreenProps) {
  const [role, setRole] = useState<'Admin' | 'Gerente' | 'Vendedor' | 'Parceiro' | 'Entregador' | 'Cliente'>('Admin');
  
  // Clean states - always empty on load to guarantee pristine secure state
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sincroniza e reseta os inputs ao trocar de perfil de acesso
  useEffect(() => {
    setErrorMsg('');
    setLoginInput('');
    setPassword('');
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const targetLogin = loginInput.trim();
    const targetPassword = password.trim();

    if (!targetLogin) {
      setErrorMsg(role === 'Cliente' ? 'Por favor, informe suas credenciais.' : 'Por favor, informe seu login de usuário.');
      return;
    }

    if (!targetPassword) {
      setErrorMsg(role === 'Cliente' ? 'Por favor, informe seu telefone ou senha de validação.' : 'Por favor, informe sua senha secreta de acesso.');
      return;
    }

    // Client/Customer VIP Portal login logic
    if (role === 'Cliente') {
      const cleanPhoneInput = (str: string) => str.replace(/\D/g, '');
      const cleanInput = cleanPhoneInput(targetLogin);
      const targetLoginLower = targetLogin.toLowerCase();

      const matchedClient = (clients || []).find(c => {
        const cPhone = cleanPhoneInput(c.phone || '');
        const matchesLogin = 
          c.email?.trim().toLowerCase() === targetLoginLower ||
          (c.cpf && cleanPhoneInput(c.cpf) === cleanInput) ||
          cPhone === cleanInput ||
          c.name?.trim().toLowerCase() === targetLoginLower;
          
        if (!matchesLogin) return false;
        
        // Match validation / password
        const pwdClean = cleanPhoneInput(targetPassword);
        const matchesPwd = 
          targetPassword.toLowerCase() === c.email?.trim().toLowerCase() ||
          cPhone === pwdClean ||
          (c.cpf && cleanPhoneInput(c.cpf) === pwdClean) ||
          targetPassword === '123' || // Standard test password
          targetPassword === (c.phone || '').trim();
          
        return matchesPwd;
      });

      if (!matchedClient) {
        setErrorMsg('Cliente não encontrado ou dados de validação incorretos (Dica: Use seu WhatsApp cadastrado e a senha padrão 123).');
        return;
      }

      onLogin({
        name: matchedClient.name,
        role: 'Cliente',
        details: matchedClient,
        supabaseData: matchedClient
      });
      return;
    }

    // Standard staff/team members login logic
    const authenticatedUser = teamMembers.find(m => 
      m.login.toLowerCase() === targetLogin.toLowerCase() && 
      m.role === role
    );

    // Special master bypass for Ana Paula Admin to prevent device/localStorage discrepancies
    const isMasterAdmin = 
      role === 'Admin' && 
      targetLogin.toLowerCase() === 'admin' && 
      [
        'admin123', 
        'apb1695*', 
        'ap81695*', 
        'ap01695*', 
        'apb1695', 
        'ap81695',
        'ap01695',
        'admin'
      ].includes(targetPassword.toLowerCase());

    if (!authenticatedUser) {
      // If master bypass, login with a virtual admin user
      if (isMasterAdmin) {
        const virtualAdmin = { id: 'usr-1', name: 'Ana Paula Admin', login: 'admin', role: 'Admin', details: 'Administradora Geral' };
        onLogin({
          name: 'Ana Paula Admin',
          role: 'Admin',
          details: virtualAdmin,
          supabaseData: virtualAdmin
        });
        return;
      }
      setErrorMsg('Senha ou login de profissional inválido para o nível selecionado.');
      return;
    }

    if (authenticatedUser.password !== targetPassword && !isMasterAdmin) {
      setErrorMsg('Senha ou login de profissional inválido para o nível selecionado.');
      return;
    }

    onLogin({
      name: authenticatedUser.name,
      role: authenticatedUser.role,
      details: authenticatedUser,
      supabaseData: authenticatedUser
    });
    return;
  };

  const getRoleIcon = (r: typeof role) => {
    switch (r) {
      case 'Admin': return <Shield size={16} />;
      case 'Gerente': return <Users size={16} />;
      case 'Vendedor': return <User size={16} />;
      case 'Parceiro': return <Award size={16} />;
      case 'Entregador': return <Truck size={16} />;
      case 'Cliente': return <Sparkles size={16} />;
    }
  };

  const roleLabels: Record<typeof role, string> = {
    Admin: 'Administrador',
    Gerente: 'Gerente',
    Vendedor: 'Vendedora / Staff',
    Parceiro: 'Parceiro / Influenciador',
    Entregador: 'Entregador / Motoboy',
    Cliente: 'Cliente VIP / Club'
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-pink-500 selection:text-white">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(219,39,119,0.08),transparent_50%)] pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col gap-6">
        {/* Top brand header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 bg-pink-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-xl shadow-pink-500/20">
            AP
          </div>
          <div>
            <h2 className="text-white font-bold text-lg tracking-wide">AP Moda Fitness</h2>
            <p className="text-slate-404 text-xs">Pórtico Integrado • Controle de Equipe & Acessos</p>
          </div>
        </div>

        {/* Role tabs */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          {(['Admin', 'Gerente', 'Vendedor', 'Cliente', 'Parceiro', 'Entregador'] as const).map((r) => {
            const isActive = role === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                title={roleLabels[r]}
                className={`py-2 rounded-lg flex flex-col items-center justify-center gap-1 text-[9px] font-bold transition-all cursor-pointer border-0 outline-none
                  ${isActive 
                    ? 'bg-pink-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'}`}
              >
                {getRoleIcon(r)}
                <span className="text-[8px] tracking-wide select-none truncate max-w-full px-0.5">{r}</span>
              </button>
            );
          })}
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-pink-950/25 border border-pink-900/40 rounded-2xl text-[10.5px] leading-relaxed text-center text-pink-300">
            {role === 'Cliente' ? (
              <>
                💎 Portal de Fidelidade: <strong className="text-pink-105 uppercase">Clube VIP Moda Fitness</strong>
                <div className="mt-1 flex items-center justify-center gap-1.5 text-slate-400 font-medium text-[9.5px]">
                  Consulte seu saldo de Cashback, biometria sugerida e histórico de compras.
                </div>
              </>
            ) : (
              <>
                🔒 Nível selecionado: <strong className="text-pink-100 uppercase">{roleLabels[role]}</strong>
                <div className="mt-1 flex items-center justify-center gap-1.5 text-slate-400 font-medium text-[9.5px]">
                  Por favor, insira o seu login de acesso e sua senha secreta.
                </div>
              </>
            )}
          </div>

          {/* User login field */}
          <div className="space-y-1.5 text-xs text-left">
            <label className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">
              {role === 'Cliente' ? 'Identificação do Cliente' : 'Login do Profissional'}
            </label>
            <input
              type="text"
              required
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder={role === 'Cliente' ? 'Digite seu E-mail, CPF ou WhatsApp cadastrado...' : 'Digite seu usuário de login...'}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-white font-medium focus:outline-none focus:border-pink-500 transition-all font-mono placeholder:text-slate-700"
            />
          </div>

          {/* Password field */}
          <div className="space-y-1.5 text-xs text-left">
            <label className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">
              {role === 'Cliente' ? 'Sua Senha (Telefone Cadastrado)' : 'Senha de Acesso'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={role === 'Cliente' ? 'Digite seu número ou a senha padrão 123...' : 'Insira a sua senha...'}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 pr-10 text-white font-medium focus:outline-none focus:border-pink-500 transition-all font-mono placeholder:text-slate-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-white transition-colors cursor-pointer bg-transparent border-0 outline-none"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {role === 'Cliente' && (
              <span className="text-[9px] text-slate-500 font-medium block mt-1 leading-normal">
                💡 Dica de acesso rápido: Você pode usar a sua senha de demonstração padrão <strong>123</strong>.
              </span>
            )}
          </div>

          {errorMsg && (
            <p className="text-rose-500 text-[10.5px] font-bold text-center animate-bounce leading-tight">
              ⚠️ {errorMsg}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 text-white font-extrabold rounded-xl transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer bg-pink-600 hover:bg-pink-700 shadow-pink-600/10 border-0 text-center flex items-center justify-center gap-1 leading-none"
          >
            {role === 'Cliente' ? <Sparkles size={14} /> : null}
            {role === 'Cliente' ? 'Acessar Meu Painel VIP' : 'Entrar no Painel'}
          </button>
        </form>

        {/* Footer brand terms */}
        <div className="text-center font-mono text-[9px] text-slate-500 select-none border-t border-slate-800/40 pt-3">
          SISTEMA DE SEGURANÇA AP MODA • VERSÃO 5.0 LIVE
        </div>
      </div>
    </div>
  );
}
