// not tested yet - Daison Cariño

/**
 * Cloudflare R2 storage driver
 * Uses S3-compatible API with AWS SDK v3
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHash } from 'crypto';
import type { StorageDriver, StorageResult, UploadSignedUrl } from '../types';
import { getStorageConfig, getSignedUrlConfig } from '../config';

export class R2StorageDriver implements StorageDriver {
  private s3Client: S3Client;
  private bucket: string;
  private endpoint: string;
  private defaultExpiry: number;

  constructor() {
    const config = getStorageConfig();
    const signedUrlConfig = getSignedUrlConfig();

    if (!config.drivers.r2.bucket || !config.drivers.r2.endpoint || !config.drivers.r2.accessKeyId || !config.drivers.r2.secretAccessKey) {
      throw new Error('R2 configuration is incomplete. Please set R2_BUCKET, R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables.');
    }

    this.bucket = config.drivers.r2.bucket;
    this.endpoint = config.drivers.r2.endpoint;
    this.defaultExpiry = signedUrlConfig.expiry;

    // R2 uses S3-compatible API but needs custom endpoint
    this.s3Client = new S3Client({
      region: 'auto', // R2 uses 'auto' region
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: config.drivers.r2.accessKeyId,
        secretAccessKey: config.drivers.r2.secretAccessKey,
      },
      forcePathStyle: true, // R2 requires path-style URLs
    });
  }

  /**
   * Sanitize path to prevent issues
   */
  private sanitizePath(path: string): string {
    // Remove leading slashes and normalize
    return path.replace(/^\/+/, '').replace(/\.\./g, '');
  }

  /**
   * Upload a file to R2
   */
  async upload(file: File | Buffer, path: string): Promise<StorageResult> {
    const sanitizedPath = this.sanitizePath(path);

    let buffer: Buffer;
    let size: number;
    let contentType: string = 'application/octet-stream';

    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      size = file.size;
      contentType = file.type || contentType;
    } else {
      buffer = file;
      size = buffer.length;
    }

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: sanitizedPath,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3Client.send(command);

    // Generate checksum
    const checksum = createHash('sha256').update(buffer).digest('hex');

    // R2 URL format: https://<account-id>.r2.cloudflarestorage.com/<bucket>/<key>
    // For public access, we can construct the URL, but typically R2 uses presigned URLs
    const url = `${this.endpoint}/${this.bucket}/${sanitizedPath}`;

    return {
      path: sanitizedPath,
      url,
      size,
      checksum,
    };
  }

  /**
   * Delete a file from R2
   */
  async delete(path: string): Promise<void> {
    const sanitizedPath = this.sanitizePath(path);

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: sanitizedPath,
    });

    await this.s3Client.send(command);
  }

  /**
   * Get a presigned URL for downloading a file
   */
  async getSignedUrl(path: string, expiresIn: number = this.defaultExpiry, contentType?: string): Promise<string> {
    const sanitizedPath = this.sanitizePath(path);

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: sanitizedPath,
    });

    // Note: contentType parameter is ignored for R2 presigned URLs
    // R2 uses the Content-Type stored with the object metadata
    const url = await getSignedUrl(this.s3Client, command, { expiresIn });
    return url;
  }

  /**
   * Get a presigned URL for uploading a file (for direct client uploads)
   */
  async getUploadSignedUrl(
    path: string,
    contentType: string,
    expiresIn: number = this.defaultExpiry
  ): Promise<UploadSignedUrl> {
    const sanitizedPath = this.sanitizePath(path);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: sanitizedPath,
      ContentType: contentType,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn });

    return {
      url,
      headers: {
        'Content-Type': contentType,
      },
    };
  }
}

