package models

import "time"

type Document struct {
	ID              string    `json:"id"`
	// Generic reference fields for any stock movement type
	ReferenceType   string    `json:"reference_type"`   // 'purchase_order', 'adjustment', 'transfer', 'sales_order', etc.
	ReferenceID     string    `json:"reference_id"`     // ID of the referenced record
	// File information
	FileName        string    `json:"file_name"`
	FilePath        string    `json:"file_path"`
	FileSize        int64     `json:"file_size"`
	FileType        string    `json:"file_type"`
	UploadedAt      time.Time `json:"uploaded_at"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// CreateDocumentRequest represents the request to create a new document
type CreateDocumentRequest struct {
	ReferenceType string `json:"reference_type" validate:"required,oneof=purchase_order adjustment transfer sales_order"`
	ReferenceID   string `json:"reference_id" validate:"required"`
	FileName      string `json:"file_name" validate:"required"`
	FilePath      string `json:"file_path" validate:"required"`
	FileSize      int64  `json:"file_size" validate:"required,min=1"`
	FileType      string `json:"file_type" validate:"required"`
}

