import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Building2, Calendar, User, Eye, AlertCircle, X } from 'lucide-react'
import { PurchaseOrder } from '@/lib/types'
import { formatDate, getStatusColor } from '@/lib/utils'

interface PurchaseOrderCardProps {
  order: PurchaseOrder
  onViewDetails: (order: PurchaseOrder) => void
}

export function PurchaseOrderCard({ 
  order, 
  onViewDetails 
}: PurchaseOrderCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      {/* Cancellation Banner */}
      {order.status === 'cancelled' && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex items-center gap-3">
            <X className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-sm font-semibold text-red-800">This purchase order has been cancelled</h3>
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
                {order.created_by_first_name} {order.created_by_last_name}
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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onViewDetails(order)}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Details
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onViewDetails(order)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Documents
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
