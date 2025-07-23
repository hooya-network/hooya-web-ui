import { getWebProxyUrl } from '@/lib/runtime-config';

export async function ConstructCIDProcessingURL(cid: string) {
  return WebProxyUrl() + `/api/events/processing/${cid}`;
}

export function ConstructCIDContentURL(cid: string, signature?: string) {
  const baseUrl = WebProxyUrl() + `/cid-content/${cid}`;
  return signature
    ? `${baseUrl}?sig=${encodeURIComponent(signature)}`
    : baseUrl;
}

export function ConstructCIDThumbnailURL(
  cid: string,
  size?: string,
  signature?: string
) {
  const baseUrl = WebProxyUrl() + `/cid-thumbnail/${cid}`;
  const urlWithSize = size ? `${baseUrl}/${size}` : baseUrl;
  return signature
    ? `${urlWithSize}?sig=${encodeURIComponent(signature)}`
    : urlWithSize;
}

export function WebProxyUrl() {
  return getWebProxyUrl();
}
