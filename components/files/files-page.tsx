"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileList } from "./file-list"
import { Breadcrumb } from "./breadcrumb"
import { files as filesApi, auth, ApiError } from "@/lib/api"
import type { File, Permission } from "@/lib/types"
import { formatDate } from "@/lib/utils"

interface FilesPageProps {
  user: {
    id: string
    email: string
    name: string
  }
}

export function FilesPage({ user }: FilesPageProps) {
  const [fileItems, setFileItems] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [folderPath, setFolderPath] = useState<File[]>([])
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingFile, setEditingFile] = useState<File | null>(null)
  const [folderName, setFolderName] = useState("")
  const [renameName, setRenameName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [canCreate, setCanCreate] = useState(false)
  const [canUpdate, setCanUpdate] = useState(false)
  const [canDelete, setCanDelete] = useState(false)
  const [canDownload, setCanDownload] = useState(false)

  // Load user permissions
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const userData = await auth.getMe()
        const permissions = userData.permissions || []

        setCanCreate(
          permissions.some(
            (p: Permission) =>
              p.name === "files:create" || p.name === "files:*" || p.name === "*:*"
          )
        )
        setCanUpdate(
          permissions.some(
            (p: Permission) =>
              p.name === "files:update" || p.name === "files:*" || p.name === "*:*"
          )
        )
        setCanDelete(
          permissions.some(
            (p: Permission) =>
              p.name === "files:delete" || p.name === "files:*" || p.name === "*:*"
          )
        )
        setCanDownload(
          permissions.some(
            (p: Permission) =>
              p.name === "files:download" || p.name === "files:*" || p.name === "*:*"
          )
        )
      } catch (error) {
        console.error("Error loading permissions:", error)
      }
    }

    loadPermissions()
  }, [])

  // Load files
  const loadFiles = async (folderId: string | null = null) => {
    setIsLoading(true)
    setError(null)
    try {
      const files = await filesApi.getAll({ parentId: folderId })
      setFileItems(files)
    } catch (err: any) {
      setError(err.message || "Failed to load files")
      console.error("Error loading files:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Load folder path
  const loadFolderPath = async (folderId: string | null) => {
    if (!folderId) {
      setFolderPath([])
      return
    }

    try {
      const path: File[] = []
      let currentId: string | null = folderId

      while (currentId) {
        const folder = await filesApi.getById(currentId)
        if (!folder) break
        path.unshift(folder)
        currentId = folder.parentId
      }

      setFolderPath(path)
    } catch (error) {
      console.error("Error loading folder path:", error)
      setFolderPath([])
    }
  }

  useEffect(() => {
    loadFiles(currentFolderId)
    loadFolderPath(currentFolderId)
  }, [currentFolderId])

  const handleNavigate = async (folderId: string | null) => {
    setCurrentFolderId(folderId)
  }

  const handleOpen = (file: File) => {
    if (file.type === "folder") {
      setCurrentFolderId(file.id)
    }
  }

  const handleUpload = async (file: File, name?: string) => {
    try {
      await filesApi.uploadFile(file, currentFolderId, name)
      await loadFiles(currentFolderId)
    } catch (err: any) {
      throw err
    }
  }

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      setError("Folder name is required")
      return
    }

    try {
      await filesApi.createFolder({
        name: folderName.trim(),
        parentId: currentFolderId,
      })
      setFolderName("")
      setIsFolderDialogOpen(false)
      await loadFiles(currentFolderId)
    } catch (err: any) {
      setError(err.message || "Failed to create folder")
    }
  }

  const handleRename = async () => {
    if (!editingFile || !renameName.trim()) {
      setError("Name is required")
      return
    }

    try {
      await filesApi.update(editingFile.id, { name: renameName.trim() })
      setRenameName("")
      setEditingFile(null)
      setIsRenameDialogOpen(false)
      await loadFiles(currentFolderId)
    } catch (err: any) {
      setError(err.message || "Failed to rename")
    }
  }

  const handleDelete = async () => {
    if (!editingFile) return

    try {
      await filesApi.delete(editingFile.id)
      setEditingFile(null)
      setIsDeleteDialogOpen(false)
      await loadFiles(currentFolderId)
    } catch (err: any) {
      setError(err.message || "Failed to delete")
    }
  }

  const handleDownload = async (file: File) => {
    try {
      const { url } = await filesApi.getDownloadUrl(file.id)
      window.open(url, "_blank")
    } catch (err: any) {
      setError(err.message || "Failed to download file")
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Files</h1>
          <p className="text-muted-foreground mt-1">Manage your files and folders</p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <>
              <Button onClick={() => setIsFolderDialogOpen(true)}>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                New Folder
              </Button>
            </>
          )}
        </div>
      </div>

      {folderPath.length > 0 && (
        <Breadcrumb items={folderPath} onNavigate={handleNavigate} />
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      ) : (
        <FileList
          files={fileItems}
          onOpen={handleOpen}
          onDownload={handleDownload}
          onRename={(file) => {
            setEditingFile(file)
            setRenameName(file.name)
            setIsRenameDialogOpen(true)
          }}
          onDelete={(file) => {
            setEditingFile(file)
            setIsDeleteDialogOpen(true)
          }}
          canDownload={canDownload}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />
      )}

      {/* Create Folder Dialog */}
      <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>Enter a name for the new folder</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="My Folder"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateFolder()
                  }
                }}
              />
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFolderDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
            <DialogDescription>
              Enter a new name for {editingFile?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="renameName">Name</Label>
              <Input
                id="renameName"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRename()
                  }
                }}
              />
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {editingFile?.type === "folder" ? "Folder" : "File"}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{editingFile?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

