/**
 * Local file storage driver
 * Stores files on the local filesystem
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
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
   */
  private sanitizePath(path: string): string {
    // Remove any leading slashes and normalize path
    const normalized = path.replace(/^\/+/, '').replace(/\.\./g, '');
    return normalized;
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
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist, consider it deleted
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

