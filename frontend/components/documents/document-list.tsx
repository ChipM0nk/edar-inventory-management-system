'use client'

import { Document, DocumentCard } from './document-card'
import { FileText } from 'lucide-react'

interface DocumentListProps {
  documents: Document[]
  isLoading?: boolean
  isValidating?: boolean
  showValidation?: boolean
  onValidate?: (document: Document) => void
  onView: (document: Document) => void
  onDownload: (document: Document) => void
  onOpenInNewTab?: (document: Document) => void
  onDelete: (document: Document) => void
  emptyStateTitle?: string
  emptyStateDescription?: string
  className?: string
}

export function DocumentList({
  documents,
  isLoading = false,
  isValidating = false,
  showValidation = false,
  onValidate,
  onView,
  onDownload,
  onOpenInNewTab,
  onDelete,
  emptyStateTitle = "No documents uploaded yet",
  emptyStateDescription = "Click 'Add Documents' to upload supporting files",
  className = ""
}: DocumentListProps) {
  if (isLoading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading documents...</p>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>{emptyStateTitle}</p>
        <p className="text-sm">{emptyStateDescription}</p>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {documents.map((document) => (
        <div key={document.id} className="relative">
          <DocumentCard
            document={document}
            isValidating={isValidating}
            showValidation={showValidation}
            onValidate={onValidate}
            onView={onView}
            onDownload={onDownload}
            onOpenInNewTab={onOpenInNewTab}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  )
}
