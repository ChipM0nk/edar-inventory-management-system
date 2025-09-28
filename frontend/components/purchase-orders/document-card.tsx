import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, Download, ExternalLink, RefreshCw, AlertTriangle, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import { Document, PurchaseOrder } from '@/lib/types'
import { formatDate, formatFileSize, getValidationStatusColor, getValidationIcon } from '@/lib/utils'

interface DocumentCardProps {
  document: Document
  order: PurchaseOrder
  isValidating: boolean
  onValidate: (document: Document, poNumber: string, orderDate: string) => void
  onView: (document: Document) => void
  onDownload: (document: Document) => void
  onOpenInNewTab: (document: Document) => void
  onDelete: (document: Document) => void
}

export function DocumentCard({ 
  document, 
  order, 
  isValidating, 
  onValidate, 
  onView, 
  onDownload, 
  onOpenInNewTab,
  onDelete
}: DocumentCardProps) {
  const getValidationIconComponent = (status?: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'failed':
      case 'error':
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900">{document.file_name}</h4>
              {document.validation_status && (
                <Badge className={`${getValidationStatusColor(document.validation_status)} flex items-center gap-1`}>
                  {getValidationIconComponent(document.validation_status)}
                  {document.validation_status}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
              <span>{document.file_type}</span>
              <span>{formatFileSize(document.file_size)}</span>
              <span>{formatDate(document.uploaded_at)}</span>
            </div>
          </div>
        </div>
        
        {/* Validation Status and Warnings */}
        {document.validation_status && document.validation_status !== 'pending' && (
          <div className="space-y-2">
            {document.validation_status === 'warning' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> {document.validation_notes}
                </AlertDescription>
              </Alert>
            )}
            {document.validation_status === 'failed' && (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Validation Failed:</strong> {document.validation_notes}
                </AlertDescription>
              </Alert>
            )}
            {document.validation_status === 'valid' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Validated:</strong> {document.validation_notes}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-2">
          {document.validation_status === 'pending' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onValidate(document, order.po_number, order.order_date)}
              disabled={isValidating}
            >
              {isValidating ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Validate
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(document)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenInNewTab(document)}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Open
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDownload(document)}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(document)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  )
}
