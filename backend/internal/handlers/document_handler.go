package handlers

import (
	"fmt"
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

// UploadDocuments handles document upload for a purchase order
func (h *DocumentHandler) UploadDocuments(c *gin.Context) {
	purchaseOrderID := c.PostForm("purchase_order_id")
	if purchaseOrderID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Purchase order ID is required"})
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
		
		// Create directory structure: /po/year/month/
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
		dirPath := filepath.Join(wd, "documents", "po", year, month)
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
		relativePath := filepath.Join("po", year, month, fileName)
		doc, err := h.documentService.CreateDocument(
			purchaseOrderID,
			file.Filename,
			relativePath,
			file.Size,
			file.Header.Get("Content-Type"),
		)
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

// GetDocuments retrieves documents for a purchase order
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
	fullPath := filepath.Join(wd, "documents", document.FilePath)

	// Check if file exists
	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found on disk"})
		return
	}

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

// ValidateDocument validates a document using OCR
func (h *DocumentHandler) ValidateDocument(c *gin.Context) {
	documentID := c.Param("id")
	if documentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Document ID is required"})
		return
	}

	// Get document info to verify it exists
	_, err := h.documentService.GetDocumentByID(documentID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Document not found"})
		return
	}

	// Get purchase order info
	poNumber := c.Query("po_number")
	orderDateStr := c.Query("order_date")
	
	if poNumber == "" || orderDateStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "PO number and order date are required for validation"})
		return
	}

	orderDate, err := time.Parse("2006-01-02", orderDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order date format. Use YYYY-MM-DD"})
		return
	}

	// Perform validation
	result, err := h.documentService.ValidateDocument(documentID, poNumber, orderDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate document"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"document_id": documentID,
		"validation_result": result,
	})
}

// GetDocumentValidationStatus returns the validation status of a document
func (h *DocumentHandler) GetDocumentValidationStatus(c *gin.Context) {
	documentID := c.Param("id")
	if documentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Document ID is required"})
		return
	}

	document, err := h.documentService.GetDocumentValidationStatus(documentID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Document not found"})
		return
	}

	c.JSON(http.StatusOK, document)
}
