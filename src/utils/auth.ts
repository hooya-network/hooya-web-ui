import { getWebProxyUrl } from '../lib/runtime-config';

export interface JWTPayload {
  user_id: number;
  exp: number;
  iat: number;
}

export interface RefreshJWTPayload extends JWTPayload {
  token_type: string;
}

// refresh token management
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
}

export function setRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('refresh_token', token);
}

export function clearRefreshToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('refresh_token');
}

// access token management
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('access_token');
}

export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('access_token', token);
}

export function clearAccessToken(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('access_token');
}

export async function refreshAccessToken(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const endpoint = getWebProxyUrl();

  const response = await fetch(`${endpoint}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `refresh_token=${encodeURIComponent(refreshToken)}`,
  });

  if (!response.ok) {
    // refresh failed, clear tokens
    clearRefreshToken();
    clearAccessToken();
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }

  const data = await response.json();
  setAccessToken(data.access_token);
  setRefreshToken(data.refresh_token);
}

// decode JWT without verification (client-side parsing only)
function parseJWT(token: string): JWTPayload | null {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

// check if token expires within the next N minutes
function isTokenExpiringSoon(token: string, minutesBeforeExpiry = 5): boolean {
  const payload = parseJWT(token);
  if (!payload) return true;

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = payload.exp - now;
  return expiresIn < minutesBeforeExpiry * 60;
}

// token refresh
export async function ensureValidToken(): Promise<boolean> {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return false; // not logged in
  }

  if (!accessToken || isTokenExpiringSoon(accessToken)) {
    try {
      await refreshAccessToken();
      return true;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  }

  return true; // token is valid
}

// timer
let refreshTimer: NodeJS.Timeout | null = null;

export function startTokenRefreshTimer(): void {
  if (refreshTimer) return; // already running

  const checkInterval = 2 * 60 * 1000; // check every 2 minutes

  refreshTimer = setInterval(async () => {
    if (getRefreshToken()) {
      await ensureValidToken();
    } else {
      stopTokenRefreshTimer(); // no refresh token, stop timer
    }
  }, checkInterval);
}

export function stopTokenRefreshTimer(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

export async function handleSuccessfulLogin(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
  startTokenRefreshTimer();
}

export async function logout(): Promise<void> {
  stopTokenRefreshTimer();
  clearRefreshToken();
  clearAccessToken();
}
