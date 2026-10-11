import { pushSystemConfigToSupabase } from '../supabase';

export interface Partner {
  id: string;
  name: string;
  instagram?: string;
  couponCode: string;
  commissionRate?: number;
  salesCount?: number;
  totalGenerated?: number;
  availableBalance?: number;
  login?: string;
  password?: string;
}

export interface PartnerWithdrawRequest {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerCoupon: string;
  partnerInstagram?: string;
  amount: number;
  pixKeyType: string;
  pixKey: string;
  status: 'Pendente' | 'Aprovado' | 'Pago' | 'Rejeitado';
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO string
  paidAt?: string;
  receiptNote?: string;
}

export function getStoredPartners(): Partner[] {
  try {
    const saved = localStorage.getItem('ap_moda_partners');
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading partners from localStorage:', e);
  }
  return [];
}

export function saveStoredPartners(partners: Partner[]): void {
  try {
    localStorage.setItem('ap_moda_partners', JSON.stringify(partners));
    pushSystemConfigToSupabase('ap_moda_partners', JSON.stringify(partners));
    window.dispatchEvent(new Event('ap-storage-synced'));
  } catch (e) {
    console.error('Error saving partners to localStorage:', e);
  }
}

/**
 * Retorna todas as solicitações de saque de parceiros armazenadas no sistema.
 * Realiza varredura profunda: ap_partner_withdraw_requests, ap_withdraw_requests_* e transações financeiras.
 */
export function getStoredPartnerWithdrawRequests(): PartnerWithdrawRequest[] {
  const map = new Map<string, PartnerWithdrawRequest>();

  // 1. Chave global primária
  try {
    const saved = localStorage.getItem('ap_partner_withdraw_requests');
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        parsed.forEach(r => {
          if (r && r.id) map.set(r.id, r);
        });
      }
    }
  } catch (e) {
    console.error('Error reading partner withdraw requests from localStorage:', e);
  }

  // 2. Varredura de chaves individuais de parceiras no localStorage (ap_withdraw_requests_*)
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ap_withdraw_requests_')) {
        try {
          const val = localStorage.getItem(key);
          if (val) {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
              parsed.forEach(r => {
                if (r && r.id && !map.has(r.id)) {
                  map.set(r.id, r);
                }
              });
            }
          }
        } catch (e) {}
      }
    }
  } catch (e) {}

  // 3. Reconstrução a partir de transações de saída de comissão em ap_moda_transactions
  try {
    const savedTrans = localStorage.getItem('ap_moda_transactions');
    if (savedTrans) {
      const transactions = JSON.parse(savedTrans);
      if (Array.isArray(transactions)) {
        transactions.forEach(t => {
          const normCat = String(t.category || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          const normDesc = String(t.description || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          const isPartnerWithdraw = 
            normCat.includes('comiss') ||
            normDesc.includes('comiss') ||
            normDesc.includes('saque pix') ||
            normDesc.includes('resgate pix') ||
            normDesc.includes('saque comiss');

          if (isPartnerWithdraw && Number(t.amount) > 0) {
            const desc = t.description || '';
            const match = desc.match(/solicitado por\s+([^(]+)(?:\(([^)]+)\))?/i);
            const partnerName = match ? match[1].trim() : 'Parceira';
            const partnerCoupon = match && match[2] ? match[2].trim() : '';
            const tDate = t.date ? String(t.date).split('T')[0] : new Date().toISOString().split('T')[0];

            // Verifica se já existe solicitação com mesmo ID ou com mesmo valor/data
            const alreadyExists = Array.from(map.values()).some(r => 
              r.id === t.id || (Math.abs(r.amount - Number(t.amount)) < 0.01 && r.date === tDate)
            );

            if (!alreadyExists) {
              const reconstructedId = t.id && String(t.id).startsWith('REQ-') ? t.id : `REQ-${t.id || Date.now()}`;
              map.set(reconstructedId, {
                id: reconstructedId,
                partnerId: `part-${partnerCoupon || 'comissao'}`,
                partnerName,
                partnerCoupon,
                amount: Number(t.amount),
                pixKeyType: 'Chave Pix',
                pixKey: 'Consultar no comprovante/portal',
                status: t.status === 'pago' ? 'Pago' : 'Pendente',
                date: tDate,
                createdAt: t.date || new Date().toISOString()
              });
            }
          }
        });
      }
    }
  } catch (e) {}

  const result = Array.from(map.values()).sort((a, b) => 
    new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
  );

  return result;
}

/**
 * Salva a lista global de solicitações de saque e sincroniza com o Supabase, servidor e caches
 */
export async function saveStoredPartnerWithdrawRequests(reqs: PartnerWithdrawRequest[]): Promise<void> {
  try {
    localStorage.setItem('ap_partner_withdraw_requests', JSON.stringify(reqs));
    
    // Atualiza também os caches individuais de cada parceira para exibição no portal
    const requestsByPartner = new Map<string, PartnerWithdrawRequest[]>();
    for (const r of reqs) {
      if (!requestsByPartner.has(r.partnerId)) {
        requestsByPartner.set(r.partnerId, []);
      }
      requestsByPartner.get(r.partnerId)!.push(r);
    }
    
    requestsByPartner.forEach((list, pId) => {
      try {
        localStorage.setItem(`ap_withdraw_requests_${pId}`, JSON.stringify(list));
      } catch (err) {}
    });

    // 1. Sincroniza diretamente com o Supabase na tabela ap_system_configs
    pushSystemConfigToSupabase('ap_partner_withdraw_requests', JSON.stringify(reqs)).catch(err => {
      console.warn('Falha no pushSystemConfigToSupabase para saques:', err);
    });

    // 2. Sincroniza diretamente com o endpoint REST dedicado do servidor
    try {
      fetch('/api/partner-withdraw-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqs)
      }).catch(() => {});
    } catch (err) {}
    
    // Dispara eventos em tempo real para re-renderização dos componentes
    window.dispatchEvent(new CustomEvent('ap-partner-withdraws-updated', { detail: reqs }));
    window.dispatchEvent(new Event('ap-storage-synced'));
  } catch (e) {
    console.error('Error saving partner withdraw requests:', e);
  }
}

/**
 * Consulta o servidor e o banco Supabase em busca de novas solicitações feitas remotamente
 */
export async function syncPartnerWithdrawRequestsWithServer(): Promise<PartnerWithdrawRequest[]> {
  try {
    const res = await fetch('/api/partner-withdraw-requests');
    if (res.ok) {
      const serverList = await res.json();
      if (Array.isArray(serverList)) {
        const localList = getStoredPartnerWithdrawRequests();
        const map = new Map<string, PartnerWithdrawRequest>();
        
        serverList.forEach(r => { if (r && r.id) map.set(r.id, r); });
        localList.forEach(r => { if (r && r.id && !map.has(r.id)) map.set(r.id, r); });

        const merged = Array.from(map.values()).sort((a, b) => 
          new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
        );

        // Se local possuir mais itens que o servidor, propaga de volta ao servidor
        if (localList.length > serverList.length) {
          fetch('/api/partner-withdraw-requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(merged)
          }).catch(() => {});
        }

        localStorage.setItem('ap_partner_withdraw_requests', JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent('ap-partner-withdraws-updated', { detail: merged }));
        window.dispatchEvent(new Event('ap-storage-synced'));
        return merged;
      }
    }
  } catch (err) {
    console.warn('[Sync Partner Withdraws] Falha ao consultar endpoint:', err);
  }
  return getStoredPartnerWithdrawRequests();
}

/**
 * Registra uma solicitação de teste para simulação imediata de fluxo
 */
export async function simulatePartnerWithdrawRequestForTesting(
  partnerName = 'Marina Fitness Coach',
  coupon = 'MARINAFIT10',
  amount = 85.0
): Promise<PartnerWithdrawRequest> {
  const req: PartnerWithdrawRequest = {
    id: `REQ-${Date.now().toString().slice(-6)}`,
    partnerId: `part-${coupon.toLowerCase()}`,
    partnerName,
    partnerCoupon: coupon,
    amount,
    pixKeyType: 'Chave Pix (Telefone)',
    pixKey: '+55 84 99988-7766',
    status: 'Pendente',
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  };
  await addPartnerWithdrawRequest(req);
  return req;
}

/**
 * Registra uma nova solicitação de saque Pix feita pela parceira no portal
 */
export async function addPartnerWithdrawRequest(
  newReq: PartnerWithdrawRequest
): Promise<PartnerWithdrawRequest[]> {
  const current = getStoredPartnerWithdrawRequests();
  const filtered = current.filter(r => r.id !== newReq.id);
  const updated = [newReq, ...filtered];
  
  await saveStoredPartnerWithdrawRequests(updated);
  
  // Dispara evento imediato de solicitação para acionar sino de notificações e som no sistema
  window.dispatchEvent(new CustomEvent('ap-partner-withdraw-requested', { detail: newReq }));
  
  return updated;
}

/**
 * Atualiza o status de uma solicitação de pagamento (Pendente -> Pago / Rejeitado)
 */
export async function updatePartnerWithdrawRequestStatus(
  id: string,
  status: 'Pendente' | 'Aprovado' | 'Pago' | 'Rejeitado',
  note?: string
): Promise<PartnerWithdrawRequest[]> {
  const current = getStoredPartnerWithdrawRequests();
  let updatedPartnerId: string | null = null;
  let refundedAmount = 0;

  const updated = current.map(req => {
    if (req.id === id) {
      updatedPartnerId = req.partnerId;
      refundedAmount = req.amount;
      return {
        ...req,
        status,
        receiptNote: note !== undefined ? note : req.receiptNote,
        paidAt: status === 'Pago' ? new Date().toISOString() : req.paidAt
      };
    }
    return req;
  });

  // Se o saque foi rejeitado pelo admin, estorna o saldo disponível da parceira
  if (status === 'Rejeitado' && updatedPartnerId && refundedAmount > 0) {
    try {
      const allPartners = getStoredPartners();
      const nextPartners = allPartners.map(p => {
        if (p.id === updatedPartnerId) {
          const currentBal = typeof p.availableBalance === 'number' ? p.availableBalance : 0;
          return { ...p, availableBalance: currentBal + refundedAmount };
        }
        return p;
      });
      saveStoredPartners(nextPartners);
    } catch (err) {
      console.warn('Erro ao estornar saldo de parceira rejeitada:', err);
    }
  }

  await saveStoredPartnerWithdrawRequests(updated);
  return updated;
}
