package handlers

import (
	"inventory-system/internal/models"
	"inventory-system/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type PurchaseOrderHandler struct {
	purchaseOrderService *services.PurchaseOrderService
}

func NewPurchaseOrderHandler(purchaseOrderService *services.PurchaseOrderService) *PurchaseOrderHandler {
	return &PurchaseOrderHandler{
		purchaseOrderService: purchaseOrderService,
	}
}

// CreatePurchaseOrder creates a new purchase order
func (h *PurchaseOrderHandler) CreatePurchaseOrder(c *gin.Context) {
	var req models.CreatePurchaseOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	purchaseOrder, err := h.purchaseOrderService.CreatePurchaseOrder(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create purchase order"})
		return
	}

	c.JSON(http.StatusCreated, purchaseOrder)
}

// GetPurchaseOrder retrieves a purchase order by ID
func (h *PurchaseOrderHandler) GetPurchaseOrder(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Purchase order ID is required"})
		return
	}

	purchaseOrder, err := h.purchaseOrderService.GetPurchaseOrder(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Purchase order not found"})
		return
	}

	c.JSON(http.StatusOK, purchaseOrder)
}

// ListPurchaseOrders retrieves a list of purchase orders
func (h *PurchaseOrderHandler) ListPurchaseOrders(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "10")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.ParseInt(limitStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit parameter"})
		return
	}

	offset, err := strconv.ParseInt(offsetStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid offset parameter"})
		return
	}

	purchaseOrders, err := h.purchaseOrderService.ListPurchaseOrders(int32(limit), int32(offset))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve purchase orders"})
		return
	}

	c.JSON(http.StatusOK, purchaseOrders)
}

// UpdatePurchaseOrder updates a purchase order
func (h *PurchaseOrderHandler) UpdatePurchaseOrder(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Purchase order ID is required"})
		return
	}

	var req models.UpdatePurchaseOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	purchaseOrder, err := h.purchaseOrderService.UpdatePurchaseOrder(id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update purchase order"})
		return
	}

	c.JSON(http.StatusOK, purchaseOrder)
}

