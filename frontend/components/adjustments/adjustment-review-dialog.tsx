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

interface AdjustmentItem {
  product_id: string
  product_name: string
  product_sku: string
  warehouse_id: string
  warehouse_name: string
  quantity: number
  cost_price: number
  reason: string
}

interface AdjustmentReviewDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  items: AdjustmentItem[]
  processedBy: string
  adjustmentDate: string
  warehouseName: string
}

export function AdjustmentReviewDialog({
  isOpen,
  onClose,
  onConfirm,
  items,
  processedBy,
  adjustmentDate,
  warehouseName
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

        <div className="space-y-4">
          {/* Summary Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
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

          {/* Totals */}
          <div className="flex justify-end gap-6 text-sm">
            <div>
              <div className="text-gray-500">Items</div>
              <div className="font-medium text-right">{items.length}</div>
            </div>
            <div>
              <div className="text-gray-500">Total Quantity</div>
              <div className="font-medium text-right">{totalQuantity}</div>
            </div>
            <div>
              <div className="text-gray-500">Total Amount</div>
              <div className="font-semibold text-right">₱{totalAmount.toFixed(2)}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
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

