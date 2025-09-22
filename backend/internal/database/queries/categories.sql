-- name: CreateCategory :one
INSERT INTO categories (name, description, is_active)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetCategory :one
SELECT * FROM categories
WHERE id = $1;

-- name: GetCategoryByName :one
SELECT * FROM categories
WHERE name = $1;

-- name: ListCategories :many
SELECT * FROM categories
WHERE is_active = true
ORDER BY name;

-- name: ListCategoriesWithFilter :many
SELECT * FROM categories
WHERE ($1::text = '' OR name ILIKE '%' || $1 || '%')
  AND ($2::text = '' OR description ILIKE '%' || $2 || '%')
  AND (is_active = $3)
ORDER BY 
  CASE WHEN $6 = 'name' AND $7 = 'asc' THEN name END ASC,
  CASE WHEN $6 = 'name' AND $7 = 'desc' THEN name END DESC,
  CASE WHEN $6 = 'created_at' AND $7 = 'asc' THEN created_at END ASC,
  CASE WHEN $6 = 'created_at' AND $7 = 'desc' THEN created_at END DESC
LIMIT $4 OFFSET $5;

-- name: CountCategoriesWithFilter :one
SELECT COUNT(*) FROM categories
WHERE ($1::text IS NULL OR name ILIKE '%' || $1 || '%')
  AND ($2::text IS NULL OR description ILIKE '%' || $2 || '%')
  AND ($3::boolean IS NULL OR is_active = $3);

-- name: UpdateCategory :one
UPDATE categories
SET name = $2, description = $3, is_active = $4, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteCategory :exec
UPDATE categories
SET is_active = false, updated_at = NOW()
WHERE id = $1;
