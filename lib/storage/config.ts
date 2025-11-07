/**
 * Storage configuration management
 * Reads configuration from environment variables
 */

type StorageDriverType = 'local' | 's3' | 'r2';

interface StorageConfig {
  default: StorageDriverType;
  drivers: {
    local: {
      path: string;
      baseUrl: string;
    };
    s3: {
      region: string;
      bucket: string;
      accessKeyId: string;
      secretAccessKey: string;
    };
    r2: {
      endpoint: string;
      bucket: string;
      accessKeyId: string;
      secretAccessKey: string;
    };
  };
}

/**
 * Get storage configuration from environment variables
 */
export const getStorageConfig = (): StorageConfig => {
  const defaultDriver = (process.env.STORAGE_DRIVER || 'local') as StorageDriverType;

  return {
    default: defaultDriver,
    drivers: {
      local: {
        path: process.env.STORAGE_LOCAL_PATH || './storage/documents',
        baseUrl: process.env.STORAGE_LOCAL_BASE_URL || 'http://localhost:3000',
      },
      s3: {
        region: process.env.AWS_REGION || 'us-east-1',
        bucket: process.env.AWS_S3_BUCKET || '',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
      r2: {
        endpoint: process.env.R2_ENDPOINT || '',
        bucket: process.env.R2_BUCKET || '',
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    },
  };
};

/**
 * Get file upload limits from environment variables
 */
export const getUploadLimits = () => {
  return {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600', 10), // 100MB default
    maxFilesPerUpload: parseInt(process.env.MAX_FILES_PER_UPLOAD || '10', 10),
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES || '*', // * for all, or comma-separated list
  };
};

/**
 * Get signed URL configuration
 */
export const getSignedUrlConfig = () => {
  return {
    secret: process.env.SIGNED_URL_SECRET || process.env.NEXTAUTH_SECRET || 'change-this-secret',
    expiry: parseInt(process.env.SIGNED_URL_EXPIRY || '3600', 10), // 1 hour default
  };
};

