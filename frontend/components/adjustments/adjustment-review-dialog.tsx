'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText } from 'lucide-react'

interface AdjustmentItem {
  product_id: string
  product_name: string
  product_sku: string
  quantity: number
  cost_price: number
  reason: string
}

interface Document {
  id: string
  name: string
  size: number
  type: string
}

interface AdjustmentReviewDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  items: AdjustmentItem[]
  processedBy: string
  adjustmentDate: string
  warehouseName: string
  reference?: string
  notes?: string
  documents?: Document[]
}

export function AdjustmentReviewDialog({
  isOpen,
  onClose,
  onConfirm,
  items,
  processedBy,
  adjustmentDate,
  warehouseName,
  reference,
  notes,
  documents = []
}: AdjustmentReviewDialogProps) {
  const totalQuantity = items.reduce((sum, item) => sum + Math.abs(item.quantity), 0)
  const totalAmount = items.reduce((sum, item) => sum + (Math.abs(item.quantity) * item.cost_price), 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Review Adjustment</DialogTitle>
          <DialogDescription>
            Confirm the details below before creating the transaction.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Processed By</div>
              <div className="font-medium">{processedBy}</div>
            </div>
            <div>
              <div className="text-gray-500">Adjustment Date</div>
              <div className="font-medium">{adjustmentDate}</div>
            </div>
            <div>
              <div className="text-gray-500">Warehouse</div>
              <div className="font-medium">{warehouseName || '—'}</div>
            </div>
            <div>
              <div className="text-gray-500">External Reference</div>
              <div className="font-medium">{reference || '—'}</div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={`${item.product_id}-${idx}`}>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell className="font-mono text-sm">{item.product_sku}</TableCell>
                    <TableCell className={`text-right ${item.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">₱{item.cost_price.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      ₱{(Math.abs(item.quantity) * item.cost_price).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Notes Section */}
          {notes && (
            <div className="flex items-center gap-2 text-sm py-2">
              <span className="text-red-600 font-semibold">NOTE:</span>
              <span className="text-gray-700">
                {notes}
              </span>
            </div>
          )}

          {/* Documents Section */}
          {documents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <FileText className="h-4 w-4" />
                Documents ({documents.length})
              </div>
              <div className="space-y-2">
                {documents.map((doc, index) => (
                  <div key={doc.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500">
                          {(doc.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Back
            </Button>
            <Button 
              className="bg-[#52a852] hover:bg-[#4a964a] text-white" 
              onClick={onConfirm}
            >
              Confirm & Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

