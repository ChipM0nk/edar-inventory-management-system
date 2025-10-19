package handlers

import (
	"inventory-system/internal/models"
	"inventory-system/internal/services"
	"inventory-system/internal/utils"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type StockHandler struct {
	stockService *services.StockService
}

func NewStockHandler(stockService *services.StockService) *StockHandler {
	return &StockHandler{
		stockService: stockService,
	}
}

// CreateStockMovement creates a new stock movement
// @Summary Create stock movement
// @Description Create a new stock movement with the provided details
// @Tags Stock
// @Accept json
// @Produce json
// @Param request body models.CreateStockMovementRequest true "Stock movement details"
// @Success 201 {object} models.StockMovement
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /stock/movements [post]
func (h *StockHandler) CreateStockMovement(c *gin.Context) {
	var req models.CreateStockMovementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	userIDUUID := userID.(uuid.UUID)
	stockMovement, err := h.stockService.CreateStockMovement(c.Request.Context(), req, &userIDUUID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, stockMovement)
}

// GetStockLevel gets stock level for a specific product and warehouse
// @Summary Get stock level
// @Description Get current stock level for a product in a specific warehouse
// @Tags Stock
// @Accept json
// @Produce json
// @Param product_id path string true "Product ID"
// @Param warehouse_id path string true "Warehouse ID"
// @Success 200 {object} models.StockLevel
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Security BearerAuth
// @Router /stock/levels/{product_id}/{warehouse_id} [get]
func (h *StockHandler) GetStockLevel(c *gin.Context) {
	productIDStr := c.Param("product_id")
	warehouseIDStr := c.Param("warehouse_id")

	productID, err := uuid.Parse(productIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	warehouseID, err := uuid.Parse(warehouseIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID"})
		return
	}

	stockLevel, err := h.stockService.GetStockLevel(c.Request.Context(), productID, warehouseID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Stock level not found"})
		return
	}

	c.JSON(http.StatusOK, stockLevel)
}

// ListStockLevels gets a paginated list of stock levels
// @Summary List stock levels
// @Description Get a paginated list of stock levels with optional filters
// @Tags Stock
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param product_id query string false "Filter by product ID"
// @Param warehouse_id query string false "Filter by warehouse ID"
// @Param product_name query string false "Filter by product name"
// @Param product_sku query string false "Filter by product SKU"
// @Success 200 {object} models.StockLevelListResponse
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /stock/levels [get]
func (h *StockHandler) ListStockLevels(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	productIDStr := c.Query("product_id")
	warehouseIDStr := c.Query("warehouse_id")
	productName := c.Query("product_name")
	productSKU := c.Query("product_sku")

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	filter := models.StockLevelFilter{
		Page:        page,
		Limit:       limit,
		ProductName: &productName,
		ProductSKU:  &productSKU,
	}

	// Parse UUIDs if provided
	if productIDStr != "" {
		if productID, err := uuid.Parse(productIDStr); err == nil {
			filter.ProductID = &productID
		}
	}
	if warehouseIDStr != "" {
		if warehouseID, err := uuid.Parse(warehouseIDStr); err == nil {
			filter.WarehouseID = &warehouseID
		}
	}

	// Remove nil pointers if empty
	if productName == "" {
		filter.ProductName = nil
	}
	if productSKU == "" {
		filter.ProductSKU = nil
	}

	response, err := h.stockService.ListStockLevels(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// ListStockMovements gets a paginated list of stock movements
// @Summary List stock movements
// @Description Get a paginated list of stock movements with optional filters
// @Tags Stock
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param product_id query string false "Filter by product ID"
// @Param warehouse_id query string false "Filter by warehouse ID"
// @Param movement_type query string false "Filter by movement type"
// @Param date_from query string false "Filter from date (YYYY-MM-DD)"
// @Param date_to query string false "Filter to date (YYYY-MM-DD)"
// @Success 200 {object} models.StockMovementListResponse
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /stock/movements [get]
func (h *StockHandler) ListStockMovements(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	productIDStr := c.Query("product_id")
	warehouseIDStr := c.Query("warehouse_id")
	movementType := c.Query("movement_type")
	dateFromStr := c.Query("date_from")
	dateToStr := c.Query("date_to")

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	filter := models.StockMovementFilter{
		Page:         page,
		Limit:        limit,
		MovementType: &movementType,
	}

	// Parse UUIDs if provided
	if productIDStr != "" {
		if productID, err := uuid.Parse(productIDStr); err == nil {
			filter.ProductID = &productID
		}
	}
	if warehouseIDStr != "" {
		if warehouseID, err := uuid.Parse(warehouseIDStr); err == nil {
			filter.WarehouseID = &warehouseID
		}
	}

	// Parse dates if provided
	if dateFromStr != "" {
		if dateFrom, err := time.Parse("2006-01-02", dateFromStr); err == nil {
			filter.DateFrom = &dateFrom
		}
	}
	if dateToStr != "" {
		if dateTo, err := time.Parse("2006-01-02", dateToStr); err == nil {
			filter.DateTo = &dateTo
		}
	}

	// Remove nil pointers if empty
	if movementType == "" {
		filter.MovementType = nil
	}

	response, err := h.stockService.ListStockMovements(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetSOHReport gets stock on hand report
// @Summary Get stock on hand report
// @Description Get a comprehensive stock on hand report
// @Tags Stock
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /stock/reports/soh [get]
func (h *StockHandler) GetSOHReport(c *gin.Context) {
	report, err := h.stockService.GetSOHReport(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": report})
}

// CreateBulkStockMovement creates multiple stock movements
// @Summary Create bulk stock movements
// @Description Create multiple stock movements in a single operation
// @Tags Stock
// @Accept json
// @Produce json
// @Param request body models.BulkStockMovementRequest true "Bulk stock movement details"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /stock/movements/bulk [post]
func (h *StockHandler) CreateBulkStockMovement(c *gin.Context) {
	var req models.BulkStockMovementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.DebugLog("CreateBulkStockMovement", "JSON binding error", map[string]interface{}{
			"error": err.Error(),
		})
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Debug logging for request data
	utils.DebugLog("CreateBulkStockMovement", "Request received", map[string]interface{}{
		"supplier_id":       req.SupplierID,
		"reference_number":  req.ReferenceNumber,
		"processed_by":      req.ProcessedBy,
		"processed_date":    req.ProcessedDate,
		"purchase_order_id": req.PurchaseOrderID,
		"items_count":       len(req.Items),
		"items":             req.Items,
	})

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		utils.DebugLog("CreateBulkStockMovement", "Authentication error", map[string]interface{}{
			"error": "User not authenticated",
		})
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userUUID, ok := userID.(uuid.UUID)
	if !ok {
		utils.DebugLog("CreateBulkStockMovement", "Invalid user ID", map[string]interface{}{
			"user_id": userID,
			"error":   "Invalid user ID format",
		})
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	// Set processed_by to current user if not provided
	if req.ProcessedBy == uuid.Nil {
		req.ProcessedBy = userUUID
		utils.DebugLog("CreateBulkStockMovement", "Set processed_by to current user", map[string]interface{}{
			"processed_by": userUUID,
		})
	}

	// Set processed_date to current time if not provided
	if req.ProcessedDate.IsZero() {
		req.ProcessedDate = time.Now()
		utils.DebugLog("CreateBulkStockMovement", "Set processed_date to current time", map[string]interface{}{
			"processed_date": req.ProcessedDate,
		})
	}

	utils.DebugLog("CreateBulkStockMovement", "Calling service", map[string]interface{}{
		"supplier_id":       req.SupplierID,
		"reference_number":  req.ReferenceNumber,
		"purchase_order_id": req.PurchaseOrderID,
		"items_count":       len(req.Items),
	})

	stockMovements, err := h.stockService.CreateBulkStockMovement(c.Request.Context(), req, &userUUID)
	if err != nil {
		utils.DebugLog("CreateBulkStockMovement", "Service error", map[string]interface{}{
			"error":             err.Error(),
			"supplier_id":       req.SupplierID,
			"reference_number":  req.ReferenceNumber,
			"purchase_order_id": req.PurchaseOrderID,
		})
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	utils.DebugLog("CreateBulkStockMovement", "Success", map[string]interface{}{
		"created_movements": len(stockMovements),
		"supplier_id":       req.SupplierID,
		"reference_number":  req.ReferenceNumber,
	})

	c.JSON(http.StatusCreated, gin.H{"stock_movements": stockMovements})
}

// GetProductsBySupplier gets products by supplier
// @Summary Get products by supplier
// @Description Get all products supplied by a specific supplier
// @Tags Stock
// @Accept json
// @Produce json
// @Param supplier_id path string true "Supplier ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /stock/products/supplier/{supplier_id} [get]
func (h *StockHandler) GetProductsBySupplier(c *gin.Context) {
	supplierIDStr := c.Param("supplier_id")
	supplierID, err := uuid.Parse(supplierIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid supplier ID"})
		return
	}

	products, err := h.stockService.GetProductsBySupplier(c.Request.Context(), supplierID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"products": products})
}
