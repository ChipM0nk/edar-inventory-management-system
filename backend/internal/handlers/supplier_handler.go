package handlers

import (
	"net/http"
	"strconv"
	"inventory-system/internal/models"
	"inventory-system/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SupplierHandler struct {
	supplierService *services.SupplierService
}

func NewSupplierHandler(supplierService *services.SupplierService) *SupplierHandler {
	return &SupplierHandler{
		supplierService: supplierService,
	}
}

// CreateSupplier creates a new supplier
// @Summary Create a new supplier
// @Description Create a new supplier with the provided details
// @Tags Suppliers
// @Accept json
// @Produce json
// @Param request body models.CreateSupplierRequest true "Supplier details"
// @Success 201 {object} models.Supplier
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /suppliers [post]
func (h *SupplierHandler) CreateSupplier(c *gin.Context) {
	var req models.CreateSupplierRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	supplier, err := h.supplierService.CreateSupplier(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, supplier)
}

// GetSupplier gets a supplier by ID
// @Summary Get supplier by ID
// @Description Get a specific supplier by its ID
// @Tags Suppliers
// @Accept json
// @Produce json
// @Param id path string true "Supplier ID"
// @Success 200 {object} models.Supplier
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Security BearerAuth
// @Router /suppliers/{id} [get]
func (h *SupplierHandler) GetSupplier(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid supplier ID"})
		return
	}

	supplier, err := h.supplierService.GetSupplier(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Supplier not found"})
		return
	}

	c.JSON(http.StatusOK, supplier)
}

// ListSuppliers gets a paginated list of suppliers
// @Summary List suppliers
// @Description Get a paginated list of suppliers with optional filters
// @Tags Suppliers
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param name query string false "Filter by supplier name"
// @Param contact_person query string false "Filter by contact person"
// @Param email query string false "Filter by email"
// @Param city query string false "Filter by city"
// @Param is_active query bool false "Filter by active status"
// @Param sort_by query string false "Sort by field" default(name)
// @Param sort_order query string false "Sort order" default(asc)
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /suppliers [get]
func (h *SupplierHandler) ListSuppliers(c *gin.Context) {
	// Parse query parameters
	name := c.Query("name")
	contactPerson := c.Query("contact_person")
	email := c.Query("email")
	city := c.Query("city")
	isActiveStr := c.Query("is_active")
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "10")
	sortBy := c.DefaultQuery("sort_by", "name")
	sortOrder := c.DefaultQuery("sort_order", "asc")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 100 {
		limit = 10
	}

	// Validate sort parameters
	if sortBy != "name" && sortBy != "created_at" {
		sortBy = "name"
	}
	if sortOrder != "asc" && sortOrder != "desc" {
		sortOrder = "asc"
	}

	var isActive *bool
	if isActiveStr != "" {
		active := isActiveStr == "true"
		isActive = &active
	}

	filter := models.SupplierFilter{
		Name:         &name,
		ContactPerson: &contactPerson,
		Email:        &email,
		City:         &city,
		IsActive:     isActive,
		Page:         page,
		Limit:        limit,
		SortBy:       sortBy,
		SortOrder:    sortOrder,
	}

	// If no filters, get all suppliers
	if name == "" && contactPerson == "" && email == "" && city == "" && isActiveStr == "" {
		suppliers, err := h.supplierService.ListSuppliers(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch suppliers"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"suppliers": suppliers,
			"total":     len(suppliers),
		})
		return
	}

	suppliers, total, err := h.supplierService.ListSuppliersWithFilter(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch suppliers"})
		return
	}

	pages := (total + int64(limit) - 1) / int64(limit)

	c.JSON(http.StatusOK, gin.H{
		"suppliers": suppliers,
		"total":     total,
		"page":      page,
		"limit":     limit,
		"pages":     pages,
	})
}

// UpdateSupplier updates an existing supplier
// @Summary Update supplier
// @Description Update an existing supplier by ID
// @Tags Suppliers
// @Accept json
// @Produce json
// @Param id path string true "Supplier ID"
// @Param request body models.UpdateSupplierRequest true "Updated supplier details"
// @Success 200 {object} models.Supplier
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Security BearerAuth
// @Router /suppliers/{id} [put]
func (h *SupplierHandler) UpdateSupplier(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid supplier ID"})
		return
	}

	var req models.UpdateSupplierRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	supplier, err := h.supplierService.UpdateSupplier(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, supplier)
}

// DeleteSupplier deletes a supplier by ID
// @Summary Delete supplier
// @Description Delete a supplier by ID
// @Tags Suppliers
// @Accept json
// @Produce json
// @Param id path string true "Supplier ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /suppliers/{id} [delete]
func (h *SupplierHandler) DeleteSupplier(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid supplier ID"})
		return
	}

	err = h.supplierService.DeleteSupplier(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete supplier"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Supplier deleted successfully"})
}
