import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Detect if already installed / running standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Fallback for browsers that don't support beforeinstallprompt
      alert('Para instalar o aplicativo no seu computador ou celular:\n\n1. No Chrome/Edge: Clique no ícone de computador/instalação na barra de endereços (ao lado da estrela de favoritos).\n2. No celular: Abra o menu de 3 pontinhos do navegador e toque em "Instalar aplicativo" ou "Adicionar à tela inicial".');
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={className || "flex items-center gap-1.5 font-bold text-xs px-3 py-1.5 rounded-xl border border-pink-300 bg-pink-50 hover:bg-pink-100 text-pink-700 transition-all active:scale-95 cursor-pointer shadow-xs"}
        title="Instalar o aplicativo da AP Moda Fitness no seu celular ou computador para receber notificações na barra de tarefas"
      >
        <Download size={13} className="text-pink-600 animate-bounce" />
        <span className="hidden sm:inline">Instalar Aplicativo 📲</span>
        <span className="sm:hidden">App 📲</span>
      </button>

      {/* iOS Safari Guided Install Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-pink-100 dark:bg-pink-950/40 text-pink-600 flex items-center justify-center">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Instalar no iPhone / iPad</h4>
                  <p className="text-[11px] text-slate-500">AP2 Moda Fitness App</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-pink-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                Toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta para cima) na barra inferior do Safari.
              </p>
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-pink-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.
              </p>
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-pink-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                Toque em <strong>Adicionar</strong> no canto superior direito.
              </p>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Entendi!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
