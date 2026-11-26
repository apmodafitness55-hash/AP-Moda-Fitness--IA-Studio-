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
    window.__apDeferredInstallPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new CustomEvent('ap-pwa-prompt-ready'));
  });

  window.addEventListener('appinstalled', () => {
    window.__apDeferredInstallPrompt = null;
    window.__apPWAInstalled = true;
    window.dispatchEvent(new CustomEvent('ap-pwa-installed'));
  });

  // Register VitePWA Workbox Service Worker + Push listener
  if ('serviceWorker' in navigator) {
    registerSW({
      immediate: true,
      onRegisteredSW(swUrl, registration) {
        if (registration) {
          console.log('[PWA Service Worker] Ativo:', swUrl, registration.scope);
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
