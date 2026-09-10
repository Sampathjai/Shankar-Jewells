export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const defaultHeaders: Record<string, string> = {};

  // Set Content-Type for requests with body
  if (options.body) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  // Retrieve and sanitize JWT token from localStorage
  const rawToken = localStorage.getItem('token');
  if (rawToken && rawToken !== 'undefined' && rawToken !== 'null') {
    const cleanToken = rawToken.replace(/"/g, '').trim();
    // Validate JWT token format to prevent WebKit header pattern exceptions
    if (/^[a-zA-Z0-9\-_.~+/=]+$/.test(cleanToken)) {
      defaultHeaders['Authorization'] = `Bearer ${cleanToken}`;
    }
  }

  // Ensure clean endpoint path starting with '/'
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Determine valid API base URL safely without malformed undefined/null prefixes
  let baseUrl = '/api';
  const envApiUrl = (import.meta as any).env?.VITE_API_URL;
  if (envApiUrl && typeof envApiUrl === 'string' && envApiUrl.startsWith('http')) {
    baseUrl = envApiUrl.endsWith('/') ? envApiUrl.slice(0, -1) : envApiUrl;
  }

  const fullUrl = `${baseUrl}${cleanEndpoint}`;

  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  // Remove body for GET / HEAD requests to avoid WebKit request errors
  const method = (fetchOptions.method || 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD') {
    delete fetchOptions.body;
  }

  try {
    const response = await fetch(fullUrl, fetchOptions);
    const text = await response.text();

    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: API request failed`);
    }

    return data as T;
  } catch (err: any) {
    console.error(`fetchApi Error [${fullUrl}]:`, err);
    throw new Error(err.message || 'Network error while connecting to Shanker Jewells server.');
  }
}
