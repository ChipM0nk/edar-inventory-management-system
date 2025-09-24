package services

import (
	"context"
	"errors"
	"inventory-system/internal/database"
	sqlc "inventory-system/internal/database/sqlc"
	"inventory-system/internal/models"
	"inventory-system/internal/utils"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type StockService struct {
	db *database.DB
}

func NewStockService(db *database.DB) *StockService {
	return &StockService{db: db}
}

// Helper function to convert optional UUID pointer to pgtype.UUID
func optionalUUIDToPgxUUID(id *uuid.UUID) pgtype.UUID {
	if id == nil {
		return pgtype.UUID{Valid: false}
	}
	return utils.UUIDToPgxUUID(*id)
}

// Helper function to convert optional string pointer to string
func optionalStringToString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// Helper function to convert optional time pointer to pgtype.Timestamp
func optionalTimeToPgxTimestamp(t *time.Time) pgtype.Timestamp {
	if t == nil {
		return pgtype.Timestamp{Valid: false}
	}
	return pgtype.Timestamp{Time: *t, Valid: true}
}


func (s *StockService) CreateStockMovement(ctx context.Context, req models.CreateStockMovementRequest, userID *uuid.UUID) (*models.StockMovement, error) {
	tx, err := s.db.BeginTx(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// Calculate total amount if cost price is provided
	var totalAmount *float64
	if req.CostPrice != nil {
		amount := float64(req.Quantity) * *req.CostPrice
		totalAmount = &amount
	}

	// Create stock movement
	stockMovement, err := s.db.CreateStockMovement(ctx, &sqlc.CreateStockMovementParams{
		ProductID:     utils.UUIDToPgxUUID(req.ProductID),
		WarehouseID:   utils.UUIDToPgxUUID(req.WarehouseID),
		MovementType:  req.MovementType,
		Quantity:      int32(req.Quantity),
		CostPrice:     utils.OptionalFloat64ToPgxNumeric(req.CostPrice),
		TotalAmount:   utils.OptionalFloat64ToPgxNumeric(totalAmount),
		ReferenceType: req.ReferenceType,
		ReferenceID:   utils.OptionalUUIDToPgxUUID(req.ReferenceID),
		Reason:        req.Reason,
		UserID:        utils.UUIDToPgxUUID(*userID),
		ProcessedBy:   utils.UUIDToPgxUUID(*userID), // Default to current user
		ProcessedDate: utils.TimeToPgxTimestamptz(time.Now()),
	})
	if err != nil {
		return nil, err
	}

	// Update stock level
	var newQuantity int32
	if req.MovementType == "in" || req.MovementType == "adjustment" {
		newQuantity = int32(req.Quantity)
	} else if req.MovementType == "out" {
		newQuantity = -int32(req.Quantity)
	}

	// Get current stock level
	currentStock, err := s.db.GetStockLevel(ctx, &sqlc.GetStockLevelParams{
		ProductID:   utils.UUIDToPgxUUID(req.ProductID),
		WarehouseID: utils.UUIDToPgxUUID(req.WarehouseID),
	})
	if err != nil {
		// If stock level doesn't exist, create it
		if req.MovementType == "in" || req.MovementType == "adjustment" {
			_, err = s.db.CreateStockLevel(ctx, &sqlc.CreateStockLevelParams{
				ProductID:       utils.UUIDToPgxUUID(req.ProductID),
				WarehouseID:     utils.UUIDToPgxUUID(req.WarehouseID),
				Quantity:        int32(req.Quantity),
				ReservedQuantity: 0,
				MinStockLevel:   &[]int32{0}[0],
				MaxStockLevel:   &[]int32{0}[0],
			})
			if err != nil {
				return nil, err
			}
		} else {
			return nil, errors.New("insufficient stock: stock level does not exist")
		}
	} else {
		// Check if we have enough stock for outgoing movements
		if req.MovementType == "out" && currentStock.Quantity < int32(req.Quantity) {
			return nil, errors.New("insufficient stock")
		}

		// Update existing stock level
		_, err = s.db.UpdateStockQuantity(ctx, &sqlc.UpdateStockQuantityParams{
			ProductID:   utils.UUIDToPgxUUID(req.ProductID),
			WarehouseID: utils.UUIDToPgxUUID(req.WarehouseID),
			Quantity:    int32(currentStock.Quantity + newQuantity),
		})
		if err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	referenceID := utils.PgxUUIDToUUID(stockMovement.ReferenceID)
	userIDValue := utils.PgxUUIDToUUID(stockMovement.UserID)
	processedByValue := utils.PgxUUIDToUUID(stockMovement.ProcessedBy)
	processedDateValue := utils.PgxTimestamptzToTime(stockMovement.ProcessedDate)
	return &models.StockMovement{
		ID:            utils.PgxUUIDToUUID(stockMovement.ID),
		ProductID:     utils.PgxUUIDToUUID(stockMovement.ProductID),
		WarehouseID:   utils.PgxUUIDToUUID(stockMovement.WarehouseID),
		MovementType:  stockMovement.MovementType,
		Quantity:      int(stockMovement.Quantity),
		ReferenceType: stockMovement.ReferenceType,
		ReferenceID:   &referenceID,
		Reason:        stockMovement.Reason,
		UserID:        &userIDValue,
		ProcessedBy:   &processedByValue,
		ProcessedDate: &processedDateValue,
		CreatedAt:     utils.PgxTimestamptzToTime(stockMovement.CreatedAt),
	}, nil
}

func (s *StockService) GetStockLevel(ctx context.Context, productID, warehouseID uuid.UUID) (*models.StockLevel, error) {
	stockLevel, err := s.db.GetStockLevel(ctx, &sqlc.GetStockLevelParams{
		ProductID:   utils.UUIDToPgxUUID(productID),
		WarehouseID: utils.UUIDToPgxUUID(warehouseID),
	})
	if err != nil {
		return nil, err
	}

	maxStockLevel := int(*stockLevel.MaxStockLevel)
	return &models.StockLevel{
		ID:                utils.PgxUUIDToUUID(stockLevel.ID),
		ProductID:         utils.PgxUUIDToUUID(stockLevel.ProductID),
		WarehouseID:       utils.PgxUUIDToUUID(stockLevel.WarehouseID),
		Quantity:          int(stockLevel.Quantity),
		ReservedQuantity:  int(stockLevel.ReservedQuantity),
		AvailableQuantity: int(*stockLevel.AvailableQuantity),
		MinStockLevel:     int(*stockLevel.MinStockLevel),
		MaxStockLevel:     &maxStockLevel,
		LastUpdated:       utils.PgxTimestamptzToTime(stockLevel.LastUpdated),
		CreatedAt:         utils.PgxTimestamptzToTime(stockLevel.CreatedAt),
		UpdatedAt:         utils.PgxTimestamptzToTime(stockLevel.UpdatedAt),
		ProductName:       &stockLevel.ProductName,
		ProductSKU:        &stockLevel.Sku,
		WarehouseName:     &stockLevel.WarehouseName,
	}, nil
}

func (s *StockService) ListStockLevels(ctx context.Context, filter models.StockLevelFilter) (*models.StockLevelListResponse, error) {
	offset := (filter.Page - 1) * filter.Limit

	stockLevels, err := s.db.ListStockLevelsWithFilter(ctx, &sqlc.ListStockLevelsWithFilterParams{
		Column1: optionalUUIDToPgxUUID(filter.ProductID),
		Column2: optionalUUIDToPgxUUID(filter.WarehouseID),
		Column3: optionalStringToString(filter.ProductName),
		Column4: optionalStringToString(filter.ProductSKU),
		Limit:   int32(filter.Limit),
		Offset:  int32(offset),
	})
	if err != nil {
		return nil, err
	}

	total, err := s.db.CountStockLevelsWithFilter(ctx, &sqlc.CountStockLevelsWithFilterParams{
		Column1: optionalUUIDToPgxUUID(filter.ProductID),
		Column2: optionalUUIDToPgxUUID(filter.WarehouseID),
		Column3: optionalStringToString(filter.ProductName),
		Column4: optionalStringToString(filter.ProductSKU),
	})
	if err != nil {
		return nil, err
	}

	result := make([]models.StockLevel, len(stockLevels))
	for i, stockLevel := range stockLevels {
		maxStockLevel := int(*stockLevel.MaxStockLevel)
		result[i] = models.StockLevel{
			ID:                utils.PgxUUIDToUUID(stockLevel.ID),
			ProductID:         utils.PgxUUIDToUUID(stockLevel.ProductID),
			WarehouseID:       utils.PgxUUIDToUUID(stockLevel.WarehouseID),
			Quantity:          int(stockLevel.Quantity),
			ReservedQuantity:  int(stockLevel.ReservedQuantity),
			AvailableQuantity: int(*stockLevel.AvailableQuantity),
			MinStockLevel:     int(*stockLevel.MinStockLevel),
			MaxStockLevel:     &maxStockLevel,
			LastUpdated:       utils.PgxTimestamptzToTime(stockLevel.LastUpdated),
			CreatedAt:         utils.PgxTimestamptzToTime(stockLevel.CreatedAt),
			UpdatedAt:         utils.PgxTimestamptzToTime(stockLevel.UpdatedAt),
			ProductName:       &stockLevel.ProductName,
			ProductSKU:        &stockLevel.Sku,
			WarehouseName:     &stockLevel.WarehouseName,
		}
	}

	pages := int((total + int64(filter.Limit) - 1) / int64(filter.Limit))

	return &models.StockLevelListResponse{
		StockLevels: result,
		Total:       total,
		Page:        filter.Page,
		Limit:       filter.Limit,
		Pages:       pages,
	}, nil
}

func (s *StockService) ListStockMovements(ctx context.Context, filter models.StockMovementFilter) (*models.StockMovementListResponse, error) {
	offset := (filter.Page - 1) * filter.Limit

	// Use basic query for now to debug
	stockMovements, err := s.db.ListStockMovements(ctx, &sqlc.ListStockMovementsParams{
		Limit:  int32(filter.Limit),
		Offset: int32(offset),
	})
	if err != nil {
		return nil, err
	}

	total, err := s.db.CountStockMovements(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]models.StockMovement, len(stockMovements))
	for i, movement := range stockMovements {
		referenceID := utils.PgxUUIDToUUID(movement.ReferenceID)
		userID := utils.PgxUUIDToUUID(movement.UserID)
		processedBy := utils.OptionalPgxUUIDToUUID(movement.ProcessedBy)
		processedDate := utils.OptionalPgxTimestamptzToTimePtr(movement.ProcessedDate)
		result[i] = models.StockMovement{
			ID:            utils.PgxUUIDToUUID(movement.ID),
			ProductID:     utils.PgxUUIDToUUID(movement.ProductID),
			WarehouseID:   utils.PgxUUIDToUUID(movement.WarehouseID),
			MovementType:  movement.MovementType,
			Quantity:      int(movement.Quantity),
			CostPrice:     utils.OptionalPgxNumericToFloat64Ptr(movement.CostPrice),
			TotalAmount:   utils.OptionalPgxNumericToFloat64Ptr(movement.TotalAmount),
			ReferenceType: movement.ReferenceType,
			ReferenceID:   &referenceID,
			Reason:        movement.Reason,
			UserID:        &userID,
			ProcessedBy:   processedBy,
			ProcessedDate: processedDate,
			CreatedAt:     utils.PgxTimestamptzToTime(movement.CreatedAt),
			ProductName:   &movement.ProductName,
			ProductSKU:    &movement.Sku,
			WarehouseName: &movement.WarehouseName,
			UserFirstName: movement.FirstName,
			UserLastName:  movement.LastName,
			ProcessedByFirstName: movement.ProcessedByFirstName,
			ProcessedByLastName:  movement.ProcessedByLastName,
		}
	}

	pages := int((total + int64(filter.Limit) - 1) / int64(filter.Limit))

	return &models.StockMovementListResponse{
		StockMovements: result,
		Total:          total,
		Page:           filter.Page,
		Limit:          filter.Limit,
		Pages:          pages,
	}, nil
}

func (s *StockService) GetSOHReport(ctx context.Context) ([]models.SOHReport, error) {
	stockLevels, err := s.db.ListStockLevels(ctx, &sqlc.ListStockLevelsParams{
		Limit:  1000, // Adjust as needed
		Offset: 0,
	})
	if err != nil {
		return nil, err
	}

	result := make([]models.SOHReport, len(stockLevels))
	for i, stockLevel := range stockLevels {
		maxLevel := int(*stockLevel.MaxStockLevel)
		result[i] = models.SOHReport{
			ProductID:     utils.PgxUUIDToUUID(stockLevel.ProductID),
			ProductName:   stockLevel.ProductName,
			ProductSKU:    stockLevel.Sku,
			WarehouseID:   utils.PgxUUIDToUUID(stockLevel.WarehouseID),
			WarehouseName: stockLevel.WarehouseName,
			Quantity:      int(stockLevel.Quantity),
			ReservedQty:   int(stockLevel.ReservedQuantity),
			AvailableQty:  int(*stockLevel.AvailableQuantity),
			MinLevel:      int(*stockLevel.MinStockLevel),
			MaxLevel:      &maxLevel,
			LastUpdated:   utils.PgxTimestamptzToTime(stockLevel.LastUpdated),
		}
	}

	return result, nil
}

// CreateBulkStockMovement creates multiple stock movements for a supplier
func (s *StockService) CreateBulkStockMovement(ctx context.Context, req models.BulkStockMovementRequest, userID *uuid.UUID) ([]models.StockMovement, error) {
	tx, err := s.db.BeginTx(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var stockMovements []models.StockMovement

	for _, item := range req.Items {
		// Calculate total amount if cost price is provided
		var totalAmount *float64
		if item.CostPrice != nil {
			amount := float64(item.Quantity) * *item.CostPrice
			totalAmount = &amount
		}

		// Create stock movement with processed_by set to current user
		supplierRef := "supplier"
		stockMovement, err := s.db.CreateStockMovement(ctx, &sqlc.CreateStockMovementParams{
			ProductID:     utils.UUIDToPgxUUID(item.ProductID),
			WarehouseID:   utils.UUIDToPgxUUID(item.WarehouseID),
			MovementType:  "in", // Bulk movements are always "in"
			Quantity:      int32(item.Quantity),
			CostPrice:     utils.OptionalFloat64ToPgxNumeric(item.CostPrice),
			TotalAmount:   utils.OptionalFloat64ToPgxNumeric(totalAmount),
			ReferenceType: utils.OptionalStringToStringPtr(&supplierRef),
			ReferenceID:   utils.UUIDToPgxUUID(req.SupplierID),
			Reason:        item.Reason,
			UserID:        utils.OptionalUUIDToPgxUUID(userID),
			ProcessedBy:   utils.UUIDToPgxUUID(req.ProcessedBy), // Use the provided processed_by
			ProcessedDate: utils.TimeToPgxTimestamptz(req.ProcessedDate),
		})
		if err != nil {
			return nil, err
		}

		// Update stock level
		var newQuantity int32
		if item.Quantity > 0 {
			newQuantity = int32(item.Quantity)
		}

		// Get current stock level
		currentStock, err := s.db.GetStockLevel(ctx, &sqlc.GetStockLevelParams{
			ProductID:   utils.UUIDToPgxUUID(item.ProductID),
			WarehouseID: utils.UUIDToPgxUUID(item.WarehouseID),
		})
		if err != nil {
			// If stock level doesn't exist, create it
			_, err = s.db.CreateStockLevel(ctx, &sqlc.CreateStockLevelParams{
				ProductID:       utils.UUIDToPgxUUID(item.ProductID),
				WarehouseID:     utils.UUIDToPgxUUID(item.WarehouseID),
				Quantity:        int32(item.Quantity),
				ReservedQuantity: 0,
				MinStockLevel:   &[]int32{0}[0],
				MaxStockLevel:   &[]int32{0}[0],
			})
			if err != nil {
				return nil, err
			}
		} else {
			// Update existing stock level
			_, err = s.db.UpdateStockQuantity(ctx, &sqlc.UpdateStockQuantityParams{
				ProductID:   utils.UUIDToPgxUUID(item.ProductID),
				WarehouseID: utils.UUIDToPgxUUID(item.WarehouseID),
				Quantity:    int32(currentStock.Quantity + newQuantity),
			})
			if err != nil {
				return nil, err
			}
		}

		// Convert to model
		stockMovements = append(stockMovements, models.StockMovement{
			ID:            utils.PgxUUIDToUUID(stockMovement.ID),
			ProductID:     utils.PgxUUIDToUUID(stockMovement.ProductID),
			WarehouseID:   utils.PgxUUIDToUUID(stockMovement.WarehouseID),
			MovementType:  stockMovement.MovementType,
			Quantity:      int(stockMovement.Quantity),
			CostPrice:     utils.OptionalPgxNumericToFloat64Ptr(stockMovement.CostPrice),
			TotalAmount:   utils.OptionalPgxNumericToFloat64Ptr(stockMovement.TotalAmount),
			ReferenceType: stockMovement.ReferenceType,
			ReferenceID:   utils.OptionalPgxUUIDToUUID(stockMovement.ReferenceID),
			Reason:        stockMovement.Reason,
			UserID:        utils.OptionalPgxUUIDToUUID(stockMovement.UserID),
			ProcessedBy:   utils.OptionalPgxUUIDToUUID(stockMovement.ProcessedBy),
			ProcessedDate: utils.OptionalPgxTimestamptzToTimePtr(stockMovement.ProcessedDate),
			CreatedAt:     utils.PgxTimestamptzToTime(stockMovement.CreatedAt),
		})
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return stockMovements, nil
}

// GetProductsBySupplier gets all products for a specific supplier
func (s *StockService) GetProductsBySupplier(ctx context.Context, supplierID uuid.UUID) ([]models.Product, error) {
	products, err := s.db.GetProductsBySupplier(ctx, utils.UUIDToPgxUUID(supplierID))
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
			UnitPrice:   utils.PgxNumericToFloat64(product.UnitPrice),
			CategoryID:  utils.OptionalPgxUUIDToUUID(product.CategoryID),
			SupplierID:  utils.OptionalPgxUUIDToUUID(product.SupplierID),
			IsActive:    *product.IsActive,
			CreatedAt:   utils.PgxTimestamptzToTime(product.CreatedAt),
			UpdatedAt:   utils.PgxTimestamptzToTime(product.UpdatedAt),
		}
	}

	return result, nil
}
