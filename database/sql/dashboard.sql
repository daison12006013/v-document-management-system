-- Dashboard Queries

-- name: CountUsers :one
SELECT COUNT(*) as count
FROM users;

-- name: CountRoles :one
SELECT COUNT(*) as count
FROM roles;

-- name: CountPermissions :one
SELECT COUNT(*) as count
FROM permissions;

-- name: GetRecentActivities :many
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
LIMIT $1;

-- name: CreateActivity :one
INSERT INTO activities (
    user_id, action, resource_type, resource_id, description, metadata
) VALUES (
    $1, $2, $3, $4, $5, $6
)
RETURNING *;

