-- name: CreateSupplier :one
INSERT INTO suppliers (name, contact_person, email, phone, address, city, state, country, postal_code, is_active)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: GetSupplier :one
SELECT * FROM suppliers
WHERE id = $1;

-- name: GetSupplierByName :one
SELECT * FROM suppliers
WHERE name = $1;

-- name: ListSuppliers :many
SELECT * FROM suppliers
WHERE is_active = true
ORDER BY name;

-- name: ListSuppliersWithFilter :many
SELECT * FROM suppliers
WHERE ($1::text IS NULL OR name ILIKE '%' || $1 || '%')
  AND ($2::text IS NULL OR contact_person ILIKE '%' || $2 || '%')
  AND ($3::text IS NULL OR email ILIKE '%' || $3 || '%')
  AND ($4::text IS NULL OR city ILIKE '%' || $4 || '%')
  AND ($5::boolean IS NULL OR is_active = $5)
ORDER BY 
  CASE WHEN $8 = 'name' AND $9 = 'asc' THEN name END ASC,
  CASE WHEN $8 = 'name' AND $9 = 'desc' THEN name END DESC,
  CASE WHEN $8 = 'created_at' AND $9 = 'asc' THEN created_at END ASC,
  CASE WHEN $8 = 'created_at' AND $9 = 'desc' THEN created_at END DESC
LIMIT $6 OFFSET $7;

-- name: CountSuppliersWithFilter :one
SELECT COUNT(*) FROM suppliers
WHERE ($1::text IS NULL OR name ILIKE '%' || $1 || '%')
  AND ($2::text IS NULL OR contact_person ILIKE '%' || $2 || '%')
  AND ($3::text IS NULL OR email ILIKE '%' || $3 || '%')
  AND ($4::text IS NULL OR city ILIKE '%' || $4 || '%')
  AND ($5::boolean IS NULL OR is_active = $5);

-- name: UpdateSupplier :one
UPDATE suppliers
SET name = $2, contact_person = $3, email = $4, phone = $5, address = $6, 
    city = $7, state = $8, country = $9, postal_code = $10, is_active = $11, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteSupplier :exec
UPDATE suppliers
SET is_active = false, updated_at = NOW()
WHERE id = $1;
