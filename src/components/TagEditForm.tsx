'use client';

import React, { useState, useEffect } from 'react';
import { getSuggestedTags, tagCid, untagCid } from '@/lib/hooya-api-client';

interface Tag {
  namespace: string;
  descriptor: string;
}

interface TagEditFormProps {
  cid: string;
  initialTags: Tag[];
  onSave: (tags: Tag[]) => void;
  onCancel: () => void;
}

export default function TagEditForm({
  cid,
  initialTags,
  onSave,
  onCancel,
}: TagEditFormProps) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [newTagInput, setNewTagInput] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // organize tags by namespace
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

  const organizedTags = organizeTags(tags);

  // fetch suggestions when input changes
  useEffect(() => {
    if (newTagInput.trim()) {
      getSuggestedTags(newTagInput)
        .then((suggestions) => {
          // Parse the returned strings into objects
          const parsedSuggestions = suggestions.map((suggestion: string) => {
            if (suggestion.includes(':')) {
              const [namespace, descriptor] = suggestion.split(':', 2);
              return { namespace, descriptor };
            } else {
              return { namespace: 'general', descriptor: suggestion };
            }
          });
          setSuggestions(parsedSuggestions);
        })
        .catch(() => setSuggestions([]));
    } else {
      setSuggestions([]);
    }
  }, [newTagInput]);

  const handleAddTag = (tagString: string) => {
    if (!tagString.trim()) return;

    let namespace = '';
    let descriptor = tagString.trim();

    // parse namespace:descriptor format
    if (tagString.includes(':')) {
      const [ns, desc] = tagString.split(':', 2);
      namespace = ns.trim();
      descriptor = desc.trim();
    } else {
      namespace = 'general';
    }

    if (!descriptor) return;

    const newTag = { namespace, descriptor };

    // check for duplicates
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
      // Calculate added and removed tags
      const initialTagSet = new Set(
        initialTags.map((t) => `${t.namespace}:${t.descriptor}`)
      );
      const currentTagSet = new Set(
        tags.map((t) => `${t.namespace}:${t.descriptor}`)
      );

      const addedTags = tags.filter(
        (t) => !initialTagSet.has(`${t.namespace}:${t.descriptor}`)
      );
      const removedTags = initialTags.filter(
        (t) => !currentTagSet.has(`${t.namespace}:${t.descriptor}`)
      );

      if (addedTags.length > 0) {
        await tagCid(cid, addedTags);
      }
      if (removedTags.length > 0) {
        await untagCid(cid, removedTags);
      }

      onSave(tags);
    } catch (error) {
      console.error('failed to save tags:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ border: '1px solid', padding: '1ch', margin: '1ch 0' }}>
      {/* Header with title and action buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1ch',
        }}
      >
        <h3 style={{ margin: 0 }}>Edit Tags</h3>
        <div>
          <button onClick={onCancel} style={{ marginRight: '1ch' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Existing tags organized by namespace using tag-block styling */}
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
                  <button
                    onClick={() => handleRemoveTag({ namespace, descriptor })}
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
                  {descriptor}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add new tag input */}
      <div style={{ marginTop: '1ch', position: 'relative' }}>
        <input
          type="text"
          value={newTagInput}
          onChange={(e) => setNewTagInput(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddTag(newTagInput);
            }
          }}
          placeholder="Add tag (namespace:descriptor or just descriptor)"
          style={{
            width: '100%',
            padding: '0.5ch',
            fontSize: '1rem',
            border: '1px solid',
            boxSizing: 'border-box',
          }}
        />

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              border: '1px solid',
              borderTop: 'none',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 1000,
            }}
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() =>
                  handleAddTag(
                    `${suggestion.namespace}:${suggestion.descriptor}`
                  )
                }
                style={{
                  padding: '0.5ch',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = '#f0f0f0')
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = 'white')
                }
              >
                {suggestion.namespace}:{suggestion.descriptor}
              </div>
            ))}
          </div>
        )}

        <p style={{ margin: '0.5ch 0 0 0', fontSize: '0.9rem', color: '#666' }}>
          Use namespace:descriptor format (e.g., &quot;artist:username&quot;) or
          just &quot;descriptor&quot; for general tags
        </p>
      </div>
    </div>
  );
}
