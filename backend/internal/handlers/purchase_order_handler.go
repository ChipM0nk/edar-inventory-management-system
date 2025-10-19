package handlers

import (
	"fmt"
	"inventory-system/internal/models"
	"inventory-system/internal/services"
	"inventory-system/internal/utils"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
// @Summary Create a new purchase order
// @Description Create a new purchase order with the provided details
// @Tags Purchase Orders
// @Accept json
// @Produce json
// @Param request body models.CreatePurchaseOrderRequest true "Purchase order details"
// @Success 201 {object} models.PurchaseOrder
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /purchase-orders [post]
func (h *PurchaseOrderHandler) CreatePurchaseOrder(c *gin.Context) {
	var req models.CreatePurchaseOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.DebugLog("CreatePurchaseOrder", "JSON binding error", map[string]interface{}{
			"error": err.Error(),
		})
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Debug logging for request data
	utils.DebugLog("CreatePurchaseOrder", "Request received", map[string]interface{}{
		"po_number":         req.PoNumber,
		"supplier_name":     req.SupplierName,
		"supplier_contact":  req.SupplierContact,
		"order_date":        req.OrderDate,
		"expected_delivery": req.ExpectedDeliveryDate,
		"notes":             req.Notes,
		"created_by":        req.CreatedBy,
		"warehouse_id":      req.WarehouseID,
	})

	// Validate required fields
	if req.PoNumber == "" {
		utils.DebugLog("CreatePurchaseOrder", "Validation error", map[string]interface{}{
			"error": "PO Reference Number is required",
		})
		c.JSON(http.StatusBadRequest, gin.H{"error": "PO Reference Number is required"})
		return
	}

	utils.DebugLog("CreatePurchaseOrder", "Calling service", map[string]interface{}{
		"po_number": req.PoNumber,
	})

	purchaseOrder, err := h.purchaseOrderService.CreatePurchaseOrder(req)
	if err != nil {
		utils.DebugLog("CreatePurchaseOrder", "Service error", map[string]interface{}{
			"error":     err.Error(),
			"po_number": req.PoNumber,
		})

		// Check for specific error types and return appropriate status codes
		errorMsg := err.Error()
		if strings.Contains(errorMsg, "purchase_orders_po_number_key") ||
			strings.Contains(errorMsg, "duplicate key value violates unique constraint") ||
			strings.Contains(errorMsg, "SQLSTATE 23505") {
			utils.DebugLog("CreatePurchaseOrder", "Duplicate PO number detected", map[string]interface{}{
				"po_number": req.PoNumber,
				"error":     errorMsg,
			})
			c.JSON(http.StatusConflict, gin.H{"error": "The Purchase Order number you entered already exists. Please use a different reference number."})
		} else {
			utils.DebugLog("CreatePurchaseOrder", "Generic error", map[string]interface{}{
				"po_number": req.PoNumber,
				"error":     errorMsg,
			})
			c.JSON(http.StatusInternalServerError, gin.H{"error": "An unexpected error occurred while creating the purchase order. Please try again later."})
		}
		return
	}

	utils.DebugLog("CreatePurchaseOrder", "Success", map[string]interface{}{
		"purchase_order_id": purchaseOrder.ID,
		"po_number":         purchaseOrder.PoNumber,
	})

	c.JSON(http.StatusCreated, purchaseOrder)
}

// GetPurchaseOrder retrieves a purchase order by ID
// @Summary Get purchase order by ID
// @Description Get a specific purchase order by its ID
// @Tags Purchase Orders
// @Accept json
// @Produce json
// @Param id path string true "Purchase Order ID"
// @Success 200 {object} models.PurchaseOrder
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Security BearerAuth
// @Router /purchase-orders/{id} [get]
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
// @Summary List purchase orders
// @Description Get a paginated list of purchase orders
// @Tags Purchase Orders
// @Accept json
// @Produce json
// @Param limit query int false "Number of items to return" default(10)
// @Param offset query int false "Number of items to skip" default(0)
// @Success 200 {array} models.PurchaseOrder
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /purchase-orders [get]
func (h *PurchaseOrderHandler) ListPurchaseOrders(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "10")
	offsetStr := c.DefaultQuery("offset", "0")

	fmt.Printf("ListPurchaseOrders handler called with limit=%s, offset=%s\n", limitStr, offsetStr)

	limit, err := strconv.ParseInt(limitStr, 10, 32)
	if err != nil {
		fmt.Printf("Invalid limit parameter: %s\n", limitStr)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit parameter"})
		return
	}

	offset, err := strconv.ParseInt(offsetStr, 10, 32)
	if err != nil {
		fmt.Printf("Invalid offset parameter: %s\n", offsetStr)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid offset parameter"})
		return
	}

	fmt.Printf("Calling service with limit=%d, offset=%d\n", limit, offset)
	purchaseOrders, err := h.purchaseOrderService.ListPurchaseOrders(int32(limit), int32(offset))
	if err != nil {
		fmt.Printf("Service error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve purchase orders"})
		return
	}

	fmt.Printf("Handler returning %d purchase orders\n", len(purchaseOrders))
	c.JSON(http.StatusOK, purchaseOrders)
}

// UpdatePurchaseOrder updates a purchase order
// @Summary Update purchase order
// @Description Update an existing purchase order by ID
// @Tags Purchase Orders
// @Accept json
// @Produce json
// @Param id path string true "Purchase Order ID"
// @Param request body models.UpdatePurchaseOrderRequest true "Updated purchase order details"
// @Success 200 {object} models.PurchaseOrder
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Security BearerAuth
// @Router /purchase-orders/{id} [put]
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

// CancelPurchaseOrder cancels a purchase order
// @Summary Cancel purchase order
// @Description Cancel a purchase order by ID with a reason
// @Tags Purchase Orders
// @Accept json
// @Produce json
// @Param id path string true "Purchase Order ID"
// @Param request body object{reason=string} true "Cancellation reason"
// @Success 200 {object} models.PurchaseOrder
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Security BearerAuth
// @Router /purchase-orders/{id}/cancel [post]
func (h *PurchaseOrderHandler) CancelPurchaseOrder(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Purchase order ID is required"})
		return
	}

	// Validate that the ID is a valid UUID
	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid purchase order ID format"})
		return
	}

	var req struct {
		Reason string `json:"reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reason is required"})
		return
	}

	// Get user ID from JWT token
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDUUID, ok := userID.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	purchaseOrder, err := h.purchaseOrderService.CancelPurchaseOrder(id, req.Reason, userIDUUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, purchaseOrder)
}
