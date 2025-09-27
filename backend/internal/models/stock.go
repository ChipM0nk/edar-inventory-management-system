package models

import (
	"time"

	"github.com/google/uuid"
)

type StockLevel struct {
	ID                uuid.UUID `json:"id" db:"id"`
	ProductID         uuid.UUID `json:"product_id" db:"product_id"`
	WarehouseID       uuid.UUID `json:"warehouse_id" db:"warehouse_id"`
	Quantity          int       `json:"quantity" db:"quantity"`
	ReservedQuantity  int       `json:"reserved_quantity" db:"reserved_quantity"`
	AvailableQuantity int       `json:"available_quantity" db:"available_quantity"`
	MinStockLevel     int       `json:"min_stock_level" db:"min_stock_level"`
	MaxStockLevel     *int      `json:"max_stock_level" db:"max_stock_level"`
	LastUpdated       time.Time `json:"last_updated" db:"last_updated"`
	CreatedAt         time.Time `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time `json:"updated_at" db:"updated_at"`
	// Joined fields
	ProductName   *string `json:"product_name,omitempty" db:"product_name"`
	ProductSKU    *string `json:"product_sku,omitempty" db:"sku"`
	WarehouseName *string `json:"warehouse_name,omitempty" db:"warehouse_name"`
}

type StockMovement struct {
	ID            uuid.UUID  `json:"id" db:"id"`
	ProductID     uuid.UUID  `json:"product_id" db:"product_id"`
	WarehouseID   uuid.UUID  `json:"warehouse_id" db:"warehouse_id"`
	MovementType  string     `json:"movement_type" db:"movement_type"`
	Quantity      int        `json:"quantity" db:"quantity"`
	CostPrice     *float64   `json:"cost_price,omitempty" db:"cost_price"`
	TotalAmount   *float64   `json:"total_amount,omitempty" db:"total_amount"`
	ReferenceType *string    `json:"reference_type" db:"reference_type"`
	ReferenceID   *uuid.UUID `json:"reference_id" db:"reference_id"`
	ReferenceNumber *string  `json:"reference_number,omitempty" db:"reference_number"`
	Reason        *string    `json:"reason" db:"reason"`
	UserID        *uuid.UUID `json:"user_id" db:"user_id"`
	ProcessedBy   *uuid.UUID `json:"processed_by" db:"processed_by"`
	ProcessedDate *time.Time `json:"processed_date" db:"processed_date"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	// Joined fields
	ProductName   *string `json:"product_name,omitempty" db:"product_name"`
	ProductSKU    *string `json:"product_sku,omitempty" db:"sku"`
	WarehouseName *string `json:"warehouse_name,omitempty" db:"warehouse_name"`
	UserFirstName *string `json:"user_first_name,omitempty" db:"first_name"`
	UserLastName  *string `json:"user_last_name,omitempty" db:"last_name"`
	ProcessedByFirstName *string `json:"processed_by_first_name,omitempty" db:"processed_by_first_name"`
	ProcessedByLastName  *string `json:"processed_by_last_name,omitempty" db:"processed_by_last_name"`
	SupplierName  *string `json:"supplier_name,omitempty" db:"supplier_name"`
}

type CreateStockMovementRequest struct {
	ProductID     uuid.UUID  `json:"product_id" validate:"required"`
	WarehouseID   uuid.UUID  `json:"warehouse_id" validate:"required"`
	MovementType  string     `json:"movement_type" validate:"required,oneof=in out transfer adjustment"`
	Quantity      int        `json:"quantity" validate:"required"`
	CostPrice     *float64   `json:"cost_price,omitempty" validate:"omitempty,min=0"`
	ReferenceType *string    `json:"reference_type"`
	ReferenceID   *uuid.UUID `json:"reference_id"`
	Reason        *string    `json:"reason"`
}

type BulkStockMovementRequest struct {
	SupplierID      uuid.UUID                    `json:"supplier_id" validate:"required"`
	ReferenceNumber *string                      `json:"reference_number,omitempty"`
	ProcessedBy     uuid.UUID                    `json:"processed_by,omitempty"`
	ProcessedDate   time.Time                    `json:"processed_date,omitempty"`
	Items           []BulkStockMovementItem      `json:"items" validate:"required,min=1"`
}

type BulkStockMovementItem struct {
	ProductID   uuid.UUID `json:"product_id" validate:"required"`
	WarehouseID uuid.UUID `json:"warehouse_id" validate:"required"`
	Quantity    int       `json:"quantity" validate:"required,min=1"`
	CostPrice   *float64  `json:"cost_price,omitempty" validate:"omitempty,min=0"`
	Reason      *string   `json:"reason"`
}

type StockLevelFilter struct {
	ProductID   *uuid.UUID `json:"product_id"`
	WarehouseID *uuid.UUID `json:"warehouse_id"`
	ProductName *string    `json:"product_name"`
	ProductSKU  *string    `json:"product_sku"`
	Page        int        `json:"page" validate:"min=1"`
	Limit       int        `json:"limit" validate:"min=1,max=100"`
}

type StockMovementFilter struct {
	ProductID     *uuid.UUID `json:"product_id"`
	WarehouseID   *uuid.UUID `json:"warehouse_id"`
	MovementType  *string    `json:"movement_type"`
	DateFrom      *time.Time `json:"date_from"`
	DateTo        *time.Time `json:"date_to"`
	Page          int        `json:"page" validate:"min=1"`
	Limit         int        `json:"limit" validate:"min=1,max=100"`
}

type StockLevelListResponse struct {
	StockLevels []StockLevel `json:"stock_levels"`
	Total       int64        `json:"total"`
	Page        int          `json:"page"`
	Limit       int          `json:"limit"`
	Pages       int          `json:"pages"`
}

type StockMovementListResponse struct {
	StockMovements []StockMovement `json:"stock_movements"`
	Total          int64           `json:"total"`
	Page           int             `json:"page"`
	Limit          int             `json:"limit"`
	Pages          int             `json:"pages"`
}

type SOHReport struct {
	ProductID     uuid.UUID `json:"product_id"`
	ProductName   string    `json:"product_name"`
	ProductSKU    string    `json:"product_sku"`
	WarehouseID   uuid.UUID `json:"warehouse_id"`
	WarehouseName string    `json:"warehouse_name"`
	Quantity      int       `json:"quantity"`
	ReservedQty   int       `json:"reserved_quantity"`
	AvailableQty  int       `json:"available_quantity"`
	MinLevel      int       `json:"min_stock_level"`
	MaxLevel      *int      `json:"max_stock_level"`
	LastUpdated   time.Time `json:"last_updated"`
}

type StockInTransaction struct {
	ReferenceID           *uuid.UUID `json:"reference_id" db:"reference_id"`
	ProcessedDate         *time.Time `json:"processed_date" db:"processed_date"`
	ProcessedBy           *uuid.UUID `json:"processed_by" db:"processed_by"`
	ProcessedByFirstName  *string    `json:"processed_by_first_name" db:"processed_by_first_name"`
	ProcessedByLastName   *string    `json:"processed_by_last_name" db:"processed_by_last_name"`
	ItemCount             int64      `json:"item_count" db:"item_count"`
	TotalAmount           *float64   `json:"total_amount" db:"total_amount"`
	CreatedAt             time.Time  `json:"created_at" db:"created_at"`
}

type StockInTransactionListResponse struct {
	Transactions []StockInTransaction `json:"transactions"`
	Total        int64                `json:"total"`
	Page         int                  `json:"page"`
	Limit        int                  `json:"limit"`
	Pages        int                  `json:"pages"`
}
