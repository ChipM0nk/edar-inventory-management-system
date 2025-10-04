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

// Helper function to convert database document to model
func (s *DocumentService) convertToDocumentModel(doc *sqlc.Document) *models.Document {
	return &models.Document{
		ID:              utils.PgxUUIDToUUID(doc.ID).String(),
		ReferenceType:   doc.ReferenceType,
		ReferenceID:     utils.PgxUUIDToUUID(doc.ReferenceID).String(),
		FileName:        doc.FileName,
		FilePath:        doc.FilePath,
		FileSize:        doc.FileSize,
		FileType:        doc.FileType,
		UploadedAt:      utils.PgxTimestamptzToTime(doc.UploadedAt),
		CreatedAt:       utils.PgxTimestamptzToTime(doc.CreatedAt),
		UpdatedAt:       utils.PgxTimestamptzToTime(doc.UpdatedAt),
	}
}

type DocumentService struct {
	db *database.DB
}

func NewDocumentService(db *database.DB) *DocumentService {
	return &DocumentService{
		db: db,
	}
}

func (s *DocumentService) CreateDocument(req models.CreateDocumentRequest) (*models.Document, error) {
	ctx := context.Background()
	
	doc, err := s.db.CreateDocument(ctx, &sqlc.CreateDocumentParams{
		ReferenceType:   req.ReferenceType,
		ReferenceID:     utils.UUIDToPgxUUID(uuid.MustParse(req.ReferenceID)),
		FileName:        req.FileName,
		FilePath:        req.FilePath,
		FileSize:        req.FileSize,
		FileType:        req.FileType,
	})
	if err != nil {
		return nil, err
	}

	return s.convertToDocumentModel(doc), nil
}

// Legacy method for backward compatibility
func (s *DocumentService) CreateDocumentLegacy(referenceType, referenceID, fileName, filePath string, fileSize int64, fileType string) (*models.Document, error) {
	req := models.CreateDocumentRequest{
		ReferenceType: referenceType,
		ReferenceID:   referenceID,
		FileName:      fileName,
		FilePath:      filePath,
		FileSize:      fileSize,
		FileType:      fileType,
	}
	return s.CreateDocument(req)
}

func (s *DocumentService) GetDocumentsByReference(referenceType, referenceID string) ([]models.Document, error) {
	ctx := context.Background()
	docs, err := s.db.GetDocumentsByReference(ctx, &sqlc.GetDocumentsByReferenceParams{
		ReferenceType: referenceType,
		ReferenceID:   utils.UUIDToPgxUUID(uuid.MustParse(referenceID)),
	})
	if err != nil {
		return nil, err
	}

	result := make([]models.Document, len(docs))
	for i, doc := range docs {
		result[i] = *s.convertToDocumentModel(doc)
	}

	return result, nil
}

func (s *DocumentService) GetDocumentsByPurchaseOrder(purchaseOrderID string) ([]models.Document, error) {
	ctx := context.Background()
	docs, err := s.db.GetDocumentsByPurchaseOrder(ctx, utils.UUIDToPgxUUID(uuid.MustParse(purchaseOrderID)))
	if err != nil {
		return nil, err
	}

	result := make([]models.Document, len(docs))
	for i, doc := range docs {
		result[i] = *s.convertToDocumentModel(doc)
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

	return s.convertToDocumentModel(doc), nil
}


// GetDocumentsByType retrieves all documents of a specific type
func (s *DocumentService) GetDocumentsByType(referenceType string) ([]models.Document, error) {
	ctx := context.Background()
	docs, err := s.db.GetDocumentsByTypeOnly(ctx, referenceType)
	if err != nil {
		return nil, err
	}

	result := make([]models.Document, len(docs))
	for i, doc := range docs {
		result[i] = *s.convertToDocumentModel(doc)
	}

	return result, nil
}

// ListDocuments retrieves all documents with optional filtering
func (s *DocumentService) ListDocuments(limit, offset int32) ([]models.Document, error) {
	ctx := context.Background()
	docs, err := s.db.ListAllDocuments(ctx, &sqlc.ListAllDocumentsParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, err
	}

	result := make([]models.Document, len(docs))
	for i, doc := range docs {
		result[i] = *s.convertToDocumentModel(doc)
	}

	return result, nil
}

// GenerateDocumentPath creates a file path based on document type and date
func GenerateDocumentPath(referenceType string, documentDate time.Time, fileName string) string {
	year := documentDate.Format("2006")
	month := documentDate.Format("01")
	return filepath.Join(referenceType, year, month, fileName)
}

// Legacy method for backward compatibility
func GenerateDocumentPathLegacy(purchaseOrderDate time.Time, fileName string) string {
	return GenerateDocumentPath("purchase_order", purchaseOrderDate, fileName)
}