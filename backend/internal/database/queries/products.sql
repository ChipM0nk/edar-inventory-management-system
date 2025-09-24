-- name: CreateProduct :one
INSERT INTO products (sku, name, description, category_id, supplier_id, unit_price, min_stock_level)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetProduct :one
SELECT * FROM products
WHERE id = $1;

-- name: GetProductBySKU :one
SELECT * FROM products
WHERE sku = $1;

-- name: ListProducts :many
SELECT p.*, c.name as category_name, s.name as supplier_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.is_active = true
ORDER BY p.name
LIMIT $1 OFFSET $2;

-- name: ListProductsWithFilter :many
SELECT p.*, c.name as category_name, s.name as supplier_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.is_active = true
  AND ($1::text IS NULL OR p.name ILIKE '%' || $1 || '%')
  AND ($2::uuid IS NULL OR p.category_id = $2)
  AND ($3::uuid IS NULL OR p.supplier_id = $3)
ORDER BY 
  CASE WHEN $6 = 'name' AND $7 = 'asc' THEN p.name END ASC,
  CASE WHEN $6 = 'name' AND $7 = 'desc' THEN p.name END DESC,
  CASE WHEN $6 = 'unit_price' AND $7 = 'asc' THEN p.unit_price END ASC,
  CASE WHEN $6 = 'unit_price' AND $7 = 'desc' THEN p.unit_price END DESC,
  CASE WHEN $6 = 'created_at' AND $7 = 'asc' THEN p.created_at END ASC,
  CASE WHEN $6 = 'created_at' AND $7 = 'desc' THEN p.created_at END DESC
LIMIT $4 OFFSET $5;

-- name: UpdateProduct :one
UPDATE products
SET sku = $2, name = $3, description = $4, category_id = $5, supplier_id = $6, unit_price = $7, min_stock_level = $8, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteProduct :exec
UPDATE products
SET is_active = false, updated_at = NOW()
WHERE id = $1;

-- name: CountProducts :one
SELECT COUNT(*) FROM products
WHERE is_active = true;

-- name: CountProductsWithFilter :one
SELECT COUNT(*) FROM products
WHERE is_active = true
  AND ($1::text IS NULL OR name ILIKE '%' || $1 || '%')
  AND ($2::uuid IS NULL OR category_id = $2)
  AND ($3::uuid IS NULL OR supplier_id = $3);

-- name: GetProductsBySupplier :many
SELECT p.*, c.name as category_name, s.name as supplier_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.supplier_id = $1 AND p.is_active = true
ORDER BY p.name;

-- name: ListProductsWithStock :many
SELECT p.*, c.name as category_name, s.name as supplier_name,
       COALESCE(SUM(sl.quantity), 0) as total_stock,
       COALESCE(SUM(sl.reserved_quantity), 0) as total_reserved,
       COALESCE(SUM(sl.available_quantity), 0) as total_available
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
LEFT JOIN stock_levels sl ON p.id = sl.product_id
WHERE p.is_active = true
  AND ($1::text IS NULL OR p.name ILIKE '%' || $1 || '%')
  AND ($2::uuid IS NULL OR p.category_id = $2)
  AND ($3::uuid IS NULL OR p.supplier_id = $3)
GROUP BY p.id, c.name, s.name
ORDER BY 
  CASE WHEN $6 = 'name' AND $7 = 'asc' THEN p.name END ASC,
  CASE WHEN $6 = 'name' AND $7 = 'desc' THEN p.name END DESC,
  CASE WHEN $6 = 'unit_price' AND $7 = 'asc' THEN p.unit_price END ASC,
  CASE WHEN $6 = 'unit_price' AND $7 = 'desc' THEN p.unit_price END DESC,
  CASE WHEN $6 = 'created_at' AND $7 = 'asc' THEN p.created_at END ASC,
  CASE WHEN $6 = 'created_at' AND $7 = 'desc' THEN p.created_at END DESC
LIMIT $4 OFFSET $5;
