import { eq, and, isNull, gte, sql, desc } from 'drizzle-orm';
import { randomBytes, randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { shareLinks, files } from '@/database/schema';

/**
 * Generate a secure random token for share links
 */
function generateShareToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Create a new share link
 */
export async function createShareLink(data: {
  fileId: string;
  sharedBy: string;
  expiresInSeconds?: number | null; // null means infinite
}): Promise<{
  id: string;
  fileId: string;
  token: string;
  sharedBy: string;
  expiresAt: Date | null;
  createdAt: Date;
  expiresInSeconds: number | null;
}> {
  const id = randomUUID();
  const token = generateShareToken();
  const now = new Date();

  let expiresAt: Date | null = null;
  if (data.expiresInSeconds !== null && data.expiresInSeconds !== undefined) {
    expiresAt = new Date(now.getTime() + data.expiresInSeconds * 1000);
  }

  await db.insert(shareLinks).values({
    id,
    fileId: data.fileId,
    token,
    sharedBy: data.sharedBy,
    expiresAt,
    expiresInSeconds: data.expiresInSeconds ?? null,
  });

  // Fetch the created share link
  const created = await db.query.shareLinks.findFirst({
    where: eq(shareLinks.id, id),
  });

  if (!created) {
    throw new Error('Failed to create share link');
  }

  return {
    id: created.id,
    fileId: created.fileId,
    token: created.token,
    sharedBy: created.sharedBy,
    expiresAt: created.expiresAt,
    createdAt: created.createdAt!,
    expiresInSeconds: created.expiresInSeconds,
  };
}

/**
 * Get share link by token (only if not expired)
 */
export async function getShareLinkByToken(token: string): Promise<{
  id: string;
  fileId: string;
  token: string;
  sharedBy: string;
  expiresAt: Date | null;
  createdAt: Date;
  expiresInSeconds: number | null;
  file: {
    id: string;
    name: string;
    type: 'file' | 'folder';
    mimeType: string | null;
    size: number | null;
    storagePath: string | null;
    storageDriver: 'local' | 's3' | 'r2' | null;
  } | null;
} | null> {
  const shareLink = await db.query.shareLinks.findFirst({
    where: eq(shareLinks.token, token),
  });

  if (!shareLink) {
    return null;
  }

  // Get the file separately
  const file = await db.query.files.findFirst({
    where: eq(files.id, shareLink.fileId),
  });

  // Check if expired
  if (shareLink.expiresAt) {
    const now = new Date();
    if (shareLink.expiresAt < now) {
      return null; // Expired
    }
  }

  return {
    id: shareLink.id,
    fileId: shareLink.fileId,
    token: shareLink.token,
    sharedBy: shareLink.sharedBy,
    expiresAt: shareLink.expiresAt,
    createdAt: shareLink.createdAt!,
    expiresInSeconds: shareLink.expiresInSeconds,
    file: file ? {
      id: file.id,
      name: file.name,
      type: file.type as 'file' | 'folder',
      mimeType: file.mimeType,
      size: file.size,
      storagePath: file.storagePath,
      storageDriver: file.storageDriver as 'local' | 's3' | 'r2' | null,
    } : null,
  };
}

/**
 * Get all share links for a file
 */
export async function getShareLinksByFileId(fileId: string): Promise<Array<{
  id: string;
  fileId: string;
  token: string;
  sharedBy: string;
  expiresAt: Date | null;
  createdAt: Date;
  expiresInSeconds: number | null;
}>> {
  const links = await db.query.shareLinks.findMany({
    where: eq(shareLinks.fileId, fileId),
    orderBy: [desc(shareLinks.createdAt)],
  });

  return links.map(link => ({
    id: link.id,
    fileId: link.fileId,
    token: link.token,
    sharedBy: link.sharedBy,
    expiresAt: link.expiresAt,
    createdAt: link.createdAt!,
    expiresInSeconds: link.expiresInSeconds,
  }));
}

/**
 * Delete a share link
 */
export async function deleteShareLink(id: string): Promise<void> {
  await db.delete(shareLinks).where(eq(shareLinks.id, id));
}

/**
 * Delete a share link by token
 */
export async function deleteShareLinkByToken(token: string): Promise<void> {
  await db.delete(shareLinks).where(eq(shareLinks.token, token));
}

