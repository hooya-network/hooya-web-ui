'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Thumbnail } from '@/types';
import { ConstructCIDThumbnailURL } from '@/helpers';
import { getCidInfo } from '@/lib/hooya-api-client';
import { useInstance, ProcessingEvent } from '@/contexts/InstanceContext';

interface FileImageProps {
  cid: string;
  thumbnails?: Thumbnail[];
  processingStatus?: number;
  contentUrl: string;
  className?: string;
  size?: 'small' | 'medium' | 'large' | number;
  clickable?: boolean;
  tags?: { namespace: string; descriptor: string }[];
  signature?: string;
  // Selection support (only for multi-select contexts like homepage)
  selectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (file: {
    cid: string;
    tags: { namespace: string; descriptor: string }[];
  }) => void;
  // Hover tooltip control
  showHoverTooltip?: boolean;
}

const FileImage = React.memo(function FileImage({
  cid,
  thumbnails = [],
  processingStatus = 0, // 0 = finished, 1 = processing, 2 = failed
  contentUrl,
  className = '',
  size = 'medium',
  clickable = true,
  tags = [],
  signature,
  selectMode = false,
  isSelected = false,
  onToggleSelect,
  showHoverTooltip = false,
}: FileImageProps) {
  const [currentThumbnails, setCurrentThumbnails] = useState(thumbnails);
  const [currentStatus, setCurrentStatus] = useState(processingStatus);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
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
        console.error('failed to refresh thumbnails:', error);
      }
    },
    [cid]
  );

  const handleProcessingEvent = useCallback(
    async (event: ProcessingEvent) => {
      switch (event.event_type) {
        case 'thumbnail_generated':
          await refreshThumbnails(false);
          break;
        case 'video_preview_generated':
          await refreshThumbnails(false);
          break;
        case 'processing_finished':
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

  // check if file is private and needs signature
  const isPrivate = tags.some(
    (tag) => tag.namespace === 'visibility' && tag.descriptor === 'private'
  );
  const useSignature = isPrivate ? signature : undefined;

  // render logic
  const renderImage = () => {
    // show thumbnail if available
    if (currentThumbnails.length > 0) {
      // so broken. we should really return the short name like
      // "medium" in the response instead of relying on order
      const thumbnailIndex =
        (size === 'medium' || size === 'large') && currentThumbnails.length > 1
          ? 1
          : 0;
      const thumbnail = currentThumbnails[thumbnailIndex];

      if (thumbnail?.mimetype?.startsWith('image')) {
        const imgElement = (
          <div className="file-preview-container">
            <img
              height={thumbnail.height}
              width={thumbnail.width}
              className={className}
              src={ConstructCIDThumbnailURL(
                thumbnail.source_cid,
                Math.max(thumbnail.width, thumbnail.height).toString(),
                useSignature
              )}
              alt={`Thumbnail for ${cid}`}
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
                  typeof size === 'number' ? size.toString() : size,
                  useSignature
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

    // processing
    if (currentStatus === 1) {
      const processingElement = (
        <div className="file-preview-container">
          <img
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

    // fallback for things w/o thumbnail
    const imgElement = (
      <div className="file-preview-container">
        <img
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

  const imageContent = renderImage();

  // organize tags for hover display
  const organizeTags = (
    tagList: { namespace: string; descriptor: string }[]
  ) => {
    let organizizedTags = new Map<string, string[]>();
    tagList.forEach((t) => {
      let descriptors = organizizedTags.get(t.namespace);
      descriptors?.push(t.descriptor);
      organizizedTags.set(t.namespace, descriptors || [t.descriptor]);
    });
    return organizizedTags;
  };

  const capitalizeNamespace = (namespace: string) => {
    return namespace
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const organizedTags = organizeTags(tags);

  // handle hover with delay and cleanup
  const handleMouseEnter = useCallback(() => {
    if (showHoverTooltip && tags.length > 0) {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
      }
      const timer = setTimeout(() => {
        setShowTooltip(true);
      }, 100);
      setHoverTimer(timer);
    }
  }, [showHoverTooltip, tags.length, hoverTimer]);

  const handleMouseLeave = useCallback(() => {
    // delay hiding tooltip to allow user to hover over it
    const hideTimer = setTimeout(() => {
      setShowTooltip(false);
    }, 200);

    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }

    // store the hide timer so we can clear it if user hovers back
    setHoverTimer(hideTimer);
  }, [hoverTimer]);

  const handleTooltipMouseEnter = useCallback(() => {
    // cancel hide timer when hovering over tooltip
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    setShowTooltip(true);
  }, [hoverTimer]);

  const handleTooltipMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

  // cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
      }
    };
  }, [hoverTimer]);

  // always wrap with hover and selection functionality
  return (
    <div
      className="file-image-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {imageContent}

      {/* Tag hover tooltip - only show if enabled */}
      {showHoverTooltip && tags.length > 0 && (
        <div
          className="tag-hover-tooltip"
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
          style={{
            opacity: showTooltip ? 1 : 0,
            pointerEvents: showTooltip ? 'auto' : 'none',
          }}
        >
          <div className="tag-block">
            {Array.from(organizedTags).map(([namespace, descriptors]) => (
              <div key={`hover-tag-namespace-${namespace}`}>
                <h3>{capitalizeNamespace(namespace)}</h3>
                <div className={`tag-namespace-${namespace}`}>
                  {descriptors.map((descriptor, index) => (
                    <span
                      key={`hover-${namespace}-${descriptor}-${index}`}
                      className="tag-descriptor"
                    >
                      ?&nbsp;
                      <Link href={`/?query=${namespace}:${descriptor}`}>
                        {descriptor}
                      </Link>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selection overlay - only in select mode */}
      {selectMode && onToggleSelect && (
        <div
          className="selection-overlay"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSelect({ cid, tags });
          }}
          style={{
            opacity: isSelected ? 0.3 : 0,
          }}
        />
      )}
    </div>
  );
});

export default FileImage;
