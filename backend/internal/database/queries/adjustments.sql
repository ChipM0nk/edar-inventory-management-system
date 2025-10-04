-- name: CreateAdjustment :one
INSERT INTO adjustments (reference_number, adjustment_date, total_quantity, reason, status, created_by, processed_by, processed_date, notes)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- name: GetAdjustment :one
SELECT a.*, 
       u.first_name as created_by_first_name, u.last_name as created_by_last_name,
       p.first_name as processed_by_first_name, p.last_name as processed_by_last_name
FROM adjustments a
LEFT JOIN users u ON a.created_by = u.id
LEFT JOIN users p ON a.processed_by = p.id
WHERE a.id = $1;

-- name: ListAdjustments :many
SELECT a.*, 
       u.first_name as created_by_first_name, u.last_name as created_by_last_name,
       p.first_name as processed_by_first_name, p.last_name as processed_by_last_name
FROM adjustments a
LEFT JOIN users u ON a.created_by = u.id
LEFT JOIN users p ON a.processed_by = p.id
ORDER BY a.created_at DESC
LIMIT $1 OFFSET $2;

-- name: ListAdjustmentsWithFilter :many
SELECT a.*, 
       u.first_name as created_by_first_name, u.last_name as created_by_last_name,
       p.first_name as processed_by_first_name, p.last_name as processed_by_last_name
FROM adjustments a
LEFT JOIN users u ON a.created_by = u.id
LEFT JOIN users p ON a.processed_by = p.id
WHERE ($1::text IS NULL OR a.reference_number ILIKE '%' || $1 || '%')
  AND ($2::text IS NULL OR a.status = $2)
  AND ($3::uuid IS NULL OR a.created_by = $3)
  AND ($4::date IS NULL OR a.adjustment_date >= $4)
  AND ($5::date IS NULL OR a.adjustment_date <= $5)
ORDER BY a.created_at DESC
LIMIT $6 OFFSET $7;

-- name: CountAdjustments :one
SELECT COUNT(*) FROM adjustments;

-- name: CountAdjustmentsWithFilter :one
SELECT COUNT(*)
FROM adjustments a
WHERE ($1::text IS NULL OR a.reference_number ILIKE '%' || $1 || '%')
  AND ($2::text IS NULL OR a.status = $2)
  AND ($3::uuid IS NULL OR a.created_by = $3)
  AND ($4::date IS NULL OR a.adjustment_date >= $4)
  AND ($5::date IS NULL OR a.adjustment_date <= $5);

-- name: UpdateAdjustment :one
UPDATE adjustments 
SET reference_number = $2, adjustment_date = $3, total_quantity = $4, reason = $5, 
    status = $6, processed_by = $7, processed_date = $8, notes = $9, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteAdjustment :exec
DELETE FROM adjustments WHERE id = $1;

-- name: CreateAdjustmentItem :one
INSERT INTO adjustment_items (adjustment_id, product_id, warehouse_id, quantity, reason, cost_price)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetAdjustmentItems :many
SELECT ai.*, 
       p.name as product_name, p.sku as product_sku,
       w.name as warehouse_name
FROM adjustment_items ai
JOIN products p ON ai.product_id = p.id
JOIN warehouses w ON ai.warehouse_id = w.id
WHERE ai.adjustment_id = $1
ORDER BY ai.created_at;

-- name: UpdateAdjustmentItem :one
UPDATE adjustment_items 
SET product_id = $2, warehouse_id = $3, quantity = $4, reason = $5, cost_price = $6
WHERE id = $1
RETURNING *;

-- name: DeleteAdjustmentItem :exec
DELETE FROM adjustment_items WHERE id = $1;

-- name: DeleteAdjustmentItemsByAdjustmentId :exec
DELETE FROM adjustment_items WHERE adjustment_id = $1;

-- name: GetAdjustmentByReferenceNumber :one
SELECT a.*, 
       u.first_name as created_by_first_name, u.last_name as created_by_last_name,
       p.first_name as processed_by_first_name, p.last_name as processed_by_last_name
FROM adjustments a
LEFT JOIN users u ON a.created_by = u.id
LEFT JOIN users p ON a.processed_by = p.id
WHERE a.reference_number = $1;
