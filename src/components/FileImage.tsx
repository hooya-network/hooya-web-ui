'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Thumbnail } from '@/types';
import { ConstructCIDThumbnailURL } from '@/helpers';
import { getCidInfo } from '@/lib/hooya-api-client';
import { useInstance } from '@/contexts/InstanceContext';

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
  const { subscribeToProcessing, processingStatus: instanceProcessingStatus } =
    useInstance();

  const refreshThumbnails = useCallback(
    async (markAsFinished = false) => {
      try {
        const data = await getCidInfo(cid);
        if (data.ext_file?.thumbnails) {
          setCurrentThumbnails(data.ext_file.thumbnails);
          if (markAsFinished) {
            setCurrentStatus(0); // only mark as finished when explicitly requested
          }
        }
      } catch (error) {
        console.error('Failed to refresh thumbnails:', error);
      }
    },
    [cid]
  );

  const handleProcessingEvent = useCallback(
    async (event: any) => {
      switch (event.event_type) {
        case 'thumbnail_generated':
        case 'video_preview_generated':
          // thumbnail/preview is ready - refresh thumbnails but keep processing status
          await refreshThumbnails(false); // don't mark as finished yet
          break;
        case 'processing_finished':
          // all processing complete - refresh one final time and mark as finished
          await refreshThumbnails(true); // mark as finished
          break;
        case 'processing_failed':
          setCurrentStatus(2); // mark as failed
          break;
      }
    },
    [refreshThumbnails]
  );

  useEffect(() => {
    // sync currentStatus with processingStatus prop or instance status
    const instanceStatus = instanceProcessingStatus.get(cid);
    if (instanceStatus !== undefined) {
      setCurrentStatus(instanceStatus);
    } else {
      setCurrentStatus(processingStatus);
    }
  }, [cid, processingStatus, instanceProcessingStatus]);

  useEffect(() => {
    // sync currentThumbnails with thumbnails prop
    setCurrentThumbnails(thumbnails);
  }, [thumbnails]);

  useEffect(() => {
    // always subscribe to processing events for this CID
    // the InstanceContext will handle connection management globally
    return subscribeToProcessing(cid, handleProcessingEvent);
  }, [cid, subscribeToProcessing, handleProcessingEvent]);

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
            alt="Processing…"
          />
          <div className="mimetype-indicator">processing…</div>
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
