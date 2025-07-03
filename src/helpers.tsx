import FileImage from '@/components/FileImage'

export async function QueryBySearchTerms(terms: string[], page: string): Promise<{images: JSX.Element[], pages: { next_page_token: string, final_page_token: string } } | undefined> {
  const endpoint = WebProxyEndpoint()

  const term = terms.join(",")
  const res = await fetch(endpoint + `/search-files/${term}/${page}`, { 
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
  if (!res.ok) {
    return
  }

  const data: AllFilesResponse = await res.json()

  const images = data.files.map((f) => {
    return (
      <FileImage
        key={f.cid}
        cid={f.cid}
        thumbnails={f.ext_file?.thumbnails || []}
        processingStatus={f.processing_status}
        contentUrl={`/cid/${f.cid}`}
        size="small"
        clickable={true}
      />
    )
  })

  const pages = {
    next_page_token: data.next_page_token,
    final_page_token: data.final_page_token,
  }

  return {images, pages}
}

export async function QueryRecentlyAdded(page: string, terms?: string[]): Promise<{images: JSX.Element[], pages: { next_page_token: string, final_page_token: string } } | undefined> {
  const endpoint = WebProxyEndpoint()

  const res = await fetch(endpoint + `/all-files/${page}`, { 
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
  if (!res.ok) {
    return
  }

  const data: AllFilesResponse = await res.json()

  const images = data.files.map((f) => {
    return (
      <FileImage
        key={f.cid}
        cid={f.cid}
        thumbnails={f.ext_file?.thumbnails || []}
        processingStatus={f.processing_status}
        contentUrl={`/cid/${f.cid}`}
        size="small"
        clickable={true}
      />
    )
  })

  const pages = {
    next_page_token: data.next_page_token,
    final_page_token: data.final_page_token,
  }

  return {images, pages}
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

  const res = await fetch(endpoint + `/cid-tags/${cid}`, { cache: 'no-store'} )
  if (!res.ok) {
  }

  const data = await res.json()

  return data
}
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

export function WebProxyEndpoint() {
  return process.env.HOOYA_WEB_PROXY_ENDPOINT || "http://localhost:8532"
}

export function WebProxyUrl() {
  return process.env.HOOYA_WEB_PROXY_URL || "http://localhost:8532"
}

type AllFilesResponse = {
  files: FileType[],
  next_page_token: string,
  final_page_token: string
  // TODO prev_page_token
  // TODO last_page_token
  // TODO first_page_token
}
