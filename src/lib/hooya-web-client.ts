// hooya web client with automatic token refresh

import {
  refreshAccessToken,
  getAccessToken,
  ensureValidToken,
} from '../utils/auth';

// enhanced fetch with automatic token refresh
export async function apiCall(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // proactively ensure valid token before request
  await ensureValidToken();

  const accessToken = getAccessToken();

  const headers = {
    ...options.headers,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // if we get a 401, attempt to refresh the access token and retry
  if (response.status === 401) {
    try {
      await refreshAccessToken();
      // retry original request with new token
      const newAccessToken = getAccessToken();
      return await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          ...(newAccessToken
            ? { Authorization: `Bearer ${newAccessToken}` }
            : {}),
        },
      });
    } catch (error) {
      // refresh failed, redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw error;
    }
  }

  return response;
}
