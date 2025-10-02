-- name: CreateDocument :one
INSERT INTO documents (
    purchase_order_id,
    reference_type,
    reference_id,
    file_name,
    file_path,
    file_size,
    file_type,
    validation_status
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, 'pending'
) RETURNING *;

-- name: GetDocumentsByPurchaseOrder :many
SELECT * FROM documents 
WHERE purchase_order_id = $1 
ORDER BY uploaded_at DESC;

-- name: GetDocumentsByReference :many
SELECT * FROM documents 
WHERE reference_type = $1 AND reference_id = $2 
ORDER BY uploaded_at DESC;

-- name: DeleteDocument :exec
DELETE FROM documents WHERE id = $1;

-- name: GetDocumentByID :one
SELECT * FROM documents WHERE id = $1;

-- name: UpdateDocumentValidation :one
UPDATE documents 
SET has_po_reference = $2, 
    has_matching_date = $3, 
    validation_status = $4, 
    validation_notes = $5,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

