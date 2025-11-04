-- name: GetUser :one
SELECT
    id,
    email,
    name,
    is_system_account,
    created_at,
    updated_at
FROM
    users
WHERE
    id = $1
LIMIT
    1;

-- name: ListUsers :many
SELECT
    id,
    email,
    name,
    is_system_account,
    created_at,
    updated_at
FROM
    users
ORDER BY
    created_at DESC;

-- name: CreateUser :one
INSERT INTO
    users (email, name, password)
VALUES
    ($1, $2, $3) RETURNING id,
    email,
    name,
    is_system_account,
    created_at,
    updated_at;

-- name: UpdateUser :one
UPDATE
    users
SET
    email = $2,
    name = $3,
    updated_at = NOW()
WHERE
    id = $1 RETURNING id,
    email,
    name,
    is_system_account,
    created_at,
    updated_at;

-- name: DeleteUser :exec
DELETE FROM
    users
WHERE
    id = $1;

-- name: GetUserByEmail :one
SELECT
    id,
    email,
    name,
    password,
    is_system_account,
    created_at,
    updated_at
FROM
    users
WHERE
    email = $1
LIMIT
    1;
