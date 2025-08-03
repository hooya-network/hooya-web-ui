'use client';

import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  Suspense,
  useRef,
} from 'react';
import ImageMasonGrid from '@/components/ImageMasonGrid';
import Search from '@/components/Search';
import PageNavigation from '@/components/PageNavigation';
import FileImage from '@/components/FileImage';
import BatchControls from '@/components/BatchControls';
import { SelectedFile } from '@/hooks/useFileSelection';
import { getSuggestedTags } from '@/lib/hooya-api-client';
import { FileType } from '@/types';
import { useInstance } from '@/contexts/InstanceContext';
import { useFileSelection } from '@/hooks/useFileSelection';
import { usePaginationCache } from '@/hooks/usePaginationCache';

interface ClientHomepageProps {
  searchParams: { [key: string]: string | undefined };
}

export default function ClientHomepage({ searchParams }: ClientHomepageProps) {
  const [files, setFiles] = useState<FileType[]>([]);
  const [pages, setPages] = useState({
    next_page_token: '1',
    final_page_token: '1',
  });
  const [initSuggest, setInitSuggest] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const { instanceInfo } = useInstance();

  // File selection hook
  const {
    selectedFiles,
    selectedCount,
    toggleFileSelection,
    clearSelection,
    isSelected,
    getSharedTags,
    getSharedVisibility,
    updateSelectedFilesTags,
    selectAllOnPage,
  } = useFileSelection();

  // Pagination cache hook
  const { fetchWithCache, preloadAdjacentPages, clearCacheForQuery } =
    usePaginationCache();

  const currPage = searchParams?.page || '1';
  const terms = useMemo(
    () => searchParams?.query?.split(','),
    [searchParams?.query]
  );
  const prevTermsRef = useRef<string>('');
  const preloadedPagesRef = useRef<string>('');

  // check authentication status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('refresh_token');
      setIsAuthenticated(!!token);
    }
  }, []);

  // fetch suggestions only when search terms change, not on pagination
  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const termsString = terms?.join(',') || '';
        const suggestions = await getSuggestedTags(termsString);
        setInitSuggest(suggestions.slice(0, 10));
      } catch (error) {
        console.error('failed to fetch suggestions:', error);
      }
    }

    fetchSuggestions();
  }, [terms]);

  // fetch images when page or search terms change
  useEffect(() => {
    async function fetchImages() {
      // check if query changed and clear cache if so
      const currentQuery = terms?.join(',') || '';
      if (currentQuery !== prevTermsRef.current) {
        clearCacheForQuery(terms);
        prevTermsRef.current = currentQuery;
      }

      // only show loading for pagination, not initial load
      setImagesLoading(true);

      try {
        const resp = await fetchWithCache(terms, currPage);

        if (resp?.final_page_token !== undefined) {
          setPages({
            next_page_token: resp.next_page_token || '',
            final_page_token: resp.final_page_token,
          });
        }

        if (resp?.files) {
          setFiles(resp.files);

          // trigger preloading with fresh data immediately
          const preloadKey = `${currentQuery}:${currPage}`;
          if (preloadedPagesRef.current !== preloadKey) {
            preloadedPagesRef.current = preloadKey;
            preloadAdjacentPages(terms, currPage, resp);
          }
        }
      } catch (error) {
        console.error('failed to fetch images:', error);
      } finally {
        setLoading(false);
        setImagesLoading(false);
      }
    }

    fetchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currPage, terms?.join(',')]);

  // Batch editing handlers
  const handleBatchTagSave = (updatedFiles: SelectedFile[]) => {
    // update the local files state with new tags
    setFiles((prevFiles) =>
      prevFiles.map((file) => {
        const updatedFile = updatedFiles.find((uf) => uf.cid === file.cid);
        return updatedFile ? { ...file, tags: updatedFile.tags } : file;
      })
    );
    // update selected files state so shared calculations refresh
    updateSelectedFilesTags(updatedFiles);
    // clear cache since tag data is now stale
    clearCacheForQuery(terms);
    // don't clear selection - keep it for additional operations
  };

  const handleBatchVisibilityChange = (updatedFiles: SelectedFile[]) => {
    // update the local files state with new tags (including visibility changes)
    setFiles((prevFiles) =>
      prevFiles.map((file) => {
        const updatedFile = updatedFiles.find((uf) => uf.cid === file.cid);
        return updatedFile ? { ...file, tags: updatedFile.tags } : file;
      })
    );
    // update selected files state so shared calculations refresh
    updateSelectedFilesTags(updatedFiles);
    // clear cache since tag/visibility data is now stale
    clearCacheForQuery(terms);
    // don't clear selection - keep it for additional operations
  };

  const handleFilesDeleted = (deletedCids: string[]) => {
    // remove deleted files from local state
    setFiles((prevFiles) =>
      prevFiles.filter((file) => !deletedCids.includes(file.cid))
    );
    // clear cache since files are now deleted
    clearCacheForQuery(terms);
    clearSelection(); // clear since files are gone
  };

  const handleToggleSelectMode = () => {
    setSelectMode(!selectMode);
    if (selectMode) {
      // exiting select mode, clear selections
      clearSelection();
    }
  };

  // stable callback reference to prevent re-renders
  const stableToggleFileSelection = useCallback(toggleFileSelection, [
    toggleFileSelection,
  ]);
  const stableIsSelected = useCallback(isSelected, [isSelected]);

  const areAllPageFilesSelected = useMemo(() => {
    if (files.length === 0) return false;
    return files.every((file) => isSelected(file.cid));
  }, [files, isSelected]);

  const handleToggleAllOnPage = useCallback(() => {
    if (areAllPageFilesSelected) {
      // unselect all files on this page
      files.forEach((file) => {
        if (isSelected(file.cid)) {
          toggleFileSelection({ cid: file.cid, tags: file.tags || [] });
        }
      });
    } else {
      // select all files on this page
      const pageFiles: SelectedFile[] = files.map((file) => ({
        cid: file.cid,
        tags: file.tags || [],
      }));
      selectAllOnPage(pageFiles);
    }
  }, [
    files,
    areAllPageFilesSelected,
    isSelected,
    toggleFileSelection,
    selectAllOnPage,
  ]);

  // memoize image creation to prevent unnecessary re-renders
  const imageElements = useMemo(() => {
    return files.map((f: FileType) => (
      <FileImage
        key={f.cid}
        cid={f.cid}
        thumbnails={f.ext_file?.thumbnails || []}
        processingStatus={f.processing_status}
        contentUrl={`/cid/${f.cid}`}
        size="small"
        clickable={true}
        tags={f.tags || []}
        signature={f.signature}
        selectMode={selectMode}
        isSelected={stableIsSelected(f.cid)}
        onToggleSelect={stableToggleFileSelection}
        showHoverTooltip={true}
      />
    ));
  }, [files, selectMode, stableIsSelected, stableToggleFileSelection]);

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
      {selectMode && (
        <BatchControls
          selectedFiles={selectedFiles}
          selectedCount={selectedCount}
          sharedTags={getSharedTags()}
          sharedVisibility={getSharedVisibility()}
          onClearSelection={clearSelection}
          onTagSave={handleBatchTagSave}
          onVisibilityChange={handleBatchVisibilityChange}
          onFilesDeleted={handleFilesDeleted}
          onToggleAllOnPage={handleToggleAllOnPage}
          areAllPageFilesSelected={areAllPageFilesSelected}
        />
      )}
      {pages && (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'end',
              flexWrap: 'wrap',
              padding: '1ch 0',
            }}
          >
            <span>
              Page
              <PageNavigation
                currPage={currPage}
                nextPageToken={pages?.next_page_token}
                finalPageToken={pages?.final_page_token}
                query={terms?.join(',')}
              />
            </span>
            {isAuthenticated && (
              <a onClick={handleToggleSelectMode} style={{ cursor: 'pointer' }}>
                {selectMode ? 'exit select mode' : 'select mode'}
              </a>
            )}
          </div>
          {imagesLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              Loading images...
            </div>
          ) : (
            <ImageMasonGrid imageBlocks={imageElements} />
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'end',
              flexWrap: 'wrap',
              padding: '1ch 0',
            }}
          >
            <span>
              <PageNavigation
                currPage={currPage}
                nextPageToken={
                  files.length > 0 ? pages?.next_page_token : undefined
                }
                finalPageToken={pages?.final_page_token}
                query={terms?.join(',')}
              />
              Page
            </span>
            {isAuthenticated && (
              <a onClick={handleToggleSelectMode} style={{ cursor: 'pointer' }}>
                {selectMode ? 'exit select mode' : 'select mode'}
              </a>
            )}
          </div>
        </>
      )}
      {selectMode && (
        <BatchControls
          selectedFiles={selectedFiles}
          selectedCount={selectedCount}
          sharedTags={getSharedTags()}
          sharedVisibility={getSharedVisibility()}
          onClearSelection={clearSelection}
          onTagSave={handleBatchTagSave}
          onVisibilityChange={handleBatchVisibilityChange}
          onFilesDeleted={handleFilesDeleted}
          onToggleAllOnPage={handleToggleAllOnPage}
          areAllPageFilesSelected={areAllPageFilesSelected}
        />
      )}
    </main>
  );
}
