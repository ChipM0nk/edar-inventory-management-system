package models

import (
	"time"

	"github.com/google/uuid"
)

type Category struct {
	ID          uuid.UUID `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	IsActive    bool      `json:"is_active" db:"is_active"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type CreateCategoryRequest struct {
	Name        string `json:"name" validate:"required,min=2,max=100"`
	Description string `json:"description" validate:"max=500"`
}

type UpdateCategoryRequest struct {
	Name        string `json:"name" validate:"omitempty,min=2,max=100"`
	Description string `json:"description" validate:"max=500"`
}

type CategoryFilter struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	IsActive    *bool   `json:"is_active"`
	Page        int     `json:"page"`
	Limit       int     `json:"limit"`
	SortBy      string  `json:"sort_by"`
	SortOrder   string  `json:"sort_order"`
}
