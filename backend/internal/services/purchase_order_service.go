package services

import (
	"context"
	"fmt"
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

	return &models.PurchaseOrder{
		ID:                   utils.PgxUUIDToUUID(po.ID).String(),
		PoNumber:             po.PoNumber,
		SupplierName:         po.SupplierName,
		SupplierContact:      po.SupplierContact,
		TotalAmount:          utils.PgxNumericToFloat64(po.TotalAmount),
		Status:               po.Status, // Return actual status from database
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
		Status:               po.Status, // Return actual status from database
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
	fmt.Printf("ListPurchaseOrders called with limit=%d, offset=%d\n", limit, offset)
	
	pos, err := s.db.ListPurchaseOrders(ctx, &sqlc.ListPurchaseOrdersParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		fmt.Printf("Error querying purchase orders: %v\n", err)
		return nil, err
	}

	fmt.Printf("Found %d purchase orders in database\n", len(pos))
	for i, po := range pos {
		fmt.Printf("PO %d: ID=%s, Number=%s, Supplier=%s, Status=%s\n", 
			i+1, po.ID.Bytes, po.PoNumber, po.SupplierName, po.Status)
	}

	result := make([]models.PurchaseOrder, len(pos))
	for i, po := range pos {
		result[i] = models.PurchaseOrder{
			ID:                   utils.PgxUUIDToUUID(po.ID).String(),
			PoNumber:             po.PoNumber,
			SupplierName:         po.SupplierName,
			SupplierContact:      po.SupplierContact,
			TotalAmount:          utils.PgxNumericToFloat64(po.TotalAmount),
			Status:               po.Status, // Use actual status from database
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

	fmt.Printf("Returning %d purchase orders\n", len(result))
	return result, nil
}

func (s *PurchaseOrderService) UpdatePurchaseOrder(id string, req models.UpdatePurchaseOrderRequest) (*models.PurchaseOrder, error) {
	ctx := context.Background()
	po, err := s.db.UpdatePurchaseOrder(ctx, &sqlc.UpdatePurchaseOrderParams{
		ID:                   utils.UUIDToPgxUUID(uuid.MustParse(id)),
		SupplierName:         req.SupplierName,
		SupplierContact:      req.SupplierContact,
		Status:               "received", // Always set to received
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
		Status:               "received", // Always return received
		OrderDate:            utils.PgxDateToTime(po.OrderDate),
		ExpectedDeliveryDate: utils.PgxDateToTimePtr(po.ExpectedDeliveryDate),
		ReceivedDate:         utils.PgxDateToTimePtr(po.ReceivedDate),
		Notes:                po.Notes,
		CreatedBy:            utils.PgxUUIDToUUID(po.CreatedBy).String(),
		CreatedAt:            utils.PgxTimestamptzToTime(po.CreatedAt),
		UpdatedAt:            utils.PgxTimestamptzToTime(po.UpdatedAt),
	}, nil
}


func (s *PurchaseOrderService) CancelPurchaseOrder(id string, reason string) (*models.PurchaseOrder, error) {
	ctx := context.Background()
	
	// Parse the purchase order ID
	purchaseOrderID, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	// Get existing stock movements for this purchase order to find warehouse info
	stockMovements, err := s.db.GetPurchaseOrderStockMovements(ctx, utils.UUIDToPgxUUID(purchaseOrderID))
	if err != nil {
		return nil, fmt.Errorf("failed to get stock movements for purchase order %s: %w", purchaseOrderID.String(), err)
	}
	
	// Debug: Log the number of stock movements found
	fmt.Printf("Found %d stock movements for purchase order %s\n", len(stockMovements), purchaseOrderID.String())

	// Create reverse stock movements for received items
	for _, movement := range stockMovements {
		if movement.MovementType == "in" && movement.Quantity > 0 {
			// Create a reverse stock movement (out) to reduce stock
			_, err = s.db.CreateStockMovement(ctx, &sqlc.CreateStockMovementParams{
				ProductID:       movement.ProductID,
				WarehouseID:     movement.WarehouseID,
				MovementType:    "out",
				Quantity:        movement.Quantity,
				CostPrice:       movement.CostPrice,
				TotalAmount:     movement.TotalAmount,
				ReferenceType:   utils.StringPtr("purchase_order_cancellation"),
				ReferenceID:     utils.UUIDToPgxUUID(purchaseOrderID),
				ReferenceNumber: utils.StringPtr("PO-CANCEL-" + purchaseOrderID.String()),
				UserID:          movement.UserID, // Use the same user who created the original movement
				ProcessedBy:     movement.ProcessedBy, // Use the same processor
				ProcessedDate:   utils.TimeToPgxTimestamptz(time.Now()),
			})
			if err != nil {
				return nil, err
			}

			// Update stock level - reduce the quantity
			currentStock, err := s.db.GetStockLevel(ctx, &sqlc.GetStockLevelParams{
				ProductID:   movement.ProductID,
				WarehouseID: movement.WarehouseID,
			})
			if err != nil {
				return nil, err
			}

			// Update stock quantity
			_, err = s.db.UpdateStockQuantity(ctx, &sqlc.UpdateStockQuantityParams{
				ProductID:   movement.ProductID,
				WarehouseID: movement.WarehouseID,
				Quantity:    currentStock.Quantity - movement.Quantity,
			})
			if err != nil {
				return nil, err
			}
		}
	}

	// Cancel the purchase order
	cancelledPO, err := s.db.CancelPurchaseOrder(ctx, utils.UUIDToPgxUUID(purchaseOrderID))
	if err != nil {
		return nil, fmt.Errorf("failed to cancel purchase order %s: %w", purchaseOrderID.String(), err)
	}
	
	// Debug: Log the cancellation result
	fmt.Printf("Successfully cancelled purchase order %s, status: %s\n", purchaseOrderID.String(), cancelledPO.Status)

	return &models.PurchaseOrder{
		ID:                   utils.PgxUUIDToUUID(cancelledPO.ID).String(),
		PoNumber:             cancelledPO.PoNumber,
		SupplierName:         cancelledPO.SupplierName,
		SupplierContact:      cancelledPO.SupplierContact,
		TotalAmount:          utils.PgxNumericToFloat64(cancelledPO.TotalAmount),
		Status:               cancelledPO.Status,
		OrderDate:            utils.PgxDateToTime(cancelledPO.OrderDate),
		ExpectedDeliveryDate: utils.PgxDateToTimePtr(cancelledPO.ExpectedDeliveryDate),
		ReceivedDate:         utils.PgxDateToTimePtr(cancelledPO.ReceivedDate),
		Notes:                cancelledPO.Notes,
		CreatedBy:            utils.PgxUUIDToUUID(cancelledPO.CreatedBy).String(),
		CreatedAt:            utils.PgxTimestamptzToTime(cancelledPO.CreatedAt),
		UpdatedAt:            utils.PgxTimestamptzToTime(cancelledPO.UpdatedAt),
	}, nil
}
