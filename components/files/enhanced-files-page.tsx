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
  Table,
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
import { TableView } from './table-view';
import { ViewTabs } from './view-tabs';
import { FileViewer } from './file-viewer';
import { FolderTree } from './folder-tree';
import { FileSearch, SearchFilters } from './file-search';
import { StorageStats } from './storage-stats';
import { InlineUploadArea } from './inline-upload-area';
import { cn } from '@/lib/utils';

interface EnhancedFilesPageProps {
  user: User;
}

type ViewMode = 'tree' | 'table' | 'grid' | 'list';
type MainViewMode = 'table' | 'tree'; // Main view switcher
type SortField = 'name' | 'size' | 'type' | 'updatedAt' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export const EnhancedFilesPage = ({ user }: EnhancedFilesPageProps) => {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isInitialMount = useRef(true);

  // Separate folder state for each view
  const [tableFolderId, setTableFolderId] = useState<string | null>(null);
  const [treeFolderId, setTreeFolderId] = useState<string | null>(null);

  // Navigation history for each view
  const [tableHistory, setTableHistory] = useState<string[]>([]);
  const [treeHistory, setTreeHistory] = useState<string[]>([]);

  // Current folder info and breadcrumbs for each view
  const [tableCurrentFolder, setTableCurrentFolder] = useState<File | null>(null);
  const [treeCurrentFolder, setTreeCurrentFolder] = useState<File | null>(null);
  const [tableBreadcrumbPath, setTableBreadcrumbPath] = useState<File[]>([]);
  const [treeBreadcrumbPath, setTreeBreadcrumbPath] = useState<File[]>([]);

  // Shared state for tree view (loads all files)
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [mainViewMode, setMainViewMode] = useState<MainViewMode>('table'); // Default to table view

  // Get current folder ID based on active view
  const currentFolderId = mainViewMode === 'table' ? tableFolderId : treeFolderId;
  const currentFolder = mainViewMode === 'table' ? tableCurrentFolder : treeCurrentFolder;
  const breadcrumbPath = mainViewMode === 'table' ? tableBreadcrumbPath : treeBreadcrumbPath;
  const [viewMode, setViewMode] = useState<ViewMode>('grid'); // For grid/list views within tree view
  // Initialize sort from URL or defaults
  const [sortField, setSortField] = useState<SortField>(() => {
    const urlSortField = searchParams.get('sortField');
    return (urlSortField && ['name', 'createdAt', 'size'].includes(urlSortField))
      ? (urlSortField as SortField)
      : 'name';
  });
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    const urlSortOrder = searchParams.get('sortOrder');
    return (urlSortOrder === 'asc' || urlSortOrder === 'desc')
      ? urlSortOrder
      : 'asc';
  });
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showSidebar, setShowSidebar] = useState(false); // Hide sidebar by default for table view
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

  // Search and filters
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({ query: '' });
  const [filteredFiles, setFilteredFiles] = useState<File[]>([]);

  // Folder tree refresh trigger
  const [treeRefreshTrigger, setTreeRefreshTrigger] = useState<string | null>(null);
  const [treeRefreshFolderId, setTreeRefreshFolderId] = useState<string | null>(null);

  // Table view refresh trigger
  const [tableRefreshTrigger, setTableRefreshTrigger] = useState<string | null>(null);

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

  // Update URL query parameter when folder changes
  const updateUrlFolder = useCallback((folderId: string | null, view?: 'table' | 'tree') => {
    const params = new URLSearchParams(searchParams.toString());
    if (folderId) {
      params.set('folder', folderId);
    } else {
      params.delete('folder');
    }
    // Optionally add view parameter to track which view is active
    if (view) {
      params.set('view', view);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // Load files for tree view (all files, no pagination)
  const loadTreeFiles = useCallback(async (folderId: string | null) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.files.getAll({
        parentId: folderId,
      });

      // Handle both array and paginated response
      const filesArray = Array.isArray(response) ? response : (response as any).files || [];
      setFiles(filesArray);
      setTreeFolderId(folderId);

      // Update navigation history
      if (folderId) {
        setTreeHistory(prev => {
          const newHistory = [...prev];
          if (!newHistory.includes(folderId)) {
            newHistory.push(folderId);
          }
          return newHistory;
        });
      } else {
        setTreeHistory([]);
      }

      // Update current folder info
      if (folderId) {
        const folderInfo = await api.files.getById(folderId);
        setTreeCurrentFolder(folderInfo);
      } else {
        setTreeCurrentFolder(null);
      }

      // Update breadcrumb path
      await updateTreeBreadcrumbPath(folderId);
    } catch (err: any) {
      setError(err.message || 'Failed to load files');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update breadcrumb path for tree view
  const updateTreeBreadcrumbPath = async (folderId: string | null) => {
    if (!folderId) {
      setTreeBreadcrumbPath([]);
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

    setTreeBreadcrumbPath(path);
  };

  // Update breadcrumb path for table view
  const updateTableBreadcrumbPath = async (folderId: string | null) => {
    if (!folderId) {
      setTableBreadcrumbPath([]);
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

    setTableBreadcrumbPath(path);
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

  // Update URL with sort parameters
  const updateUrlSort = useCallback((field: SortField, order: SortOrder) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sortField', field);
    params.set('sortOrder', order);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // Table-specific sort handling
  const handleTableSort = (field: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'type') => {
    const newField = field as SortField;
    const newOrder = sortField === newField
      ? (sortOrder === 'asc' ? 'desc' : 'asc')
      : 'asc';

    setSortField(newField);
    setSortOrder(newOrder);
    updateUrlSort(newField, newOrder);
  };

  // Sync sort params from URL when they change (for browser back/forward navigation)
  useEffect(() => {
    const urlSortField = searchParams.get('sortField');
    const urlSortOrder = searchParams.get('sortOrder');

    // Update state only if URL has valid values that differ from current state
    if (urlSortField && ['name', 'createdAt', 'size', 'type', 'updatedAt'].includes(urlSortField)) {
      if (urlSortField !== sortField) {
        setSortField(urlSortField as SortField);
      }
    }

    if (urlSortOrder === 'asc' || urlSortOrder === 'desc') {
      if (urlSortOrder !== sortOrder) {
        setSortOrder(urlSortOrder);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Only depend on searchParams to avoid loops

  // Load initial files from URL query parameter on mount
  useEffect(() => {
    if (isInitialMount.current) {
      const folderIdFromUrl = searchParams.get('folder');
      const viewFromUrl = searchParams.get('view') as 'table' | 'tree' | null;
      const initialFolderId = folderIdFromUrl || null;

      // Set initial view mode if specified in URL
      if (viewFromUrl === 'table' || viewFromUrl === 'tree') {
        setMainViewMode(viewFromUrl);
        if (viewFromUrl === 'tree') {
          setShowSidebar(true);
        } else {
          setShowSidebar(false);
        }
      }

      // Initialize both views with the same folder from URL, but they'll diverge after navigation
      setTableFolderId(initialFolderId);
      setTreeFolderId(initialFolderId);
      if (initialFolderId) {
        updateTableBreadcrumbPath(initialFolderId);
        loadTreeFiles(initialFolderId);
      } else {
        loadTreeFiles(null);
      }
      isInitialMount.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Handle URL changes (browser back/forward) - update active view
  useEffect(() => {
    if (!isInitialMount.current) {
      const folderIdFromUrl = searchParams.get('folder');
      const viewFromUrl = searchParams.get('view') as 'table' | 'tree' | null;
      const urlFolderId = folderIdFromUrl || null;

      // Update view mode if changed in URL
      if (viewFromUrl === 'table' || viewFromUrl === 'tree') {
        if (viewFromUrl !== mainViewMode) {
          setMainViewMode(viewFromUrl);
          if (viewFromUrl === 'tree') {
            setShowSidebar(true);
          } else {
            setShowSidebar(false);
          }
        }
      }

      // Update folder based on active view
      if (mainViewMode === 'table') {
        if (urlFolderId !== tableFolderId) {
          setTableFolderId(urlFolderId);
          if (urlFolderId) {
            updateTableBreadcrumbPath(urlFolderId);
          } else {
            setTableBreadcrumbPath([]);
          }
        }
      } else {
        if (urlFolderId !== treeFolderId) {
          loadTreeFiles(urlFolderId);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // File operations
  const handleFileOpen = async (file: File) => {
    if (file.type === 'folder') {
      if (mainViewMode === 'table') {
        // Navigate in table view
        setTableFolderId(file.id);
        setTableHistory(prev => {
          const newHistory = [...prev];
          if (!newHistory.includes(file.id)) {
            newHistory.push(file.id);
          }
          return newHistory;
        });
        // Update current folder info
        try {
          const folderInfo = await api.files.getById(file.id);
          setTableCurrentFolder(folderInfo);
        } catch (error) {
          console.error('Failed to load folder info:', error);
        }
        updateTableBreadcrumbPath(file.id);
        // Update URL
        updateUrlFolder(file.id, 'table');
      } else {
        // Navigate in tree view
        loadTreeFiles(file.id);
        updateUrlFolder(file.id, 'tree');
      }
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
      // Refresh the appropriate view
      if (mainViewMode === 'table') {
        // Trigger table view refresh
        setTableRefreshTrigger(`${tableFolderId || 'null'}-${Date.now()}`);
      } else {
        await loadTreeFiles(treeFolderId);
      }
      // Refresh the folder tree sidebar for the parent folder
      const parentId = file.parentId;
      setTreeRefreshFolderId(parentId);
      setTreeRefreshTrigger(`${parentId || 'null'}-${Date.now()}`);
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
      // Refresh the appropriate view
      if (mainViewMode === 'table') {
        // Trigger table view refresh
        setTableRefreshTrigger(`${tableFolderId || 'null'}-${Date.now()}`);
      } else {
        await loadTreeFiles(treeFolderId);
      }
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
    toast({
      title: "Share feature",
      description: "File sharing is not yet implemented.",
    });
  };

  const handleFolderSelect = async (folderId: string | null) => {
    if (mainViewMode === 'table') {
      // Navigate in table view
      setTableFolderId(folderId);
      if (folderId) {
        setTableHistory(prev => {
          const newHistory = [...prev];
          if (!newHistory.includes(folderId)) {
            newHistory.push(folderId);
          }
          return newHistory;
        });
        // Update current folder info
        try {
          const folderInfo = await api.files.getById(folderId);
          setTableCurrentFolder(folderInfo);
        } catch (error) {
          console.error('Failed to load folder info:', error);
        }
        updateTableBreadcrumbPath(folderId);
      } else {
        setTableHistory([]);
        setTableBreadcrumbPath([]);
        setTableCurrentFolder(null);
      }
      // Update URL
      updateUrlFolder(folderId, 'table');
    } else {
      // Navigate in tree view
      loadTreeFiles(folderId);
      updateUrlFolder(folderId, 'tree');
    }
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

  const handleBreadcrumbClick = async (folderId: string | null) => {
    if (mainViewMode === 'table') {
      // Navigate in table view
      setTableFolderId(folderId);
      if (folderId) {
        setTableHistory(prev => {
          const newHistory = [...prev];
          if (!newHistory.includes(folderId)) {
            newHistory.push(folderId);
          }
          return newHistory;
        });
        // Update current folder info
        try {
          const folderInfo = await api.files.getById(folderId);
          setTableCurrentFolder(folderInfo);
        } catch (error) {
          console.error('Failed to load folder info:', error);
        }
        updateTableBreadcrumbPath(folderId);
      } else {
        setTableHistory([]);
        setTableBreadcrumbPath([]);
        setTableCurrentFolder(null);
      }
      // Update URL
      updateUrlFolder(folderId, 'table');
    } else {
      // Navigate in tree view
      loadTreeFiles(folderId);
      updateUrlFolder(folderId, 'tree');
    }
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

      // Refresh the appropriate view
      if (mainViewMode === 'table') {
        // Trigger table view refresh
        setTableRefreshTrigger(`${tableFolderId || 'null'}-${Date.now()}`);
      } else {
        await loadTreeFiles(treeFolderId);
      }

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
    toast({
      title: "Bulk download",
      description: "Bulk download is not yet implemented.",
    });
  };

  const handleCreateFolder = async (name: string, parentId?: string) => {
    try {
      const targetParentId = parentId || (mainViewMode === 'table' ? tableFolderId : treeFolderId);
      await api.files.createFolder({
        name,
        parentId: targetParentId,
      });
      // Refresh the appropriate view
      if (mainViewMode === 'table') {
        // Trigger table view refresh
        setTableRefreshTrigger(`${targetParentId || 'null'}-${Date.now()}`);
      } else {
        await loadTreeFiles(treeFolderId);
      }
      // Refresh the folder tree for the parent folder
      setTreeRefreshFolderId(targetParentId);
      setTreeRefreshTrigger(`${targetParentId || 'null'}-${Date.now()}`);
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
    const targetFolderId = mainViewMode === 'table' ? tableFolderId : treeFolderId;
    if (mainViewMode === 'table') {
      // Trigger table view refresh
      setTableRefreshTrigger(`${tableFolderId || 'null'}-${Date.now()}`);
    } else {
      await loadTreeFiles(treeFolderId);
    }
    // Refresh the folder tree for the current folder
    setTreeRefreshFolderId(targetFolderId);
    setTreeRefreshTrigger(`${targetFolderId || 'null'}-${Date.now()}`);
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
              currentFolderId={treeFolderId}
              onFolderSelect={handleFolderSelect}
              onFileSelect={handleFileSelect}
              onRename={canUpdate ? handleFileRename : undefined}
              canUpdate={canUpdate}
              className="h-full border-0 rounded-none"
              refreshTrigger={treeRefreshTrigger}
              sortField={sortField === 'name' || sortField === 'createdAt' || sortField === 'updatedAt' || sortField === 'size' || sortField === 'type' ? sortField : 'name'}
              sortOrder={sortOrder}
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
          {/* Title */}
          <h1 className="text-2xl font-semibold">Documents</h1>

          {/* View Tabs */}
          <ViewTabs
            activeView={mainViewMode}
            onViewChange={(view) => {
              setMainViewMode(view);
              if (view === 'tree') {
                setShowSidebar(true);
              } else {
                setShowSidebar(false);
              }
              // Update URL with view parameter
              const currentFolderId = view === 'table' ? tableFolderId : treeFolderId;
              updateUrlFolder(currentFolderId, view);
            }}
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
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload files
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsCreateFolderOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add new folder
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

              {/* View Mode Switcher (only for tree view) */}
              {mainViewMode === 'tree' && (
                <div className="flex items-center gap-1 border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    title="Grid View"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    title="List View"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Sort Controls */}
              {isMounted ? (
                <Select value={sortField} onValueChange={(value: SortField) => {
                  setSortField(value);
                  updateUrlSort(value, sortOrder);
                }}>
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
                onClick={() => {
                  const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
                  setSortOrder(newOrder);
                  updateUrlSort(sortField, newOrder);
                }}
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (mainViewMode === 'table') {
                    // Table view manages its own refresh
                  } else {
                    loadTreeFiles(treeFolderId);
                  }
                }}
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

        {/* File Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Inline Upload Area - Always visible when enabled */}
          {canCreate && showInlineUpload && (
            <div className="p-4 border-b">
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
            </div>
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
              {/* Table View - Server-side pagination */}
              {mainViewMode === 'table' && (
                <TableView
                  currentFolderId={tableFolderId}
                  breadcrumbPath={tableBreadcrumbPath}
                  refreshTrigger={tableRefreshTrigger}
                  searchFilters={searchFilters}
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
                  sortField={sortField === 'name' || sortField === 'createdAt' || sortField === 'updatedAt' || sortField === 'size' || sortField === 'type' ? sortField : 'name'}
                  sortOrder={sortOrder}
                  onSort={handleTableSort}
                  onFolderChange={async (folderId) => {
                    setTableFolderId(folderId);
                    if (folderId) {
                      setTableHistory(prev => {
                        const newHistory = [...prev];
                        if (!newHistory.includes(folderId)) {
                          newHistory.push(folderId);
                        }
                        return newHistory;
                      });
                      // Update current folder info
                      try {
                        const folderInfo = await api.files.getById(folderId);
                        setTableCurrentFolder(folderInfo);
                      } catch (error) {
                        console.error('Failed to load folder info:', error);
                      }
                      updateTableBreadcrumbPath(folderId);
                    } else {
                      setTableHistory([]);
                      setTableBreadcrumbPath([]);
                      setTableCurrentFolder(null);
                    }
                    // Update URL
                    updateUrlFolder(folderId, 'table');
                  }}
                  onBreadcrumbNavigate={handleBreadcrumbClick}
                />
              )}

              {/* Tree View - Client-side (all files loaded) */}
              {mainViewMode === 'tree' && (
                <>
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
                      {/* Grid/List View */}
                      {(viewMode === 'grid' || viewMode === 'list') && (
                        <div className="flex-1 overflow-auto p-4 space-y-4">
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
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
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

    </div>
  );
};
