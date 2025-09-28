-- name: CreateTransfer :one
INSERT INTO transfers (reference_number, transfer_date, from_warehouse_id, to_warehouse_id, total_quantity, reason, status, created_by, processed_by, processed_date, notes)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *;

-- name: GetTransfer :one
SELECT t.*, 
       fw.name as from_warehouse_name,
       tw.name as to_warehouse_name,
       u.first_name as created_by_first_name, u.last_name as created_by_last_name,
       p.first_name as processed_by_first_name, p.last_name as processed_by_last_name
FROM transfers t
JOIN warehouses fw ON t.from_warehouse_id = fw.id
JOIN warehouses tw ON t.to_warehouse_id = tw.id
LEFT JOIN users u ON t.created_by = u.id
LEFT JOIN users p ON t.processed_by = p.id
WHERE t.id = $1;

-- name: ListTransfers :many
SELECT t.*, 
       fw.name as from_warehouse_name,
       tw.name as to_warehouse_name,
       u.first_name as created_by_first_name, u.last_name as created_by_last_name,
       p.first_name as processed_by_first_name, p.last_name as processed_by_last_name
FROM transfers t
JOIN warehouses fw ON t.from_warehouse_id = fw.id
JOIN warehouses tw ON t.to_warehouse_id = tw.id
LEFT JOIN users u ON t.created_by = u.id
LEFT JOIN users p ON t.processed_by = p.id
ORDER BY t.created_at DESC
LIMIT $1 OFFSET $2;

-- name: ListTransfersWithFilter :many
SELECT t.*, 
       fw.name as from_warehouse_name,
       tw.name as to_warehouse_name,
       u.first_name as created_by_first_name, u.last_name as created_by_last_name,
       p.first_name as processed_by_first_name, p.last_name as processed_by_last_name
FROM transfers t
JOIN warehouses fw ON t.from_warehouse_id = fw.id
JOIN warehouses tw ON t.to_warehouse_id = tw.id
LEFT JOIN users u ON t.created_by = u.id
LEFT JOIN users p ON t.processed_by = p.id
WHERE ($1::text IS NULL OR t.reference_number ILIKE '%' || $1 || '%')
  AND ($2::text IS NULL OR t.status = $2)
  AND ($3::uuid IS NULL OR t.created_by = $3)
  AND ($4::uuid IS NULL OR t.from_warehouse_id = $4)
  AND ($5::uuid IS NULL OR t.to_warehouse_id = $5)
  AND ($6::date IS NULL OR t.transfer_date >= $6)
  AND ($7::date IS NULL OR t.transfer_date <= $7)
ORDER BY t.created_at DESC
LIMIT $8 OFFSET $9;

-- name: CountTransfers :one
SELECT COUNT(*) FROM transfers;

-- name: CountTransfersWithFilter :one
SELECT COUNT(*)
FROM transfers t
WHERE ($1::text IS NULL OR t.reference_number ILIKE '%' || $1 || '%')
  AND ($2::text IS NULL OR t.status = $2)
  AND ($3::uuid IS NULL OR t.created_by = $3)
  AND ($4::uuid IS NULL OR t.from_warehouse_id = $4)
  AND ($5::uuid IS NULL OR t.to_warehouse_id = $5)
  AND ($6::date IS NULL OR t.transfer_date >= $6)
  AND ($7::date IS NULL OR t.transfer_date <= $7);

-- name: UpdateTransfer :one
UPDATE transfers 
SET reference_number = $2, transfer_date = $3, from_warehouse_id = $4, to_warehouse_id = $5,
    total_quantity = $6, reason = $7, status = $8, processed_by = $9, processed_date = $10, 
    notes = $11, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteTransfer :exec
DELETE FROM transfers WHERE id = $1;

-- name: CreateTransferItem :one
INSERT INTO transfer_items (transfer_id, product_id, quantity, reason)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetTransferItems :many
SELECT ti.*, 
       p.name as product_name, p.sku as product_sku
FROM transfer_items ti
JOIN products p ON ti.product_id = p.id
WHERE ti.transfer_id = $1
ORDER BY ti.created_at;

-- name: UpdateTransferItem :one
UPDATE transfer_items 
SET product_id = $2, quantity = $3, reason = $4
WHERE id = $1
RETURNING *;

-- name: DeleteTransferItem :exec
DELETE FROM transfer_items WHERE id = $1;

-- name: DeleteTransferItemsByTransferId :exec
DELETE FROM transfer_items WHERE transfer_id = $1;

-- name: GetTransferByReferenceNumber :one
SELECT t.*, 
       fw.name as from_warehouse_name,
       tw.name as to_warehouse_name,
       u.first_name as created_by_first_name, u.last_name as created_by_last_name,
       p.first_name as processed_by_first_name, p.last_name as processed_by_last_name
FROM transfers t
JOIN warehouses fw ON t.from_warehouse_id = fw.id
JOIN warehouses tw ON t.to_warehouse_id = tw.id
LEFT JOIN users u ON t.created_by = u.id
LEFT JOIN users p ON t.processed_by = p.id
WHERE t.reference_number = $1;
