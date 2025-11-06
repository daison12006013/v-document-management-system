import { eq, and, sql, desc, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { files } from '@/database/schema';

export type FileType = 'file' | 'folder';

export interface CreateFileData {
  name: string;
  type: FileType;
  parentId?: string | null;
  path: string;
  createdBy: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  storagePath?: string;
  storageDriver?: 'local' | 's3' | 'r2';
  checksum?: string;
  metadata?: Record<string, any>;
}

export interface UpdateFileData {
  name?: string;
  parentId?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Generate path for a file/folder based on parent
 */
export async function generatePath(name: string, parentId?: string | null): Promise<string> {
  if (!parentId || parentId === '' || parentId === 'null') {
    return `/${name}`;
  }

  const parent = await getFile(parentId);
  if (!parent) {
    throw new Error('Parent not found');
  }

  const parentPath = parent.path === '/' ? '' : parent.path;
  return `${parentPath}/${name}`;
}

// Get file by ID (excluding soft-deleted)
export async function getFile(id: string) {
  const result = await db.query.files.findFirst({
    where: and(
      eq(files.id, id),
      isNull(files.deletedAt)
    ),
    with: {
      parent: true,
      creator: true,
    },
  });
  return result || null;
}

// List files/folders
export async function listFiles(options: {
  parentId?: string | null;
  type?: FileType;
  createdBy?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const { parentId, type, createdBy, limit, offset } = options;

  const conditions = [isNull(files.deletedAt)];

  if (parentId !== undefined) {
    if (parentId === null) {
      conditions.push(isNull(files.parentId));
    } else {
      conditions.push(eq(files.parentId, parentId));
    }
  }

  if (type) {
    conditions.push(eq(files.type, type));
  }

  if (createdBy) {
    conditions.push(eq(files.createdBy, createdBy));
  }

  const query = db.query.files.findMany({
    where: and(...conditions),
    orderBy: [desc(files.createdAt)],
    with: {
      parent: true,
      creator: true,
    },
    limit,
    offset,
  });

  return query;
}

// Get folder contents
export async function getFolderChildren(folderId: string) {
  return listFiles({ parentId: folderId });
}

// Create a file or folder
export async function createFile(data: CreateFileData) {
  const id = randomUUID();

  const path = data.path || await generatePath(data.name, data.parentId);

  await db.insert(files).values({
    id,
    name: data.name,
    type: data.type,
    parentId: data.parentId || null,
    path,
    createdBy: data.createdBy,
    originalName: data.originalName,
    mimeType: data.mimeType,
    size: data.size,
    storagePath: data.storagePath,
    storageDriver: data.storageDriver,
    checksum: data.checksum,
    metadata: data.metadata,
  });

  return getFile(id);
}

// Update file/folder metadata
export async function updateFile(id: string, data: UpdateFileData) {
  const file = await getFile(id);
  if (!file) {
    return null;
  }

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined || data.parentId !== undefined) {
    const newName = data.name ?? file.name;
    const newParentId = data.parentId !== undefined ? data.parentId : file.parentId;
    updateData.path = await generatePath(newName, newParentId);
  }

  if (data.name !== undefined) {
    updateData.name = data.name;
  }

  if (data.parentId !== undefined) {
    updateData.parentId = data.parentId;
  }

  if (data.metadata !== undefined) {
    updateData.metadata = data.metadata;
  }

  await db.update(files)
    .set(updateData)
    .where(eq(files.id, id));

  return getFile(id);
}

// Get all descendants of a folder (recursive)
async function getAllDescendants(folderId: string): Promise<Array<{ id: string; type: FileType; storagePath?: string | null; storageDriver?: string | null }>> {
  const descendants: Array<{ id: string; type: FileType; storagePath?: string | null; storageDriver?: string | null }> = [];
  const children = await getFolderChildren(folderId);

  for (const child of children) {
    descendants.push({
      id: child.id,
      type: child.type,
      storagePath: child.storagePath || null,
      storageDriver: child.storageDriver || null,
    });

    if (child.type === 'folder') {
      const nestedDescendants = await getAllDescendants(child.id);
      descendants.push(...nestedDescendants);
    }
  }

  return descendants;
}

/**
 * Soft delete a file or folder (recursively deletes all children if folder)
 * Returns array of files that need to be deleted from storage
 */
export async function deleteFile(id: string): Promise<Array<{ storagePath: string; storageDriver: string }>> {
  const file = await getFile(id);
  if (!file) {
    return [];
  }

  const filesToDeleteFromStorage: Array<{ storagePath: string; storageDriver: string }> = [];

  if (file.type === 'folder') {
    const descendants = await getAllDescendants(id);

    // Soft delete all descendants in parallel
    const storageFiles = await Promise.all(
      descendants.map(async (descendant) => {
        await db.update(files)
          .set({ deletedAt: new Date() })
          .where(eq(files.id, descendant.id));

        if (descendant.type === 'file' && descendant.storagePath && descendant.storageDriver) {
          return {
            storagePath: descendant.storagePath,
            storageDriver: descendant.storageDriver,
          };
        }
        return null;
      })
    );

    filesToDeleteFromStorage.push(...storageFiles.filter((f): f is { storagePath: string; storageDriver: string } => f !== null));
  } else if (file.type === 'file' && file.storagePath && file.storageDriver) {
    filesToDeleteFromStorage.push({
      storagePath: file.storagePath,
      storageDriver: file.storageDriver,
    });
  }

  // Delete the file/folder itself
  await db.update(files)
    .set({ deletedAt: new Date() })
    .where(eq(files.id, id));

  return filesToDeleteFromStorage;
}

// Hard delete a file (permanent removal)
export async function hardDeleteFile(id: string) {
  await db.delete(files).where(eq(files.id, id));
}

// Get files by user
export async function getUserFiles(userId: string) {
  return listFiles({ createdBy: userId });
}

// Check if a file/folder exists
export async function fileExists(id: string): Promise<boolean> {
  const file = await getFile(id);
  return file !== null;
}

// Get files count
export async function getFilesCount(options: {
  parentId?: string | null;
  type?: FileType;
  createdBy?: string;
} = {}) {
  const { parentId, type, createdBy } = options;

  const conditions = [isNull(files.deletedAt)];

  if (parentId !== undefined) {
    if (parentId === null) {
      conditions.push(isNull(files.parentId));
    } else {
      conditions.push(eq(files.parentId, parentId));
    }
  }

  if (type) {
    conditions.push(eq(files.type, type));
  }

  if (createdBy) {
    conditions.push(eq(files.createdBy, createdBy));
  }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(files)
    .where(and(...conditions));

  return result[0]?.count || 0;
}

