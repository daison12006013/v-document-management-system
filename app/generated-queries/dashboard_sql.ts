import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const countUsersQuery = `-- name: CountUsers :one

SELECT COUNT(*) as count
FROM users`;

export interface CountUsersRow {
    count: string;
}

export async function countUsers(client: Client): Promise<CountUsersRow | null> {
    const result = await client.query({
        text: countUsersQuery,
        values: [],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        count: row[0]
    };
}

export const countRolesQuery = `-- name: CountRoles :one
SELECT COUNT(*) as count
FROM roles`;

export interface CountRolesRow {
    count: string;
}

export async function countRoles(client: Client): Promise<CountRolesRow | null> {
    const result = await client.query({
        text: countRolesQuery,
        values: [],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        count: row[0]
    };
}

export const countPermissionsQuery = `-- name: CountPermissions :one
SELECT COUNT(*) as count
FROM permissions`;

export interface CountPermissionsRow {
    count: string;
}

export async function countPermissions(client: Client): Promise<CountPermissionsRow | null> {
    const result = await client.query({
        text: countPermissionsQuery,
        values: [],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        count: row[0]
    };
}

export const getRecentActivitiesQuery = `-- name: GetRecentActivities :many
SELECT
    a.id,
    a.user_id,
    a.action,
    a.resource_type,
    a.resource_id,
    a.description,
    a.metadata,
    a.created_at,
    u.name as user_name,
    u.email as user_email
FROM activities a
LEFT JOIN users u ON a.user_id = u.id
ORDER BY a.created_at DESC
LIMIT $1`;

export interface GetRecentActivitiesArgs {
    limit: string;
}

export interface GetRecentActivitiesRow {
    id: string;
    userId: string | null;
    action: string;
    resourceType: string;
    resourceId: string | null;
    description: string | null;
    metadata: any | null;
    createdAt: Date | null;
    userName: string | null;
    userEmail: string | null;
}

export async function getRecentActivities(client: Client, args: GetRecentActivitiesArgs): Promise<GetRecentActivitiesRow[]> {
    const result = await client.query({
        text: getRecentActivitiesQuery,
        values: [args.limit],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            userId: row[1],
            action: row[2],
            resourceType: row[3],
            resourceId: row[4],
            description: row[5],
            metadata: row[6],
            createdAt: row[7],
            userName: row[8],
            userEmail: row[9]
        };
    });
}

export const createActivityQuery = `-- name: CreateActivity :one
INSERT INTO activities (
    user_id, action, resource_type, resource_id, description, metadata
) VALUES (
    $1, $2, $3, $4, $5, $6
)
RETURNING id, user_id, action, resource_type, resource_id, description, metadata, created_at`;

export interface CreateActivityArgs {
    userId: string | null;
    action: string;
    resourceType: string;
    resourceId: string | null;
    description: string | null;
    metadata: any | null;
}

export interface CreateActivityRow {
    id: string;
    userId: string | null;
    action: string;
    resourceType: string;
    resourceId: string | null;
    description: string | null;
    metadata: any | null;
    createdAt: Date | null;
}

export async function createActivity(client: Client, args: CreateActivityArgs): Promise<CreateActivityRow | null> {
    const result = await client.query({
        text: createActivityQuery,
        values: [args.userId, args.action, args.resourceType, args.resourceId, args.description, args.metadata],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        userId: row[1],
        action: row[2],
        resourceType: row[3],
        resourceId: row[4],
        description: row[5],
        metadata: row[6],
        createdAt: row[7]
    };
}

