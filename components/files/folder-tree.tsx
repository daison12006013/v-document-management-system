'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { File } from '@/lib/types';
import { api } from '@/lib/api';
import { FileIcon } from './file-icon';
import { RenameDialog } from './dialogs';
import { useFileOperations } from './hooks/use-file-operations';

interface FolderTreeProps {
  currentFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onFileSelect?: (fileId: string) => void;
  onRename?: (file: File, newName: string) => void;
  canUpdate?: boolean;
  className?: string;
  refreshTrigger?: string | null; // When this changes, recache the entire tree
  sortField?: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'type';
  sortOrder?: 'asc' | 'desc';
}

interface TreeNode {
  id: string | null;
  name: string;
  type: 'file' | 'folder';
  mimeType?: string | null;
  parentId: string | null;
  children: TreeNode[];
  isExpanded: boolean;
}

export const FolderTree = ({
  currentFolderId,
  onFolderSelect,
  onFileSelect,
  onRename,
  canUpdate = false,
  className,
  refreshTrigger,
  sortField = 'name',
  sortOrder = 'asc',
}: FolderTreeProps) => {
  const [tree, setTree] = useState<TreeNode>({
    id: null,
    name: 'Root',
    type: 'folder',
    parentId: null,
    children: [],
    isExpanded: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isContextMenuAction, setIsContextMenuAction] = useState(false);
  const [nodeToRename, setNodeToRename] = useState<TreeNode | null>(null);

  // Use shared file operations hook
  const {
    renameDialogOpen,
    setRenameDialogOpen,
    handleRename,
    selectedFile,
    setSelectedFile,
  } = useFileOperations({
    onRename: onRename,
  });

  // Helper function to find ancestor IDs and expand path to target
  const findAndExpandPath = useCallback((tree: TreeNode, targetId: string): TreeNode => {
    // Find all ancestor IDs from root to target
    const findAncestors = (node: TreeNode, target: string, ancestors: string[] = []): string[] | null => {
      if (node.id === target) {
        return ancestors;
      }
      for (const child of node.children) {
        const result = findAncestors(child, target, node.id ? [...ancestors, node.id] : ancestors);
        if (result) return result;
      }
      return null;
    };

    const ancestors = findAncestors(tree, targetId);
    if (!ancestors) return tree;

    // Expand all ancestor nodes
    const expandAncestors = (node: TreeNode): TreeNode => {
      const shouldExpand = node.id === null || ancestors.includes(node.id);
      return {
        ...node,
        isExpanded: shouldExpand,
        children: node.children.map(expandAncestors),
      };
    };

    return expandAncestors(tree);
  }, []);

  // Build tree structure from flat list of files
  const buildTree = useCallback((files: File[]): TreeNode => {
    // Create a map of all files by ID for quick lookup
    const fileMap = new Map<string, File>();
    files.forEach(file => fileMap.set(file.id, file));

    // Create a map of children by parent ID
    const childrenMap = new Map<string | null, File[]>();
    files.forEach(file => {
      const parentId = file.parentId || null;
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      childrenMap.get(parentId)!.push(file);
    });

    // Helper function to build a tree node
    const buildNode = (id: string | null, name: string, file?: File): TreeNode => {
      const children = childrenMap.get(id) || [];
      // Files are already sorted by the database query, so we just use them as-is
      // The database query handles: folders first, then files, sorted by the selected field
      const sortedChildren = children;

      return {
        id,
        name,
        type: file?.type || 'folder',
        mimeType: file?.mimeType || null,
        parentId: id ? fileMap.get(id)?.parentId || null : null,
        children: sortedChildren.map(child => buildNode(child.id, child.name, child)),
        isExpanded: id === null, // Root is expanded by default
      };
    };

    return buildNode(null, 'Root', undefined);
  }, []);

  // Load all files and build tree cache
  const loadAllFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      // Load all files without any filters, but with sorting
      const response = await api.files.getAll({
        sortField,
        sortOrder,
      });

      // Handle both array and paginated response
      const filesArray = Array.isArray(response) ? response : (response as any).files || [];

      // Build tree structure
      const newTree = buildTree(filesArray);

      // Expand path to currentFolderId if set
      const updatedTree = currentFolderId !== null
        ? findAndExpandPath(newTree, currentFolderId)
        : newTree;

      setTree(updatedTree);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setIsLoading(false);
    }
  }, [buildTree, currentFolderId, findAndExpandPath, sortField, sortOrder]);

  // Load all files on mount
  useEffect(() => {
    loadAllFiles();
  }, [loadAllFiles]);

  // Expand path to target folder
  const expandPathToFolder = useCallback((targetId: string) => {
    setTree(prevTree => findAndExpandPath(prevTree, targetId));
  }, [findAndExpandPath]);

  // Recache when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      loadAllFiles();
    }
  }, [refreshTrigger, loadAllFiles]);

  // Expand path to currentFolderId when it changes
  useEffect(() => {
    if (currentFolderId !== null) {
      expandPathToFolder(currentFolderId);
    }
  }, [currentFolderId, expandPathToFolder]);

  // Toggle folder expansion (no need to load, data is already cached)
  const toggleFolder = (folderId: string | null) => {
    setTree(prevTree => {
      const toggleNode = (node: TreeNode): TreeNode => {
        if (node.id === folderId) {
          return {
            ...node,
            isExpanded: !node.isExpanded,
          };
        }
        return {
          ...node,
          children: node.children.map(toggleNode),
        };
      };
      return toggleNode(prevTree);
    });
  };

  // Convert TreeNode to File for rename operation
  const convertNodeToFile = async (node: TreeNode): Promise<File | null> => {
    if (!node.id) return null;
    try {
      return await api.files.getById(node.id);
    } catch (error) {
      console.error('Failed to get file:', error);
      return null;
    }
  };

  const handleRenameClick = async (node: TreeNode) => {
    // Set flag to prevent click handler from firing
    setIsContextMenuAction(true);
    // Small delay to ensure context menu closes before opening dialog
    setTimeout(async () => {
      const file = await convertNodeToFile(node);
      if (file) {
        setNodeToRename(node);
        setSelectedFile(file);
        setRenameDialogOpen(true);
      }
      // Reset flag after a short delay
      setTimeout(() => {
        setIsContextMenuAction(false);
      }, 200);
    }, 100);
  };

  const handleRenameSubmit = async (file: File, newName: string) => {
    if (onRename) {
      await onRename(file, newName);
    }
    setNodeToRename(null);
  };

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const isSelected = node.id === currentFolderId;
    const isFolder = node.type === 'folder';
    const hasChildren = isFolder && (node.children.length > 0 || node.id === null); // Only folders can have children, root always has potential children

    const handleClick = (e: React.MouseEvent) => {
      // Prevent click if we just performed a context menu action
      if (isContextMenuAction) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (isFolder) {
        onFolderSelect(node.id);
      } else {
        // For files, open the file viewer
        if (onFileSelect && node.id) {
          onFileSelect(node.id);
        }
      }
    };

    return (
      <div key={node.id || 'root'}>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              className={cn(
                "flex items-center gap-1 py-1 px-2 rounded cursor-pointer hover:bg-muted/50 transition-colors",
                isSelected && "bg-muted",
                level > 0 && "ml-4"
              )}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
            >
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFolder(node.id);
                  }}
                >
                  {node.isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              )}

              {!hasChildren && <div className="w-4" />}

              <div
                className="flex items-center gap-2 flex-1 min-w-0"
                onClick={handleClick}
              >
                <FileIcon
                  fileName={node.name}
                  mimeType={node.mimeType ?? undefined}
                  type={node.type}
                  isOpen={isFolder && node.isExpanded}
                  size="sm"
                />
                <span className="text-sm truncate">{node.name}</span>
              </div>
            </div>
          </ContextMenuTrigger>
          {canUpdate && onRename && node.id && (
            <ContextMenuContent
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <ContextMenuItem onSelect={(e) => {
                e.preventDefault();
                handleRenameClick(node);
              }}>
                <Edit className="mr-2 h-4 w-4" />
                Rename
              </ContextMenuItem>
            </ContextMenuContent>
          )}
        </ContextMenu>

        {node.isExpanded && isFolder && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className={cn("border rounded-lg bg-card", className)}>
        <div className="p-3 border-b">
          <h3 className="font-semibold text-sm">Documents & Folders</h3>
        </div>
        <ScrollArea className="h-[400px]">
          <div className="p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading...</div>
              </div>
            ) : (
              renderTreeNode(tree)
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Rename Dialog */}
      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={(open) => {
          setRenameDialogOpen(open);
          if (!open) {
            setNodeToRename(null);
          }
        }}
        file={selectedFile}
        onRename={handleRenameSubmit}
      />
    </>
  );
};
