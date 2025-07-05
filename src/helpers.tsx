

// server-side functions removed - now using client-side API calls
export async function ConstructCIDProcessingURL(cid: string) {
  return WebProxyUrl() + `/api/events/processing/${cid}`;
}
export function ConstructCIDContentURL(cid: string) {
  return WebProxyUrl() + `/cid-content/${cid}`;
}

export function ConstructCIDThumbnailURL(cid: string, size?: string) {
  if (!size)
    return WebProxyUrl() + `/cid-thumbnail/${cid}`;
  return WebProxyUrl() + `/cid-thumbnail/${cid}/${size}`;
}

export function WebProxyUrl() {
  return process.env.HOOYA_WEB_PROXY_URL || "http://localhost:8532"
}


