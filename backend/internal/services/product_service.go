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

type ProductService struct {
	db *database.DB
}

func NewProductService(db *database.DB) *ProductService {
	return &ProductService{db: db}
}

func (s *ProductService) CreateProduct(ctx context.Context, req models.CreateProductRequest) (*models.Product, error) {
	// Check if product with SKU already exists
	existingProduct, err := s.db.GetProductBySKU(ctx, req.SKU)
	if err == nil && existingProduct != nil {
		return nil, errors.New("product with this SKU already exists")
	}

	// Create product
	product, err := s.db.CreateProduct(ctx, &sqlc.CreateProductParams{
		Sku:           req.SKU,
		Name:          req.Name,
		Description:   req.Description,
		CategoryID:    utils.OptionalUUIDToPgxUUID(req.CategoryID),
		SupplierID:    utils.OptionalUUIDToPgxUUID(req.SupplierID),
		UnitPrice:     utils.Float64ToPgxNumeric(req.UnitPrice),
		MinStockLevel: utils.OptionalIntToInt32Ptr(req.MinStockLevel),
	})
	if err != nil {
		return nil, err
	}

	return &models.Product{
		ID:            utils.PgxUUIDToUUID(product.ID),
		SKU:           product.Sku,
		Name:          product.Name,
		Description:   product.Description,
		CategoryID:    utils.OptionalPgxUUIDToUUID(product.CategoryID),
		SupplierID:    utils.OptionalPgxUUIDToUUID(product.SupplierID),
		UnitPrice:     utils.PgxNumericToFloat64(product.UnitPrice),
		MinStockLevel: utils.OptionalInt32PtrToInt(product.MinStockLevel),
		IsActive:      *product.IsActive,
		CreatedAt:     utils.PgxTimestamptzToTime(product.CreatedAt),
		UpdatedAt:     utils.PgxTimestamptzToTime(product.UpdatedAt),
	}, nil
}

func (s *ProductService) GetProduct(ctx context.Context, id uuid.UUID) (*models.Product, error) {
	product, err := s.db.GetProduct(ctx, utils.UUIDToPgxUUID(id))
	if err != nil {
		return nil, err
	}

	return &models.Product{
		ID:          utils.PgxUUIDToUUID(product.ID),
		SKU:         product.Sku,
		Name:        product.Name,
		Description: product.Description,
		CategoryID:  utils.OptionalPgxUUIDToUUID(product.CategoryID),
		SupplierID:  utils.OptionalPgxUUIDToUUID(product.SupplierID),
		UnitPrice:     utils.PgxNumericToFloat64(product.UnitPrice),
		MinStockLevel: utils.OptionalInt32PtrToInt(product.MinStockLevel),
		IsActive:      *product.IsActive,
		CreatedAt:   utils.PgxTimestamptzToTime(product.CreatedAt),
		UpdatedAt:   utils.PgxTimestamptzToTime(product.UpdatedAt),
	}, nil
}

func (s *ProductService) ListProducts(ctx context.Context) ([]models.Product, error) {
	products, err := s.db.ListProducts(ctx, &sqlc.ListProductsParams{
		Limit:  100, // Default limit
		Offset: 0,
	})
	if err != nil {
		return nil, err
	}

	result := make([]models.Product, len(products))
	for i, product := range products {
		result[i] = models.Product{
			ID:          utils.PgxUUIDToUUID(product.ID),
			SKU:         product.Sku,
			Name:        product.Name,
			Description: product.Description,
			CategoryID:  utils.OptionalPgxUUIDToUUID(product.CategoryID),
			SupplierID:  utils.OptionalPgxUUIDToUUID(product.SupplierID),
			UnitPrice:   utils.PgxNumericToFloat64(product.UnitPrice),
			IsActive:    *product.IsActive,
			CreatedAt:   utils.PgxTimestamptzToTime(product.CreatedAt),
			UpdatedAt:   utils.PgxTimestamptzToTime(product.UpdatedAt),
			Category:    product.CategoryName,
			Supplier:    product.SupplierName,
		}
	}

	return result, nil
}

func (s *ProductService) ListProductsWithFilter(ctx context.Context, filter models.ProductFilter) ([]models.Product, int64, error) {
	offset := (filter.Page - 1) * filter.Limit

	// Convert filter parameters
	var name string
	var categoryID, supplierID *uuid.UUID
	if filter.Name != nil {
		name = *filter.Name
	}
	if filter.CategoryID != nil {
		categoryID = filter.CategoryID
	}
	if filter.SupplierID != nil {
		supplierID = filter.SupplierID
	}

	products, err := s.db.ListProductsWithFilter(ctx, &sqlc.ListProductsWithFilterParams{
		Column1: name,
		Column2: utils.OptionalUUIDToPgxUUID(categoryID),
		Column3: utils.OptionalUUIDToPgxUUID(supplierID),
		Limit:   int32(filter.Limit),
		Offset:  int32(offset),
		Column6: filter.SortBy,
		Column7: filter.SortOrder,
	})
	if err != nil {
		return nil, 0, err
	}

	total, err := s.db.CountProductsWithFilter(ctx, &sqlc.CountProductsWithFilterParams{
		Column1: name,
		Column2: utils.OptionalUUIDToPgxUUID(categoryID),
		Column3: utils.OptionalUUIDToPgxUUID(supplierID),
	})
	if err != nil {
		return nil, 0, err
	}

	result := make([]models.Product, len(products))
	for i, product := range products {
		result[i] = models.Product{
			ID:          utils.PgxUUIDToUUID(product.ID),
			SKU:         product.Sku,
			Name:        product.Name,
			Description: product.Description,
			CategoryID:  utils.OptionalPgxUUIDToUUID(product.CategoryID),
			SupplierID:  utils.OptionalPgxUUIDToUUID(product.SupplierID),
			UnitPrice:   utils.PgxNumericToFloat64(product.UnitPrice),
			IsActive:    *product.IsActive,
			CreatedAt:   utils.PgxTimestamptzToTime(product.CreatedAt),
			UpdatedAt:   utils.PgxTimestamptzToTime(product.UpdatedAt),
			Category:    product.CategoryName,
			Supplier:    product.SupplierName,
		}
	}

	return result, total, nil
}

func (s *ProductService) ListProductsWithStock(ctx context.Context, filter models.ProductFilter) ([]models.ProductWithStock, int64, error) {
	offset := (filter.Page - 1) * filter.Limit

	// Convert filter parameters
	var name string
	var categoryID, supplierID *uuid.UUID
	if filter.Name != nil {
		name = *filter.Name
	}
	if filter.CategoryID != nil {
		categoryID = filter.CategoryID
	}
	if filter.SupplierID != nil {
		supplierID = filter.SupplierID
	}

	products, err := s.db.ListProductsWithStock(ctx, &sqlc.ListProductsWithStockParams{
		Column1: name,
		Column2: utils.OptionalUUIDToPgxUUID(categoryID),
		Column3: utils.OptionalUUIDToPgxUUID(supplierID),
		Limit:   int32(filter.Limit),
		Offset:  int32(offset),
		Column6: filter.SortBy,
		Column7: filter.SortOrder,
	})
	if err != nil {
		return nil, 0, err
	}

	total, err := s.db.CountProductsWithFilter(ctx, &sqlc.CountProductsWithFilterParams{
		Column1: name,
		Column2: utils.OptionalUUIDToPgxUUID(categoryID),
		Column3: utils.OptionalUUIDToPgxUUID(supplierID),
	})
	if err != nil {
		return nil, 0, err
	}

	result := make([]models.ProductWithStock, len(products))
	for i, product := range products {
		result[i] = models.ProductWithStock{
			Product: models.Product{
				ID:          utils.PgxUUIDToUUID(product.ID),
				SKU:         product.Sku,
				Name:        product.Name,
				Description: product.Description,
				CategoryID:  utils.OptionalPgxUUIDToUUID(product.CategoryID),
				SupplierID:  utils.OptionalPgxUUIDToUUID(product.SupplierID),
				UnitPrice:   utils.PgxNumericToFloat64(product.UnitPrice),
				IsActive:    *product.IsActive,
				CreatedAt:   utils.PgxTimestamptzToTime(product.CreatedAt),
				UpdatedAt:   utils.PgxTimestamptzToTime(product.UpdatedAt),
				Category:    product.CategoryName,
				Supplier:    product.SupplierName,
			},
			TotalStock:     product.TotalStock.(int64),
			TotalReserved:  product.TotalReserved.(int64),
			TotalAvailable: product.TotalAvailable.(int64),
		}
	}

	return result, total, nil
}

func (s *ProductService) UpdateProduct(ctx context.Context, id uuid.UUID, req models.UpdateProductRequest) (*models.Product, error) {
	product, err := s.db.UpdateProduct(ctx, &sqlc.UpdateProductParams{
		ID:            utils.UUIDToPgxUUID(id),
		Sku:           req.SKU,
		Name:          req.Name,
		Description:   req.Description,
		CategoryID:    utils.OptionalUUIDToPgxUUID(req.CategoryID),
		SupplierID:    utils.OptionalUUIDToPgxUUID(req.SupplierID),
		UnitPrice:     utils.Float64ToPgxNumeric(req.UnitPrice),
		MinStockLevel: utils.OptionalIntToInt32Ptr(req.MinStockLevel),
	})
	if err != nil {
		return nil, err
	}

	return &models.Product{
		ID:          utils.PgxUUIDToUUID(product.ID),
		SKU:         product.Sku,
		Name:        product.Name,
		Description: product.Description,
		CategoryID:  utils.OptionalPgxUUIDToUUID(product.CategoryID),
		SupplierID:  utils.OptionalPgxUUIDToUUID(product.SupplierID),
		UnitPrice:     utils.PgxNumericToFloat64(product.UnitPrice),
		MinStockLevel: utils.OptionalInt32PtrToInt(product.MinStockLevel),
		IsActive:      *product.IsActive,
		CreatedAt:   utils.PgxTimestamptzToTime(product.CreatedAt),
		UpdatedAt:   utils.PgxTimestamptzToTime(product.UpdatedAt),
	}, nil
}

func (s *ProductService) DeleteProduct(ctx context.Context, id uuid.UUID) error {
	return s.db.DeleteProduct(ctx, utils.UUIDToPgxUUID(id))
}