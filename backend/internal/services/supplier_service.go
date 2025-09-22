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

type SupplierService struct {
	db *database.DB
}

func NewSupplierService(db *database.DB) *SupplierService {
	return &SupplierService{db: db}
}

func (s *SupplierService) CreateSupplier(ctx context.Context, req models.CreateSupplierRequest) (*models.Supplier, error) {
	// Check if supplier already exists
	existingSupplier, err := s.db.GetSupplierByName(ctx, req.Name)
	if err == nil && existingSupplier != nil {
		return nil, errors.New("supplier with this name already exists")
	}

	// Create supplier
	supplier, err := s.db.CreateSupplier(ctx, &sqlc.CreateSupplierParams{
		Name:         req.Name,
		ContactPerson: &req.ContactPerson,
		Email:        &req.Email,
		Phone:        &req.Phone,
		Address:      &req.Address,
		City:         &req.City,
		State:        &req.State,
		Country:      &req.Country,
		PostalCode:   &req.PostalCode,
		IsActive:     &[]bool{true}[0],
	})
	if err != nil {
		return nil, err
	}

	// Handle pointer fields
	contactPerson := ""
	if supplier.ContactPerson != nil {
		contactPerson = *supplier.ContactPerson
	}
	email := ""
	if supplier.Email != nil {
		email = *supplier.Email
	}
	phone := ""
	if supplier.Phone != nil {
		phone = *supplier.Phone
	}
	address := ""
	if supplier.Address != nil {
		address = *supplier.Address
	}
	city := ""
	if supplier.City != nil {
		city = *supplier.City
	}
	state := ""
	if supplier.State != nil {
		state = *supplier.State
	}
	country := ""
	if supplier.Country != nil {
		country = *supplier.Country
	}
	postalCode := ""
	if supplier.PostalCode != nil {
		postalCode = *supplier.PostalCode
	}

	return &models.Supplier{
		ID:           utils.PgxUUIDToUUID(supplier.ID),
		Name:         supplier.Name,
		ContactPerson: contactPerson,
		Email:        email,
		Phone:        phone,
		Address:      address,
		City:         city,
		State:        state,
		Country:      country,
		PostalCode:   postalCode,
		IsActive:     *supplier.IsActive,
		CreatedAt:    utils.PgxTimestamptzToTime(supplier.CreatedAt),
		UpdatedAt:    utils.PgxTimestamptzToTime(supplier.UpdatedAt),
	}, nil
}

func (s *SupplierService) GetSupplier(ctx context.Context, id uuid.UUID) (*models.Supplier, error) {
	supplier, err := s.db.GetSupplier(ctx, utils.UUIDToPgxUUID(id))
	if err != nil {
		return nil, err
	}

	// Handle pointer fields
	contactPerson := ""
	if supplier.ContactPerson != nil {
		contactPerson = *supplier.ContactPerson
	}
	email := ""
	if supplier.Email != nil {
		email = *supplier.Email
	}
	phone := ""
	if supplier.Phone != nil {
		phone = *supplier.Phone
	}
	address := ""
	if supplier.Address != nil {
		address = *supplier.Address
	}
	city := ""
	if supplier.City != nil {
		city = *supplier.City
	}
	state := ""
	if supplier.State != nil {
		state = *supplier.State
	}
	country := ""
	if supplier.Country != nil {
		country = *supplier.Country
	}
	postalCode := ""
	if supplier.PostalCode != nil {
		postalCode = *supplier.PostalCode
	}

	return &models.Supplier{
		ID:           utils.PgxUUIDToUUID(supplier.ID),
		Name:         supplier.Name,
		ContactPerson: contactPerson,
		Email:        email,
		Phone:        phone,
		Address:      address,
		City:         city,
		State:        state,
		Country:      country,
		PostalCode:   postalCode,
		IsActive:     *supplier.IsActive,
		CreatedAt:    utils.PgxTimestamptzToTime(supplier.CreatedAt),
		UpdatedAt:    utils.PgxTimestamptzToTime(supplier.UpdatedAt),
	}, nil
}

func (s *SupplierService) ListSuppliers(ctx context.Context) ([]models.Supplier, error) {
	suppliers, err := s.db.ListSuppliers(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]models.Supplier, len(suppliers))
	for i, supplier := range suppliers {
		// Handle pointer fields
		contactPerson := ""
		if supplier.ContactPerson != nil {
			contactPerson = *supplier.ContactPerson
		}
		email := ""
		if supplier.Email != nil {
			email = *supplier.Email
		}
		phone := ""
		if supplier.Phone != nil {
			phone = *supplier.Phone
		}
		address := ""
		if supplier.Address != nil {
			address = *supplier.Address
		}
		city := ""
		if supplier.City != nil {
			city = *supplier.City
		}
		state := ""
		if supplier.State != nil {
			state = *supplier.State
		}
		country := ""
		if supplier.Country != nil {
			country = *supplier.Country
		}
		postalCode := ""
		if supplier.PostalCode != nil {
			postalCode = *supplier.PostalCode
		}

		result[i] = models.Supplier{
			ID:           utils.PgxUUIDToUUID(supplier.ID),
			Name:         supplier.Name,
			ContactPerson: contactPerson,
			Email:        email,
			Phone:        phone,
			Address:      address,
			City:         city,
			State:        state,
			Country:      country,
			PostalCode:   postalCode,
			IsActive:     *supplier.IsActive,
			CreatedAt:    utils.PgxTimestamptzToTime(supplier.CreatedAt),
			UpdatedAt:    utils.PgxTimestamptzToTime(supplier.UpdatedAt),
		}
	}

	return result, nil
}

func (s *SupplierService) ListSuppliersWithFilter(ctx context.Context, filter models.SupplierFilter) ([]models.Supplier, int64, error) {
	offset := (filter.Page - 1) * filter.Limit

	// Convert filter parameters
	var name, contactPerson, email, city string
	var isActive bool
	if filter.Name != nil {
		name = *filter.Name
	}
	if filter.ContactPerson != nil {
		contactPerson = *filter.ContactPerson
	}
	if filter.Email != nil {
		email = *filter.Email
	}
	if filter.City != nil {
		city = *filter.City
	}
	if filter.IsActive != nil {
		isActive = *filter.IsActive
	} else {
		// If no isActive filter is specified, show active suppliers by default
		isActive = true
	}

	suppliers, err := s.db.ListSuppliersWithFilter(ctx, &sqlc.ListSuppliersWithFilterParams{
		Column1: name,
		Column2: contactPerson,
		Column3: email,
		Column4: city,
		Column5: isActive,
		Limit:   int32(filter.Limit),
		Offset:  int32(offset),
		Column8: filter.SortBy,
		Column9: filter.SortOrder,
	})
	if err != nil {
		return nil, 0, err
	}

	total, err := s.db.CountSuppliersWithFilter(ctx, &sqlc.CountSuppliersWithFilterParams{
		Column1: name,
		Column2: contactPerson,
		Column3: email,
		Column4: city,
		Column5: isActive,
	})
	if err != nil {
		return nil, 0, err
	}

	result := make([]models.Supplier, len(suppliers))
	for i, supplier := range suppliers {
		// Handle pointer fields
		contactPerson := ""
		if supplier.ContactPerson != nil {
			contactPerson = *supplier.ContactPerson
		}
		email := ""
		if supplier.Email != nil {
			email = *supplier.Email
		}
		phone := ""
		if supplier.Phone != nil {
			phone = *supplier.Phone
		}
		address := ""
		if supplier.Address != nil {
			address = *supplier.Address
		}
		city := ""
		if supplier.City != nil {
			city = *supplier.City
		}
		state := ""
		if supplier.State != nil {
			state = *supplier.State
		}
		country := ""
		if supplier.Country != nil {
			country = *supplier.Country
		}
		postalCode := ""
		if supplier.PostalCode != nil {
			postalCode = *supplier.PostalCode
		}

		result[i] = models.Supplier{
			ID:           utils.PgxUUIDToUUID(supplier.ID),
			Name:         supplier.Name,
			ContactPerson: contactPerson,
			Email:        email,
			Phone:        phone,
			Address:      address,
			City:         city,
			State:        state,
			Country:      country,
			PostalCode:   postalCode,
			IsActive:     *supplier.IsActive,
			CreatedAt:    utils.PgxTimestamptzToTime(supplier.CreatedAt),
			UpdatedAt:    utils.PgxTimestamptzToTime(supplier.UpdatedAt),
		}
	}

	return result, total, nil
}

func (s *SupplierService) UpdateSupplier(ctx context.Context, id uuid.UUID, req models.UpdateSupplierRequest) (*models.Supplier, error) {
	supplier, err := s.db.UpdateSupplier(ctx, &sqlc.UpdateSupplierParams{
		ID:           utils.UUIDToPgxUUID(id),
		Name:         req.Name,
		ContactPerson: &req.ContactPerson,
		Email:        &req.Email,
		Phone:        &req.Phone,
		Address:      &req.Address,
		City:         &req.City,
		State:        &req.State,
		Country:      &req.Country,
		PostalCode:   &req.PostalCode,
		IsActive:     &[]bool{true}[0],
	})
	if err != nil {
		return nil, err
	}

	// Handle pointer fields
	contactPerson := ""
	if supplier.ContactPerson != nil {
		contactPerson = *supplier.ContactPerson
	}
	email := ""
	if supplier.Email != nil {
		email = *supplier.Email
	}
	phone := ""
	if supplier.Phone != nil {
		phone = *supplier.Phone
	}
	address := ""
	if supplier.Address != nil {
		address = *supplier.Address
	}
	city := ""
	if supplier.City != nil {
		city = *supplier.City
	}
	state := ""
	if supplier.State != nil {
		state = *supplier.State
	}
	country := ""
	if supplier.Country != nil {
		country = *supplier.Country
	}
	postalCode := ""
	if supplier.PostalCode != nil {
		postalCode = *supplier.PostalCode
	}

	return &models.Supplier{
		ID:           utils.PgxUUIDToUUID(supplier.ID),
		Name:         supplier.Name,
		ContactPerson: contactPerson,
		Email:        email,
		Phone:        phone,
		Address:      address,
		City:         city,
		State:        state,
		Country:      country,
		PostalCode:   postalCode,
		IsActive:     *supplier.IsActive,
		CreatedAt:    utils.PgxTimestamptzToTime(supplier.CreatedAt),
		UpdatedAt:    utils.PgxTimestamptzToTime(supplier.UpdatedAt),
	}, nil
}

func (s *SupplierService) DeleteSupplier(ctx context.Context, id uuid.UUID) error {
	return s.db.DeleteSupplier(ctx, utils.UUIDToPgxUUID(id))
}