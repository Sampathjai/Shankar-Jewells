/**
 * Centralized Image URL Resolver for Shanker Jewells.
 * Resolves absolute URLs, relative paths (/uploads/...), bare filenames/storage keys,
 * and localhost URLs to production-safe image URLs.
 */

// Elegant SVG Jewellery Placeholder Data URI (Gold Necklace & Gem Silhouette)
export const DEFAULT_JEWELLERY_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FBF9F5" />
      <stop offset="100%" stop-color="#F3ECE0" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D7B56D" />
      <stop offset="50%" stop-color="#B9913F" />
      <stop offset="100%" stop-color="#8C6621" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bgGrad)" />
  <circle cx="200" cy="200" r="140" fill="none" stroke="url(#goldGrad)" stroke-width="2" stroke-dasharray="6,6" opacity="0.4" />
  <g transform="translate(100, 100) scale(0.5)">
    <path fill="url(#goldGrad)" d="M200,40 C140,40 100,90 100,150 C100,230 180,310 200,340 C220,310 300,230 300,150 C300,90 260,40 200,40 Z M200,280 C160,230 130,170 130,140 C130,100 160,70 200,70 C240,70 270,100 270,140 C270,170 240,230 200,280 Z" />
    <polygon fill="#B9913F" points="200,110 225,145 200,180 175,145" opacity="0.8" />
  </g>
  <text x="200" y="320" font-family="serif" font-size="14" font-weight="bold" fill="#B9913F" text-anchor="middle" letter-spacing="2">SHANKER JEWELLS</text>
</svg>
`)}`;

/**
 * Normalizes any image URL or storage key into a valid, displayable absolute or relative URL.
 */
export function resolveImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string' || url.trim() === '' || url === 'undefined' || url === 'null') {
    return DEFAULT_JEWELLERY_PLACEHOLDER;
  }

  const cleanUrl = url.trim();

  // If it's already a Data URI or Blob URL, return as is
  if (cleanUrl.startsWith('data:') || cleanUrl.startsWith('blob:')) {
    return cleanUrl;
  }

  // Determine base API / server URL dynamically
  let apiBase = '';
  const envApiUrl = (import.meta as any).env?.VITE_API_URL;

  if (envApiUrl && typeof envApiUrl === 'string' && envApiUrl.startsWith('http')) {
    // Strip trailing /api or trailing slash to get root server URL
    apiBase = envApiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
  } else if (typeof window !== 'undefined' && window.location.origin) {
    // If running in development Vite (e.g. localhost:5173), default backend is localhost:5000
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      apiBase = 'http://localhost:5000';
    } else {
      apiBase = window.location.origin;
    }
  }

  // If it is an absolute http/https URL
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    // If the URL contains hardcoded localhost:5000 / localhost:3000 but the app is deployed on a remote host, sanitize host
    if (
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      if (cleanUrl.includes('localhost:5000') || cleanUrl.includes('localhost:3000') || cleanUrl.includes('127.0.0.1')) {
        const pathPart = cleanUrl.replace(/^https?:\/\/[^\/]+/, '');
        return `${apiBase}${pathPart}`;
      }
    }
    return cleanUrl;
  }

  // If it's a relative path starting with /uploads/ or uploads/
  if (cleanUrl.startsWith('/uploads/') || cleanUrl.startsWith('uploads/')) {
    const relativePath = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
    return apiBase ? `${apiBase}${relativePath}` : relativePath;
  }

  // If it's a relative path starting with /images/ or images/
  if (cleanUrl.startsWith('/images/') || cleanUrl.startsWith('images/')) {
    const relativePath = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
    return apiBase ? `${apiBase}${relativePath}` : relativePath;
  }

  // If it's just a filename / storage key (e.g., img_12345.jpg)
  const filename = cleanUrl.replace(/^\/+/, '');
  return apiBase ? `${apiBase}/uploads/${filename}` : `/uploads/${filename}`;
}

