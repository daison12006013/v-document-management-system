import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, ERRORS } from '@/lib/error_responses';
import { handleApiError } from '@/lib/utils/error-handler';
import * as shareLinkQueries from '@/lib/queries/share-links';
import * as fileQueries from '@/lib/queries/files';
import { readFileFromStorage } from '@/lib/utils/storage-reader';
import { logger } from '@/lib/logger';
import archiver from 'archiver';

// GET /api/files/share/[token]/view - View/download shared file or folder (public, no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const resolvedParams = await params;
    const token = resolvedParams.token;

    const shareLink = await shareLinkQueries.getShareLinkByToken(token);

    if (!shareLink) {
      return NextResponse.json(
        { error: 'Share link not found or expired' },
        { status: 404 }
      );
    }

    if (!shareLink.file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Handle folders - create zip file
    if (shareLink.file.type === 'folder') {
      try {
        // Get all files in the folder
        const folderFiles = await fileQueries.getFolderFilesForZip(shareLink.fileId);

        if (folderFiles.length === 0) {
          return NextResponse.json(
            { error: 'Folder is empty' },
            { status: 400 }
          );
        }

        // Create a zip archive
        const archive = archiver('zip', {
          zlib: { level: 9 }, // Maximum compression
        });

        // Collect chunks from the archive stream
        const chunks: Buffer[] = [];

        // Set up event handlers before adding files
        archive.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        // Add all files to the zip
        for (const file of folderFiles) {
          if (!file.storagePath || !file.storageDriver) {
            logger.warn('Skipping file without storage info', {
              fileId: file.id,
              fileName: file.name,
            });
            continue;
          }

          try {
            const fileBuffer = await readFileFromStorage(
              file.storagePath,
              file.storageDriver
            );
            archive.append(fileBuffer, { name: file.relativePath });
          } catch (readError: any) {
            logger.error('Failed to read file for zip', {
              error: readError,
              fileId: file.id,
              fileName: file.name,
              storagePath: file.storagePath,
            });
            // Continue with other files even if one fails
          }
        }

        // Finalize the archive and wait for completion
        const zipBuffer = await new Promise<Buffer>((resolve, reject) => {
          archive.on('end', () => {
            resolve(Buffer.concat(chunks));
          });
          archive.on('error', (err) => {
            reject(err);
          });
          archive.finalize();
        });

        // Set headers for zip download
        const headers = new Headers();
        headers.set('Content-Type', 'application/zip');
        headers.set('Content-Length', zipBuffer.length.toString());
        headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(shareLink.file.name)}.zip"`);

        logger.info('Shared folder accessed as zip', {
          folderId: shareLink.file.id,
          shareLinkId: shareLink.id,
          folderName: shareLink.file.name,
          fileCount: folderFiles.length,
        });

        return new NextResponse(zipBuffer, {
          status: 200,
          headers,
        });
      } catch (zipError: any) {
        logger.error('Failed to create zip for shared folder', {
          error: zipError,
          folderId: shareLink.file.id,
        });
        return NextResponse.json(
          { error: 'Failed to create zip file' },
          { status: 500 }
        );
      }
    }

    // Handle files - download directly
    if (!shareLink.file.storagePath || !shareLink.file.storageDriver) {
      return NextResponse.json(
        { error: 'File storage path not found' },
        { status: 404 }
      );
    }

    try {
      const fileBuffer = await readFileFromStorage(
        shareLink.file.storagePath,
        shareLink.file.storageDriver
      );

      // Determine content type
      const contentType = shareLink.file.mimeType || 'application/octet-stream';

      // Set headers for file download
      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Content-Length', fileBuffer.length.toString());
      headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(shareLink.file.name)}"`);

      logger.info('Shared file accessed', {
        fileId: shareLink.file.id,
        shareLinkId: shareLink.id,
        fileName: shareLink.file.name,
      });

      return new NextResponse(fileBuffer, {
        status: 200,
        headers,
      });
    } catch (readError: any) {
      logger.error('Failed to read shared file', {
        error: readError,
        storagePath: shareLink.file.storagePath,
      });
      return NextResponse.json(
        { error: 'Failed to read file' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return handleApiError(error, 'View shared file');
  }
}

