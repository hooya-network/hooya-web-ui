import Link from 'next/link'

export async function QueryBySearchTerms(terms: string[], page: string): Promise<{images: JSX.Element[], pages: { next_page_token: string } } | undefined> {
  const endpoint = WebProxyEndpoint()

  const term = terms.join(",")
  const res = await fetch(endpoint + `/search-files/${term}/${page}`, { cache: 'no-store'} )
  if (!res.ok) {
    return
  }

  const data: AllFilesResponse = await res.json()

  const images = data.files.map((f) => {
    const thumbnails: Thumbnail[] = f.ext_file?.thumbnails
    const thumbnail = thumbnails?.[0]

    let thumbnailelem =
        <Link key={f.cid} href={`/cid/${f.cid}`}>
        <img
          // height={500}
          // width={500}
          src="/no-thumb.gif"
          alt="no thumbnail provided"/>
        </Link>

    if (thumbnail?.mimetype?.startsWith("image")) {
      thumbnailelem =
      <Link key={f.cid} href={`/cid/${f.cid}`}>
      <img
          height={thumbnail.height}
          width={thumbnail.width}
          src={ConstructCIDThumbnailURL(thumbnail.source_cid, "small")}
          alt=""/>
      </Link>
    } else if (thumbnail?.mimetype?.startsWith("video")) {
      thumbnailelem = 
      <Link key={f.cid} href={`/cid/${f.cid}`}>
        <video autoPlay loop muted
          height={thumbnail.height}
          width={thumbnail.width}>
          <source
            src={ConstructCIDThumbnailURL(thumbnail.source_cid, "small")}
            type={thumbnail.mimetype}
          />
          </video>
      </Link>
    }

    return thumbnailelem
  })

  const pages = {
    next_page_token: data.next_page_token,
  }

  return {images, pages}
}

export async function QueryRecentlyAdded(page: string, terms?: string[]): Promise<{images: JSX.Element[], pages: { next_page_token: string } } | undefined> {
  const endpoint = WebProxyEndpoint()

  const res = await fetch(endpoint + `/all-files/${page}`, { cache: 'no-store'} )
  if (!res.ok) {
    return
  }

  const data: AllFilesResponse = await res.json()

  const images = data.files.map((f) => {
    const thumbnails: Thumbnail[] = f.ext_file?.thumbnails
    const thumbnail = thumbnails?.[0]

    let thumbnailelem =
        <Link key={f.cid} href={`/cid/${f.cid}`}>
        <img
          height={500}
          width={500}
          src="/no-thumb.gif"
          alt="no thumbnail provided"/>
        </Link>

    if (thumbnail?.mimetype?.startsWith("image")) {
      thumbnailelem =
      <Link key={f.cid} href={`/cid/${f.cid}`}>
      <img
          height={thumbnail.height}
          width={thumbnail.width}
          src={ConstructCIDThumbnailURL(thumbnail.source_cid, "small")}
          alt=""/>
      </Link>
    } else if (thumbnail?.mimetype?.startsWith("video")) {
      thumbnailelem = 
      <Link key={f.cid} href={`/cid/${f.cid}`}>
        <video autoPlay loop muted
          height={thumbnail.height}
          width={thumbnail.width}>
          <source
            src={ConstructCIDThumbnailURL(thumbnail.source_cid, "small")}
            type={thumbnail.mimetype}
          />
          </video>
      </Link>
    }

    return thumbnailelem
  })

  const pages = {
    next_page_token: data.next_page_token,
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
export function ConstructCIDContentURL(cid: string) {
  return WebProxyUrl() + `/cid-content/${cid}`;
}

export function ConstructCIDThumbnailURL(cid: string, size?: string) {
  if (!size)
    return WebProxyUrl() + `/cid-thumbnail/${cid}`;
  return WebProxyUrl() + `/cid-thumbnail/${cid}/${size}`;
}

export function WebProxyEndpoint() {
  return process.env.HOOYA_WEB_PROXY_ENDPOINT
}

export function WebProxyUrl() {
  return process.env.HOOYA_WEB_PROXY_URL
}

type AllFilesResponse = {
  files: FileType[],
  next_page_token: string
  // TODO prev_page_token
  // TODO last_page_token
  // TODO first_page_token
}
