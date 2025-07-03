'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Thumbnail } from '@/types'
import { ConstructCIDThumbnailURL, ConstructCIDProcessingURL, QueryCidInfo } from '@/helpers'

interface FileImageProps {
  cid: string
  thumbnails?: Thumbnail[]
  processingStatus?: number
  contentUrl: string
  className?: string
  size?: 'small' | 'medium' | number
  clickable?: boolean
}

export default function FileImage({ 
  cid, 
  thumbnails = [], 
  processingStatus = 0, // 0 = finished, 1 = processing, 2 = failed
  contentUrl, 
  className = '',
  size = 'medium',
  clickable = true 
}: FileImageProps) {
  const [currentThumbnails, setCurrentThumbnails] = useState(thumbnails)
  const [currentStatus, setCurrentStatus] = useState(processingStatus)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    // sync currentStatus with processingStatus prop
    setCurrentStatus(processingStatus)
  }, [processingStatus])

  useEffect(() => {
    // sync currentThumbnails with thumbnails prop
    setCurrentThumbnails(thumbnails)
  }, [thumbnails])

  useEffect(() => {
    // only start sse if processing (status = 1)
    if (currentStatus === 1) {
      startProcessingMonitor(cid)
    }

    return () => {
      closeProcessingMonitor()
    }
  }, [cid, currentStatus])

  const startProcessingMonitor = async (cid: string) => {
    if (eventSourceRef.current) return // already monitoring

    const eventSource = new EventSource(await ConstructCIDProcessingURL(cid))

    eventSource.addEventListener('thumbnail_generated', async (event) => {
      // first thumbnail is ready - switch from processing.gif to thumbnail
      await refreshThumbnails()
      // don't close monitor yet - more thumbnails might be generating
    })

    eventSource.addEventListener('video_preview_generated', async (event) => {
      // first video preview is ready - switch from processing.gif to preview
      await refreshThumbnails()
      // don't close monitor yet - more previews might be generating
    })

    eventSource.addEventListener('processing_finished', async () => {
      // all processing complete - refresh one final time and close monitor
      await refreshThumbnails()
      closeProcessingMonitor()
    })

    eventSource.addEventListener('processing_failed', () => {
      setCurrentStatus(2) // mark as failed
      closeProcessingMonitor()
    })

    eventSource.onerror = () => {
      // graceful degradation - just close connection
      closeProcessingMonitor()
    }

    eventSourceRef.current = eventSource
  }

  const closeProcessingMonitor = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }

  const refreshThumbnails = async () => {
    try {
      const data = await QueryCidInfo(cid)
      if (data.ext_file?.thumbnails) {
        setCurrentThumbnails(data.ext_file.thumbnails)
        setCurrentStatus(0) // mark as finished
      }
    } catch (error) {
      console.error('Failed to refresh thumbnails:', error)
    }
  }

  // render logic
  const renderImage = () => {
    // show thumbnail if available
    if (currentThumbnails.length > 0) {
      const thumbnail = currentThumbnails[0] // use first available thumbnail
      if (thumbnail?.mimetype?.startsWith("image")) {
        const imgElement = (
          <img
            height={thumbnail.height}
            width={thumbnail.width}
            className={className}
            src={ConstructCIDThumbnailURL(thumbnail.source_cid, size)}
            alt=""
          />
        )

        return clickable ? <Link href={contentUrl}>{imgElement}</Link> : imgElement
      } else if (thumbnail?.mimetype?.startsWith("video")) {
        const videoElement = (
          <video autoPlay loop muted
            height={thumbnail.height}
            width={thumbnail.width}
            className={className}>
            <source
              src={ConstructCIDThumbnailURL(thumbnail.source_cid, size)}
              type={thumbnail.mimetype}
            />
          </video>
        )

        return clickable ? <Link href={contentUrl}>{videoElement}</Link> : videoElement
      }
    }

    // show processing gif if currently processing
    if (currentStatus === 1) {
      return (
        <img
          height={500}
          width={500}
          className={`${className} processing-thumbnail`}
          src="/processing.gif"
          alt="Processing..."
        />
      )
    }

    // fallback to no-thumb.gif (for finished with no thumbs, failed, etc)
    const imgElement = (
      <img
        height={500}
        width={500}
        className={className}
        src="/no-thumb.gif"
        alt="No thumbnail available"
      />
    )
    
    return clickable ? <Link href={contentUrl}>{imgElement}</Link> : imgElement
  }

  return renderImage()
}