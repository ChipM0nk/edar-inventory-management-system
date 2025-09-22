package models

import (
	"time"

	"github.com/google/uuid"
)

type Supplier struct {
	ID           uuid.UUID `json:"id" db:"id"`
	Name         string    `json:"name" db:"name"`
	ContactPerson string   `json:"contact_person" db:"contact_person"`
	Email        string    `json:"email" db:"email"`
	Phone        string    `json:"phone" db:"phone"`
	Address      string    `json:"address" db:"address"`
	City         string    `json:"city" db:"city"`
	State        string    `json:"state" db:"state"`
	Country      string    `json:"country" db:"country"`
	PostalCode   string    `json:"postal_code" db:"postal_code"`
	IsActive     bool      `json:"is_active" db:"is_active"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

type CreateSupplierRequest struct {
	Name         string `json:"name" validate:"required,min=2,max=255"`
	ContactPerson string `json:"contact_person" validate:"max=255"`
	Email        string `json:"email" validate:"omitempty,email"`
	Phone        string `json:"phone" validate:"max=50"`
	Address      string `json:"address" validate:"max=500"`
	City         string `json:"city" validate:"max=100"`
	State        string `json:"state" validate:"max=100"`
	Country      string `json:"country" validate:"max=100"`
	PostalCode   string `json:"postal_code" validate:"max=20"`
}

type UpdateSupplierRequest struct {
	Name         string `json:"name" validate:"omitempty,min=2,max=255"`
	ContactPerson string `json:"contact_person" validate:"max=255"`
	Email        string `json:"email" validate:"omitempty,email"`
	Phone        string `json:"phone" validate:"max=50"`
	Address      string `json:"address" validate:"max=500"`
	City         string `json:"city" validate:"max=100"`
	State        string `json:"state" validate:"max=100"`
	Country      string `json:"country" validate:"max=100"`
	PostalCode   string `json:"postal_code" validate:"max=20"`
}

type SupplierFilter struct {
	Name         *string `json:"name"`
	ContactPerson *string `json:"contact_person"`
	Email        *string `json:"email"`
	City         *string `json:"city"`
	IsActive     *bool   `json:"is_active"`
	Page         int     `json:"page"`
	Limit        int     `json:"limit"`
	SortBy       string  `json:"sort_by"`
	SortOrder    string  `json:"sort_order"`
}
