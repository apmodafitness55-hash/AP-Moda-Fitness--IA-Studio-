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
 * Retorna todas as solicitações de saque de parceiros armazenadas no sistema
 */
export function getStoredPartnerWithdrawRequests(): PartnerWithdrawRequest[] {
  try {
    const saved = localStorage.getItem('ap_partner_withdraw_requests');
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading partner withdraw requests from localStorage:', e);
  }
  return [];
}

/**
 * Salva a lista global de solicitações de saque e sincroniza com o Supabase e localStorage de parceiros
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

    // Sincroniza diretamente com o Supabase na tabela ap_system_configs
    await pushSystemConfigToSupabase('ap_partner_withdraw_requests', JSON.stringify(reqs));
    
    // Dispara eventos em tempo real para re-renderização dos componentes
    window.dispatchEvent(new CustomEvent('ap-partner-withdraws-updated', { detail: reqs }));
    window.dispatchEvent(new Event('ap-storage-synced'));
  } catch (e) {
    console.error('Error saving partner withdraw requests:', e);
  }
}

/**
 * Registra uma nova solicitação de saque Pix feita pela parceira no portal
 */
export async function addPartnerWithdrawRequest(
  newReq: PartnerWithdrawRequest
): Promise<PartnerWithdrawRequest[]> {
  const current = getStoredPartnerWithdrawRequests();
  // Evita duplicatas se já tiver o mesmo ID
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
