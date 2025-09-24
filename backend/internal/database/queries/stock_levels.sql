-- name: CreateStockLevel :one
INSERT INTO stock_levels (product_id, warehouse_id, quantity, reserved_quantity, min_stock_level, max_stock_level)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetStockLevel :one
SELECT sl.*, p.name as product_name, p.sku, w.name as warehouse_name
FROM stock_levels sl
JOIN products p ON sl.product_id = p.id
JOIN warehouses w ON sl.warehouse_id = w.id
WHERE sl.product_id = $1 AND sl.warehouse_id = $2;

-- name: ListStockLevels :many
SELECT sl.*, p.name as product_name, p.sku, w.name as warehouse_name
FROM stock_levels sl
JOIN products p ON sl.product_id = p.id
JOIN warehouses w ON sl.warehouse_id = w.id
ORDER BY p.name, w.name
LIMIT $1 OFFSET $2;

-- name: ListStockLevelsWithFilter :many
SELECT sl.*, p.name as product_name, p.sku, w.name as warehouse_name
FROM stock_levels sl
JOIN products p ON sl.product_id = p.id
JOIN warehouses w ON sl.warehouse_id = w.id
WHERE ($1::uuid IS NULL OR sl.product_id = $1)
  AND ($2::uuid IS NULL OR sl.warehouse_id = $2)
  AND ($3::text IS NULL OR p.name ILIKE '%' || $3 || '%')
  AND ($4::text IS NULL OR p.sku ILIKE '%' || $4 || '%')
ORDER BY p.name, w.name
LIMIT $5 OFFSET $6;

-- name: UpdateStockLevel :one
UPDATE stock_levels
SET quantity = $3, reserved_quantity = $4, min_stock_level = $5, max_stock_level = $6, last_updated = NOW(), updated_at = NOW()
WHERE product_id = $1 AND warehouse_id = $2
RETURNING *;

-- name: UpdateStockQuantity :one
UPDATE stock_levels
SET quantity = $3, last_updated = NOW(), updated_at = NOW()
WHERE product_id = $1 AND warehouse_id = $2
RETURNING *;

-- name: UpdateReservedQuantity :one
UPDATE stock_levels
SET reserved_quantity = $3, last_updated = NOW(), updated_at = NOW()
WHERE product_id = $1 AND warehouse_id = $2
RETURNING *;

-- name: CountStockLevels :one
SELECT COUNT(*) FROM stock_levels;

-- name: CountStockLevelsWithFilter :one
SELECT COUNT(*)
FROM stock_levels sl
JOIN products p ON sl.product_id = p.id
JOIN warehouses w ON sl.warehouse_id = w.id
WHERE ($1::uuid IS NULL OR sl.product_id = $1)
  AND ($2::uuid IS NULL OR sl.warehouse_id = $2)
  AND ($3::text IS NULL OR p.name ILIKE '%' || $3 || '%')
  AND ($4::text IS NULL OR p.sku ILIKE '%' || $4 || '%');

-- name: GetLowStockItems :many
SELECT sl.*, p.name as product_name, p.sku, w.name as warehouse_name
FROM stock_levels sl
JOIN products p ON sl.product_id = p.id
JOIN warehouses w ON sl.warehouse_id = w.id
WHERE sl.available_quantity <= sl.min_stock_level
ORDER BY sl.available_quantity ASC;


