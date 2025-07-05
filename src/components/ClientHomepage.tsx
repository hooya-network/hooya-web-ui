'use client';

import { useEffect, useState } from 'react';
import ImageMasonGrid from "@/components/ImageMasonGrid";
import Search from "@/components/Search";
import PageNavigation from "@/components/PageNavigation";
import FileImage from "@/components/FileImage";
import { searchFiles, getRecentFiles, getSuggestedTags } from '@/lib/hooya-api-client';
import { FileType } from '@/types';

interface ClientHomepageProps {
  searchParams: { [key: string]: string | undefined };
}

export default function ClientHomepage({ searchParams }: ClientHomepageProps) {
  const [images, setImages] = useState<JSX.Element[]>([]);
  const [pages, setPages] = useState({
    next_page_token: "1",
    final_page_token: "1"
  });
  const [initSuggest, setInitSuggest] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const currPage = searchParams?.page || "1";
  const terms = searchParams?.query?.split(',');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      try {
        // fetch images
        let resp;
        if (!terms) {
          resp = await getRecentFiles(currPage);
        } else {
          resp = await searchFiles(terms, [], [], currPage);
        }
        
        if (resp?.next_page_token && resp?.final_page_token) {
          setPages({
            next_page_token: resp.next_page_token,
            final_page_token: resp.final_page_token,
          });
        }
        
        if (resp?.files) {
          // Transform files data into JSX elements like the original server-side code
          const imageElements = resp.files.map((f: FileType) => (
            <FileImage
              key={f.cid}
              cid={f.cid}
              thumbnails={f.ext_file?.thumbnails || []}
              processingStatus={f.processing_status}
              contentUrl={`/cid/${f.cid}`}
              size="small"
              clickable={true}
            />
          ));
          setImages(imageElements);
        }

        // fetch suggestions
        const termsString = terms?.join(",") || "";
        const suggestions = await getSuggestedTags(termsString);
        setInitSuggest(suggestions.slice(0, 10));
        
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currPage, terms]);

  if (loading) {
    return (
      <main>
        <div id="home-search">
          <h1>HooYa!</h1>
          <div className="subtext">Loading...</div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div id="home-search">
        <h1>HooYa!</h1>
        <div className="subtext">Browsing &quot;Public Demo&quot; instance</div>
        <div className="subtext">Peer ID 0xC262a…a048</div>
        <Search
          page={currPage}
          initSuggest={initSuggest}
        />
        <div className="subtext">hooyad v0.1.0-alpha-5 / hooya-web-ui v0.1.0-alpha-5 / Operated by wesl-ee<br/>
          9000+ files indexed / 1000+ associations / 100+ tags</div>
      </div>
      {pages && <>
        <PageNavigation
          currPage={currPage}
          nextPageToken={pages?.next_page_token}
          finalPageToken={pages?.final_page_token}
          query={terms?.join(",")}
        />
        <ImageMasonGrid
          imageBlocks={images}
        />
        <PageNavigation
          currPage={currPage}
          nextPageToken={images.length > 0 ? pages?.next_page_token : undefined}
          finalPageToken={pages?.final_page_token}
          query={terms?.join(",")}
        />
      </>}
    </main>
  );
}