'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Upload,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  RefreshCw,
  Settings,
  Download,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from '@/lib/types';
import { File } from '@/lib/types';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Breadcrumb } from './breadcrumb';
import { FileList } from './file-list';
import { FileViewer } from './file-viewer';
import { FolderTree } from './folder-tree';
import { FileSearch, SearchFilters } from './file-search';
import { StorageStats } from './storage-stats';
import { UploadProgress, UploadItem } from './upload-progress';
import { InlineUploadArea } from './inline-upload-area';
import { cn } from '@/lib/utils';

interface EnhancedFilesPageProps {
  user: User;
}

type ViewMode = 'grid' | 'list';
type SortField = 'name' | 'size' | 'type' | 'updatedAt' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export function EnhancedFilesPage({ user }: EnhancedFilesPageProps) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isInitialMount = useRef(true);
  const isNavigating = useRef(false);

  const [files, setFiles] = useState<File[]>([]);
  const [currentFolder, setCurrentFolder] = useState<File | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbPath, setBreadcrumbPath] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showSidebar, setShowSidebar] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [showInlineUpload, setShowInlineUpload] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Only render Radix UI components after client-side mount to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Dialogs and modals
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [viewerFile, setViewerFile] = useState<File | null>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  // Search and filters
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({ query: '' });
  const [filteredFiles, setFilteredFiles] = useState<File[]>([]);

  // Folder tree refresh trigger
  const [treeRefreshTrigger, setTreeRefreshTrigger] = useState<string | null>(null);
  const [treeRefreshFolderId, setTreeRefreshFolderId] = useState<string | null>(null);

  // User permissions state
  const [userPermissions, setUserPermissions] = useState<User['permissions']>(user.permissions || []);

  // Load user permissions on mount
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const userWithPermissions = await api.auth.getMe();
        setUserPermissions(userWithPermissions.permissions || []);
      } catch (error) {
        console.error('Failed to load user permissions:', error);
        setUserPermissions([]);
      }
    };

    // Only load if permissions are not already available
    if (!user.permissions || user.permissions.length === 0) {
      loadPermissions();
    }
  }, [user.permissions]);

  // Permissions - check both resource/action and name formats for compatibility
  const canCreate = (userPermissions || []).some(p =>
    (p.resource === 'files' && (p.action === 'create' || p.action === '*')) ||
    (p.name === 'files:create' || p.name === 'files:*' || p.name === '*:*')
  );

  // Debug: Log permissions for troubleshooting
  useEffect(() => {
    console.log('User permissions:', userPermissions);
    console.log('canCreate:', canCreate);
  }, [userPermissions, canCreate]);
  const canUpdate = (userPermissions || []).some(p =>
    (p.resource === 'files' && (p.action === 'update' || p.action === '*')) ||
    (p.name === 'files:update' || p.name === 'files:*' || p.name === '*:*')
  );
  const canDelete = (userPermissions || []).some(p =>
    (p.resource === 'files' && (p.action === 'delete' || p.action === '*')) ||
    (p.name === 'files:delete' || p.name === 'files:*' || p.name === '*:*')
  );
  const canDownload = (userPermissions || []).some(p =>
    (p.resource === 'files' && (p.action === 'download' || p.action === '*')) ||
    (p.name === 'files:download' || p.name === 'files:*' || p.name === '*:*')
  );

  // Update URL query parameter when folder changes (only when navigating, not when URL changes)
  const updateUrlFolder = useCallback((folderId: string | null) => {
    if (isNavigating.current) {
      const params = new URLSearchParams(searchParams.toString());
      if (folderId) {
        params.set('folder', folderId);
      } else {
        params.delete('folder');
      }
      router.replace(`?${params.toString()}`, { scroll: false });
      isNavigating.current = false;
    }
  }, [searchParams, router]);

  // Load files for current folder
  const loadFiles = useCallback(async (folderId: string | null = currentFolderId, updateUrl = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.files.getAll({
        parentId: folderId,
      });

      setFiles(response);
      setCurrentFolderId(folderId);

      // Update URL query parameter only if this is a navigation action
      if (updateUrl) {
        isNavigating.current = true;
        updateUrlFolder(folderId);
      }

      // Update current folder info
      if (folderId) {
        const folderInfo = await api.files.getById(folderId);
        setCurrentFolder(folderInfo);
      } else {
        setCurrentFolder(null);
      }

      // Update breadcrumb path
      await updateBreadcrumbPath(folderId);
    } catch (err: any) {
      setError(err.message || 'Failed to load files');
    } finally {
      setIsLoading(false);
    }
  }, [currentFolderId, updateUrlFolder]);

  // Update breadcrumb path
  const updateBreadcrumbPath = async (folderId: string | null) => {
    if (!folderId) {
      setBreadcrumbPath([]);
      return;
    }

    const path: File[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      try {
        const folder = await api.files.getById(currentId);
        path.unshift(folder);
        currentId = folder.parentId;
      } catch (error) {
        console.error('Failed to build breadcrumb path:', error);
        break;
      }
    }

    setBreadcrumbPath(path);
  };

  // Apply search filters and sorting
  useEffect(() => {
    let result = [...files];

    // Apply search filters
    if (searchFilters.query) {
      result = result.filter(file =>
        file.name.toLowerCase().includes(searchFilters.query.toLowerCase())
      );
    }

    if (searchFilters.type) {
      result = result.filter(file => file.type === searchFilters.type);
    }

    if (searchFilters.mimeType) {
      result = result.filter(file =>
        file.mimeType?.includes(searchFilters.mimeType!) ||
        searchFilters.mimeType === file.mimeType
      );
    }

    if (searchFilters.sizeMin !== undefined) {
      result = result.filter(file => (file.size || 0) >= searchFilters.sizeMin!);
    }

    if (searchFilters.sizeMax !== undefined) {
      result = result.filter(file => (file.size || 0) <= searchFilters.sizeMax!);
    }

    if (searchFilters.createdAfter) {
      const afterDate = new Date(searchFilters.createdAfter);
      result = result.filter(file => file.createdAt && new Date(file.createdAt) >= afterDate);
    }

    if (searchFilters.createdBefore) {
      const beforeDate = new Date(searchFilters.createdBefore);
      result = result.filter(file => file.createdAt && new Date(file.createdAt) <= beforeDate);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle special cases
      if (sortField === 'updatedAt' || sortField === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortField === 'size') {
        aValue = aValue || 0;
        bValue = bValue || 0;
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredFiles(result);
  }, [files, searchFilters, sortField, sortOrder]);

  // Load initial files from URL query parameter on mount
  useEffect(() => {
    if (isInitialMount.current) {
      const folderIdFromUrl = searchParams.get('folder');
      const initialFolderId = folderIdFromUrl || null;
      loadFiles(initialFolderId, false); // Don't update URL on initial load
      isInitialMount.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Handle URL changes (e.g., browser back/forward)
  useEffect(() => {
    if (!isInitialMount.current) {
      const folderIdFromUrl = searchParams.get('folder');
      const urlFolderId = folderIdFromUrl || null;

      // Only update if the URL folder ID differs from current state
      if (urlFolderId !== currentFolderId) {
        loadFiles(urlFolderId, false); // Don't update URL when reacting to URL changes
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, currentFolderId]); // React to URL changes - loadFiles excluded to prevent infinite loops

  // File operations
  const handleFileOpen = (file: File) => {
    if (file.type === 'folder') {
      loadFiles(file.id, true); // Update URL when navigating
    } else {
      setViewerFile(file);
    }
  };

  const handleFileDownload = async (file: File) => {
    try {
      const response = await api.files.getDownloadUrl(file.id);
      const link = document.createElement('a');
      link.href = response.url;
      link.download = response.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleFileRename = async (file: File, newName: string) => {
    try {
      await api.files.update(file.id, { name: newName });
      await loadFiles(currentFolderId, false); // Don't update URL on refresh
      toast({
        title: "File renamed",
        description: `Successfully renamed to "${newName}"`,
      });
    } catch (error: any) {
      console.error('Rename failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to rename file",
        variant: "destructive",
      });
    }
  };

  const handleFileDelete = async (file: File) => {
    try {
      const parentId = file.parentId;
      await api.files.delete(file.id);
      await loadFiles(currentFolderId, false); // Don't update URL on refresh
      // Refresh the folder tree for the parent folder
      setTreeRefreshFolderId(parentId);
      setTreeRefreshTrigger(`${parentId || 'null'}-${Date.now()}`);
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
      toast({
        title: "File deleted",
        description: `Successfully deleted "${file.name}"`,
      });
    } catch (error: any) {
      console.error('Delete failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const handleFileShare = (file: File) => {
    // TODO: Implement file sharing
    console.log('Share file:', file);
  };

  const handleFolderSelect = (folderId: string | null) => {
    loadFiles(folderId, true); // Update URL when navigating
  };

  const handleFileSelect = async (fileId: string) => {
    try {
      const file = await api.files.getById(fileId);
      if (file) {
        setViewerFile(file);
      }
    } catch (error) {
      console.error('Failed to load file:', error);
    }
  };

  const handleBreadcrumbClick = (folderId: string | null) => {
    loadFiles(folderId, true); // Update URL when navigating
  };

  const handleFileToggle = (file: File, selected: boolean) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(file.id);
      } else {
        newSet.delete(file.id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.id)));
    }
  };

  const handleBulkDelete = async () => {
    try {
      // Get parent IDs before deletion to refresh tree
      const filesToDelete = filteredFiles.filter(f => selectedFiles.has(f.id));
      const parentIds = new Set(filesToDelete.map(f => f.parentId));
      const count = selectedFiles.size;

      await Promise.all(
        Array.from(selectedFiles).map(fileId => api.files.delete(fileId))
      );
      await loadFiles(currentFolderId, false); // Don't update URL on refresh

      // Refresh folder tree for affected parents
      if (parentIds.size > 0) {
        const parentId = parentIds.has(null) ? null : Array.from(parentIds)[0];
        setTreeRefreshFolderId(parentId);
        setTreeRefreshTrigger(`${parentId || 'null'}-${Date.now()}`);
      }

      setSelectedFiles(new Set());
      toast({
        title: "Documents deleted",
        description: `Successfully deleted ${count} file${count !== 1 ? 's' : ''}`,
      });
    } catch (error: any) {
      console.error('Bulk delete failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete files",
        variant: "destructive",
      });
    }
  };

  const handleBulkDownload = async () => {
    // TODO: Implement bulk download
    console.log('Bulk download:', selectedFiles);
  };

  const handleCreateFolder = async (name: string, parentId?: string) => {
    try {
      const targetParentId = parentId || currentFolderId;
      await api.files.createFolder({
        name,
        parentId: targetParentId,
      });
      await loadFiles(currentFolderId, false); // Don't update URL on refresh
      // Refresh the folder tree for the parent folder
      setTreeRefreshFolderId(targetParentId);
      setTreeRefreshTrigger(`${targetParentId}-${Date.now()}`);
      setIsCreateFolderOpen(false);
      setFolderName('');
      toast({
        title: "Folder created",
        description: `Successfully created folder "${name}"`,
      });
    } catch (error: any) {
      console.error('Create folder failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create folder. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateFolderSubmit = () => {
    if (folderName.trim()) {
      handleCreateFolder(folderName.trim());
    }
  };

  const handleUploadComplete = async (files: File[]) => {
    // Reload files after successful upload
    await loadFiles(currentFolderId, false); // Don't update URL on refresh
    // Refresh the folder tree for the current folder
    setTreeRefreshFolderId(currentFolderId);
    setTreeRefreshTrigger(`${currentFolderId}-${Date.now()}`);
    const count = files.length;
    toast({
      title: "Upload complete",
      description: `Successfully uploaded ${count} file${count !== 1 ? 's' : ''}`,
    });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Documents</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStats(!showStats)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Folder Tree */}
          <div className="flex-1 overflow-hidden">
            <FolderTree
              currentFolderId={currentFolderId}
              onFolderSelect={handleFolderSelect}
              onFileSelect={handleFileSelect}
              className="h-full border-0 rounded-none"
              refreshTrigger={treeRefreshTrigger}
              refreshFolderId={treeRefreshFolderId}
            />
          </div>

          {/* Storage Stats */}
          {showStats && (
            <div className="border-t">
              <StorageStats
                className="border-0 rounded-none"
                isLoading={false}
                // stats would be loaded from API
              />
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b bg-card p-4 space-y-4">
          {/* Breadcrumb */}
          <Breadcrumb
            items={breadcrumbPath}
            onNavigate={handleBreadcrumbClick}
          />

          {/* Search */}
          <FileSearch
            onSearch={setSearchFilters}
          />

          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Create Actions - Always visible in toolbar */}
              <Button
                size="sm"
                onClick={() => setShowInlineUpload(!showInlineUpload)}
                variant={showInlineUpload ? 'default' : 'outline'}
              >
                <Upload className="h-4 w-4 mr-2" />
                {showInlineUpload ? 'Hide Upload' : 'Upload Files'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateFolderOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Folder
              </Button>
              <Separator orientation="vertical" className="h-6" />

              {/* Bulk Actions */}
              {selectedFiles.size > 0 && (
                <>
                  <Badge variant="secondary">
                    {selectedFiles.size} selected
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedFiles.size === filteredFiles.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  {canDownload && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkDownload}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkDelete}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                  <Separator orientation="vertical" className="h-6" />
                </>
              )}

              {/* View Mode */}
              <div className="flex items-center gap-1 border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Sort Controls */}
              {isMounted ? (
                <Select value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                    <SelectItem value="updatedAt">Modified</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="w-32 h-10 rounded-md border border-input bg-background px-3 py-2 flex items-center justify-between">
                  <span className="text-sm capitalize">{sortField}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => loadFiles(currentFolderId, false)}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                {showSidebar ? '←' : '→'}
              </Button>
            </div>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Inline Upload Area - Always visible when enabled */}
          {canCreate && showInlineUpload && (
            <InlineUploadArea
              parentId={currentFolderId}
              onUploadComplete={handleUploadComplete}
              onUploadError={(error, file) => {
                console.error('Upload error:', error);
                toast({
                  title: "Upload failed",
                  description: file?.name
                    ? `Failed to upload "${file.name}": ${error.message || 'Unknown error'}`
                    : error.message || 'Unknown error occurred during upload',
                  variant: "destructive",
                });
              }}
            />
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-red-500">
              {error}
            </div>
          ) : (
            <>
              {/* Empty state with upload prompt */}
              {filteredFiles.length === 0 && canCreate && !showInlineUpload && (
                <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Get started by uploading your first document
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        size="sm"
                        onClick={() => setShowInlineUpload(true)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Files
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <FileList
                files={filteredFiles}
                viewMode={viewMode}
                onOpen={handleFileOpen}
                onDownload={canDownload ? handleFileDownload : undefined}
                onRename={canUpdate ? handleFileRename : undefined}
                onDelete={canDelete ? handleFileDelete : undefined}
                onView={setViewerFile}
                onShare={handleFileShare}
                selectedFiles={selectedFiles}
                onFileSelect={handleFileToggle}
                canDownload={canDownload}
                canUpdate={canUpdate}
                canDelete={canDelete}
              />
            </>
          )}
        </div>
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                placeholder="My Folder"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && folderName.trim()) {
                    handleCreateFolderSubmit();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateFolderOpen(false);
                setFolderName('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolderSubmit}
              disabled={!folderName.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Viewer */}
      <FileViewer
        file={viewerFile}
        isOpen={!!viewerFile}
        onClose={() => setViewerFile(null)}
        onDownload={canDownload ? handleFileDownload : undefined}
      />

      {/* Upload Progress */}
      <UploadProgress
        uploads={uploads}
        onCancel={(uploadId) => {
          setUploads(prev => prev.filter(u => u.id !== uploadId));
        }}
        onClear={() => setUploads([])}
      />
    </div>
  );
}
