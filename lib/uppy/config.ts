/**
 * Uppy configuration for file uploads
 * Integrates with the Document Management System API
 */

import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import XHRUpload from '@uppy/xhr-upload';
import DropTarget from '@uppy/drop-target';
import Box from '@uppy/box';
import Dropbox from '@uppy/dropbox';
import GoogleDrive from '@uppy/google-drive';
import GooglePhotos from '@uppy/google-photos';
import OneDrive from '@uppy/onedrive';
import Unsplash from '@uppy/unsplash';
import Url from '@uppy/url';
import Webcam from '@uppy/webcam';
import { UppyFile } from '@uppy/core';

export interface UppyConfig {
  maxFileSize?: number; // in bytes
  allowedFileTypes?: string[] | null; // null means all types
  autoProceed?: boolean;
  allowMultiple?: boolean;
  parentId?: string | null;
  endpoint?: string;
  // Note: Dashboard options are not passed here when using @uppy/react/dashboard
  // The React component handles Dashboard plugin initialization
}

/**
 * Get upload limits from environment or defaults
 */
export function getUploadLimits() {
  const maxFileSize = process.env.MAX_FILE_SIZE
    ? parseInt(process.env.MAX_FILE_SIZE, 10)
    : 100 * 1024 * 1024; // 100MB default

  const maxFilesPerUpload = process.env.MAX_FILES_PER_UPLOAD
    ? parseInt(process.env.MAX_FILES_PER_UPLOAD, 10)
    : 10;

  const allowedFileTypes = process.env.ALLOWED_FILE_TYPES
    ? process.env.ALLOWED_FILE_TYPES === '*'
      ? null
      : process.env.ALLOWED_FILE_TYPES.split(',').map(t => t.trim())
    : null; // Allow all types by default

  return {
    maxFileSize,
    maxFilesPerUpload,
    allowedFileTypes,
  };
}

/**
 * Create a new Uppy instance with configuration
 */
export function createUppyInstance(config: UppyConfig = {}) {
  const limits = getUploadLimits();

  const uppy = new Uppy({
    restrictions: {
      maxFileSize: config.maxFileSize || limits.maxFileSize,
      allowedFileTypes: config.allowedFileTypes ?? limits.allowedFileTypes,
      maxNumberOfFiles: limits.maxFilesPerUpload,
    },
    autoProceed: config.autoProceed ?? false,
    allowMultipleUploadBatches: config.allowMultiple ?? true,
  });

  // Set parentId in meta if provided
  if (config.parentId !== undefined) {
    uppy.setOptions({
      meta: {
        parentId: config.parentId || null,
      },
    });
  }

  // Add XHR Upload plugin
  uppy.use(XHRUpload, {
    endpoint: config.endpoint || '/api/files',
    fieldName: 'file',
    formData: true,
    bundle: false,
    getResponseData(xhr: XMLHttpRequest) {
      // In Uppy v5, getResponseData is called for successful responses
      // It receives the XMLHttpRequest object directly
      // We should just parse and return the JSON without checking status
      // If getResponseData throws, Uppy treats it as a failure

      try {
        // Parse the JSON response from xhr.responseText
        const parsed = JSON.parse(xhr.responseText);
        // Return the parsed data - Uppy will use this as the upload result
        return parsed;
      } catch (parseError) {
        // If JSON parsing fails, log it but don't throw
        // This allows the upload to succeed even if response format is unexpected
        console.warn('Uppy getResponseData - JSON parse failed:', parseError, 'responseText:', xhr.responseText);
        // Return a success object to prevent Uppy from treating this as failure
        return { success: true, data: xhr.responseText };
      }
    },
  });

  // Add parentId to form data via upload event
  uppy.on('upload', () => {
    const files = uppy.getFiles();
    files.forEach((file: any) => {
      // Store parentId in file meta if not already set
      if (config.parentId !== undefined && !file.meta.parentId) {
        uppy.setFileMeta(file.id, {
          ...file.meta,
          parentId: config.parentId || null,
        });
      }
    });
  });

  // Intercept XHR to add parentId to form data
  uppy.on('upload', () => {
    const xhrUpload = uppy.getPlugin('XHRUpload');
    if (xhrUpload) {
      // Access the internal XHR and modify form data
      const originalCreateXHR = (xhrUpload as any).createXHR;
      if (originalCreateXHR) {
        (xhrUpload as any).createXHR = function(...args: any[]) {
          const xhr = originalCreateXHR.apply(this, args);
          const originalSend = xhr.send;
          xhr.send = function(data: any) {
            if (data instanceof FormData) {
              const files = uppy.getFiles();
              files.forEach((file: any) => {
                const parentId = file.meta.parentId ?? config.parentId;
                if (parentId !== undefined && parentId !== null) {
                  data.append('parentId', String(parentId));
                } else if (parentId === null) {
                  data.append('parentId', '');
                }
              });
            }
            return originalSend.apply(this, [data]);
          };
          return xhr;
        };
      }
    }
  });

  // Add Drop Target plugin for drag & drop
  if (typeof window !== 'undefined') {
    uppy.use(DropTarget, {
      target: document.body,
    });

    // Add file source providers (only on client side)
    // Note: Cloud providers (Box, Dropbox, Google Drive, etc.) require Companion server for OAuth
    // They will show up in the UI - users can authenticate when they click them
    // Set NEXT_PUBLIC_COMPANION_URL environment variable to your Companion server URL

    const companionUrl = process.env.NEXT_PUBLIC_COMPANION_URL;

    // Only enable cloud provider plugins if Companion URL is explicitly configured
    // This prevents network errors when Companion server is not running
    if (companionUrl) {
      // Box
      uppy.use(Box, {
        companionUrl,
      });

      // Dropbox
      uppy.use(Dropbox, {
        companionUrl,
      });

      // Google Drive
      uppy.use(GoogleDrive, {
        companionUrl,
      });

      // Google Photos
      uppy.use(GooglePhotos, {
        companionUrl,
      });

      // OneDrive
      uppy.use(OneDrive, {
        companionUrl,
      });

      // Unsplash
      uppy.use(Unsplash, {
        companionUrl,
      });

      // URL (Link) - Uses Companion for fetching remote files
      uppy.use(Url, {
        companionUrl,
      });
    }

    // Webcam (Camera) - No Companion needed, works standalone
    uppy.use(Webcam, {
      showVideoSourceDropdown: true,
    });

    // Note: Dashboard plugin is NOT added here when using @uppy/react/dashboard
    // The React component (@uppy/react/dashboard) automatically adds the Dashboard plugin
    // If using vanilla JS (not React), add it here with: uppy.use(Dashboard, {...})
  }

  return uppy;
}

/**
 * Configure Uppy Dashboard plugin
 * Note: This should only be called on the client side
 */
export function configureDashboard(uppy: Uppy, options: {
  inline?: boolean;
  target?: string | HTMLElement;
  width?: number;
  height?: number;
  showProgressDetails?: boolean;
  showRemoveButtonAfterComplete?: boolean;
  proudlyDisplayPoweredByUppy?: boolean;
  theme?: 'light' | 'dark' | 'auto';
} = {}) {
  // Only configure if we're on the client side
  if (typeof window === 'undefined') {
    return uppy;
  }

  uppy.use(Dashboard, {
    inline: options.inline ?? true,
    target: options.target,
    width: options.width,
    height: options.height,
    showRemoveButtonAfterComplete: options.showRemoveButtonAfterComplete ?? true,
    proudlyDisplayPoweredByUppy: options.proudlyDisplayPoweredByUppy ?? false,
    theme: options.theme ?? 'auto',
    note: `Maximum file size: ${formatFileSize(getUploadLimits().maxFileSize)}`,
  });

  return uppy;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

