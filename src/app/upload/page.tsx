'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  startUploadSession,
  completeUpload,
  uploadChunk,
} from '@/lib/upload-client';

type QueuedFile = {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'ready' | 'uploading' | 'complete' | 'error';
  progress: number;
  error?: string;
  uploadId?: string;
  cid?: string;
  visibility: 'public' | 'unindexed' | 'private';
};

export default function UploadPage() {
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [defaultVisibility, setDefaultVisibility] = useState<
    'public' | 'unindexed' | 'private'
  >('public');

  const updateDefaultVisibility = (
    visibility: 'public' | 'unindexed' | 'private'
  ) => {
    setDefaultVisibility(visibility);
    // Update visibility for all existing files that aren't already uploaded
    setQueuedFiles((prev) =>
      prev.map((file) =>
        file.status === 'ready' || file.status === 'error'
          ? { ...file, visibility }
          : file
      )
    );
  };

  const addFiles = (files: File[]) => {
    const newFiles: QueuedFile[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'ready',
      progress: 0,
      visibility: defaultVisibility,
    }));
    setQueuedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setQueuedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const convertVisibilityToTags = (
    visibility: 'public' | 'unindexed' | 'private'
  ): { namespace: string; descriptor: string }[] => {
    if (visibility === 'public') {
      // public files have no visibility tags
      return [];
    }
    return [{ namespace: 'visibility', descriptor: visibility }];
  };

  const updateFileStatus = (
    id: string,
    status: QueuedFile['status'],
    progress: number = 0,
    error?: string,
    cid?: string
  ) => {
    setQueuedFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status, progress, error, cid } : f
      )
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) addFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const uploadFile = async (queuedFile: QueuedFile) => {
    try {
      updateFileStatus(queuedFile.id, 'uploading', 0);

      // 1. Start upload session
      const CHUNK_SIZE = 1024 * 1024; // 1MB
      const session = await startUploadSession(
        queuedFile.file.size,
        queuedFile.file.type,
        CHUNK_SIZE
      );

      // 2. Upload chunks using server-controlled indexing
      let chunkIndex = 0;
      let bytesUploaded = 0;

      while (bytesUploaded < queuedFile.file.size) {
        const start = bytesUploaded;
        const end = Math.min(start + session.chunk_size, queuedFile.file.size);

        const chunk = queuedFile.file.slice(start, end);
        const arrayBuffer = await chunk.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Convert to base64 without spreading (avoids stack overflow)
        let binaryString = '';
        for (let i = 0; i < uint8Array.length; i++) {
          binaryString += String.fromCharCode(uint8Array[i]);
        }
        const base64Data = btoa(binaryString);

        // upload chunk
        const chunkResult = await uploadChunk(
          session.upload_id,
          chunkIndex,
          base64Data
        );

        // Check for upload error
        if (chunkResult.status === 2) {
          // UPLOAD_ERROR = 2
          throw new Error(chunkResult.error_message || 'Upload failed');
        }

        // Use server-provided values for next iteration
        bytesUploaded = chunkResult.bytes_received;
        chunkIndex = chunkResult.next_chunk_index;

        const progress = Math.round(
          (bytesUploaded / queuedFile.file.size) * 100
        );
        updateFileStatus(queuedFile.id, 'uploading', progress);

        // Check if upload is complete
        if (chunkResult.status === 1) {
          // UPLOAD_COMPLETE = 1
          // When status is COMPLETE, we should call completeUpload to get the final CID
          const tags = convertVisibilityToTags(queuedFile.visibility);
          const result = await completeUpload(session.upload_id, tags);
          updateFileStatus(
            queuedFile.id,
            'complete',
            100,
            undefined,
            result.cid
          );
          return; // Exit the function here
        }
      }

      // 3. Complete upload (this should only run if we exit the loop without UPLOAD_COMPLETE)
      const tags = convertVisibilityToTags(queuedFile.visibility);
      const result = await completeUpload(session.upload_id, tags);
      updateFileStatus(queuedFile.id, 'complete', 100, undefined, result.cid);
    } catch (error) {
      console.error('Upload error:', error);
      updateFileStatus(
        queuedFile.id,
        'error',
        0,
        error instanceof Error ? error.message : 'Upload failed'
      );
    }
  };

  const uploadAllFiles = async () => {
    setIsUploading(true);
    const filesToUpload = queuedFiles.filter(
      (f) => f.status === 'ready' || f.status === 'error'
    );

    for (const file of filesToUpload) {
      await uploadFile(file);
    }

    setIsUploading(false);
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const clearFinished = () => {
    setQueuedFiles((prev) => prev.filter((f) => f.status !== 'complete'));
  };

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
          onClick={() => {
            if (typeof document !== 'undefined') {
              document.getElementById('file-input')?.click();
            }
          }}
        >
          <p>
            {queuedFiles.length > 0
              ? `${queuedFiles.length} file(s) selected`
              : 'Drag & drop files here, or click to select'}
          </p>
          <input
            id="file-input"
            type="file"
            className="upload-file-input"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length > 0) addFiles(files);
            }}
          />
        </div>

        {/* Upload Queue */}
        {queuedFiles.length > 0 && (
          <div className="upload-queue">
            <h3>Upload Queue</h3>
            <ul className="slash-flat-list">
              <li>
                <button
                  className="simple-button"
                  onClick={() => {
                    if (typeof document !== 'undefined') {
                      document.getElementById('file-input')?.click();
                    }
                  }}
                  disabled={isUploading}
                >
                  add more files
                </button>
              </li>
              <li>
                <button
                  className="simple-button"
                  onClick={clearFinished}
                  disabled={!queuedFiles.find((f) => f.status === 'complete')}
                >
                  clear finished (
                  {queuedFiles.filter((f) => f.status === 'complete').length})
                </button>
              </li>
              <li>
                <button
                  className="simple-button"
                  onClick={uploadAllFiles}
                  disabled={
                    isUploading ||
                    queuedFiles.every((f) => f.status === 'complete')
                  }
                >
                  {isUploading
                    ? 'uploading...'
                    : `upload all (${queuedFiles.filter((f) => f.status === 'ready' || f.status === 'error').length})`}
                </button>
              </li>
            </ul>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1ch',
              }}
            >
              <span>Default visibility:</span>
              <ul className="slash-flat-list">
                <li>
                  <a
                    onClick={() => updateDefaultVisibility('public')}
                    style={{
                      cursor: 'pointer',
                      opacity: defaultVisibility === 'public' ? 1 : 0.5,
                    }}
                  >
                    Public
                  </a>
                </li>
                <li>
                  <a
                    onClick={() => updateDefaultVisibility('unindexed')}
                    style={{
                      cursor: 'pointer',
                      opacity: defaultVisibility === 'unindexed' ? 1 : 0.5,
                    }}
                  >
                    Unindexed
                  </a>
                </li>
                <li>
                  <a
                    onClick={() => updateDefaultVisibility('private')}
                    style={{
                      cursor: 'pointer',
                      opacity: defaultVisibility === 'private' ? 1 : 0.5,
                    }}
                  >
                    Private
                  </a>
                </li>
              </ul>
            </div>

            {/* Progress Summary */}
            <div className="upload-progress">
              [
              {Array(
                Math.floor(
                  (queuedFiles.filter((f) => f.status === 'complete').length /
                    queuedFiles.length) *
                    20
                )
              )
                .fill('█')
                .join('')}
              {Array(
                20 -
                  Math.floor(
                    (queuedFiles.filter((f) => f.status === 'complete').length /
                      queuedFiles.length) *
                      20
                  )
              )
                .fill('░')
                .join('')}
              ] {queuedFiles.filter((f) => f.status === 'complete').length}/
              {queuedFiles.length} files complete
            </div>

            {queuedFiles.map((queuedFile) => (
              <div key={queuedFile.id} className="upload-queue-item">
                <div className="file-name">
                  <button
                    onClick={() => removeFile(queuedFile.id)}
                    disabled={queuedFile.status === 'uploading'}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                      padding: '0.2ch 0.5ch',
                      marginRight: '0.5ch',
                    }}
                    title="Remove tag"
                  >
                    ×
                  </button>
                  {queuedFile.name}
                </div>
                <div className="file-info flat-list">
                  <dl>
                    <dt>Size</dt>&nbsp;
                    <dd>{formatFileSize(queuedFile.size)}</dd>
                    <br />
                    <dt>Mimetype</dt>&nbsp;<dd>{queuedFile.type}</dd>
                    <br />
                    <dt>Status</dt>&nbsp;
                    <dd>
                      {queuedFile.status === 'ready' && 'Ready'}
                      {queuedFile.status === 'uploading' &&
                        `Uploading... ${queuedFile.progress}%`}
                      {queuedFile.status === 'complete' && 'Complete'}
                      {queuedFile.status === 'error' &&
                        ` Error: ${queuedFile.error}`}
                    </dd>
                    <br />
                    <dt>Visibility</dt>&nbsp;
                    <dd>{queuedFile.visibility}</dd>
                  </dl>
                </div>
                {queuedFile.status === 'uploading' && (
                  <div className="upload-progress">
                    [
                    {Array(Math.floor(queuedFile.progress / 5))
                      .fill('█')
                      .join('')}
                    {Array(20 - Math.floor(queuedFile.progress / 5))
                      .fill('░')
                      .join('')}
                    ] {queuedFile.progress}%
                  </div>
                )}
                {queuedFile.status === 'complete' && queuedFile.cid && (
                  <div className="file-info flat-list">
                    <dl>
                      <dt>? CID</dt>&nbsp;
                      <dd>
                        <Link href={`/cid/${queuedFile.cid}`}>
                          {queuedFile.cid}&nbsp;→
                        </Link>
                      </dd>
                    </dl>
                  </div>
                )}
                <div className="upload-queue-actions"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
