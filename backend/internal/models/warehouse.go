package models

import (
	"time"

	"github.com/google/uuid"
)

type Warehouse struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	Name         string     `json:"name" db:"name"`
	Location     string     `json:"location" db:"location"`
	Address      *string    `json:"address,omitempty" db:"address"`
	ContactPerson *string   `json:"contact_person,omitempty" db:"contact_person"`
	ContactPhone *string    `json:"contact_phone,omitempty" db:"contact_phone"`
	IsActive     bool       `json:"is_active" db:"is_active"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at" db:"updated_at"`
}

type CreateWarehouseRequest struct {
	Name         string  `json:"name" validate:"required"`
	Location     string  `json:"location" validate:"required"`
	Address      *string `json:"address,omitempty"`
	ContactPerson *string `json:"contact_person,omitempty"`
	ContactPhone *string `json:"contact_phone,omitempty"`
}

type UpdateWarehouseRequest struct {
	Name         string  `json:"name" validate:"required"`
	Location     string  `json:"location" validate:"required"`
	Address      *string `json:"address,omitempty"`
	ContactPerson *string `json:"contact_person,omitempty"`
	ContactPhone *string `json:"contact_phone,omitempty"`
	IsActive     bool    `json:"is_active"`
}

type WarehouseFilter struct {
	Name     *string `json:"name"`
	IsActive *bool   `json:"is_active"`
	Page     int     `json:"page" validate:"min=1"`
	Limit    int     `json:"limit" validate:"min=1,max=100"`
}