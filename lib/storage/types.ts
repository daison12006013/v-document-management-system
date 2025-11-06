/**
 * Storage driver interface for file storage operations
 * Supports multiple storage backends: local, S3, R2
 */

export interface StorageResult {
  path: string;
  url: string;
  size: number;
  checksum?: string;
}

export interface UploadSignedUrl {
  url: string;
  fields?: Record<string, string>;
  headers?: Record<string, string>;
}

export interface StorageDriver {
  /**
   * Upload a file to storage
   * @param file - The file to upload
   * @param path - Storage path for the file
   * @returns Storage result with path, URL, size, and optional checksum
   */
  upload(file: File | Buffer, path: string): Promise<StorageResult>;

  /**
   * Delete a file from storage
   * @param path - Storage path of the file to delete
   */
  delete(path: string): Promise<void>;

  /**
   * Get a signed URL for downloading a file
   * @param path - Storage path of the file
   * @param expiresIn - Expiration time in seconds (default: 3600)
   * @param contentType - Optional MIME type to include in signed URL token (used by LocalStorageDriver)
   * @returns Signed URL for file download
   */
  getSignedUrl(path: string, expiresIn?: number, contentType?: string): Promise<string>;

  /**
   * Get a signed URL for uploading a file (for direct client uploads)
   * @param path - Storage path for the file
   * @param contentType - MIME type of the file
   * @param expiresIn - Expiration time in seconds (default: 3600)
   * @returns Signed URL and optional fields/headers for upload
   */
  getUploadSignedUrl(
    path: string,
    contentType: string,
    expiresIn?: number
  ): Promise<UploadSignedUrl>;
}

