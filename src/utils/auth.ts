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

    const now = Date.now() / 1000; // Convert to seconds
    const expiryTime = payload.exp;
    const issuedTime = payload.iat;
    const timeUntilExpiry = expiryTime - now;

    // if already expired, don't refresh
    if (timeUntilExpiry <= 0) {
      console.log('Token already expired');
      return false;
    }

    // calculate token lifetime and adaptive refresh point
    const tokenLifetime = expiryTime - issuedTime;
    const tokenAge = now - issuedTime;
    
    // refresh when halfway through token lifetime, but not later than 5 minutes before expiry
    const halfwayPoint = tokenLifetime / 2;
    const fiveMinutes = 5 * 60;
    const refreshPoint = Math.min(halfwayPoint, tokenLifetime - fiveMinutes);
    
    const shouldRefresh = tokenAge >= refreshPoint;
    
    if (shouldRefresh) {
      console.log(`Token is ${Math.round(tokenAge / 60)} minutes old (lifetime: ${Math.round(tokenLifetime / 60)} minutes), refreshing at ${Math.round(refreshPoint / 60)} minute mark`);
    }

    return shouldRefresh;
  } catch (error) {
    console.error('Error checking token expiry:', error);
    return false;
  }
}

export async function refreshToken(currentToken: string): Promise<string> {
  const endpoint = process.env.NEXT_PUBLIC_HOOYA_WEB_PROXY_URL || 'http://localhost:8532';
  
  console.log('Refreshing token with endpoint:', endpoint);

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
  console.log('New token received');
  return newToken;
}