package models

import (
	"encoding/json"
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
	// Reference fields for PO/SO connections
	ReferenceType     *string    `json:"reference_type,omitempty" db:"reference_type"`
	ReferenceID       *uuid.UUID `json:"reference_id,omitempty" db:"reference_id"`
	AdjustmentReason  *string    `json:"adjustment_reason,omitempty" db:"adjustment_reason"`
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
	CostPrice    float64   `json:"cost_price" db:"cost_price"`
	// Reference fields for item-level tracking
	ReferenceType     *string `json:"reference_type,omitempty" db:"reference_type"`
	ReferenceID       *uuid.UUID `json:"reference_id,omitempty" db:"reference_id"`
	ReferenceNumber   *string `json:"reference_number,omitempty" db:"reference_number"`
	AdjustmentReason  *string `json:"adjustment_reason,omitempty" db:"adjustment_reason"`
	ExpectedQuantity  *int   `json:"expected_quantity,omitempty" db:"expected_quantity"`
	ActualQuantity    *int   `json:"actual_quantity,omitempty" db:"actual_quantity"`
	VarianceQuantity  *int   `json:"variance_quantity,omitempty" db:"variance_quantity"`
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
	CreatedBy       uuid.UUID  `json:"created_by" validate:"required"`
	// Reference fields for PO/SO connections
	ReferenceType    *string `json:"reference_type,omitempty" validate:"omitempty,oneof=purchase_order sales_order cycle_count damage theft expired transfer other"`
	ReferenceID      *uuid.UUID `json:"reference_id,omitempty"`
	AdjustmentReason *string `json:"adjustment_reason,omitempty" validate:"omitempty,oneof=receiving_discrepancy damaged_goods quality_issue short_shipment over_shipment customer_return defective_return exchange warranty_replacement cycle_count_correction theft_loss expired_product storage_damage transfer_correction other"`
	Items           []CreateAdjustmentItemRequest `json:"items" validate:"required,min=1"`
}

type CreateAdjustmentItemRequest struct {
	ProductID   uuid.UUID `json:"product_id" validate:"required"`
	WarehouseID uuid.UUID `json:"warehouse_id" validate:"required"`
	Quantity    int       `json:"quantity" validate:"required"`
	CostPrice   float64   `json:"cost_price" validate:"required,min=0"`
	Reason      *string   `json:"reason,omitempty"`
	// Reference fields for item-level tracking
	ReferenceType     *string `json:"reference_type,omitempty" validate:"omitempty,oneof=purchase_order sales_order cycle_count damage theft expired transfer other"`
	ReferenceID       *uuid.UUID `json:"reference_id,omitempty"`
	ReferenceNumber   *string `json:"reference_number,omitempty"`
	AdjustmentReason  *string `json:"adjustment_reason,omitempty" validate:"omitempty,oneof=receiving_discrepancy damaged_goods quality_issue short_shipment over_shipment customer_return defective_return exchange warranty_replacement cycle_count_correction theft_loss expired_product storage_damage transfer_correction other"`
	ExpectedQuantity  *int   `json:"expected_quantity,omitempty"`
	ActualQuantity    *int   `json:"actual_quantity,omitempty"`
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

// UnmarshalJSON implements custom JSON unmarshaling for CreateAdjustmentRequest
func (r *CreateAdjustmentRequest) UnmarshalJSON(data []byte) error {
	type Alias CreateAdjustmentRequest
	aux := &struct {
		AdjustmentDate string `json:"adjustment_date"`
		*Alias
	}{
		Alias: (*Alias)(r),
	}

	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	// Parse adjustment_date
	if aux.AdjustmentDate != "" {
		// Try parsing as ISO 8601 first
		if t, err := time.Parse(time.RFC3339, aux.AdjustmentDate); err == nil {
			r.AdjustmentDate = t
		} else if t, err := time.Parse("2006-01-02T15:04:05Z", aux.AdjustmentDate); err == nil {
			r.AdjustmentDate = t
		} else if t, err := time.Parse("2006-01-02", aux.AdjustmentDate); err == nil {
			r.AdjustmentDate = t
		} else {
			return err
		}
	}

	return nil
}
