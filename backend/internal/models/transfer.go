package models

import (
	"time"

	"github.com/google/uuid"
)

type Transfer struct {
	ID                    uuid.UUID      `json:"id"`
	ReferenceNumber       string         `json:"reference_number"`
	FromWarehouseID       uuid.UUID      `json:"from_warehouse_id"`
	FromWarehouseName     string         `json:"from_warehouse_name,omitempty"`
	FromWarehouseLocation string         `json:"from_warehouse_location,omitempty"`
	ToWarehouseID         uuid.UUID      `json:"to_warehouse_id"`
	ToWarehouseName       string         `json:"to_warehouse_name,omitempty"`
	ToWarehouseLocation   string         `json:"to_warehouse_location,omitempty"`
	Reason                *string        `json:"reason,omitempty"`
	TransferDate          time.Time      `json:"transfer_date"`
	TotalQuantity         int            `json:"total_quantity"`
	Status                string         `json:"status"`
	CreatedBy             uuid.UUID      `json:"created_by"`
	CreatedByName         string         `json:"created_by_name,omitempty"`
	ProcessedBy           *uuid.UUID     `json:"processed_by,omitempty"`
	ProcessedByName       string         `json:"processed_by_name,omitempty"`
	ProcessedDate         *time.Time     `json:"processed_date,omitempty"`
	Notes                 *string        `json:"notes,omitempty"`
	CreatedAt             time.Time      `json:"created_at"`
	UpdatedAt             time.Time      `json:"updated_at"`
	Items                 []TransferItem `json:"items,omitempty"`
}

type TransferItem struct {
	ID          uuid.UUID `json:"id"`
	TransferID  uuid.UUID `json:"transfer_id"`
	ProductID   uuid.UUID `json:"product_id"`
	ProductName string    `json:"product_name,omitempty"`
	ProductSKU  string    `json:"product_sku,omitempty"`
	Quantity    int       `json:"quantity"`
	Reason      *string   `json:"reason,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateTransferRequest struct {
	ReferenceNumber string                `json:"reference_number" validate:"required"`
	FromWarehouseID uuid.UUID             `json:"from_warehouse_id" validate:"required"`
	ToWarehouseID   uuid.UUID             `json:"to_warehouse_id" validate:"required"`
	Reason          *string               `json:"reason,omitempty"`
	Notes           *string               `json:"notes,omitempty"`
	TransferDate    string                `json:"transfer_date" validate:"required"`
	Items           []TransferItemRequest `json:"items" validate:"required,min=1"`
}

type TransferItemRequest struct {
	ProductID uuid.UUID `json:"product_id" validate:"required"`
	Quantity  int       `json:"quantity" validate:"required,min=1"`
	Reason    *string   `json:"reason,omitempty"`
}

type TransferFilter struct {
	Page             int        `json:"page"`
	Limit            int        `json:"limit"`
	ReferenceNumber  *string    `json:"reference_number,omitempty"`
	Status           *string    `json:"status,omitempty"`
	CreatedBy        *uuid.UUID `json:"created_by,omitempty"`
	FromWarehouseID  *uuid.UUID `json:"from_warehouse_id,omitempty"`
	ToWarehouseID    *uuid.UUID `json:"to_warehouse_id,omitempty"`
	TransferDateFrom *time.Time `json:"transfer_date_from,omitempty"`
	TransferDateTo   *time.Time `json:"transfer_date_to,omitempty"`
}

type TransferResponse struct {
	Transfers []Transfer `json:"transfers"`
	Total     int64      `json:"total"`
	Page      int        `json:"page"`
	Limit     int        `json:"limit"`
}
