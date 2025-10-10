# Reusable Document Components

This directory contains reusable document management components that can be used across different pages in the application.

## Components

### 1. DocumentsSection
A complete document management section that includes upload, list, view, and delete functionality.

**Usage:**
```tsx
import { DocumentsSection } from '@/components/documents'

function MyPage() {
  return (
    <DocumentsSection
      referenceType="purchase_order"
      referenceId="order-123"
      title="Purchase Order Documents"
      showValidation={true}
      onValidate={async (document) => {
        // Custom validation logic
        await validateDocument(document)
      }}
    />
  )
}
```

### 2. DocumentCard
Individual document card with actions (view, download, delete, validate).

**Usage:**
```tsx
import { DocumentCard, Document } from '@/components/documents'

function MyComponent() {
  const handleView = (document: Document) => {
    // View document logic
  }

  return (
    <DocumentCard
      document={document}
      onView={handleView}
      onDownload={handleDownload}
      onDelete={handleDelete}
      showValidation={true}
      onValidate={handleValidate}
    />
  )
}
```

### 3. DocumentUpload
File upload component with validation and progress.

**Usage:**
```tsx
import { DocumentUpload } from '@/components/documents'

function MyComponent() {
  const [files, setFiles] = useState<File[]>([])
  
  return (
    <DocumentUpload
      uploadedFiles={files}
      onFilesChange={setFiles}
      onUpload={handleUpload}
      isUploading={isUploading}
      showUploadSection={showUpload}
      onToggleUpload={setShowUpload}
      maxFiles={5}
      maxFileSize={10 * 1024 * 1024} // 10MB
    />
  )
}
```

### 4. DocumentList
List of documents with loading and empty states.

**Usage:**
```tsx
import { DocumentList } from '@/components/documents'

function MyComponent() {
  return (
    <DocumentList
      documents={documents}
      isLoading={loading}
      onView={handleView}
      onDownload={handleDownload}
      onDelete={handleDelete}
      emptyStateTitle="No documents found"
      emptyStateDescription="Upload some documents to get started"
    />
  )
}
```

### 5. DocumentViewerDialog
Modal dialog for viewing documents (images, PDFs).

**Usage:**
```tsx
import { DocumentViewerDialog } from '@/components/documents'

function MyComponent() {
  return (
    <DocumentViewerDialog
      isOpen={isViewerOpen}
      onOpenChange={setIsViewerOpen}
      document={selectedDocument}
      documentUrl={documentUrl}
      onDownload={handleDownload}
    />
  )
}
```

## Features

- **File Upload**: Drag & drop, file validation, progress indicators
- **Document Viewing**: In-browser preview for images and PDFs
- **Document Management**: View, download, delete operations
- **Validation**: Optional document validation with status indicators
- **Responsive Design**: Works on all screen sizes
- **Error Handling**: Comprehensive error handling with user feedback
- **TypeScript**: Full TypeScript support with proper types

## Props

### DocumentsSection
- `referenceType`: string - Type of reference (e.g., "purchase_order", "adjustment")
- `referenceId`: string - ID of the reference entity
- `title`: string - Section title (default: "Documents")
- `showValidation`: boolean - Show validation features (default: false)
- `onValidate`: function - Custom validation handler
- `className`: string - Additional CSS classes

### DocumentCard
- `document`: Document - Document object
- `isValidating`: boolean - Is validation in progress
- `showValidation`: boolean - Show validation UI
- `onValidate`: function - Validation handler
- `onView`: function - View document handler
- `onDownload`: function - Download document handler
- `onOpenInNewTab`: function - Open in new tab handler
- `onDelete`: function - Delete document handler
- `className`: string - Additional CSS classes

### DocumentUpload
- `uploadedFiles`: File[] - Currently selected files
- `onFilesChange`: function - File selection handler
- `onUpload`: function - Upload handler
- `isUploading`: boolean - Upload in progress
- `showUploadSection`: boolean - Show upload UI
- `onToggleUpload`: function - Toggle upload section
- `accept`: string - Accepted file types (default: ".pdf,.png,.jpg,.jpeg")
- `maxFiles`: number - Maximum files allowed (default: 10)
- `maxFileSize`: number - Maximum file size in bytes (default: 10MB)
- `className`: string - Additional CSS classes

## Integration Examples

### Purchase Order Page
```tsx
<DocumentsSection
  referenceType="purchase_order"
  referenceId={order.id}
  title="Purchase Order Documents"
  showValidation={true}
  onValidate={validatePurchaseOrderDocument}
/>
```

### Adjustment Page
```tsx
<DocumentsSection
  referenceType="adjustment"
  referenceId={adjustment.id}
  title="Adjustment Documents"
/>
```

### Custom Implementation
```tsx
const [documents, setDocuments] = useState<Document[]>([])
const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

return (
  <div>
    <DocumentUpload
      uploadedFiles={uploadedFiles}
      onFilesChange={setUploadedFiles}
      onUpload={handleUpload}
      isUploading={isUploading}
      showUploadSection={showUpload}
      onToggleUpload={setShowUpload}
    />
    <DocumentList
      documents={documents}
      onView={handleView}
      onDownload={handleDownload}
      onDelete={handleDelete}
    />
  </div>
)
```
