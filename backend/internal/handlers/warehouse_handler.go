package handlers

import (
	"net/http"
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

func (h *WarehouseHandler) ListWarehouses(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	isActiveStr := c.Query("is_active")

	var isActive *bool
	if isActiveStr != "" {
		active := isActiveStr == "true"
		isActive = &active
	}

	filter := models.WarehouseFilter{
		Name:     &search,
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
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID"})
		return
	}

	var req models.UpdateWarehouseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	warehouse, err := h.warehouseService.UpdateWarehouse(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

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