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
  category?: string; // Ex: "Macacões", "Leggings", "Tops", "Shorts", "Conjuntos" ou "Todas" / undefined
  partnerName?: string; // Nome do parceiro/influenciador vinculado
  partnerId?: string; // ID do parceiro no sistema
}

export const DEFAULT_COUPONS: Coupon[] = [
  { code: 'PRIMEIRACOMPRA', type: 'percent', value: 10, minPurchase: 0, limitUses: 1000, usedCount: 12, validUntil: '2026-12-31', maxPerCpf: 1, isFirstPurchase: true, category: 'Todas' },
  { code: 'FITNESS10', type: 'percent', value: 10, minPurchase: 150, limitUses: 100, usedCount: 32, validUntil: '2026-06-30', maxPerCpf: 1, category: 'Todas' },
  { code: 'BEMVINDA50', type: 'fixed', value: 50, minPurchase: 300, limitUses: 50, usedCount: 15, validUntil: '2026-07-15', maxPerCpf: 1, category: 'Todas' },
  { code: 'FRETEGRATIS', type: 'percent', value: 0, minPurchase: 399, limitUses: 500, usedCount: 88, validUntil: '2026-12-31', maxPerCpf: 0, category: 'Todas' },
  { code: 'MACACAO20', type: 'percent', value: 20, minPurchase: 0, limitUses: 100, usedCount: 5, validUntil: '2026-12-31', maxPerCpf: 1, category: 'Macacões' },
  { code: 'LEGGING15', type: 'percent', value: 15, minPurchase: 0, limitUses: 100, usedCount: 8, validUntil: '2026-12-31', maxPerCpf: 1, category: 'Leggings' },
  { code: 'CAMILA10', type: 'percent', value: 10, minPurchase: 0, limitUses: 500, usedCount: 14, validUntil: '2026-12-31', maxPerCpf: 1, category: 'Todas', partnerName: 'Camila Parceira' }
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
  onlineOrders: any[] = [],
  cartItems: any[] = []
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
        isFirstPurchase: true,
        category: 'Todas'
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
        maxPerCpf: 1,
        category: 'Todas'
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
        maxPerCpf: 1,
        category: 'Todas'
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
        maxPerCpf: 1,
        category: 'Todas'
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
        maxPerCpf: 0,
        category: 'Todas'
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
        maxPerCpf: 1,
        category: 'Todas'
      };
    }
  }

  if (!matchedCoupon) {
    return { valid: false, message: `Este cupom promocional (${cleanCode}) é inválido ou expirou.` };
  }

  // Check Category Restriction if specified (and not 'Todas' / 'Livre')
  const reqCategory = matchedCoupon.category?.trim();
  if (reqCategory && !['todas', 'todas as categorias', 'livre', 'geral', ''].includes(reqCategory.toLowerCase())) {
    if (cartItems && cartItems.length > 0) {
      const targetCat = reqCategory.toLowerCase();
      const hasMatchingItem = cartItems.some((item: any) => {
        const itemCat = (item.product?.category || item.category || '').toString().trim().toLowerCase();
        const itemName = (item.product?.name || item.name || '').toString().trim().toLowerCase();
        return itemCat.includes(targetCat) || targetCat.includes(itemCat) || itemName.includes(targetCat);
      });

      if (!hasMatchingItem) {
        return {
          valid: false,
          message: `⚠️ O cupom ${cleanCode} é exclusivo para a categoria "${reqCategory}". Adicione um produto desta categoria ao seu carrinho para aproveitar o desconto.`,
          couponObj: matchedCoupon
        };
      }
    }
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

export function calculateEligibleCouponDiscount(
  appliedCoupon: {
    code: string;
    discountPercent?: number;
    fixedDiscount?: number;
    category?: string;
  } | null | undefined,
  cartItems: any[] = [],
  suggestedProduct?: any
): { discountAmount: number; eligibleSubtotal: number; isCategoryRestricted: boolean; categoryName?: string } {
  if (!appliedCoupon) {
    return { discountAmount: 0, eligibleSubtotal: 0, isCategoryRestricted: false };
  }

  const reqCategory = appliedCoupon.category?.trim();
  const categoryConstraint = reqCategory && !['todas', 'todas as categorias', 'livre', 'geral', ''].includes(reqCategory.toLowerCase())
    ? reqCategory
    : null;

  let totalCartSubtotal = 0;
  let eligibleSubtotal = 0;

  cartItems.forEach((item: any) => {
    const isUpsellItem = item.isUpsell || (suggestedProduct && item.product?.id === suggestedProduct?.id);
    const itemPrice = isUpsellItem && item.product?.price
      ? item.product.price * 0.9
      : (item.priceAtTime ?? item.price ?? item.product?.price ?? 0);
    const itemQty = item.quantity ?? item.qty ?? 1;
    const itemTotal = itemPrice * itemQty;

    totalCartSubtotal += itemTotal;

    if (categoryConstraint) {
      const targetCat = categoryConstraint.toLowerCase();
      const itemCat = (item.product?.category || item.category || '').toString().trim().toLowerCase();
      const itemName = (item.product?.name || item.name || '').toString().trim().toLowerCase();

      if (itemCat.includes(targetCat) || targetCat.includes(itemCat) || itemName.includes(targetCat)) {
        eligibleSubtotal += itemTotal;
      }
    } else {
      eligibleSubtotal += itemTotal;
    }
  });

  const baseForDiscount = categoryConstraint ? eligibleSubtotal : totalCartSubtotal;
  let discountAmount = 0;

  const percent = appliedCoupon.discountPercent ?? 0;
  const fixed = appliedCoupon.fixedDiscount ?? 0;

  if (percent > 0) {
    discountAmount = Number(((baseForDiscount * percent) / 100).toFixed(2));
  } else if (fixed > 0) {
    discountAmount = Math.min(baseForDiscount, fixed);
  }

  return {
    discountAmount,
    eligibleSubtotal: baseForDiscount,
    isCategoryRestricted: Boolean(categoryConstraint && eligibleSubtotal > 0),
    categoryName: categoryConstraint || undefined
  };
}
