import Link from "next/link";

export default function PageNavigation(
  {currPage, nextPageToken, query}: {currPage: string, nextPageToken?: string, query?: string})
{
  const nextHrefParams = {
    page: nextPageToken,
    query: query,
  }

  // meh
  const prevPageToken = Number(currPage) > 1 ? (Number(currPage) - 1).toString() : undefined
  const prevHrefParams = {
    page: prevPageToken,
    query: query,
  }

  const firstHrefParams = {
    query: query,
  }

  let nextHrefStr = "?" + Object.entries(nextHrefParams)
    .filter(([_, val]) => val)
    .map(([key, val]) => `${key}=${val}`).join('&');

  let firstHrefStr = "?" + Object.entries(firstHrefParams)
    .filter(([_, val]) => val)
    .map(([key, val]) => `${key}=${val}`).join('&');

  let prevHrefStr = "?" + Object.entries(prevHrefParams)
    .filter(([_, val]) => val)
    .map(([key, val]) => `${key}=${val}`).join('&');


  return (
    <div className="page-navigation">
    <ol className="flat-list">
    {prevPageToken &&
    <li><Link href={prevHrefStr}>←</Link></li>
    }
    { Number(currPage) > 1 &&
      <li><Link href={firstHrefStr}>1</Link></li>
    }
    { Number(currPage) > 2 && <li>…</li> }
    { Number(prevPageToken) > 1 &&
      <li><Link href={prevHrefStr}>{prevPageToken}</Link></li>
    }
    <li>{currPage.toString()}</li>
    { nextPageToken &&
    <>
      <li><Link href={nextHrefStr}>{nextPageToken}</Link></li>
      <li>…</li>
      <li><Link href={nextHrefStr}>→</Link></li>
    </>
    }
    </ol>
    </div>
  )
}
