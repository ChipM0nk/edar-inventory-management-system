package services

import (
	"context"
	"inventory-system/internal/database"
	sqlc "inventory-system/internal/database/sqlc"
	"inventory-system/internal/models"
	"inventory-system/internal/utils"
	"time"
	"github.com/google/uuid"
)

type PurchaseOrderService struct {
	db *database.DB
}

func NewPurchaseOrderService(db *database.DB) *PurchaseOrderService {
	return &PurchaseOrderService{
		db: db,
	}
}

func (s *PurchaseOrderService) CreatePurchaseOrder(req models.CreatePurchaseOrderRequest) (*models.PurchaseOrder, error) {
	ctx := context.Background()
	orderDate := utils.TimeToPgxDate(req.OrderDate)
	var expectedDeliveryDate *time.Time
	if req.ExpectedDeliveryDate != nil {
		expectedDeliveryDate = req.ExpectedDeliveryDate
	}

	po, err := s.db.CreatePurchaseOrder(ctx, &sqlc.CreatePurchaseOrderParams{
		PoNumber:             req.PoNumber,
		SupplierName:         req.SupplierName,
		SupplierContact:      req.SupplierContact,
		OrderDate:            orderDate,
		ExpectedDeliveryDate: utils.TimeToPgxDatePtr(expectedDeliveryDate),
		Notes:                req.Notes,
		CreatedBy:            utils.UUIDToPgxUUID(uuid.MustParse(req.CreatedBy)),
	})
	if err != nil {
		return nil, err
	}

	// Always set status to "completed"
	_, err = s.db.UpdatePurchaseOrder(ctx, &sqlc.UpdatePurchaseOrderParams{
		ID:                   po.ID,
		SupplierName:         po.SupplierName,
		SupplierContact:      po.SupplierContact,
		Status:               "completed", // Always set to completed
		ExpectedDeliveryDate: po.ExpectedDeliveryDate,
		ReceivedDate:         po.ReceivedDate,
		Notes:                po.Notes,
	})
	if err != nil {
		return nil, err
	}

	return &models.PurchaseOrder{
		ID:                   utils.PgxUUIDToUUID(po.ID).String(),
		PoNumber:             po.PoNumber,
		SupplierName:         po.SupplierName,
		SupplierContact:      po.SupplierContact,
		TotalAmount:          utils.PgxNumericToFloat64(po.TotalAmount),
		Status:               "completed", // Always return completed
		OrderDate:            utils.PgxDateToTime(po.OrderDate),
		ExpectedDeliveryDate: utils.PgxDateToTimePtr(po.ExpectedDeliveryDate),
		ReceivedDate:         utils.PgxDateToTimePtr(po.ReceivedDate),
		Notes:                po.Notes,
		CreatedBy:            utils.PgxUUIDToUUID(po.CreatedBy).String(),
		CreatedAt:            utils.PgxTimestamptzToTime(po.CreatedAt),
		UpdatedAt:            utils.PgxTimestamptzToTime(po.UpdatedAt),
	}, nil
}

func (s *PurchaseOrderService) GetPurchaseOrder(id string) (*models.PurchaseOrder, error) {
	ctx := context.Background()
	po, err := s.db.GetPurchaseOrder(ctx, utils.UUIDToPgxUUID(uuid.MustParse(id)))
	if err != nil {
		return nil, err
	}

	return &models.PurchaseOrder{
		ID:                   utils.PgxUUIDToUUID(po.ID).String(),
		PoNumber:             po.PoNumber,
		SupplierName:         po.SupplierName,
		SupplierContact:      po.SupplierContact,
		TotalAmount:          utils.PgxNumericToFloat64(po.TotalAmount),
		Status:               "completed", // Always return completed
		OrderDate:            utils.PgxDateToTime(po.OrderDate),
		ExpectedDeliveryDate: utils.PgxDateToTimePtr(po.ExpectedDeliveryDate),
		ReceivedDate:         utils.PgxDateToTimePtr(po.ReceivedDate),
		Notes:                po.Notes,
		CreatedBy:            utils.PgxUUIDToUUID(po.CreatedBy).String(),
		CreatedByFirstName:   &po.FirstName,
		CreatedByLastName:    &po.LastName,
		CreatedAt:            utils.PgxTimestamptzToTime(po.CreatedAt),
		UpdatedAt:            utils.PgxTimestamptzToTime(po.UpdatedAt),
	}, nil
}

func (s *PurchaseOrderService) ListPurchaseOrders(limit, offset int32) ([]models.PurchaseOrder, error) {
	ctx := context.Background()
	pos, err := s.db.ListPurchaseOrders(ctx, &sqlc.ListPurchaseOrdersParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, err
	}

	result := make([]models.PurchaseOrder, len(pos))
	for i, po := range pos {
		result[i] = models.PurchaseOrder{
			ID:                   utils.PgxUUIDToUUID(po.ID).String(),
			PoNumber:             po.PoNumber,
			SupplierName:         po.SupplierName,
			SupplierContact:      po.SupplierContact,
			TotalAmount:          utils.PgxNumericToFloat64(po.TotalAmount),
			Status:               "completed", // Always return completed
			OrderDate:            utils.PgxDateToTime(po.OrderDate),
			ExpectedDeliveryDate: utils.PgxDateToTimePtr(po.ExpectedDeliveryDate),
			ReceivedDate:         utils.PgxDateToTimePtr(po.ReceivedDate),
			Notes:                po.Notes,
			CreatedBy:            utils.PgxUUIDToUUID(po.CreatedBy).String(),
			CreatedByFirstName:   &po.FirstName,
			CreatedByLastName:    &po.LastName,
			CreatedAt:            utils.PgxTimestamptzToTime(po.CreatedAt),
			UpdatedAt:            utils.PgxTimestamptzToTime(po.UpdatedAt),
		}
	}

	return result, nil
}

func (s *PurchaseOrderService) UpdatePurchaseOrder(id string, req models.UpdatePurchaseOrderRequest) (*models.PurchaseOrder, error) {
	ctx := context.Background()
	po, err := s.db.UpdatePurchaseOrder(ctx, &sqlc.UpdatePurchaseOrderParams{
		ID:                   utils.UUIDToPgxUUID(uuid.MustParse(id)),
		SupplierName:         req.SupplierName,
		SupplierContact:      req.SupplierContact,
		Status:               "completed", // Always set to completed
		ExpectedDeliveryDate: utils.TimeToPgxDatePtr(req.ExpectedDeliveryDate),
		ReceivedDate:         utils.TimeToPgxDatePtr(req.ReceivedDate),
		Notes:                req.Notes,
	})
	if err != nil {
		return nil, err
	}

	return &models.PurchaseOrder{
		ID:                   utils.PgxUUIDToUUID(po.ID).String(),
		PoNumber:             po.PoNumber,
		SupplierName:         po.SupplierName,
		SupplierContact:      po.SupplierContact,
		TotalAmount:          utils.PgxNumericToFloat64(po.TotalAmount),
		Status:               "completed", // Always return completed
		OrderDate:            utils.PgxDateToTime(po.OrderDate),
		ExpectedDeliveryDate: utils.PgxDateToTimePtr(po.ExpectedDeliveryDate),
		ReceivedDate:         utils.PgxDateToTimePtr(po.ReceivedDate),
		Notes:                po.Notes,
		CreatedBy:            utils.PgxUUIDToUUID(po.CreatedBy).String(),
		CreatedAt:            utils.PgxTimestamptzToTime(po.CreatedAt),
		UpdatedAt:            utils.PgxTimestamptzToTime(po.UpdatedAt),
	}, nil
}
