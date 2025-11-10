'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { File } from '@/lib/types';

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
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Delete {file?.type === 'folder' ? 'Folder' : 'File'}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{file?.name}"? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

