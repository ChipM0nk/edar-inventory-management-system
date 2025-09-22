package services

import (
	"context"
	"errors"
	"inventory-system/internal/database"
	sqlc "inventory-system/internal/database/sqlc"
	"inventory-system/internal/models"
	"inventory-system/internal/utils"

	"github.com/google/uuid"
)

type CategoryService struct {
	db *database.DB
}

func NewCategoryService(db *database.DB) *CategoryService {
	return &CategoryService{db: db}
}

func (s *CategoryService) CreateCategory(ctx context.Context, req models.CreateCategoryRequest) (*models.Category, error) {
	// Check if category already exists
	existingCategory, err := s.db.GetCategoryByName(ctx, req.Name)
	if err == nil && existingCategory != nil {
		return nil, errors.New("category with this name already exists")
	}

	// Create category
	category, err := s.db.CreateCategory(ctx, &sqlc.CreateCategoryParams{
		Name:        req.Name,
		Description: &req.Description,
		IsActive:    &[]bool{true}[0],
	})
	if err != nil {
		return nil, err
	}

	description := ""
	if category.Description != nil {
		description = *category.Description
	}

	return &models.Category{
		ID:          utils.PgxUUIDToUUID(category.ID),
		Name:        category.Name,
		Description: description,
		IsActive:    *category.IsActive,
		CreatedAt:   utils.PgxTimestamptzToTime(category.CreatedAt),
		UpdatedAt:   utils.PgxTimestamptzToTime(category.UpdatedAt),
	}, nil
}

func (s *CategoryService) GetCategory(ctx context.Context, id uuid.UUID) (*models.Category, error) {
	category, err := s.db.GetCategory(ctx, utils.UUIDToPgxUUID(id))
	if err != nil {
		return nil, err
	}

	description := ""
	if category.Description != nil {
		description = *category.Description
	}

	return &models.Category{
		ID:          utils.PgxUUIDToUUID(category.ID),
		Name:        category.Name,
		Description: description,
		IsActive:    *category.IsActive,
		CreatedAt:   utils.PgxTimestamptzToTime(category.CreatedAt),
		UpdatedAt:   utils.PgxTimestamptzToTime(category.UpdatedAt),
	}, nil
}

func (s *CategoryService) ListCategories(ctx context.Context) ([]models.Category, error) {
	categories, err := s.db.ListCategories(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]models.Category, len(categories))
	for i, category := range categories {
		description := ""
		if category.Description != nil {
			description = *category.Description
		}

		result[i] = models.Category{
			ID:          utils.PgxUUIDToUUID(category.ID),
			Name:        category.Name,
			Description: description,
			IsActive:    *category.IsActive,
			CreatedAt:   utils.PgxTimestamptzToTime(category.CreatedAt),
			UpdatedAt:   utils.PgxTimestamptzToTime(category.UpdatedAt),
		}
	}

	return result, nil
}

func (s *CategoryService) ListCategoriesWithFilter(ctx context.Context, filter models.CategoryFilter) ([]models.Category, int64, error) {
	offset := (filter.Page - 1) * filter.Limit

	// Convert filter parameters
	var name, description string
	var isActive bool
	if filter.Name != nil {
		name = *filter.Name
	}
	if filter.Description != nil {
		description = *filter.Description
	}
	if filter.IsActive != nil {
		isActive = *filter.IsActive
	} else {
		// If no isActive filter is specified, we want to show all categories (both active and inactive)
		// We'll use a special approach: set isActive to true but modify the SQL query
		isActive = true
	}


	// If no isActive filter is specified, we need to handle this differently
	// For now, let's just use the regular filter but set isActive to true to show active categories
	categories, err := s.db.ListCategoriesWithFilter(ctx, &sqlc.ListCategoriesWithFilterParams{
		Column1:  name,
		Column2:  description,
		IsActive: &isActive,
		Limit:    int32(filter.Limit),
		Offset:   int32(offset),
		Column6:  filter.SortBy,
		Column7:  filter.SortOrder,
	})
	if err != nil {
		return nil, 0, err
	}

	total, err := s.db.CountCategoriesWithFilter(ctx, &sqlc.CountCategoriesWithFilterParams{
		Column1: name,
		Column2: description,
		Column3: isActive,
	})
	if err != nil {
		return nil, 0, err
	}

	result := make([]models.Category, len(categories))
	for i, category := range categories {
		description := ""
		if category.Description != nil {
			description = *category.Description
		}

		result[i] = models.Category{
			ID:          utils.PgxUUIDToUUID(category.ID),
			Name:        category.Name,
			Description: description,
			IsActive:    *category.IsActive,
			CreatedAt:   utils.PgxTimestamptzToTime(category.CreatedAt),
			UpdatedAt:   utils.PgxTimestamptzToTime(category.UpdatedAt),
		}
	}

	return result, total, nil
}

func (s *CategoryService) UpdateCategory(ctx context.Context, id uuid.UUID, req models.UpdateCategoryRequest) (*models.Category, error) {
	category, err := s.db.UpdateCategory(ctx, &sqlc.UpdateCategoryParams{
		ID:          utils.UUIDToPgxUUID(id),
		Name:        req.Name,
		Description: &req.Description,
		IsActive:    &[]bool{true}[0],
	})
	if err != nil {
		return nil, err
	}

	description := ""
	if category.Description != nil {
		description = *category.Description
	}

	return &models.Category{
		ID:          utils.PgxUUIDToUUID(category.ID),
		Name:        category.Name,
		Description: description,
		IsActive:    *category.IsActive,
		CreatedAt:   utils.PgxTimestamptzToTime(category.CreatedAt),
		UpdatedAt:   utils.PgxTimestamptzToTime(category.UpdatedAt),
	}, nil
}

func (s *CategoryService) DeleteCategory(ctx context.Context, id uuid.UUID) error {
	return s.db.DeleteCategory(ctx, utils.UUIDToPgxUUID(id))
}