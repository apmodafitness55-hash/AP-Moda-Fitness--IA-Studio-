export interface Coupon {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minPurchase: number;
  limitUses: number;
  usedCount: number;
  validUntil: string;
  maxPerCpf?: number; // 1 = Apenas 1 vez por CPF (default), 2 = No máximo 2 vezes por CPF, 0 = Sem limite por CPF
  isFirstPurchase?: boolean;
}

export const DEFAULT_COUPONS: Coupon[] = [
  { code: 'PRIMEIRACOMPRA', type: 'percent', value: 10, minPurchase: 0, limitUses: 1000, usedCount: 12, validUntil: '2026-12-31', maxPerCpf: 1, isFirstPurchase: true },
  { code: 'FITNESS10', type: 'percent', value: 10, minPurchase: 150, limitUses: 100, usedCount: 32, validUntil: '2026-06-30', maxPerCpf: 1 },
  { code: 'BEMVINDA50', type: 'fixed', value: 50, minPurchase: 300, limitUses: 50, usedCount: 15, validUntil: '2026-07-15', maxPerCpf: 1 },
  { code: 'FRETEGRATIS', type: 'percent', value: 0, minPurchase: 399, limitUses: 500, usedCount: 88, validUntil: '2026-12-31', maxPerCpf: 0 }
];

export function getStoredCoupons(): Coupon[] {
  try {
    const saved = localStorage.getItem('ap_coupons');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading coupons from localStorage:', e);
  }
  try {
    localStorage.setItem('ap_coupons', JSON.stringify(DEFAULT_COUPONS));
  } catch (e) {}
  return DEFAULT_COUPONS;
}

export function saveStoredCoupons(coupons: Coupon[]): void {
  try {
    localStorage.setItem('ap_coupons', JSON.stringify(coupons));
    window.dispatchEvent(new Event('ap-coupons-updated'));
  } catch (e) {
    console.error('Error saving coupons to localStorage:', e);
  }
}

export function validateCouponForCpf(
  code: string,
  rawCpf: string | undefined,
  sales: any[] = [],
  onlineOrders: any[] = []
): { valid: boolean; message?: string; couponObj?: Coupon } {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, message: 'Informe o código do cupom.' };
  }

  const coupons = getStoredCoupons();
  let matchedCoupon = coupons.find(c => c.code.toUpperCase() === cleanCode);

  const isFirstPurchaseCode =
    ['PRIMEIRACOMPRA', 'PRIMEIRA10', 'PRIMEIRAPEDIDO'].includes(cleanCode) ||
    matchedCoupon?.isFirstPurchase === true;

  // Fallback defaults for hardcoded / campaign codes
  if (!matchedCoupon) {
    if (isFirstPurchaseCode) {
      matchedCoupon = {
        code: cleanCode,
        type: 'percent',
        value: 10,
        minPurchase: 0,
        limitUses: 1000,
        usedCount: 0,
        validUntil: '2026-12-31',
        maxPerCpf: 1,
        isFirstPurchase: true
      };
    } else if (['CLIENTEVIP', 'FIDELIDADE5'].includes(cleanCode)) {
      matchedCoupon = {
        code: cleanCode,
        type: 'percent',
        value: 5,
        minPurchase: 0,
        limitUses: 1000,
        usedCount: 0,
        validUntil: '2026-12-31',
        maxPerCpf: 1
      };
    } else if (['FITNESS10', 'VERAO10', 'QUERO10'].includes(cleanCode)) {
      matchedCoupon = {
        code: cleanCode,
        type: 'percent',
        value: 10,
        minPurchase: 0,
        limitUses: 1000,
        usedCount: 0,
        validUntil: '2026-12-31',
        maxPerCpf: 1
      };
    } else if (['BEMVINDA50', 'MODAFIT50'].includes(cleanCode)) {
      matchedCoupon = {
        code: cleanCode,
        type: 'fixed',
        value: 50,
        minPurchase: 300,
        limitUses: 1000,
        usedCount: 0,
        validUntil: '2026-12-31',
        maxPerCpf: 1
      };
    } else if (cleanCode === 'FRETEGRATIS') {
      matchedCoupon = {
        code: 'FRETEGRATIS',
        type: 'percent',
        value: 0,
        minPurchase: 399,
        limitUses: 1000,
        usedCount: 0,
        validUntil: '2026-12-31',
        maxPerCpf: 0
      };
    } else if (['APMODAFIT', 'APMODAFITNESS'].includes(cleanCode)) {
      matchedCoupon = {
        code: cleanCode,
        type: 'percent',
        value: 10,
        minPurchase: 0,
        limitUses: 1000,
        usedCount: 0,
        validUntil: '2026-12-31',
        maxPerCpf: 1
      };
    }
  }

  if (!matchedCoupon) {
    return { valid: false, message: `Este cupom promocional (${cleanCode}) é inválido ou expirou.` };
  }

  const maxPerCpf = matchedCoupon.maxPerCpf ?? 1;
  const cleanCpf = (rawCpf || '').replace(/\D/g, '');

  if (cleanCpf && cleanCpf.length === 11) {
    const formattedCpf = cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

    // Filter past sales/orders for this CPF
    const pastSales = (sales || []).filter((s: any) => {
      const sCpf = (s.clientCpf || s.clientDoc || s.cpf || '').replace(/\D/g, '');
      return sCpf === cleanCpf;
    });

    const pastOrders = (onlineOrders || []).filter((o: any) => {
      let oCpf = (o.cpf || o.clientCpf || '').replace(/\D/g, '');
      if (!oCpf && o.notes) {
        const match = o.notes.match(/CPF:\s*([0-9.-]+)/i);
        if (match && match[1]) oCpf = match[1].replace(/\D/g, '');
      }
      return oCpf === cleanCpf;
    });

    const totalPastPurchases = pastSales.length + pastOrders.length;

    // 1. Check First Purchase Restriction
    if (isFirstPurchaseCode) {
      if (totalPastPurchases > 0) {
        return {
          valid: false,
          message: `⚠️ O cupom ${cleanCode} é exclusivo para a PRIMEIRA COMPRA por CPF. Identificamos ${totalPastPurchases} compra(s) anterior(es) vinculada(s) ao CPF ${formattedCpf}.`
        };
      }
    }

    // 2. Check Usage Limit per CPF
    if (maxPerCpf > 0) {
      const timesUsedInSales = pastSales.filter((s: any) => {
        const cCode = s.appliedCoupon?.code || s.couponCode || '';
        return cCode.toUpperCase() === cleanCode || (s.notes && s.notes.toUpperCase().includes(cleanCode));
      }).length;

      const timesUsedInOrders = pastOrders.filter((o: any) => {
        const cCode = o.appliedCoupon?.code || o.couponCode || '';
        return cCode.toUpperCase() === cleanCode || (o.notes && o.notes.toUpperCase().includes(cleanCode));
      }).length;

      const totalTimesUsed = timesUsedInSales + timesUsedInOrders;

      if (totalTimesUsed >= maxPerCpf) {
        return {
          valid: false,
          message: `⚠️ O cupom ${cleanCode} permite no máximo ${maxPerCpf} ${maxPerCpf === 1 ? 'uso' : 'usos'} por CPF. Você já utilizou este cupom ${totalTimesUsed} ${totalTimesUsed === 1 ? 'vez' : 'vezes'} com o CPF ${formattedCpf}.`
        };
      }
    }
  }

  return { valid: true, couponObj: matchedCoupon };
}
