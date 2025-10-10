'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Search, 
  RefreshCw, 
  ArrowLeft, 
  Package, 
  Calendar, 
  User, 
  DollarSign, 
  Package2, 
  MapPin, 
  FileText, 
  Hash, 
  Building, 
  Clock, 
  Trash2,
  Warehouse, 
  FileImage
} from 'lucide-react'
import { getStatusDisplayText } from '@/lib/utils'
import api from '@/lib/api'
import { DocumentsSection } from '@/components/documents'
import { useNotice } from '@/hooks/use-notice'
import { PurchaseOrder as GlobalPurchaseOrder, PurchaseOrderItem } from '@/lib/types'

interface PurchaseOrderDetailsDialogProps {
  order: GlobalPurchaseOrder | null
  isOpen: boolean
  onClose: () => void
  onOrderUpdated?: () => void
}

export function PurchaseOrderDetailsDialog({ 
  order, 
  isOpen, 
  onClose,
  onOrderUpdated 
}: PurchaseOrderDetailsDialogProps) {
  // Use items from the order object directly
  const items = order?.items || []
  // Documents handled by DocumentsSection
  
  // Cancel confirmation state
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)
  
  // Notice dialog
  const [NoticeDialog, notice] = useNotice()

  // No local document loading; handled by DocumentsSection

  // Format functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get file type icon
  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase()
    if (type.includes('image')) {
      return <FileImage className="w-5 h-5 text-green-500" />
  } else if (type.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-500" />
    } else {
      return <FileText className="w-5 h-5 text-gray-400" />
    }
  }

  // Check if file is viewable
  const isViewable = (fileType: string) => {
    const viewableTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'text/html', 'text/css', 'text/javascript']
    return viewableTypes.includes(fileType.toLowerCase())
  }

  // Check if purchase order can be cancelled (within 30 days)
  const canCancelPurchaseOrder = (createdDate: string) => {
    const created = new Date(createdDate)
    const now = new Date()
    const daysDifference = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
    return daysDifference <= 30
  }

  // Documents are now handled exclusively via DocumentsSection

  // Handle cancel purchase order
  const handleCancelPurchaseOrder = async () => {
    if (!order || !cancellationReason.trim()) {
      await notice({
        title: 'Reason required',
        description: 'Please provide a reason for cancellation',
        variant: 'info',
      })
      return
    }

    try {
      setIsCancelling(true)
      
      await api.post(`/purchase-orders/${order.id}/cancel`, {
        reason: cancellationReason
      })
      
      await notice({
        title: 'Purchase order cancelled',
        description: 'Purchase order cancelled successfully',
        variant: 'success',
      })
      
      setShowCancelDialog(false)
      setCancellationReason('')
      onClose()
      
      // Notify parent to refresh data
      if (onOrderUpdated) {
        onOrderUpdated()
      }
    } catch (error: any) {
      console.error('Error cancelling purchase order:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred'
      await notice({
        title: 'Cancellation failed',
        description: `Error cancelling purchase order: ${errorMessage}`,
        variant: 'warning',
      })
    } finally {
      setIsCancelling(false)
    }
  }

  const handleClose = () => {
    setShowCancelDialog(false)
    setCancellationReason('')
    onClose()
  }

  if (!order) return null

  return (
    <>
      {/* Main Order Details Dialog */}
      <Dialog open={isOpen && !showCancelDialog} onOpenChange={handleClose}>
        <DialogContent className="w-[90vw] max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="sticky top-0 bg-white z-50 border-b pb-4 mb-4 shadow-sm flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Purchase Order Details
              {order.received_date && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Received: {formatDate(order.received_date)}
                </span>
              )}
              {!order.received_date && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Not Received
                </span>
              )}
          </DialogTitle>
            <DialogDescription>
            Complete information about this purchase order and its products
            </DialogDescription>
        
            {/* Status Warning - Moved into header */}
          {order.status === 'cancelled' && (
              <div className="mt-3 bg-red-50 border-l-4 border-red-400 p-3 rounded-r">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-red-700 font-medium">This purchase order has been cancelled</p>
                    <p className="text-xs text-red-600 mt-1">No further actions can be taken on this order</p>
                    
                    {/* Show cancellation details if available */}
                    {(order.cancelled_by_first_name || order.cancelled_by_last_name || order.cancelled_at || order.cancellation_reason) && (
                      <div className="mt-3 pt-3 border-t border-red-200">
                        {(order.cancelled_by_first_name || order.cancelled_by_last_name) && (
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-red-500" />
                            <span className="text-xs text-red-600">
                              <span className="font-medium">Cancelled by:</span>{' '}
                              {order.cancelled_by_first_name || ''} {order.cancelled_by_last_name || ''}
                            </span>
                          </div>
                  )}
                  {order.cancelled_at && (
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-red-500" />
                            <span className="text-xs text-red-600">
                              <span className="font-medium">Cancelled on:</span>{' '}
                              {formatDateTime(order.cancelled_at)}
                            </span>
                          </div>
                  )}
                  {order.cancellation_reason && (
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-red-600">
                              <span className="font-medium">Reason:</span>{' '}
                              <span className="italic">{order.cancellation_reason}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
              </div>
            </div>
          )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto relative z-10">
            <div className="space-y-6 p-1">
          {/* Order Overview */}
          <Card>
                <CardHeader>
              <CardTitle className="text-lg">Order Overview</CardTitle>
            </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Hash className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Reference ID</p>
                        <p className="text-sm text-gray-600 font-mono">{order.po_number || 'N/A'}</p>
                  </div>
                </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Received Date</p>
                        <p className="text-sm text-gray-600">
                          {order.received_date ? formatDate(order.received_date) : 'Not received'}
                        </p>
                  </div>
                </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Purchase Date</p>
                        <p className="text-sm text-gray-600">{order.order_date ? formatDate(order.order_date) : 'N/A'}</p>
                  </div>
                </div>
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Processed By</p>
                        <p className="text-sm text-gray-600">{order.created_by_first_name && order.created_by_last_name ? `${order.created_by_first_name} ${order.created_by_last_name}` : 'Unknown'}</p>
                  </div>
                </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Created At</p>
                        <p className="text-sm text-gray-600">{formatDateTime(order.created_at)}</p>
                  </div>
                </div>
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Supplier</p>
                        <p className="text-sm text-gray-600">{order.supplier_name || 'Not specified'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Warehouse className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Warehouse</p>
                        <p className="text-sm text-gray-600">
                          {order.warehouse_name || 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-green-500" />
                        <p className="text-sm font-medium text-gray-600">Total Amount</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(order.total_amount)}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        <p className="text-sm font-medium text-gray-600">Received Date</p>
                      </div>
                      <p className="text-2xl font-bold text-gray-700">{order.received_date ? formatDate(order.received_date) : '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Products Table - load from API */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.length > 0 ? (
                          items.map((product, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{product.product_name}</TableCell>
                              <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                              <TableCell className="font-medium">{product.quantity}</TableCell>
                              <TableCell className="font-mono text-sm">{formatCurrency(product.unit_price)}</TableCell>
                              <TableCell className="font-mono text-sm font-medium">{formatCurrency(product.total_price)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                              No products found for this purchase order.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Documents Section (reusable) */}
              <DocumentsSection
                referenceType="purchase_order"
                referenceId={order.id!}
                title="Documents"
                showValidation={true}
              />

          {/* Action Buttons */}
              <div className="flex justify-between">
                <div>
                  {order && canCancelPurchaseOrder(order.created_at) && order.status !== 'cancelled' && (
                    <Button
                      variant="outline"
                      onClick={() => setShowCancelDialog(true)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Cancel Purchase Order
                    </Button>
                  )}
                </div>
                <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Purchase Order Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Cancel Purchase Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this purchase order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="cancellation-reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation <span className="text-red-500">*</span>
              </label>
              <textarea
                id="cancellation-reason"
                placeholder="Please provide a reason for cancelling this purchase order..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
              />
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start">
                <div className="w-5 h-5 text-amber-400 mt-0.5 mr-2">⚠️</div>
                <div>
                  <p className="text-sm font-medium text-amber-800">Important Note</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Purchase orders can only be cancelled within 30 days of creation. 
                    If this order is older than 30 days, please contact your administrator.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false)
                setCancellationReason('')
              }}
              disabled={isCancelling}
            >
              Keep Purchase Order
            </Button>
            <Button
              onClick={handleCancelPurchaseOrder}
              disabled={isCancelling || !cancellationReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Purchase Order'}
            </Button>
        </div>
      </DialogContent>
    </Dialog>

      {/* Notice Dialog remains for other actions */}
      {NoticeDialog}
    </>
  )
}
