package handlers

import (
	"fmt"
	"inventory-system/internal/models"
	"inventory-system/internal/services"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// Helper function to check if file type is viewable in browser
func isViewableFileType(fileType string) bool {
	viewableTypes := []string{
		"image/jpeg",
		"image/jpg", 
		"image/png",
		"image/gif",
		"image/webp",
		"application/pdf",
		"text/plain",
		"text/html",
		"text/css",
		"text/javascript",
	}
	
	fileType = strings.ToLower(fileType)
	for _, viewableType := range viewableTypes {
		if fileType == viewableType {
			return true
		}
	}
	return false
}

type DocumentHandler struct {
	documentService *services.DocumentService
}

func NewDocumentHandler(documentService *services.DocumentService) *DocumentHandler {
	return &DocumentHandler{
		documentService: documentService,
	}
}

// UploadDocuments handles document upload for all stock movement types
func (h *DocumentHandler) UploadDocuments(c *gin.Context) {
	referenceType := c.PostForm("reference_type")
	referenceID := c.PostForm("reference_id")
	purchaseOrderID := c.PostForm("purchase_order_id")
	
	fmt.Printf("Document upload parameters - reference_type: '%s', reference_id: '%s', purchase_order_id: '%s'\n", 
		referenceType, referenceID, purchaseOrderID)
	
	// Support legacy purchase_order_id parameter for backward compatibility
	if referenceType == "" && referenceID == "" {
		if purchaseOrderID != "" {
			referenceType = "purchase_order"
			referenceID = purchaseOrderID
			fmt.Printf("Using legacy purchase_order_id parameter: %s\n", purchaseOrderID)
		}
	}
	
	if referenceType == "" || referenceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reference type and ID are required (or purchase_order_id for legacy support)"})
		return
	}
	
	// Validate reference type
	validTypes := []string{"purchase_order", "adjustment", "transfer", "sales_order"}
	isValidType := false
	for _, validType := range validTypes {
		if referenceType == validType {
			isValidType = true
			break
		}
	}
	if !isValidType {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reference type. Must be one of: purchase_order, adjustment, transfer, sales_order"})
		return
	}

	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse multipart form"})
		return
	}

	files := form.File["documents"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No documents provided"})
		return
	}

	var uploadedDocs []string

	for _, file := range files {
		// Generate file path based on current date
		now := time.Now()
		year := now.Format("2006")
		month := now.Format("01")
		
		// Create directory structure based on reference type: /{reference_type}/year/month/
		// Get current working directory and build path to project root
		wd, err := os.Getwd()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get working directory"})
			return
		}
		// If we're in backend directory, go up one level to project root
		if filepath.Base(wd) == "backend" {
			wd = filepath.Dir(wd)
		}
		
		// Use appropriate subdirectory based on reference type
		var subDir string
		switch referenceType {
		case "purchase_order":
			subDir = "po"
		case "adjustment":
			subDir = "adjustments"
		case "transfer":
			subDir = "transfers"
		case "sales_order":
			subDir = "sales"
		default:
			subDir = "misc"
		}
		
		// Use backend/documents directory
		dirPath := filepath.Join(wd, "backend", "documents", subDir, year, month)
		if err := os.MkdirAll(dirPath, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create directory"})
			return
		}

		// Generate unique filename
		ext := filepath.Ext(file.Filename)
		baseName := strings.TrimSuffix(file.Filename, ext)
		fileName := baseName + "_" + strconv.FormatInt(time.Now().UnixNano(), 10) + ext
		filePath := filepath.Join(dirPath, fileName)

		// Save file
		fmt.Printf("Attempting to save file to: %s\n", filePath)
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			fmt.Printf("Error saving file: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}
		fmt.Printf("File saved successfully to: %s\n", filePath)

		// Save document record to database
		relativePath := filepath.Join(subDir, year, month, fileName)
		doc, err := h.documentService.CreateDocument(models.CreateDocumentRequest{
			ReferenceType: referenceType,
			ReferenceID:   referenceID,
			FileName:      file.Filename,
			FilePath:      relativePath,
			FileSize:      file.Size,
			FileType:      file.Header.Get("Content-Type"),
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save document record"})
			return
		}

		uploadedDocs = append(uploadedDocs, doc.ID)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Documents uploaded successfully",
		"document_ids": uploadedDocs,
	})
}

// GetDocuments retrieves documents for a purchase order (legacy endpoint)
func (h *DocumentHandler) GetDocuments(c *gin.Context) {
	purchaseOrderID := c.Param("purchase_order_id")
	if purchaseOrderID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Purchase order ID is required"})
		return
	}

	documents, err := h.documentService.GetDocumentsByPurchaseOrder(purchaseOrderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve documents"})
		return
	}

	c.JSON(http.StatusOK, documents)
}

// GetDocumentsByReference retrieves documents by reference type and ID
func (h *DocumentHandler) GetDocumentsByReference(c *gin.Context) {
	referenceType := c.Param("reference_type")
	referenceID := c.Param("reference_id")
	
	if referenceType == "" || referenceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reference type and ID are required"})
		return
	}

	documents, err := h.documentService.GetDocumentsByReference(referenceType, referenceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve documents"})
		return
	}

	c.JSON(http.StatusOK, documents)
}

// DownloadDocument downloads a document
func (h *DocumentHandler) DownloadDocument(c *gin.Context) {
	documentID := c.Param("id")
	if documentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Document ID is required"})
		return
	}

	document, err := h.documentService.GetDocumentByID(documentID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Document not found"})
		return
	}

	// Construct full file path
	// Get current working directory and build path to project root
	wd, err := os.Getwd()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get working directory"})
		return
	}
	// If we're in backend directory, go up one level to project root
	if filepath.Base(wd) == "backend" {
		wd = filepath.Dir(wd)
	}
	// Check if documents directory exists in backend subdirectory first
	backendDocsPath := filepath.Join(wd, "backend", "documents", document.FilePath)
	var fullPath string
	if _, err := os.Stat(backendDocsPath); err == nil {
		fullPath = backendDocsPath
	} else {
		// Fallback to documents in project root
		fullPath = filepath.Join(wd, "documents", document.FilePath)
	}

	// Check if file exists
	fmt.Printf("Looking for document at path: %s\n", fullPath)
	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		fmt.Printf("File not found at path: %s\n", fullPath)
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found on disk"})
		return
	}
	fmt.Printf("File found at path: %s\n", fullPath)

	// Set headers for file download/viewing
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Transfer-Encoding", "binary")
	
	// Use inline disposition for viewable files, attachment for others
	if isViewableFileType(document.FileType) {
		c.Header("Content-Disposition", "inline; filename="+document.FileName)
	} else {
		c.Header("Content-Disposition", "attachment; filename="+document.FileName)
	}
	
	// Use the actual file type from database
	c.Header("Content-Type", document.FileType)

	// Open and stream file
	file, err := os.Open(fullPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open file"})
		return
	}
	defer file.Close()

	// Copy file to response
	_, err = io.Copy(c.Writer, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to stream file"})
		return
	}
}

// DeleteDocument deletes a document
func (h *DocumentHandler) DeleteDocument(c *gin.Context) {
	documentID := c.Param("id")
	if documentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Document ID is required"})
		return
	}

	// Get document info first
	document, err := h.documentService.GetDocumentByID(documentID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Document not found"})
		return
	}

	// Delete file from disk
	fullPath := filepath.Join("documents", document.FilePath)
	if err := os.Remove(fullPath); err != nil && !os.IsNotExist(err) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete file from disk"})
		return
	}

	// Delete document record from database
	if err := h.documentService.DeleteDocument(documentID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete document record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Document deleted successfully"})
}


// GetDocumentsByType retrieves all documents of a specific type
func (h *DocumentHandler) GetDocumentsByType(c *gin.Context) {
	referenceType := c.Param("type")
	if referenceType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reference type is required"})
		return
	}

	// Validate reference type
	validTypes := []string{"purchase_order", "adjustment", "transfer", "sales_order"}
	isValidType := false
	for _, validType := range validTypes {
		if referenceType == validType {
			isValidType = true
			break
		}
	}
	if !isValidType {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reference type. Must be one of: purchase_order, adjustment, transfer, sales_order"})
		return
	}

	documents, err := h.documentService.GetDocumentsByType(referenceType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve documents"})
		return
	}

	c.JSON(http.StatusOK, documents)
}

// ListAllDocuments retrieves all documents with pagination
func (h *DocumentHandler) ListAllDocuments(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.ParseInt(limitStr, 10, 32)
	if err != nil || limit <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit parameter"})
		return
	}

	offset, err := strconv.ParseInt(offsetStr, 10, 32)
	if err != nil || offset < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid offset parameter"})
		return
	}

	documents, err := h.documentService.ListDocuments(int32(limit), int32(offset))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve documents"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"documents": documents,
		"limit":     limit,
		"offset":    offset,
		"count":     len(documents),
	})
}
