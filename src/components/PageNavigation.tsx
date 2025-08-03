import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PageNavigation({
  currPage,
  nextPageToken,
  finalPageToken,
  query,
}: {
  currPage: string;
  nextPageToken?: string;
  finalPageToken?: string;
  query?: string;
}) {
  const router = useRouter();
  const [pageInput, setPageInput] = useState(currPage);

  // update input when currPage changes (when navigating between pages)
  useEffect(() => {
    setPageInput(currPage);
  }, [currPage]);
  const nextHrefParams = {
    page: nextPageToken,
    query: query,
  };

  // meh
  const prevPageToken =
    Number(currPage) > 1 ? (Number(currPage) - 1).toString() : undefined;
  const prevHrefParams = {
    page: prevPageToken,
    query: query,
  };

  const firstHrefParams = {
    query: query,
  };

  let nextHrefStr =
    '?' +
    Object.entries(nextHrefParams)
      .filter(([, val]) => val)
      .map(([key, val]) => `${key}=${val}`)
      .join('&');

  let firstHrefStr =
    '?' +
    Object.entries(firstHrefParams)
      .filter(([, val]) => val)
      .map(([key, val]) => `${key}=${val}`)
      .join('&');

  let prevHrefStr =
    '?' +
    Object.entries(prevHrefParams)
      .filter(([, val]) => val)
      .map(([key, val]) => `${key}=${val}`)
      .join('&');

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPage = parseInt(pageInput);
    const maxPage = parseInt(finalPageToken || '1');

    if (targetPage >= 1 && targetPage <= maxPage) {
      const pageHrefParams = {
        page: targetPage.toString(),
        query: query,
      };
      const pageHrefStr =
        '?' +
        Object.entries(pageHrefParams)
          .filter(([, val]) => val)
          .map(([key, val]) => `${key}=${val}`)
          .join('&');
      router.push(pageHrefStr);
    }
  };

  return (
    <div className="page-navigation">
      <ol className="flat-list">
        {prevPageToken && (
          <li>
            <Link href={prevHrefStr}>←</Link>
          </li>
        )}
        {Number(currPage) > 1 && (
          <li>
            <Link href={firstHrefStr}>1</Link>
          </li>
        )}
        {Number(currPage) > 2 && <li>…</li>}
        {Number(prevPageToken) > 1 && (
          <li>
            <Link href={prevHrefStr}>{prevPageToken}</Link>
          </li>
        )}
        <li>
          <form onSubmit={handlePageSubmit} style={{ display: 'inline' }}>
            <input
              type="number"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              min="1"
              max={finalPageToken || '1'}
              style={{
                width: '3ch',
                textAlign: 'center',
                MozAppearance: 'textfield',
              }}
              className="no-spinner"
            />
          </form>
        </li>
        {Number(currPage) < Number(finalPageToken) && (
          <>
            <li>
              <Link href={nextHrefStr}>{nextPageToken}</Link>
            </li>
            {Number(nextPageToken) < Number(finalPageToken) && <li>…</li>}
            {finalPageToken &&
              Number(nextPageToken) < Number(finalPageToken) && (
                <li>
                  <Link
                    href={nextHrefStr.replace(
                      `page=${nextPageToken}`,
                      `page=${finalPageToken}`
                    )}
                  >
                    {finalPageToken}
                  </Link>
                </li>
              )}
            <li>
              <Link href={nextHrefStr}>→</Link>
            </li>
          </>
        )}
      </ol>
    </div>
  );
}
