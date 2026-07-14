export interface CardMachineConfig {
  id: string;
  name: string;
  debitFee: number;
  creditInstallments: { [key: number]: number }; // 1x to 12x rates represented as percentages (e.g. 1: 3.16, 2: 4.38...)
  debitDiscount?: number;   // discount/rate option for debit machine payment
  creditDiscount?: number;  // discount/rate option for credit machine payment
}

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

export function getCardMachinesConfig(): CardMachineConfig[] {
  const saved = localStorage.getItem('ap_card_machines_rates');
  if (!saved) {
    // If not saved yet, initialize it
    localStorage.setItem('ap_card_machines_rates', JSON.stringify(DEFAULT_CARD_MACHINES));
    return DEFAULT_CARD_MACHINES;
  }
  try {
    return JSON.parse(saved);
  } catch (e) {
    console.warn('Error reading ap_card_machines_rates from localStorage, using default.', e);
    return DEFAULT_CARD_MACHINES;
  }
}

export function saveCardMachinesConfig(configs: CardMachineConfig[]): void {
  localStorage.setItem('ap_card_machines_rates', JSON.stringify(configs));
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
