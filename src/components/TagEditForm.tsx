'use client';

import React, { useState, useEffect } from 'react';
import { getSuggestedTags, tagCid } from '@/lib/hooya-api-client';
import {
  Autocomplete,
  TextField,
  Chip,
  Button,
  Box,
  Typography,
} from '@mui/material';

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
  const [suggestions, setSuggestions] = useState<>([]);
  const [saving, setSaving] = useState(false);

  // organize tags by namespace (reusing TagBlock logic)
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
      // build context query: existing tags + current input
      const existingTagStrings = tags.map(
        (t) => `${t.namespace}:${t.descriptor}`
      );
      const queryString =
        existingTagStrings.length > 0
          ? `${existingTagStrings.join(',')},${newTagInput}`
          : newTagInput;

      getSuggestedTags(queryString)
        .then(setSuggestions)
        .catch(() => setSuggestions([]));
    } else {
      setSuggestions([]);
    }
  }, [newTagInput, tags]);

  const handleAddTag = (tagString: string) => {
    if (!tagString.trim()) return;

    let namespace = '';
    let descriptor = tagString.trim();

    // parse namespace:descriptor format
    if (tagString.includes(':')) {
      const [ns, desc] = tagString.split(':', 2);
      namespace = ns.trim();
      descriptor = desc.trim();
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
      await tagCid(cid, tags);
      onSave(tags);
    } catch (error) {
      console.error('Failed to save tags:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h6">Edit Tags</Typography>
        <Box>
          <Button onClick={onCancel} sx={{ mr: 1 }}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </Box>

      {/* existing tags organized by namespace */}
      {Array.from(organizedTags).map(([namespace, descriptors]) => (
        <Box key={`tag-namespace-${namespace}`} sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            {capitalizeNamespace(namespace)}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {descriptors.map((descriptor, index) => (
              <Chip
                key={`${namespace}-${descriptor}-${index}`}
                label={descriptor}
                onDelete={() => handleRemoveTag({ namespace, descriptor })}
                variant="outlined"
                className={`tag-namespace-${namespace}`}
              />
            ))}
          </Box>
        </Box>
      ))}

      {/* add new tag input */}
      <Box sx={{ mt: 2 }}>
        <Autocomplete
          freeSolo
          options={suggestions.map((s) => `${s.namespace}:${s.descriptor}`)}
          value={newTagInput}
          onInputChange={(event, value) => setNewTagInput(value)}
          onChange={(event, value) => {
            if (value) {
              handleAddTag(value);
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Add tag (namespace:descriptor)"
              variant="outlined"
              size="small"
              placeholder="e.g., artist:username or general:landscape"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddTag(newTagInput);
                }
              }}
            />
          )}
        />
        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
          Use namespace:descriptor format (e.g., &quot;artist:username&quot;) or
          just &quot;descriptor&quot; for general tags
        </Typography>
      </Box>
    </Box>
  );
}
