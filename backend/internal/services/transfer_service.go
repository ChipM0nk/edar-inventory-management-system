package services

import (
	"context"
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
		TotalQuantity:   0, // Will be updated later
		Status:          "pending",
		ProcessedBy:     utils.UUIDToPgxUUID(userID),
		ProcessedDate:   utils.TimeToPgxTimestamptz(time.Now()),
		Notes:           nil,
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
			Reason:     item.Reason,
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
	}

	// Update transfer total quantity
	_, err = s.db.UpdateTransfer(ctx, &sqlc.UpdateTransferParams{
		ID:              transfer.ID,
		ReferenceNumber: transfer.ReferenceNumber,
		TransferDate:    transfer.TransferDate,
		FromWarehouseID: transfer.FromWarehouseID,
		ToWarehouseID:   transfer.ToWarehouseID,
		TotalQuantity:   totalQuantity,
		Reason:          transfer.Reason,
		Status:          "completed",
		ProcessedBy:     transfer.ProcessedBy,
		ProcessedDate:   transfer.ProcessedDate,
		Notes:           transfer.Notes,
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
	if transfer.CreatedByFirstName != nil && transfer.CreatedByLastName != nil {
		createdByName = *transfer.CreatedByFirstName + " " + *transfer.CreatedByLastName
	}

	// Build processed by name
	processedByName := ""
	if transfer.ProcessedByFirstName != nil && transfer.ProcessedByLastName != nil {
		processedByName = *transfer.ProcessedByFirstName + " " + *transfer.ProcessedByLastName
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
		ProcessedByName:     processedByName,
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
	transfers, err := s.db.ListTransfers(ctx, &sqlc.ListTransfersParams{
		Limit:  int32(filter.Limit),
		Offset: int32(offset),
	})
	if err != nil {
		return nil, err
	}

	// Get total count
	total, err := s.db.CountTransfers(ctx)
	if err != nil {
		return nil, err
	}

	transferModels := make([]models.Transfer, len(transfers))
	for i, transfer := range transfers {
		// Build created by name
		createdByName := ""
		if transfer.CreatedByFirstName != nil && transfer.CreatedByLastName != nil {
			createdByName = *transfer.CreatedByFirstName + " " + *transfer.CreatedByLastName
		}

		// Build processed by name
		processedByName := ""
		if transfer.ProcessedByFirstName != nil && transfer.ProcessedByLastName != nil {
			processedByName = *transfer.ProcessedByFirstName + " " + *transfer.ProcessedByLastName
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
			ProcessedByName:     processedByName,
			ProcessedDate:       utils.OptionalPgxTimestamptzToTimePtr(transfer.ProcessedDate),
			Notes:               transfer.Notes,
			CreatedAt:           utils.PgxTimestamptzToTime(transfer.CreatedAt),
			UpdatedAt:           utils.PgxTimestamptzToTime(transfer.UpdatedAt),
		}
	}

	return &models.TransferResponse{
		Transfers: transferModels,
		Total:     total,
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
	if transfer.CreatedByFirstName != nil && transfer.CreatedByLastName != nil {
		createdByName = *transfer.CreatedByFirstName + " " + *transfer.CreatedByLastName
	}

	// Build processed by name
	processedByName := ""
	if transfer.ProcessedByFirstName != nil && transfer.ProcessedByLastName != nil {
		processedByName = *transfer.ProcessedByFirstName + " " + *transfer.ProcessedByLastName
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
		ProcessedByName:     processedByName,
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

	_, err = s.db.UpdateTransfer(ctx, &sqlc.UpdateTransferParams{
		ID:              utils.UUIDToPgxUUID(transferID),
		ReferenceNumber: transfer.ReferenceNumber,
		TransferDate:    utils.TimeToPgxDate(transfer.TransferDate),
		FromWarehouseID: utils.UUIDToPgxUUID(transfer.FromWarehouseID),
		ToWarehouseID:   utils.UUIDToPgxUUID(transfer.ToWarehouseID),
		TotalQuantity:   int32(transfer.TotalQuantity),
		Reason:          transfer.Reason,
		Status:          status,
		ProcessedBy:     utils.UUIDToPgxUUID(transfer.CreatedBy),
		ProcessedDate:   utils.TimeToPgxTimestamptz(time.Now()),
		Notes:           transfer.Notes,
	})
	if err != nil {
		return nil, err
	}

	return s.GetTransfer(ctx, transferID)
}

func (s *TransferService) DeleteTransfer(ctx context.Context, transferID uuid.UUID) error {
	err := s.db.DeleteTransfer(ctx, utils.UUIDToPgxUUID(transferID))
	if err != nil {
		return err
	}
	return nil
}
