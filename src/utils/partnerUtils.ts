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
