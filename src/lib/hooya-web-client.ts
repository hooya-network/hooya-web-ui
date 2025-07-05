// hooya web client with automatic token refresh

import { shouldRefreshToken, refreshToken } from '../utils/auth';

// enhanced fetch with automatic token refresh
export async function apiCall(url: string, options: RequestInit = {}): Promise<Response> {
  let token = localStorage.getItem('jwt');
  
  // check if token needs refresh
  if (token && shouldRefreshToken(token)) {
    console.log('Proactively refreshing token');
    try {
      const newToken = await refreshToken(token);
      localStorage.setItem('jwt', newToken);
      token = newToken;
      console.log('Proactive token refresh successful');
    } catch (error) {
      console.error('Proactive token refresh failed:', error);
      // refresh failed, clear token and redirect to login
      localStorage.removeItem('jwt');
      window.location.href = '/login';
      throw error;
    }
  }
  
  // add authorization header if token exists
  const headers = {
    ...options.headers,
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // if unauthorized, try to refresh token and retry once
  if (response.status === 401 && token) {
    console.log('Got 401, attempting token refresh');
    try {
      const newToken = await refreshToken(token);
      localStorage.setItem('jwt', newToken);
      console.log('Token refreshed successfully');
      
      // retry original request with new token
      const retryHeaders = {
        ...options.headers,
        'Authorization': `Bearer ${newToken}`,
      };
      
      return await fetch(url, {
        ...options,
        headers: retryHeaders,
      });
    } catch (error) {
      console.error('Token refresh failed:', error);
      // refresh failed, clear token and redirect to login
      localStorage.removeItem('jwt');
      window.location.href = '/login';
      throw error;
    }
  }
  
  return response;
}