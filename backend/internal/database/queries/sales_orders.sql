-- name: CreateSalesOrder :one
INSERT INTO sales_orders (so_number, customer_name, customer_contact, order_date, expected_delivery_date, notes, created_by)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetSalesOrder :one
SELECT so.*, u.first_name, u.last_name
FROM sales_orders so
JOIN users u ON so.created_by = u.id
WHERE so.id = $1;

-- name: ListSalesOrders :many
SELECT so.*, u.first_name, u.last_name
FROM sales_orders so
JOIN users u ON so.created_by = u.id
ORDER BY so.order_date DESC, so.created_at DESC
LIMIT $1 OFFSET $2;

-- name: ListSalesOrdersWithFilter :many
SELECT so.*, u.first_name, u.last_name
FROM sales_orders so
JOIN users u ON so.created_by = u.id
WHERE ($1::text IS NULL OR so.status = $1)
  AND ($2::text IS NULL OR so.customer_name ILIKE '%' || $2 || '%')
  AND ($3::date IS NULL OR so.order_date >= $3)
  AND ($4::date IS NULL OR so.order_date <= $4)
ORDER BY so.order_date DESC, so.created_at DESC
LIMIT $5 OFFSET $6;

-- name: UpdateSalesOrder :one
UPDATE sales_orders
SET customer_name = $2, customer_contact = $3, status = $4, expected_delivery_date = $5, shipped_date = $6, delivered_date = $7, notes = $8, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateSalesOrderTotal :one
UPDATE sales_orders
SET total_amount = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: CountSalesOrders :one
SELECT COUNT(*) FROM sales_orders;

-- name: CountSalesOrdersWithFilter :one
SELECT COUNT(*)
FROM sales_orders so
WHERE ($1::text IS NULL OR so.status = $1)
  AND ($2::text IS NULL OR so.customer_name ILIKE '%' || $2 || '%')
  AND ($3::date IS NULL OR so.order_date >= $3)
  AND ($4::date IS NULL OR so.order_date <= $4);



