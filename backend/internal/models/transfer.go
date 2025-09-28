package models

import (
	"time"
	"github.com/google/uuid"
)

type Transfer struct {
	ID                uuid.UUID  `json:"id" db:"id"`
	ReferenceNumber   string     `json:"reference_number" db:"reference_number"`
	TransferDate      time.Time  `json:"transfer_date" db:"transfer_date"`
	FromWarehouseID   uuid.UUID  `json:"from_warehouse_id" db:"from_warehouse_id"`
	ToWarehouseID     uuid.UUID  `json:"to_warehouse_id" db:"to_warehouse_id"`
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
	FromWarehouseName   *string `json:"from_warehouse_name,omitempty" db:"from_warehouse_name"`
	ToWarehouseName     *string `json:"to_warehouse_name,omitempty" db:"to_warehouse_name"`
	CreatedByFirstName  *string `json:"created_by_first_name,omitempty" db:"created_by_first_name"`
	CreatedByLastName   *string `json:"created_by_last_name,omitempty" db:"created_by_last_name"`
	ProcessedByFirstName *string `json:"processed_by_first_name,omitempty" db:"processed_by_first_name"`
	ProcessedByLastName  *string `json:"processed_by_last_name,omitempty" db:"processed_by_last_name"`
}

type TransferItem struct {
	ID         uuid.UUID `json:"id" db:"id"`
	TransferID uuid.UUID `json:"transfer_id" db:"transfer_id"`
	ProductID  uuid.UUID `json:"product_id" db:"product_id"`
	Quantity   int       `json:"quantity" db:"quantity"` // Always positive
	Reason     *string   `json:"reason,omitempty" db:"reason"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	// Joined fields
	ProductName *string `json:"product_name,omitempty" db:"product_name"`
	ProductSKU  *string `json:"product_sku,omitempty" db:"product_sku"`
}

type CreateTransferRequest struct {
	ReferenceNumber  string                `json:"reference_number" validate:"required"`
	TransferDate     time.Time             `json:"transfer_date" validate:"required"`
	FromWarehouseID  uuid.UUID             `json:"from_warehouse_id" validate:"required"`
	ToWarehouseID    uuid.UUID             `json:"to_warehouse_id" validate:"required"`
	TotalQuantity    int                   `json:"total_quantity" validate:"min=0"`
	Reason           *string               `json:"reason,omitempty"`
	Status           string                `json:"status" validate:"oneof=pending in_transit completed cancelled"`
	Notes            *string               `json:"notes,omitempty"`
	Items            []CreateTransferItemRequest `json:"items" validate:"required,min=1"`
}

type CreateTransferItemRequest struct {
	ProductID uuid.UUID `json:"product_id" validate:"required"`
	Quantity  int       `json:"quantity" validate:"required,min=1"`
	Reason    *string   `json:"reason,omitempty"`
}

type UpdateTransferRequest struct {
	ReferenceNumber *string    `json:"reference_number,omitempty"`
	TransferDate    *time.Time `json:"transfer_date,omitempty"`
	FromWarehouseID *uuid.UUID `json:"from_warehouse_id,omitempty"`
	ToWarehouseID   *uuid.UUID `json:"to_warehouse_id,omitempty"`
	TotalQuantity   *int       `json:"total_quantity,omitempty" validate:"omitempty,min=0"`
	Reason          *string    `json:"reason,omitempty"`
	Status          *string    `json:"status,omitempty" validate:"omitempty,oneof=pending in_transit completed cancelled"`
	ProcessedBy     *uuid.UUID `json:"processed_by,omitempty"`
	ProcessedDate   *time.Time `json:"processed_date,omitempty"`
	Notes           *string    `json:"notes,omitempty"`
}

type TransferFilter struct {
	Page            int        `json:"page"`
	Limit           int        `json:"limit"`
	ReferenceNumber *string    `json:"reference_number,omitempty"`
	Status          *string    `json:"status,omitempty"`
	CreatedBy       *uuid.UUID `json:"created_by,omitempty"`
	FromWarehouseID *uuid.UUID `json:"from_warehouse_id,omitempty"`
	ToWarehouseID   *uuid.UUID `json:"to_warehouse_id,omitempty"`
	DateFrom        *time.Time `json:"date_from,omitempty"`
	DateTo          *time.Time `json:"date_to,omitempty"`
}

type TransferListResponse struct {
	Transfers   []Transfer `json:"transfers"`
	Total       int64      `json:"total"`
	Page        int        `json:"page"`
	Limit       int        `json:"limit"`
	TotalPages  int        `json:"total_pages"`
}
