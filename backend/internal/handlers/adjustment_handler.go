package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"inventory-system/internal/models"
	"inventory-system/internal/services"
)

type AdjustmentHandler struct {
	adjustmentService *services.AdjustmentService
}

func NewAdjustmentHandler(adjustmentService *services.AdjustmentService) *AdjustmentHandler {
	return &AdjustmentHandler{
		adjustmentService: adjustmentService,
	}
}

// CreateAdjustment creates a new adjustment
// @Summary Create a new adjustment
// @Description Create a new adjustment with the provided details
// @Tags Adjustments
// @Accept json
// @Produce json
// @Param request body models.CreateAdjustmentRequest true "Adjustment details"
// @Success 201 {object} models.Adjustment
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /adjustments [post]
func (h *AdjustmentHandler) CreateAdjustment(c *gin.Context) {
	var req models.CreateAdjustmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context (assuming it's set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	req.CreatedBy = userID.(uuid.UUID)

	adjustment, err := h.adjustmentService.CreateAdjustment(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, adjustment)
}

// GetAdjustment retrieves a specific adjustment by ID
// @Summary Get adjustment by ID
// @Description Get a specific adjustment by its ID
// @Tags Adjustments
// @Accept json
// @Produce json
// @Param id path string true "Adjustment ID"
// @Success 200 {object} models.Adjustment
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Security BearerAuth
// @Router /adjustments/{id} [get]
func (h *AdjustmentHandler) GetAdjustment(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid adjustment ID"})
		return
	}

	adjustment, err := h.adjustmentService.GetAdjustment(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Adjustment not found"})
		return
	}

	c.JSON(http.StatusOK, adjustment)
}

// ListAdjustments retrieves a list of adjustments with pagination
// @Summary List adjustments
// @Description Get a paginated list of adjustments with optional filters
// @Tags Adjustments
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param reference_number query string false "Filter by reference number"
// @Param status query string false "Filter by status"
// @Success 200 {object} models.AdjustmentListResponse
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /adjustments [get]
func (h *AdjustmentHandler) ListAdjustments(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	filter := models.AdjustmentFilter{
		Page:  page,
		Limit: limit,
	}

	adjustments, total, err := h.adjustmentService.ListAdjustments(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	totalPages := int((total + int64(limit) - 1) / int64(limit))

	response := models.AdjustmentListResponse{
		Adjustments: adjustments,
		Total:       total,
		Page:        page,
		Limit:       limit,
		TotalPages:  totalPages,
	}

	c.JSON(http.StatusOK, response)
}

// UpdateAdjustment updates an existing adjustment
// @Summary Update adjustment
// @Description Update an existing adjustment by ID
// @Tags Adjustments
// @Accept json
// @Produce json
// @Param id path string true "Adjustment ID"
// @Param request body models.UpdateAdjustmentRequest true "Updated adjustment details"
// @Success 200 {object} models.Adjustment
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /adjustments/{id} [put]
func (h *AdjustmentHandler) UpdateAdjustment(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid adjustment ID"})
		return
	}

	var req models.UpdateAdjustmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	adjustment, err := h.adjustmentService.UpdateAdjustment(id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, adjustment)
}

// DeleteAdjustment deletes an adjustment
// @Summary Delete adjustment
// @Description Delete an adjustment by ID
// @Tags Adjustments
// @Accept json
// @Produce json
// @Param id path string true "Adjustment ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /adjustments/{id} [delete]
func (h *AdjustmentHandler) DeleteAdjustment(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid adjustment ID"})
		return
	}

	err = h.adjustmentService.DeleteAdjustment(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Adjustment deleted successfully"})
}

// CancelAdjustment cancels an adjustment and reverses its stock/movements
// @Summary Cancel adjustment
// @Description Cancel an adjustment by ID, record cancellation info, and reverse stock/movements
// @Tags Adjustments
// @Accept json
// @Produce json
// @Param id path string true "Adjustment ID"
// @Param request body map[string]string true "Cancellation payload {reason}"
// @Success 200 {object} models.Adjustment
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /adjustments/{id}/cancel [post]
func (h *AdjustmentHandler) CancelAdjustment(c *gin.Context) {
    id, err := uuid.Parse(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid adjustment ID"})
        return
    }

    // Get user id performing cancellation
    userIDVal, exists := c.Get("user_id")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
        return
    }
    userID := userIDVal.(uuid.UUID)

    var payload struct{ Reason string `json:"reason"` }
    _ = c.ShouldBindJSON(&payload)

    adj, err := h.adjustmentService.CancelAdjustment(id, userID, payload.Reason)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, adj)
}
