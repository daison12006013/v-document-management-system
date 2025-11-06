import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { requirePermission, getCurrentUser } from '@/lib/auth';
import * as fileQueries from '@/lib/queries/files';
import { logActivity } from '@/lib/activities';
import { getStorageDriver } from '@/lib/storage';

// GET /api/files - List files and folders
export async function GET(request: NextRequest) {
  try {
    await requirePermission('files', 'read');

    const searchParams = request.nextUrl.searchParams;
    const parentId = searchParams.get('parentId');
    const type = searchParams.get('type') as 'file' | 'folder' | null;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    const filesList = await fileQueries.listFiles({
      parentId: parentId === 'null' ? null : parentId || undefined,
      type: type || undefined,
      limit,
      offset,
    });

    return NextResponse.json(filesList);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('List files API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/files - Upload file or create folder
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('files', 'create');

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { name, type, parentId } = body;

      if (!name || !type) {
        return NextResponse.json(
          { error: 'Name and type are required' },
          { status: 400 }
        );
      }

      if (type !== 'file' && type !== 'folder') {
        return NextResponse.json(
          { error: 'Type must be "file" or "folder"' },
          { status: 400 }
        );
      }

      if (type === 'folder') {
        const normalizedParentId = parentId && parentId.trim() !== '' && parentId !== 'null'
          ? parentId
          : null;

        const newFolder = await fileQueries.createFile({
          name,
          type: 'folder',
          parentId: normalizedParentId,
          path: '',
          createdBy: user.id,
        });

        if (!newFolder) {
          return NextResponse.json(
            { error: 'Failed to create folder' },
            { status: 500 }
          );
        }

        await logActivity({
          action: 'create',
          resourceType: 'folder',
          resourceId: newFolder.id,
          description: `Folder created: ${newFolder.name}`,
          userId: user.id,
        });

        return NextResponse.json(newFolder, { status: 201 });
      }
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const parentIdRaw = formData.get('parentId') as string | null;
    const name = formData.get('name') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    const parentId = parentIdRaw && parentIdRaw.trim() !== '' && parentIdRaw !== 'null'
      ? parentIdRaw
      : null;

    // Check upload limits
    const { getUploadLimits } = await import('@/lib/storage/config');
    const limits = getUploadLimits();

    if (file.size > limits.maxFileSize) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${limits.maxFileSize} bytes` },
        { status: 400 }
      );
    }

    const fileId = randomUUID();
    const storagePath = `${user.id}/${fileId}/${file.name}`;

    const storage = getStorageDriver();
    const { getStorageConfig } = await import('@/lib/storage/config');
    const storageConfig = getStorageConfig();
    const storageResult = await storage.upload(file, storagePath);
    const fileName = name || file.name;
    const newFile = await fileQueries.createFile({
      name: fileName,
      type: 'file',
      parentId: parentId,
      path: '',
      createdBy: user.id,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      storagePath: storageResult.path,
      storageDriver: storageConfig.default,
      checksum: storageResult.checksum,
    });

    if (!newFile) {
      try {
        await storage.delete(storagePath);
      } catch (deleteError) {
        console.error('Failed to cleanup uploaded file:', deleteError);
      }
      return NextResponse.json(
        { error: 'Failed to create file record' },
        { status: 500 }
      );
    }

    await logActivity({
      action: 'create',
      resourceType: 'file',
      resourceId: newFile.id,
      description: `File uploaded: ${newFile.name}`,
      metadata: {
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
      },
      userId: user.id,
    });

    return NextResponse.json(newFile, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Create file API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

