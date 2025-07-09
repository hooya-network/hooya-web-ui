'use client';

import React, { useEffect, useState } from 'react';
import TagBlock from '@/components/TagBlock';
import TagEditForm from '@/components/TagEditForm';
import FileImage from '@/components/FileImage';
import {
  buildCidContentUrl,
  getCidInfo,
  getCidTags,
  forgetFile,
  tagCid,
  untagCid,
} from '@/lib/hooya-api-client';
import { FileType } from '@/types';
import Link from 'next/link';

interface ClientCidPageProps {
  cid: string;
}

export default function ClientCidPage({ cid }: ClientCidPageProps) {
  const [cidInfo, setCidInfo] = useState<FileType | null>(null);
  const [tags, setTags] = useState<{ namespace: string; descriptor: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [visibilityLoading, setVisibilityLoading] = useState(false);

  // check authentication status
  useEffect(() => {
    const token = localStorage.getItem('jwt');
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      try {
        const [info, tagData] = await Promise.all([
          getCidInfo(cid),
          getCidTags(cid),
        ]);

        setCidInfo(info);
        setTags(tagData);
      } catch (error) {
        console.error('Failed to fetch CID data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [cid]);

  const handleDeleteFile = async () => {
    if (
      !window.confirm(
        'Are you sure you want to forget this file? This action cannot be undone.'
      )
    ) {
      return;
    }

    setDeleteLoading(true);
    try {
      await forgetFile(cid);
      // redirect to home page after successful deletion
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Failed to delete file. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const isPrivate = () => {
    return tags.some(
      (tag) => tag.namespace === 'visibility' && tag.descriptor === 'private'
    );
  };

  const handleVisibilityToggle = async () => {
    const visibilityTag = { namespace: 'visibility', descriptor: 'private' };

    if (isPrivate()) {
      // remove visibility:private
      await untagCid(cid, [visibilityTag]);
      setTags(
        tags.filter(
          (tag) =>
            !(tag.namespace === 'visibility' && tag.descriptor === 'private')
        )
      );
    } else {
      // visibility:private
      await tagCid(cid, [visibilityTag]);
      setTags([...tags, visibilityTag]);
    }
  };

  if (loading) {
    return (
      <main>
        <div>Loading…</div>
      </main>
    );
  }

  if (!cidInfo) {
    return (
      <main>
        <div>Failed to load file information</div>
      </main>
    );
  }

  const size = cidInfo.size;
  const mimetype = cidInfo.mimetype;
  const extFile = cidInfo.ext_file;

  // Use largest thumbnail here
  const thumbnails = cidInfo?.ext_file?.thumbnails || [];
  const thumbnail = thumbnails?.[1] || thumbnails?.[0];

  // More accomodating layout for images wider than a 4:3 ratio
  const fileOrientation = extFile
    ? extFile.aspect_ratio < 4 / 3
      ? 'portrait'
      : 'landscape'
    : thumbnail?.aspect_ratio < 4 / 3
      ? 'portrait'
      : 'landscape';

  const contentUrl = buildCidContentUrl(cid);

  const thumbnailElem = (
    <FileImage
      cid={cid}
      thumbnails={thumbnails || []}
      processingStatus={cidInfo.processing_status}
      contentUrl={contentUrl}
      className="cid-detail-thumbnail"
      size="medium"
      clickable={true}
    />
  );

  return (
    <main>
      <ul className="emdash-flat-list" id="download-file">
        <li key="original">
          <Link href={contentUrl}>
            Download File ({sizeToHumanReadable(size)})
          </Link>
        </li>
        <li key="mimetype">{mimetype}</li>
      </ul>
      <div
        id="cid-view"
        className={`orientation-${fileOrientation || 'landscape'}`}
      >
        <div>
          <h3>Preview</h3>
          {thumbnailElem}
        </div>
        <div>
          {(tags.length > 0 || isAuthenticated) && (
            <>
              {editMode ? (
                <TagEditForm
                  cid={cid}
                  initialTags={tags}
                  onSave={(newTags) => {
                    setTags(newTags);
                    setEditMode(false);
                  }}
                  onCancel={() => setEditMode(false)}
                />
              ) : (
                <div>
                  {tags.length > 0 && (
                    <>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span></span>
                        {isAuthenticated && (
                          <a
                            onClick={() => setEditMode(true)}
                            style={{ cursor: 'pointer' }}
                          >
                            edit tags
                          </a>
                        )}
                      </div>
                      <TagBlock tags={tags} />
                    </>
                  )}
                  {tags.length === 0 && isAuthenticated && (
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <h3>Tags</h3>
                        <a
                          onClick={() => setEditMode(true)}
                          style={{ cursor: 'pointer' }}
                        >
                          add tags
                        </a>
                      </div>
                      <p style={{ color: '#666', fontStyle: 'italic' }}>
                        No tags yet
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          <h3>File Info</h3>
          <dl className="file-info flat-list">
            {dlHintEntry('CID', cid)}
            {dlHintEntry('Mimetype', mimetype)}
            {extFile &&
              extFile.height &&
              extFile.width &&
              dlHintEntry(
                'Dimensions',
                `${extFile.height}x${extFile.width} ${extFile.height * extFile.width > 100000 ? `(${((extFile.height * extFile.width) / 1000000).toFixed(1)} MPixels)` : ''}`
              )}
            {dlHintEntry('Size', sizeToHumanReadable(size))}
          </dl>
          <h3>Net Info</h3>
          <dl className="file-info flat-list">
            {dlHintEntry('Uploader', '0xC262a…a048')}
            {dlHintEntry('Owner', '0xC262a…a048')}
            {/*dlHintEntry("Date", "6 hours ago")*/}
            {dlHintEntry('Favorites', '0')}
            {dlHintEntry('Duplication', '1 peer')}
            {dlHintEntry('Rating', 'Safe')}
          </dl>
          {isAuthenticated && (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h3>Manage</h3>
                <ul className="slash-flat-list">
                  <li>
                    <a
                      onClick={handleVisibilityToggle}
                      style={{
                        cursor: 'pointer',
                      }}
                    >
                      {isPrivate() ? 'Make public' : 'Make private'}
                    </a>
                  </li>
                  <li>
                    <button
                      onClick={handleDeleteFile}
                      disabled={deleteLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#d32f2f',
                        cursor: deleteLoading ? 'not-allowed' : 'pointer',
                        textDecoration: 'underline',
                        fontSize: 'inherit',
                        fontFamily: 'inherit',
                        padding: 0,
                      }}
                    >
                      {deleteLoading ? 'Deleting...' : 'Forget File'}
                    </button>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function dlHintEntry(key: string, value: string): React.ReactNode {
  return (
    <>
      <dt>?&nbsp;{key}</dt>&nbsp;
      <dd>{value}</dd>
      <br />
    </>
  );
}

function sizeToHumanReadable(n: number): string {
  if (n < 1024) return `${n} Bytes`;
  else if (n < 1048576) return `${(n / 1024).toFixed(2)} KiB`;
  else if (n < 1073741824) return `${(n / 1048576).toFixed(2)} MiB`;
  return `${(n / 1073741824).toFixed(2)} GiB`;
}
