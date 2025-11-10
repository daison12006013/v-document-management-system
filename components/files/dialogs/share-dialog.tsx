'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy, Check } from 'lucide-react';
import type { File } from '@/lib/types';
import { api } from '@/lib/api';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
}

type ExpirationOption = {
  label: string;
  value: number | null; // null means infinite
};

const EXPIRATION_OPTIONS: ExpirationOption[] = [
  { label: '1 hour', value: 3600 }, // 1 hour in seconds
  { label: '4 hours', value: 14400 }, // 4 hours in seconds
  { label: '8 hours', value: 28800 }, // 8 hours in seconds
  { label: '1 day', value: 86400 }, // 1 day in seconds
  { label: '1 week', value: 604800 }, // 1 week in seconds
  { label: 'Never expires', value: null },
];

export const ShareDialog = ({
  open,
  onOpenChange,
  file,
}: ShareDialogProps) => {
  const [expiration, setExpiration] = useState<number | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset state when dialog opens/closes or file changes
  useEffect(() => {
    if (open && file) {
      setExpiration(null);
      setShareUrl(null);
      setCopied(false);
    } else {
      setShareUrl(null);
      setCopied(false);
    }
  }, [open, file]);

  const handleCreateShare = async () => {
    if (!file) return;

    setIsCreating(true);
    try {
      const result = await api.files.createShareLink(file.id, {
        expiresInSeconds: expiration,
      });
      setShareUrl(result.shareUrl);
    } catch (error: any) {
      console.error('Failed to create share link:', error);
      alert(error.message || 'Failed to create share link');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share {file?.name || 'file'}</DialogTitle>
          <DialogDescription>
            Create a shareable link that anyone with the link can access.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {!shareUrl ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="expiration">Link expiration</Label>
                <Select
                  value={expiration === null ? 'never' : expiration.toString()}
                  onValueChange={(value) => {
                    if (value === 'never') {
                      setExpiration(null);
                    } else {
                      setExpiration(parseInt(value, 10));
                    }
                  }}
                >
                  <SelectTrigger id="expiration">
                    <SelectValue placeholder="Select expiration" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRATION_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value === null ? 'never' : option.value}
                        value={option.value === null ? 'never' : option.value.toString()}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="share-url">Share link</Label>
              <div className="flex gap-2">
                <Input
                  id="share-url"
                  value={shareUrl}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  title="Copy link"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Anyone with this link can access the {file?.type === 'folder' ? 'folder' : 'file'}.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          {!shareUrl ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleCreateShare} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create link'}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleCancel}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

