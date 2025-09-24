-- name: CreateStockMovement :one
INSERT INTO stock_movements (product_id, warehouse_id, movement_type, quantity, cost_price, total_amount, reference_type, reference_id, reason, user_id, processed_by, processed_date)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
RETURNING *;

-- name: ListStockMovements :many
SELECT sm.*, p.name as product_name, p.sku, w.name as warehouse_name, u.first_name, u.last_name, 
       pb.first_name as processed_by_first_name, pb.last_name as processed_by_last_name
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
JOIN warehouses w ON sm.warehouse_id = w.id
LEFT JOIN users u ON sm.user_id = u.id
LEFT JOIN users pb ON sm.processed_by = pb.id
ORDER BY sm.created_at DESC
LIMIT $1 OFFSET $2;

-- name: ListStockMovementsWithFilter :many
SELECT sm.*, p.name as product_name, p.sku, w.name as warehouse_name, u.first_name, u.last_name,
       pb.first_name as processed_by_first_name, pb.last_name as processed_by_last_name
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
JOIN warehouses w ON sm.warehouse_id = w.id
LEFT JOIN users u ON sm.user_id = u.id
LEFT JOIN users pb ON sm.processed_by = pb.id
WHERE ($1::uuid IS NULL OR sm.product_id = $1)
  AND ($2::uuid IS NULL OR sm.warehouse_id = $2)
  AND ($3::text IS NULL OR sm.movement_type = $3)
  AND ($4::timestamp IS NULL OR sm.created_at >= $4)
  AND ($5::timestamp IS NULL OR sm.created_at <= $5)
ORDER BY sm.created_at DESC
LIMIT $6 OFFSET $7;

-- name: CountStockMovements :one
SELECT COUNT(*) FROM stock_movements;

-- name: CountStockMovementsWithFilter :one
SELECT COUNT(*)
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
JOIN warehouses w ON sm.warehouse_id = w.id
WHERE ($1::uuid IS NULL OR sm.product_id = $1)
  AND ($2::uuid IS NULL OR sm.warehouse_id = $2)
  AND ($3::text IS NULL OR sm.movement_type = $3)
  AND ($4::timestamp IS NULL OR sm.created_at >= $4)
  AND ($5::timestamp IS NULL OR sm.created_at <= $5);

-- name: ListStockInTransactions :many
SELECT 
    sm.reference_id,
    sm.processed_date,
    sm.processed_by,
    pb.first_name as processed_by_first_name,
    pb.last_name as processed_by_last_name,
    COUNT(sm.id) as item_count,
    SUM(sm.total_amount) as total_amount,
    MIN(sm.created_at) as created_at
FROM stock_movements sm
LEFT JOIN users pb ON sm.processed_by = pb.id
WHERE sm.movement_type = 'in' 
  AND sm.reference_id IS NOT NULL
GROUP BY sm.reference_id, sm.processed_date, sm.processed_by, pb.first_name, pb.last_name
ORDER BY MIN(sm.created_at) DESC
LIMIT $1 OFFSET $2;

-- name: GetStockInTransactionDetails :many
SELECT 
    sm.*,
    p.name as product_name,
    p.sku,
    w.name as warehouse_name,
    s.name as supplier_name,
    u.first_name,
    u.last_name,
    pb.first_name as processed_by_first_name,
    pb.last_name as processed_by_last_name
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
JOIN warehouses w ON sm.warehouse_id = w.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
LEFT JOIN users u ON sm.user_id = u.id
LEFT JOIN users pb ON sm.processed_by = pb.id
WHERE sm.reference_id = $1
ORDER BY sm.created_at;
