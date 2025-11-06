export interface User {
  id: string
  email: string
  name: string
  isSystemAccount?: boolean
  createdAt?: Date | null
  updatedAt?: Date | null
  roles?: Role[]
  permissions?: Permission[]
  directPermissions?: Permission[]
}

export interface Role {
  id: string
  name: string
  description: string | null
  permissions?: Permission[]
}

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description: string | null
}

export interface Activity {
  id: string
  userId: string | null
  action: string
  resourceType: string
  resourceId: string | null
  description: string | null
  metadata: any
  createdAt: Date | null
  userName: string | null
  userEmail: string | null
}

export interface File {
  id: string
  name: string
  type: 'file' | 'folder'
  parentId: string | null
  path: string
  originalName?: string | null
  mimeType?: string | null
  size?: number | null
  storagePath?: string | null
  storageDriver?: 'local' | 's3' | 'r2' | null
  checksum?: string | null
  createdBy: string
  metadata?: Record<string, any> | null
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt?: Date | null
  parent?: File | null
  creator?: User | null
}

