'use client';

import { useState } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Download,
  Edit,
  Trash2,
  Copy,
  Scissors,
  Share,
  Eye,
  FolderOpen,
  Info,
} from 'lucide-react';
import { File } from '@/lib/types';

interface FileContextMenuProps {
  file: File;
  children: React.ReactNode;
  onView?: (file: File) => void;
  onDownload?: (file: File) => void;
  onRename?: (file: File) => void;
  onDelete?: (file: File) => void;
  onShare?: (file: File) => void;
  onCopy?: (file: File) => void;
  onCut?: (file: File) => void;
  onOpenFolder?: (file: File) => void;
  onProperties?: (file: File) => void;
  disabled?: boolean;
}

export function FileContextMenu({
  file,
  children,
  onView,
  onDownload,
  onRename,
  onDelete,
  onShare,
  onCopy,
  onCut,
  onOpenFolder,
  onProperties,
  disabled = false,
}: FileContextMenuProps) {
  if (disabled) {
    return <>{children}</>;
  }

  const isFile = file.type === 'file';
  const isFolder = file.type === 'folder';

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {/* View/Open */}
        {isFile && onView && (
          <ContextMenuItem onClick={() => onView(file)}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </ContextMenuItem>
        )}

        {isFolder && onOpenFolder && (
          <ContextMenuItem onClick={() => onOpenFolder(file)}>
            <FolderOpen className="mr-2 h-4 w-4" />
            Open
          </ContextMenuItem>
        )}

        {/* Download (files only) */}
        {isFile && onDownload && (
          <ContextMenuItem onClick={() => onDownload(file)}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        {/* Edit operations */}
        {onRename && (
          <ContextMenuItem onClick={() => onRename(file)}>
            <Edit className="mr-2 h-4 w-4" />
            Rename
          </ContextMenuItem>
        )}

        {onCopy && (
          <ContextMenuItem onClick={() => onCopy(file)}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </ContextMenuItem>
        )}

        {onCut && (
          <ContextMenuItem onClick={() => onCut(file)}>
            <Scissors className="mr-2 h-4 w-4" />
            Cut
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        {/* Share */}
        {onShare && (
          <ContextMenuItem onClick={() => onShare(file)}>
            <Share className="mr-2 h-4 w-4" />
            Share
          </ContextMenuItem>
        )}

        {/* Properties */}
        {onProperties && (
          <ContextMenuItem onClick={() => onProperties(file)}>
            <Info className="mr-2 h-4 w-4" />
            Properties
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        {/* Delete */}
        {onDelete && (
          <ContextMenuItem
            onClick={() => onDelete(file)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
