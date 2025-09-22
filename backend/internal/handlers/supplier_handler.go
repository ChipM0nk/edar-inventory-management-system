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
