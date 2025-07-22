export {};

declare global {
  interface Window {
    __HOOYA_CONFIG__?: {
      HOOYA_WEB_PROXY_URL: string;
    };
  }
}
