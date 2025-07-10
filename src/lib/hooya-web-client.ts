// hooya web client with automatic token refresh

import { refreshAccessToken } from '../utils/auth';

// enhanced fetch with automatic token refresh
export async function apiCall(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // always include cookies for access token
  });

  // if we get a 401, attempt to refresh the access token and retry
  if (response.status === 401) {
    try {
      await refreshAccessToken();
      // retry original request
      return await fetch(url, {
        ...options,
        credentials: 'include',
      });
    } catch (error) {
      // refresh failed, redirect to login
      window.location.href = '/login';
      throw error;
    }
  }

  return response;
}
