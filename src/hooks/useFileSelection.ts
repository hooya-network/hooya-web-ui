'use client';

import { useState, useCallback } from 'react';

export interface SelectedFile {
  cid: string;
  tags: { namespace: string; descriptor: string }[];
}

export function useFileSelection() {
  const [selectedFiles, setSelectedFiles] = useState<Map<string, SelectedFile>>(
    new Map()
  );

  const toggleFileSelection = useCallback((file: SelectedFile) => {
    setSelectedFiles((prev) => {
      const newSelection = new Map(prev);
      if (newSelection.has(file.cid)) {
        newSelection.delete(file.cid);
      } else {
        newSelection.set(file.cid, file);
      }
      return newSelection;
    });
  }, []);

  const selectFile = useCallback((file: SelectedFile) => {
    setSelectedFiles((prev) => {
      const newSelection = new Map(prev);
      newSelection.set(file.cid, file);
      return newSelection;
    });
  }, []);

  const deselectFile = useCallback((cid: string) => {
    setSelectedFiles((prev) => {
      const newSelection = new Map(prev);
      newSelection.delete(cid);
      return newSelection;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFiles(new Map());
  }, []);

  const isSelected = useCallback(
    (cid: string) => {
      return selectedFiles.has(cid);
    },
    [selectedFiles]
  );

  const getSelectedFiles = useCallback(() => {
    return Array.from(selectedFiles.values());
  }, [selectedFiles]);

  const getSelectedCids = useCallback(() => {
    return Array.from(selectedFiles.keys());
  }, [selectedFiles]);

  const getSharedTags = useCallback(() => {
    const files = Array.from(selectedFiles.values());
    if (files.length === 0) return [];

    if (files.length === 1) return files[0].tags;

    // find tags that are present in ALL selected files
    const firstFileTags = files[0].tags;
    return firstFileTags.filter((tag) =>
      files.every((file) =>
        file.tags.some(
          (t) =>
            t.namespace === tag.namespace && t.descriptor === tag.descriptor
        )
      )
    );
  }, [selectedFiles]);

  const getSharedVisibility = useCallback(() => {
    const files = Array.from(selectedFiles.values());
    if (files.length === 0) return null;

    const getFileVisibility = (
      tags: { namespace: string; descriptor: string }[]
    ) => {
      const hasPrivate = tags.some(
        (t) => t.namespace === 'visibility' && t.descriptor === 'private'
      );
      const hasUnindexed = tags.some(
        (t) => t.namespace === 'visibility' && t.descriptor === 'unindexed'
      );
      if (hasPrivate) return 'private';
      if (hasUnindexed) return 'unindexed';
      return 'public';
    };

    const firstVisibility = getFileVisibility(files[0].tags);
    const allSameVisibility = files.every(
      (file) => getFileVisibility(file.tags) === firstVisibility
    );

    return allSameVisibility ? firstVisibility : null;
  }, [selectedFiles]);

  const updateSelectedFilesTags = useCallback(
    (updatedFiles: SelectedFile[]) => {
      setSelectedFiles((prev) => {
        const newSelection = new Map(prev);
        updatedFiles.forEach((updatedFile) => {
          if (newSelection.has(updatedFile.cid)) {
            newSelection.set(updatedFile.cid, updatedFile);
          }
        });
        return newSelection;
      });
    },
    []
  );

  return {
    selectedFiles: Array.from(selectedFiles.values()),
    selectedCount: selectedFiles.size,
    toggleFileSelection,
    selectFile,
    deselectFile,
    clearSelection,
    isSelected,
    getSelectedFiles,
    getSelectedCids,
    getSharedTags,
    getSharedVisibility,
    updateSelectedFilesTags,
  };
}
