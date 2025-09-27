package services

import (
	"context"
	"inventory-system/internal/database"
	sqlc "inventory-system/internal/database/sqlc"
	"inventory-system/internal/models"
	"inventory-system/internal/utils"
	"path/filepath"
	"time"
	"github.com/google/uuid"
)

// Helper function to safely get string value from pointer
func getStringValue(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

type DocumentService struct {
	db *database.DB
	validationService *DocumentValidationService
}

func NewDocumentService(db *database.DB) *DocumentService {
	return &DocumentService{
		db: db,
		validationService: NewDocumentValidationService(db),
	}
}

func (s *DocumentService) CreateDocument(purchaseOrderID, fileName, filePath string, fileSize int64, fileType string) (*models.Document, error) {
	ctx := context.Background()
	doc, err := s.db.CreateDocument(ctx, &sqlc.CreateDocumentParams{
		PurchaseOrderID: utils.UUIDToPgxUUID(uuid.MustParse(purchaseOrderID)),
		FileName:        fileName,
		FilePath:        filePath,
		FileSize:        fileSize,
		FileType:        fileType,
	})
	if err != nil {
		return nil, err
	}

	return &models.Document{
		ID:              utils.PgxUUIDToUUID(doc.ID).String(),
		PurchaseOrderID: utils.PgxUUIDToUUID(doc.PurchaseOrderID).String(),
		FileName:        doc.FileName,
		FilePath:        doc.FilePath,
		FileSize:        doc.FileSize,
		FileType:        doc.FileType,
		UploadedAt:      utils.PgxTimestamptzToTime(doc.UploadedAt),
		CreatedAt:       utils.PgxTimestamptzToTime(doc.CreatedAt),
		UpdatedAt:       utils.PgxTimestamptzToTime(doc.UpdatedAt),
		HasPOReference:  doc.HasPoReference,
		HasMatchingDate: doc.HasMatchingDate,
		ValidationStatus: getStringValue(doc.ValidationStatus),
		ValidationNotes:  doc.ValidationNotes,
	}, nil
}

func (s *DocumentService) GetDocumentsByPurchaseOrder(purchaseOrderID string) ([]models.Document, error) {
	ctx := context.Background()
	docs, err := s.db.GetDocumentsByPurchaseOrder(ctx, utils.UUIDToPgxUUID(uuid.MustParse(purchaseOrderID)))
	if err != nil {
		return nil, err
	}

	result := make([]models.Document, len(docs))
	for i, doc := range docs {
		result[i] = models.Document{
			ID:              utils.PgxUUIDToUUID(doc.ID).String(),
			PurchaseOrderID: utils.PgxUUIDToUUID(doc.PurchaseOrderID).String(),
			FileName:        doc.FileName,
			FilePath:        doc.FilePath,
			FileSize:        doc.FileSize,
			FileType:        doc.FileType,
			UploadedAt:      utils.PgxTimestamptzToTime(doc.UploadedAt),
			CreatedAt:       utils.PgxTimestamptzToTime(doc.CreatedAt),
			UpdatedAt:       utils.PgxTimestamptzToTime(doc.UpdatedAt),
			HasPOReference:  doc.HasPoReference,
			HasMatchingDate: doc.HasMatchingDate,
			ValidationStatus: getStringValue(doc.ValidationStatus),
			ValidationNotes:  doc.ValidationNotes,
		}
	}

	return result, nil
}

func (s *DocumentService) DeleteDocument(documentID string) error {
	ctx := context.Background()
	return s.db.DeleteDocument(ctx, utils.UUIDToPgxUUID(uuid.MustParse(documentID)))
}

func (s *DocumentService) GetDocumentByID(documentID string) (*models.Document, error) {
	ctx := context.Background()
	doc, err := s.db.GetDocumentByID(ctx, utils.UUIDToPgxUUID(uuid.MustParse(documentID)))
	if err != nil {
		return nil, err
	}

	return &models.Document{
		ID:              utils.PgxUUIDToUUID(doc.ID).String(),
		PurchaseOrderID: utils.PgxUUIDToUUID(doc.PurchaseOrderID).String(),
		FileName:        doc.FileName,
		FilePath:        doc.FilePath,
		FileSize:        doc.FileSize,
		FileType:        doc.FileType,
		UploadedAt:      utils.PgxTimestamptzToTime(doc.UploadedAt),
		CreatedAt:       utils.PgxTimestamptzToTime(doc.CreatedAt),
		UpdatedAt:       utils.PgxTimestamptzToTime(doc.UpdatedAt),
		HasPOReference:  doc.HasPoReference,
		HasMatchingDate: doc.HasMatchingDate,
		ValidationStatus: getStringValue(doc.ValidationStatus),
		ValidationNotes:  doc.ValidationNotes,
	}, nil
}

// ValidateDocument performs OCR validation on a document
func (s *DocumentService) ValidateDocument(documentID string, poNumber string, orderDate time.Time) (*ValidationResult, error) {
	return s.validationService.ValidateDocument(documentID, poNumber, orderDate)
}

// GetDocumentValidationStatus returns the validation status of a document
func (s *DocumentService) GetDocumentValidationStatus(documentID string) (*models.Document, error) {
	return s.validationService.GetDocumentValidationStatus(documentID)
}

// GenerateDocumentPath creates a file path based on purchase order date
func GenerateDocumentPath(purchaseOrderDate time.Time, fileName string) string {
	year := purchaseOrderDate.Format("2006")
	month := purchaseOrderDate.Format("01")
	return filepath.Join("po", year, month, fileName)
}