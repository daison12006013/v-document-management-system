import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import * as fileQueries from '@/lib/queries/files';

// GET /api/files/[id]/children - Get folder contents
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('files', 'read');

    const { id } = await params;

    // Verify the folder exists
    const folder = await fileQueries.getFile(id);
    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    if (folder.type !== 'folder') {
      return NextResponse.json(
        { error: 'Item is not a folder' },
        { status: 400 }
      );
    }

    // Get folder children
    const children = await fileQueries.getFolderChildren(id);

    return NextResponse.json(children);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Get folder children API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

