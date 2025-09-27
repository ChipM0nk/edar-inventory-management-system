package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"edar/internal/models"
	"edar/internal/services"
)

// MockProductService is a mock implementation of ProductService
type MockProductService struct {
	mock.Mock
}

func (m *MockProductService) CreateProduct(ctx context.Context, req models.CreateProductRequest) (*models.Product, error) {
	args := m.Called(ctx, req)
	return args.Get(0).(*models.Product), args.Error(1)
}

func (m *MockProductService) GetProduct(ctx context.Context, id uuid.UUID) (*models.Product, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*models.Product), args.Error(1)
}

func (m *MockProductService) UpdateProduct(ctx context.Context, id uuid.UUID, req models.UpdateProductRequest) (*models.Product, error) {
	args := m.Called(ctx, id, req)
	return args.Get(0).(*models.Product), args.Error(1)
}

func (m *MockProductService) DeleteProduct(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockProductService) ListProductsWithFilter(ctx context.Context, filter models.ProductFilter) ([]models.Product, int64, error) {
	args := m.Called(ctx, filter)
	return args.Get(0).([]models.Product), args.Get(1).(int64), args.Error(2)
}

func TestProductHandler_ListProducts(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		queryParams    string
		expectedFilter models.ProductFilter
		mockProducts   []models.Product
		mockTotal      int64
		mockError      error
		expectedStatus int
	}{
		{
			name:        "list products with default parameters",
			queryParams: "",
			expectedFilter: models.ProductFilter{
				Page:      1,
				Limit:     10,
				SortBy:    "name",
				SortOrder: "asc",
			},
			mockProducts: []models.Product{
				{ID: uuid.New(), Name: "Product 1", SKU: "SKU1"},
				{ID: uuid.New(), Name: "Product 2", SKU: "SKU2"},
			},
			mockTotal:      2,
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:        "list products with search term",
			queryParams: "?name=test",
			expectedFilter: models.ProductFilter{
				Page:      1,
				Limit:     10,
				SortBy:    "name",
				SortOrder: "asc",
			},
			mockProducts: []models.Product{
				{ID: uuid.New(), Name: "Test Product", SKU: "SKU1"},
			},
			mockTotal:      1,
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:        "list products with category filter",
			queryParams: "?category_id=123e4567-e89b-12d3-a456-426614174000",
			expectedFilter: models.ProductFilter{
				Page:      1,
				Limit:     10,
				SortBy:    "name",
				SortOrder: "asc",
			},
			mockProducts: []models.Product{
				{ID: uuid.New(), Name: "Category Product", SKU: "SKU1"},
			},
			mockTotal:      1,
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:        "list products with supplier filter",
			queryParams: "?supplier_id=123e4567-e89b-12d3-a456-426614174001",
			expectedFilter: models.ProductFilter{
				Page:      1,
				Limit:     10,
				SortBy:    "name",
				SortOrder: "asc",
			},
			mockProducts: []models.Product{
				{ID: uuid.New(), Name: "Supplier Product", SKU: "SKU1"},
			},
			mockTotal:      1,
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:        "list products with pagination",
			queryParams: "?page=2&limit=5",
			expectedFilter: models.ProductFilter{
				Page:      2,
				Limit:     5,
				SortBy:    "name",
				SortOrder: "asc",
			},
			mockProducts: []models.Product{
				{ID: uuid.New(), Name: "Product 6", SKU: "SKU6"},
			},
			mockTotal:      10,
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:        "list products with sorting",
			queryParams: "?sort_by=unit_price&sort_order=desc",
			expectedFilter: models.ProductFilter{
				Page:      1,
				Limit:     10,
				SortBy:    "unit_price",
				SortOrder: "desc",
			},
			mockProducts: []models.Product{
				{ID: uuid.New(), Name: "Expensive Product", SKU: "SKU1", UnitPrice: 100.0},
			},
			mockTotal:      1,
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:        "list products with show inactive",
			queryParams: "?is_active=false",
			expectedFilter: models.ProductFilter{
				Page:      1,
				Limit:     10,
				SortBy:    "name",
				SortOrder: "asc",
			},
			mockProducts: []models.Product{
				{ID: uuid.New(), Name: "Inactive Product", SKU: "SKU1", IsActive: false},
			},
			mockTotal:      1,
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:        "service error",
			queryParams: "",
			expectedFilter: models.ProductFilter{
				Page:      1,
				Limit:     10,
				SortBy:    "name",
				SortOrder: "asc",
			},
			mockProducts:   nil,
			mockTotal:      0,
			mockError:      assert.AnError,
			expectedStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create mock service
			mockService := new(MockProductService)
			
			// Set up mock expectations
			mockService.On("ListProductsWithFilter", mock.Anything, mock.MatchedBy(func(filter models.ProductFilter) bool {
				return filter.Page == tt.expectedFilter.Page &&
					filter.Limit == tt.expectedFilter.Limit &&
					filter.SortBy == tt.expectedFilter.SortBy &&
					filter.SortOrder == tt.expectedFilter.SortOrder
			})).Return(tt.mockProducts, tt.mockTotal, tt.mockError)

			// Create handler
			handler := &ProductHandler{
				productService: mockService,
			}

			// Create request
			req, _ := http.NewRequest("GET", "/products"+tt.queryParams, nil)
			w := httptest.NewRecorder()

			// Create gin context
			c, _ := gin.CreateTestContext(w)
			c.Request = req

			// Call handler
			handler.ListProducts(c)

			// Assert response
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedStatus == http.StatusOK {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.Contains(t, response, "products")
				assert.Contains(t, response, "total")
				assert.Contains(t, response, "page")
				assert.Contains(t, response, "limit")
				assert.Contains(t, response, "pages")
			}

			// Verify mock was called
			mockService.AssertExpectations(t)
		})
	}
}

func TestProductHandler_ListProducts_InvalidParameters(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name        string
		queryParams string
		expectedStatus int
	}{
		{
			name:        "invalid page number",
			queryParams: "?page=0",
			expectedStatus: http.StatusOK, // Should default to page 1
		},
		{
			name:        "invalid limit",
			queryParams: "?limit=200",
			expectedStatus: http.StatusOK, // Should default to limit 10
		},
		{
			name:        "invalid sort field",
			queryParams: "?sort_by=invalid_field",
			expectedStatus: http.StatusOK, // Should default to name
		},
		{
			name:        "invalid sort order",
			queryParams: "?sort_order=invalid_order",
			expectedStatus: http.StatusOK, // Should default to asc
		},
		{
			name:        "invalid category ID",
			queryParams: "?category_id=invalid-uuid",
			expectedStatus: http.StatusOK, // Should ignore invalid UUID
		},
		{
			name:        "invalid supplier ID",
			queryParams: "?supplier_id=invalid-uuid",
			expectedStatus: http.StatusOK, // Should ignore invalid UUID
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create mock service
			mockService := new(MockProductService)
			
			// Set up mock expectations - should be called with default/validated values
			mockService.On("ListProductsWithFilter", mock.Anything, mock.AnythingOfType("models.ProductFilter")).Return([]models.Product{}, int64(0), nil)

			// Create handler
			handler := &ProductHandler{
				productService: mockService,
			}

			// Create request
			req, _ := http.NewRequest("GET", "/products"+tt.queryParams, nil)
			w := httptest.NewRecorder()

			// Create gin context
			c, _ := gin.CreateTestContext(w)
			c.Request = req

			// Call handler
			handler.ListProducts(c)

			// Assert response
			assert.Equal(t, tt.expectedStatus, w.Code)

			// Verify mock was called
			mockService.AssertExpectations(t)
		})
	}
}

func TestProductHandler_CreateProduct(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		requestBody    models.CreateProductRequest
		mockProduct    *models.Product
		mockError      error
		expectedStatus int
	}{
		{
			name: "create product successfully",
			requestBody: models.CreateProductRequest{
				Name:        "Test Product",
				SKU:         "TEST-001",
				Description: "Test description",
				UnitPrice:   10.50,
				CategoryID:  uuid.New(),
				SupplierID:  uuid.New(),
			},
			mockProduct: &models.Product{
				ID:          uuid.New(),
				Name:        "Test Product",
				SKU:         "TEST-001",
				Description: "Test description",
				UnitPrice:   10.50,
				IsActive:    true,
			},
			mockError:      nil,
			expectedStatus: http.StatusCreated,
		},
		{
			name: "create product with validation error",
			requestBody: models.CreateProductRequest{
				Name: "", // Invalid: empty name
				SKU:  "TEST-001",
			},
			mockProduct:    nil,
			mockError:      assert.AnError,
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create mock service
			mockService := new(MockProductService)
			
			if tt.expectedStatus == http.StatusCreated {
				mockService.On("CreateProduct", mock.Anything, tt.requestBody).Return(tt.mockProduct, tt.mockError)
			}

			// Create handler
			handler := &ProductHandler{
				productService: mockService,
			}

			// Create request body
			requestBody, _ := json.Marshal(tt.requestBody)
			req, _ := http.NewRequest("POST", "/products", bytes.NewBuffer(requestBody))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			// Create gin context
			c, _ := gin.CreateTestContext(w)
			c.Request = req

			// Call handler
			handler.CreateProduct(c)

			// Assert response
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedStatus == http.StatusCreated {
				var response models.Product
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.Equal(t, tt.mockProduct.Name, response.Name)
				assert.Equal(t, tt.mockProduct.SKU, response.SKU)
			}

			// Verify mock was called
			mockService.AssertExpectations(t)
		})
	}
}




