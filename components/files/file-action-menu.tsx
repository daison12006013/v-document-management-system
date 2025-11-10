'use client';

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  Edit,
  Trash2,
  Eye,
  Share,
  Share2,
} from 'lucide-react';
import { File } from '@/lib/types';

interface FileActionMenuProps {
  file: File;
  onView?: (file: File) => void;
  onDownload?: (file: File) => void;
  onRename?: (file: File) => void;
  onShare?: (file: File) => void;
  onDelete?: (file: File) => void;
  canDownload?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  iconClassName?: string;
  align?: 'start' | 'end';
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Reusable file action dropdown menu content
 * Used across FileCard, FileTable, and other components
 */
export const FileActionMenu = ({
  file,
  onView,
  onDownload,
  onRename,
  onShare,
  onDelete,
  canDownload = true,
  canUpdate = true,
  canDelete = true,
  iconClassName = 'h-4 w-4 mr-2',
  align = 'end',
  onClick,
}: FileActionMenuProps) => {
  const isFile = file.type === 'file';
  const isFolder = file.type === 'folder';
  const ShareIcon = isFile ? Share : Share2;

  const handleClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.(e);
    action();
  };

  return (
    <DropdownMenuContent align={align} onClick={onClick || ((e) => e.stopPropagation())}>
      {isFile && onView && (
        <DropdownMenuItem onClick={() => onView(file)}>
          <Eye className={iconClassName} />
          Preview
        </DropdownMenuItem>
      )}

      {isFile && canDownload && onDownload && (
        <DropdownMenuItem onClick={() => onDownload(file)}>
          <Download className={iconClassName} />
          Download
        </DropdownMenuItem>
      )}

      {canUpdate && onRename && (
        <DropdownMenuItem onClick={(e) => handleClick(e, () => onRename!(file))}>
          <Edit className={iconClassName} />
          Rename
        </DropdownMenuItem>
      )}

      {onShare && (
        <DropdownMenuItem onClick={() => onShare(file)}>
          <ShareIcon className={iconClassName} />
          Share
        </DropdownMenuItem>
      )}

      {canDelete && onDelete && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => handleClick(e, () => onDelete!(file))}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className={iconClassName} />
            Delete
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  );
};

