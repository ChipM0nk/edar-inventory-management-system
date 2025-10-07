package handlers

import (
	"net/http"
	"strconv"
	"time"
	"inventory-system/internal/models"
	"inventory-system/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type TransferHandler struct {
	transferService *services.TransferService
}

func NewTransferHandler(transferService *services.TransferService) *TransferHandler {
	return &TransferHandler{
		transferService: transferService,
	}
}

// CreateTransfer creates a new transfer
// @Summary Create transfer
// @Description Create a new transfer with items
// @Tags Transfers
// @Accept json
// @Produce json
// @Param request body models.CreateTransferRequest true "Transfer details"
// @Success 201 {object} models.Transfer
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /transfers [post]
func (h *TransferHandler) CreateTransfer(c *gin.Context) {
	var req models.CreateTransferRequest
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
	transfer, err := h.transferService.CreateTransfer(c.Request.Context(), req, userIDUUID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, transfer)
}

// GetTransfer gets a transfer by ID
// @Summary Get transfer
// @Description Get a transfer by ID with all items
// @Tags Transfers
// @Accept json
// @Produce json
// @Param id path string true "Transfer ID"
// @Success 200 {object} models.Transfer
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Security BearerAuth
// @Router /transfers/{id} [get]
func (h *TransferHandler) GetTransfer(c *gin.Context) {
	transferIDStr := c.Param("id")
	transferID, err := uuid.Parse(transferIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transfer ID"})
		return
	}

	transfer, err := h.transferService.GetTransfer(c.Request.Context(), transferID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transfer not found"})
		return
	}

	c.JSON(http.StatusOK, transfer)
}

// GetTransferByReference gets a transfer by reference number
// @Summary Get transfer by reference
// @Description Get a transfer by reference number
// @Tags Transfers
// @Accept json
// @Produce json
// @Param reference path string true "Reference Number"
// @Success 200 {object} models.Transfer
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Security BearerAuth
// @Router /transfers/reference/{reference} [get]
func (h *TransferHandler) GetTransferByReference(c *gin.Context) {
	referenceNumber := c.Param("reference")
	if referenceNumber == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reference number is required"})
		return
	}

	transfer, err := h.transferService.GetTransferByReferenceNumber(c.Request.Context(), referenceNumber)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transfer not found"})
		return
	}

	c.JSON(http.StatusOK, transfer)
}

// ListTransfers gets a paginated list of transfers
// @Summary List transfers
// @Description Get a paginated list of transfers with optional filters
// @Tags Transfers
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param reference_number query string false "Filter by reference number"
// @Param status query string false "Filter by status"
// @Param created_by query string false "Filter by creator ID"
// @Param from_warehouse query string false "Filter by from warehouse ID"
// @Param to_warehouse query string false "Filter by to warehouse ID"
// @Param transfer_date_from query string false "Filter by transfer date from (YYYY-MM-DD)"
// @Param transfer_date_to query string false "Filter by transfer date to (YYYY-MM-DD)"
// @Success 200 {object} models.TransferResponse
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /transfers [get]
func (h *TransferHandler) ListTransfers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	referenceNumber := c.Query("reference_number")
	status := c.Query("status")
	createdByStr := c.Query("created_by")
	fromWarehouseStr := c.Query("from_warehouse")
	toWarehouseStr := c.Query("to_warehouse")
	transferDateFromStr := c.Query("transfer_date_from")
	transferDateToStr := c.Query("transfer_date_to")

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	filter := models.TransferFilter{
		Page:            page,
		Limit:           limit,
		ReferenceNumber: &referenceNumber,
		Status:          &status,
	}

	// Parse UUIDs if provided
	if createdByStr != "" {
		if createdBy, err := uuid.Parse(createdByStr); err == nil {
			filter.CreatedBy = &createdBy
		}
	}
	if fromWarehouseStr != "" {
		if fromWarehouse, err := uuid.Parse(fromWarehouseStr); err == nil {
			filter.FromWarehouseID = &fromWarehouse
		}
	}
	if toWarehouseStr != "" {
		if toWarehouse, err := uuid.Parse(toWarehouseStr); err == nil {
			filter.ToWarehouseID = &toWarehouse
		}
	}

	// Parse dates if provided
	if transferDateFromStr != "" {
		if transferDateFrom, err := time.Parse("2006-01-02", transferDateFromStr); err == nil {
			filter.TransferDateFrom = &transferDateFrom
		}
	}
	if transferDateToStr != "" {
		if transferDateTo, err := time.Parse("2006-01-02", transferDateToStr); err == nil {
			filter.TransferDateTo = &transferDateTo
		}
	}

	// Remove nil pointers if empty
	if referenceNumber == "" {
		filter.ReferenceNumber = nil
	}
	if status == "" {
		filter.Status = nil
	}

	response, err := h.transferService.ListTransfers(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// UpdateTransferStatus updates a transfer status
// @Summary Update transfer status
// @Description Update the status of a transfer
// @Tags Transfers
// @Accept json
// @Produce json
// @Param id path string true "Transfer ID"
// @Param request body map[string]string true "Status update"
// @Success 200 {object} models.Transfer
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Security BearerAuth
// @Router /transfers/{id}/status [put]
func (h *TransferHandler) UpdateTransferStatus(c *gin.Context) {
	transferIDStr := c.Param("id")
	transferID, err := uuid.Parse(transferIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transfer ID"})
		return
	}

	var req map[string]string
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	status, exists := req["status"]
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status is required"})
		return
	}

	// Validate status
	validStatuses := []string{"pending", "in_transit", "completed", "cancelled"}
	valid := false
	for _, validStatus := range validStatuses {
		if status == validStatus {
			valid = true
			break
		}
	}
	if !valid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status. Must be one of: pending, in_transit, completed, cancelled"})
		return
	}

	transfer, err := h.transferService.UpdateTransferStatus(c.Request.Context(), transferID, status)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transfer not found"})
		return
	}

	c.JSON(http.StatusOK, transfer)
}

// DeleteTransfer deletes a transfer
// @Summary Delete transfer
// @Description Delete a transfer and all its items
// @Tags Transfers
// @Accept json
// @Produce json
// @Param id path string true "Transfer ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Security BearerAuth
// @Router /transfers/{id} [delete]
func (h *TransferHandler) DeleteTransfer(c *gin.Context) {
	transferIDStr := c.Param("id")
	transferID, err := uuid.Parse(transferIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transfer ID"})
		return
	}

	err = h.transferService.DeleteTransfer(c.Request.Context(), transferID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transfer not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Transfer deleted successfully"})
}
