/**
 * Utility functions for reading files from storage drivers
 */

import { readFile } from 'fs/promises';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { LocalStorageDriver } from '@/lib/storage/drivers/local';
import { S3StorageDriver } from '@/lib/storage/drivers/s3';
import { R2StorageDriver } from '@/lib/storage/drivers/r2';
import { getStorageDriverByType } from '@/lib/storage';

/**
 * Read file content from storage
 */
export async function readFileFromStorage(
  storagePath: string,
  storageDriver: 'local' | 's3' | 'r2' | null
): Promise<Buffer> {
  if (!storageDriver || !storagePath) {
    throw new Error('Storage driver and path are required');
  }

  switch (storageDriver) {
    case 'local': {
      const storage = new LocalStorageDriver();
      const fullPath = storage.getFullPath(storagePath);
      return readFile(fullPath);
    }
    case 's3': {
      const storage = getStorageDriverByType('s3') as S3StorageDriver;
      const s3Client = (storage as any).s3Client;
      const bucket = (storage as any).bucket;

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: storagePath,
      });

      const response = await s3Client.send(command);
      if (!response.Body) {
        throw new Error('File not found in S3');
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    }
    case 'r2': {
      const storage = getStorageDriverByType('r2') as R2StorageDriver;
      const s3Client = (storage as any).s3Client;
      const bucket = (storage as any).bucket;

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: storagePath,
      });

      const response = await s3Client.send(command);
      if (!response.Body) {
        throw new Error('File not found in R2');
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    }
    default:
      throw new Error(`Unsupported storage driver: ${storageDriver}`);
  }
}

