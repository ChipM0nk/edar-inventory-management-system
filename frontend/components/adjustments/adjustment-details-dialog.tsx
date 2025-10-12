'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  AlertTriangle,
  Calendar,
  User,
  Hash,
  FileText,
  Trash2
} from 'lucide-react'
import api from '@/lib/api'
import { useNotice } from '@/hooks/use-notice'
import { DocumentsSection } from '@/components/documents'

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


interface Adjustment {
  id: string
  reference_id: string
  total_quantity: number
  processed_by: string
  processed_date: string
  created_at: string
  items: AdjustmentItem[]
  status?: string
  notes?: string | null
}

interface AdjustmentDetailsDialogProps {
  adjustment: Adjustment | null
  isOpen: boolean
  onClose: () => void
  onOrderUpdated?: () => void // Callback to refresh parent data
}

export function AdjustmentDetailsDialog({ 
  adjustment,
  isOpen, 
  onClose,
  onOrderUpdated
}: AdjustmentDetailsDialogProps) {
  const [NoticeDialog, notice] = useNotice()
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [fullAdjustment, setFullAdjustment] = useState<Adjustment | null>(null)
  
  // Cancel functionality state
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  // Load adjustment details when dialog opens
  useEffect(() => {
    if (isOpen && adjustment) {
      loadAdjustmentDetails()
    }
  }, [isOpen, adjustment])

  const loadAdjustmentDetails = async () => {
    if (!adjustment) return
    
    setIsLoadingDetails(true)
    setDetailsError(null)
    
    try {
      const response = await api.get(`/adjustments/${adjustment.id}`)
      const detailedAdjustment = response.data
      
      const converted: Adjustment = {
        id: detailedAdjustment.id,
        reference_id: detailedAdjustment.reference_number,
        total_quantity: detailedAdjustment.total_quantity,
        processed_by: detailedAdjustment.processed_by_first_name && detailedAdjustment.processed_by_last_name 
          ? `${detailedAdjustment.processed_by_first_name} ${detailedAdjustment.processed_by_last_name}`
          : 'Unknown',
        processed_date: detailedAdjustment.processed_date || detailedAdjustment.created_at,
        created_at: detailedAdjustment.created_at,
        items: (detailedAdjustment.items || []).map((item: any) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          product_sku: item.product_sku,
          warehouse_id: item.warehouse_id,
          warehouse_name: item.warehouse_name,
          quantity: item.quantity,
          cost_price: item.cost_price || 0,
          reason: item.reason || 'No reason provided'
        })),
        status: detailedAdjustment.status,
        notes: detailedAdjustment.notes
      }
      
      setFullAdjustment(converted)
    } catch (error: any) {
      console.error('Error loading adjustment details:', error)
      setDetailsError(error.response?.data?.error || 'Failed to load adjustment details')
    } finally {
      setIsLoadingDetails(false)
    }
  }


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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






  // Handle cancel adjustment
  const handleCancelAdjustment = async () => {
    if (!adjustment || !cancellationReason.trim()) {
      await notice({
        title: 'Reason required',
        description: 'Please provide a reason for cancellation',
        variant: 'info',
      })
      return
    }

    try {
      setIsCancelling(true)
      
      await api.post(`/adjustments/${adjustment.id}/cancel`, {
        reason: cancellationReason
      })
      
      await notice({
        title: 'Adjustment cancelled',
        description: 'Adjustment cancelled successfully',
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
      console.error('Error cancelling adjustment:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred'
      await notice({
        title: 'Cancellation failed',
        description: `Error cancelling adjustment: ${errorMessage}`,
        variant: 'warning',
      })
    } finally {
      setIsCancelling(false)
    }
  }

  const handleClose = () => {
    setFullAdjustment(null)
    setDetailsError(null)
    setShowCancelDialog(false)
    setCancellationReason('')
    onClose()
  }

  const displayAdjustment = fullAdjustment || adjustment

  if (!displayAdjustment) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Adjustment Details
              {displayAdjustment.status === 'cancelled' && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Cancelled
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Complete information about this inventory adjustment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Cancelled Banner */}
            {displayAdjustment.status === 'cancelled' && (
              <div className="border border-red-200 bg-red-50 text-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <svg className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l6.518 11.59c.75 1.335-.213 2.986-1.742 2.986H3.48c-1.53 0-2.492-1.651-1.742-2.986l6.518-11.59zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V7a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">This adjustment has been cancelled</p>
                    <p className="text-sm opacity-90">No further actions can be taken on this adjustment.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Adjustment Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Adjustment Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Reference Number</p>
                      <p className="text-sm text-gray-600 font-mono">{displayAdjustment.reference_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {displayAdjustment.status === 'cancelled' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Cancelled
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Processed Date</p>
                      <p className="text-sm text-gray-600">{formatDate(displayAdjustment.processed_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Processed By</p>
                      <p className="text-sm text-gray-600">{displayAdjustment.processed_by}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cancellation Info */}
            {displayAdjustment.status === 'cancelled' && displayAdjustment.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cancellation</CardTitle>
                  <CardDescription>Details of the cancellation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Reason: </span>
                    {displayAdjustment.notes}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Adjustment Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Adjustment Items</CardTitle>
                <CardDescription>Complete list of items in this adjustment</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDetails ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading adjustment details...</p>
                  </div>
                ) : detailsError ? (
                  <div className="text-center py-8">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <h3 className="text-sm font-medium text-red-800">Error Loading Details</h3>
                      </div>
                      <p className="text-sm text-red-700">{detailsError}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadAdjustmentDetails}
                        className="mt-3 text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : displayAdjustment.items.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No items found for this adjustment</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Warehouse</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Cost Price</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayAdjustment.items
                          .filter(item => item != null)
                          .map((item, index) => (
                            <TableRow key={`${item.product_id}-${index}`}>
                              <TableCell className="font-medium">{item.product_name}</TableCell>
                              <TableCell className="font-mono text-sm">{item.product_sku}</TableCell>
                              <TableCell>{item.warehouse_name}</TableCell>
                              <TableCell className={`font-medium ${item.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {item.quantity > 0 ? '+' : ''}{item.quantity}
                              </TableCell>
                              <TableCell className="font-medium">₱{item.cost_price.toFixed(2)}</TableCell>
                              <TableCell className="text-sm">{item.reason}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

              {/* Documents Section - Compact with Actions */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-base font-semibold text-gray-900 border-b border-gray-200 pb-1">
                  <FileText className="h-4 w-4" />
                  Documents
                </div>
                <div className="border border-gray-200 rounded p-1">
                  <DocumentsSection
                    referenceType="adjustment"
                    referenceId={displayAdjustment.id!}
                    title=""
                    showValidation={true}
                  />
                </div>
              </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <div>
                {displayAdjustment && displayAdjustment.status !== 'cancelled' && (
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelDialog(true)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Cancel Adjustment
                  </Button>
                )}
              </div>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Cancel Adjustment Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Cancel Adjustment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this adjustment? This action will reverse stock movements and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Please provide a reason for cancelling this adjustment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false)
                setCancellationReason('')
              }}
            >
              Keep Adjustment
            </Button>
            <Button
              onClick={handleCancelAdjustment}
              disabled={isCancelling || !cancellationReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Adjustment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notice Dialog */}
      {NoticeDialog}
    </>
  )
}

