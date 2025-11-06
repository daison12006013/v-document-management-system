// not tested yet - Daison Cariño

/**
 * AWS S3 storage driver
 * Uses AWS SDK v3 for S3 operations
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHash } from 'crypto';
import type { StorageDriver, StorageResult, UploadSignedUrl } from '../types';
import { getStorageConfig, getSignedUrlConfig } from '../config';

export class S3StorageDriver implements StorageDriver {
  private s3Client: S3Client;
  private bucket: string;
  private defaultExpiry: number;

  constructor() {
    const config = getStorageConfig();
    const signedUrlConfig = getSignedUrlConfig();

    if (!config.drivers.s3.bucket || !config.drivers.s3.accessKeyId || !config.drivers.s3.secretAccessKey) {
      throw new Error('S3 configuration is incomplete. Please set AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY environment variables.');
    }

    this.bucket = config.drivers.s3.bucket;
    this.defaultExpiry = signedUrlConfig.expiry;

    this.s3Client = new S3Client({
      region: config.drivers.s3.region,
      credentials: {
        accessKeyId: config.drivers.s3.accessKeyId,
        secretAccessKey: config.drivers.s3.secretAccessKey,
      },
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
   * Upload a file to S3
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

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: sanitizedPath,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3Client.send(command);

    // Generate checksum
    const checksum = createHash('sha256').update(buffer).digest('hex');

    // Generate public URL (or presigned URL if bucket is private)
    const url = `https://${this.bucket}.s3.${this.s3Client.config.region}.amazonaws.com/${sanitizedPath}`;

    return {
      path: sanitizedPath,
      url,
      size,
      checksum,
    };
  }

  /**
   * Delete a file from S3
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

    // Note: contentType parameter is ignored for S3 presigned URLs
    // S3 uses the Content-Type stored with the object metadata
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

