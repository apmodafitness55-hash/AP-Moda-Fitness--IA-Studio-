import {
  getSupabaseClient,
  isSupabaseConfigured,
  pushSystemConfigToSupabase,
  syncBulkProductsToSupabase,
  syncBulkSalesToSupabase,
  syncBulkTransactionsToSupabase,
  syncSystemConfigsWithSupabase
} from '../supabase';
import { safeLocalStorageSet } from '../utils/dateUtils';

export interface DiagnosticLog {
  timestamp: string;
  scope: string;
  testName: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

export interface DiagnosticResult {
  overallStatus: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  supabaseConnected: boolean;
  liveSummary?: {
    supabaseMode: string;
    hubOk: boolean;
    infinitePayOk: boolean;
    melhorEnvioOk: boolean;
    renderReachable: boolean;
    renderUpToDate: boolean;
    googleOAuthConfigured: boolean;
  };
  checks: {
    database: { status: 'success' | 'warning' | 'error'; message: string; logs: DiagnosticLog[] };
    permissions: { status: 'success' | 'warning' | 'error'; message: string; logs: DiagnosticLog[] };
    workflows: { status: 'success' | 'warning' | 'error'; message: string; logs: DiagnosticLog[] };
    analytics: { status: 'success' | 'warning' | 'error'; message: string; logs: DiagnosticLog[] };
  };
  metrics: {
    tablesVerifiedCount: number;
    errorsCount: number;
    warningsCount: number;
  };
}

export interface SelfHealReport {
  success: boolean;
  fixedCount: number;
  actions: string[];
  remainingWarnings: string[];
  diagnosticsAfter: DiagnosticResult;
  timestamp: string;
}

const CRITICAL_JSON_KEYS = [
  'ap_moda_products',
  'ap_moda_clients',
  'ap_moda_sales',
  'ap_moda_transactions',
  'ap_moda_online_orders',
  'ap_moda_team',
  'ap_coupons',
  'ap_moda_partners',
  'ap_moda_payment_config',
  'ap_moda_company_info',
  'ap_infinitepay_config'
];

function isBadPlaceholderImage(imgUrl: unknown): boolean {
  if (typeof imgUrl !== 'string') return false;
  const trimmed = imgUrl.trim();
  if (!trimmed.startsWith('data:image/svg+xml')) return false;
  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    decoded = trimmed;
  }
  return (
    decoded.includes('AP MODA') ||
    decoded.includes('ALTA PERFORMANCE') ||
    decoded.includes('Imagem') ||
    decoded.includes('Foto') ||
    decoded.includes('Sem Foto') ||
    decoded.includes('Sem Imagem')
  );
}

export async function runDeepSystemDiagnostics(): Promise<DiagnosticResult> {
  const timestamp = new Date().toISOString();
  const isConfigured = isSupabaseConfigured();

  const dbLogs: DiagnosticLog[] = [];
  const permLogs: DiagnosticLog[] = [];
  const workflowLogs: DiagnosticLog[] = []; // Connectivity: Hub AI, InfinitePay, Melhor Envio, Google, Render
  const analyticLogs: DiagnosticLog[] = []; // Data Integrity & Formula Consistency

  let databaseStatus: 'success' | 'warning' | 'error' = 'success';
  let permissionsStatus: 'success' | 'warning' | 'error' = 'success';
  let workflowsStatus: 'success' | 'warning' | 'error' = 'success';
  let analyticsStatus: 'success' | 'warning' | 'error' = 'success';
  let tablesVerified = 0;

  let backendHealth: any = null;

  try {
    const res = await fetch('/api/system/health-check?probeGemini=1&checkRender=1');
    if (res.ok) {
      backendHealth = await res.json();
    } else {
      workflowLogs.push({
        timestamp: new Date().toISOString(),
        scope: 'Render & Backend',
        testName: 'Endpoint de Diagnóstico do Servidor',
        status: 'error',
        message: `Servidor Express retornou HTTP ${res.status} ao verificar saúde real.`
      });
      workflowsStatus = 'error';
    }
  } catch (err: any) {
    workflowLogs.push({
      timestamp: new Date().toISOString(),
      scope: 'Render & Backend',
      testName: 'Comunicação com Backend Express',
      status: 'error',
      message: 'Não foi possível contactar o servidor Express local (/api/system/health-check).',
      details: err.message || String(err)
    });
    workflowsStatus = 'error';
  }

  // --- 1. BANCO DE DADOS & TABELAS REAIS (SUPABASE CLOUD vs FALLBACK) ---
  if (backendHealth?.supabase) {
    const supa = backendHealth.supabase;
    if (supa.cloudReachable) {
      dbLogs.push({
        timestamp: new Date().toISOString(),
        scope: 'Database Schema',
        testName: 'Conexão Supabase Cloud',
        status: 'success',
        message: `Conectado à nuvem Supabase em ${supa.latencyMs}ms.`,
        details: `Instância ativa: ${supa.url}`
      });
    } else {
      databaseStatus = 'error';
      dbLogs.push({
        timestamp: new Date().toISOString(),
        scope: 'Database Schema',
        testName: 'Conexão Supabase Cloud',
        status: 'error',
        message: 'Supabase Cloud inacessível; servidor operando em modo Local Fallback (local_db.json).',
        details: `Instância: ${supa.url || 'não definida'}${supa.errorDetail ? ` • Motivo: ${supa.errorDetail}` : ''}`
      });
    }

    const tablesObj = supa.tables || {};
    for (const [tableName, info] of Object.entries<any>(tablesObj)) {
      if (info?.ok) {
        tablesVerified++;
        const cols: string[] = Array.isArray(info.sampleColumns) ? info.sampleColumns : [];
        dbLogs.push({
          timestamp: new Date().toISOString(),
          scope: 'Database Schema',
          testName: `Tabela ${tableName}`,
          status: 'success',
          message: cols.length > 0
            ? `Tabela '${tableName}' online e legível (${cols.length} colunas detectadas).`
            : `Tabela '${tableName}' online e acessível (atualmente sem linhas).`,
          details: cols.length > 0 ? `Colunas: ${cols.slice(0, 8).join(', ')}${cols.length > 8 ? '...' : ''}` : undefined
        });
      } else {
        databaseStatus = 'error';
        dbLogs.push({
          timestamp: new Date().toISOString(),
          scope: 'Database Schema',
          testName: `Tabela ${tableName}`,
          status: 'error',
          message: `Falha ao consultar '${tableName}' no Supabase.`,
          details: info?.error || 'Erro desconhecido'
        });
      }
    }
  } else if (isConfigured) {
    // Direct fallback check via proxy if /api/system/health-check failed
    try {
      const supabase = getSupabaseClient();
      const tables = ['ap_system_configs', 'ap_products', 'ap_clients', 'ap_sales', 'ap_transactions', 'ap_online_orders', 'ap_team_members'];
      for (const tbl of tables) {
        const { error } = await supabase.from(tbl).select('*').limit(1);
        if (error) {
          databaseStatus = 'error';
          dbLogs.push({ timestamp: new Date().toISOString(), scope: 'Database Schema', testName: tbl, status: 'error', message: error.message });
        } else {
          tablesVerified++;
          dbLogs.push({ timestamp: new Date().toISOString(), scope: 'Database Schema', testName: tbl, status: 'success', message: `Proxy '${tbl}' respondeu HTTP 200 OK.` });
        }
      }
    } catch (e: any) {
      databaseStatus = 'error';
      dbLogs.push({ timestamp: new Date().toISOString(), scope: 'Database Schema', testName: 'Falha Geral DB', status: 'error', message: e.message || String(e) });
    }
  }

  // --- 2. PERMISSÕES RLS & TESTE REAL WRITE/READ/DELETE ---
  try {
    const supabase = getSupabaseClient();
    const testKey = 'ap_healthcheck_write_test_key';
    const testVal = `ok-${Date.now()}`;

    const { error: insertError } = await supabase
      .from('ap_system_configs')
      .upsert([{ key: testKey, value: testVal }]);

    if (insertError) {
      permissionsStatus = 'error';
      permLogs.push({
        timestamp: new Date().toISOString(),
        scope: 'Security RLS',
        testName: 'Teste Proxy Write',
        status: 'error',
        message: 'Falha ao gravar chave temporária via /api/proxy/system-configs.',
        details: insertError.message
      });
    } else {
      const { data, error: readError } = await supabase
        .from('ap_system_configs')
        .select('value')
        .eq('key', testKey);

      if (readError || !data || data[0]?.value !== testVal) {
        permissionsStatus = 'error';
        permLogs.push({
          timestamp: new Date().toISOString(),
          scope: 'Security RLS',
          testName: 'Teste Proxy Read',
          status: 'error',
          message: 'Falha ao reler chave gravada em ap_system_configs.',
          details: readError ? readError.message : 'Valor retornado diverge do gravado.'
        });
      } else {
        const { error: deleteError } = await supabase
          .from('ap_system_configs')
          .delete()
          .eq('key', testKey);

        if (deleteError) {
          permissionsStatus = 'error';
          permLogs.push({
            timestamp: new Date().toISOString(),
            scope: 'Security RLS',
            testName: 'Teste Proxy Delete',
            status: 'error',
            message: 'Falha ao excluir chave de teste em /api/proxy/system-configs/:key.',
            details: deleteError.message
          });
        } else {
          permLogs.push({
            timestamp: new Date().toISOString(),
            scope: 'Security RLS',
            testName: 'Ciclo R/W/D via Proxy',
            status: 'success',
            message: 'Escrita, leitura e exclusão (Write/Read/Delete) em ap_system_configs concluídas com sucesso e sem resíduos.'
          });
        }
      }
    }

    if (backendHealth?.supabase?.rwTest) {
      const rw = backendHealth.supabase.rwTest;
      if (!rw.ok && permissionsStatus === 'success') permissionsStatus = 'error';
      permLogs.push({
        timestamp: new Date().toISOString(),
        scope: 'Security RLS',
        testName: 'RLS Direto Supabase Cloud',
        status: rw.ok ? 'success' : 'error',
        message: rw.message
      });
    }
  } catch (e: any) {
    permissionsStatus = 'error';
    permLogs.push({
      timestamp: new Date().toISOString(),
      scope: 'Security RLS',
      testName: 'Exceção RLS',
      status: 'error',
      message: 'Erro ao validar permissões R/W/D.',
      details: e.message || String(e)
    });
  }

  // --- 3. CONECTIVIDADE REAL DE INTEGRAÇÕES (HUB IA, INFINITEPAY, MELHOR ENVIO, GOOGLE, RENDER) ---
  if (backendHealth) {
    // 3.1 Hub de IA (Gemini)
    const hub = backendHealth.hub;
    if (hub?.ok) {
      workflowLogs.push({
        timestamp: new Date().toISOString(),
        scope: 'Hub IA (Gemini)',
        testName: 'API Gemini / Agentes IA',
        status: 'success',
        message: hub.message,
        details: `Testado ao vivo: ${hub.liveTested ? 'Sim' : 'Não'} • Latência: ${hub.latencyMs}ms`
      });
    } else {
      if (workflowsStatus !== 'error') workflowsStatus = hub?.configured ? 'error' : 'warning';
      workflowLogs.push({
        timestamp: new Date().toISOString(),
        scope: 'Hub IA (Gemini)',
        testName: 'API Gemini / Agentes IA',
        status: hub?.configured ? 'error' : 'warning',
        message: hub?.message || 'Hub de IA não respondeu ao teste.',
        details: 'Configure GEMINI_API_KEY nas variáveis de ambiente do servidor.'
      });
    }

    // 3.2 InfinitePay
    const inf = backendHealth.infinitepay;
    if (inf?.ok) {
      workflowLogs.push({
        timestamp: new Date().toISOString(),
        scope: 'InfinitePay',
        testName: 'Checkout Integrado InfinitePay',
        status: 'success',
        message: inf.message,
        details: `Handle ativo: ${inf.handle} • Latência: ${inf.latencyMs}ms`
      });
    } else {
      workflowsStatus = 'error';
      workflowLogs.push({
        timestamp: new Date().toISOString(),
        scope: 'InfinitePay',
        testName: 'Checkout Integrado InfinitePay',
        status: 'error',
        message: `Falha na InfinitePay: ${inf?.message || 'Sem resposta'}`,
        details: `Handle testado: ${inf?.handle || 'ap-moda-fitness'}`
      });
    }

    // 3.3 Melhor Envio
    const me = backendHealth.melhorEnvio;
    if (me?.ok) {
      workflowLogs.push({
        timestamp: new Date().toISOString(),
        scope: 'Logística Melhor Envio',
        testName: 'API Melhor Envio',
        status: 'success',
        message: me.message,
        details: `Modo: ${me.mode} • Latência: ${me.latencyMs}ms`
      });
    } else {
      if (workflowsStatus !== 'error') workflowsStatus = 'warning';
      workflowLogs.push({
        timestamp: new Date().toISOString(),
        scope: 'Logística Melhor Envio',
        testName: 'API Melhor Envio',
        status: 'warning',
        message: me?.message || 'Melhor Envio não configurado.'
      });
    }

    // 3.4 Google Workspace OAuth
    const gOauth = backendHealth.googleOAuth;
    const hasLocalGoogleToken = Boolean(localStorage.getItem('ap_google_access_token'));
    if (gOauth?.configured) {
      workflowLogs.push({
        timestamp: new Date().toISOString(),
        scope: 'Google Workspace',
        testName: 'Credenciais OAuth Google',
        status: hasLocalGoogleToken ? 'success' : 'warning',
        message: hasLocalGoogleToken
          ? 'OAuth Google configurado e sessão autorizada neste navegador.'
          : 'Client ID/Secret salvos no servidor, aguardando login OAuth do operador na aba Google Workspace.'
      });
      if (!hasLocalGoogleToken && workflowsStatus === 'success') workflowsStatus = 'warning';
    } else {
      if (workflowsStatus === 'success') workflowsStatus = 'warning';
      workflowLogs.push({
        timestamp: new Date().toISOString(),
        scope: 'Google Workspace',
        testName: 'Credenciais OAuth Google',
        status: 'warning',
        message: 'Google OAuth (Client ID / Secret) não está configurado no servidor. Recursos do Google Workspace exigem configuração OAuth real.'
      });
    }

    // 3.5 Render Deployment Check
    const rnd = backendHealth.render;
    if (rnd?.reachable && rnd?.apiUpToDate) {
      workflowLogs.push({
        timestamp: new Date().toISOString(),
        scope: 'Render & Backend',
        testName: 'Servidor Externo Render',
        status: 'success',
        message: rnd.message,
        details: rnd.url
      });
    } else if (rnd?.reachable && !rnd?.apiUpToDate) {
      if (workflowsStatus === 'success') workflowsStatus = 'warning';
      workflowLogs.push({
        timestamp: new Date().toISOString(),
        scope: 'Render & Backend',
        testName: 'Versão em Produção no Render',
        status: 'warning',
        message: rnd.message,
        details: `${rnd.url} — Código local está mais novo que o deploy público do Render.`
      });
    } else {
      if (workflowsStatus === 'success') workflowsStatus = 'warning';
      workflowLogs.push({
        timestamp: new Date().toISOString(),
        scope: 'Render & Backend',
        testName: 'Servidor Externo Render',
        status: 'warning',
        message: rnd?.message || 'Não foi possível validar o Render.'
      });
    }
  }

  // --- 4. AUDITORIA REAL DE INTEGRIDADE DE DADOS LOCAIS & NUVEM ---
  let corruptedJsonKeys: string[] = [];
  for (const key of CRITICAL_JSON_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        JSON.parse(raw);
      } catch {
        corruptedJsonKeys.push(key);
      }
    }
  }

  if (corruptedJsonKeys.length > 0) {
    analyticsStatus = 'error';
    analyticLogs.push({
      timestamp: new Date().toISOString(),
      scope: 'Integridade de Dados',
      testName: 'Caches JSON Corrompidos',
      status: 'error',
      message: `Encontrada(s) ${corruptedJsonKeys.length} chave(s) com JSON inválido no navegador.`,
      details: `Chaves afetadas: ${corruptedJsonKeys.join(', ')}. Clique em "Autocorreção (Self-Heal)" para limpar/reparar.`
    });
  } else {
    analyticLogs.push({
      timestamp: new Date().toISOString(),
      scope: 'Integridade de Dados',
      testName: 'Validação JSON LocalStorage',
      status: 'success',
      message: 'Todos os caches JSON locais (produtos, vendas, clientes, pedidos e configs) estão íntegros.'
    });
  }

  // Check broken product images / duplicates / invalid prices
  try {
    const rawProds = localStorage.getItem('ap_moda_products');
    const prods = rawProds ? JSON.parse(rawProds) : [];
    let brokenLocalImgs = 0;
    let duplicateProdIds = 0;
    let badPrices = 0;
    if (Array.isArray(prods)) {
      const seen = new Set<string>();
      for (const p of prods) {
        if (!p) continue;
        if (p.id && seen.has(String(p.id))) duplicateProdIds++;
        if (p.id) seen.add(String(p.id));
        if (isBadPlaceholderImage(p.image) || (Array.isArray(p.images) && p.images.some(isBadPlaceholderImage))) {
          brokenLocalImgs++;
        }
        if (typeof p.price !== 'number' || Number.isNaN(p.price) || p.price < 0) {
          badPrices++;
        }
      }
    }
    const cloudBrokenImgs = backendHealth?.integrity?.brokenProductImages || 0;
    const totalBrokenImgs = Math.max(brokenLocalImgs, cloudBrokenImgs);
    const totalDuplicates = Math.max(duplicateProdIds, backendHealth?.integrity?.duplicateIds || 0);

    if (totalBrokenImgs > 0 || totalDuplicates > 0 || badPrices > 0) {
      if (analyticsStatus === 'success') analyticsStatus = 'warning';
      analyticLogs.push({
        timestamp: new Date().toISOString(),
        scope: 'Integridade de Dados',
        testName: 'Catálogo, Imagens & Preços',
        status: 'warning',
        message: `Detectados desvios no catálogo: ${totalBrokenImgs} imagem(ns) placeholder SVG, ${totalDuplicates} ID(s) duplicado(s), ${badPrices} preço(s) inválido(s).`,
        details: 'O motor "Autocorreção (Self-Heal)" remove placeholders quebrados e deduplica registros automaticamente.'
      });
    } else {
      analyticLogs.push({
        timestamp: new Date().toISOString(),
        scope: 'Integridade de Dados',
        testName: 'Catálogo, Imagens & Preços',
        status: 'success',
        message: `Catálogo íntegro (${Array.isArray(prods) ? prods.length : 0} produtos locais verificados, sem URLs placeholder ou IDs duplicados).`
      });
    }
    // Check sales status consistency ('Pago' / 'Concluído' vs canonical 'Concluída')
    try {
      const rawSales = localStorage.getItem('ap_moda_sales');
      const salesArr = rawSales ? JSON.parse(rawSales) : [];
      if (Array.isArray(salesArr)) {
        const legacyPagoCount = salesArr.filter((s: any) => s && (s.status === 'Pago' || s.status === 'Concluído' || s.status === 'Entregue')).length;
        if (legacyPagoCount > 0) {
          if (analyticsStatus === 'success') analyticsStatus = 'warning';
          analyticLogs.push({
            timestamp: new Date().toISOString(),
            scope: 'Integridade de Dados',
            testName: 'Padronização de Faturamento',
            status: 'warning',
            message: `${legacyPagoCount} venda(s) com status legado ("Pago"/"Concluído") fora do filtro de Faturamento.`,
            details: 'Clique em "Autocorreção (Self-Heal)" para normalizar todas para "Concluída".'
          });
        }
      }
    } catch {}
  } catch {}

  // Check Pix & InfinitePay config consistency
  try {
    const rawPay = localStorage.getItem('ap_moda_payment_config');
    const payObj = rawPay ? JSON.parse(rawPay) : {};
    const directPix = (localStorage.getItem('ap_pix_key') || '').trim();
    const configPix = String(payObj?.pixKey || '').trim();
    const rawComp = localStorage.getItem('ap_moda_company_info');
    const compObj = rawComp ? JSON.parse(rawComp) : {};
    const compPix = String(compObj?.pixKey || '').trim();

    const uniqueNonEmptyPix = Array.from(new Set([directPix, configPix, compPix].filter(Boolean)));
    if (uniqueNonEmptyPix.length > 1 || (uniqueNonEmptyPix.length === 1 && (!directPix || !configPix))) {
      if (analyticsStatus === 'success') analyticsStatus = 'warning';
      analyticLogs.push({
        timestamp: new Date().toISOString(),
        scope: 'Integridade de Dados',
        testName: 'Espelhamento de Chave Pix',
        status: 'warning',
        message: 'As chaves Pix entre Configurações, Vitrine e Dados da Empresa estão dessincronizadas.',
        details: `Valores encontrados: [${uniqueNonEmptyPix.join(' | ')}]. Use "Autocorreção (Self-Heal)" para unificar.`
      });
    } else {
      analyticLogs.push({
        timestamp: new Date().toISOString(),
        scope: 'Integridade de Dados',
        testName: 'Espelhamento de Chave Pix',
        status: 'success',
        message: uniqueNonEmptyPix[0]
          ? `Chave Pix sincronizada entre todos os módulos (${uniqueNonEmptyPix[0]}).`
          : 'Chave Pix consistente (nenhuma divergência detectada).'
      });
    }
  } catch {}

  // Check stale healthcheck keys residue in DB
  if ((backendHealth?.integrity?.staleHealthKeys || 0) > 0) {
    if (analyticsStatus === 'success') analyticsStatus = 'warning';
    analyticLogs.push({
      timestamp: new Date().toISOString(),
      scope: 'Integridade de Dados',
      testName: 'Resíduos Temporários no Banco',
      status: 'warning',
      message: `${backendHealth.integrity.staleHealthKeys} chave(s) temporária(s) de teste encontrada(s) em ap_system_configs.`,
      details: 'Clique em "Autocorreção (Self-Heal)" para remover resíduos imediatamente.'
    });
  }

  // --- SÍNTESE FINAL REAL ---
  const allLogs = [...dbLogs, ...permLogs, ...workflowLogs, ...analyticLogs];
  const errors = allLogs.filter(l => l.status === 'error').length;
  const warnings = allLogs.filter(l => l.status === 'warning').length;

  let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (errors > 0) overallStatus = 'critical';
  else if (warnings > 0) overallStatus = 'warning';

  const supabaseConnected = Boolean(backendHealth?.supabase?.cloudReachable) && databaseStatus !== 'error';

  return {
    overallStatus,
    timestamp,
    supabaseConnected,
    liveSummary: backendHealth ? {
      supabaseMode: backendHealth.supabase?.mode || 'unknown',
      hubOk: Boolean(backendHealth.hub?.ok),
      infinitePayOk: Boolean(backendHealth.infinitepay?.ok),
      melhorEnvioOk: Boolean(backendHealth.melhorEnvio?.ok),
      renderReachable: Boolean(backendHealth.render?.reachable),
      renderUpToDate: Boolean(backendHealth.render?.apiUpToDate),
      googleOAuthConfigured: Boolean(backendHealth.googleOAuth?.configured)
    } : undefined,
    checks: {
      database: {
        status: databaseStatus,
        message: databaseStatus === 'success' ? 'Tabelas e conexão Supabase Cloud verificadas.' : 'Falha ou fallback no banco de dados.',
        logs: dbLogs
      },
      permissions: {
        status: permissionsStatus,
        message: permissionsStatus === 'success' ? 'Ciclo Write/Read/Delete validado sem erros.' : 'Falha nas permissões R/W/D.',
        logs: permLogs
      },
      workflows: {
        status: workflowsStatus,
        message: workflowsStatus === 'success' ? 'Hub IA, InfinitePay, Melhor Envio e servidor validados.' : 'Integrações externas com alertas ou pendências.',
        logs: workflowLogs
      },
      analytics: {
        status: analyticsStatus,
        message: analyticsStatus === 'success' ? 'Integridade de JSONs, catálogo e chaves validada.' : 'Divergências locais/nuvem detectadas.',
        logs: analyticLogs
      }
    },
    metrics: {
      tablesVerifiedCount: tablesVerified,
      errorsCount: errors,
      warningsCount: warnings
    }
  };
}

export async function runSystemSelfHeal(): Promise<SelfHealReport> {
  const actions: string[] = [];
  const remainingWarnings: string[] = [];
  let fixedCount = 0;

  // 1. Limpar caches JSON corrompidos
  for (const key of CRITICAL_JSON_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        JSON.parse(raw);
      } catch {
        localStorage.removeItem(key);
        fixedCount++;
        actions.push(`Chave localStorage corrompida removida para reconstrução segura: ${key}.`);
      }
    }
  }

  // 2. Remover flags antigas/obsoletas de diagnóstico
  if (localStorage.getItem('ap_moda_company_info_stale')) {
    localStorage.removeItem('ap_moda_company_info_stale');
    fixedCount++;
    actions.push('Flag obsoleta "ap_moda_company_info_stale" removida.');
  }

  // 3. Deduplicar IDs em coleções locais
  const arrayKeys = ['ap_moda_products', 'ap_moda_clients', 'ap_moda_sales', 'ap_moda_transactions', 'ap_moda_online_orders', 'ap_moda_team'];
  for (const k of arrayKeys) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) continue;
      const seen = new Set<string>();
      const clean: any[] = [];
      let removed = 0;
      for (const item of parsed) {
        const id = item?.id ? String(item.id) : '';
        if (!id) { clean.push(item); continue; }
        if (!seen.has(id)) {
          seen.add(id);
          clean.push(item);
        } else {
          removed++;
        }
      }
      if (removed > 0) {
        safeLocalStorageSet(k, JSON.stringify(clean));
        fixedCount += removed;
        actions.push(`Removido(s) ${removed} ID(s) duplicado(s) em ${k}.`);
      }
    } catch {}
  }

  // 4. Saneamento de imagens placeholder SVG, preços NaN e estoque negativo em produtos locais + sync na nuvem
  try {
    const rawProds = localStorage.getItem('ap_moda_products');
    if (rawProds) {
      const prods = JSON.parse(rawProds);
      if (Array.isArray(prods)) {
        const repairedProducts: any[] = [];
        const updatedList = prods.map((p: any) => {
          if (!p) return p;
          let dirty = false;
          const imgs = Array.isArray(p.images) ? p.images : [];
          const cleanImgs = Array.from(new Set(imgs.filter((u: any) => typeof u === 'string' && u.trim() !== '' && !isBadPlaceholderImage(u))));
          let mainImg = typeof p.image === 'string' ? p.image.trim() : '';
          if (isBadPlaceholderImage(mainImg)) {
            mainImg = cleanImgs[0] || '';
            dirty = true;
          }
          if (cleanImgs.length !== imgs.length) dirty = true;
          let price = Number(p.price);
          if (Number.isNaN(price) || price < 0) { price = 0; dirty = true; }
          let stock = Number(p.stock);
          if (Number.isNaN(stock) || stock < 0) { stock = 0; dirty = true; }
          if (dirty) {
            const fixed = { ...p, image: mainImg, images: cleanImgs, price, stock };
            repairedProducts.push(fixed);
            return fixed;
          }
          return p;
        });

        if (repairedProducts.length > 0) {
          safeLocalStorageSet('ap_moda_products', JSON.stringify(updatedList));
          fixedCount += repairedProducts.length;
          await syncBulkProductsToSupabase(repairedProducts);
          actions.push(`Corrigidas imagens/valores em ${repairedProducts.length} produto(s) e sincronizado com o banco.`);
        }
      }
    }
  } catch (e: any) {
    remainingWarnings.push(`Reparo de produtos: ${e.message || e}`);
  }

  // 4.5. Normalizar status de vendas legados ('Pago'/'Concluído' -> 'Concluída') e deduplicar entradas financeiras de vendas
  try {
    const rawSales = localStorage.getItem('ap_moda_sales');
    if (rawSales) {
      const salesArr = JSON.parse(rawSales);
      if (Array.isArray(salesArr)) {
        const repairedSales: any[] = [];
        const normalizedSales = salesArr.map((s: any) => {
          if (s && (s.status === 'Pago' || s.status === 'Concluído' || s.status === 'Entregue')) {
            const updated = { ...s, status: 'Concluída' };
            repairedSales.push(updated);
            return updated;
          }
          return s;
        });
        if (repairedSales.length > 0) {
          safeLocalStorageSet('ap_moda_sales', JSON.stringify(normalizedSales));
          await syncBulkSalesToSupabase(repairedSales);
          fixedCount += repairedSales.length;
          actions.push(`Padronizado status de ${repairedSales.length} venda(s) para "Concluída" no cache e na nuvem.`);
        }
      }
    }

    const rawTx = localStorage.getItem('ap_moda_transactions');
    if (rawTx) {
      const txArr = JSON.parse(rawTx);
      if (Array.isArray(txArr)) {
        const seenSaleTx = new Set<string>();
        const cleanTx: any[] = [];
        let dupTxCount = 0;
        for (const t of txArr) {
          if (!t) continue;
          let saleKey = '';
          const idStr = String(t.id || '');
          const descStr = String(t.description || '');
          if (t.type === 'inflow') {
            if (idStr.startsWith('tx-')) {
              saleKey = idStr.slice(3).toUpperCase();
            } else if (idStr.startsWith('t-inf-')) {
              const m = descStr.match(/Pedido\s*#?([A-Za-z0-9\-_]+)/i);
              if (m && m[1]) saleKey = m[1].toUpperCase();
            }
          }
          if (saleKey) {
            if (seenSaleTx.has(saleKey)) {
              dupTxCount++;
              continue;
            }
            seenSaleTx.add(saleKey);
          }
          cleanTx.push(t);
        }
        if (dupTxCount > 0) {
          safeLocalStorageSet('ap_moda_transactions', JSON.stringify(cleanTx));
          await syncBulkTransactionsToSupabase(cleanTx);
          fixedCount += dupTxCount;
          actions.push(`Removido(s) ${dupTxCount} lançamento(s) financeiro(s) duplicado(s) de venda.`);
        }
      }
    }
  } catch (e: any) {
    remainingWarnings.push(`Reparo de vendas: ${e.message || e}`);
  }

  // 5. Unificar Chave Pix e Handle InfinitePay entre módulos
  try {
    const rawPay = localStorage.getItem('ap_moda_payment_config');
    const payObj = rawPay ? JSON.parse(rawPay) : {};
    const directPix = (localStorage.getItem('ap_pix_key') || '').trim();
    const rawComp = localStorage.getItem('ap_moda_company_info');
    const compObj = rawComp ? JSON.parse(rawComp) : {};
    const canonicalPix = String(payObj?.pixKey || directPix || compObj?.pixKey || '').trim();

    if (canonicalPix) {
      let pixChanged = false;
      if (directPix !== canonicalPix) {
        safeLocalStorageSet('ap_pix_key', canonicalPix);
        await pushSystemConfigToSupabase('ap_pix_key', canonicalPix);
        pixChanged = true;
      }
      if (String(payObj?.pixKey || '').trim() !== canonicalPix) {
        const nextPay = { ...payObj, pixKey: canonicalPix };
        safeLocalStorageSet('ap_moda_payment_config', JSON.stringify(nextPay));
        await pushSystemConfigToSupabase('ap_moda_payment_config', JSON.stringify(nextPay));
        pixChanged = true;
      }
      if (rawComp && String(compObj?.pixKey || '').trim() !== canonicalPix) {
        safeLocalStorageSet('ap_moda_company_info', JSON.stringify({ ...compObj, pixKey: canonicalPix }));
        pixChanged = true;
      }
      if (pixChanged) {
        fixedCount++;
        actions.push(`Chave Pix unificada e sincronizada (${canonicalPix}).`);
      }
    }

    const rawInf = localStorage.getItem('ap_infinitepay_config');
    const infObj = rawInf ? JSON.parse(rawInf) : {};
    const directHandle = (localStorage.getItem('infinitepay_handle') || '').trim();
    const canonicalHandle = String(infObj?.handle || directHandle || '').trim();
    if (canonicalHandle && (directHandle !== canonicalHandle || String(infObj?.handle || '').trim() !== canonicalHandle)) {
      safeLocalStorageSet('infinitepay_handle', canonicalHandle);
      await pushSystemConfigToSupabase('infinitepay_handle', canonicalHandle);
      if (rawInf) {
        const nextInf = { ...infObj, handle: canonicalHandle };
        safeLocalStorageSet('ap_infinitepay_config', JSON.stringify(nextInf));
        await pushSystemConfigToSupabase('ap_infinitepay_config', JSON.stringify(nextInf));
      }
      fixedCount++;
      actions.push(`Handle InfinitePay sincronizado (${canonicalHandle}).`);
    }
  } catch (e: any) {
    remainingWarnings.push(`Sincronia de pagamentos: ${e.message || e}`);
  }

  // 6. Executar Autocorreção real no Servidor Express & Supabase
  try {
    const srvRes = await fetch('/api/system/self-heal', { method: 'POST' });
    if (srvRes.ok) {
      const srvData = await srvRes.json();
      fixedCount += Number(srvData.fixedCount || 0);
      if (Array.isArray(srvData.actions)) {
        actions.push(...srvData.actions);
      }
      if (Array.isArray(srvData.warnings)) {
        remainingWarnings.push(...srvData.warnings);
      }
    } else {
      remainingWarnings.push(`Servidor retornou HTTP ${srvRes.status} durante self-heal.`);
    }
  } catch (e: any) {
    remainingWarnings.push(`Falha ao executar /api/system/self-heal: ${e.message || e}`);
  }

  // 7. Re-sincronizar configurações da nuvem e atualizar UI do sistema
  try {
    await syncSystemConfigsWithSupabase();
    safeLocalStorageSet('ap_last_schema_heal', new Date().toISOString());
    window.dispatchEvent(new Event('ap-storage-synced'));
    window.dispatchEvent(new Event('store_config_updated'));
  } catch {}

  // 8. Re-executar varredura completa pós-reparo
  const diagnosticsAfter = await runDeepSystemDiagnostics();

  // Apontar explicitamente pendências externas que exigem ação humana fora do navegador
  if (diagnosticsAfter.liveSummary && diagnosticsAfter.liveSummary.renderReachable && !diagnosticsAfter.liveSummary.renderUpToDate) {
    remainingWarnings.push('Ação externa necessária: faça redeploy no Render para publicar as rotas atualizadas do servidor.');
  }
  if (diagnosticsAfter.liveSummary && !diagnosticsAfter.liveSummary.googleOAuthConfigured) {
    remainingWarnings.push('Ação opcional: configure Client ID e Client Secret na aba Google Workspace se desejar usar Drive/Sheets/Gmail.');
  }

  return {
    success: true,
    fixedCount,
    actions: actions.length > 0 ? actions : ['Nenhuma corrupção local encontrada; conexão e caches revalidados.'],
    remainingWarnings,
    diagnosticsAfter,
    timestamp: new Date().toISOString()
  };
}
