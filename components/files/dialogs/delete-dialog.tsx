'use client';

import type { File } from '@/lib/types';
import { BaseDialog } from './base-dialog';

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  onDelete: (file: File) => void | Promise<void>;
}

export const DeleteDialog = ({
  open,
  onOpenChange,
  file,
  onDelete,
}: DeleteDialogProps) => {
  const handleConfirm = async () => {
    if (file) {
      await onDelete(file);
    }
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      file={file}
      title={`Delete ${file?.type === 'folder' ? 'Folder' : 'File'}`}
      description={`Are you sure you want to delete "${file?.name}"? This action cannot be undone.`}
      confirmLabel="Delete"
      variant="destructive"
      onConfirm={handleConfirm}
    />
  );
};

