import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PurchaseOrder, Document } from '@/lib/types'
import { DocumentCard } from './document-card'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'

interface DocumentsDialogProps {
  order: PurchaseOrder
  documents: Document[]
  isLoadingDocs: boolean
  isValidating: boolean
  onValidateDocument: (document: Document, poNumber: string, orderDate: string) => void
  onViewDocument: (document: Document) => void
  onDownloadDocument: (document: Document) => void
  onOpenDocumentInNewTab: (document: Document) => void
  onDeleteDocument: (document: Document) => void
  children: React.ReactNode
}

export function DocumentsDialog({
  order,
  documents,
  isLoadingDocs,
  isValidating,
  onValidateDocument,
  onViewDocument,
  onDownloadDocument,
  onOpenDocumentInNewTab,
  onDeleteDocument,
  children
}: DocumentsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Documents for {order.po_number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isLoadingDocs ? (
            <LoadingSpinner text="Loading documents..." />
          ) : documents.length === 0 ? (
            <EmptyState 
              title="No documents found for this purchase order"
            />
          ) : (
            <div className="grid gap-4">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  order={order}
                  isValidating={isValidating}
                  onValidate={onValidateDocument}
                  onView={onViewDocument}
                  onDownload={onDownloadDocument}
                  onOpenInNewTab={onOpenDocumentInNewTab}
                  onDelete={onDeleteDocument}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
