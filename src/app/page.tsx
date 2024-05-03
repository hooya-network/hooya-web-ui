import Link from "next/link";
import ImageMasonGrid from "@/components/ImageMasonGrid"
import { QueryRecentlyAdded, ConstructMasonGridPropsFromCIDs } from "@/helpers"
import { redirect } from "next/navigation";

export default async function Homepage({searchParams}: {
searchParams: { [key: string]: string | string[] | undefined }
}) {
  async function searchFormTimeout(formData: FormData) {
    'use server'

    const recentlyAddedWithTerms = QueryRecentlyAdded(0)
    console.log(recentlyAddedWithTerms)
  }

  async function searchForm(formData: FormData) {
    'use server'

    const tagString = formData.get("tag-string")
    redirect(`/tags/${tagString}`)
  }

  const currPage = (searchParams["page"] && typeof searchParams["page"] == "string") ?
    parseInt(searchParams["page"]) : 1

  const {images, pages} = await QueryRecentlyAdded(currPage) || {images: [], pages: undefined}

  return (
    <main>
    <div id="home-search">
        <h1>HooYa!</h1>
        <div className="subtext">Browsing “Genesis” instance</div>
        <div className="subtext">Peer ID 0xC262a…a048</div>
        <form action={searchForm} id="homepage-search">
        <input id="home-search-tag-string" name="tag-string"></input>
        <input id="home-search-submit" type="submit" value="Search"/>
        </form>
        <div className="subtext">hooyad v0.1.0 / hooya-web-ui v0.1.0 / Operated by wesl-ee<br/>
        9000+ files indexed / 1000+ associations / 100+ tags</div>
    </div>
    <ImageMasonGrid
      imageBlocks={images}
    />
    <div id="page-navigation">
    <ol className="flat-list">
    <li><Link href="">←</Link></li>
    { currPage > 1 &&
      <li><Link href="/">1</Link></li>
    }
    { currPage > 2 && <li>…</li> }
    <li>{currPage.toString()}</li>
    { pages.next_page_token &&
    <>
      <li><Link href={`/?page=${pages.next_page_token}`}>{pages.next_page_token}</Link></li>
      <li>…</li>
      <li><Link href={`/?page=${pages.next_page_token}`}>→</Link></li>
    </>
    }
    </ol>
    </div>
    </main>
  );
}
