import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getRoleQuery = `-- name: GetRole :one


SELECT id, name, description, created_at, updated_at FROM roles
WHERE id = $1 LIMIT 1`;

export interface GetRoleArgs {
    id: string;
}

export interface GetRoleRow {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export async function getRole(client: Client, args: GetRoleArgs): Promise<GetRoleRow | null> {
    const result = await client.query({
        text: getRoleQuery,
        values: [args.id],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        name: row[1],
        description: row[2],
        createdAt: row[3],
        updatedAt: row[4]
    };
}

export const getRoleByNameQuery = `-- name: GetRoleByName :one
SELECT id, name, description, created_at, updated_at FROM roles
WHERE name = $1 LIMIT 1`;

export interface GetRoleByNameArgs {
    name: string;
}

export interface GetRoleByNameRow {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export async function getRoleByName(client: Client, args: GetRoleByNameArgs): Promise<GetRoleByNameRow | null> {
    const result = await client.query({
        text: getRoleByNameQuery,
        values: [args.name],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        name: row[1],
        description: row[2],
        createdAt: row[3],
        updatedAt: row[4]
    };
}

export const listRolesQuery = `-- name: ListRoles :many
SELECT id, name, description, created_at, updated_at FROM roles
ORDER BY created_at DESC`;

export interface ListRolesRow {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export async function listRoles(client: Client): Promise<ListRolesRow[]> {
    const result = await client.query({
        text: listRolesQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            name: row[1],
            description: row[2],
            createdAt: row[3],
            updatedAt: row[4]
        };
    });
}

export const createRoleQuery = `-- name: CreateRole :one
INSERT INTO roles (
    name, description
) VALUES (
    $1, $2
)
RETURNING id, name, description, created_at, updated_at`;

export interface CreateRoleArgs {
    name: string;
    description: string | null;
}

export interface CreateRoleRow {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export async function createRole(client: Client, args: CreateRoleArgs): Promise<CreateRoleRow | null> {
    const result = await client.query({
        text: createRoleQuery,
        values: [args.name, args.description],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        name: row[1],
        description: row[2],
        createdAt: row[3],
        updatedAt: row[4]
    };
}

export const updateRoleQuery = `-- name: UpdateRole :one
UPDATE roles
SET
    name = $2,
    description = $3,
    updated_at = NOW()
WHERE id = $1
RETURNING id, name, description, created_at, updated_at`;

export interface UpdateRoleArgs {
    id: string;
    name: string;
    description: string | null;
}

export interface UpdateRoleRow {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export async function updateRole(client: Client, args: UpdateRoleArgs): Promise<UpdateRoleRow | null> {
    const result = await client.query({
        text: updateRoleQuery,
        values: [args.id, args.name, args.description],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        name: row[1],
        description: row[2],
        createdAt: row[3],
        updatedAt: row[4]
    };
}

export const deleteRoleQuery = `-- name: DeleteRole :exec
DELETE FROM roles
WHERE id = $1`;

export interface DeleteRoleArgs {
    id: string;
}

export async function deleteRole(client: Client, args: DeleteRoleArgs): Promise<void> {
    await client.query({
        text: deleteRoleQuery,
        values: [args.id],
        rowMode: "array"
    });
}

export const getPermissionQuery = `-- name: GetPermission :one

SELECT id, name, resource, action, description, created_at, updated_at FROM permissions
WHERE id = $1 LIMIT 1`;

export interface GetPermissionArgs {
    id: string;
}

export interface GetPermissionRow {
    id: string;
    name: string;
    resource: string;
    action: string;
    description: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export async function getPermission(client: Client, args: GetPermissionArgs): Promise<GetPermissionRow | null> {
    const result = await client.query({
        text: getPermissionQuery,
        values: [args.id],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        name: row[1],
        resource: row[2],
        action: row[3],
        description: row[4],
        createdAt: row[5],
        updatedAt: row[6]
    };
}

export const getPermissionByNameQuery = `-- name: GetPermissionByName :one
SELECT id, name, resource, action, description, created_at, updated_at FROM permissions
WHERE name = $1 LIMIT 1`;

export interface GetPermissionByNameArgs {
    name: string;
}

export interface GetPermissionByNameRow {
    id: string;
    name: string;
    resource: string;
    action: string;
    description: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export async function getPermissionByName(client: Client, args: GetPermissionByNameArgs): Promise<GetPermissionByNameRow | null> {
    const result = await client.query({
        text: getPermissionByNameQuery,
        values: [args.name],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        name: row[1],
        resource: row[2],
        action: row[3],
        description: row[4],
        createdAt: row[5],
        updatedAt: row[6]
    };
}

export const listPermissionsQuery = `-- name: ListPermissions :many
SELECT id, name, resource, action, description, created_at, updated_at FROM permissions
ORDER BY resource, action`;

export interface ListPermissionsRow {
    id: string;
    name: string;
    resource: string;
    action: string;
    description: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export async function listPermissions(client: Client): Promise<ListPermissionsRow[]> {
    const result = await client.query({
        text: listPermissionsQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            name: row[1],
            resource: row[2],
            action: row[3],
            description: row[4],
            createdAt: row[5],
            updatedAt: row[6]
        };
    });
}

export const listPermissionsByResourceQuery = `-- name: ListPermissionsByResource :many
SELECT id, name, resource, action, description, created_at, updated_at FROM permissions
WHERE resource = $1
ORDER BY action`;

export interface ListPermissionsByResourceArgs {
    resource: string;
}

export interface ListPermissionsByResourceRow {
    id: string;
    name: string;
    resource: string;
    action: string;
    description: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export async function listPermissionsByResource(client: Client, args: ListPermissionsByResourceArgs): Promise<ListPermissionsByResourceRow[]> {
    const result = await client.query({
        text: listPermissionsByResourceQuery,
        values: [args.resource],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            name: row[1],
            resource: row[2],
            action: row[3],
            description: row[4],
            createdAt: row[5],
            updatedAt: row[6]
        };
    });
}

export const createPermissionQuery = `-- name: CreatePermission :one
INSERT INTO permissions (
    name, resource, action, description
) VALUES (
    $1, $2, $3, $4
)
RETURNING id, name, resource, action, description, created_at, updated_at`;

export interface CreatePermissionArgs {
    name: string;
    resource: string;
    action: string;
    description: string | null;
}

export interface CreatePermissionRow {
    id: string;
    name: string;
    resource: string;
    action: string;
    description: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export async function createPermission(client: Client, args: CreatePermissionArgs): Promise<CreatePermissionRow | null> {
    const result = await client.query({
        text: createPermissionQuery,
        values: [args.name, args.resource, args.action, args.description],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        name: row[1],
        resource: row[2],
        action: row[3],
        description: row[4],
        createdAt: row[5],
        updatedAt: row[6]
    };
}

export const updatePermissionQuery = `-- name: UpdatePermission :one
UPDATE permissions
SET
    name = $2,
    resource = $3,
    action = $4,
    description = $5,
    updated_at = NOW()
WHERE id = $1
RETURNING id, name, resource, action, description, created_at, updated_at`;

export interface UpdatePermissionArgs {
    id: string;
    name: string;
    resource: string;
    action: string;
    description: string | null;
}

export interface UpdatePermissionRow {
    id: string;
    name: string;
    resource: string;
    action: string;
    description: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export async function updatePermission(client: Client, args: UpdatePermissionArgs): Promise<UpdatePermissionRow | null> {
    const result = await client.query({
        text: updatePermissionQuery,
        values: [args.id, args.name, args.resource, args.action, args.description],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        name: row[1],
        resource: row[2],
        action: row[3],
        description: row[4],
        createdAt: row[5],
        updatedAt: row[6]
    };
}

export const deletePermissionQuery = `-- name: DeletePermission :exec
DELETE FROM permissions
WHERE id = $1`;

export interface DeletePermissionArgs {
    id: string;
}

export async function deletePermission(client: Client, args: DeletePermissionArgs): Promise<void> {
    await client.query({
        text: deletePermissionQuery,
        values: [args.id],
        rowMode: "array"
    });
}

export const getRolePermissionsQuery = `-- name: GetRolePermissions :many

SELECT p.id, p.name, p.resource, p.action, p.description, p.created_at, p.updated_at
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
WHERE rp.role_id = $1
ORDER BY p.resource, p.action`;

export interface GetRolePermissionsArgs {
    roleId: string;
}

export interface GetRolePermissionsRow {
    id: string;
    name: string;
    resource: string;
    action: string;
    description: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export async function getRolePermissions(client: Client, args: GetRolePermissionsArgs): Promise<GetRolePermissionsRow[]> {
    const result = await client.query({
        text: getRolePermissionsQuery,
        values: [args.roleId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            name: row[1],
            resource: row[2],
            action: row[3],
            description: row[4],
            createdAt: row[5],
            updatedAt: row[6]
        };
    });
}

export const addPermissionToRoleQuery = `-- name: AddPermissionToRole :exec
INSERT INTO role_permissions (role_id, permission_id)
VALUES ($1, $2)
ON CONFLICT (role_id, permission_id) DO NOTHING`;

export interface AddPermissionToRoleArgs {
    roleId: string;
    permissionId: string;
}

export async function addPermissionToRole(client: Client, args: AddPermissionToRoleArgs): Promise<void> {
    await client.query({
        text: addPermissionToRoleQuery,
        values: [args.roleId, args.permissionId],
        rowMode: "array"
    });
}

export const removePermissionFromRoleQuery = `-- name: RemovePermissionFromRole :exec
DELETE FROM role_permissions
WHERE role_id = $1 AND permission_id = $2`;

export interface RemovePermissionFromRoleArgs {
    roleId: string;
    permissionId: string;
}

export async function removePermissionFromRole(client: Client, args: RemovePermissionFromRoleArgs): Promise<void> {
    await client.query({
        text: removePermissionFromRoleQuery,
        values: [args.roleId, args.permissionId],
        rowMode: "array"
    });
}

export const clearRolePermissionsQuery = `-- name: ClearRolePermissions :exec
DELETE FROM role_permissions
WHERE role_id = $1`;

export interface ClearRolePermissionsArgs {
    roleId: string;
}

export async function clearRolePermissions(client: Client, args: ClearRolePermissionsArgs): Promise<void> {
    await client.query({
        text: clearRolePermissionsQuery,
        values: [args.roleId],
        rowMode: "array"
    });
}

export const getUserRolesQuery = `-- name: GetUserRoles :many

SELECT r.id, r.name, r.description, r.created_at, r.updated_at
FROM roles r
JOIN user_roles ur ON r.id = ur.role_id
WHERE ur.user_id = $1
  AND ur.deleted_at IS NULL
ORDER BY ur.assigned_at DESC`;

export interface GetUserRolesArgs {
    userId: string;
}

export interface GetUserRolesRow {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export async function getUserRoles(client: Client, args: GetUserRolesArgs): Promise<GetUserRolesRow[]> {
    const result = await client.query({
        text: getUserRolesQuery,
        values: [args.userId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            name: row[1],
            description: row[2],
            createdAt: row[3],
            updatedAt: row[4]
        };
    });
}

export const assignRoleToUserQuery = `-- name: AssignRoleToUser :exec
INSERT INTO user_roles (user_id, role_id, assigned_by)
VALUES ($1, $2, $3)
ON CONFLICT (user_id, role_id) DO UPDATE
SET deleted_at = NULL,
    assigned_at = NOW(),
    assigned_by = $3`;

export interface AssignRoleToUserArgs {
    userId: string;
    roleId: string;
    assignedBy: string | null;
}

export async function assignRoleToUser(client: Client, args: AssignRoleToUserArgs): Promise<void> {
    await client.query({
        text: assignRoleToUserQuery,
        values: [args.userId, args.roleId, args.assignedBy],
        rowMode: "array"
    });
}

export const removeRoleFromUserQuery = `-- name: RemoveRoleFromUser :exec
UPDATE user_roles
SET deleted_at = NOW()
WHERE user_id = $1 AND role_id = $2 AND deleted_at IS NULL`;

export interface RemoveRoleFromUserArgs {
    userId: string;
    roleId: string;
}

export async function removeRoleFromUser(client: Client, args: RemoveRoleFromUserArgs): Promise<void> {
    await client.query({
        text: removeRoleFromUserQuery,
        values: [args.userId, args.roleId],
        rowMode: "array"
    });
}

export const clearUserRolesQuery = `-- name: ClearUserRoles :exec
UPDATE user_roles
SET deleted_at = NOW()
WHERE user_id = $1 AND deleted_at IS NULL`;

export interface ClearUserRolesArgs {
    userId: string;
}

export async function clearUserRoles(client: Client, args: ClearUserRolesArgs): Promise<void> {
    await client.query({
        text: clearUserRolesQuery,
        values: [args.userId],
        rowMode: "array"
    });
}

export const checkUserPermissionQuery = `-- name: CheckUserPermission :one

SELECT user_has_permission($1, $2, $3) as has_permission`;

export interface CheckUserPermissionArgs {
    userIdParam: string;
    requiredResource: string;
    requiredAction: string;
}

export interface CheckUserPermissionRow {
    hasPermission: boolean;
}

export async function checkUserPermission(client: Client, args: CheckUserPermissionArgs): Promise<CheckUserPermissionRow | null> {
    const result = await client.query({
        text: checkUserPermissionQuery,
        values: [args.userIdParam, args.requiredResource, args.requiredAction],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        hasPermission: row[0]
    };
}

export const getUserPermissionsQuery = `-- name: GetUserPermissions :many
SELECT DISTINCT p.id, p.name, p.resource, p.action, p.description, p.created_at, p.updated_at
FROM user_roles ur
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE ur.user_id = $1
  AND ur.deleted_at IS NULL
ORDER BY p.resource, p.action`;

export interface GetUserPermissionsArgs {
    userId: string;
}

export interface GetUserPermissionsRow {
    id: string;
    name: string;
    resource: string;
    action: string;
    description: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export async function getUserPermissions(client: Client, args: GetUserPermissionsArgs): Promise<GetUserPermissionsRow[]> {
    const result = await client.query({
        text: getUserPermissionsQuery,
        values: [args.userId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            name: row[1],
            resource: row[2],
            action: row[3],
            description: row[4],
            createdAt: row[5],
            updatedAt: row[6]
        };
    });
}

export const checkUserPermissionByNameQuery = `-- name: CheckUserPermissionByName :one
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
) as has_permission`;

export interface CheckUserPermissionByNameArgs {
    userId: string;
    name: string;
}

export interface CheckUserPermissionByNameRow {
    hasPermission: boolean;
}

export async function checkUserPermissionByName(client: Client, args: CheckUserPermissionByNameArgs): Promise<CheckUserPermissionByNameRow | null> {
    const result = await client.query({
        text: checkUserPermissionByNameQuery,
        values: [args.userId, args.name],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        hasPermission: row[0]
    };
}

export const getEffectivePermissionsQuery = `-- name: GetEffectivePermissions :many
SELECT DISTINCT
    CASE
        WHEN p.resource = '*' AND p.action = '*' THEN 'all permissions'
        WHEN p.resource = '*' THEN 'all resources:' || p.action
        WHEN p.action = '*' THEN p.resource || ':all actions'
        ELSE p.name
    END as effective_permission,
    p.id, p.name, p.resource, p.action, p.description, p.created_at, p.updated_at
FROM user_roles ur
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE ur.user_id = $1
  AND ur.deleted_at IS NULL
ORDER BY p.resource, p.action`;

export interface GetEffectivePermissionsArgs {
    userId: string;
}

export interface GetEffectivePermissionsRow {
    effectivePermission: string | null;
    id: string;
    name: string;
    resource: string;
    action: string;
    description: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export async function getEffectivePermissions(client: Client, args: GetEffectivePermissionsArgs): Promise<GetEffectivePermissionsRow[]> {
    const result = await client.query({
        text: getEffectivePermissionsQuery,
        values: [args.userId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            effectivePermission: row[0],
            id: row[1],
            name: row[2],
            resource: row[3],
            action: row[4],
            description: row[5],
            createdAt: row[6],
            updatedAt: row[7]
        };
    });
}

