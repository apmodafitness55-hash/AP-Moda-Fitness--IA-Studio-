// Utilitários seguros de data (fuso America/Sao_Paulo), IDs únicos e persistência localStorage

export const STORE_TIMEZONE = 'America/Sao_Paulo';

/**
 * Converte uma data/timestamp para chave YYYY-MM-DD no fuso horário de Brasília (America/Sao_Paulo).
 * Evita deslocamento de 1 dia após as 21:00 BRT causado por `.toISOString().split('T')[0]` (UTC).
 */
export function getLocalDateKey(input?: string | Date | number | null): string {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    // Se já vier como YYYY-MM-DD puro (sem horário), preserva diretamente para não sofrer shift de fuso
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
  }
  const dateObj =
    input instanceof Date
      ? input
      : input !== undefined && input !== null && input !== ''
        ? new Date(input)
        : new Date();

  if (Number.isNaN(dateObj.getTime())) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: STORE_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  }

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: STORE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(dateObj);
}

/**
 * Retorna { year, month (0-11), day (1-31) } no fuso de Brasília.
 */
export function getLocalYearMonth(input?: string | Date | number | null): {
  year: number;
  month: number;
  day: number;
  key: string;
} {
  const key = getLocalDateKey(input);
  const [y, m, d] = key.split('-').map(Number);
  return {
    year: y,
    month: m - 1,
    day: d,
    key
  };
}

/**
 * Retorna string no formato YYYY-MM-DD somando/subtraindo dias a partir de uma data no fuso local BRT.
 */
export function getLocalDateOffset(daysOffset: number, base?: Date): string {
  const ref = base ? new Date(base.getTime()) : new Date();
  ref.setDate(ref.getDate() + daysOffset);
  return getLocalDateKey(ref);
}

/**
 * Gera um identificador único à prova de colisão dentro do mesmo milissegundo.
 */
export function createUniqueId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 7);
  return `${prefix}-${ts}-${rand}`;
}

/**
 * Grava no localStorage com proteção contra QuotaExceededError.
 * Em caso de estouro de cota por imagens antigas em base64, tenta limpar caches redundantes não críticos.
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    const isQuota =
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err?.code === 22;

    if (isQuota) {
      try {
        // Libera chaves de backup temporárias/caches descartáveis sem apagar dados de operação
        const disposableKeys = [
          'ap_moda_team_users_backup',
          'ap_diagnostics_cache',
          'ap_system_snapshot_backup',
          'ap_last_health_check'
        ];
        for (const k of disposableKeys) {
          if (k !== key) localStorage.removeItem(k);
        }
        localStorage.setItem(key, value);
        return true;
      } catch (retryErr) {
        console.warn(`[safeLocalStorageSet] Falha de cota ao gravar "${key}":`, retryErr);
        return false;
      }
    }
    console.warn(`[safeLocalStorageSet] Erro ao gravar "${key}":`, err);
    return false;
  }
}
