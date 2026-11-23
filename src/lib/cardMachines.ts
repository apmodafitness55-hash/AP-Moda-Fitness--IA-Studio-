import { safeLocalStorageSet } from '../utils/dateUtils';

export interface InfinitePayLinkRates {
  pixFee: number; // Taxa do PIX no Link de Pagamento (padrão 0.00%)
  passInterestToCustomer: boolean; // true = cliente assume juros de parcelamento no Link; false = loja absorve as taxas
  creditInstallments: { [key: number]: number }; // 1x a 12x específicas do Link de Pagamento InfinitePay
}

export interface CardMachineConfig {
  id: string;
  name: string;
  debitFee: number;
  creditInstallments: { [key: number]: number }; // 1x to 12x rates represented as percentages (e.g. 1: 3.16, 2: 4.38...)
  debitDiscount?: number;   // discount/rate option for debit machine payment
  creditDiscount?: number;  // discount/rate option for credit machine payment
  linkRates?: InfinitePayLinkRates; // Taxas específicas para Link de Pagamento Online (InfinitePay)
}

export const DEFAULT_INFINITEPAY_LINK_RATES: InfinitePayLinkRates = {
  pixFee: 0.00,
  passInterestToCustomer: false,
  creditInstallments: {
    1: 3.16,
    2: 4.38,
    3: 4.98,
    4: 5.58,
    5: 6.18,
    6: 6.78,
    7: 7.38,
    8: 7.98,
    9: 8.58,
    10: 9.18,
    11: 9.78,
    12: 10.38
  }
};

export const DEFAULT_CARD_MACHINES: CardMachineConfig[] = [
  {
    id: 'infinitepay',
    name: 'InfinitePay',
    debitFee: 1.38,
    debitDiscount: 0,
    creditDiscount: 0,
    creditInstallments: {
      1: 3.16,
      2: 4.38,
      3: 4.98,
      4: 5.58,
      5: 6.18,
      6: 6.78,
      7: 7.38,
      8: 7.98,
      9: 8.58,
      10: 9.18,
      11: 9.78,
      12: 10.38
    },
    linkRates: {
      ...DEFAULT_INFINITEPAY_LINK_RATES,
      creditInstallments: { ...DEFAULT_INFINITEPAY_LINK_RATES.creditInstallments }
    }
  },
  {
    id: 'saipay',
    name: 'Saipay (PagSeguro)',
    debitFee: 1.69,
    debitDiscount: 0,
    creditDiscount: 0,
    creditInstallments: {
      1: 3.79,
      2: 5.49,
      3: 6.99,
      4: 7.99,
      5: 8.99,
      6: 9.99,
      7: 10.99,
      8: 11.99,
      9: 12.99,
      10: 13.99,
      11: 14.99,
      12: 15.99
    }
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    debitFee: 1.99,
    debitDiscount: 0,
    creditDiscount: 0,
    creditInstallments: {
      1: 4.74,
      2: 6.34,
      3: 7.34,
      4: 8.34,
      5: 9.34,
      6: 10.34,
      7: 11.34,
      8: 12.34,
      9: 13.34,
      10: 14.34,
      11: 15.34,
      12: 16.34
    }
  },
  {
    id: 'ton',
    name: 'Ton (Ultra)',
    debitFee: 1.39,
    debitDiscount: 0,
    creditDiscount: 0,
    creditInstallments: {
      1: 3.18,
      2: 4.69,
      3: 5.39,
      4: 6.09,
      5: 6.79,
      6: 7.49,
      7: 8.19,
      8: 8.89,
      9: 9.59,
      10: 10.29,
      11: 10.99,
      12: 11.69
    }
  },
  {
    id: 'stone',
    name: 'Stone',
    debitFee: 1.50,
    debitDiscount: 0,
    creditDiscount: 0,
    creditInstallments: {
      1: 3.50,
      2: 4.90,
      3: 5.80,
      4: 6.50,
      5: 7.20,
      6: 7.90,
      7: 8.60,
      8: 9.30,
      9: 10.00,
      10: 10.70,
      11: 11.40,
      12: 12.10
    }
  }
];

function hydrateMachineConfigs(parsed: any[]): CardMachineConfig[] {
  if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_CARD_MACHINES;
  return parsed.map((m: any) => {
    const def = DEFAULT_CARD_MACHINES.find(d => d.id === m?.id);
    if (m?.id === 'infinitepay') {
      const baseInstallments = m.creditInstallments || def?.creditInstallments || {};
      const existingLink = m.linkRates || {};
      const linkCreditInstallments: { [key: number]: number } = {};
      for (let i = 1; i <= 12; i++) {
        const rawVal = existingLink.creditInstallments?.[i];
        linkCreditInstallments[i] =
          rawVal !== undefined && rawVal !== null && !Number.isNaN(Number(rawVal))
            ? Number(rawVal)
            : Number(baseInstallments[i] ?? DEFAULT_INFINITEPAY_LINK_RATES.creditInstallments[i] ?? 0);
      }
      return {
        ...(def || {}),
        ...m,
        linkRates: {
          pixFee:
            existingLink.pixFee !== undefined && !Number.isNaN(Number(existingLink.pixFee))
              ? Number(existingLink.pixFee)
              : DEFAULT_INFINITEPAY_LINK_RATES.pixFee,
          passInterestToCustomer: Boolean(existingLink.passInterestToCustomer),
          creditInstallments: linkCreditInstallments
        }
      };
    }
    return {
      ...(def || {}),
      ...m
    };
  });
}

export function getCardMachinesConfig(): CardMachineConfig[] {
  const saved = localStorage.getItem('ap_card_machines_rates');
  if (!saved) {
    // If not saved yet, initialize it
    safeLocalStorageSet('ap_card_machines_rates', JSON.stringify(DEFAULT_CARD_MACHINES));
    return DEFAULT_CARD_MACHINES;
  }
  try {
    return hydrateMachineConfigs(JSON.parse(saved));
  } catch (e) {
    console.warn('Error reading ap_card_machines_rates from localStorage, using default.', e);
    return DEFAULT_CARD_MACHINES;
  }
}

export function saveCardMachinesConfig(configs: CardMachineConfig[]): void {
  const hydrated = hydrateMachineConfigs(configs);
  safeLocalStorageSet('ap_card_machines_rates', JSON.stringify(hydrated));
  try {
    window.dispatchEvent(new Event('ap-card-machines-updated'));
  } catch {}
}

export function getInfinitePayMachineConfig(): CardMachineConfig {
  const configs = getCardMachinesConfig();
  return configs.find(c => c.id === 'infinitepay') || DEFAULT_CARD_MACHINES[0];
}

export interface InfinitePayLinkEstimate {
  grossAmount: number;
  passInterestToCustomer: boolean;
  pixFeePercent: number;
  pixFeeAmount: number;
  pixNetAmount: number;
  credit1xFeePercent: number;
  credit1xFeeAmount: number;
  credit1xNetAmount: number;
  selectedInstallments: number;
  selectedCreditFeePercent: number;
  selectedCreditFeeAmount: number;
  selectedCreditNetAmount: number;
  credit12xFeePercent: number;
  credit12xFeeAmount: number;
  credit12xNetAmount: number;
}

export function calculateInfinitePayLinkEstimate(
  amount: number,
  selectedInstallments: number = 3,
  overridePassInterest?: boolean
): InfinitePayLinkEstimate {
  const gross = Math.max(0, Number(amount || 0));
  const inst = Math.min(12, Math.max(1, Math.round(Number(selectedInstallments || 1))));
  const machine = getInfinitePayMachineConfig();
  const linkRates = machine.linkRates || {
    ...DEFAULT_INFINITEPAY_LINK_RATES,
    creditInstallments: machine.creditInstallments || DEFAULT_INFINITEPAY_LINK_RATES.creditInstallments
  };

  const passInterest =
    overridePassInterest !== undefined
      ? overridePassInterest
      : Boolean(linkRates.passInterestToCustomer);

  const pixFeePercent = Number(linkRates.pixFee ?? 0);
  const credit1xFeePercent = Number(
    linkRates.creditInstallments?.[1] ?? machine.creditInstallments?.[1] ?? 3.16
  );

  const rawSelectedCreditPercent = Number(
    linkRates.creditInstallments?.[inst] ?? machine.creditInstallments?.[inst] ?? credit1xFeePercent
  );
  const selectedCreditFeePercent =
    passInterest && inst > 1 ? credit1xFeePercent : rawSelectedCreditPercent;

  const raw12xPercent = Number(
    linkRates.creditInstallments?.[12] ?? machine.creditInstallments?.[12] ?? 10.38
  );
  const credit12xFeePercent = passInterest ? credit1xFeePercent : raw12xPercent;

  const calcNet = (pct: number) => {
    const fee = Number(((gross * pct) / 100).toFixed(2));
    const net = Number(Math.max(0, gross - fee).toFixed(2));
    return { fee, net };
  };

  const pix = calcNet(pixFeePercent);
  const c1x = calcNet(credit1xFeePercent);
  const cSel = calcNet(selectedCreditFeePercent);
  const c12x = calcNet(credit12xFeePercent);

  return {
    grossAmount: gross,
    passInterestToCustomer: passInterest,
    pixFeePercent,
    pixFeeAmount: pix.fee,
    pixNetAmount: pix.net,
    credit1xFeePercent,
    credit1xFeeAmount: c1x.fee,
    credit1xNetAmount: c1x.net,
    selectedInstallments: inst,
    selectedCreditFeePercent,
    selectedCreditFeeAmount: cSel.fee,
    selectedCreditNetAmount: cSel.net,
    credit12xFeePercent,
    credit12xFeeAmount: c12x.fee,
    credit12xNetAmount: c12x.net
  };
}

/**
 * Calculates net values and fee values for card transactions
 */
export function calculateCardDetails(
  amount: number,
  machineId: string,
  isCredit: boolean,
  installments: number = 1,
  customFee?: number
): { feePercent: number; feeAmount: number; netAmount: number } {
  const configs = getCardMachinesConfig();
  const machine = configs.find(c => c.id === machineId) || configs[0];
  
  let feePercent = 0;
  if (customFee !== undefined) {
    feePercent = customFee;
  } else if (!isCredit) {
    feePercent = machine.debitFee;
  } else {
    feePercent = machine.creditInstallments[installments] || 0;
  }

  const feeAmount = (amount * feePercent) / 100;
  const netAmount = amount - feeAmount;

  return {
    feePercent,
    feeAmount,
    netAmount
  };
}
