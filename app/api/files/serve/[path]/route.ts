import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { LocalStorageDriver } from '@/lib/storage/drivers/local';
import { getSignedUrlConfig } from '@/lib/storage/config';
import { logger } from '@/lib/logger';

// GET /api/files/serve/[path] - Serve file with token validation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string }> }
) {
  let filePath: string | undefined;
  try {
    const resolvedParams = await params;
    filePath = resolvedParams.path;
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 401 }
      );
    }

    // Verify token
    const signedUrlConfig = getSignedUrlConfig();
    let tokenData;
    try {
      tokenData = LocalStorageDriver.verifyToken(token, signedUrlConfig.secret);
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Verify path matches token
    const decodedPath = decodeURIComponent(filePath!);
    if (tokenData.path !== decodedPath) {
      return NextResponse.json(
        { error: 'Path mismatch' },
        { status: 403 }
      );
    }

    // Verify token type
    if (tokenData.type !== 'download') {
      return NextResponse.json(
        { error: 'Invalid token type' },
        { status: 403 }
      );
    }

    // Get file from storage
    const storage = new LocalStorageDriver();
    const fullPath = storage.getFullPath(decodedPath);

    try {
      const fileBuffer = await readFile(fullPath);

      // Get content type from token, or detect from file extension
      let contentType = tokenData.contentType;
      if (!contentType) {
        const filename = decodedPath.split('/').pop() || '';
        const ext = filename.split('.').pop()?.toLowerCase();

        // Common MIME types
        const mimeTypes: Record<string, string> = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'webp': 'image/webp',
          'svg': 'image/svg+xml',
          'pdf': 'application/pdf',
          'mp4': 'video/mp4',
          'mov': 'video/quicktime',
          'webm': 'video/webm',
          'mp3': 'audio/mpeg',
          'wav': 'audio/wav',
          'json': 'application/json',
          'xml': 'application/xml',
          'txt': 'text/plain',
          'html': 'text/html',
          'css': 'text/css',
          'js': 'application/javascript',
        };

        contentType = ext ? (mimeTypes[ext] || 'application/octet-stream') : 'application/octet-stream';
      }

      // Use inline for previewable media types (images, videos, audio, PDFs)
      // Use attachment for other file types to force download
      const isPreviewable =
        contentType.startsWith('image/') ||
        contentType.startsWith('video/') ||
        contentType.startsWith('audio/') ||
        contentType === 'application/pdf';

      // Properly encode filename to prevent HTTP header injection
      // RFC 5987 encoding for filenames with special characters
      const filename = decodedPath.split('/').pop() || 'file';
      const encodeRFC5987 = (value: string): string => {
        // RFC 5987 encoding: use encodeURIComponent and ensure asterisk is encoded
        // encodeURIComponent already handles most characters correctly for RFC 5987
        // but asterisks need explicit encoding
        return encodeURIComponent(value).replace(/\*/g, '%2A');
      };

      // Escape problematic characters for the simple filename parameter (fallback for older clients)
      const escapeFilename = (value: string): string => {
        return value
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r');
      };

      // Use RFC 5987 encoding for filenames with special characters or non-ASCII
      const hasSpecialChars = /[^\x20-\x7E]/.test(filename) || /["\\\r\n]/.test(filename);
      const dispositionType = isPreviewable ? 'inline' : 'attachment';

      let disposition: string;
      if (hasSpecialChars) {
        // Use RFC 5987 encoding with fallback for older clients
        disposition = `${dispositionType}; filename="${escapeFilename(filename)}"; filename*=UTF-8''${encodeRFC5987(filename)}`;
      } else {
        // Simple ASCII filename, just escape quotes
        disposition = `${dispositionType}; filename="${escapeFilename(filename)}"`;
      }

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': disposition,
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      });
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error: any) {
    logger.error('Serve file API error', { error, path: filePath });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

