-- name: CreateUser :one
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetUser :one
SELECT * FROM users
WHERE id = $1;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1;

-- name: ListUsers :many
SELECT * FROM users
WHERE is_active = true
ORDER BY first_name, last_name;

-- name: UpdateUser :one
UPDATE users
SET email = $2, first_name = $3, last_name = $4, role = $5, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateUserPassword :one
UPDATE users
SET password_hash = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteUser :exec
UPDATE users
SET is_active = false, updated_at = NOW()
WHERE id = $1;

