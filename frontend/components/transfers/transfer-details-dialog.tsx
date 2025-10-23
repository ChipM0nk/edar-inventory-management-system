'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowRightLeft, AlertCircle, Hash, Calendar, User, FileText, Package } from 'lucide-react'
import api from '@/lib/api'

interface TransferItem {
  product_id: string
  product_name: string
  product_sku: string
  quantity: number
}

interface Transfer {
  id: string
  reference_id: string
  total_quantity: number
  processed_by: string
  processed_date: string
  created_at: string
  status: string
  from_warehouse_name: string
  to_warehouse_name: string
  reason: string
  items: TransferItem[]
}

interface TransferDetailsDialogProps {
  isOpen: boolean
  onClose: () => void
  transfer: Transfer | null
  onTransferUpdate: () => void
}

export function TransferDetailsDialog({
  isOpen,
  onClose,
  transfer,
  onTransferUpdate
}: TransferDetailsDialogProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleCancelTransfer = () => {
    setShowCancelDialog(true)
  }

  const confirmCancelTransfer = async () => {
    if (!transfer) return

    try {
      setIsCancelling(true)
      await api.put(`/transfers/${transfer.id}/status`, {
        status: 'cancelled'
      })
      
      // Reload transfers to get updated data
      await onTransferUpdate()
      
      setShowCancelDialog(false)
      onClose()
    } catch (error) {
      console.error('Error cancelling transfer:', error)
      // You might want to show an error message here
    } finally {
      setIsCancelling(false)
    }
  }

  if (!transfer) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Transfer Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this warehouse transfer
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Cancellation Banner */}
            {transfer.status === 'cancelled' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <h3 className="text-sm font-semibold text-red-800">This transfer has been cancelled</h3>
                    <p className="text-sm text-red-600 mt-1">No further actions can be taken on this transfer.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Transfer Overview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Transfer Overview</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-gray-700">Reference: </span>
                      <span className="text-sm text-gray-900">{transfer.reference_id}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-gray-700">Date: </span>
                      <span className="text-sm text-gray-900">{formatDate(transfer.processed_date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-gray-700">Processed By: </span>
                      <span className="text-sm text-gray-900">{transfer.processed_by}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-gray-700">Reason: </span>
                      <span className="text-sm text-gray-900">{transfer.reason || 'No reason provided'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:col-span-2">
                    <Package className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-gray-700">From: </span>
                      <span className="text-sm text-gray-900">{transfer.from_warehouse_name}</span>
                      <span className="mx-2 text-gray-400">→</span>
                      <span className="text-sm font-medium text-gray-700">To: </span>
                      <span className="text-sm text-gray-900">{transfer.to_warehouse_name}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transfer Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transfer Items</CardTitle>
                <CardDescription>
                  Complete list of items in this transfer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Quantity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transfer.items.map((item, index) => (
                        <TableRow key={`${item.product_id}-${index}`}>
                          <TableCell className="font-medium">
                            {item.product_name}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {item.product_sku}
                          </TableCell>
                          <TableCell className="font-medium text-blue-600">
                            {item.quantity}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between gap-3">
              {transfer.status !== 'cancelled' && (
                <Button 
                  variant="destructive" 
                  onClick={handleCancelTransfer}
                  className="flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  Cancel Transfer
                </Button>
              )}
              <div className="flex gap-3 ml-auto">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Transfer Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Cancel Transfer
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this transfer? This action will:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <ul className="text-sm text-red-800 space-y-2">
                <li>• Reverse all stock movements</li>
                <li>• Return items to source warehouse</li>
                <li>• Remove items from destination warehouse</li>
                <li>• Mark transfer as cancelled</li>
              </ul>
            </div>
            
            <div className="text-sm text-gray-600">
              <p><strong>Transfer:</strong> {transfer.reference_id}</p>
              <p><strong>Items:</strong> {transfer.items.length} product{transfer.items.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={isCancelling}>
              Keep Transfer
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmCancelTransfer}
              disabled={isCancelling}
              className="flex items-center gap-2"
            >
              {isCancelling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Cancelling...
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4" />
                  Cancel Transfer
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
