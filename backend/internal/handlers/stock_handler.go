package handlers

import (
	"net/http"
	"inventory-system/internal/models"
	"inventory-system/internal/services"
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

func (h *StockHandler) GetSOHReport(c *gin.Context) {
	report, err := h.stockService.GetSOHReport(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": report})
}

func (h *StockHandler) CreateBulkStockMovement(c *gin.Context) {
	var req models.BulkStockMovementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userUUID, ok := userID.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	// Set processed_by to current user if not provided
	if req.ProcessedBy == uuid.Nil {
		req.ProcessedBy = userUUID
	}

	// Set processed_date to current time if not provided
	if req.ProcessedDate.IsZero() {
		req.ProcessedDate = time.Now()
	}

	stockMovements, err := h.stockService.CreateBulkStockMovement(c.Request.Context(), req, &userUUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"stock_movements": stockMovements})
}

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
