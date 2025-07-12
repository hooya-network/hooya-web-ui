'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import ImageMasonGrid from '@/components/ImageMasonGrid';
import Search from '@/components/Search';
import PageNavigation from '@/components/PageNavigation';
import FileImage from '@/components/FileImage';
import {
  searchFiles,
  getRecentFiles,
  getSuggestedTags,
} from '@/lib/hooya-api-client';
import { FileType } from '@/types';
import { useInstance } from '@/contexts/InstanceContext';

interface ClientHomepageProps {
  searchParams: { [key: string]: string | undefined };
}

export default function ClientHomepage({ searchParams }: ClientHomepageProps) {
  const [images, setImages] = useState<JSX.Element[]>([]);
  const [pages, setPages] = useState({
    next_page_token: '1',
    final_page_token: '1',
  });
  const [initSuggest, setInitSuggest] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [imagesLoading, setImagesLoading] = useState(false);
  const { instanceInfo } = useInstance();

  const currPage = searchParams?.page || '1';
  const terms = useMemo(
    () => searchParams?.query?.split(','),
    [searchParams?.query]
  );

  // fetch suggestions only when search terms change, not on pagination
  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const termsString = terms?.join(',') || '';
        const suggestions = await getSuggestedTags(termsString);
        setInitSuggest(suggestions.slice(0, 10));
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      }
    }

    fetchSuggestions();
  }, [terms]);

  // set main loading state only when search terms change or initial load
  useEffect(() => {
    if (loading) {
      // this is initial load, keep loading state
      return;
    }
    // terms changed after initial load, show loading state
    setLoading(true);
  }, [terms]);

  // fetch images when page or search terms change
  useEffect(() => {
    async function fetchImages() {
      // only show main loading on initial load or term changes
      // use imagesLoading for pagination
      if (!loading) {
        setImagesLoading(true);
      }

      try {
        let resp;
        if (!terms) {
          resp = await getRecentFiles(currPage);
        } else {
          resp = await searchFiles(terms, [], [], currPage);
        }

        if (resp?.final_page_token !== undefined) {
          setPages({
            next_page_token: resp.next_page_token || '',
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
      } catch (error) {
        console.error('Failed to fetch images:', error);
      } finally {
        setLoading(false);
        setImagesLoading(false);
      }
    }

    fetchImages();
  }, [currPage, terms, loading]);

  if (loading) {
    return (
      <main>
        <div id="home-search">
          <h1>HooYa!</h1>
          <div className="subtext">Loading…</div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div id="home-search">
        <h1>HooYa!</h1>
        <div className="subtext">
          Browsing &quot;{instanceInfo?.instance_name || 'Loading…'}&quot;
          instance
        </div>
        <div className="subtext">
          Peer ID {instanceInfo?.short_id || 'Loading…'}
        </div>
        <Suspense fallback={<div>Loading search...</div>}>
          <Search key="main-search" initSuggest={initSuggest} />
        </Suspense>
        <div className="subtext">
          {instanceInfo?.daemon_version?.version_string || 'Loading…'} /{' '}
          {instanceInfo?.webui_version?.version_string || 'Loading…'} / Operated
          by {instanceInfo?.operator_name || 'Loading…'}
          <br />
          {instanceInfo?.stats
            ? `${instanceInfo.stats.files_indexed}+ files indexed / ${instanceInfo.stats.associations_count}+ associations / ${instanceInfo.stats.tags_count}+ tags`
            : 'Loading statistics…'}
        </div>
      </div>
      {pages && (
        <>
          <PageNavigation
            currPage={currPage}
            nextPageToken={pages?.next_page_token}
            finalPageToken={pages?.final_page_token}
            query={terms?.join(',')}
          />
          {imagesLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              Loading images...
            </div>
          ) : (
            <ImageMasonGrid imageBlocks={images} />
          )}
          <PageNavigation
            currPage={currPage}
            nextPageToken={
              images.length > 0 ? pages?.next_page_token : undefined
            }
            finalPageToken={pages?.final_page_token}
            query={terms?.join(',')}
          />
        </>
      )}
    </main>
  );
}
