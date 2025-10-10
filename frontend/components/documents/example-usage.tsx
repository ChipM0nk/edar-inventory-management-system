/**
 * Example usage of the reusable document components
 * This file shows how to integrate the document components into different pages
 */

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DocumentsSection, DocumentUpload, DocumentList, DocumentCard } from './index'

// Example 1: Complete DocumentsSection (recommended for most use cases)
export function PurchaseOrderPageExample({ orderId }: { orderId: string }) {
  return (
    <div className="space-y-6">
      {/* Purchase order details */}
      <div>Purchase order content...</div>
      
      {/* Documents section - handles everything automatically */}
      <DocumentsSection
        referenceType="purchase_order"
        referenceId={orderId}
        title="Purchase Order Documents"
        showValidation={true}
        onValidate={async (document) => {
          // Custom validation logic
          console.log('Validating document:', document.file_name)
          // Call your validation API
        }}
      />
    </div>
  )
}

// Example 2: Adjustment page with documents
export function AdjustmentPageExample({ adjustmentId }: { adjustmentId: string }) {
  return (
    <div className="space-y-6">
      {/* Adjustment details */}
      <div>Adjustment content...</div>
      
      {/* Documents section for adjustments */}
      <DocumentsSection
        referenceType="adjustment"
        referenceId={adjustmentId}
        title="Adjustment Documents"
        showValidation={false}
      />
    </div>
  )
}

// Example 3: Custom implementation with individual components
export function CustomDocumentPageExample({ entityId }: { entityId: string }) {
  // You would manage state in your parent component
  const [documents, setDocuments] = useState([])
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  const handleUpload = async () => {
    // Your custom upload logic
    setIsUploading(true)
    try {
      // Upload files...
      console.log('Uploading files:', uploadedFiles)
      // Refresh documents list
    } finally {
      setIsUploading(false)
    }
  }

  const handleView = (document: any) => {
    // Your custom view logic
    console.log('Viewing document:', document.file_name)
  }

  const handleDownload = (document: any) => {
    // Your custom download logic
    console.log('Downloading document:', document.file_name)
  }

  const handleDelete = (document: any) => {
    // Your custom delete logic
    console.log('Deleting document:', document.file_name)
  }

  return (
    <div className="space-y-6">
      {/* Custom upload section */}
      <DocumentUpload
        uploadedFiles={uploadedFiles}
        onFilesChange={setUploadedFiles}
        onUpload={handleUpload}
        isUploading={isUploading}
        showUploadSection={showUpload}
        onToggleUpload={setShowUpload}
        maxFiles={5}
        maxFileSize={5 * 1024 * 1024} // 5MB
      />

      {/* Custom documents list */}
      <DocumentList
        documents={documents}
        isLoading={false}
        onView={handleView}
        onDownload={handleDownload}
        onDelete={handleDelete}
        emptyStateTitle="No documents yet"
        emptyStateDescription="Upload some files to get started"
      />
    </div>
  )
}

// Example 4: Modal dialog with documents
export function ModalWithDocumentsExample({ 
  isOpen, 
  onClose, 
  entityId 
}: { 
  isOpen: boolean
  onClose: () => void
  entityId: string 
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Entity Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Entity details */}
          <div>Entity content...</div>
          
          {/* Documents section in modal */}
          <DocumentsSection
            referenceType="entity"
            referenceId={entityId}
            title="Related Documents"
            className="border-0 shadow-none"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Example 5: Integration with existing pages
export function ExistingPageIntegrationExample() {
  // If you have an existing page with document functionality,
  // you can gradually migrate by replacing sections:

  return (
    <div className="space-y-6">
      {/* Existing content */}
      <div>Your existing page content...</div>
      
      {/* Replace your existing document section with this: */}
      <DocumentsSection
        referenceType="your_entity_type"
        referenceId="your_entity_id"
        title="Your Documents"
        showValidation={true}
        onValidate={async (document) => {
          // Your existing validation logic
          await yourValidationFunction(document)
        }}
      />
      
      {/* More existing content */}
      <div>More existing content...</div>
    </div>
  )
}
