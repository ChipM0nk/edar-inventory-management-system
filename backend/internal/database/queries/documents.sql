-- name: CreateDocument :one
INSERT INTO documents (
    reference_type,
    reference_id,
    file_name,
    file_path,
    file_size,
    file_type
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: GetDocumentsByPurchaseOrder :many
SELECT * FROM documents 
WHERE reference_type = 'purchase_order' AND reference_id = $1 
ORDER BY uploaded_at DESC;

-- name: GetDocumentsByReference :many
SELECT * FROM documents 
WHERE reference_type = $1 AND reference_id = $2 
ORDER BY uploaded_at DESC;

-- name: DeleteDocument :exec
DELETE FROM documents WHERE id = $1;

-- name: GetDocumentByID :one
SELECT * FROM documents WHERE id = $1;


-- name: ListAllDocuments :many
SELECT * FROM documents 
ORDER BY uploaded_at DESC
LIMIT $1 OFFSET $2;

-- name: GetDocumentsByTypeOnly :many
SELECT * FROM documents 
WHERE reference_type = $1
ORDER BY uploaded_at DESC;

