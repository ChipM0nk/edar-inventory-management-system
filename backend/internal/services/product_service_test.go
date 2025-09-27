package services

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"edar/internal/models"
)

// MockProductRepository is a mock implementation of ProductRepository
type MockProductRepository struct {
	mock.Mock
}

func (m *MockProductRepository) ListProductsWithFilter(ctx context.Context, params interface{}) ([]interface{}, error) {
	args := m.Called(ctx, params)
	return args.Get(0).([]interface{}), args.Error(1)
}

func (m *MockProductRepository) CountProductsWithFilter(ctx context.Context, params interface{}) (int64, error) {
	args := m.Called(ctx, params)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockProductRepository) CreateProduct(ctx context.Context, params interface{}) (interface{}, error) {
	args := m.Called(ctx, params)
	return args.Get(0), args.Error(1)
}

func (m *MockProductRepository) GetProduct(ctx context.Context, id uuid.UUID) (interface{}, error) {
	args := m.Called(ctx, id)
	return args.Get(0), args.Error(1)
}

func (m *MockProductRepository) UpdateProduct(ctx context.Context, id uuid.UUID, params interface{}) (interface{}, error) {
	args := m.Called(ctx, id, params)
	return args.Get(0), args.Error(1)
}

func (m *MockProductRepository) DeleteProduct(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestProductService_ListProductsWithFilter(t *testing.T) {
	tests := []struct {
		name           string
		filter         models.ProductFilter
		mockProducts   []interface{}
		mockTotal      int64
		mockError      error
		expectedError  bool
		expectedCount  int
	}{
		{
			name: "list products with basic filter",
			filter: models.ProductFilter{
				Page:      1,
				Limit:     10,
				SortBy:    "name",
				SortOrder: "asc",
			},
			mockProducts: []interface{}{
				map[string]interface{}{
					"id":          uuid.New().String(),
					"name":        "Product 1",
					"sku":         "SKU1",
					"unit_price":  "10.00",
					"is_active":   true,
					"category_name": "Electronics",
					"supplier_name": "Supplier A",
				},
				map[string]interface{}{
					"id":          uuid.New().String(),
					"name":        "Product 2",
					"sku":         "SKU2",
					"unit_price":  "20.00",
					"is_active":   true,
					"category_name": "Clothing",
					"supplier_name": "Supplier B",
				},
			},
			mockTotal:     2,
			mockError:     nil,
			expectedError: false,
			expectedCount: 2,
		},
		{
			name: "list products with search term",
			filter: models.ProductFilter{
				Page:      1,
				Limit:     10,
				SortBy:    "name",
				SortOrder: "asc",
				Name:      stringPtr("test"),
			},
			mockProducts: []interface{}{
				map[string]interface{}{
					"id":          uuid.New().String(),
					"name":        "Test Product",
					"sku":         "SKU1",
					"unit_price":  "15.00",
					"is_active":   true,
					"category_name": "Electronics",
					"supplier_name": "Supplier A",
				},
			},
			mockTotal:     1,
			mockError:     nil,
			expectedError: false,
			expectedCount: 1,
		},
		{
			name: "list products with category filter",
			filter: models.ProductFilter{
				Page:       1,
				Limit:      10,
				SortBy:     "name",
				SortOrder:  "asc",
				CategoryID: uuidPtr(uuid.New()),
			},
			mockProducts: []interface{}{
				map[string]interface{}{
					"id":          uuid.New().String(),
					"name":        "Category Product",
					"sku":         "SKU1",
					"unit_price":  "25.00",
					"is_active":   true,
					"category_name": "Electronics",
					"supplier_name": "Supplier A",
				},
			},
			mockTotal:     1,
			mockError:     nil,
			expectedError: false,
			expectedCount: 1,
		},
		{
			name: "list products with supplier filter",
			filter: models.ProductFilter{
				Page:       1,
				Limit:      10,
				SortBy:     "name",
				SortOrder:  "asc",
				SupplierID: uuidPtr(uuid.New()),
			},
			mockProducts: []interface{}{
				map[string]interface{}{
					"id":          uuid.New().String(),
					"name":        "Supplier Product",
					"sku":         "SKU1",
					"unit_price":  "30.00",
					"is_active":   true,
					"category_name": "Electronics",
					"supplier_name": "Supplier B",
				},
			},
			mockTotal:     1,
			mockError:     nil,
			expectedError: false,
			expectedCount: 1,
		},
		{
			name: "list products with sorting by unit price",
			filter: models.ProductFilter{
				Page:      1,
				Limit:     10,
				SortBy:    "unit_price",
				SortOrder: "desc",
			},
			mockProducts: []interface{}{
				map[string]interface{}{
					"id":          uuid.New().String(),
					"name":        "Expensive Product",
					"sku":         "SKU1",
					"unit_price":  "100.00",
					"is_active":   true,
					"category_name": "Electronics",
					"supplier_name": "Supplier A",
				},
				map[string]interface{}{
					"id":          uuid.New().String(),
					"name":        "Cheap Product",
					"sku":         "SKU2",
					"unit_price":  "5.00",
					"is_active":   true,
					"category_name": "Clothing",
					"supplier_name": "Supplier B",
				},
			},
			mockTotal:     2,
			mockError:     nil,
			expectedError: false,
			expectedCount: 2,
		},
		{
			name: "list products with pagination",
			filter: models.ProductFilter{
				Page:      2,
				Limit:     5,
				SortBy:    "name",
				SortOrder: "asc",
			},
			mockProducts: []interface{}{
				map[string]interface{}{
					"id":          uuid.New().String(),
					"name":        "Product 6",
					"sku":         "SKU6",
					"unit_price":  "60.00",
					"is_active":   true,
					"category_name": "Electronics",
					"supplier_name": "Supplier A",
				},
			},
			mockTotal:     10,
			mockError:     nil,
			expectedError: false,
			expectedCount: 1,
		},
		{
			name: "database error",
			filter: models.ProductFilter{
				Page:      1,
				Limit:     10,
				SortBy:    "name",
				SortOrder: "asc",
			},
			mockProducts:  nil,
			mockTotal:     0,
			mockError:     assert.AnError,
			expectedError: true,
			expectedCount: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create mock repository
			mockRepo := new(MockProductRepository)
			
			// Set up mock expectations
			mockRepo.On("ListProductsWithFilter", mock.Anything, mock.AnythingOfType("interface {}")).Return(tt.mockProducts, tt.mockError)
			mockRepo.On("CountProductsWithFilter", mock.Anything, mock.AnythingOfType("interface {}")).Return(tt.mockTotal, tt.mockError)

			// Create service
			service := &ProductService{
				db: mockRepo,
			}

			// Call service method
			products, total, err := service.ListProductsWithFilter(context.Background(), tt.filter)

			// Assert results
			if tt.expectedError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expectedCount, len(products))
				assert.Equal(t, tt.mockTotal, total)
			}

			// Verify mock was called
			mockRepo.AssertExpectations(t)
		})
	}
}

func TestProductService_ListProductsWithFilter_EdgeCases(t *testing.T) {
	tests := []struct {
		name           string
		filter         models.ProductFilter
		expectedError  bool
	}{
		{
			name: "empty filter",
			filter: models.ProductFilter{},
			expectedError: false,
		},
		{
			name: "filter with nil pointers",
			filter: models.ProductFilter{
				Page:      1,
				Limit:     10,
				SortBy:    "name",
				SortOrder: "asc",
				Name:      nil,
				CategoryID: nil,
				SupplierID: nil,
			},
			expectedError: false,
		},
		{
			name: "filter with empty string name",
			filter: models.ProductFilter{
				Page:      1,
				Limit:     10,
				SortBy:    "name",
				SortOrder: "asc",
				Name:      stringPtr(""),
			},
			expectedError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create mock repository
			mockRepo := new(MockProductRepository)
			
			// Set up mock expectations
			mockRepo.On("ListProductsWithFilter", mock.Anything, mock.AnythingOfType("interface {}")).Return([]interface{}{}, int64(0), nil)
			mockRepo.On("CountProductsWithFilter", mock.Anything, mock.AnythingOfType("interface {}")).Return(int64(0), nil)

			// Create service
			service := &ProductService{
				db: mockRepo,
			}

			// Call service method
			products, total, err := service.ListProductsWithFilter(context.Background(), tt.filter)

			// Assert results
			if tt.expectedError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, products)
				assert.Equal(t, int64(0), total)
			}

			// Verify mock was called
			mockRepo.AssertExpectations(t)
		})
	}
}

// Helper functions
func stringPtr(s string) *string {
	return &s
}

func uuidPtr(u uuid.UUID) *uuid.UUID {
	return &u
}






