/**
 * Global configuration and URL helper for AP Moda Fitness System.
 * This centralizes the application's base URL and sharing links, allowing
 * easy updates when migrating to a custom domain.
 */

export const getAppUrl = (): string => {
  // 1. Try to use a custom environment variable if defined
  const meta = import.meta as any;
  const envUrl = meta.env?.VITE_APP_URL || meta.env?.VITE_BASE_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/$/, '');
  }

  // 2. Fallback dynamically to the browser's current location so it adapts automatically to any active domain
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin || `${window.location.protocol}//${window.location.host}`;
  }

  // 3. Absolute fallback
  return 'https://ap-moda-ia-studio.onrender.com';
};

/**
 * Returns the fully qualified public link to the customer vitrine / catalog.
 */
export const getCatalogUrl = (): string => {
  return `${getAppUrl()}/`;
};
