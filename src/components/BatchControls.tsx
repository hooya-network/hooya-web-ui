'use client';

import React, { useState } from 'react';
import { tagCid, untagCid, forgetFile } from '@/lib/hooya-api-client';
import { SelectedFile } from '@/hooks/useFileSelection';
import TagBlock from '@/components/TagBlock';

interface Tag {
  namespace: string;
  descriptor: string;
}

interface BatchControlsProps {
  selectedFiles: SelectedFile[];
  selectedCount: number;
  sharedTags: Tag[];
  sharedVisibility: 'public' | 'unindexed' | 'private' | null;
  onClearSelection: () => void;
  onTagSave: (updatedFiles: SelectedFile[]) => void;
  onVisibilityChange: (updatedFiles: SelectedFile[]) => void;
  onFilesDeleted: (deletedCids: string[]) => void;
}

export default function BatchControls({
  selectedFiles,
  selectedCount,
  sharedTags,
  sharedVisibility,
  onClearSelection,
  onTagSave,
  onVisibilityChange,
  onFilesDeleted,
}: BatchControlsProps) {
  const [editMode, setEditMode] = useState(false);
  const [tags, setTags] = useState<Tag[]>(sharedTags);
  const [newTagInput, setNewTagInput] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [visibilityLoading, setVisibilityLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // update tags when shared tags change
  React.useEffect(() => {
    setTags(sharedTags);
  }, [sharedTags]);

  const organizeTags = (tagList: Tag[]) => {
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

  const handleAddTag = (tagString: string) => {
    if (!tagString.trim()) return;

    let namespace = '';
    let descriptor = tagString.trim();

    if (tagString.includes(':')) {
      const [ns, desc] = tagString.split(':', 2);
      namespace = ns.trim();
      descriptor = desc.trim();
    } else {
      namespace = 'general';
    }

    if (!descriptor) return;

    const newTag = { namespace, descriptor };
    if (
      tags.some((t) => t.namespace === namespace && t.descriptor === descriptor)
    ) {
      return;
    }

    setTags([...tags, newTag]);
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: Tag) => {
    setTags(
      tags.filter(
        (t) =>
          !(
            t.namespace === tagToRemove.namespace &&
            t.descriptor === tagToRemove.descriptor
          )
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedFiles: SelectedFile[] = [];

      for (const file of selectedFiles) {
        const fileTagSet = new Set(
          file.tags.map((t) => `${t.namespace}:${t.descriptor}`)
        );
        const newTagSet = new Set(
          tags.map((t) => `${t.namespace}:${t.descriptor}`)
        );

        const addedTags = tags.filter(
          (t) => !fileTagSet.has(`${t.namespace}:${t.descriptor}`)
        );

        const removedTags = file.tags.filter(
          (t) => !newTagSet.has(`${t.namespace}:${t.descriptor}`)
        );

        if (addedTags.length > 0) {
          await tagCid(file.cid, addedTags);
        }
        if (removedTags.length > 0) {
          await untagCid(file.cid, removedTags);
        }

        updatedFiles.push({
          ...file,
          tags: tags,
        });
      }

      onTagSave(updatedFiles);
      setEditMode(false);
    } catch (error) {
      console.error('failed to save batch tags:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleVisibilityChange = async (
    newVisibility: 'public' | 'unindexed' | 'private'
  ) => {
    if (sharedVisibility === newVisibility) return;

    setVisibilityLoading(true);
    try {
      const updatedFiles: SelectedFile[] = [];

      for (const file of selectedFiles) {
        const visibilityTags = file.tags.filter(
          (tag) => tag.namespace === 'visibility'
        );
        if (visibilityTags.length > 0) {
          await untagCid(file.cid, visibilityTags);
        }

        let newTags = file.tags.filter((tag) => tag.namespace !== 'visibility');

        if (newVisibility !== 'public') {
          const newTag = { namespace: 'visibility', descriptor: newVisibility };
          await tagCid(file.cid, [newTag]);
          newTags = [...newTags, newTag];
        }

        updatedFiles.push({
          ...file,
          tags: newTags,
        });
      }

      onVisibilityChange(updatedFiles);
    } catch (error) {
      console.error('failed to update visibility:', error);
    } finally {
      setVisibilityLoading(false);
    }
  };

  const handleDeleteFiles = async () => {
    if (typeof window === 'undefined') return;

    const confirmMessage = `Are you sure you want to forget ${selectedCount} file${selectedCount !== 1 ? 's' : ''}? This action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setDeleteLoading(true);
    try {
      const deletedCids: string[] = [];

      for (const file of selectedFiles) {
        await forgetFile(file.cid);
        deletedCids.push(file.cid);
      }

      onFilesDeleted(deletedCids);
    } catch (error) {
      console.error('failed to delete files:', error);
      alert('failed to delete some files. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const organizedTags = organizeTags(tags);

  return (
    <div className="batch-controls">
      {/* Top: Selection info and edit tags link */}
      <div className="batch-controls-header">
        <div>
          <strong>
            {selectedCount} file{selectedCount !== 1 ? 's' : ''} selected
          </strong>
          {selectedCount > 0 && (
            <a
              onClick={onClearSelection}
              style={{
                marginLeft: '1ch',
                cursor: 'pointer',
                color: '#666',
              }}
            >
              (clear selection)
            </a>
          )}
        </div>
        {selectedCount > 0 && !editMode && (
          <a onClick={() => setEditMode(true)} style={{ cursor: 'pointer' }}>
            edit tags
          </a>
        )}
        {editMode && (
          <div>
            <a
              onClick={() => setEditMode(false)}
              style={{ cursor: 'pointer', marginRight: '1ch' }}
            >
              cancel
            </a>
            <a onClick={handleSave} style={{ cursor: 'pointer' }}>
              {saving ? 'saving...' : 'save'}
            </a>
          </div>
        )}
      </div>

      {/* Tags display - always show shared tags */}
      {selectedCount > 0 && (
        <div style={{ marginBottom: '1ch' }}>
          {tags.length > 0 ? (
            <div className="tag-block">
              {Array.from(organizedTags).map(([namespace, descriptors]) => (
                <div key={`tag-namespace-${namespace}`}>
                  <h3>{capitalizeNamespace(namespace)}</h3>
                  <div className={`tag-namespace-${namespace}`}>
                    {descriptors.map((descriptor, index) => (
                      <span
                        key={`${namespace}-${descriptor}-${index}`}
                        className="tag-descriptor"
                      >
                        {editMode && (
                          <button
                            onClick={() =>
                              handleRemoveTag({ namespace, descriptor })
                            }
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'inherit',
                              cursor: 'pointer',
                              padding: '0.2ch 0.5ch',
                              marginRight: '0.5ch',
                            }}
                            title="Remove tag from all selected files"
                          >
                            ×
                          </button>
                        )}
                        {descriptor}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666', fontStyle: 'italic', margin: 0 }}>
              No shared tags
            </p>
          )}

          {/* Add tag input - only in edit mode */}
          {editMode && (
            <div style={{ marginTop: '1ch', position: 'relative' }}>
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTag(newTagInput);
                  }
                }}
                placeholder="Add tag to all selected files (namespace:descriptor)"
                style={{
                  width: '100%',
                  padding: '0.5ch',
                  fontSize: '1rem',
                  border: '1px solid',
                  boxSizing: 'border-box',
                }}
              />
              <p
                style={{
                  margin: '0.5ch 0 0 0',
                  fontSize: '0.9rem',
                  color: '#666',
                }}
              >
                Use namespace:descriptor format or just descriptor for general
                tags
              </p>
            </div>
          )}
        </div>
      )}

      {/* Bottom: Visibility controls */}
      {selectedCount > 0 && (
        <div className="batch-controls-actions">
          <ul className="slash-flat-list">
            <li>
              <a
                onClick={() => handleVisibilityChange('public')}
                style={{
                  cursor: visibilityLoading ? 'not-allowed' : 'pointer',
                  opacity: visibilityLoading
                    ? 0.5
                    : sharedVisibility === 'public'
                      ? 1
                      : 0.5,
                }}
              >
                Public
              </a>
            </li>
            <li>
              <a
                onClick={() => handleVisibilityChange('unindexed')}
                style={{
                  cursor: visibilityLoading ? 'not-allowed' : 'pointer',
                  opacity: visibilityLoading
                    ? 0.5
                    : sharedVisibility === 'unindexed'
                      ? 1
                      : 0.5,
                }}
              >
                Unindexed
              </a>
            </li>
            <li>
              <a
                onClick={() => handleVisibilityChange('private')}
                style={{
                  cursor: visibilityLoading ? 'not-allowed' : 'pointer',
                  opacity: visibilityLoading
                    ? 0.5
                    : sharedVisibility === 'private'
                      ? 1
                      : 0.5,
                }}
              >
                Private
              </a>
            </li>
            <li>
              <a
                onClick={handleDeleteFiles}
                style={{
                  cursor:
                    deleteLoading || visibilityLoading
                      ? 'not-allowed'
                      : 'pointer',
                  color: '#d32f2f',
                }}
              >
                {deleteLoading ? 'Deleting...' : 'Forget Files'}
              </a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
