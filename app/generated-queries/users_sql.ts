import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getUserQuery = `-- name: GetUser :one
SELECT id, email, name, created_at, updated_at FROM users
WHERE id = $1 LIMIT 1`;

export interface GetUserArgs {
    id: string;
}

export interface GetUserRow {
    id: string;
    email: string;
    name: string;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export async function getUser(client: Client, args: GetUserArgs): Promise<GetUserRow | null> {
    const result = await client.query({
        text: getUserQuery,
        values: [args.id],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        email: row[1],
        name: row[2],
        createdAt: row[3],
        updatedAt: row[4]
    };
}

export const listUsersQuery = `-- name: ListUsers :many
SELECT id, email, name, created_at, updated_at FROM users
ORDER BY created_at DESC`;

export interface ListUsersRow {
    id: string;
    email: string;
    name: string;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export async function listUsers(client: Client): Promise<ListUsersRow[]> {
    const result = await client.query({
        text: listUsersQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            email: row[1],
            name: row[2],
            createdAt: row[3],
            updatedAt: row[4]
        };
    });
}

export const createUserQuery = `-- name: CreateUser :one
INSERT INTO users (
    email, name
) VALUES (
    $1, $2
)
RETURNING id, email, name, created_at, updated_at`;

export interface CreateUserArgs {
    email: string;
    name: string;
}

export interface CreateUserRow {
    id: string;
    email: string;
    name: string;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export async function createUser(client: Client, args: CreateUserArgs): Promise<CreateUserRow | null> {
    const result = await client.query({
        text: createUserQuery,
        values: [args.email, args.name],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        email: row[1],
        name: row[2],
        createdAt: row[3],
        updatedAt: row[4]
    };
}

export const updateUserQuery = `-- name: UpdateUser :one
UPDATE users
SET
    email = $2,
    name = $3,
    updated_at = NOW()
WHERE id = $1
RETURNING id, email, name, created_at, updated_at`;

export interface UpdateUserArgs {
    id: string;
    email: string;
    name: string;
}

export interface UpdateUserRow {
    id: string;
    email: string;
    name: string;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export async function updateUser(client: Client, args: UpdateUserArgs): Promise<UpdateUserRow | null> {
    const result = await client.query({
        text: updateUserQuery,
        values: [args.id, args.email, args.name],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        email: row[1],
        name: row[2],
        createdAt: row[3],
        updatedAt: row[4]
    };
}

export const deleteUserQuery = `-- name: DeleteUser :exec
DELETE FROM users
WHERE id = $1`;

export interface DeleteUserArgs {
    id: string;
}

export async function deleteUser(client: Client, args: DeleteUserArgs): Promise<void> {
    await client.query({
        text: deleteUserQuery,
        values: [args.id],
        rowMode: "array"
    });
}

