package handlers

import (
	"log"
	"net/http"
	"os"
	"strconv"
	"inventory-system/internal/models"
	"inventory-system/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type WarehouseHandler struct {
	warehouseService *services.WarehouseService
}

func NewWarehouseHandler(warehouseService *services.WarehouseService) *WarehouseHandler {
	return &WarehouseHandler{
		warehouseService: warehouseService,
	}
}

// debugLog writes debug information to a centralized log file
func debugLog(functionName, message string, data interface{}) {
	// Create log directory if it doesn't exist
	if err := os.MkdirAll("log", 0755); err != nil {
		log.Printf("Failed to create log directory: %v", err)
		return
	}
	
	logFile, err := os.OpenFile("log/service.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		log.Printf("Failed to open log file: %v", err)
		return
	}
	defer logFile.Close()
	
	debugLogger := log.New(logFile, "[DEBUG] ", log.LstdFlags)
	debugLogger.Printf("[%s] %s: %+v", functionName, message, data)
}

func (h *WarehouseHandler) ListWarehouses(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	isActiveStr := c.Query("is_active")

	var nameFilter *string
	if search != "" {
		nameFilter = &search
	}

	var isActive *bool
	if isActiveStr != "" {
		active := isActiveStr == "true"
		isActive = &active
	}

	filter := models.WarehouseFilter{
		Name:     nameFilter,
		IsActive: isActive,
		Page:     page,
		Limit:    limit,
	}

	warehouses, total, err := h.warehouseService.ListWarehouses(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"warehouses": warehouses,
		"total":      total,
		"page":       page,
		"limit":      limit,
		"pages":      (total + int64(limit) - 1) / int64(limit),
	})
}

func (h *WarehouseHandler) CreateWarehouse(c *gin.Context) {
	var req models.CreateWarehouseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	warehouse, err := h.warehouseService.CreateWarehouse(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, warehouse)
}

func (h *WarehouseHandler) GetWarehouse(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID"})
		return
	}

	warehouse, err := h.warehouseService.GetWarehouse(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Warehouse not found"})
		return
	}

	c.JSON(http.StatusOK, warehouse)
}

func (h *WarehouseHandler) UpdateWarehouse(c *gin.Context) {
	debugLog("UpdateWarehouseHandler", "Handler called", map[string]interface{}{
		"method": c.Request.Method,
		"url": c.Request.URL.String(),
		"headers": c.Request.Header,
	})
	
	idStr := c.Param("id")
	debugLog("UpdateWarehouseHandler", "Extracted ID from URL", map[string]interface{}{
		"id_string": idStr,
	})
	
	id, err := uuid.Parse(idStr)
	if err != nil {
		debugLog("UpdateWarehouseHandler", "UUID parsing failed", map[string]interface{}{
			"id_string": idStr,
			"error": err.Error(),
		})
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID"})
		return
	}
	
	debugLog("UpdateWarehouseHandler", "UUID parsed successfully", map[string]interface{}{
		"id": id.String(),
	})

	var req models.UpdateWarehouseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		debugLog("UpdateWarehouseHandler", "JSON binding failed", map[string]interface{}{
			"error": err.Error(),
		})
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	debugLog("UpdateWarehouseHandler", "JSON binding successful", map[string]interface{}{
		"request": req,
	})

	warehouse, err := h.warehouseService.UpdateWarehouse(c.Request.Context(), id, req)
	if err != nil {
		debugLog("UpdateWarehouseHandler", "Service UpdateWarehouse failed", map[string]interface{}{
			"error": err.Error(),
			"id": id.String(),
			"request": req,
		})
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	debugLog("UpdateWarehouseHandler", "Service UpdateWarehouse successful", map[string]interface{}{
		"result": warehouse,
	})

	c.JSON(http.StatusOK, warehouse)
}

func (h *WarehouseHandler) DeleteWarehouse(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID"})
		return
	}

	err = h.warehouseService.DeleteWarehouse(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Warehouse deleted successfully"})
}