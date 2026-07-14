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

export const SUPABASE_SETUP_INFO = "Conexão direta ao Supabase ativa.";
export const FIREBASE_SETUP_INFO = SUPABASE_SETUP_INFO;

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
export const getFirebaseConfig = getSupabaseConfig;

export function initializeSupabaseConfig(...args: any[]) {
  return Promise.resolve();
}
export const initializeFirebaseConfig = initializeSupabaseConfig;

export function reinitializeSupabase(...args: any[]) {
  return;
}
export const reinitializeFirebase = reinitializeSupabase;

export const supabaseConfig = getSupabaseConfig();
export const firebaseConfig = supabaseConfig;

export function isSupabaseConfigured() {
  return true;
}
export const isFirebaseConfigured = isSupabaseConfigured;

export function pingSupabaseOnLogin(...args: any[]) {
  return Promise.resolve(true);
}
export const pingFirebaseOnLogin = pingSupabaseOnLogin;

export function saveSupabaseConfigToServer(url: string, key: string) {
  return Promise.resolve();
}
export const saveFirebaseConfigToServer = saveSupabaseConfigToServer;

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
export const getFirebaseClient = getSupabaseClient;

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

export async function fetchTeamMembersFromFirebase(options?: { limit?: number; offset?: number }, ...args: any[]) {
  return restFetch('/api/proxy/team-members', options);
}

export async function syncBulkTeamMembersToFirebase(data: any, ...args: any[]) {
  return restPost('/api/proxy/team-members', data);
}

export async function fetchProductsFromFirebase(options?: { limit?: number; offset?: number }, ...args: any[]) {
  return restFetch('/api/proxy/products', options);
}

export async function syncBulkProductsToFirebase(data: any, ...args: any[]) {
  return restPost('/api/proxy/products', data);
}

export async function deleteProductFromFirebase(id: string, ...args: any[]) {
  return restDelete(`/api/proxy/products/${id}`);
}

export async function deleteSaleFromFirebase(id: string, ...args: any[]) {
  return restDelete(`/api/proxy/sales/${id}`);
}

export async function fetchClientsFromFirebase(options?: { limit?: number; offset?: number }, ...args: any[]) {
  return restFetch('/api/proxy/clients', options);
}

export async function syncBulkClientsToFirebase(data: any, ...args: any[]) {
  return restPost('/api/proxy/clients', data);
}

export async function fetchSalesFromFirebase(options?: { limit?: number; offset?: number }, ...args: any[]) {
  return restFetch('/api/proxy/sales', options);
}

export async function syncBulkSalesToFirebase(data: any, ...args: any[]) {
  return restPost('/api/proxy/sales', data);
}

export async function fetchTransactionsFromFirebase(options?: { limit?: number; offset?: number }, ...args: any[]) {
  return restFetch('/api/proxy/transactions', options);
}

export async function syncBulkTransactionsToFirebase(data: any, ...args: any[]) {
  return restPost('/api/proxy/transactions', data);
}

export async function fetchOnlineOrdersFromFirebase(options?: { limit?: number; offset?: number }, ...args: any[]) {
  return restFetch('/api/proxy/online-orders', options);
}

export async function syncBulkOnlineOrdersToFirebase(data: any, ...args: any[]) {
  return restPost('/api/proxy/online-orders', data);
}

export async function fetchCheckoutsFromFirebase(options?: { limit?: number; offset?: number }, ...args: any[]) {
  return restFetch('/api/proxy/checkouts', options);
}

export async function syncBulkCheckoutsToFirebase(data: any, ...args: any[]) {
  return restPost('/api/proxy/checkouts', data);
}

export async function fetchCardTerminalsFromFirebase(options?: { limit?: number; offset?: number }, ...args: any[]) {
  return restFetch('/api/proxy/card-terminals', options);
}

export async function syncBulkCardTerminalsToFirebase(data: any, ...args: any[]) {
  return restPost('/api/proxy/card-terminals', data);
}

export async function deleteCardTerminalFromFirebase(id: string, ...args: any[]) {
  return restDelete(`/api/proxy/card-terminals/${id}`);
}

export async function pushSystemConfigToFirebase(key: string, value: any, ...args: any[]) {
  return restPost('/api/proxy/system-configs', { key, value });
}

export async function syncSystemConfigsWithFirebase(...args: any[]) {
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

export async function clearAllFirebaseData(...args: any[]) {
  try {
    const res = await fetch('/api/proxy/clear-all', { method: 'POST' });
    return res.ok;
  } catch (e) {
    return false;
  }
}
