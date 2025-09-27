package models

import "time"

type Document struct {
	ID              string    `json:"id"`
	PurchaseOrderID string    `json:"purchase_order_id"`
	FileName        string    `json:"file_name"`
	FilePath        string    `json:"file_path"`
	FileSize        int64     `json:"file_size"`
	FileType        string    `json:"file_type"`
	UploadedAt      time.Time `json:"uploaded_at"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	// Validation fields
	HasPOReference  *bool     `json:"has_po_reference,omitempty"`
	HasMatchingDate *bool     `json:"has_matching_date,omitempty"`
	ValidationStatus string   `json:"validation_status,omitempty"`
	ValidationNotes  *string  `json:"validation_notes,omitempty"`
}

