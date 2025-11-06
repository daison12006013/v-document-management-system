'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { File } from '@/lib/types';
import { api } from '@/lib/api';
import { FileIcon } from './file-icon';

interface FolderTreeProps {
  currentFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onFileSelect?: (fileId: string) => void;
  className?: string;
  refreshTrigger?: string | null; // When this changes, refresh the specified folder
  refreshFolderId?: string | null; // Which folder to refresh when refreshTrigger changes
}

interface TreeNode {
  id: string | null;
  name: string;
  type: 'file' | 'folder';
  mimeType?: string | null;
  parentId: string | null;
  children: TreeNode[];
  isExpanded: boolean;
  isLoading: boolean;
}

export function FolderTree({ currentFolderId, onFolderSelect, onFileSelect, className, refreshTrigger, refreshFolderId }: FolderTreeProps) {
  const [tree, setTree] = useState<TreeNode>({
    id: null,
    name: 'Root',
    type: 'folder',
    parentId: null,
    children: [],
    isExpanded: true,
    isLoading: false,
  });
  const treeRef = useRef(tree);
  treeRef.current = tree;

  // Load root folders on mount
  useEffect(() => {
    loadFolders(null);
  }, []);

  // When currentFolderId changes, load and expand the path to that folder
  useEffect(() => {
    if (currentFolderId !== null) {
      loadFolderPath(currentFolderId);
    }
  }, [currentFolderId]);

  // Refresh a specific folder when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      refreshFolder(refreshFolderId !== undefined ? refreshFolderId : null);
    }
  }, [refreshTrigger, refreshFolderId]);

  const loadFolders = async (parentId: string | null) => {
    try {
      // Load both files and folders
      const items = await api.files.getAll({
        parentId,
      });

      setTree(prevTree => updateTreeNode(prevTree, parentId, items));
    } catch (error) {
      console.error('Failed to load items:', error);
    }
  };

  const updateTreeNode = (node: TreeNode, targetId: string | null, items: File[]): TreeNode => {
    if (node.id === targetId) {
      return {
        ...node,
        children: items.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type,
          mimeType: item.mimeType,
          parentId: item.parentId,
          children: [],
          isExpanded: false,
          isLoading: false,
        })),
        isLoading: false,
      };
    }

    return {
      ...node,
      children: node.children.map(child => updateTreeNode(child, targetId, items)),
    };
  };

  // Load and expand the path to a specific folder
  const loadFolderPath = async (folderId: string) => {
    try {
      // Get the folder to find its parent
      const folder = await api.files.getById(folderId);
      if (!folder) return;

      // Build the path from root to this folder
      const path: File[] = [];
      let currentId: string | null = folderId;

      while (currentId) {
        const currentFolder = await api.files.getById(currentId);
        if (!currentFolder) break;
        path.unshift(currentFolder);
        currentId = currentFolder.parentId;
      }

      // Load children for each folder in the path first, then expand
      for (let i = 0; i < path.length; i++) {
        const folderInPath = path[i];

        // Check if this folder exists in the tree and if it has children loaded
        const existingNode = findTreeNode(treeRef.current, folderInPath.id);
        const needsLoad = !existingNode || existingNode.children.length === 0;

        // Load children first if needed
        if (needsLoad) {
          await loadFolders(folderInPath.id);
        }

        // Then expand the folder
        setTree(prevTree => {
          const node = findTreeNode(prevTree, folderInPath.id);
          if (node && !node.isExpanded) {
            return expandTreeNode(prevTree, folderInPath.id);
          }
          return prevTree;
        });
      }
    } catch (error) {
      console.error('Failed to load folder path:', error);
    }
  };

  const expandTreeNode = (node: TreeNode, targetId: string | null): TreeNode => {
    if (node.id === targetId) {
      return {
        ...node,
        isExpanded: true,
      };
    }

    return {
      ...node,
      children: node.children.map(child => expandTreeNode(child, targetId)),
    };
  };

  const toggleFolder = async (folderId: string | null) => {
    setTree(prevTree => {
      const updated = toggleTreeNode(prevTree, folderId);
      // After toggling, check if we need to load children
      const node = findTreeNode(updated, folderId);
      if (node && node.isExpanded && node.children.length === 0) {
        // Load children asynchronously
        loadFolders(folderId);
      }
      return updated;
    });
  };

  const toggleTreeNode = (node: TreeNode, targetId: string | null): TreeNode => {
    if (node.id === targetId) {
      return {
        ...node,
        isExpanded: !node.isExpanded,
      };
    }

    return {
      ...node,
      children: node.children.map(child => toggleTreeNode(child, targetId)),
    };
  };

  const findTreeNode = (node: TreeNode, targetId: string | null): TreeNode | null => {
    if (node.id === targetId) return node;

    for (const child of node.children) {
      const found = findTreeNode(child, targetId);
      if (found) return found;
    }

    return null;
  };

  // Refresh a specific folder in the tree (useful after creating/deleting folders)
  const refreshFolder = async (folderId: string | null) => {
    await loadFolders(folderId);
  };

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const isSelected = node.id === currentFolderId;
    const isFolder = node.type === 'folder';
    const hasChildren = isFolder && (node.children.length > 0 || node.id === null); // Only folders can have children, root always has potential children

    const handleClick = () => {
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

        {node.isExpanded && isFolder && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("border rounded-lg bg-card", className)}>
      <div className="p-3 border-b">
        <h3 className="font-semibold text-sm">Documents & Folders</h3>
      </div>
      <ScrollArea className="h-[400px]">
        <div className="p-2">
          {renderTreeNode(tree)}
        </div>
      </ScrollArea>
    </div>
  );
}
