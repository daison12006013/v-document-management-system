'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { File } from '@/lib/types';
import { BaseDialog } from './base-dialog';

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  onRename: (file: File, newName: string) => void | Promise<void>;
}

export const RenameDialog = ({
  open,
  onOpenChange,
  file,
  onRename,
}: RenameDialogProps) => {
  const [newName, setNewName] = useState('');

  // Reset name when dialog opens/closes or file changes
  useEffect(() => {
    if (open && file) {
      setNewName(file.name);
    } else {
      setNewName('');
    }
  }, [open, file]);

  const handleSubmit = async () => {
    if (file && newName.trim() && newName.trim() !== file.name) {
      await onRename(file, newName.trim());
    }
  };

  const isValid = newName.trim() && newName.trim() !== file?.name;

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      file={file}
      title={`Rename ${file?.type || 'item'}`}
      confirmLabel="Rename"
      variant="default"
      onConfirm={handleSubmit}
      disabled={!isValid}
    >
      <div>
        <Label htmlFor="rename-name">Name</Label>
        <Input
          id="rename-name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isValid) {
              handleSubmit();
            } else if (e.key === 'Escape') {
              onOpenChange(false);
            }
          }}
          autoFocus
        />
      </div>
    </BaseDialog>
  );
};

