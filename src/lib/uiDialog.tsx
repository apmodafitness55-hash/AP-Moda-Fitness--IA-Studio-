import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
  durationMs?: number;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: 'danger' | 'primary' | 'warning';
  danger?: boolean;
}

interface PromptOptions {
  title?: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  inputType?: 'text' | 'password' | 'number';
  confirmText?: string;
  cancelText?: string;
}

interface ActiveConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

interface ActivePrompt extends PromptOptions {
  resolve: (value: string | null) => void;
}

type Listener = {
  onToast: (item: ToastItem) => void;
  onConfirm: (req: ActiveConfirm) => void;
  onPrompt: (req: ActivePrompt) => void;
};

let activeListener: Listener | null = null;
const pendingToasts: ToastItem[] = [];

function inferTone(message: string): ToastTone {
  const lower = message.toLowerCase();
  if (lower.startsWith('❌') || lower.includes('erro') || lower.includes('falha') || lower.includes('negado') || lower.includes('inválid')) {
    return 'error';
  }
  if (lower.startsWith('⚠️') || lower.includes('atenção') || lower.includes('aviso') || lower.includes('desculpe') || lower.includes('esgotado') || lower.includes('limite') || lower.includes('favor ')) {
    return 'warning';
  }
  if (lower.startsWith('✅') || lower.startsWith('✓') || lower.startsWith('🎉') || lower.startsWith('✨') || lower.includes('sucesso') || lower.includes('copiad') || lower.includes('salvo') || lower.includes('salva')) {
    return 'success';
  }
  return 'info';
}

export function showToast(message: string, tone?: ToastTone, durationMs?: number): void {
  const resolvedTone = tone || inferTone(message);
  const item: ToastItem = {
    id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    message: String(message),
    tone: resolvedTone,
    durationMs
  };

  if (activeListener) {
    activeListener.onToast(item);
  } else {
    pendingToasts.push(item);
  }
}

export function showConfirm(
  optionsOrMessage: string | ConfirmOptions,
  title?: string,
  confirmText?: string
): Promise<boolean> {
  const opts: ConfirmOptions =
    typeof optionsOrMessage === 'string'
      ? { message: optionsOrMessage, title, confirmText }
      : optionsOrMessage;

  return new Promise<boolean>((resolve) => {
    if (activeListener) {
      activeListener.onConfirm({ ...opts, resolve });
    } else {
      console.warn('[uiDialog] GlobalDialogHost não montado para confirmação:', opts.message);
      resolve(false);
    }
  });
}

export function showPrompt(
  optionsOrMessage: string | PromptOptions,
  defaultValue?: string,
  title?: string
): Promise<string | null> {
  const opts: PromptOptions =
    typeof optionsOrMessage === 'string'
      ? { message: optionsOrMessage, defaultValue, title }
      : optionsOrMessage;

  return new Promise<string | null>((resolve) => {
    if (activeListener) {
      activeListener.onPrompt({ ...opts, resolve });
    } else {
      console.warn('[uiDialog] GlobalDialogHost não montado para prompt:', opts.message);
      resolve(null);
    }
  });
}

export const GlobalDialogHost: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmQueue, setConfirmQueue] = useState<ActiveConfirm[]>([]);
  const [promptQueue, setPromptQueue] = useState<ActivePrompt[]>([]);
  const [promptInput, setPromptInput] = useState<string>('');

  const currentConfirm = confirmQueue[0] || null;
  const currentPrompt = !currentConfirm ? (promptQueue[0] || null) : null;

  useEffect(() => {
    if (currentPrompt) {
      setPromptInput(currentPrompt.defaultValue ?? '');
    }
  }, [currentPrompt]);

  useEffect(() => {
    activeListener = {
      onToast: (item) => {
        setToasts((prev) => [...prev.slice(-4), item]);
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== item.id));
        }, item.durationMs ?? (item.tone === 'error' ? 6000 : 4200));
      },
      onConfirm: (req) => {
        setConfirmQueue((prev) => [...prev, req]);
      },
      onPrompt: (req) => {
        setPromptQueue((prev) => [...prev, req]);
      }
    };

    if (pendingToasts.length > 0) {
      const copy = pendingToasts.splice(0, pendingToasts.length);
      copy.forEach((item) => activeListener?.onToast(item));
    }

    return () => {
      activeListener = null;
    };
  }, []);

  const handleConfirmResult = (val: boolean) => {
    if (!currentConfirm) return;
    currentConfirm.resolve(val);
    setConfirmQueue((prev) => prev.slice(1));
  };

  const handlePromptResult = (val: string | null) => {
    if (!currentPrompt) return;
    currentPrompt.resolve(val);
    setPromptQueue((prev) => prev.slice(1));
  };

  return (
    <>
      {/* Toasts flutuantes não-bloqueantes */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none">
          {toasts.map((t) => {
            const palette =
              t.tone === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-50'
                : t.tone === 'error'
                  ? 'bg-rose-950/95 border-rose-500/60 text-rose-50'
                  : t.tone === 'warning'
                    ? 'bg-amber-950/95 border-amber-500/60 text-amber-50'
                    : 'bg-slate-900/95 border-slate-700 text-slate-100';

            const Icon =
              t.tone === 'success'
                ? CheckCircle2
                : t.tone === 'error'
                  ? XCircle
                  : t.tone === 'warning'
                    ? AlertTriangle
                    : Info;

            const iconColor =
              t.tone === 'success'
                ? 'text-emerald-400'
                : t.tone === 'error'
                  ? 'text-rose-400'
                  : t.tone === 'warning'
                    ? 'text-amber-400'
                    : 'text-sky-400';

            return (
              <div
                key={t.id}
                className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md text-xs font-sans transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${palette}`}
              >
                <Icon size={16} className={`shrink-0 mt-0.5 ${iconColor}`} />
                <div className="flex-1 whitespace-pre-line leading-relaxed font-medium break-words">
                  {t.message}
                </div>
                <button
                  type="button"
                  onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                  className="shrink-0 opacity-60 hover:opacity-100 transition-opacity cursor-pointer bg-transparent border-0 p-0 text-current"
                  aria-label="Fechar aviso"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Confirmação Substituindo window.confirm */}
      {currentConfirm && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden font-sans animate-in zoom-in-95 duration-150">
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    currentConfirm.tone === 'danger' || currentConfirm.danger
                      ? 'bg-rose-100 text-rose-600'
                      : currentConfirm.tone === 'warning'
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-pink-100 text-pink-600'
                  }`}
                >
                  <AlertTriangle size={18} />
                </div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  {currentConfirm.title || 'Confirmação Necessária'}
                </h3>
              </div>
              <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed font-medium">
                {currentConfirm.message}
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => handleConfirmResult(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
              >
                {currentConfirm.cancelText || 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmResult(true)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold text-white transition cursor-pointer border-0 shadow-sm ${
                  currentConfirm.tone === 'danger' || currentConfirm.danger
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-pink-600 hover:bg-pink-700'
                }`}
              >
                {currentConfirm.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Entrada Substituindo window.prompt */}
      {currentPrompt && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePromptResult(promptInput);
            }}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden font-sans animate-in zoom-in-95 duration-150"
          >
            <div className="p-6 space-y-3">
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                {currentPrompt.title || 'Informação Necessária'}
              </h3>
              <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed font-medium">
                {currentPrompt.message}
              </p>
              <input
                autoFocus
                type={currentPrompt.inputType || 'text'}
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder={currentPrompt.placeholder || ''}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => handlePromptResult(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
              >
                {currentPrompt.cancelText || 'Cancelar'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-pink-600 hover:bg-pink-700 transition cursor-pointer border-0 shadow-sm"
              >
                {currentPrompt.confirmText || 'Continuar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
