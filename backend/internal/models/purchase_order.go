package models

import "time"

type PurchaseOrder struct {
	ID                   string     `json:"id"`
	PoNumber             string     `json:"po_number"`
	SupplierName         string     `json:"supplier_name"`
	SupplierContact      *string    `json:"supplier_contact"`
	TotalAmount          float64    `json:"total_amount"`
	Status               string     `json:"status"`
	OrderDate            time.Time  `json:"order_date"`
	ExpectedDeliveryDate *time.Time `json:"expected_delivery_date"`
	ReceivedDate         *time.Time `json:"received_date"`
	Notes                *string    `json:"notes"`
	CreatedBy            string     `json:"created_by"`
	CreatedByFirstName   *string    `json:"created_by_first_name"`
	CreatedByLastName    *string    `json:"created_by_last_name"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
}

type CreatePurchaseOrderRequest struct {
	PoNumber             string     `json:"po_number"`
	SupplierName         string     `json:"supplier_name"`
	SupplierContact      *string    `json:"supplier_contact"`
	OrderDate            time.Time  `json:"order_date"`
	ExpectedDeliveryDate *time.Time `json:"expected_delivery_date"`
	Notes                *string    `json:"notes"`
	CreatedBy            string     `json:"created_by"`
}

type UpdatePurchaseOrderRequest struct {
	SupplierName         string     `json:"supplier_name"`
	SupplierContact      *string    `json:"supplier_contact"`
	Status               string     `json:"status"`
	ExpectedDeliveryDate *time.Time `json:"expected_delivery_date"`
	ReceivedDate         *time.Time `json:"received_date"`
	Notes                *string    `json:"notes"`
}

