const CLIENT_CACHE_VERSION = 'v6_live_konvqchxhtdocoszedwm';

const STALE_STORAGE_KEYS = [
  'ap_moda_products',
  'ap_moda_clients',
  'ap_moda_sales',
  'ap_moda_transactions',
  'ap_moda_online_orders',
  'ap_online_orders',
  'ap_moda_checkouts',
  'ap_moda_team_users',
  'ap_moda_team_users_backup',
  'ap_moda_sellers',
  'ap_moda_motoboys',
  'ap_moda_partners',
  'ap_manual_partner_sales',
  'ap_partner_withdraw_requests',
  'ap_coupons',
  'ap_vitrine_slides',
  'ap_vitrine_announcement',
  'ap_vitrine_category_banners',
  'ap_vitrine_floating_banner',
  'ap_vitrine_benefit_cards',
  'ap_vitrine_category_thumbnails',
  'ap_vitrine_store_name',
  'ap_vitrine_store_sub',
  'ap_vitrine_theme_color',
  'ap_vitrine_active_animation',
  'ap_dirty_products',
  'ap_dirty_clients',
  'ap_dirty_sales',
  'ap_dirty_transactions',
  'ap_dirty_online_orders',
  'ap_dirty_checkouts',
  'ap_dirty_team_members',
  'ap_deleted_products',
  'ap_deleted_sales',
  'ap_deleted_transactions',
  'ap_deleted_online_orders',
  'ap_deleted_team_members',
  'ap_supabase_url',
  'ap_supabase_key',
  'ap_supabase_instance_ref'
];

export function resetStaleClientCacheIfNeeded(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const currentVersion = window.localStorage.getItem('ap_client_cache_version');
    if (currentVersion === CLIENT_CACHE_VERSION) {
      return false;
    }
    for (const key of STALE_STORAGE_KEYS) {
      try {
        window.localStorage.removeItem(key);
      } catch {}
    }
    window.localStorage.setItem('ap_client_cache_version', CLIENT_CACHE_VERSION);
    return true;
  } catch {
    return false;
  }
}

resetStaleClientCacheIfNeeded();
