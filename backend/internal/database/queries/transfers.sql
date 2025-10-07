-- name: CreateTransfer :one
INSERT INTO transfers (
    reference_number,
    from_warehouse_id,
    to_warehouse_id,
    reason,
    transfer_date,
    created_by
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: CreateTransferItem :one
INSERT INTO transfer_items (
    transfer_id,
    product_id,
    quantity
) VALUES (
    $1, $2, $3
) RETURNING *;

-- name: GetTransfer :one
SELECT 
    t.*,
    wf.name as from_warehouse_name,
    wf.location as from_warehouse_location,
    wt.name as to_warehouse_name,
    wt.location as to_warehouse_location,
    u.first_name || ' ' || u.last_name as created_by_name
FROM transfers t
JOIN warehouses wf ON t.from_warehouse_id = wf.id
JOIN warehouses wt ON t.to_warehouse_id = wt.id
JOIN users u ON t.created_by = u.id
WHERE t.id = $1;

-- name: GetTransferByReferenceNumber :one
SELECT 
    t.*,
    wf.name as from_warehouse_name,
    wf.location as from_warehouse_location,
    wt.name as to_warehouse_name,
    wt.location as to_warehouse_location,
    u.first_name || ' ' || u.last_name as created_by_name
FROM transfers t
JOIN warehouses wf ON t.from_warehouse_id = wf.id
JOIN warehouses wt ON t.to_warehouse_id = wt.id
JOIN users u ON t.created_by = u.id
WHERE t.reference_number = $1;

-- name: GetTransferItems :many
SELECT 
    ti.*,
    p.name as product_name,
    p.sku as product_sku
FROM transfer_items ti
JOIN products p ON ti.product_id = p.id
WHERE ti.transfer_id = $1
ORDER BY p.name;

-- name: GetTransfers :many
SELECT 
    t.*,
    wf.name as from_warehouse_name,
    wf.location as from_warehouse_location,
    wt.name as to_warehouse_name,
    wt.location as to_warehouse_location,
    u.first_name || ' ' || u.last_name as created_by_name
FROM transfers t
JOIN warehouses wf ON t.from_warehouse_id = wf.id
JOIN warehouses wt ON t.to_warehouse_id = wt.id
JOIN users u ON t.created_by = u.id
ORDER BY t.created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateTransferStatus :one
UPDATE transfers 
SET status = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteTransfer :exec
DELETE FROM transfers WHERE id = $1;

-- name: GetTransferWithItems :many
SELECT 
    t.id as transfer_id,
    t.reference_number,
    t.from_warehouse_id,
    t.to_warehouse_id,
    t.reason,
    t.transfer_date,
    t.total_quantity,
    t.status,
    t.created_at,
    wf.name as from_warehouse_name,
    wf.location as from_warehouse_location,
    wt.name as to_warehouse_name,
    wt.location as to_warehouse_location,
    u.first_name || ' ' || u.last_name as created_by_name,
    ti.id as item_id,
    ti.product_id,
    ti.quantity as item_quantity,
    p.name as product_name,
    p.sku as product_sku
FROM transfers t
JOIN warehouses wf ON t.from_warehouse_id = wf.id
JOIN warehouses wt ON t.to_warehouse_id = wt.id
JOIN users u ON t.created_by = u.id
LEFT JOIN transfer_items ti ON t.id = ti.transfer_id
LEFT JOIN products p ON ti.product_id = p.id
ORDER BY t.created_at DESC, p.name;