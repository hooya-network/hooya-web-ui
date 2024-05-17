import ImageMasonGrid from "@/components/ImageMasonGrid"
import { QueryBySearchTerms, QueryRecentlyAdded } from "@/helpers"
import Search from "@/components/Search";
import PageNavigation from "@/components/PageNavigation";
import { QuerySuggest } from "@/actions";

export default async function Homepage({searchParams}: {
searchParams: { [key: string]: string | undefined }
}) {
  const currPage = searchParams?.page || "1"
  const terms = searchParams?.query?.split(',')

  let images: JSX.Element[] = []
  let pages = {
    next_page_token: "1"
  }

  async function fetchImages(page: string, terms?: string[]) {
    if (!terms) {
      const resp = await QueryRecentlyAdded(page)
      if (resp && resp.pages) {
        pages = resp.pages
      }
      if (resp && resp.images) {
        images = resp.images
      }
    } else {
      const resp = await QueryBySearchTerms(terms, page)
      if (resp && resp.pages) {
        pages = resp.pages
      }
      if (resp && resp.images) {
        images = resp.images
      }
    }
  }

  await fetchImages(currPage, terms)
  let initSuggest: string[] = []
  initSuggest = await QuerySuggest(terms?.join(",") || "", 10)

  return (
    <main>
    <div id="home-search">
        <h1>HooYa!</h1>
        <div className="subtext">Browsing “Public Demo” instance</div>
        <div className="subtext">Peer ID 0xC262a…a048</div>
        <Search
          page={currPage}
          initSuggest={initSuggest}
        />
        <div className="subtext">hooyad v0.1.0-alpha-4 / hooya-web-ui v0.1.0-alpha-4 / Operated by wesl-ee<br/>
        9000+ files indexed / 1000+ associations / 100+ tags</div>
    </div>
    {pages && <>
      <PageNavigation
        currPage={currPage}
        nextPageToken={images.length > 0 ? pages?.next_page_token : undefined}
        query={terms?.join(",")}
      />
      <ImageMasonGrid
        imageBlocks={images}
      />
      <PageNavigation
        currPage={currPage}
        nextPageToken={images.length > 0 ? pages?.next_page_token : undefined}
        query={terms?.join(",")}
      />
    </> }
    </main>
  );
}
