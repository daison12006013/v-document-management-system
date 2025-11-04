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

