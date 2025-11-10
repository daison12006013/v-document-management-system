'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { File } from '@/lib/types';

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
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const isValid = newName.trim() && newName.trim() !== file?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename {file?.type || 'item'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
                  handleCancel();
                }
              }}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

