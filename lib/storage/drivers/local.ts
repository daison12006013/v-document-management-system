/**
 * Local file storage driver
 * Stores files on the local filesystem
 */

import { promises as fs } from 'fs';
import { join, dirname, resolve, relative } from 'path';
import { createHmac } from 'crypto';
import type { StorageDriver, StorageResult, UploadSignedUrl } from '../types';
import { getStorageConfig, getSignedUrlConfig } from '../config';

export class LocalStorageDriver implements StorageDriver {
  private storagePath: string;
  private baseUrl: string;
  private secret: string;
  private defaultExpiry: number;

  constructor() {
    const config = getStorageConfig();
    const signedUrlConfig = getSignedUrlConfig();

    this.storagePath = config.drivers.local.path;
    this.baseUrl = config.drivers.local.baseUrl;
    this.secret = signedUrlConfig.secret;
    this.defaultExpiry = signedUrlConfig.expiry;
  }

  /**
   * Ensure the storage directory exists
   */
  private async ensureDirectory(path: string): Promise<void> {
    const fullPath = join(this.storagePath, path);
    const dir = dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
  }

  /**
   * Generate a secure file path to prevent directory traversal
   * Improved version that handles encoded paths and edge cases
   */
  private sanitizePath(filePath: string): string {
    // Decode URL-encoded characters first (handles %2e%2e, %2f, etc.)
    let decoded: string;
    try {
      decoded = decodeURIComponent(filePath);
    } catch (e) {
      // If decoding fails, use original (but will be caught by normalize check)
      decoded = filePath;
    }

    // Remove leading slashes
    let normalized = decoded.replace(/^\/+/, '');

    // Normalize path separators and remove any remaining directory traversal attempts
    normalized = normalized.replace(/\\/g, '/'); // Normalize Windows paths
    normalized = normalized.replace(/\.\./g, ''); // Remove directory traversal

    // Remove any encoded directory traversal attempts
    normalized = normalized.replace(/%2e%2e/gi, ''); // %2e = .
    normalized = normalized.replace(/%2f/gi, ''); // %2f = /
    normalized = normalized.replace(/%5c/gi, ''); // %5c = \

    // Resolve against storage root to detect traversal attempts
    const resolved = resolve(this.storagePath, normalized);
    const storageRoot = resolve(this.storagePath);

    // Ensure resolved path is within storage root (prevents any traversal)
    if (!resolved.startsWith(storageRoot + '/') && resolved !== storageRoot) {
      throw new Error('Invalid path: directory traversal detected');
    }

    // Return relative path from storage root, normalized with forward slashes
    return relative(storageRoot, resolved).replace(/\\/g, '/');
  }

  /**
   * Upload a file to local storage
   */
  async upload(file: File | Buffer, path: string): Promise<StorageResult> {
    const sanitizedPath = this.sanitizePath(path);
    const fullPath = join(this.storagePath, sanitizedPath);

    await this.ensureDirectory(sanitizedPath);

    let buffer: Buffer;
    let size: number;

    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      size = file.size;
    } else {
      buffer = file;
      size = buffer.length;
    }

    await fs.writeFile(fullPath, buffer);

    const url = `${this.baseUrl}/api/files/serve/${encodeURIComponent(sanitizedPath)}`;

    // Generate checksum (simple hash for now)
    const crypto = await import('crypto');
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    return {
      path: sanitizedPath,
      url,
      size,
      checksum,
    };
  }

  /**
   * Delete a file from local storage
   */
  async delete(path: string): Promise<void> {
    const sanitizedPath = this.sanitizePath(path);
    const fullPath = join(this.storagePath, sanitizedPath);

    try {
      await fs.unlink(fullPath);
      // Clean up empty parent directories
      await this.cleanupEmptyFolders(sanitizedPath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist, consider it deleted
      // Still try to clean up in case directories exist
      await this.cleanupEmptyFolders(sanitizedPath).catch(() => {
        // Ignore errors during cleanup if file didn't exist
      });
    }
  }

  /**
   * Recursively remove empty parent directories after file deletion
   */
  private async cleanupEmptyFolders(filePath: string): Promise<void> {
    const sanitizedPath = this.sanitizePath(filePath);
    const fullPath = join(this.storagePath, sanitizedPath);
    let currentDir = dirname(fullPath);

    // Resolve paths to handle symlinks and normalize them
    const storageRoot = resolve(this.storagePath);

    // Keep cleaning up directories until we hit a non-empty one or reach the root
    while (true) {
      const resolvedCurrentDir = resolve(currentDir);

      // Stop if we've reached or would go above the storage root
      if (resolvedCurrentDir === storageRoot || !resolvedCurrentDir.startsWith(storageRoot)) {
        break;
      }

      try {
        const entries = await fs.readdir(resolvedCurrentDir);

        // If directory is empty, remove it and continue with parent
        if (entries.length === 0) {
          await fs.rmdir(resolvedCurrentDir);
          currentDir = dirname(resolvedCurrentDir);
        } else {
          // Directory has contents, stop cleanup
          break;
        }
      } catch (error: any) {
        // If directory doesn't exist or can't be read, stop cleanup
        if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
          break;
        }
        // For other errors, log but don't throw (best effort cleanup)
        console.warn(`Failed to cleanup directory ${resolvedCurrentDir}:`, error);
        break;
      }
    }
  }

  /**
   * Generate a signed token
   */
  private signToken(payload: Record<string, any>): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = createHmac('sha256', this.secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verify a signed token
   */
  private verifyToken(token: string): Record<string, any> {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = createHmac('sha256', this.secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      throw new Error('Invalid token signature');
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return payload;
  }

  /**
   * Generate a signed URL for downloading a file
   */
  async getSignedUrl(path: string, expiresIn: number = this.defaultExpiry, contentType?: string): Promise<string> {
    const sanitizedPath = this.sanitizePath(path);

    const tokenPayload: Record<string, any> = {
      path: sanitizedPath,
      type: 'download',
      exp: Math.floor(Date.now() / 1000) + expiresIn,
    };

    // Include contentType in token if provided
    if (contentType) {
      tokenPayload.contentType = contentType;
    }

    const token = this.signToken(tokenPayload);

    return `${this.baseUrl}/api/files/serve/${encodeURIComponent(sanitizedPath)}?token=${token}`;
  }

  /**
   * Generate a signed URL for uploading a file
   * For local storage, this returns a token that can be validated on upload
   */
  async getUploadSignedUrl(
    path: string,
    contentType: string,
    expiresIn: number = this.defaultExpiry
  ): Promise<UploadSignedUrl> {
    const sanitizedPath = this.sanitizePath(path);

    const token = this.signToken({
      path: sanitizedPath,
      contentType,
      type: 'upload',
      exp: Math.floor(Date.now() / 1000) + expiresIn,
    });

    return {
      url: `${this.baseUrl}/api/files/upload?token=${token}`,
      headers: {
        'Content-Type': contentType,
      },
    };
  }

  /**
   * Verify a signed URL token (static method for use in API routes)
   */
  static verifyToken(token: string, secret: string): { path: string; type: string; contentType?: string } {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const [encodedHeader, encodedPayload, signature] = parts;
      const expectedSignature = createHmac('sha256', secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');

      if (signature !== expectedSignature) {
        throw new Error('Invalid token signature');
      }

      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());

      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }

      return payload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Get the full filesystem path for a storage path
   */
  getFullPath(path: string): string {
    const sanitizedPath = this.sanitizePath(path);
    return join(this.storagePath, sanitizedPath);
  }
}

