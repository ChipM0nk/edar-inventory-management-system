package handlers

import (
	"net/http"
	"inventory-system/internal/models"
	"inventory-system/internal/services"
	"inventory-system/internal/utils"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)


type ProductHandler struct {
	productService *services.ProductService
}

func NewProductHandler(productService *services.ProductService) *ProductHandler {
	return &ProductHandler{
		productService: productService,
	}
}

// CreateProduct creates a new product
// @Summary Create a new product
// @Description Create a new product with the provided details
// @Tags Products
// @Accept json
// @Produce json
// @Param request body models.CreateProductRequest true "Product details"
// @Success 201 {object} models.Product
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /products [post]
func (h *ProductHandler) CreateProduct(c *gin.Context) {
	var req models.CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Debug logging
	utils.DebugLog("CreateProduct", "Request received", map[string]interface{}{
		"sku":            req.SKU,
		"name":           req.Name,
		"min_stock_level": req.MinStockLevel,
	})

	product, err := h.productService.CreateProduct(c.Request.Context(), req)
	if err != nil {
		utils.DebugLog("CreateProduct", "Service error", map[string]interface{}{
			"error": err.Error(),
		})
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	utils.DebugLog("CreateProduct", "Product created successfully", map[string]interface{}{
		"product_id":      product.ID,
		"min_stock_level": product.MinStockLevel,
	})

	c.JSON(http.StatusCreated, product)
}

// GetProduct gets a product by ID
// @Summary Get product by ID
// @Description Get a specific product by its ID
// @Tags Products
// @Accept json
// @Produce json
// @Param id path string true "Product ID"
// @Success 200 {object} models.Product
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Security BearerAuth
// @Router /products/{id} [get]
func (h *ProductHandler) GetProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	product, err := h.productService.GetProduct(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	c.JSON(http.StatusOK, product)
}

// ListProducts gets a paginated list of products
// @Summary List products
// @Description Get a paginated list of products with optional filters
// @Tags Products
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param name query string false "Filter by product name"
// @Param category_id query string false "Filter by category ID"
// @Param supplier_id query string false "Filter by supplier ID"
// @Param sort_by query string false "Sort by field" default(name)
// @Param sort_order query string false "Sort order" default(asc)
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /products [get]
func (h *ProductHandler) ListProducts(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	name := c.Query("name")
	categoryIDStr := c.Query("category_id")
	supplierIDStr := c.Query("supplier_id")
	sortBy := c.DefaultQuery("sort_by", "name")
	sortOrder := c.DefaultQuery("sort_order", "asc")

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	// Validate sort parameters
	if sortBy != "name" && sortBy != "unit_price" && sortBy != "created_at" {
		sortBy = "name"
	}
	if sortOrder != "asc" && sortOrder != "desc" {
		sortOrder = "asc"
	}

	// Parse UUIDs
	var categoryID, supplierID *uuid.UUID
	if categoryIDStr != "" {
		if id, err := uuid.Parse(categoryIDStr); err == nil {
			categoryID = &id
		}
	}
	if supplierIDStr != "" {
		if id, err := uuid.Parse(supplierIDStr); err == nil {
			supplierID = &id
		}
	}

	filter := models.ProductFilter{
		Page:       page,
		Limit:      limit,
		Name:       &name,
		CategoryID: categoryID,
		SupplierID: supplierID,
		SortBy:     sortBy,
		SortOrder:  sortOrder,
	}

	// Remove nil pointers if empty
	if name == "" {
		filter.Name = nil
	}

	products, total, err := h.productService.ListProductsWithFilter(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	pages := (total + int64(limit) - 1) / int64(limit)

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"total":    total,
		"page":     page,
		"limit":    limit,
		"pages":    pages,
	})
}

// ListProductsWithStock gets a paginated list of products with stock information
// @Summary List products with stock
// @Description Get a paginated list of products with current stock levels
// @Tags Products
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param name query string false "Filter by product name"
// @Param category_id query string false "Filter by category ID"
// @Param supplier_id query string false "Filter by supplier ID"
// @Param sort_by query string false "Sort by field" default(name)
// @Param sort_order query string false "Sort order" default(asc)
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /products/stock [get]
func (h *ProductHandler) ListProductsWithStock(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	name := c.Query("name")
	categoryIDStr := c.Query("category_id")
	supplierIDStr := c.Query("supplier_id")
	sortBy := c.DefaultQuery("sort_by", "name")
	sortOrder := c.DefaultQuery("sort_order", "asc")

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	filter := models.ProductFilter{
		Page:     page,
		Limit:    limit,
		Name:     &name,
		SortBy:   sortBy,
		SortOrder: sortOrder,
	}

	// Parse UUIDs if provided
	if categoryIDStr != "" {
		if categoryID, err := uuid.Parse(categoryIDStr); err == nil {
			filter.CategoryID = &categoryID
		}
	}
	if supplierIDStr != "" {
		if supplierID, err := uuid.Parse(supplierIDStr); err == nil {
			filter.SupplierID = &supplierID
		}
	}

	// Remove nil pointers if empty
	if name == "" {
		filter.Name = nil
	}

	products, total, err := h.productService.ListProductsWithStock(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	pages := (total + int64(limit) - 1) / int64(limit)

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"total":    total,
		"page":     page,
		"limit":    limit,
		"pages":    pages,
	})
}

// UpdateProduct updates an existing product
// @Summary Update product
// @Description Update an existing product by ID
// @Tags Products
// @Accept json
// @Produce json
// @Param id path string true "Product ID"
// @Param request body models.UpdateProductRequest true "Updated product details"
// @Success 200 {object} models.Product
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Security BearerAuth
// @Router /products/{id} [put]
func (h *ProductHandler) UpdateProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var req models.UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Debug logging
	utils.DebugLog("UpdateProduct", "Request received", map[string]interface{}{
		"product_id":      id,
		"sku":            req.SKU,
		"name":           req.Name,
		"min_stock_level": req.MinStockLevel,
	})

	product, err := h.productService.UpdateProduct(c.Request.Context(), id, req)
	if err != nil {
		utils.DebugLog("UpdateProduct", "Service error", map[string]interface{}{
			"product_id": id,
			"error":      err.Error(),
		})
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	utils.DebugLog("UpdateProduct", "Product updated successfully", map[string]interface{}{
		"product_id":      product.ID,
		"min_stock_level": product.MinStockLevel,
	})

	c.JSON(http.StatusOK, product)
}

// DeleteProduct deletes a product by ID
// @Summary Delete product
// @Description Delete a product by ID
// @Tags Products
// @Accept json
// @Produce json
// @Param id path string true "Product ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /products/{id} [delete]
func (h *ProductHandler) DeleteProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	err = h.productService.DeleteProduct(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully"})
}
