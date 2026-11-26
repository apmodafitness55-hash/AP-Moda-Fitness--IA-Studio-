import './utils/cacheReset';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    __apDeferredInstallPrompt?: BeforeInstallPromptEvent | null;
    __apDeferredInstallPromptManifest?: string | null;
    __apPWAInstalled?: boolean;
  }
}

// Capture beforeinstallprompt immediately before React mounts so early events are never missed
if (typeof window !== 'undefined') {
  window.__apPWAInstalled =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    const manifestHref =
      document.querySelector('link[rel="manifest"]')?.getAttribute('href') || null;
    window.__apDeferredInstallPrompt = e as BeforeInstallPromptEvent;
    window.__apDeferredInstallPromptManifest = manifestHref;
    window.dispatchEvent(new CustomEvent('ap-pwa-prompt-ready'));
  });

  window.addEventListener('appinstalled', () => {
    window.__apDeferredInstallPrompt = null;
    window.__apDeferredInstallPromptManifest = null;
    window.__apPWAInstalled = true;
    window.dispatchEvent(new CustomEvent('ap-pwa-installed'));
  });

  // Register VitePWA Workbox Service Worker and auto-refresh stale tabs when a new version activates
  if ('serviceWorker' in navigator) {
    const hadControllerAtBoot = Boolean(navigator.serviceWorker.controller);
    let isRefreshingAfterSWUpdate = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadControllerAtBoot || isRefreshingAfterSWUpdate) return;
      try {
        const lastReload = Number(sessionStorage.getItem('ap_sw_last_reload') || '0');
        if (Date.now() - lastReload < 15000) return;
        sessionStorage.setItem('ap_sw_last_reload', String(Date.now()));
      } catch {}
      isRefreshingAfterSWUpdate = true;
      window.location.reload();
    });

    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        void updateSW(true);
      },
      onRegisteredSW(swUrl, registration) {
        if (registration) {
          console.log('[PWA Service Worker] Ativo:', swUrl, registration.scope);
          registration.update().catch(() => {});
        }
      },
      onRegisterError(error) {
        console.warn('[PWA Service Worker] Falha ao registrar Service Worker:', error);
      },
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
