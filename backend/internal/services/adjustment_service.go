package services

import (
	"context"
	"fmt"
	"time"

	"inventory-system/internal/database"
	sqlc "inventory-system/internal/database/sqlc"
	"inventory-system/internal/models"
	"inventory-system/internal/utils"

	"github.com/google/uuid"
)

type AdjustmentService struct {
	db           *database.DB
	stockService *StockService
}

func NewAdjustmentService(db *database.DB, stockService *StockService) *AdjustmentService {
	return &AdjustmentService{
		db:           db,
		stockService: stockService,
	}
}

// CreateAdjustment creates a new adjustment with items
func (s *AdjustmentService) CreateAdjustment(req models.CreateAdjustmentRequest) (*models.Adjustment, error) {
	ctx := context.Background()

	// Start a transaction
	tx, err := s.db.BeginTx(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Create the adjustment
	adjustmentParams := sqlc.CreateAdjustmentParams{
		ReferenceNumber:   req.ReferenceNumber,
		AdjustmentDate:    utils.TimeToPgxDate(req.AdjustmentDate),
		TotalQuantity:     int32(req.TotalQuantity),
		Reason:            req.Reason,
		Status:            "completed", // Auto-complete adjustments
		CreatedBy:         utils.UUIDToPgxUUID(req.CreatedBy),
		ProcessedBy:       utils.UUIDToPgxUUID(req.CreatedBy), // Set processed by to creator
		ProcessedDate:     utils.TimeToPgxTimestamptz(req.AdjustmentDate),
		Notes:             req.Notes,
		ExternalReference: req.ExternalReference,
	}

	adjustment, err := s.db.Queries.WithTx(tx).CreateAdjustment(ctx, &adjustmentParams)
	if err != nil {
		return nil, fmt.Errorf("failed to create adjustment: %w", err)
	}

	// Create adjustment items
	for _, item := range req.Items {
		itemParams := sqlc.CreateAdjustmentItemParams{
			AdjustmentID: adjustment.ID,
			ProductID:    utils.UUIDToPgxUUID(item.ProductID),
			WarehouseID:  utils.UUIDToPgxUUID(item.WarehouseID),
			Quantity:     int32(item.Quantity),
			Reason:       item.Reason,
			CostPrice:    utils.Float64ToPgxNumeric(item.CostPrice),
		}

		_, err := s.db.Queries.WithTx(tx).CreateAdjustmentItem(ctx, &itemParams)
		if err != nil {
			return nil, fmt.Errorf("failed to create adjustment item: %w", err)
		}
	}

	// Commit the adjustment transaction first
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit adjustment transaction: %w", err)
	}

	// Now create stock movements for each adjustment item
	adjustmentID := utils.PgxUUIDToUUID(adjustment.ID)
	for _, item := range req.Items {
		stockMovementReq := models.CreateStockMovementRequest{
			ProductID:     item.ProductID,
			WarehouseID:   item.WarehouseID,
			MovementType:  "adjustment",
			Quantity:      item.Quantity, // This will be positive for additions, negative for subtractions
			CostPrice:     &item.CostPrice,
			ReferenceType: utils.StringPtr("adjustment"),
			ReferenceID:   &adjustmentID,
		}

		// Create stock movement (this will update stock levels)
		_, err := s.stockService.CreateStockMovement(ctx, stockMovementReq, &req.CreatedBy)
		if err != nil {
			// If stock movement creation fails, we should ideally rollback the adjustment
			// For now, we'll log the error and continue
			// TODO: Implement proper rollback mechanism
			return nil, fmt.Errorf("failed to create stock movement for adjustment item: %w", err)
		}
	}

	// Convert to model
	return s.convertToAdjustmentModelFromAdjustment(adjustment), nil
}

// GetAdjustment retrieves an adjustment by ID with its items
func (s *AdjustmentService) GetAdjustment(id uuid.UUID) (*models.Adjustment, error) {
	ctx := context.Background()
	adjustment, err := s.db.Queries.GetAdjustment(ctx, utils.UUIDToPgxUUID(id))
	if err != nil {
		return nil, err
	}

	// Get adjustment items
	items, err := s.db.Queries.GetAdjustmentItems(ctx, utils.UUIDToPgxUUID(id))
	if err != nil {
		return nil, fmt.Errorf("failed to get adjustment items: %w", err)
	}

	adjustmentModel := s.convertToAdjustmentModel(*adjustment)

	// Convert items to models
	adjustmentItems := make([]models.AdjustmentItem, len(items))
	for i, item := range items {
		adjustmentItems[i] = models.AdjustmentItem{
			ID:            utils.PgxUUIDToUUID(item.ID),
			AdjustmentID:  utils.PgxUUIDToUUID(item.AdjustmentID),
			ProductID:     utils.PgxUUIDToUUID(item.ProductID),
			WarehouseID:   utils.PgxUUIDToUUID(item.WarehouseID),
			Quantity:      int(item.Quantity),
			Reason:        item.Reason,
			CostPrice:     utils.PgxNumericToFloat64(item.CostPrice),
			CreatedAt:     utils.PgxTimestamptzToTime(item.CreatedAt),
			ProductName:   &item.ProductName,
			ProductSKU:    &item.ProductSku,
			WarehouseName: &item.WarehouseName,
		}
	}

	adjustmentModel.Items = adjustmentItems
	return adjustmentModel, nil
}

// ListAdjustments retrieves adjustments with pagination
func (s *AdjustmentService) ListAdjustments(filter models.AdjustmentFilter) ([]models.Adjustment, int64, error) {
	ctx := context.Background()
	offset := (filter.Page - 1) * filter.Limit

	adjustments, err := s.db.Queries.ListAdjustments(ctx, &sqlc.ListAdjustmentsParams{
		Limit:  int32(filter.Limit),
		Offset: int32(offset),
	})
	if err != nil {
		return nil, 0, err
	}

	// Get total count
	total, err := s.db.Queries.CountAdjustments(ctx)
	if err != nil {
		return nil, 0, err
	}

	// Convert to models
	var result []models.Adjustment
	for _, adj := range adjustments {
		result = append(result, *s.convertToAdjustmentModelFromListRow(*adj))
	}

	return result, total, nil
}

// UpdateAdjustment updates an existing adjustment
func (s *AdjustmentService) UpdateAdjustment(id uuid.UUID, req models.UpdateAdjustmentRequest) (*models.Adjustment, error) {
	ctx := context.Background()
	updateParams := sqlc.UpdateAdjustmentParams{
		ID: utils.UUIDToPgxUUID(id),
	}

	if req.ReferenceNumber != nil {
		updateParams.ReferenceNumber = *req.ReferenceNumber
	}
	if req.AdjustmentDate != nil {
		updateParams.AdjustmentDate = utils.TimeToPgxDate(*req.AdjustmentDate)
	}
	if req.TotalQuantity != nil {
		updateParams.TotalQuantity = int32(*req.TotalQuantity)
	}
	if req.Reason != nil {
		updateParams.Reason = req.Reason
	}
	if req.Status != nil {
		updateParams.Status = *req.Status
	}
	if req.ProcessedBy != nil {
		updateParams.ProcessedBy = utils.UUIDToPgxUUID(*req.ProcessedBy)
	}
	if req.Notes != nil {
		updateParams.Notes = req.Notes
	}

	adjustment, err := s.db.Queries.UpdateAdjustment(ctx, &updateParams)
	if err != nil {
		return nil, err
	}

	return s.convertToAdjustmentModelFromAdjustment(adjustment), nil
}

// DeleteAdjustment deletes an adjustment
func (s *AdjustmentService) DeleteAdjustment(id uuid.UUID) error {
	ctx := context.Background()
	return s.db.Queries.DeleteAdjustment(ctx, utils.UUIDToPgxUUID(id))
}

// CancelAdjustment sets an adjustment to cancelled, stores cancellation info, and reverses stock movements
func (s *AdjustmentService) CancelAdjustment(adjustmentID uuid.UUID, cancelledBy uuid.UUID, reason string) (*models.Adjustment, error) {
	ctx := context.Background()

	// Load current adjustment and items
	adjRow, err := s.db.Queries.GetAdjustment(ctx, utils.UUIDToPgxUUID(adjustmentID))
	if err != nil {
		return nil, fmt.Errorf("failed to load adjustment: %w", err)
	}
	if adjRow.Status == "cancelled" {
		return nil, fmt.Errorf("adjustment is already cancelled")
	}

	items, err := s.db.Queries.GetAdjustmentItems(ctx, utils.UUIDToPgxUUID(adjustmentID))
	if err != nil {
		return nil, fmt.Errorf("failed to load adjustment items: %w", err)
	}

	// Build cancellation note appended to existing notes
	notePrefix := "Cancelled"
	if reason != "" {
		notePrefix = notePrefix + ": " + reason
	}
	var updatedNotes *string
	if adjRow.Notes != nil && *adjRow.Notes != "" {
		combined := *adjRow.Notes + " | " + notePrefix
		updatedNotes = &combined
	} else {
		updatedNotes = &notePrefix
	}

	// Update adjustment as cancelled
	updated, err := s.db.Queries.UpdateAdjustment(ctx, &sqlc.UpdateAdjustmentParams{
		ID:              adjRow.ID,
		ReferenceNumber: adjRow.ReferenceNumber,
		AdjustmentDate:  adjRow.AdjustmentDate,
		TotalQuantity:   adjRow.TotalQuantity,
		Reason:          adjRow.Reason,
		Status:          "cancelled",
		ProcessedBy:     utils.UUIDToPgxUUID(cancelledBy),
		ProcessedDate:   utils.TimeToPgxTimestamptz(time.Now()),
		Notes:           updatedNotes,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to cancel adjustment: %w", err)
	}

	// Reverse stock movements for all items
	adjUUID := utils.PgxUUIDToUUID(updated.ID)
	for _, it := range items {
		// Reverse quantity
		reverseQty := -int(it.Quantity)
		stockReq := models.CreateStockMovementRequest{
			ProductID:     utils.PgxUUIDToUUID(it.ProductID),
			WarehouseID:   utils.PgxUUIDToUUID(it.WarehouseID),
			MovementType:  "adjustment",
			Quantity:      reverseQty,
			CostPrice:     nil, // cost not required for reversal effect on quantity
			ReferenceType: utils.StringPtr("adjustment_cancellation"),
			ReferenceID:   &adjUUID,
		}

		if _, err := s.stockService.CreateStockMovement(ctx, stockReq, &cancelledBy); err != nil {
			return nil, fmt.Errorf("failed to create reversal stock movement: %w", err)
		}
	}

	return s.convertToAdjustmentModelFromAdjustment(updated), nil
}

// convertToAdjustmentModel converts database model to API model
func (s *AdjustmentService) convertToAdjustmentModel(adj sqlc.GetAdjustmentRow) *models.Adjustment {
	return &models.Adjustment{
		ID:                   utils.PgxUUIDToUUID(adj.ID),
		ReferenceNumber:      adj.ReferenceNumber,
		AdjustmentDate:       utils.PgxDateToTime(adj.AdjustmentDate),
		TotalQuantity:        int(adj.TotalQuantity),
		Reason:               adj.Reason,
		Status:               adj.Status,
		CreatedBy:            utils.PgxUUIDToUUID(adj.CreatedBy),
		ProcessedBy:          utils.OptionalPgxUUIDToUUID(adj.ProcessedBy),
		ProcessedDate:        utils.OptionalPgxTimestamptzToTimePtr(adj.ProcessedDate),
		Notes:                adj.Notes,
		ExternalReference:    adj.ExternalReference,
		CreatedAt:            utils.PgxTimestamptzToTime(adj.CreatedAt),
		UpdatedAt:            utils.PgxTimestamptzToTime(adj.UpdatedAt),
		CreatedByFirstName:   adj.CreatedByFirstName,
		CreatedByLastName:    adj.CreatedByLastName,
		ProcessedByFirstName: adj.ProcessedByFirstName,
		ProcessedByLastName:  adj.ProcessedByLastName,
	}
}

// convertToAdjustmentModelFromAdjustment converts database Adjustment model to API model
func (s *AdjustmentService) convertToAdjustmentModelFromAdjustment(adj *sqlc.Adjustment) *models.Adjustment {
	return &models.Adjustment{
		ID:                   utils.PgxUUIDToUUID(adj.ID),
		ReferenceNumber:      adj.ReferenceNumber,
		AdjustmentDate:       utils.PgxDateToTime(adj.AdjustmentDate),
		TotalQuantity:        int(adj.TotalQuantity),
		Reason:               adj.Reason,
		Status:               adj.Status,
		CreatedBy:            utils.PgxUUIDToUUID(adj.CreatedBy),
		ProcessedBy:          utils.OptionalPgxUUIDToUUID(adj.ProcessedBy),
		ProcessedDate:        utils.OptionalPgxTimestamptzToTimePtr(adj.ProcessedDate),
		Notes:                adj.Notes,
		ExternalReference:    adj.ExternalReference,
		CreatedAt:            utils.PgxTimestamptzToTime(adj.CreatedAt),
		UpdatedAt:            utils.PgxTimestamptzToTime(adj.UpdatedAt),
		CreatedByFirstName:   nil, // Not available in basic Adjustment model
		CreatedByLastName:    nil,
		ProcessedByFirstName: nil,
		ProcessedByLastName:  nil,
	}
}

// convertToAdjustmentModelFromListRow converts database ListAdjustmentsRow model to API model
func (s *AdjustmentService) convertToAdjustmentModelFromListRow(adj sqlc.ListAdjustmentsRow) *models.Adjustment {
	return &models.Adjustment{
		ID:                   utils.PgxUUIDToUUID(adj.ID),
		ReferenceNumber:      adj.ReferenceNumber,
		AdjustmentDate:       utils.PgxDateToTime(adj.AdjustmentDate),
		TotalQuantity:        int(adj.TotalQuantity),
		Reason:               adj.Reason,
		Status:               adj.Status,
		CreatedBy:            utils.PgxUUIDToUUID(adj.CreatedBy),
		ProcessedBy:          utils.OptionalPgxUUIDToUUID(adj.ProcessedBy),
		ProcessedDate:        utils.OptionalPgxTimestamptzToTimePtr(adj.ProcessedDate),
		Notes:                adj.Notes,
		ExternalReference:    adj.ExternalReference,
		CreatedAt:            utils.PgxTimestamptzToTime(adj.CreatedAt),
		UpdatedAt:            utils.PgxTimestamptzToTime(adj.UpdatedAt),
		CreatedByFirstName:   adj.CreatedByFirstName,
		CreatedByLastName:    adj.CreatedByLastName,
		ProcessedByFirstName: adj.ProcessedByFirstName,
		ProcessedByLastName:  adj.ProcessedByLastName,
	}
}
