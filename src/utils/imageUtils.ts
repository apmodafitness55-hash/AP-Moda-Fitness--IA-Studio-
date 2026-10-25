/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Fallback high-res brand placeholder SVG (ultra-lightweight data URI)
export const AP_FALLBACK_IMAGE = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <defs>
    <linearGradient id="apBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E3A42" />
      <stop offset="100%" stop-color="#0f1f24" />
    </linearGradient>
    <linearGradient id="apAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ec4899" />
      <stop offset="100%" stop-color="#f43f5e" />
    </linearGradient>
  </defs>
  <rect width="400" height="500" fill="url(#apBg)" />
  <circle cx="200" cy="210" r="70" fill="white" fill-opacity="0.04" />
  <circle cx="200" cy="210" r="50" fill="none" stroke="url(#apAccent)" stroke-width="2.5" stroke-dasharray="4 4" />
  <path d="M185 220 L200 190 L215 220 Z M193 212 L207 212" fill="none" stroke="#FAF9F6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  <text x="200" y="295" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="800" fill="#FAF9F6" letter-spacing="3" text-anchor="middle">AP MODA FITNESS</text>
  <text x="200" y="320" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="600" fill="#ec4899" letter-spacing="2" text-anchor="middle">ALTA PERFORMANCE</text>
</svg>
`.trim());

// Pre-compressed WebP maps for instant zero-latency loading from static bundle
export const PRE_OPTIMIZED_IMAGES: Record<string, string> = {
  "https://i.ibb.co/HDJgD4rc/1000568172-jpg.jpg": "fe86abeaefbd3f05f209a5eb5fa4fc19.webp",
  "https://i.ibb.co/wNWHZHvr/1000568173-jpg.jpg": "2aee49addb6997335c29b1a4995d2e1c.webp",
  "https://i.ibb.co/s9xKPwRj/1000568174-jpg.jpg": "c6e5c79d4a5e818c613ed9d684dbdb9a.webp",
  "https://i.ibb.co/My0W0wmG/1000568175-jpg.jpg": "419c056f6efa7b580fd39105b7a2edfe.webp",
  "https://i.ibb.co/LhHzK5LR/1000568169-jpg.jpg": "08792e82d428812d8bc72287394bb3a1.webp",
  "https://i.ibb.co/Xr00T2Xg/1000568168-jpg.jpg": "cbbb6c5d95c7d134dde36edc3fd9ce3b.webp",
  "https://i.ibb.co/tp526HqS/1000568165-jpg.jpg": "d37b6b30b5a2309e7286e19eab6924fd.webp",
  "https://i.ibb.co/ZRjQzpSd/1000568170-jpg.jpg": "f76268f6b62d71a69adf6e5ea9e2bfaf.webp",
  "https://i.ibb.co/TMNN4GR0/1000568171-jpg.jpg": "208b4d09b35bf588e01bc01bcffdc73c.webp",
  "https://i.ibb.co/Zp32MkxN/1000568201-jpg.jpg": "d639b5e3439ba4de9095a1f5b11c30d7.webp",
  "https://i.ibb.co/99Np0v6Y/1000568202-jpg.jpg": "a26107b728c55116caf6520c11688744.webp",
  "https://i.ibb.co/bgJhqmTM/1000568209-jpg.jpg": "b130f953cfa698926eeba0d6a2a9f3a3.webp",
  "https://i.ibb.co/21gdGL63/1000568210-jpg.jpg": "07a9c13b4fce200da577ba75f943deda.webp",
  "https://i.ibb.co/gZLfmq3k/1000568211-jpg.jpg": "b4eb0fb3596382e4129858b75b69edd4.webp",
  "https://i.ibb.co/WpjtXg4k/1000568212-jpg.jpg": "104b9687f361309df295d38b5b919b4c.webp",
  "https://i.ibb.co/m58BgDwx/1000568220-jpg.jpg": "d370ecd8e60bfa2df244d2f6ab6c5ec0.webp",
  "https://i.ibb.co/prdxL6M2/1000568219-jpg.jpg": "84025bd2100e9ca4237fd515bdd2eb76.webp",
  "https://i.ibb.co/201vr0Sr/1000568222-jpg.jpg": "b706ed2f32b20d0965616fecfcf74782.webp",
  "https://i.ibb.co/mrg5q3CH/1000568221-jpg.jpg": "0f17b909eff8538d273908748e3f34c6.webp",
  "https://i.ibb.co/TD0d9fhc/1000568002-jpg.jpg": "c25bcf1aa63bbed0bf4cc8b1182421c1.webp",
  "https://i.ibb.co/r2NfRMpY/1000568001-jpg.jpg": "f9d4c637158c623b6559bc74ca924bc1.webp",
  "https://i.ibb.co/Fbgc6852/1000567988-jpg.jpg": "2a6e5533f7ad0e60d0e67161ed5b9bae.webp",
  "https://i.ibb.co/5Xn1PYDC/1000567989-jpg.jpg": "e40f3835bb96cefd442a02a749d34ec3.webp",
  "https://i.ibb.co/wFq85JLW/1000536691.jpg": "131e0e79a8a8c5d12863e7f44b4a3f22.webp"
};

/**
 * Resolves common external viewer URLs to direct raw image URLs right on the client
 */
export function resolveClientDirectImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  let trimmed = url.trim();
  if (!trimmed) return '';

  // Google Drive share / preview links -> Google User Content CDN
  const gdriveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (trimmed.includes('drive.google.com') && gdriveMatch && gdriveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${gdriveMatch[1]}`;
  }

  // Dropbox links -> Direct raw file
  if (trimmed.includes('dropbox.com')) {
    if (trimmed.includes('dl=0')) return trimmed.replace('dl=0', 'raw=1');
    if (!trimmed.includes('raw=1') && !trimmed.includes('dl=1')) {
      return trimmed + (trimmed.includes('?') ? '&raw=1' : '?raw=1');
    }
    return trimmed;
  }

  // Imgur gallery / viewer link -> Direct JPEG
  const imgurMatch = trimmed.match(/^https?:\/\/(?:www\.)?imgur\.com\/([a-zA-Z0-9]+)$/);
  if (imgurMatch && imgurMatch[1]) {
    return `https://i.imgur.com/${imgurMatch[1]}.jpg`;
  }

  return trimmed;
}

/**
 * Safely extracts the primary image URL from a product object,
 * whether stored in prod.image (string or array) or prod.images (array).
 */
export function getProductMainImage(prod: any): string {
  if (!prod) return '';
  if (typeof prod.image === 'string' && prod.image.trim()) {
    return prod.image.trim();
  }
  if (Array.isArray(prod.images) && prod.images.length > 0) {
    const found = prod.images.find((img: any) => typeof img === 'string' && img.trim());
    if (found) return found.trim();
  }
  if (Array.isArray(prod.image) && prod.image.length > 0) {
    const found = prod.image.find((img: any) => typeof img === 'string' && img.trim());
    if (found) return found.trim();
  }
  return '';
}

/**
 * Returns an ultra-optimized image URL.
 * Automatically chooses local pre-compressed WebP assets (<30KB) or routes
 * through the server-side CDN proxy to ensure fast, zero-delay rendering on all devices.
 */
export function getOptimizedImageUrl(
  url?: string | null,
  targetWidth: number = 800,
  quality: number = 80
): string {
  if (!url || typeof url !== 'string') return AP_FALLBACK_IMAGE;
  let trimmed = resolveClientDirectImageUrl(url);
  if (!trimmed) return AP_FALLBACK_IMAGE;

  // 1. Data URI (Base64) -> already in-memory, serve directly
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // 2. Check if we have an ultra-fast static pre-compressed WebP file
  const preFile = PRE_OPTIMIZED_IMAGES[trimmed] || 
                 PRE_OPTIMIZED_IMAGES[trimmed.replace('http://', 'https://')] ||
                 PRE_OPTIMIZED_IMAGES[trimmed.split('?')[0]];
  if (preFile) {
    if (targetWidth <= 200) {
      return `/optimized-images/thumbnails/${preFile}`;
    }
    return `/optimized-images/${preFile}`;
  }

  // 3. Local server-managed images or already optimized URLs
  if (
    trimmed.startsWith('/optimized-images/') ||
    trimmed.startsWith('/api/images/') ||
    trimmed.startsWith('/api/proxy/cdn-image')
  ) {
    return trimmed;
  }

  // 4. External HTTP/HTTPS URLs (ImgBB, Unsplash, Google, etc.) -> Route through High-Speed CDN Proxy
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const w = targetWidth <= 200 ? 200 : targetWidth <= 600 ? 600 : targetWidth <= 900 ? 900 : 1200;
    return `/api/proxy/cdn-image?url=${encodeURIComponent(trimmed)}&w=${w}&q=${quality}`;
  }

  return trimmed;
}

/**
 * Two-tier resilient image error handler:
 * 1. If loading via the CDN proxy failed, attempt loading the original upstream URL directly.
 * 2. If the original also fails, display the branded fallback image.
 */
export function handleImageFallback(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = e.currentTarget;

  // Tier 1 recovery: If it failed via the CDN proxy, fallback immediately to the original direct image URL!
  if (target.src && target.src.includes('/api/proxy/cdn-image')) {
    try {
      const urlObj = new URL(target.src, window.location.origin);
      const originalUrl = urlObj.searchParams.get('url');
      if (originalUrl && originalUrl !== target.src) {
        // Switch to direct image loading
        target.src = originalUrl;
        return;
      }
    } catch (err) {}
  }

  // Tier 2 recovery: If already at fallback, stop infinite loop
  if (target.src !== AP_FALLBACK_IMAGE) {
    target.onerror = null;
    target.src = AP_FALLBACK_IMAGE;
  }
}
