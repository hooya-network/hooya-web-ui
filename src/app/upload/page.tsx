'use client'

import { useState } from 'react'
import Link from 'next/link'
import { startUploadSession, completeUpload, uploadChunk } from '@/lib/upload-client'

type UploadStatus = 'idle' | 'uploading' | 'complete' | 'error'

type UploadProgress = {
  bytesUploaded: number
  totalBytes: number
  currentChunk: number
}

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    bytesUploaded: 0,
    totalBytes: 0,
    currentChunk: 0
  })

  const [resultCid, setResultCid] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setUploadStatus('idle')
    setResultCid(null)
    setErrorMessage('')
    setUploadProgress({ bytesUploaded: 0, totalBytes: file.size, currentChunk: 0 })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const uploadFile = async (file: File) => {
    try {
      setUploadStatus('uploading')
      setErrorMessage('')

      // 1. Start upload session
      const CHUNK_SIZE = 1024 * 1024 // 1MB
      const session = await startUploadSession(file.size, file.type, CHUNK_SIZE)

      // 2. Upload chunks using server-controlled indexing
      let chunkIndex = 0
      let bytesUploaded = 0

      while (bytesUploaded < file.size) {
        const start = bytesUploaded
        const end = Math.min(start + session.chunk_size, file.size)

        const chunk = file.slice(start, end)
        const arrayBuffer = await chunk.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)

        // Convert to base64 without spreading (avoids stack overflow)
        let binaryString = ''
        for (let i = 0; i < uint8Array.length; i++) {
          binaryString += String.fromCharCode(uint8Array[i])
        }
        const base64Data = btoa(binaryString)

        // upload chunk
        const chunkResult = await uploadChunk(session.upload_id, chunkIndex, base64Data)

        // Check for upload error
        if (chunkResult.status === 2) { // UPLOAD_ERROR = 2
          throw new Error(chunkResult.error_message || 'Upload failed')
        }

        // Use server-provided values for next iteration
        bytesUploaded = chunkResult.bytes_received
        chunkIndex = chunkResult.next_chunk_index

        setUploadProgress({
          bytesUploaded: chunkResult.bytes_received,
          totalBytes: file.size,
          currentChunk: chunkIndex
        })

        // Check if upload is complete
        if (chunkResult.status === 1) { // UPLOAD_COMPLETE = 1
          // When status is COMPLETE, we should call completeUpload to get the final CID
          const result = await completeUpload(session.upload_id)
          setResultCid(result.cid)
          setUploadStatus('complete')
          return // Exit the function here
        }
      }

      // 3. Complete upload (this should only run if we exit the loop without UPLOAD_COMPLETE)
      const result = await completeUpload(session.upload_id)
      setResultCid(result.cid)
      setUploadStatus('complete')

    } catch (error) {
      setUploadStatus('error')
      console.error('Upload error:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed')
    }
  }

  const progressPercentage = uploadProgress.totalBytes > 0 
    ? Math.round((uploadProgress.bytesUploaded / uploadProgress.totalBytes) * 100)
    : 0

  return (
    <main>
      <div id="home-search">
        <h1>Upload File</h1>
        <div className="subtext">Upload files to the HooYa network</div>
      </div>

      <div className="upload-container">
        {/* File Drop Zone */}
        <div
          className={`upload-dropzone ${isDragOver ? 'drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <p>
            {selectedFile ? selectedFile.name : 'Drag & drop a file here, or click to select'}
          </p>
          <input
            id="file-input"
            type="file"
            className="upload-file-input"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
          />
        </div>

        {/* File Info */}
        {selectedFile && (
          <div className="upload-file-info">
            <p><strong>File:</strong> {selectedFile.name}</p>
            <p><strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            <p><strong>Type:</strong> {selectedFile.type}</p>
          </div>
        )}

        {/* Upload Button */}
        {selectedFile && uploadStatus === 'idle' && (
          <button
            className="upload-button"
            onClick={() => uploadFile(selectedFile)}
          >
            Upload File
          </button>
        )}

        {/* Progress Bar */}
        {uploadStatus === 'uploading' && (
          <div className="upload-progress">
            <div className="upload-progress-info">
              <span>Uploading... {progressPercentage}%</span>
              <span>Chunk {uploadProgress.currentChunk}</span>
            </div>
            <div className="upload-progress-bar">
              <div
                className="upload-progress-fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Success */}
        {uploadStatus === 'complete' && resultCid && (
          <div className="upload-success">
            <p><strong>Upload Complete!</strong></p>
            <p>File CID: <code>{resultCid}</code></p>
            <Link href={`/cid/${resultCid}`}>
              View uploaded file →
            </Link>
          </div>
        )}

        {/* Error */}
        {uploadStatus === 'error' && (
          <div className="upload-error">
            <p><strong>Upload Failed</strong></p>
            <p>{errorMessage}</p>
            <button
              className="upload-retry-button"
              onClick={() => setUploadStatus('idle')}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </main>
  )
}