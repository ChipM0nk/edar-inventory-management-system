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
import { FileText, Package, Package2 } from 'lucide-react'

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
  selectedWarehouse: any
  reference?: string
  notes?: string
  uploadedFiles?: File[]
  externalReference?: string
}

export function AdjustmentReviewDialog({
  isOpen,
  onClose,
  onConfirm,
  items,
  processedBy,
  adjustmentDate,
  selectedWarehouse,
  reference,
  notes,
  uploadedFiles = [],
  externalReference
}: AdjustmentReviewDialogProps) {
  const totalQuantity = items.reduce((sum, item) => sum + Math.abs(item.quantity), 0)
  const totalAmount = items.reduce((sum, item) => sum + (Math.abs(item.quantity) * item.cost_price), 0)
  
  // Convert uploaded files to document format
  const documents: Document[] = uploadedFiles.map((file, index) => ({
    id: `temp-${index}`,
    name: file.name,
    size: file.size,
    type: file.type
  }))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-5xl max-h-[85vh] overflow-hidden flex flex-col [&>button]:hidden">
        <DialogHeader className="sticky top-0 bg-white z-50 border-b border-gray-300 pb-4 mb-4 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                Review Adjustment
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Confirm the details below before creating the transaction.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
          <div className="space-y-8 p-1">
            {/* Adjustment Overview */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 border-b border-gray-200 pb-1">
                <Package className="h-5 w-5" />
                Adjustment Overview
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-gray-600 font-bold w-32">Processed By</span>
                    <span className="text-gray-900 ml-2">: {processedBy}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 font-bold w-32">Adjustment Date</span>
                    <span className="text-gray-900 ml-2">: {adjustmentDate}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 font-bold w-32">Warehouse</span>
                    <span className="text-gray-900 ml-2">: {selectedWarehouse?.name || 'Not specified'}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-gray-600 font-bold w-32 whitespace-nowrap">External Reference</span>
                    <span className="text-gray-900 ml-2">: {externalReference || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 font-bold w-32">Total Items</span>
                    <span className="text-gray-900 ml-2">: {items.length}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 font-bold w-32">Total Quantity</span>
                    <span className="text-gray-900 ml-2">: {totalQuantity}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Table */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                <Package2 className="h-5 w-5" />
                Products ({items.length})
              </div>
              <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader className="bg-gray-100">
                    <TableRow className="border-b border-gray-300">
                      <TableHead className="font-semibold text-gray-900 text-left py-3 px-4 text-sm">Product Name</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-left py-3 px-4 text-sm">SKU</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-center py-3 px-4 text-sm">Qty</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right py-3 px-4 text-sm">Unit Cost</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right py-3 px-4 text-sm">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow 
                        key={`${item.product_id}-${index}`} 
                        className={`border-b border-gray-200 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <TableCell className="py-3 px-4 text-sm">
                          <span className="font-medium text-gray-900">
                            {item.product_name}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-sm">
                          <span className="font-mono text-gray-600">
                            {item.product_sku}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center text-sm">
                          <span className={`font-medium ${item.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right text-sm">
                          <span className="font-mono text-gray-900">
                            ₱{item.cost_price.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right text-sm">
                          <span className="font-mono font-semibold text-gray-900">
                            ₱{(Math.abs(item.quantity) * item.cost_price).toFixed(2)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Total Amount */}
                <div className="bg-white border-t border-gray-300 px-4 py-3">
                  <div className="flex justify-end">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600">Total Amount:</span>
                      <span className="text-lg font-bold text-gray-900">
                        ₱{totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {notes && (
              <div className="flex items-center gap-2 text-sm mt-1">
                <span className="text-red-600 font-semibold">NOTE:</span>
                <span className="text-gray-700">
                  {notes}
                </span>
              </div>
            )}

            {/* Documents Section */}
            {documents.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-base font-semibold text-gray-900 border-b border-gray-200 pb-1">
                  <FileText className="h-4 w-4" />
                  Documents ({documents.length})
                </div>
                <div className="border border-gray-200 rounded p-3">
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
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center items-center pt-6 border-t border-gray-300 bg-gray-50 -mx-6 px-6 py-4">
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="px-6 py-2"
                >
                  Back
                </Button>
                <Button 
                  className="bg-[#52a852] hover:bg-[#4a964a] text-white px-6 py-2" 
                  onClick={onConfirm}
                >
                  Confirm & Create
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

