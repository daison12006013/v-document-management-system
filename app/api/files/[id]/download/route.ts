import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import * as fileQueries from '@/lib/queries/files';
import { getStorageDriver } from '@/lib/storage';
import { LocalStorageDriver } from '@/lib/storage/drivers/local';
import { getSignedUrlConfig } from '@/lib/storage/config';

// GET /api/files/[id]/download - Get signed download URL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('files', 'download');

    const { id } = await params;
    const file = await fileQueries.getFile(id);

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    if (file.type !== 'file') {
      return NextResponse.json(
        { error: 'Cannot download folder' },
        { status: 400 }
      );
    }

    if (!file.storagePath || !file.storageDriver) {
      return NextResponse.json(
        { error: 'File storage information not available' },
        { status: 500 }
      );
    }

    // Get signed URL from storage driver (use the driver that stored the file)
    const { getStorageDriverByType } = await import('@/lib/storage');
    const storage = getStorageDriverByType(file.storageDriver);
    // Pass MIME type to ensure correct content type in signed URL token
    // Note: LocalStorageDriver includes this in the token, S3/R2 drivers ignore it
    const signedUrl = await storage.getSignedUrl(file.storagePath, undefined, file.mimeType || undefined);

    return NextResponse.json({
      url: signedUrl,
      filename: file.originalName || file.name,
      mimeType: file.mimeType,
      size: file.size,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Download file API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

