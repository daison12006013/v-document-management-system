import { eq, and, desc, asc, isNull, count, like, gte, lte, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { files } from '@/database/schema';

type FileType = 'file' | 'folder';

interface CreateFileData {
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

interface UpdateFileData {
  name?: string;
  parentId?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Generate path for a file/folder based on parent
 */
async function generatePath(name: string, parentId?: string | null): Promise<string> {
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

// Count files/folders
export async function countFiles(options: {
  parentId?: string | null;
  type?: FileType;
  createdBy?: string;
  query?: string;
  mimeType?: string;
  createdAfter?: string;
  createdBefore?: string;
  sizeMin?: number;
  sizeMax?: number;
} = {}) {
  const { parentId, type, createdBy, query, mimeType, createdAfter, createdBefore, sizeMin, sizeMax } = options;

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

  // Search query - filter by name (case-insensitive for MySQL)
  if (query) {
    const searchPattern = `%${query}%`;
    conditions.push(sql`LOWER(${files.name}) LIKE LOWER(${searchPattern})`);
  }

  // MIME type filter
  if (mimeType) {
    // Support wildcard patterns like "image/*"
    if (mimeType.endsWith('/*')) {
      const prefix = mimeType.slice(0, -2);
      conditions.push(like(files.mimeType, `${prefix}/%`));
    } else {
      conditions.push(eq(files.mimeType, mimeType));
    }
  }

  // Date range filters
  if (createdAfter) {
    conditions.push(gte(files.createdAt, new Date(createdAfter)));
  }
  if (createdBefore) {
    conditions.push(lte(files.createdAt, new Date(createdBefore)));
  }

  // Size range filters
  if (sizeMin !== undefined) {
    conditions.push(gte(files.size, sizeMin));
  }
  if (sizeMax !== undefined) {
    conditions.push(lte(files.size, sizeMax));
  }

const result = await db
    .select({ count: count() })
    .from(files)
    .where(and(...conditions));

  return result[0]?.count || 0;
}

// List files/folders
export async function listFiles(options: {
  parentId?: string | null;
  type?: FileType;
  createdBy?: string;
  limit?: number;
  offset?: number;
  query?: string;
  mimeType?: string;
  createdAfter?: string;
  createdBefore?: string;
  sizeMin?: number;
  sizeMax?: number;
  sortField?: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'type';
  sortOrder?: 'asc' | 'desc';
} = {}) {
  const { parentId, type, createdBy, limit, offset, query, mimeType, createdAfter, createdBefore, sizeMin, sizeMax, sortField = 'name', sortOrder = 'asc' } = options;

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

  // Search query - filter by name (case-insensitive for MySQL)
  if (query) {
    const searchPattern = `%${query}%`;
    conditions.push(sql`LOWER(${files.name}) LIKE LOWER(${searchPattern})`);
  }

  // MIME type filter
  if (mimeType) {
    // Support wildcard patterns like "image/*"
    if (mimeType.endsWith('/*')) {
      const prefix = mimeType.slice(0, -2);
      conditions.push(like(files.mimeType, `${prefix}/%`));
    } else {
      conditions.push(eq(files.mimeType, mimeType));
    }
  }

  // Date range filters
  if (createdAfter) {
    conditions.push(gte(files.createdAt, new Date(createdAfter)));
  }
  if (createdBefore) {
    conditions.push(lte(files.createdAt, new Date(createdBefore)));
  }

  // Size range filters
  if (sizeMin !== undefined) {
    conditions.push(gte(files.size, sizeMin));
  }
  if (sizeMax !== undefined) {
    conditions.push(lte(files.size, sizeMax));
  }

  // Build orderBy clause: folders first, then files, then by selected field
  const orderByClause: any[] = [];

  // If sorting by type, sort by type directly (folders/files based on sortOrder)
  // Otherwise, always put folders first, then sort by the selected field
  if (sortField === 'type') {
    // Sort by type field directly - 'folder' comes before 'file' alphabetically
    // For asc: folders first, for desc: files first
    orderByClause.push(sortOrder === 'asc' ? asc(files.type) : desc(files.type));
  } else {
    // First, sort by type (folders first) - using CASE to make folders sort before files
    orderByClause.push(
      sql`CASE WHEN ${files.type} = 'folder' THEN 0 ELSE 1 END`
    );

    // Then sort by the selected field
    if (sortField === 'name') {
      orderByClause.push(sortOrder === 'asc' ? asc(files.name) : desc(files.name));
    } else if (sortField === 'createdAt') {
      orderByClause.push(sortOrder === 'asc' ? asc(files.createdAt) : desc(files.createdAt));
    } else if (sortField === 'updatedAt') {
      orderByClause.push(sortOrder === 'asc' ? asc(files.updatedAt) : desc(files.updatedAt));
    } else if (sortField === 'size') {
      // For size, handle null values (folders) - they should come first when sorting by size
      // Use COALESCE to treat null as 0 for sorting purposes
      orderByClause.push(
        sortOrder === 'asc'
          ? sql`COALESCE(${files.size}, 0) ASC`
          : sql`COALESCE(${files.size}, 0) DESC`
      );
    }
  }

  const queryResult = db.query.files.findMany({
    where: and(...conditions),
    orderBy: orderByClause,
    with: {
      parent: true,
      creator: true,
    },
    limit,
    offset,
  });

  return queryResult;
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
 * Get all files in a folder with their relative paths for zip creation
 * Returns files with their relative paths from the folder root
 */
export async function getFolderFilesForZip(folderId: string, folderPath: string = ''): Promise<Array<{
  id: string;
  name: string;
  type: FileType;
  storagePath: string | null;
  storageDriver: 'local' | 's3' | 'r2' | null;
  relativePath: string; // Path relative to folder root for zip structure
}>> {
  const folderFiles: Array<{
    id: string;
    name: string;
    type: FileType;
    storagePath: string | null;
    storageDriver: 'local' | 's3' | 'r2' | null;
    relativePath: string;
  }> = [];

  const children = await getFolderChildren(folderId);

  for (const child of children) {
    const relativePath = folderPath ? `${folderPath}/${child.name}` : child.name;

    if (child.type === 'file') {
      folderFiles.push({
        id: child.id,
        name: child.name,
        type: child.type,
        storagePath: child.storagePath || null,
        storageDriver: child.storageDriver as 'local' | 's3' | 'r2' | null,
        relativePath,
      });
    } else if (child.type === 'folder') {
      // Recursively get files from subfolders
      const subfolderFiles = await getFolderFilesForZip(child.id, relativePath);
      folderFiles.push(...subfolderFiles);
    }
  }

  return folderFiles;
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


