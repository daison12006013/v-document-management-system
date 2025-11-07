'use client';

import {
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  FileCode,
  Archive,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileIconProps {
  fileName: string;
  mimeType?: string;
  type: 'file' | 'folder';
  isOpen?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
};

export const FileIcon = ({
  fileName,
  mimeType,
  type,
  isOpen = false,
  className,
  size = 'md'
}: FileIconProps) => {
  const sizeClass = sizeClasses[size];

  // Folder icons
  if (type === 'folder') {
    return isOpen ? (
      <FolderOpen className={cn(sizeClass, 'text-blue-500', className)} />
    ) : (
      <Folder className={cn(sizeClass, 'text-blue-500', className)} />
    );
  }

  // File icons based on MIME type
  if (mimeType) {
    // Images
    if (mimeType.startsWith('image/')) {
      return <FileImage className={cn(sizeClass, 'text-green-500', className)} />;
    }

    // Videos
    if (mimeType.startsWith('video/')) {
      return <FileVideo className={cn(sizeClass, 'text-purple-500', className)} />;
    }

    // Audio
    if (mimeType.startsWith('audio/')) {
      return <FileAudio className={cn(sizeClass, 'text-pink-500', className)} />;
    }

    // Documents
    if (mimeType === 'application/pdf') {
      return <FileText className={cn(sizeClass, 'text-red-500', className)} />;
    }

    // Spreadsheets
    if (
      mimeType === 'application/vnd.ms-excel' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'text/csv'
    ) {
      return <FileSpreadsheet className={cn(sizeClass, 'text-green-600', className)} />;
    }

    // Word documents
    if (
      mimeType === 'application/msword' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return <FileText className={cn(sizeClass, 'text-blue-600', className)} />;
    }

    // PowerPoint
    if (
      mimeType === 'application/vnd.ms-powerpoint' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ) {
      return <FileText className={cn(sizeClass, 'text-orange-500', className)} />;
    }

    // Code files
    if (
      mimeType.startsWith('text/') ||
      mimeType === 'application/json' ||
      mimeType === 'application/xml' ||
      mimeType === 'application/javascript'
    ) {
      return <FileCode className={cn(sizeClass, 'text-yellow-600', className)} />;
    }

    // Archives
    if (
      mimeType === 'application/zip' ||
      mimeType === 'application/x-rar-compressed' ||
      mimeType === 'application/x-tar' ||
      mimeType === 'application/gzip'
    ) {
      return <Archive className={cn(sizeClass, 'text-gray-600', className)} />;
    }
  }

  // File extension fallback
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (extension) {
    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
      return <FileImage className={cn(sizeClass, 'text-green-500', className)} />;
    }

    // Videos
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension)) {
      return <FileVideo className={cn(sizeClass, 'text-purple-500', className)} />;
    }

    // Audio
    if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(extension)) {
      return <FileAudio className={cn(sizeClass, 'text-pink-500', className)} />;
    }

    // Documents
    if (['pdf'].includes(extension)) {
      return <FileText className={cn(sizeClass, 'text-red-500', className)} />;
    }

    // Spreadsheets
    if (['xls', 'xlsx', 'csv', 'ods'].includes(extension)) {
      return <FileSpreadsheet className={cn(sizeClass, 'text-green-600', className)} />;
    }

    // Word documents
    if (['doc', 'docx', 'odt', 'rtf'].includes(extension)) {
      return <FileText className={cn(sizeClass, 'text-blue-600', className)} />;
    }

    // PowerPoint
    if (['ppt', 'pptx', 'odp'].includes(extension)) {
      return <FileText className={cn(sizeClass, 'text-orange-500', className)} />;
    }

    // Code files
    if ([
      'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'sass', 'less',
      'json', 'xml', 'yaml', 'yml', 'md', 'txt', 'py', 'java', 'c',
      'cpp', 'h', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'dart',
      'sql', 'sh', 'bat', 'ps1', 'dockerfile'
    ].includes(extension)) {
      return <FileCode className={cn(sizeClass, 'text-yellow-600', className)} />;
    }

    // Archives
    if (['zip', 'rar', 'tar', 'gz', '7z', 'bz2', 'xz'].includes(extension)) {
      return <Archive className={cn(sizeClass, 'text-gray-600', className)} />;
    }
  }

  // Default file icon
  return <File className={cn(sizeClass, 'text-gray-500', className)} />;
};
