'use client';

import { useState, useCallback } from 'react';
import type { File } from '@/lib/types';

interface UseFileOperationsOptions {
  onRename?: (file: File, newName: string) => void | Promise<void>;
  onDelete?: (file: File) => void | Promise<void>;
}

export const useFileOperations = (options: UseFileOperationsOptions = {}) => {
  const { onRename, onDelete } = options;

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleRenameClick = useCallback(
    (file: File) => {
      setSelectedFile(file);
      setRenameDialogOpen(true);
    },
    []
  );

  const handleDeleteClick = useCallback(
    (file: File) => {
      setSelectedFile(file);
      setDeleteDialogOpen(true);
    },
    []
  );

  const handleRename = useCallback(
    async (file: File, newName: string) => {
      if (onRename) {
        await onRename(file, newName);
      }
      setRenameDialogOpen(false);
      setSelectedFile(null);
    },
    [onRename]
  );

  const handleDelete = useCallback(
    async (file: File) => {
      if (onDelete) {
        await onDelete(file);
      }
      setDeleteDialogOpen(false);
      setSelectedFile(null);
    },
    [onDelete]
  );

  const handleRenameDialogClose = useCallback((open: boolean) => {
    setRenameDialogOpen(open);
    if (!open) {
      setSelectedFile(null);
    }
  }, []);

  const handleDeleteDialogClose = useCallback((open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) {
      setSelectedFile(null);
    }
  }, []);

  return {
    // Rename dialog state
    renameDialogOpen,
    setRenameDialogOpen: handleRenameDialogClose,
    handleRenameClick,
    handleRename,
    // Delete dialog state
    deleteDialogOpen,
    setDeleteDialogOpen: handleDeleteDialogClose,
    handleDeleteClick,
    handleDelete,
    // Selected file
    selectedFile,
    setSelectedFile,
  };
};

