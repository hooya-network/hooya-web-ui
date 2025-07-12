export {};

declare global {
  interface Window {
    __ENV__?: {
      NEXT_PUBLIC_HOOYA_WEB_PROXY_URL?: string;
    };
  }
}
