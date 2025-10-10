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
            <div className="space-y-4 p-1">
              {/* Order Overview - Simplified Layout */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-blue-800">
                    <Package className="h-4 w-4" />
                    Order Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <div className="flex items-center gap-1 mb-1">
                        <Hash className="h-3 w-3 text-blue-600" />
                        <p className="text-xs text-gray-600">Reference</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 font-mono">{order.po_number || 'N/A'}</p>
                    </div>
                    
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <div className="flex items-center gap-1 mb-1">
                        <Calendar className="h-3 w-3 text-blue-600" />
                        <p className="text-xs text-gray-600">Purchase Date</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{order.order_date ? formatDate(order.order_date) : 'N/A'}</p>
                    </div>
                    
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <div className="flex items-center gap-1 mb-1">
                        <Calendar className="h-3 w-3 text-green-600" />
                        <p className="text-xs text-gray-600">Received</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {order.received_date ? formatDate(order.received_date) : 'Not received'}
                      </p>
                    </div>
                    
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <div className="flex items-center gap-1 mb-1">
                        <User className="h-3 w-3 text-blue-600" />
                        <p className="text-xs text-gray-600">Processed By</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {order.created_by_first_name && order.created_by_last_name ? `${order.created_by_first_name} ${order.created_by_last_name}` : 'Unknown'}
                      </p>
                    </div>
                    
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <div className="flex items-center gap-1 mb-1">
                        <Building className="h-3 w-3 text-blue-600" />
                        <p className="text-xs text-gray-600">Supplier</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{order.supplier_name || 'Not specified'}</p>
                    </div>
                    
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <div className="flex items-center gap-1 mb-1">
                        <Warehouse className="h-3 w-3 text-blue-600" />
                        <p className="text-xs text-gray-600">Warehouse</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {order.warehouse_name || 'Not specified'}
                      </p>
                    </div>
                    
                    <div className="bg-white p-2 rounded border border-blue-100 lg:col-span-2 col-span-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="h-3 w-3 text-blue-600" />
                        <p className="text-xs text-gray-600">Created At</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{formatDateTime(order.created_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Products Table - Enhanced with color scheme */}
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                    <Package2 className="h-5 w-5" />
                    Products ({items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="bg-white rounded-lg border border-green-100 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-green-50">
                        <TableRow>
                          <TableHead className="font-semibold text-green-800">Product</TableHead>
                          <TableHead className="font-semibold text-green-800">SKU</TableHead>
                          <TableHead className="font-semibold text-green-800 text-center">Quantity</TableHead>
                          <TableHead className="font-semibold text-green-800 text-right">Unit Price</TableHead>
                          <TableHead className="font-semibold text-green-800 text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.length > 0 ? (
                          items.map((product, index) => (
                            <TableRow key={index} className="hover:bg-green-25 transition-colors">
                              <TableCell className="font-medium text-gray-900">{product.product_name}</TableCell>
                              <TableCell className="font-mono text-sm text-gray-600">{product.sku}</TableCell>
                              <TableCell className="text-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {product.quantity}
                                </span>
                              </TableCell>
                              <TableCell className="font-mono text-sm text-gray-700 text-right">{formatCurrency(product.unit_price)}</TableCell>
                              <TableCell className="font-mono text-sm font-semibold text-gray-900 text-right">{formatCurrency(product.total_price)}</TableCell>
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
                  
                  {/* Total Amount - Moved below products */}
                  {items.length > 0 && (
                    <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium text-gray-600">Total Amount</span>
                        </div>
                        <span className="text-2xl font-bold text-blue-700">
                          {formatCurrency(items.reduce((sum, item) => sum + item.total_price, 0))}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Documents Section (reusable) - Enhanced styling */}
              <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-purple-800">
                    <FileText className="h-5 w-5" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="bg-white rounded-lg border border-purple-100">
                    <DocumentsSection
                      referenceType="purchase_order"
                      referenceId={order.id!}
                      title=""
                      showValidation={true}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons - Enhanced styling */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div>
                  {order && canCancelPurchaseOrder(order.created_at) && order.status !== 'cancelled' && (
                    <Button
                      variant="outline"
                      onClick={() => setShowCancelDialog(true)}
                      className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Cancel Purchase Order
                    </Button>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                  className="px-6 py-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
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
