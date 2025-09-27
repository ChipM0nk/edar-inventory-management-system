-- name: CreatePurchaseOrder :one
INSERT INTO purchase_orders (po_number, supplier_name, supplier_contact, order_date, expected_delivery_date, notes, created_by)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetPurchaseOrder :one
SELECT po.*, u.first_name, u.last_name
FROM purchase_orders po
JOIN users u ON po.created_by = u.id
WHERE po.id = $1;

-- name: ListPurchaseOrders :many
SELECT po.*, u.first_name, u.last_name
FROM purchase_orders po
JOIN users u ON po.created_by = u.id
ORDER BY po.order_date DESC, po.created_at DESC
LIMIT $1 OFFSET $2;

-- name: ListPurchaseOrdersWithFilter :many
SELECT po.*, u.first_name, u.last_name
FROM purchase_orders po
JOIN users u ON po.created_by = u.id
WHERE ($1::text IS NULL OR po.status = $1)
  AND ($2::text IS NULL OR po.supplier_name ILIKE '%' || $2 || '%')
  AND ($3::date IS NULL OR po.order_date >= $3)
  AND ($4::date IS NULL OR po.order_date <= $4)
ORDER BY po.order_date DESC, po.created_at DESC
LIMIT $5 OFFSET $6;

-- name: UpdatePurchaseOrder :one
UPDATE purchase_orders
SET supplier_name = $2, supplier_contact = $3, status = $4, expected_delivery_date = $5, received_date = $6, notes = $7, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdatePurchaseOrderTotal :one
UPDATE purchase_orders
SET total_amount = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: CountPurchaseOrders :one
SELECT COUNT(*) FROM purchase_orders;

-- name: CountPurchaseOrdersWithFilter :one
SELECT COUNT(*)
FROM purchase_orders po
WHERE ($1::text IS NULL OR po.status = $1)
  AND ($2::text IS NULL OR po.supplier_name ILIKE '%' || $2 || '%')
  AND ($3::date IS NULL OR po.order_date >= $3)
  AND ($4::date IS NULL OR po.order_date <= $4);




