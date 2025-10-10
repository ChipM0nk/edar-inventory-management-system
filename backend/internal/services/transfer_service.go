package services

import (
	"context"
	"errors"
	"time"
	"inventory-system/internal/database"
	sqlc "inventory-system/internal/database/sqlc"
	"inventory-system/internal/models"
	"inventory-system/internal/utils"

	"github.com/google/uuid"
)

type TransferService struct {
	db *database.DB
}

func NewTransferService(db *database.DB) *TransferService {
	return &TransferService{
		db: db,
	}
}

func (s *TransferService) CreateTransfer(ctx context.Context, req models.CreateTransferRequest, userID uuid.UUID) (*models.Transfer, error) {
	tx, err := s.db.BeginTx(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// Parse transfer date
	transferDate, err := time.Parse("2006-01-02", req.TransferDate)
	if err != nil {
		return nil, err
	}

	// Create transfer
	transfer, err := s.db.CreateTransfer(ctx, &sqlc.CreateTransferParams{
		ReferenceNumber: req.ReferenceNumber,
		FromWarehouseID: utils.UUIDToPgxUUID(req.FromWarehouseID),
		ToWarehouseID:   utils.UUIDToPgxUUID(req.ToWarehouseID),
		Reason:          req.Reason,
		TransferDate:    utils.TimeToPgxDate(transferDate),
		CreatedBy:       utils.UUIDToPgxUUID(userID),
	})
	if err != nil {
		return nil, err
	}

	// Create transfer items and stock movements
	var totalQuantity int32 = 0
	for _, item := range req.Items {
		// Create transfer item
		_, err = s.db.CreateTransferItem(ctx, &sqlc.CreateTransferItemParams{
			TransferID: transfer.ID,
			ProductID:  utils.UUIDToPgxUUID(item.ProductID),
			Quantity:   int32(item.Quantity),
		})
		if err != nil {
			return nil, err
		}

		totalQuantity += int32(item.Quantity)

		// Create outgoing stock movement from source warehouse
		_, err = s.db.CreateStockMovement(ctx, &sqlc.CreateStockMovementParams{
			ProductID:       utils.UUIDToPgxUUID(item.ProductID),
			WarehouseID:     utils.UUIDToPgxUUID(req.FromWarehouseID),
			MovementType:    "out",
			Quantity:        int32(item.Quantity),
			ReferenceType:   utils.StringPtr("transfer"),
			ReferenceID:     transfer.ID,
			ReferenceNumber: utils.StringPtr(req.ReferenceNumber),
			UserID:          utils.UUIDToPgxUUID(userID),
			ProcessedBy:     utils.UUIDToPgxUUID(userID),
			ProcessedDate:   utils.TimeToPgxTimestamptz(time.Now()),
		})
		if err != nil {
			return nil, err
		}

		// Update stock level for outgoing movement (decrease quantity)
		fromStock, err := s.db.GetStockLevel(ctx, &sqlc.GetStockLevelParams{
			ProductID:   utils.UUIDToPgxUUID(item.ProductID),
			WarehouseID: utils.UUIDToPgxUUID(req.FromWarehouseID),
		})
		if err != nil {
			return nil, err
		}
		
		// Check if we have enough stock
		if fromStock.Quantity < int32(item.Quantity) {
			return nil, errors.New("insufficient stock in source warehouse")
		}
		
		_, err = s.db.UpdateStockQuantity(ctx, &sqlc.UpdateStockQuantityParams{
			ProductID:   utils.UUIDToPgxUUID(item.ProductID),
			WarehouseID: utils.UUIDToPgxUUID(req.FromWarehouseID),
			Quantity:    fromStock.Quantity - int32(item.Quantity),
		})
		if err != nil {
			return nil, err
		}

		// Create incoming stock movement to destination warehouse
		_, err = s.db.CreateStockMovement(ctx, &sqlc.CreateStockMovementParams{
			ProductID:       utils.UUIDToPgxUUID(item.ProductID),
			WarehouseID:     utils.UUIDToPgxUUID(req.ToWarehouseID),
			MovementType:    "in",
			Quantity:        int32(item.Quantity),
			ReferenceType:   utils.StringPtr("transfer"),
			ReferenceID:     transfer.ID,
			ReferenceNumber: utils.StringPtr(req.ReferenceNumber),
			UserID:          utils.UUIDToPgxUUID(userID),
			ProcessedBy:     utils.UUIDToPgxUUID(userID),
			ProcessedDate:   utils.TimeToPgxTimestamptz(time.Now()),
		})
		if err != nil {
			return nil, err
		}

		// Update stock level for incoming movement (increase quantity)
		toStock, err := s.db.GetStockLevel(ctx, &sqlc.GetStockLevelParams{
			ProductID:   utils.UUIDToPgxUUID(item.ProductID),
			WarehouseID: utils.UUIDToPgxUUID(req.ToWarehouseID),
		})
		if err != nil {
			// If stock level doesn't exist, create it
			_, err = s.db.CreateStockLevel(ctx, &sqlc.CreateStockLevelParams{
				ProductID:        utils.UUIDToPgxUUID(item.ProductID),
				WarehouseID:      utils.UUIDToPgxUUID(req.ToWarehouseID),
				Quantity:         int32(item.Quantity),
				ReservedQuantity: 0,
				MinStockLevel:    &[]int32{0}[0],
				MaxStockLevel:    &[]int32{0}[0],
			})
			if err != nil {
				return nil, err
			}
		} else {
			// Update existing stock level
			_, err = s.db.UpdateStockQuantity(ctx, &sqlc.UpdateStockQuantityParams{
				ProductID:   utils.UUIDToPgxUUID(item.ProductID),
				WarehouseID: utils.UUIDToPgxUUID(req.ToWarehouseID),
				Quantity:    toStock.Quantity + int32(item.Quantity),
			})
			if err != nil {
				return nil, err
			}
		}
	}

	// Update transfer total quantity
	_, err = s.db.UpdateTransferStatus(ctx, &sqlc.UpdateTransferStatusParams{
		ID:     transfer.ID,
		Status: "completed",
	})
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	// Get the complete transfer with items
	return s.GetTransfer(ctx, utils.PgxUUIDToUUID(transfer.ID))
}

func (s *TransferService) GetTransfer(ctx context.Context, transferID uuid.UUID) (*models.Transfer, error) {
	transfer, err := s.db.GetTransfer(ctx, utils.UUIDToPgxUUID(transferID))
	if err != nil {
		return nil, err
	}

	// Get transfer items
	items, err := s.db.GetTransferItems(ctx, utils.UUIDToPgxUUID(transferID))
	if err != nil {
		return nil, err
	}

	transferItems := make([]models.TransferItem, len(items))
	for i, item := range items {
		transferItems[i] = models.TransferItem{
			ID:          utils.PgxUUIDToUUID(item.ID),
			TransferID:  utils.PgxUUIDToUUID(item.TransferID),
			ProductID:   utils.PgxUUIDToUUID(item.ProductID),
			ProductName: item.ProductName,
			ProductSKU:  item.ProductSku,
			Quantity:    int(item.Quantity),
			Reason:      item.Reason,
			CreatedAt:   utils.PgxTimestamptzToTime(item.CreatedAt),
		}
	}

	// Build created by name
	createdByName := ""
	if transfer.CreatedByName != nil {
		if name, ok := transfer.CreatedByName.(string); ok {
			createdByName = name
		}
	}

	return &models.Transfer{
		ID:                  utils.PgxUUIDToUUID(transfer.ID),
		ReferenceNumber:     transfer.ReferenceNumber,
		FromWarehouseID:     utils.PgxUUIDToUUID(transfer.FromWarehouseID),
		FromWarehouseName:   transfer.FromWarehouseName,
		ToWarehouseID:       utils.PgxUUIDToUUID(transfer.ToWarehouseID),
		ToWarehouseName:     transfer.ToWarehouseName,
		Reason:              transfer.Reason,
		TransferDate:        utils.PgxDateToTime(transfer.TransferDate),
		TotalQuantity:       int(transfer.TotalQuantity),
		Status:              transfer.Status,
		CreatedBy:           utils.PgxUUIDToUUID(transfer.CreatedBy),
		CreatedByName:       createdByName,
		ProcessedBy:         utils.OptionalPgxUUIDToUUID(transfer.ProcessedBy),
		ProcessedByName:     "", // Not available in current schema
		ProcessedDate:       utils.OptionalPgxTimestamptzToTimePtr(transfer.ProcessedDate),
		Notes:               transfer.Notes,
		CreatedAt:           utils.PgxTimestamptzToTime(transfer.CreatedAt),
		UpdatedAt:           utils.PgxTimestamptzToTime(transfer.UpdatedAt),
		Items:               transferItems,
	}, nil
}

func (s *TransferService) ListTransfers(ctx context.Context, filter models.TransferFilter) (*models.TransferResponse, error) {
	offset := (filter.Page - 1) * filter.Limit

	// Get transfers
	transfers, err := s.db.GetTransfers(ctx, &sqlc.GetTransfersParams{
		Limit:  int32(filter.Limit),
		Offset: int32(offset),
	})
	if err != nil {
		return nil, err
	}

	// Get total count (we'll need to implement a separate count query)
	total := len(transfers) // Temporary fix - should implement proper count query
	if err != nil {
		return nil, err
	}

	transferModels := make([]models.Transfer, len(transfers))
	for i, transfer := range transfers {
		// Build created by name
		createdByName := ""
		if transfer.CreatedByName != nil {
			if name, ok := transfer.CreatedByName.(string); ok {
				createdByName = name
			}
		}

		// Build processed by name (not available in current schema)

		// Get transfer items
		items, err := s.db.GetTransferItems(ctx, transfer.ID)
		if err != nil {
			// Log error but continue with empty items
			items = []*sqlc.GetTransferItemsRow{}
		}

		transferItems := make([]models.TransferItem, len(items))
		for j, item := range items {
			transferItems[j] = models.TransferItem{
				ID:          utils.PgxUUIDToUUID(item.ID),
				TransferID:  utils.PgxUUIDToUUID(item.TransferID),
				ProductID:   utils.PgxUUIDToUUID(item.ProductID),
				ProductName: item.ProductName,
				ProductSKU:  item.ProductSku,
				Quantity:    int(item.Quantity),
				Reason:      item.Reason,
				CreatedAt:   utils.PgxTimestamptzToTime(item.CreatedAt),
			}
		}

		transferModels[i] = models.Transfer{
			ID:                  utils.PgxUUIDToUUID(transfer.ID),
			ReferenceNumber:     transfer.ReferenceNumber,
			FromWarehouseID:     utils.PgxUUIDToUUID(transfer.FromWarehouseID),
			FromWarehouseName:   transfer.FromWarehouseName,
			ToWarehouseID:       utils.PgxUUIDToUUID(transfer.ToWarehouseID),
			ToWarehouseName:     transfer.ToWarehouseName,
			Reason:              transfer.Reason,
			TransferDate:        utils.PgxDateToTime(transfer.TransferDate),
			TotalQuantity:       int(transfer.TotalQuantity),
			Status:              transfer.Status,
			CreatedBy:           utils.PgxUUIDToUUID(transfer.CreatedBy),
			CreatedByName:       createdByName,
			ProcessedBy:         utils.OptionalPgxUUIDToUUID(transfer.ProcessedBy),
			ProcessedByName:     "", // Not available in current schema
			ProcessedDate:       utils.OptionalPgxTimestamptzToTimePtr(transfer.ProcessedDate),
			Notes:               transfer.Notes,
			CreatedAt:           utils.PgxTimestamptzToTime(transfer.CreatedAt),
			UpdatedAt:           utils.PgxTimestamptzToTime(transfer.UpdatedAt),
			Items:               transferItems,
		}
	}

	return &models.TransferResponse{
		Transfers: transferModels,
		Total:     int64(total),
		Page:      filter.Page,
		Limit:     filter.Limit,
	}, nil
}

func (s *TransferService) GetTransferByReferenceNumber(ctx context.Context, referenceNumber string) (*models.Transfer, error) {
	transfer, err := s.db.GetTransferByReferenceNumber(ctx, referenceNumber)
	if err != nil {
		return nil, err
	}

	// Get transfer items
	items, err := s.db.GetTransferItems(ctx, transfer.ID)
	if err != nil {
		return nil, err
	}

	transferItems := make([]models.TransferItem, len(items))
	for i, item := range items {
		transferItems[i] = models.TransferItem{
			ID:          utils.PgxUUIDToUUID(item.ID),
			TransferID:  utils.PgxUUIDToUUID(item.TransferID),
			ProductID:   utils.PgxUUIDToUUID(item.ProductID),
			ProductName: item.ProductName,
			ProductSKU:  item.ProductSku,
			Quantity:    int(item.Quantity),
			Reason:      item.Reason,
			CreatedAt:   utils.PgxTimestamptzToTime(item.CreatedAt),
		}
	}

	// Build created by name
	createdByName := ""
	if transfer.CreatedByName != nil {
		if name, ok := transfer.CreatedByName.(string); ok {
			createdByName = name
		}
	}

	return &models.Transfer{
		ID:                  utils.PgxUUIDToUUID(transfer.ID),
		ReferenceNumber:     transfer.ReferenceNumber,
		FromWarehouseID:     utils.PgxUUIDToUUID(transfer.FromWarehouseID),
		FromWarehouseName:   transfer.FromWarehouseName,
		ToWarehouseID:       utils.PgxUUIDToUUID(transfer.ToWarehouseID),
		ToWarehouseName:     transfer.ToWarehouseName,
		Reason:              transfer.Reason,
		TransferDate:        utils.PgxDateToTime(transfer.TransferDate),
		TotalQuantity:       int(transfer.TotalQuantity),
		Status:              transfer.Status,
		CreatedBy:           utils.PgxUUIDToUUID(transfer.CreatedBy),
		CreatedByName:       createdByName,
		ProcessedBy:         utils.OptionalPgxUUIDToUUID(transfer.ProcessedBy),
		ProcessedByName:     "", // Not available in current schema
		ProcessedDate:       utils.OptionalPgxTimestamptzToTimePtr(transfer.ProcessedDate),
		Notes:               transfer.Notes,
		CreatedAt:           utils.PgxTimestamptzToTime(transfer.CreatedAt),
		UpdatedAt:           utils.PgxTimestamptzToTime(transfer.UpdatedAt),
		Items:               transferItems,
	}, nil
}

func (s *TransferService) UpdateTransferStatus(ctx context.Context, transferID uuid.UUID, status string) (*models.Transfer, error) {
	// Get the current transfer first
	transfer, err := s.GetTransfer(ctx, transferID)
	if err != nil {
		return nil, err
	}

	// If cancelling, reverse stock movements
	if status == "cancelled" && transfer.Status != "cancelled" {
		err = s.reverseStockMovements(ctx, transfer)
		if err != nil {
			return nil, err
		}
	}

	_, err = s.db.UpdateTransferStatus(ctx, &sqlc.UpdateTransferStatusParams{
		ID:     utils.UUIDToPgxUUID(transferID),
		Status: status,
	})
	if err != nil {
		return nil, err
	}

	return s.GetTransfer(ctx, transferID)
}

// reverseStockMovements reverses the stock movements for a cancelled transfer
func (s *TransferService) reverseStockMovements(ctx context.Context, transfer *models.Transfer) error {
	tx, err := s.db.BeginTx(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	for _, item := range transfer.Items {
		// Reverse: Add quantity back to source warehouse (from warehouse)
		fromStock, err := s.db.GetStockLevel(ctx, &sqlc.GetStockLevelParams{
			ProductID:   utils.UUIDToPgxUUID(item.ProductID),
			WarehouseID: utils.UUIDToPgxUUID(transfer.FromWarehouseID),
		})
		if err != nil {
			// If stock level doesn't exist, create it
			_, err = s.db.CreateStockLevel(ctx, &sqlc.CreateStockLevelParams{
				ProductID:        utils.UUIDToPgxUUID(item.ProductID),
				WarehouseID:      utils.UUIDToPgxUUID(transfer.FromWarehouseID),
				Quantity:         int32(item.Quantity),
				ReservedQuantity: 0,
				MinStockLevel:    &[]int32{0}[0],
				MaxStockLevel:    &[]int32{0}[0],
			})
			if err != nil {
				return err
			}
		} else {
			// Update existing stock level - add quantity back
			_, err = s.db.UpdateStockQuantity(ctx, &sqlc.UpdateStockQuantityParams{
				ProductID:   utils.UUIDToPgxUUID(item.ProductID),
				WarehouseID: utils.UUIDToPgxUUID(transfer.FromWarehouseID),
				Quantity:    fromStock.Quantity + int32(item.Quantity),
			})
			if err != nil {
				return err
			}
		}

		// Reverse: Remove quantity from destination warehouse (to warehouse)
		toStock, err := s.db.GetStockLevel(ctx, &sqlc.GetStockLevelParams{
			ProductID:   utils.UUIDToPgxUUID(item.ProductID),
			WarehouseID: utils.UUIDToPgxUUID(transfer.ToWarehouseID),
		})
		if err != nil {
			// If stock level doesn't exist, that's fine - nothing to reverse
			continue
		}

		// Check if we have enough stock to reverse
		if toStock.Quantity < int32(item.Quantity) {
			// Log warning but continue - this shouldn't happen in normal cases
			continue
		}

		// Update existing stock level - remove quantity
		_, err = s.db.UpdateStockQuantity(ctx, &sqlc.UpdateStockQuantityParams{
			ProductID:   utils.UUIDToPgxUUID(item.ProductID),
			WarehouseID: utils.UUIDToPgxUUID(transfer.ToWarehouseID),
			Quantity:    toStock.Quantity - int32(item.Quantity),
		})
		if err != nil {
			return err
		}

		// Create reversal stock movements for audit trail
		// Outgoing from destination warehouse (reversing the original incoming)
		_, err = s.db.CreateStockMovement(ctx, &sqlc.CreateStockMovementParams{
			ProductID:       utils.UUIDToPgxUUID(item.ProductID),
			WarehouseID:     utils.UUIDToPgxUUID(transfer.ToWarehouseID),
			MovementType:    "out",
			Quantity:        int32(item.Quantity),
			ReferenceType:   utils.StringPtr("transfer_cancellation"),
			ReferenceID:     utils.UUIDToPgxUUID(transfer.ID),
			ReferenceNumber: utils.StringPtr(transfer.ReferenceNumber + "_CANCELLED"),
			UserID:          utils.UUIDToPgxUUID(transfer.CreatedBy),
			ProcessedBy:     utils.UUIDToPgxUUID(transfer.CreatedBy),
			ProcessedDate:   utils.TimeToPgxTimestamptz(time.Now()),
		})
		if err != nil {
			return err
		}

		// Incoming to source warehouse (reversing the original outgoing)
		_, err = s.db.CreateStockMovement(ctx, &sqlc.CreateStockMovementParams{
			ProductID:       utils.UUIDToPgxUUID(item.ProductID),
			WarehouseID:     utils.UUIDToPgxUUID(transfer.FromWarehouseID),
			MovementType:    "in",
			Quantity:        int32(item.Quantity),
			ReferenceType:   utils.StringPtr("transfer_cancellation"),
			ReferenceID:     utils.UUIDToPgxUUID(transfer.ID),
			ReferenceNumber: utils.StringPtr(transfer.ReferenceNumber + "_CANCELLED"),
			UserID:          utils.UUIDToPgxUUID(transfer.CreatedBy),
			ProcessedBy:     utils.UUIDToPgxUUID(transfer.CreatedBy),
			ProcessedDate:   utils.TimeToPgxTimestamptz(time.Now()),
		})
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (s *TransferService) DeleteTransfer(ctx context.Context, transferID uuid.UUID) error {
	err := s.db.DeleteTransfer(ctx, utils.UUIDToPgxUUID(transferID))
	if err != nil {
		return err
	}
	return nil
}
