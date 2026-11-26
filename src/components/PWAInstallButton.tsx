import React, { useState, useEffect, useCallback } from 'react';
import { Download, Smartphone, X, CheckCircle2, RefreshCw, ExternalLink } from 'lucide-react';
import type { BeforeInstallPromptEvent } from '../main';
import { showToast } from '../lib/uiDialog';

interface PWAInstallButtonProps {
  className?: string;
  mode?: 'painel' | 'loja' | 'auto';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className,
  mode = 'auto',
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    return typeof window !== 'undefined' ? window.__apDeferredInstallPrompt || null : null;
  });
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      Boolean(window.__apPWAInstalled) ||
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  });
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);

  const isPainelMode =
    mode === 'painel' ||
    (mode === 'auto' &&
      typeof window !== 'undefined' &&
      /^\/(painel|admin|login)(\/|$)/.test(window.location.pathname));

  useEffect(() => {
    const checkStandalone = () => {
      const standalone =
        Boolean(window.__apPWAInstalled) ||
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(standalone);
    };

    checkStandalone();

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
    setIsAndroid(/android/.test(ua));

    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    if (window.__apDeferredInstallPrompt) {
      setDeferredPrompt(window.__apDeferredInstallPrompt);
    }

    // If user landed back from reloading /painel?install_painel=1, clean query param cleanly
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('install_painel')) {
        url.searchParams.delete('install_painel');
        window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
        if (window.__apDeferredInstallPrompt) {
          showToast('Pronto! Toque em "Baixar App Painel" para concluir a instalação.', 'info', 4000);
        }
      }
    } catch {}

    const syncPrompt = () => {
      setDeferredPrompt(window.__apDeferredInstallPrompt || null);
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__apDeferredInstallPrompt = promptEvent;
      window.__apDeferredInstallPromptManifest =
        document.querySelector('link[rel="manifest"]')?.getAttribute('href') || null;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      window.__apPWAInstalled = true;
      window.__apDeferredInstallPrompt = null;
      window.__apDeferredInstallPromptManifest = null;
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowGuideModal(false);
    };

    const displayModeMedia = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => checkStandalone();

    window.addEventListener('ap-pwa-prompt-ready', syncPrompt);
    window.addEventListener('ap-pwa-installed', handleAppInstalled);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    displayModeMedia.addEventListener?.('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('ap-pwa-prompt-ready', syncPrompt);
      window.removeEventListener('ap-pwa-installed', handleAppInstalled);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      displayModeMedia.removeEventListener?.('change', handleDisplayModeChange);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    // If installing Painel Admin, guarantee Chrome is bound to /painel-manifest.webmanifest (not storefront "/")
    if (isPainelMode) {
      const boundManifest = window.__apDeferredInstallPromptManifest || '';
      const onPainelPath = /^\/(painel|admin|login)(\/|$)/.test(window.location.pathname);
      const isPromptBoundToStorefront =
        boundManifest && !boundManifest.includes('painel-manifest');

      if (!onPainelPath || isPromptBoundToStorefront) {
        showToast('Preparando instalador exclusivo do Painel Administrativo...', 'info', 2500);
        window.location.assign('/painel?install_painel=1');
        return;
      }
    }

    const promptToUse = deferredPrompt || window.__apDeferredInstallPrompt || null;

    if (promptToUse) {
      try {
        setIsPrompting(true);
        await promptToUse.prompt();
        const choice = await promptToUse.userChoice;
        if (choice.outcome === 'accepted') {
          window.__apPWAInstalled = true;
          window.__apDeferredInstallPrompt = null;
          window.__apDeferredInstallPromptManifest = null;
          setIsInstalled(true);
          setDeferredPrompt(null);
          showToast(
            isPainelMode
              ? 'Aplicativo AP2 Painel Admin instalado com sucesso!'
              : 'Aplicativo AP2 Moda Fitness instalado com sucesso!',
            'success',
            5000
          );
        } else {
          window.__apDeferredInstallPrompt = null;
          window.__apDeferredInstallPromptManifest = null;
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.warn('[PWA Install] Erro ao disparar prompt nativo:', err);
        setShowGuideModal(true);
      } finally {
        setIsPrompting(false);
      }
      return;
    }

    setShowGuideModal(true);
  }, [deferredPrompt, isPainelMode]);

  const handleRefreshForPainelInstall = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.update().catch(() => {})));
      }
      showToast('Recarregando Painel para liberar o instalador...', 'info', 2500);
      setTimeout(() => {
        window.location.assign(isPainelMode ? '/painel?install_painel=1' : '/');
      }, 350);
    } catch {
      window.location.assign(isPainelMode ? '/painel' : '/');
    }
  };

  if (isInstalled) {
    return null;
  }

  const appDisplayName = isPainelMode ? 'AP2 Painel Admin' : 'AP2 Moda Fitness';

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        disabled={isPrompting}
        className={
          className ||
          'flex items-center gap-1.5 font-bold text-xs px-3 py-1.5 rounded-xl border border-pink-300 bg-pink-50 hover:bg-pink-100 text-pink-700 transition-all active:scale-95 cursor-pointer shadow-xs'
        }
        title={
          isPainelMode
            ? 'Baixar e instalar o aplicativo exclusivo do Painel Administrativo (abre direto no painel com alertas de compras)'
            : 'Instalar o aplicativo da loja AP2 Moda Fitness no celular ou computador'
        }
      >
        <Download size={13} className={`text-pink-600 ${deferredPrompt ? 'animate-bounce' : ''}`} />
        <span className="hidden sm:inline">
          {isPainelMode
            ? deferredPrompt
              ? 'Baixar App Painel 📲'
              : 'Instalar Painel 📲'
            : deferredPrompt
              ? 'Baixar App Loja 📲'
              : 'Instalar Aplicativo 📲'}
        </span>
        <span className="sm:hidden">{isPainelMode ? 'App Painel 📲' : 'App 📲'}</span>
      </button>

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-pink-100 dark:bg-pink-950/40 text-pink-600 flex items-center justify-center">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {isIOS ? `Instalar no iPhone / iPad` : `Instalar ${appDisplayName}`}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {isPainelMode
                      ? 'Abre direto no Painel Admin com alertas de pedidos'
                      : 'Aplicativo Oficial (Modo Standalone)'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>
            </div>

            {isIOS ? (
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                <p className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-pink-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Acesse <strong>{isPainelMode ? '/painel' : '/'}</strong> no Safari e toque em{' '}
                    <strong>Compartilhar</strong> (ícone com seta para cima).
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-pink-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Role para baixo e toque em <strong>&quot;Adicionar à Tela de Início&quot;</strong>.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-pink-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Confirme em <strong>Adicionar</strong>. O ícone abrirá direto no{' '}
                    <strong>{appDisplayName}</strong>.
                  </span>
                </p>
              </div>
            ) : isInIframe ? (
              <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-2 text-xs text-amber-900 dark:text-amber-200">
                <p className="font-bold flex items-center gap-1.5">
                  <ExternalLink size={14} /> Visualização incorporada detectada
                </p>
                <p>
                  Os navegadores bloqueiam o download de aplicativos dentro de janelas incorporadas. Abra o endereço{' '}
                  <strong>/painel</strong> diretamente no Chrome ou Edge para instalar o aplicativo do painel administrativo.
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  {isAndroid
                    ? `Como instalar o ${appDisplayName} no Android:`
                    : `Como instalar o ${appDisplayName} no Desktop:`}
                </p>
                {isAndroid ? (
                  <>
                    <p className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-pink-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        Toque em <strong>Atualizar e Liberar App</strong> abaixo para garantir que o navegador carregue o instalador de <strong>/painel</strong>.
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-pink-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        No Chrome, toque no menu <strong>⋮</strong> (canto superior direito) → <strong>Adicionar à tela inicial</strong> → <strong>Instalar app</strong> (aparecerá como <strong>AP2 Painel Admin</strong>).
                      </span>
                    </p>
                  </>
                ) : (
                  <p className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-pink-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Clique no ícone de <strong>Instalar Aplicativo</strong> na barra de endereços do Chrome/Edge ou no menu <strong>⋮ → Salvar e compartilhar → Instalar {appDisplayName}</strong>.
                    </span>
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              {!isIOS && !isInIframe && (
                <button
                  type="button"
                  onClick={handleRefreshForPainelInstall}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={13} />
                  Atualizar e Liberar App
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
