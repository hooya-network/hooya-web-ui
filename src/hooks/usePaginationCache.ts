'use client';

import { useRef, useCallback } from 'react';
import { searchFiles, getRecentFiles } from '@/lib/hooya-api-client';
import { Thumbnail } from '@/types';

interface FileType {
  cid: string;
  tags: { namespace: string; descriptor: string }[];
  ext_file?: {
    thumbnails?: Thumbnail[];
  };
}

interface PageData {
  files: FileType[];
  next_page_token: string;
  final_page_token: string;
}

interface CacheEntry {
  data: PageData;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // maximum number of pages to cache

export function usePaginationCache() {
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  // generate cache key
  const getCacheKey = useCallback(
    (terms: string[] | undefined, page: string): string => {
      const query = terms?.join(',') || 'recent';
      return `${query}:${page}`;
    },
    []
  );

  // check if cache entry is valid
  const isCacheValid = useCallback((entry: CacheEntry): boolean => {
    return Date.now() - entry.timestamp < CACHE_TTL;
  }, []);

  // get from cache if valid
  const getFromCache = useCallback(
    (terms: string[] | undefined, page: string): PageData | null => {
      const key = getCacheKey(terms, page);
      const entry = cacheRef.current.get(key);

      if (entry && isCacheValid(entry)) {
        return entry.data;
      }

      // clean up expired entry
      if (entry) {
        cacheRef.current.delete(key);
      }

      return null;
    },
    [getCacheKey, isCacheValid]
  );

  // store in cache with size limit
  const storeInCache = useCallback(
    (terms: string[] | undefined, page: string, data: PageData): void => {
      const key = getCacheKey(terms, page);
      cacheRef.current.set(key, {
        data,
        timestamp: Date.now(),
      });

      // remove expired entries first
      const now = Date.now();
      const expiredKeys: string[] = [];
      cacheRef.current.forEach((entry, key) => {
        if (now - entry.timestamp > CACHE_TTL) {
          expiredKeys.push(key);
        }
      });
      expiredKeys.forEach((key) => cacheRef.current.delete(key));

      // then enforce cache size limit by removing oldest entries
      if (cacheRef.current.size > MAX_CACHE_SIZE) {
        const entries = Array.from(cacheRef.current.entries())
          .map(([key, entry]) => ({ key, timestamp: entry.timestamp }))
          .sort((a, b) => a.timestamp - b.timestamp);

        // remove oldest entries until we're under the limit
        const entriesToRemove = entries.slice(
          0,
          cacheRef.current.size - MAX_CACHE_SIZE
        );
        entriesToRemove.forEach((entry) => cacheRef.current.delete(entry.key));
      }
    },
    [getCacheKey]
  );

  // fetch with caching
  const fetchWithCache = useCallback(
    async (
      terms: string[] | undefined,
      page: string
    ): Promise<PageData | null> => {
      // try cache first
      const cached = getFromCache(terms, page);
      if (cached) {
        return cached;
      }

      // fetch from API
      try {
        let response;
        if (terms && terms.length > 0) {
          response = await searchFiles(terms, [], [], page);
        } else {
          response = await getRecentFiles(page);
        }

        if (response) {
          storeInCache(terms, page, response);
          return response;
        }
      } catch (error) {
        console.error('failed to fetch page data:', error);
      }

      return null;
    },
    [getFromCache, storeInCache]
  );

  // preload adjacent pages
  const preloadAdjacentPages = useCallback(
    (
      terms: string[] | undefined,
      currentPage: string,
      currentData: PageData
    ) => {
      // use setTimeout to ensure this runs after the current execution context
      setTimeout(() => {
        const currentPageNum = parseInt(currentPage);

        // preload previous page
        if (currentPageNum > 1) {
          const prevPage = (currentPageNum - 1).toString();
          if (!getFromCache(terms, prevPage)) {
            fetchWithCache(terms, prevPage).catch(() => {}); // silent fail
          }
        }

        // preload next page
        const nextPage = currentData.next_page_token;
        if (nextPage) {
          if (!getFromCache(terms, nextPage)) {
            fetchWithCache(terms, nextPage).catch(() => {}); // silent fail
          }
        }
      }, 0);
    },
    [getFromCache, fetchWithCache]
  );

  // clear cache for a query
  const clearCacheForQuery = useCallback((terms: string[] | undefined) => {
    const queryPrefix = terms?.join(',') || 'recent';
    const keysToDelete: string[] = [];

    cacheRef.current.forEach((_, key) => {
      if (key.startsWith(queryPrefix + ':')) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => cacheRef.current.delete(key));
  }, []);

  return {
    fetchWithCache,
    preloadAdjacentPages,
    clearCacheForQuery,
    getFromCache,
  };
}
