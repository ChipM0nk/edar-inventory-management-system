package models

import (
	"time"
	"github.com/google/uuid"
)

type Adjustment struct {
	ID                uuid.UUID  `json:"id" db:"id"`
	ReferenceNumber   string     `json:"reference_number" db:"reference_number"`
	AdjustmentDate    time.Time  `json:"adjustment_date" db:"adjustment_date"`
	TotalQuantity     int        `json:"total_quantity" db:"total_quantity"`
	Reason            *string    `json:"reason,omitempty" db:"reason"`
	Status            string     `json:"status" db:"status"`
	CreatedBy         uuid.UUID  `json:"created_by" db:"created_by"`
	ProcessedBy       *uuid.UUID `json:"processed_by,omitempty" db:"processed_by"`
	ProcessedDate     *time.Time `json:"processed_date,omitempty" db:"processed_date"`
	Notes             *string    `json:"notes,omitempty" db:"notes"`
	CreatedAt         time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at" db:"updated_at"`
	// Joined fields
	CreatedByFirstName  *string `json:"created_by_first_name,omitempty" db:"created_by_first_name"`
	CreatedByLastName   *string `json:"created_by_last_name,omitempty" db:"created_by_last_name"`
	ProcessedByFirstName *string `json:"processed_by_first_name,omitempty" db:"processed_by_first_name"`
	ProcessedByLastName  *string `json:"processed_by_last_name,omitempty" db:"processed_by_last_name"`
}

type AdjustmentItem struct {
	ID           uuid.UUID `json:"id" db:"id"`
	AdjustmentID uuid.UUID `json:"adjustment_id" db:"adjustment_id"`
	ProductID    uuid.UUID `json:"product_id" db:"product_id"`
	WarehouseID  uuid.UUID `json:"warehouse_id" db:"warehouse_id"`
	Quantity     int       `json:"quantity" db:"quantity"` // Can be positive (add) or negative (subtract)
	Reason       *string   `json:"reason,omitempty" db:"reason"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	// Joined fields
	ProductName   *string `json:"product_name,omitempty" db:"product_name"`
	ProductSKU    *string `json:"product_sku,omitempty" db:"product_sku"`
	WarehouseName *string `json:"warehouse_name,omitempty" db:"warehouse_name"`
}

type CreateAdjustmentRequest struct {
	ReferenceNumber string     `json:"reference_number" validate:"required"`
	AdjustmentDate  time.Time  `json:"adjustment_date" validate:"required"`
	TotalQuantity   int        `json:"total_quantity" validate:"min=0"`
	Reason          *string    `json:"reason,omitempty"`
	Status          string     `json:"status" validate:"oneof=pending approved completed cancelled"`
	Notes           *string    `json:"notes,omitempty"`
	Items           []CreateAdjustmentItemRequest `json:"items" validate:"required,min=1"`
}

type CreateAdjustmentItemRequest struct {
	ProductID   uuid.UUID `json:"product_id" validate:"required"`
	WarehouseID uuid.UUID `json:"warehouse_id" validate:"required"`
	Quantity    int       `json:"quantity" validate:"required"`
	Reason      *string   `json:"reason,omitempty"`
}

type UpdateAdjustmentRequest struct {
	ReferenceNumber *string    `json:"reference_number,omitempty"`
	AdjustmentDate  *time.Time `json:"adjustment_date,omitempty"`
	TotalQuantity   *int       `json:"total_quantity,omitempty" validate:"omitempty,min=0"`
	Reason          *string    `json:"reason,omitempty"`
	Status          *string    `json:"status,omitempty" validate:"omitempty,oneof=pending approved completed cancelled"`
	ProcessedBy     *uuid.UUID `json:"processed_by,omitempty"`
	ProcessedDate   *time.Time `json:"processed_date,omitempty"`
	Notes           *string    `json:"notes,omitempty"`
}

type AdjustmentFilter struct {
	Page           int        `json:"page"`
	Limit          int        `json:"limit"`
	ReferenceNumber *string   `json:"reference_number,omitempty"`
	Status         *string    `json:"status,omitempty"`
	CreatedBy      *uuid.UUID `json:"created_by,omitempty"`
	DateFrom       *time.Time `json:"date_from,omitempty"`
	DateTo         *time.Time `json:"date_to,omitempty"`
}

type AdjustmentListResponse struct {
	Adjustments []Adjustment `json:"adjustments"`
	Total       int64        `json:"total"`
	Page        int          `json:"page"`
	Limit       int          `json:"limit"`
	TotalPages  int          `json:"total_pages"`
}
