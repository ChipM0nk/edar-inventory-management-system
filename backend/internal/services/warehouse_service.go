package services

import (
	"context"
	"inventory-system/internal/database"
	sqlc "inventory-system/internal/database/sqlc"
	"inventory-system/internal/models"
	"inventory-system/internal/utils"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type WarehouseService struct {
	db *database.DB
	q  *sqlc.Queries
}

func NewWarehouseService(db *database.DB) *WarehouseService {
	return &WarehouseService{
		db: db,
		q:  sqlc.New(db.Pool),
	}
}


func (s *WarehouseService) CreateWarehouse(ctx context.Context, req models.CreateWarehouseRequest) (*models.Warehouse, error) {
	isActive := true
	warehouse, err := s.q.CreateWarehouse(ctx, &sqlc.CreateWarehouseParams{
		Name:          req.Name,
		Location:      req.Location,
		Address:       req.Address,
		ContactPerson: req.ContactPerson,
		ContactPhone:  req.ContactPhone,
		IsActive:      &isActive,
	})
	if err != nil {
		return nil, err
	}

	return &models.Warehouse{
		ID:           warehouse.ID.Bytes,
		Name:         warehouse.Name,
		Location:     warehouse.Location,
		Address:      warehouse.Address,
		ContactPerson: warehouse.ContactPerson,
		ContactPhone: warehouse.ContactPhone,
		IsActive:     *warehouse.IsActive,
		CreatedAt:    warehouse.CreatedAt.Time,
		UpdatedAt:    warehouse.UpdatedAt.Time,
	}, nil
}

func (s *WarehouseService) GetWarehouse(ctx context.Context, id uuid.UUID) (*models.Warehouse, error) {
	pgUUID := pgtype.UUID{}
	if err := pgUUID.Scan(id.String()); err != nil {
		return nil, err
	}
	warehouse, err := s.q.GetWarehouse(ctx, pgUUID)
	if err != nil {
		return nil, err
	}

	return &models.Warehouse{
		ID:           warehouse.ID.Bytes,
		Name:         warehouse.Name,
		Location:     warehouse.Location,
		Address:      warehouse.Address,
		ContactPerson: warehouse.ContactPerson,
		ContactPhone: warehouse.ContactPhone,
		IsActive:     *warehouse.IsActive,
		CreatedAt:    warehouse.CreatedAt.Time,
		UpdatedAt:    warehouse.UpdatedAt.Time,
	}, nil
}

func (s *WarehouseService) ListWarehouses(ctx context.Context, filter models.WarehouseFilter) ([]models.Warehouse, int64, error) {
	offset := (filter.Page - 1) * filter.Limit
	
	// Handle nil pointers safely
	var nameFilter string
	if filter.Name != nil {
		nameFilter = *filter.Name
	}
	
	var isActiveFilter bool = true // Default to showing active warehouses
	if filter.IsActive != nil {
		isActiveFilter = *filter.IsActive
	}
	
	warehouses, err := s.q.ListWarehouses(ctx, &sqlc.ListWarehousesParams{
		Column1:  interface{}(nameFilter),
		IsActive: &isActiveFilter,
		Limit:    int32(filter.Limit),
		Offset:   int32(offset),
	})
	if err != nil {
		return nil, 0, err
	}

	total, err := s.q.CountWarehouses(ctx, &sqlc.CountWarehousesParams{
		Column1:  interface{}(nameFilter),
		IsActive: &isActiveFilter,
	})
	if err != nil {
		return nil, 0, err
	}

	result := make([]models.Warehouse, len(warehouses))
	for i, warehouse := range warehouses {
		result[i] = models.Warehouse{
			ID:           warehouse.ID.Bytes,
			Name:         warehouse.Name,
			Location:     warehouse.Location,
			Address:      warehouse.Address,
			ContactPerson: warehouse.ContactPerson,
			ContactPhone: warehouse.ContactPhone,
			IsActive:     *warehouse.IsActive,
			CreatedAt:    warehouse.CreatedAt.Time,
			UpdatedAt:    warehouse.UpdatedAt.Time,
		}
	}

	return result, total, nil
}

func (s *WarehouseService) UpdateWarehouse(ctx context.Context, id uuid.UUID, req models.UpdateWarehouseRequest) (*models.Warehouse, error) {
	utils.DebugLog("UpdateWarehouse", "Function called", map[string]interface{}{
		"id": id.String(),
		"request": req,
	})
	
	pgUUID := pgtype.UUID{}
	if err := pgUUID.Scan(id.String()); err != nil {
		utils.DebugLog("UpdateWarehouse", "UUID conversion failed", map[string]interface{}{
			"id": id.String(),
			"error": err.Error(),
		})
		return nil, err
	}
	
	utils.DebugLog("UpdateWarehouse", "UUID converted successfully", map[string]interface{}{
		"original_id": id.String(),
		"pg_uuid": pgUUID,
	})
	
	updateParams := &sqlc.UpdateWarehouseParams{
		ID:            pgUUID,
		Name:          req.Name,
		Location:      req.Location,
		Address:       req.Address,
		ContactPerson: req.ContactPerson,
		ContactPhone:  req.ContactPhone,
		IsActive:      &req.IsActive,
	}
	
	utils.DebugLog("UpdateWarehouse", "About to call UpdateWarehouse query", map[string]interface{}{
		"params": updateParams,
	})
	
	warehouse, err := s.q.UpdateWarehouse(ctx, updateParams)
	if err != nil {
		utils.DebugLog("UpdateWarehouse", "UpdateWarehouse query failed", map[string]interface{}{
			"error": err.Error(),
			"params": updateParams,
		})
		return nil, err
	}
	
	utils.DebugLog("UpdateWarehouse", "UpdateWarehouse query successful", map[string]interface{}{
		"result": warehouse,
	})

	result := &models.Warehouse{
		ID:           warehouse.ID.Bytes,
		Name:         warehouse.Name,
		Location:     warehouse.Location,
		Address:      warehouse.Address,
		ContactPerson: warehouse.ContactPerson,
		ContactPhone: warehouse.ContactPhone,
		IsActive:     *warehouse.IsActive,
		CreatedAt:    warehouse.CreatedAt.Time,
		UpdatedAt:    warehouse.UpdatedAt.Time,
	}
	
	utils.DebugLog("UpdateWarehouse", "Function completed successfully", map[string]interface{}{
		"result": result,
	})
	
	return result, nil
}

func (s *WarehouseService) DeleteWarehouse(ctx context.Context, id uuid.UUID) error {
	pgUUID := pgtype.UUID{}
	if err := pgUUID.Scan(id.String()); err != nil {
		return err
	}
	return s.q.DeleteWarehouse(ctx, pgUUID)
}