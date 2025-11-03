-- RBAC Queries with Wildcard Permission Support

-- ============================================
-- Roles
-- ============================================

-- name: GetRole :one
SELECT * FROM roles
WHERE id = $1 LIMIT 1;

-- name: GetRoleByName :one
SELECT * FROM roles
WHERE name = $1 LIMIT 1;

-- name: ListRoles :many
SELECT * FROM roles
ORDER BY created_at DESC;

-- name: CreateRole :one
INSERT INTO roles (
    name, description
) VALUES (
    $1, $2
)
RETURNING *;

-- name: UpdateRole :one
UPDATE roles
SET
    name = $2,
    description = $3,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteRole :exec
DELETE FROM roles
WHERE id = $1;

-- ============================================
-- Permissions
-- ============================================

-- name: GetPermission :one
SELECT * FROM permissions
WHERE id = $1 LIMIT 1;

-- name: GetPermissionByName :one
SELECT * FROM permissions
WHERE name = $1 LIMIT 1;

-- name: ListPermissions :many
SELECT * FROM permissions
ORDER BY resource, action;

-- name: ListPermissionsByResource :many
SELECT * FROM permissions
WHERE resource = $1
ORDER BY action;

-- name: CreatePermission :one
INSERT INTO permissions (
    name, resource, action, description
) VALUES (
    $1, $2, $3, $4
)
RETURNING *;

-- name: UpdatePermission :one
UPDATE permissions
SET
    name = $2,
    resource = $3,
    action = $4,
    description = $5,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeletePermission :exec
DELETE FROM permissions
WHERE id = $1;

-- ============================================
-- Role Permissions
-- ============================================

-- name: GetRolePermissions :many
SELECT p.*
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
WHERE rp.role_id = $1
ORDER BY p.resource, p.action;

-- name: AddPermissionToRole :exec
INSERT INTO role_permissions (role_id, permission_id)
VALUES ($1, $2)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- name: RemovePermissionFromRole :exec
DELETE FROM role_permissions
WHERE role_id = $1 AND permission_id = $2;

-- name: ClearRolePermissions :exec
DELETE FROM role_permissions
WHERE role_id = $1;

-- ============================================
-- User Roles
-- ============================================

-- name: GetUserRoles :many
SELECT r.*
FROM roles r
JOIN user_roles ur ON r.id = ur.role_id
WHERE ur.user_id = $1
  AND ur.deleted_at IS NULL
ORDER BY ur.assigned_at DESC;

-- name: AssignRoleToUser :exec
INSERT INTO user_roles (user_id, role_id, assigned_by)
VALUES ($1, $2, $3)
ON CONFLICT (user_id, role_id) DO UPDATE
SET deleted_at = NULL,
    assigned_at = NOW(),
    assigned_by = $3;

-- name: RemoveRoleFromUser :exec
UPDATE user_roles
SET deleted_at = NOW()
WHERE user_id = $1 AND role_id = $2 AND deleted_at IS NULL;

-- name: ClearUserRoles :exec
UPDATE user_roles
SET deleted_at = NOW()
WHERE user_id = $1 AND deleted_at IS NULL;

-- ============================================
-- Permission Checking (with Wildcard Support)
-- ============================================

-- name: CheckUserPermission :one
-- Checks if user has a specific permission (supports wildcard matching)
-- Returns true if user has the exact permission or a matching wildcard permission
SELECT user_has_permission($1, $2, $3) as has_permission;

-- name: GetUserPermissions :many
-- Returns all permissions for a user (including wildcard permissions)
SELECT DISTINCT p.*
FROM user_roles ur
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE ur.user_id = $1
  AND ur.deleted_at IS NULL
ORDER BY p.resource, p.action;

-- name: CheckUserPermissionByName :one
-- Checks if user has a permission by name (e.g., "users:read")
-- Supports wildcard matching
SELECT EXISTS(
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = $1
      AND ur.deleted_at IS NULL
      AND (
          -- Exact match
          p.name = $2
          OR
          -- Wildcard match: resource:* matches all actions on resource
          (p.resource = split_part($2, ':', 1) AND p.action = '*')
          OR
          -- Wildcard match: *:action matches action on all resources
          (p.resource = '*' AND p.action = split_part($2, ':', 2))
          OR
          -- Wildcard match: *:* matches everything
          (p.resource = '*' AND p.action = '*')
      )
) as has_permission;

-- name: GetEffectivePermissions :many
-- Returns all effective permissions for a user, expanding wildcards
-- This is useful for displaying what a user can actually do
SELECT DISTINCT
    CASE
        WHEN p.resource = '*' AND p.action = '*' THEN 'all permissions'
        WHEN p.resource = '*' THEN 'all resources:' || p.action
        WHEN p.action = '*' THEN p.resource || ':all actions'
        ELSE p.name
    END as effective_permission,
    p.*
FROM user_roles ur
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE ur.user_id = $1
  AND ur.deleted_at IS NULL
ORDER BY p.resource, p.action;

