// hooya web client with automatic token refresh

import { shouldRefreshToken, refreshToken } from '../utils/auth';

// enhanced fetch with automatic token refresh
export async function apiCall(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = localStorage.getItem('jwt');

  // check if token needs refresh
  if (token && shouldRefreshToken(token)) {
    try {
      const newToken = await refreshToken(token);
      localStorage.setItem('jwt', newToken);
      token = newToken;
    } catch (error) {
      // refresh failed, clear token and redirect to login
      localStorage.removeItem('jwt');
      window.location.href = '/login';
      throw error;
    }
  }

  // add authorization header if token exists
  const headers = {
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && token) {
    localStorage.removeItem('jwt');

    // retry original request without token
    const retryHeaders = { ...options.headers };
    delete retryHeaders['Authorization'];

    return await fetch(url, {
      ...options,
      headers: retryHeaders,
    });
  }

  return response;
}
