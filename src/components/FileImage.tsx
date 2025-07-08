'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Thumbnail } from '@/types';
import { ConstructCIDThumbnailURL, ConstructCIDProcessingURL } from '@/helpers';
import { getCidInfo } from '@/lib/hooya-api-client';

interface FileImageProps {
  cid: string;
  thumbnails?: Thumbnail[];
  processingStatus?: number;
  contentUrl: string;
  className?: string;
  size?: 'small' | 'medium' | number;
  clickable?: boolean;
}

export default function FileImage({
  cid,
  thumbnails = [],
  processingStatus = 0, // 0 = finished, 1 = processing, 2 = failed
  contentUrl,
  className = '',
  size = 'medium',
  clickable = true,
}: FileImageProps) {
  const [currentThumbnails, setCurrentThumbnails] = useState(thumbnails);
  const [currentStatus, setCurrentStatus] = useState(processingStatus);
  const eventSourceRef = useRef<EventSource | null>(null);

  const refreshThumbnails = useCallback(async () => {
    try {
      const data = await getCidInfo(cid);
      if (data.ext_file?.thumbnails) {
        setCurrentThumbnails(data.ext_file.thumbnails);
        setCurrentStatus(0); // mark as finished
      }
    } catch (error) {
      console.error('Failed to refresh thumbnails:', error);
    }
  }, [cid]);

  const closeProcessingMonitor = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  const startProcessingMonitor = useCallback(
    async (cid: string) => {
      if (eventSourceRef.current) return; // already monitoring

      const eventSource = new EventSource(await ConstructCIDProcessingURL(cid));

      eventSource.addEventListener('thumbnail_generated', async () => {
        // first thumbnail is ready - switch from processing.gif to thumbnail
        await refreshThumbnails();
        // don't close monitor yet - more thumbnails might be generating
      });

      eventSource.addEventListener('video_preview_generated', async () => {
        // first video preview is ready - switch from processing.gif to preview
        await refreshThumbnails();
        // don't close monitor yet - more previews might be generating
      });

      eventSource.addEventListener('processing_finished', async () => {
        // all processing complete - refresh one final time and close monitor
        await refreshThumbnails();
        closeProcessingMonitor();
      });

      eventSource.addEventListener('processing_failed', () => {
        setCurrentStatus(2); // mark as failed
        closeProcessingMonitor();
      });

      eventSource.onerror = () => {
        // graceful degradation - just close connection
        closeProcessingMonitor();
      };

      eventSourceRef.current = eventSource;
    },
    [refreshThumbnails]
  );

  useEffect(() => {
    // sync currentStatus with processingStatus prop
    setCurrentStatus(processingStatus);
  }, [processingStatus]);

  useEffect(() => {
    // sync currentThumbnails with thumbnails prop
    setCurrentThumbnails(thumbnails);
  }, [thumbnails]);

  useEffect(() => {
    // only start sse if processing (status = 1)
    if (currentStatus === 1) {
      startProcessingMonitor(cid);
    }

    return () => {
      closeProcessingMonitor();
    };
  }, [cid, currentStatus, startProcessingMonitor]);

  // render logic
  const renderImage = () => {
    // show thumbnail if available
    if (currentThumbnails.length > 0) {
      const thumbnailIndex =
        (size === 'medium' || size === 'large') && currentThumbnails.length > 1
          ? 1
          : 0;
      const thumbnail = currentThumbnails[thumbnailIndex];

      if (thumbnail?.mimetype?.startsWith('image')) {
        const imgElement = (
          <div className="file-preview-container">
            <Image
              height={thumbnail.height}
              width={thumbnail.width}
              className={className}
              src={ConstructCIDThumbnailURL(
                thumbnail.source_cid,
                typeof size === 'number' ? size.toString() : size
              )}
              alt=""
            />
            <div className="mimetype-indicator">{thumbnail.mimetype}</div>
          </div>
        );

        return clickable ? (
          <Link href={contentUrl}>{imgElement}</Link>
        ) : (
          imgElement
        );
      } else if (thumbnail?.mimetype?.startsWith('video')) {
        const videoElement = (
          <div className="file-preview-container">
            <video
              loop
              muted
              height={thumbnail.height}
              width={thumbnail.width}
              className={className}
              onMouseEnter={(e) => e.currentTarget.play()}
              onMouseLeave={(e) => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              }}
            >
              <source
                src={ConstructCIDThumbnailURL(
                  thumbnail.source_cid,
                  typeof size === 'number' ? size.toString() : size
                )}
                type={thumbnail.mimetype}
              />
            </video>
            <div className="mimetype-indicator">{thumbnail.mimetype}</div>
          </div>
        );

        return clickable ? (
          <Link href={contentUrl}>{videoElement}</Link>
        ) : (
          videoElement
        );
      }
    }

    if (currentStatus === 1) {
      const processingElement = (
        <div className="file-preview-container">
          <Image
            height={200}
            width={200}
            className={`${className} processing-thumbnail`}
            src="/processing.gif"
            alt="Processing..."
          />
          <div className="mimetype-indicator">processing...</div>
        </div>
      );

      return clickable ? (
        <Link href={contentUrl}>{processingElement}</Link>
      ) : (
        processingElement
      );
    }

    // fallback to no-thumb.gif (for finished with no thumbs, failed, etc)
    const imgElement = (
      <div className="file-preview-container">
        <Image
          height={200}
          width={200}
          className={className}
          src="/no-thumb.gif"
          alt="No thumbnail available"
        />
        <div className="mimetype-indicator">
          {currentStatus === 2 ? 'failed' : 'no preview'}
        </div>
      </div>
    );

    return clickable ? <Link href={contentUrl}>{imgElement}</Link> : imgElement;
  };

  return renderImage();
}
