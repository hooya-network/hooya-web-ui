export interface JWTPayload {
  user_id: number;
  exp: number;
  iat: number;
}

// check if token should be refreshed
export function shouldRefreshToken(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const payload: JWTPayload = JSON.parse(atob(parts[1]));

    const now = Date.now() / 1000;
    const expiryTime = payload.exp;
    const issuedTime = payload.iat;
    const timeUntilExpiry = expiryTime - now;

    // if already expired remove it
    if (timeUntilExpiry <= 0) {
      localStorage.removeItem('jwt');
      return false;
    }

    const tokenLifetime = expiryTime - issuedTime;
    const tokenAge = now - issuedTime;

    // refresh jwt halfway through token lifetime, but not later than 5 minutes before expiry
    const halfwayPoint = tokenLifetime / 2;
    const fiveMinutes = 5 * 60;
    const refreshPoint = Math.min(halfwayPoint, tokenLifetime - fiveMinutes);

    return tokenAge >= refreshPoint;
  } catch (error) {
    console.error('Error checking token expiry:', error);
    return false;
  }
}

export async function refreshToken(currentToken: string): Promise<string> {
  const endpoint = process.env.NEXT_PUBLIC_HOOYA_WEB_PROXY_URL || 'http://localhost:8532';

  const response = await fetch(`${endpoint}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `refresh_token=${encodeURIComponent(currentToken)}`,
  });

  if (!response.ok) {
    console.error('Token refresh failed:', response.status, response.statusText);
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }

  const newToken = await response.text();
  return newToken;
}