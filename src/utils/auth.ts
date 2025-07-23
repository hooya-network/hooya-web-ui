import { getWebProxyUrl } from '../lib/runtime-config';

export interface JWTPayload {
  user_id: number;
  exp: number;
  iat: number;
}

export interface RefreshJWTPayload extends JWTPayload {
  token_type: string;
}

// refresh token management (localStorage)
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

// access token management (memory/sessionStorage)
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

export async function logout(): Promise<void> {
  clearRefreshToken();
  clearAccessToken();
  // no need to call server since we're just clearing client tokens
}
