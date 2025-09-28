import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Building2, Calendar, User, Eye } from 'lucide-react'
import { PurchaseOrder } from '@/lib/types'
import { formatDate, getStatusColor } from '@/lib/utils'
import { DocumentsDialog } from './documents-dialog'

interface PurchaseOrderCardProps {
  order: PurchaseOrder
  documents: any[]
  isLoadingDocs: boolean
  isValidating: boolean
  onViewDocuments: (order: PurchaseOrder) => void
  onValidateDocument: (document: any, poNumber: string, orderDate: string) => void
  onViewDocument: (document: any) => void
  onDownloadDocument: (document: any) => void
  onOpenDocumentInNewTab: (document: any) => void
  onDeleteDocument: (document: any) => void
}

export function PurchaseOrderCard({ 
  order, 
  documents, 
  isLoadingDocs, 
  isValidating, 
  onViewDocuments, 
  onValidateDocument, 
  onViewDocument, 
  onDownloadDocument, 
  onOpenDocumentInNewTab,
  onDeleteDocument
}: PurchaseOrderCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {order.po_number}
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {order.supplier_name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(order.order_date)}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {order.first_name} {order.last_name}
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(order.status)}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
            <span className="text-lg font-semibold text-gray-900">
              ${order.total_amount.toFixed(2)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {order.supplier_contact && (
              <p>Contact: {order.supplier_contact}</p>
            )}
            {order.expected_delivery_date && (
              <p>Expected Delivery: {formatDate(order.expected_delivery_date)}</p>
            )}
            {order.notes && (
              <p className="mt-1">Notes: {order.notes}</p>
            )}
          </div>
          <DocumentsDialog
            order={order}
            documents={documents}
            isLoadingDocs={isLoadingDocs}
            isValidating={isValidating}
            onValidateDocument={onValidateDocument}
            onViewDocument={onViewDocument}
            onDownloadDocument={onDownloadDocument}
            onOpenDocumentInNewTab={onOpenDocumentInNewTab}
            onDeleteDocument={onDeleteDocument}
          >
            <Button 
              variant="outline" 
              onClick={() => onViewDocuments(order)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Documents
            </Button>
          </DocumentsDialog>
        </div>
      </CardContent>
    </Card>
  )
}
