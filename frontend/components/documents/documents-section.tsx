'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import { Document, DocumentCard } from './document-card'
import { DocumentUpload } from './document-upload'
import { DocumentList } from './document-list'
import { DocumentViewerDialog } from './document-viewer-dialog'
import { UnifiedDocumentUpload } from './unified-document-upload'
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
  return (
    <UnifiedDocumentUpload
      referenceType={referenceType}
      referenceId={referenceId}
      title={title}
      showDownload={true}
      showDelete={false}
      className={className}
    />
  )
}
