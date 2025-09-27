package services

import (
	"fmt"
	"inventory-system/internal/database"
	sqlc "inventory-system/internal/database/sqlc"
	"inventory-system/internal/models"
	"inventory-system/internal/utils"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	// "github.com/otiai10/gosseract/v2" // Requires CGO and Tesseract installation
)


type DocumentValidationService struct {
	db *database.DB
}

func NewDocumentValidationService(db *database.DB) *DocumentValidationService {
	return &DocumentValidationService{
		db: db,
	}
}

type ValidationResult struct {
	HasPOReference  bool
	HasMatchingDate bool
	Status          string
	Notes           string
	ExtractedText   string
}

// ValidateDocument performs OCR validation on a document
func (s *DocumentValidationService) ValidateDocument(documentID string, poNumber string, orderDate time.Time) (*ValidationResult, error) {
	// Get document info
	document, err := s.db.GetDocumentByID(nil, utils.UUIDToPgxUUID(uuid.MustParse(documentID)))
	if err != nil {
		return nil, fmt.Errorf("failed to get document: %w", err)
	}

	// Construct full file path
	wd, err := os.Getwd()
	if err != nil {
		return nil, fmt.Errorf("failed to get working directory: %w", err)
	}
	
	// If we're in backend directory, go up one level to project root
	if filepath.Base(wd) == "backend" {
		wd = filepath.Dir(wd)
	}
	
	fullPath := filepath.Join(wd, "documents", document.FilePath)
	
	// Check if file exists
	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("file not found: %s", fullPath)
	}

	// Check if file is an image or PDF that can be processed
	if !s.canProcessFile(document.FileType) {
		return &ValidationResult{
			HasPOReference:  false,
			HasMatchingDate: false,
			Status:          "skipped",
			Notes:           "File type not supported for OCR validation",
		}, nil
	}

	// Extract text using OCR
	extractedText, err := s.extractTextFromFile(fullPath, document.FileType)
	if err != nil {
		return &ValidationResult{
			HasPOReference:  false,
			HasMatchingDate: false,
			Status:          "error",
			Notes:           fmt.Sprintf("OCR extraction failed: %v", err),
		}, nil
	}

	// Check if OCR is available
	if strings.Contains(extractedText, "OCR functionality not available") {
		result := &ValidationResult{
			HasPOReference:  false,
			HasMatchingDate: false,
			Status:          "skipped",
			Notes:           "OCR not available - manual validation required",
			ExtractedText:   extractedText,
		}
		
		// Update document validation in database
		_, err = s.db.UpdateDocumentValidation(nil, &sqlc.UpdateDocumentValidationParams{
			ID:               utils.UUIDToPgxUUID(uuid.MustParse(documentID)),
			HasPoReference:   &result.HasPOReference,
			HasMatchingDate:  &result.HasMatchingDate,
			ValidationStatus: &result.Status,
			ValidationNotes:  &result.Notes,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to update document validation: %w", err)
		}
		
		return result, nil
	}

	// Validate against PO details
	result := s.validateText(extractedText, poNumber, orderDate)
	result.ExtractedText = extractedText

	// Update document validation in database
	_, err = s.db.UpdateDocumentValidation(nil, &sqlc.UpdateDocumentValidationParams{
		ID:               utils.UUIDToPgxUUID(uuid.MustParse(documentID)),
		HasPoReference:   &result.HasPOReference,
		HasMatchingDate:  &result.HasMatchingDate,
		ValidationStatus: &result.Status,
		ValidationNotes:  &result.Notes,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update document validation: %w", err)
	}

	return result, nil
}

// canProcessFile checks if the file type can be processed by OCR
func (s *DocumentValidationService) canProcessFile(fileType string) bool {
	supportedTypes := []string{
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/gif",
		"image/bmp",
		"image/tiff",
		"application/pdf",
	}
	
	fileType = strings.ToLower(fileType)
	for _, supportedType := range supportedTypes {
		if fileType == supportedType {
			return true
		}
	}
	return false
}

// extractTextFromFile performs OCR on the file
func (s *DocumentValidationService) extractTextFromFile(filePath, fileType string) (string, error) {
	// TODO: Implement OCR functionality
	// This requires Tesseract OCR to be installed on the system
	// For now, return a placeholder message indicating OCR is not available
	
	return "OCR functionality not available. Please install Tesseract OCR to enable document validation.", nil
	
	/* 
	// Uncomment this code when Tesseract OCR is installed:
	client := gosseract.NewClient()
	defer client.Close()

	// Set language (English)
	if err := client.SetLanguage("eng"); err != nil {
		return "", fmt.Errorf("failed to set language: %w", err)
	}

	// Set image path
	if err := client.SetImage(filePath); err != nil {
		return "", fmt.Errorf("failed to set image: %w", err)
	}

	// Extract text
	text, err := client.Text()
	if err != nil {
		return "", fmt.Errorf("failed to extract text: %w", err)
	}

	return text, nil
	*/
}

// validateText checks if the extracted text contains the expected PO reference and date
func (s *DocumentValidationService) validateText(text, expectedPONumber string, expectedOrderDate time.Time) *ValidationResult {
	result := &ValidationResult{
		HasPOReference:  false,
		HasMatchingDate: false,
		Status:          "failed",
		Notes:           "",
	}

	text = strings.ToUpper(strings.TrimSpace(text))
	expectedPONumber = strings.ToUpper(strings.TrimSpace(expectedPONumber))

	// Check for PO reference
	hasPOReference := s.checkPOReference(text, expectedPONumber)
	result.HasPOReference = hasPOReference

	// Check for matching date
	hasMatchingDate := s.checkMatchingDate(text, expectedOrderDate)
	result.HasMatchingDate = hasMatchingDate

	// Determine status and notes
	if hasPOReference && hasMatchingDate {
		result.Status = "valid"
		result.Notes = "Document contains matching PO reference and date"
	} else if hasPOReference && !hasMatchingDate {
		result.Status = "warning"
		result.Notes = "Document contains PO reference but date does not match"
	} else if !hasPOReference && hasMatchingDate {
		result.Status = "warning"
		result.Notes = "Document contains matching date but PO reference not found"
	} else {
		result.Status = "failed"
		result.Notes = "Document does not contain matching PO reference or date"
	}

	return result
}

// checkPOReference looks for the PO number in the text
func (s *DocumentValidationService) checkPOReference(text, expectedPONumber string) bool {
	// Remove common prefixes and suffixes
	expectedPONumber = strings.ReplaceAll(expectedPONumber, "PO", "")
	expectedPONumber = strings.ReplaceAll(expectedPONumber, "#", "")
	expectedPONumber = strings.TrimSpace(expectedPONumber)

	// Create various patterns to match
	patterns := []string{
		// Direct match
		expectedPONumber,
		// With PO prefix
		"PO\\s*#?\\s*" + regexp.QuoteMeta(expectedPONumber),
		// With Purchase Order prefix
		"PURCHASE\\s+ORDER\\s*#?\\s*" + regexp.QuoteMeta(expectedPONumber),
		// Just the number
		"\\b" + regexp.QuoteMeta(expectedPONumber) + "\\b",
	}

	for _, pattern := range patterns {
		matched, err := regexp.MatchString("(?i)"+pattern, text)
		if err == nil && matched {
			return true
		}
	}

	return false
}

// checkMatchingDate looks for dates that match the expected order date
func (s *DocumentValidationService) checkMatchingDate(text string, expectedDate time.Time) bool {
	// Get different date formats
	expectedDateFormats := []string{
		expectedDate.Format("01/02/2006"),   // MM/DD/YYYY
		expectedDate.Format("01-02-2006"),   // MM-DD-YYYY
		expectedDate.Format("2006-01-02"),   // YYYY-MM-DD
		expectedDate.Format("01/02/06"),     // MM/DD/YY
		expectedDate.Format("01-02-06"),     // MM-DD-YY
		expectedDate.Format("02/01/2006"),   // DD/MM/YYYY
		expectedDate.Format("02-01-2006"),   // DD-MM-YYYY
	}

	// Check for each format
	for _, dateFormat := range expectedDateFormats {
		if strings.Contains(text, dateFormat) {
			return true
		}
	}

	// Also check for partial matches (month and year)
	monthYear := expectedDate.Format("01/2006")
	if strings.Contains(text, monthYear) {
		return true
	}

	return false
}

// GetDocumentValidationStatus returns the validation status of a document
func (s *DocumentValidationService) GetDocumentValidationStatus(documentID string) (*models.Document, error) {
	document, err := s.db.GetDocumentByID(nil, utils.UUIDToPgxUUID(uuid.MustParse(documentID)))
	if err != nil {
		return nil, err
	}

	return &models.Document{
		ID:              utils.PgxUUIDToUUID(document.ID).String(),
		PurchaseOrderID: utils.PgxUUIDToUUID(document.PurchaseOrderID).String(),
		FileName:        document.FileName,
		FilePath:        document.FilePath,
		FileSize:        document.FileSize,
		FileType:        document.FileType,
		UploadedAt:      utils.PgxTimestamptzToTime(document.UploadedAt),
		CreatedAt:       utils.PgxTimestamptzToTime(document.CreatedAt),
		UpdatedAt:       utils.PgxTimestamptzToTime(document.UpdatedAt),
		HasPOReference:  document.HasPoReference,
		HasMatchingDate: document.HasMatchingDate,
		ValidationStatus: getStringValue(document.ValidationStatus),
		ValidationNotes:  document.ValidationNotes,
	}, nil
}
