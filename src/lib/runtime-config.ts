declare global {
  interface Window {
    __HOOYA_CONFIG__?: {
      HOOYA_WEB_PROXY_URL: string;
    };
  }
}

export function getWebProxyUrl(): string {
  // SSR fallback
  if (typeof window === 'undefined') {
    return 'http://localhost:8532';
  }

  // access injected config
  return (
    window.__HOOYA_CONFIG__?.HOOYA_WEB_PROXY_URL || 'http://localhost:8532'
  );
}
