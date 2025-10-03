package handlers

import (
	"net/http"
	"strconv"
	"inventory-system/internal/models"
	"inventory-system/internal/services"
	"inventory-system/internal/utils"

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


// ListWarehouses gets a paginated list of warehouses
// @Summary List warehouses
// @Description Get a paginated list of warehouses with optional filters
// @Tags Warehouses
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param search query string false "Search by warehouse name"
// @Param is_active query bool false "Filter by active status"
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /warehouses [get]
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

// CreateWarehouse creates a new warehouse
// @Summary Create a new warehouse
// @Description Create a new warehouse with the provided details
// @Tags Warehouses
// @Accept json
// @Produce json
// @Param request body models.CreateWarehouseRequest true "Warehouse details"
// @Success 201 {object} models.Warehouse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /warehouses [post]
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

// GetWarehouse gets a warehouse by ID
// @Summary Get warehouse by ID
// @Description Get a specific warehouse by its ID
// @Tags Warehouses
// @Accept json
// @Produce json
// @Param id path string true "Warehouse ID"
// @Success 200 {object} models.Warehouse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Security BearerAuth
// @Router /warehouses/{id} [get]
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

// UpdateWarehouse updates an existing warehouse
// @Summary Update warehouse
// @Description Update an existing warehouse by ID
// @Tags Warehouses
// @Accept json
// @Produce json
// @Param id path string true "Warehouse ID"
// @Param request body models.UpdateWarehouseRequest true "Updated warehouse details"
// @Success 200 {object} models.Warehouse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Security BearerAuth
// @Router /warehouses/{id} [put]
func (h *WarehouseHandler) UpdateWarehouse(c *gin.Context) {
	utils.DebugLog("UpdateWarehouseHandler", "Handler called", map[string]interface{}{
		"method": c.Request.Method,
		"url": c.Request.URL.String(),
		"headers": c.Request.Header,
	})
	
	idStr := c.Param("id")
	utils.DebugLog("UpdateWarehouseHandler", "Extracted ID from URL", map[string]interface{}{
		"id_string": idStr,
	})
	
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.DebugLog("UpdateWarehouseHandler", "UUID parsing failed", map[string]interface{}{
			"id_string": idStr,
			"error": err.Error(),
		})
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID"})
		return
	}
	
	utils.DebugLog("UpdateWarehouseHandler", "UUID parsed successfully", map[string]interface{}{
		"id": id.String(),
	})

	var req models.UpdateWarehouseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.DebugLog("UpdateWarehouseHandler", "JSON binding failed", map[string]interface{}{
			"error": err.Error(),
		})
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	utils.DebugLog("UpdateWarehouseHandler", "JSON binding successful", map[string]interface{}{
		"request": req,
	})

	warehouse, err := h.warehouseService.UpdateWarehouse(c.Request.Context(), id, req)
	if err != nil {
		utils.DebugLog("UpdateWarehouseHandler", "Service UpdateWarehouse failed", map[string]interface{}{
			"error": err.Error(),
			"id": id.String(),
			"request": req,
		})
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	utils.DebugLog("UpdateWarehouseHandler", "Service UpdateWarehouse successful", map[string]interface{}{
		"result": warehouse,
	})

	c.JSON(http.StatusOK, warehouse)
}

// DeleteWarehouse deletes a warehouse by ID
// @Summary Delete warehouse
// @Description Delete a warehouse by ID
// @Tags Warehouses
// @Accept json
// @Produce json
// @Param id path string true "Warehouse ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /warehouses/{id} [delete]
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