'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import { Document, DocumentCard } from './document-card'
import { DocumentUpload } from './document-upload'
import { DocumentList } from './document-list'
import { DocumentViewerDialog } from './document-viewer-dialog'
import { useNotice } from '@/hooks/use-notice'
import { useConfirm } from '@/hooks/use-confirm'
import api from '@/lib/api'

interface DocumentsSectionProps {
  referenceType: string
  referenceId: string
  title?: string
  showValidation?: boolean
  onValidate?: (document: Document) => Promise<void>
  className?: string
}

export function DocumentsSection({
  referenceType,
  referenceId,
  title = "Documents",
  showValidation = false,
  onValidate,
  className = ""
}: DocumentsSectionProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [showDocumentUpload, setShowDocumentUpload] = useState(false)
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  const [viewingDocument, setViewingDocument] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  
  const [NoticeDialog, notice] = useNotice()
  const [ConfirmDialog, confirm] = useConfirm()

  // Load documents when component mounts or reference changes
  const loadDocuments = async () => {
    if (!referenceId) return
    
    try {
      setIsLoadingDocuments(true)
      const response = await api.get(`/documents/by-reference/${referenceType}/${referenceId}`)
      setDocuments(response.data || [])
    } catch (error) {
      console.error('Error loading documents:', error)
      setDocuments([])
    } finally {
      setIsLoadingDocuments(false)
    }
  }

  // Upload documents
  const uploadDocuments = async () => {
    if (uploadedFiles.length === 0) return

    try {
      setIsUploadingDocuments(true)
      const formData = new FormData()
      
      uploadedFiles.forEach((file) => {
        formData.append('documents', file)
      })
      formData.append('reference_type', referenceType)
      formData.append('reference_id', referenceId)

      await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      await loadDocuments()
      setUploadedFiles([])
      setShowDocumentUpload(false)
      
      await notice({
        title: 'Upload complete',
        description: 'Documents uploaded successfully!',
        variant: 'success',
      })
    } catch (error) {
      console.error('Error uploading documents:', error)
      await notice({
        title: 'Upload failed',
        description: 'Error uploading documents. Please try again.',
        variant: 'warning',
      })
    } finally {
      setIsUploadingDocuments(false)
    }
  }

  // Download document
  const downloadDocument = async (document: Document) => {
    try {
      const response = await api.get(`/documents/${document.id}/download`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = window.document.createElement('a')
      link.href = url
      link.setAttribute('download', document.file_name)
      window.document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading document:', error)
      await notice({
        title: 'Download failed',
        description: 'Error downloading document. Please try again.',
        variant: 'warning',
      })
    }
  }

  // View document
  const viewDocument = async (document: Document) => {
    try {
      setViewingDocument(document.id)
      
      const viewableTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'text/html', 'text/css', 'text/javascript']
      if (!viewableTypes.includes(document.file_type.toLowerCase())) {
        await notice({
          title: 'Cannot preview file',
          description: `This file type (${document.file_type}) cannot be viewed in the browser. Please download it instead.`,
          variant: 'info',
        })
        return
      }
      
      const response = await api.get(`/documents/${document.id}/download`, {
        responseType: 'blob'
      })
      
      const blob = new Blob([response.data], { type: document.file_type })
      const url = window.URL.createObjectURL(blob)
      setDocumentUrl(url)
      
    } catch (error: any) {
      console.error('Error viewing document:', error)
      if (error.response?.status === 404) {
        await notice({
          title: 'Document not found',
          description: 'Document not found. It may have been deleted.',
          variant: 'warning',
        })
      } else if (error.response?.status === 403) {
        await notice({
          title: 'Access denied',
          description: 'You do not have permission to view this document.',
          variant: 'warning',
        })
      } else {
        await notice({
          title: 'View failed',
          description: 'Error viewing document. Please try again or download the file instead.',
          variant: 'warning',
        })
      }
      setViewingDocument(null)
    }
  }

  // Delete document
  const deleteDocument = async (document: Document) => {
    const confirmed = await confirm({
      title: 'Delete Document',
      description: `Are you sure you want to delete "${document.file_name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    })

    if (!confirmed) {
      return
    }

    try {
      await api.delete(`/documents/${document.id}`)
      setDocuments(prev => prev.filter(doc => doc.id !== document.id))
      await notice({
        title: 'Document deleted',
        description: 'Document deleted successfully',
        variant: 'success',
      })
    } catch (error) {
      console.error('Error deleting document:', error)
      await notice({
        title: 'Delete failed',
        description: 'Failed to delete document. Please try again.',
        variant: 'warning',
      })
    }
  }

  // Validate document
  const handleValidate = async (document: Document) => {
    if (!onValidate) return
    
    try {
      setIsValidating(true)
      await onValidate(document)
      await loadDocuments() // Reload to get updated validation status
    } catch (error) {
      console.error('Error validating document:', error)
      await notice({
        title: 'Validation failed',
        description: 'Failed to validate document. Please try again.',
        variant: 'warning',
      })
    } finally {
      setIsValidating(false)
    }
  }

  // Load documents on mount
  useEffect(() => {
    loadDocuments()
  }, [referenceId])

  return (
    <>
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {title}
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="space-y-4">
          {/* Upload Section and Documents List in same row when empty */}
          {documents.length === 0 && !isLoadingDocuments ? (
            <div className="flex items-center justify-between">
              <div className="mr-4">
                <DocumentUpload
                  uploadedFiles={uploadedFiles}
                  onFilesChange={setUploadedFiles}
                  onUpload={uploadDocuments}
                  isUploading={isUploadingDocuments}
                  showUploadSection={showDocumentUpload}
                  onToggleUpload={setShowDocumentUpload}
                />
              </div>
              <DocumentList
                documents={documents}
                isLoading={isLoadingDocuments}
                isValidating={isValidating}
                showValidation={showValidation}
                onValidate={handleValidate}
                onView={viewDocument}
                onDownload={downloadDocument}
                onDelete={deleteDocument}
                className="flex-1"
              />
            </div>
          ) : (
            <>
              {/* Upload Section */}
              <DocumentUpload
                uploadedFiles={uploadedFiles}
                onFilesChange={setUploadedFiles}
                onUpload={uploadDocuments}
                isUploading={isUploadingDocuments}
                showUploadSection={showDocumentUpload}
                onToggleUpload={setShowDocumentUpload}
              />

              {/* Documents List */}
              <DocumentList
                documents={documents}
                isLoading={isLoadingDocuments}
                isValidating={isValidating}
                showValidation={showValidation}
                onValidate={handleValidate}
                onView={viewDocument}
                onDownload={downloadDocument}
                onDelete={deleteDocument}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Document Viewer Dialog */}
      <DocumentViewerDialog
        isOpen={!!documentUrl}
        onOpenChange={(open) => {
          if (!open) {
            setDocumentUrl(null)
            setViewingDocument(null)
            if (documentUrl) {
              window.URL.revokeObjectURL(documentUrl)
            }
          }
        }}
        document={documents.find(doc => doc.id === viewingDocument) || null}
        documentUrl={documentUrl}
        onDownload={downloadDocument}
      />

      {/* Notice Dialog */}
      {NoticeDialog}
      
      {/* Confirm Dialog */}
      {ConfirmDialog}
    </>
  )
}
