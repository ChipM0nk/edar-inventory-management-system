package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"inventory-system/internal/database"
	sqlc "inventory-system/internal/database/sqlc"
	"inventory-system/internal/models"
	"inventory-system/internal/utils"
)

type AdjustmentService struct {
	db *database.DB
}

func NewAdjustmentService(db *database.DB) *AdjustmentService {
	return &AdjustmentService{
		db: db,
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
		ReferenceNumber:  req.ReferenceNumber,
		AdjustmentDate:   utils.TimeToPgxDate(req.AdjustmentDate),
		TotalQuantity:    int32(req.TotalQuantity),
		Reason:           req.Reason,
		Status:           "completed", // Auto-complete adjustments
		CreatedBy:        utils.UUIDToPgxUUID(req.CreatedBy),
		ProcessedBy:      utils.UUIDToPgxUUID(req.CreatedBy), // Set processed by to creator
		ProcessedDate:    utils.TimeToPgxTimestamptz(req.AdjustmentDate),
		Notes:            req.Notes,
	}

	adjustment, err := s.db.Queries.WithTx(tx).CreateAdjustment(ctx, &adjustmentParams)
	if err != nil {
		return nil, fmt.Errorf("failed to create adjustment: %w", err)
	}

	// Create adjustment items
	for _, item := range req.Items {
		itemParams := sqlc.CreateAdjustmentItemParams{
			AdjustmentID:     adjustment.ID,
			ProductID:        utils.UUIDToPgxUUID(item.ProductID),
			WarehouseID:      utils.UUIDToPgxUUID(item.WarehouseID),
			Quantity:         int32(item.Quantity),
			Reason:           item.Reason,
		}

		_, err := s.db.Queries.WithTx(tx).CreateAdjustmentItem(ctx, &itemParams)
		if err != nil {
			return nil, fmt.Errorf("failed to create adjustment item: %w", err)
		}
	}

	// Commit the transaction
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
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

// convertToAdjustmentModel converts database model to API model
func (s *AdjustmentService) convertToAdjustmentModel(adj sqlc.GetAdjustmentRow) *models.Adjustment {
	return &models.Adjustment{
		ID:                utils.PgxUUIDToUUID(adj.ID),
		ReferenceNumber:   adj.ReferenceNumber,
		AdjustmentDate:    utils.PgxDateToTime(adj.AdjustmentDate),
		TotalQuantity:     int(adj.TotalQuantity),
		Reason:            adj.Reason,
		Status:            adj.Status,
		CreatedBy:         utils.PgxUUIDToUUID(adj.CreatedBy),
		ProcessedBy:       utils.OptionalPgxUUIDToUUID(adj.ProcessedBy),
		ProcessedDate:     utils.OptionalPgxTimestamptzToTimePtr(adj.ProcessedDate),
		Notes:             adj.Notes,
		CreatedAt:         utils.PgxTimestamptzToTime(adj.CreatedAt),
		UpdatedAt:         utils.PgxTimestamptzToTime(adj.UpdatedAt),
		CreatedByFirstName:  adj.CreatedByFirstName,
		CreatedByLastName:   adj.CreatedByLastName,
		ProcessedByFirstName: adj.ProcessedByFirstName,
		ProcessedByLastName:  adj.ProcessedByLastName,
	}
}

// convertToAdjustmentModelFromAdjustment converts database Adjustment model to API model
func (s *AdjustmentService) convertToAdjustmentModelFromAdjustment(adj *sqlc.Adjustment) *models.Adjustment {
	return &models.Adjustment{
		ID:                utils.PgxUUIDToUUID(adj.ID),
		ReferenceNumber:   adj.ReferenceNumber,
		AdjustmentDate:    utils.PgxDateToTime(adj.AdjustmentDate),
		TotalQuantity:     int(adj.TotalQuantity),
		Reason:            adj.Reason,
		Status:            adj.Status,
		CreatedBy:         utils.PgxUUIDToUUID(adj.CreatedBy),
		ProcessedBy:       utils.OptionalPgxUUIDToUUID(adj.ProcessedBy),
		ProcessedDate:     utils.OptionalPgxTimestamptzToTimePtr(adj.ProcessedDate),
		Notes:             adj.Notes,
		CreatedAt:         utils.PgxTimestamptzToTime(adj.CreatedAt),
		UpdatedAt:         utils.PgxTimestamptzToTime(adj.UpdatedAt),
		CreatedByFirstName:  nil, // Not available in basic Adjustment model
		CreatedByLastName:   nil,
		ProcessedByFirstName: nil,
		ProcessedByLastName:  nil,
	}
}

// convertToAdjustmentModelFromListRow converts database ListAdjustmentsRow model to API model
func (s *AdjustmentService) convertToAdjustmentModelFromListRow(adj sqlc.ListAdjustmentsRow) *models.Adjustment {
	return &models.Adjustment{
		ID:                utils.PgxUUIDToUUID(adj.ID),
		ReferenceNumber:   adj.ReferenceNumber,
		AdjustmentDate:    utils.PgxDateToTime(adj.AdjustmentDate),
		TotalQuantity:     int(adj.TotalQuantity),
		Reason:            adj.Reason,
		Status:            adj.Status,
		CreatedBy:         utils.PgxUUIDToUUID(adj.CreatedBy),
		ProcessedBy:       utils.OptionalPgxUUIDToUUID(adj.ProcessedBy),
		ProcessedDate:     utils.OptionalPgxTimestamptzToTimePtr(adj.ProcessedDate),
		Notes:             adj.Notes,
		CreatedAt:         utils.PgxTimestamptzToTime(adj.CreatedAt),
		UpdatedAt:         utils.PgxTimestamptzToTime(adj.UpdatedAt),
		CreatedByFirstName:  adj.CreatedByFirstName,
		CreatedByLastName:   adj.CreatedByLastName,
		ProcessedByFirstName: adj.ProcessedByFirstName,
		ProcessedByLastName:  adj.ProcessedByLastName,
	}
}
