import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, getCurrentUser } from '@/lib/auth';
import * as fileQueries from '@/lib/queries/files';
import { logActivity } from '@/lib/activities';

// GET /api/files/[id] - Get file/folder details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('files', 'read');

    const { id } = await params;
    const file = await fileQueries.getFile(id);

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(file);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Get file API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/files/[id] - Update file/folder metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission('files', 'update');

    const { id } = await params;
    const body = await request.json();
    const { name, parentId: parentIdRaw, metadata } = body;

    const existingFile = await fileQueries.getFile(id);
    if (!existingFile) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Normalize parentId
    const parentId = parentIdRaw !== undefined
      ? (parentIdRaw && typeof parentIdRaw === 'string' && parentIdRaw.trim() !== '' && parentIdRaw !== 'null'
          ? parentIdRaw
          : null)
      : undefined;

    // Validate parent if moving to a folder
    if (parentId !== undefined && parentId !== null) {
      const parentFile = await fileQueries.getFile(parentId);
      if (!parentFile) {
        return NextResponse.json(
          { error: 'Parent folder not found' },
          { status: 400 }
        );
      }
      if (parentFile.type !== 'folder') {
        return NextResponse.json(
          { error: 'Parent must be a folder' },
          { status: 400 }
        );
      }
    }

    const updatedFile = await fileQueries.updateFile(id, {
      name,
      parentId,
      metadata,
    });

    if (!updatedFile) {
      return NextResponse.json(
        { error: 'Failed to update file' },
        { status: 500 }
      );
    }

    await logActivity({
      action: 'update',
      resourceType: existingFile.type,
      resourceId: id,
      description: `File updated: ${updatedFile.name}`,
      metadata: { previousName: existingFile.name, newName: name },
      userId: user.id,
    });

    return NextResponse.json(updatedFile);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Update file API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/files/[id] - Delete file/folder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission('files', 'delete');

    const { id } = await params;

    // Check if file exists
    const file = await fileQueries.getFile(id);
    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Soft delete - recursively deletes children if folder
    const filesToDeleteFromStorage = await fileQueries.deleteFile(id);

    // Delete all files from storage in parallel
    if (filesToDeleteFromStorage.length > 0) {
      const { getStorageDriverByType } = await import('@/lib/storage');

      await Promise.all(
        filesToDeleteFromStorage.map(async (fileInfo) => {
          try {
            const storage = getStorageDriverByType(fileInfo.storageDriver as 'local' | 's3' | 'r2');
            await storage.delete(fileInfo.storagePath);
          } catch (storageError) {
            console.error(`Failed to delete file from storage (${fileInfo.storageDriver}):`, storageError);
            // Continue even if storage delete fails (soft delete already done)
          }
        })
      );
    }

    const description = file.type === 'folder' && filesToDeleteFromStorage.length > 0
      ? `Folder deleted: ${file.name} (and ${filesToDeleteFromStorage.length} file(s) within)`
      : `${file.type === 'folder' ? 'Folder' : 'File'} deleted: ${file.name}`;

    await logActivity({
      action: 'delete',
      resourceType: file.type,
      resourceId: id,
      description,
      userId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Delete file API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

