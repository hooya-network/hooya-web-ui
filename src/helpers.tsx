import { getWebProxyUrl } from '@/lib/runtime-config';

export async function ConstructCIDProcessingURL(cid: string) {
  return WebProxyUrl() + `/api/events/processing/${cid}`;
}

export function ConstructCIDContentURL(cid: string) {
  return WebProxyUrl() + `/cid-content/${cid}`;
}

export function ConstructCIDThumbnailURL(cid: string, size?: string) {
  if (!size) return WebProxyUrl() + `/cid-thumbnail/${cid}`;
  return WebProxyUrl() + `/cid-thumbnail/${cid}/${size}`;
}

export function WebProxyUrl() {
  return getWebProxyUrl();
}
