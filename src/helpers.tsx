import ImageBlock from '@/components/ImageBlock'

export async function QueryRecentlyAdded(term?: string) {
  const endpoint = WebProxyEndpoint()

  // TODO New endpoint
  const res = await fetch(endpoint + '/local-file-page/0')
  if (!res.ok) {
    return
  }

  const data: LocalFilePageResponse = await res.json()

  return data.cid.map((c) => {
    return <ImageBlock
      key={c}
      cid={c}
    />
  })
}

export async function QueryCidInfo(cid: string) {
  const endpoint = WebProxyEndpoint()

  const res = await fetch(endpoint + `/cid-info/${cid}`)
  if (!res.ok) {
  }

  const data = await res.json()

  return data
}


export async function QueryCidTags(cid: string) {
  const endpoint = WebProxyEndpoint()

  const res = await fetch(endpoint + `/cid-tags/${cid}`)
  if (!res.ok) {
  }

  const data = await res.json()

  return data
}
export function ConstructCIDContentURL(cid: string) {
  return WebProxyEndpoint() + `/cid-content/${cid}`;
}

export function ConstructCIDThumbnailURL(cid: string, size?: string) {
  if (!size)
    return WebProxyEndpoint() + `/cid-thumbnail/${cid}`;
  return WebProxyEndpoint() + `/cid-thumbnail/${cid}/${size}`;
}

function WebProxyEndpoint() {
  return process.env.HOOYA_WEB_PROXY_ENDPOINT
}

type LocalFilePageResponse = {
  cid: string[],
  next_page_token: string
}
