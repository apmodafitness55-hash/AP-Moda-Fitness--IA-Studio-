import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, HardDrive, ArrowLeft } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearAndReload = () => {
    if (window.confirm('Isso limpará as configurações locais temporárias para resolver o travamento e recarregará a página. Deseja continuar?')) {
      localStorage.clear();
      window.location.href = '/painel';
    }
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden">
          {/* Ambient light glow */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl p-1 pointer-events-none animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl p-1 pointer-events-none animate-pulse" />

          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10 space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-5 animate-bounce">
                <AlertTriangle size={32} />
              </div>
              
              <h1 className="text-2xl font-black tracking-tight text-white font-sans">
                Ops! O Painel Administrativo travou
              </h1>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-md">
                Ocorreu um erro de renderização no painel. O ErrorBoundary impediu a tela em branco salvando o estado da sua aplicação.
              </p>
            </div>

            {/* Error Details Panel */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-6 text-left space-y-3 font-mono text-xs overflow-x-auto max-h-64 scrollbar-thin">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-2 text-rose-400 font-semibold">
                <span>⚠️ DETALHES DO ERRO:</span>
              </div>
              <p className="text-rose-500 font-bold whitespace-pre-wrap">
                {this.state.error?.toString() || 'Erro desconhecido'}
              </p>
              {this.state.errorInfo && (
                <pre className="text-slate-400 text-[10px] leading-relaxed whitespace-pre font-mono mt-2 select-text">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="py-3 px-4 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl transition duration-200 cursor-pointer flex items-center justify-center gap-2 border-none shadow-md shadow-pink-600/20"
              >
                <RefreshCw size={14} className="animate-spin" />
                <span>Recarregar Painel</span>
              </button>

              <button
                onClick={this.handleClearAndReload}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition duration-200 cursor-pointer flex items-center justify-center gap-2 border border-slate-700"
              >
                <HardDrive size={14} />
                <span>Limpar Cache e Recarregar</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition duration-200 cursor-pointer flex items-center justify-center gap-2 border border-slate-800"
              >
                <ArrowLeft size={14} />
                <span>Ir para a Vitrine</span>
              </button>
            </div>

            <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-800/50">
              Dispositivo operando de forma resiliente • AP Moda Fitness ERP
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
