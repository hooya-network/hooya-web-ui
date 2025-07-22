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
    credentials: 'include', // Important: include cookies in the request
  });

  if (!response.ok) {
    // refresh failed, clear refresh token
    clearRefreshToken();
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }

}

export async function logout(): Promise<void> {
  clearRefreshToken();

  try {
    const endpoint = getWebProxyUrl();
    await fetch(`${endpoint}/logout`, {
      method: 'POST',
    });
  } catch (error) {
    console.error('Logout request failed:', error);
    // Continue with logout even if server request fails
  }
}
