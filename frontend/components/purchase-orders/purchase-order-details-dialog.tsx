import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Building2, Calendar, User, DollarSign, X, AlertCircle, Hash, Package, FileText as FileTextIcon } from 'lucide-react'
import { PurchaseOrder } from '@/lib/types'
import { formatDate, getStatusColor } from '@/lib/utils'

interface PurchaseOrderDetailsDialogProps {
  order: PurchaseOrder | null
  isOpen: boolean
  onClose: () => void
}

export function PurchaseOrderDetailsDialog({ order, isOpen, onClose }: PurchaseOrderDetailsDialogProps) {
  if (!order) return null
  
  // FORCE ALERT TO TEST IF COMPONENT IS BEING CALLED
  alert(`🚨 CACHE TEST - PurchaseOrderDetailsDialog called at ${new Date().toLocaleTimeString()}! Status: ${order.status}, Cancelled At: ${order.cancelled_at}`)
  
  // Debug logging - using alert for immediate visibility
  console.log('=== PurchaseOrderDetailsDialog RENDERED ===')
  console.log('PurchaseOrderDetailsDialog - order data:', order)
  console.log('PurchaseOrderDetailsDialog - cancelled_at:', order.cancelled_at)
  console.log('PurchaseOrderDetailsDialog - cancelled_by_first_name:', order.cancelled_by_first_name)
  console.log('PurchaseOrderDetailsDialog - cancelled_by_last_name:', order.cancelled_by_last_name)
  console.log('PurchaseOrderDetailsDialog - cancellation_reason:', order.cancellation_reason)
  console.log('=== END DEBUG ===')
  
  // Also show an alert to make sure this component is being called
  if (order.status === 'cancelled') {
    console.log('🚨 CANCELLED ORDER DETECTED 🚨')
    console.log('Cancelled at:', order.cancelled_at)
    console.log('Cancelled by:', order.cancelled_by_first_name, order.cancelled_by_last_name)
    console.log('Reason:', order.cancellation_reason)
    
    // Specific alert for cancelled_at details
    alert(`CANCELLED ORDER DETAILS:
Status: ${order.status}
Cancelled At: ${order.cancelled_at || 'NOT FOUND'}
Cancelled By: ${order.cancelled_by_first_name || 'N/A'} ${order.cancelled_by_last_name || 'N/A'}
Reason: ${order.cancellation_reason || 'N/A'}
Full Order Data: ${JSON.stringify(order, null, 2)}`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Purchase Order Details
            </span>
            <Badge className={getStatusColor(order.status)}>
              {order.status.toUpperCase()}
            </Badge>
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Complete information about this purchase order and its products
          </p>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Cancellation Banner */}
          {order.status === 'cancelled' && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <X className="h-5 w-5 text-red-600" />
                <div>
                  <h3 className="text-sm font-semibold text-red-800">🚨 TESTING CACHE ISSUE - Thisasdad purchase order has been cancelled 🚨</h3>
                  <p className="text-sm text-red-600 mt-1">No further actions can be taken on this order.</p>
                  {order.cancelled_by_first_name && order.cancelled_by_last_name && (
                    <p className="text-xs text-red-600 mt-1">
                      Cancelled by: {order.cancelled_by_first_name} {order.cancelled_by_last_name}
                    </p>
                  )}
                  {order.cancelled_at && (
                    <p className="text-xs text-red-600">
                      Cancelled on: {formatDate(order.cancelled_at)}
                    </p>
                  )}
                  {order.cancellation_reason && (
                    <p className="text-xs text-red-600">
                      Reason: {order.cancellation_reason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Order Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Order Overview</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-gray-700">PO Number: </span>
                    <span className="text-sm text-gray-900 font-mono">{order.po_number}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-gray-700">Order Date: </span>
                    <span className="text-sm text-gray-900">{formatDate(order.order_date)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-gray-700">Supplier: </span>
                    <span className="text-sm text-gray-900">{order.supplier_name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-gray-700">Created By: </span>
                    <span className="text-sm text-gray-900">{order.created_by_first_name} {order.created_by_last_name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-gray-700">Total Amount: </span>
                    <span className="text-sm text-gray-900 font-semibold">${order.total_amount.toFixed(2)}</span>
                  </div>
                </div>
                {order.expected_delivery_date && (
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-gray-700">Expected Delivery: </span>
                      <span className="text-sm text-gray-900">{formatDate(order.expected_delivery_date)}</span>
                    </div>
                  </div>
                )}
                {order.received_date && (
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-gray-700">Received Date: </span>
                      <span className="text-sm text-gray-900">{formatDate(order.received_date)}</span>
                    </div>
                  </div>
                )}
                {order.supplier_contact && (
                  <div className="flex items-center gap-2 md:col-span-2">
                    <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-gray-700">Supplier Contact: </span>
                      <span className="text-sm text-gray-900">{order.supplier_contact}</span>
                    </div>
                  </div>
                )}
                {order.notes && (
                  <div className="flex items-center gap-2 md:col-span-2">
                    <FileTextIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-gray-700">Notes: </span>
                      <span className="text-sm text-gray-900">{order.notes}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
