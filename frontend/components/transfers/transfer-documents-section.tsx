'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UnifiedDocumentUpload } from '@/components/documents/unified-document-upload'

interface TransferDocumentsSectionProps {
  uploadedFiles: File[]
  onFilesChange: (files: File[]) => void
}

export function TransferDocumentsSection({
  uploadedFiles,
  onFilesChange
}: TransferDocumentsSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Supporting Documents (Optional)</CardTitle>
      </CardHeader>
      <CardContent>
        <UnifiedDocumentUpload
          referenceType="transfer"
          referenceId=""
          title=""
          onFilesChange={onFilesChange}
          tabIndex={9}
        />
      </CardContent>
    </Card>
  )
}
