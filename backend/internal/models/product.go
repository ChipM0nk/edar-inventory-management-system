package models

import (
	"time"

	"github.com/google/uuid"
)

type Product struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	SKU         string     `json:"sku" db:"sku"`
	Name        string     `json:"name" db:"name"`
	Description *string    `json:"description" db:"description"`
	CategoryID  *uuid.UUID `json:"category_id" db:"category_id"`
	SupplierID  *uuid.UUID `json:"supplier_id" db:"supplier_id"`
	Category    *string    `json:"category,omitempty"`
	Supplier    *string    `json:"supplier,omitempty"`
	UnitPrice   float64    `json:"unit_price" db:"unit_price"`
	IsActive    bool       `json:"is_active" db:"is_active"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
}

type CreateProductRequest struct {
	SKU         string     `json:"sku" validate:"required"`
	Name        string     `json:"name" validate:"required"`
	Description *string    `json:"description"`
	CategoryID  *uuid.UUID `json:"category_id" validate:"required"`
	SupplierID  *uuid.UUID `json:"supplier_id" validate:"required"`
	UnitPrice   float64    `json:"unit_price" validate:"required,min=0"`
}

type UpdateProductRequest struct {
	SKU         string     `json:"sku" validate:"required"`
	Name        string     `json:"name" validate:"required"`
	Description *string    `json:"description"`
	CategoryID  *uuid.UUID `json:"category_id" validate:"required"`
	SupplierID  *uuid.UUID `json:"supplier_id" validate:"required"`
	UnitPrice   float64    `json:"unit_price" validate:"required,min=0"`
}

type ProductFilter struct {
	Name       *string     `json:"name"`
	CategoryID *uuid.UUID  `json:"category_id"`
	SupplierID *uuid.UUID  `json:"supplier_id"`
	Page       int         `json:"page" validate:"min=1"`
	Limit      int         `json:"limit" validate:"min=1,max=100"`
	SortBy     string      `json:"sort_by"`
	SortOrder  string      `json:"sort_order"`
}

type ProductListResponse struct {
	Products []Product `json:"products"`
	Total    int64     `json:"total"`
	Page     int       `json:"page"`
	Limit    int       `json:"limit"`
	Pages    int       `json:"pages"`
}
