-- name: CreateWarehouse :one
INSERT INTO warehouses (
    name,
    location,
    address,
    contact_person,
    contact_phone,
    is_active
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: GetWarehouse :one
SELECT * FROM warehouses
WHERE id = $1;

-- name: ListWarehouses :many
SELECT * FROM warehouses
WHERE 
    ($1 = '' OR name ILIKE '%' || $1 || '%')
    AND is_active = $2
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;

-- name: CountWarehouses :one
SELECT COUNT(*) FROM warehouses
WHERE 
    ($1 = '' OR name ILIKE '%' || $1 || '%')
    AND is_active = $2;

-- name: UpdateWarehouse :one
UPDATE warehouses
SET 
    name = $2,
    location = $3,
    address = $4,
    contact_person = $5,
    contact_phone = $6,
    is_active = $7,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteWarehouse :exec
DELETE FROM warehouses
WHERE id = $1;
