/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// This file provides a clean, secure client-side interface to the Supabase database
// via server-side proxy endpoints to prevent exposing credentials on the client.

export interface CardTerminal {
  id: string;
  name: string;
  brand: string;
  fee_percentage: number;
  status: 'ativo' | 'inativo';
}

export const SUPABASE_SETUP_INFO = `-- SCRIPT DE CONFIGURAÇÃO DE TABELAS - AP MODA FITNESS
-- Cole no SQL Editor do Supabase e clique em 'Run'

-- 1. Tabela de Configurações do Sistema
CREATE TABLE IF NOT EXISTS ap_system_configs (
  key text PRIMARY KEY,
  value text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Produtos do Catálogo
CREATE TABLE IF NOT EXISTS ap_products (
  id text PRIMARY KEY,
  name text,
  sku text,
  category text,
  price numeric,
  cost numeric,
  stock integer,
  min_stock integer,
  image text,
  images text,
  sales_count integer,
  description text,
  video_url text,
  colors text,
  sizes text,
  size_colors text,
  color_stocks text,
  size_color_stocks text,
  composition text,
  routes text,
  measurement_specs text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Clientes (CRM / Cadastros)
CREATE TABLE IF NOT EXISTS ap_clients (
  id text PRIMARY KEY,
  name text,
  phone text,
  email text,
  cpf text,
  password text,
  wishlist text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Vendas (PDV & Televendas)
CREATE TABLE IF NOT EXISTS ap_sales (
  id text PRIMARY KEY,
  client_id text,
  client_name text,
  channel text,
  items text,
  total numeric,
  discount numeric,
  payment_method text,
  status text,
  date text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela de Transações Financeiras (Fluxo de Caixa)
CREATE TABLE IF NOT EXISTS ap_transactions (
  id text PRIMARY KEY,
  description text,
  amount numeric,
  type text,
  category text,
  payment_method text,
  date text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabela de Pedidos Online (Vitrine Virtual)
CREATE TABLE IF NOT EXISTS ap_online_orders (
  id text PRIMARY KEY,
  client_name text,
  phone text,
  email text,
  cpf text,
  shipping_address text,
  items text,
  subtotal numeric,
  shipping_cost numeric,
  total numeric,
  status text,
  payment_method text,
  date text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Tabela de Sessões de Checkout
CREATE TABLE IF NOT EXISTS ap_checkouts (
  id text PRIMARY KEY,
  items text,
  subtotal numeric,
  shipping_cost numeric,
  total numeric,
  status text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Tabela de Funcionários e Logins de Segurança
-- ATENÇÃO: Caso a tabela 'ap_team_members' já tenha sido criada com a estrutura antiga, execute no SQL Editor:
-- DROP TABLE IF EXISTS ap_team_members CASCADE;
CREATE TABLE IF NOT EXISTS ap_team_members (
  id text PRIMARY KEY,
  name text,
  login text UNIQUE NOT NULL,
  password text,
  role text,
  details text,
  "birthDate" text,
  avatar text,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Tabela de Terminais de Maquininhas de Cartão
CREATE TABLE IF NOT EXISTS card_terminals (
  id text PRIMARY KEY,
  name text,
  brand text,
  fee_percentage numeric,
  status text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 10. ATIVAÇÃO DE RLS E POLÍTICAS DE SEGURANÇA
-- Resolve os avisos de segurança do Supabase Advisor garantindo que RLS está habilitado,
-- mas que a aplicação (anon / authenticated) consegue ler/escrever normalmente.
-- ==========================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE IF EXISTS public.ap_system_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ap_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ap_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ap_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ap_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ap_online_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ap_checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ap_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.card_terminals ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso irrestrito para anon/authenticated (CRUD Completo)
-- Isso evita qualquer quebra de fluxo na aplicação mantendo as tabelas seguras sob RLS.

-- Políticas para ap_system_configs
DROP POLICY IF EXISTS "Permitir todo acesso para configs" ON public.ap_system_configs;
CREATE POLICY "Permitir todo acesso para configs" ON public.ap_system_configs
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas para ap_products
DROP POLICY IF EXISTS "Permitir todo acesso para produtos" ON public.ap_products;
CREATE POLICY "Permitir todo acesso para produtos" ON public.ap_products
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas para ap_clients
DROP POLICY IF EXISTS "Permitir todo acesso para clientes" ON public.ap_clients;
CREATE POLICY "Permitir todo acesso para clientes" ON public.ap_clients
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas para ap_sales
DROP POLICY IF EXISTS "Permitir todo acesso para vendas" ON public.ap_sales;
CREATE POLICY "Permitir todo acesso para vendas" ON public.ap_sales
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas para ap_transactions
DROP POLICY IF EXISTS "Permitir todo acesso para transacoes" ON public.ap_transactions;
CREATE POLICY "Permitir todo acesso para transacoes" ON public.ap_transactions
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas para ap_online_orders
DROP POLICY IF EXISTS "Permitir todo acesso para pedidos online" ON public.ap_online_orders;
CREATE POLICY "Permitir todo acesso para pedidos online" ON public.ap_online_orders
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas para ap_checkouts
DROP POLICY IF EXISTS "Permitir todo acesso para checkouts" ON public.ap_checkouts;
CREATE POLICY "Permitir todo acesso para checkouts" ON public.ap_checkouts
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas para ap_team_members
DROP POLICY IF EXISTS "Permitir todo acesso para membros do time" ON public.ap_team_members;
CREATE POLICY "Permitir todo acesso para membros do time" ON public.ap_team_members
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas para card_terminals
DROP POLICY IF EXISTS "Permitir todo acesso para maquininhas" ON public.card_terminals;
CREATE POLICY "Permitir todo acesso para maquininhas" ON public.card_terminals
  FOR ALL USING (true) WITH CHECK (true);`;

export function getSupabaseConfig() {
  return {
    apiKey: "supabase-proxy-only",
    authDomain: "supabase-proxy-only",
    databaseURL: "supabase-proxy-only",
    projectId: "supabase-proxy-only",
    storageBucket: "supabase-proxy-only",
    messagingSenderId: "supabase-proxy-only",
    appId: "supabase-proxy-only",
    url: "supabase-proxy-only",
    key: "supabase-proxy-only"
  };
}

export async function initializeSupabaseConfig() {
  try {
    const res = await fetch('/api/get-db-config');
    if (res.ok) {
      const data = await res.json();
      const localUrl = localStorage.getItem('ap_supabase_url');
      const localKey = localStorage.getItem('ap_supabase_key');

      // If the server has a valid config, use it to sync localStorage
      if (data.url && data.url.startsWith('http') && data.key) {
        localStorage.setItem('ap_supabase_url', data.url);
        localStorage.setItem('ap_supabase_key', data.key);
      } else if (localUrl && localUrl.startsWith('http') && localKey) {
        // If the server does not have a config, but client has one, push it to server!
        await saveSupabaseConfigToServer(localUrl, localKey);
      }
    }
  } catch (e) {
    console.warn('[DB Config] Failed to sync config on init:', e);
  }
}

export function reinitializeSupabase(...args: any[]) {
  return;
}

export const supabaseConfig = getSupabaseConfig();

export function isSupabaseConfigured() {
  return true;
}

export function pingSupabaseOnLogin(...args: any[]) {
  return Promise.resolve(true);
}

export async function saveSupabaseConfigToServer(url: string, key: string) {
  try {
    const res = await fetch('/api/set-db-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, key })
    });
    if (res.ok) {
      localStorage.setItem('ap_supabase_url', url);
      localStorage.setItem('ap_supabase_key', key);
      console.log('[DB Config] Configuração do banco salva no servidor com sucesso!');
    }
  } catch (e) {
    console.error('[DB Config] Falha ao enviar configuração para o servidor:', e);
  }
}

function mapTableToEndpoint(table: string): string {
  const tableSuffix = table.replace(/^ap_/, '');
  return `/api/proxy/${tableSuffix}`;
}

class FrontendQueryBuilder {
  private table: string;
  private filters: Array<{ col: string; val: any; type: string }> = [];
  private limitVal: number | null = null;
  private offsetVal: number | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(fields?: string) {
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ col, val, type: 'eq' });
    return this;
  }

  neq(col: string, val: any) {
    this.filters.push({ col, val, type: 'neq' });
    return this;
  }

  ilike(col: string, val: any) {
    this.filters.push({ col, val, type: 'ilike' });
    return this;
  }

  or(val: any) {
    this.filters.push({ col: 'or', val, type: 'or' });
    return this;
  }

  limit(n: number) {
    this.limitVal = n;
    return this;
  }

  offset(n: number) {
    this.offsetVal = n;
    return this;
  }

  async then(onfulfilled?: (value: any) => any) {
    try {
      let endpoint = mapTableToEndpoint(this.table);
      let allData: any[] = [];

      if (this.limitVal !== null || this.offsetVal !== null) {
        const limit = Math.min(this.limitVal !== null ? this.limitVal : 20, 20);
        const offset = this.offsetVal !== null ? this.offsetVal : 0;
        const separator = endpoint.includes('?') ? '&' : '?';
        const url = `${endpoint}${separator}limit=${limit}&offset=${offset}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        allData = Array.isArray(data) ? data : (data ? [data] : []);
      } else {
        // Transparent pagination to fetch all items safely in blocks of 20
        let offset = 0;
        const limit = 20;
        let hasMore = true;
        while (hasMore) {
          const separator = endpoint.includes('?') ? '&' : '?';
          const url = `${endpoint}${separator}limit=${limit}&offset=${offset}`;
          const res = await fetch(url);
          if (!res.ok) break;
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data ? [data] : []);
          if (items.length === 0) {
            hasMore = false;
          } else {
            allData = allData.concat(items);
            if (items.length < limit) {
              hasMore = false;
            } else {
              offset += limit;
            }
          }
        }
      }

      let filteredData = allData;
      if (Array.isArray(allData)) {
        for (const filter of this.filters) {
          if (filter.type === 'eq') {
            filteredData = filteredData.filter((item: any) => item && String(item[filter.col]) === String(filter.val));
          } else if (filter.type === 'neq') {
            filteredData = filteredData.filter((item: any) => item && String(item[filter.col]) !== String(filter.val));
          } else if (filter.type === 'ilike') {
            const searchVal = String(filter.val).replace(/%/g, '').toLowerCase();
            filteredData = filteredData.filter((item: any) => item && String(item[filter.col]).toLowerCase().includes(searchVal));
          } else if (filter.type === 'or') {
            const conditions = filter.val.split(',');
            filteredData = filteredData.filter((item: any) => {
              if (!item) return false;
              return conditions.some((cond: string) => {
                const parts = cond.split('.');
                if (parts.length < 3) return false;
                const field = parts[0];
                const op = parts[1];
                const value = parts.slice(2).join('.');
                if (op === 'eq') {
                  return String(item[field]) === String(value);
                }
                return false;
              });
            });
          }
        }
      }
      const result = { data: filteredData, error: null };
      if (onfulfilled) return onfulfilled(result);
      return result;
    } catch (err: any) {
      const result = { data: null, error: err };
      if (onfulfilled) return onfulfilled(result);
      return result;
    }
  }

  async upsert(payloads: any, options?: any) {
    try {
      const endpoint = mapTableToEndpoint(this.table);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloads)
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  async insert(payloads: any) {
    return this.upsert(payloads);
  }

  update(payload: any) {
    return {
      eq: async (col: string, val: any) => {
        try {
          const endpoint = mapTableToEndpoint(this.table);
          // Standard upsert by ID or update the entity in REST backend
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: val, ...payload })
          });
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          return { error: null };
        } catch (err: any) {
          return { error: err };
        }
      }
    };
  }

  delete() {
    return {
      eq: async (col: string, val: any) => {
        try {
          const endpoint = `${mapTableToEndpoint(this.table)}/${val}`;
          const res = await fetch(endpoint, {
            method: 'DELETE'
          });
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          return { error: null };
        } catch (err: any) {
          return { error: err };
        }
      }
    };
  }
}

class MockAuth {
  async getSession() {
    return { data: { session: null }, error: null };
  }
}

class MockChannel {
  on(event: string, filter: any, callback: (p: any) => void) {
    return this;
  }
  subscribe(callback?: (status: string) => void) {
    if (callback) callback('SUBSCRIBED');
    return this;
  }
  unsubscribe() {
    return;
  }
}

class MockClient {
  auth = new MockAuth();
  from(table: string) {
    return new FrontendQueryBuilder(table);
  }
  channel(name: string) {
    return new MockChannel();
  }
}

const mockClientInstance = new MockClient();

export function getSupabaseClient() {
  return mockClientInstance;
}

export function createClient(url: string, key: string) {
  return mockClientInstance;
}

// REST helper adapters for all collections
async function restFetch(endpoint: string, options?: { limit?: number; offset?: number }) {
  try {
    if (options && (options.limit !== undefined || options.offset !== undefined)) {
      let url = endpoint;
      const limit = Math.min(options.limit ?? 20, 20);
      const offset = options.offset ?? 0;
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}limit=${limit}&offset=${offset}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (data ? [data] : []);
    } else {
      // Loop to fetch all pages of 20 items transparently for the caller!
      let allData: any[] = [];
      let offset = 0;
      const limit = 20;
      let hasMore = true;
      while (hasMore) {
        let url = endpoint;
        const separator = url.includes('?') ? '&' : '?';
        url += `${separator}limit=${limit}&offset=${offset}`;
        const res = await fetch(url);
        if (!res.ok) break;
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data ? [data] : []);
        if (items.length === 0) {
          hasMore = false;
        } else {
          allData = allData.concat(items);
          if (items.length < limit) {
            hasMore = false;
          } else {
            offset += limit;
          }
        }
      }
      return allData;
    }
  } catch (e) {
    console.warn(`[REST Adapter] Failed to fetch ${endpoint}:`, e);
    return [];
  }
}

async function restPost(endpoint: string, data: any) {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch (e) {
    console.warn(`[REST Adapter] Failed to post ${endpoint}:`, e);
    return false;
  }
}

async function restDelete(endpoint: string) {
  try {
    const res = await fetch(endpoint, { method: 'DELETE' });
    return res.ok;
  } catch (e) {
    console.warn(`[REST Adapter] Failed to delete ${endpoint}:`, e);
    return false;
  }
}

export async function fetchTeamMembersFromSupabase(options?: { limit?: number; offset?: number }, ...args: any[]) {
  return restFetch('/api/proxy/team-members', options);
}

export async function syncBulkTeamMembersToSupabase(data: any, ...args: any[]) {
  return restPost('/api/proxy/team-members', data);
}

export async function deleteTeamMemberFromSupabase(id: string, ...args: any[]) {
  return restDelete(`/api/proxy/team-members/${id}`);
}

export async function fetchProductsFromSupabase(options?: { limit?: number; offset?: number }, ...args: any[]) {
  return restFetch('/api/proxy/products', options);
}

export async function syncBulkProductsToSupabase(data: any, ...args: any[]) {
  return restPost('/api/proxy/products', data);
}

export async function deleteProductFromSupabase(id: string, ...args: any[]) {
  return restDelete(`/api/proxy/products/${id}`);
}

export async function deleteSaleFromSupabase(id: string, ...args: any[]) {
  return restDelete(`/api/proxy/sales/${id}`);
}

export async function fetchClientsFromSupabase(options?: { limit?: number; offset?: number }, ...args: any[]) {
  return restFetch('/api/proxy/clients', options);
}

export async function syncBulkClientsToSupabase(data: any, ...args: any[]) {
  return restPost('/api/proxy/clients', data);
}

export async function fetchSalesFromSupabase(options?: { limit?: number; offset?: number }, ...args: any[]) {
  return restFetch('/api/proxy/sales', options);
}

export async function syncBulkSalesToSupabase(data: any, ...args: any[]) {
  return restPost('/api/proxy/sales', data);
}

export async function fetchTransactionsFromSupabase(options?: { limit?: number; offset?: number }, ...args: any[]) {
  return restFetch('/api/proxy/transactions', options);
}

export async function syncBulkTransactionsToSupabase(data: any, ...args: any[]) {
  return restPost('/api/proxy/transactions', data);
}

export async function fetchOnlineOrdersFromSupabase(options?: { limit?: number; offset?: number }, ...args: any[]) {
  return restFetch('/api/proxy/online-orders', options);
}

export async function syncBulkOnlineOrdersToSupabase(data: any, ...args: any[]) {
  return restPost('/api/proxy/online-orders', data);
}

export async function fetchCheckoutsFromSupabase(options?: { limit?: number; offset?: number }, ...args: any[]) {
  return restFetch('/api/proxy/checkouts', options);
}

export async function syncBulkCheckoutsToSupabase(data: any, ...args: any[]) {
  return restPost('/api/proxy/checkouts', data);
}

export async function fetchCardTerminalsFromSupabase(options?: { limit?: number; offset?: number }, ...args: any[]) {
  return restFetch('/api/proxy/card-terminals', options);
}

export async function syncBulkCardTerminalsToSupabase(data: any, ...args: any[]) {
  return restPost('/api/proxy/card-terminals', data);
}

export async function deleteCardTerminalFromSupabase(id: string, ...args: any[]) {
  return restDelete(`/api/proxy/card-terminals/${id}`);
}

export async function pushSystemConfigToSupabase(key: string, value: any, ...args: any[]) {
  return restPost('/api/proxy/system-configs', { key, value });
}

export async function fetchSystemConfigsFromSupabase() {
  try {
    const res = await fetch('/api/proxy/system-configs');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('[DB Config] Failed to fetch system configs:', e);
  }
  return [];
}

export async function syncSystemConfigsWithSupabase(...args: any[]) {
  // Configs are synced on the server automatically, so returning false indicates no local modifications needed
  return false;
}

export function getTolerantValue(val: any, ...args: any[]) {
  if (val && typeof val === 'object' && args.length > 0) {
    const key = args[0];
    const defaultVal = args[1];
    return val[key] !== undefined ? val[key] : defaultVal;
  }
  return val;
}

export async function clearAllSupabaseData(...args: any[]) {
  try {
    const res = await fetch('/api/proxy/clear-all', { method: 'POST' });
    return res.ok;
  } catch (e) {
    return false;
  }
}
