package models

import (
	"encoding/json"
	"time"
)

type PurchaseOrder struct {
	ID                   string              `json:"id"`
	PoNumber             string              `json:"po_number" validate:"required"`
	SupplierName         string              `json:"supplier_name"`
	SupplierContact      *string             `json:"supplier_contact"`
	TotalAmount          float64             `json:"total_amount"`
	Status               string              `json:"status"`
	OrderDate            time.Time           `json:"order_date"`
	ExpectedDeliveryDate *time.Time          `json:"expected_delivery_date"`
	ReceivedDate         *time.Time          `json:"received_date"`
	Notes                *string             `json:"notes"`
	CreatedBy            string              `json:"created_by"`
	CreatedByFirstName   *string             `json:"created_by_first_name"`
	CreatedByLastName    *string             `json:"created_by_last_name"`
	CancelledBy          *string             `json:"cancelled_by"`
	CancelledByFirstName *string             `json:"cancelled_by_first_name"`
	CancelledByLastName  *string             `json:"cancelled_by_last_name"`
	CancelledAt          *time.Time          `json:"cancelled_at"`
	CancellationReason   *string             `json:"cancellation_reason"`
	CreatedAt            time.Time           `json:"created_at"`
	UpdatedAt            time.Time           `json:"updated_at"`
	Items                []PurchaseOrderItem `json:"items,omitempty"`
	WarehouseID          *string             `json:"warehouse_id,omitempty"`
	WarehouseName        *string             `json:"warehouse_name,omitempty"`
}

// PurchaseOrderItem represents a line item in a purchase order
type PurchaseOrderItem struct {
	ID               string  `json:"id"`
	PurchaseOrderID  string  `json:"purchase_order_id"`
	ProductID        string  `json:"product_id"`
	ProductName      string  `json:"product_name"`
	SKU              string  `json:"sku"`
	Quantity         int32   `json:"quantity"`
	UnitPrice        float64 `json:"unit_price"`
	TotalPrice       float64 `json:"total_price"`
	ReceivedQuantity *int32  `json:"received_quantity"`
}

type CreatePurchaseOrderRequest struct {
	PoNumber             string     `json:"po_number" validate:"required"`
	SupplierName         string     `json:"supplier_name"`
	SupplierContact      *string    `json:"supplier_contact"`
	OrderDate            time.Time  `json:"order_date"`
	ExpectedDeliveryDate *time.Time `json:"expected_delivery_date"`
	Notes                *string    `json:"notes"`
	CreatedBy            string     `json:"created_by"`
	WarehouseID          *string    `json:"warehouse_id"`
}

// UnmarshalJSON implements custom JSON unmarshaling for CreatePurchaseOrderRequest
func (r *CreatePurchaseOrderRequest) UnmarshalJSON(data []byte) error {
	type Alias CreatePurchaseOrderRequest
	aux := &struct {
		OrderDate            string  `json:"order_date"`
		ExpectedDeliveryDate *string `json:"expected_delivery_date"`
		*Alias
	}{
		Alias: (*Alias)(r),
	}

	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	// Parse order_date
	if aux.OrderDate != "" {
		// Try parsing as ISO 8601 first
		if t, err := time.Parse(time.RFC3339, aux.OrderDate); err == nil {
			r.OrderDate = t
		} else if t, err := time.Parse("2006-01-02T15:04:05Z", aux.OrderDate); err == nil {
			r.OrderDate = t
		} else if t, err := time.Parse("2006-01-02", aux.OrderDate); err == nil {
			r.OrderDate = t
		} else {
			return err
		}
	}

	// Parse expected_delivery_date
	if aux.ExpectedDeliveryDate != nil && *aux.ExpectedDeliveryDate != "" {
		// Try parsing as ISO 8601 first
		if t, err := time.Parse(time.RFC3339, *aux.ExpectedDeliveryDate); err == nil {
			r.ExpectedDeliveryDate = &t
		} else if t, err := time.Parse("2006-01-02T15:04:05Z", *aux.ExpectedDeliveryDate); err == nil {
			r.ExpectedDeliveryDate = &t
		} else if t, err := time.Parse("2006-01-02", *aux.ExpectedDeliveryDate); err == nil {
			r.ExpectedDeliveryDate = &t
		} else {
			return err
		}
	}

	return nil
}

type UpdatePurchaseOrderRequest struct {
	SupplierName         string     `json:"supplier_name"`
	SupplierContact      *string    `json:"supplier_contact"`
	Status               string     `json:"status"`
	ExpectedDeliveryDate *time.Time `json:"expected_delivery_date"`
	ReceivedDate         *time.Time `json:"received_date"`
	Notes                *string    `json:"notes"`
}
