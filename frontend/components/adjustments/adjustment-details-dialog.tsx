'use client'

import { useState, useEffect } from 'react'
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
  quantity: number
  cost_price: number
  reason: string
}


interface Adjustment {
  id: string
  reference_id: string
  warehouse_id: string
  warehouse_name?: string
  total_quantity: number
  processed_by: string
  processed_date: string
  created_at: string
  items: AdjustmentItem[]
  status?: string
  notes?: string | null
  external_reference?: string | null
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
      
      console.log('Received adjustment data:', detailedAdjustment)
      console.log('External reference:', detailedAdjustment.external_reference)
      
      const converted: Adjustment = {
        id: detailedAdjustment.id,
        reference_id: detailedAdjustment.reference_number,
        warehouse_id: detailedAdjustment.warehouse_id,
        warehouse_name: detailedAdjustment.warehouse_name,
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
          quantity: item.quantity,
          cost_price: item.cost_price || 0,
          reason: item.reason || 'No reason provided'
        })),
        status: detailedAdjustment.status,
        notes: detailedAdjustment.notes,
        external_reference: detailedAdjustment.external_reference
      }
      
      console.log('Converted adjustment data:', converted)
      console.log('Converted external reference:', converted.external_reference)
      
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
        <DialogContent className="w-[95vw] max-w-5xl max-h-[85vh] overflow-hidden flex flex-col [&>button]:hidden">
          <DialogHeader className="sticky top-0 bg-white z-20 pb-2 mb-2 border-b border-gray-200 shadow-sm flex-shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-gray-700" />
                  Adjustment Details
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-2">
                  Complete information about this inventory adjustment
                </DialogDescription>
              </div>
              <div>
                {displayAdjustment && displayAdjustment.status !== 'cancelled' && (
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelDialog(true)}
                    className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 text-sm px-3 py-1"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Cancel Adjustment
                  </Button>
                )}
              </div>
            </div>
        
            {/* Status Warning - Moved into header */}
          {displayAdjustment.status === 'cancelled' && (
              <div className="mt-3 bg-red-50 border-l-4 border-red-400 p-3 rounded-r">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-red-700 font-medium">This adjustment has been cancelled</p>
                    <p className="text-xs text-red-600 mt-1">No further actions can be taken on this adjustment</p>
                    
                    {/* Show cancellation details if available */}
                    {displayAdjustment.notes && (
                      <div className="mt-3 pt-3 border-t border-red-200">
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-red-600">
                            <span className="font-medium">Cancellation Reason:</span>{' '}
                            <span className="italic">
                              {(() => {
                                const notes = displayAdjustment.notes
                                // Extract cancellation reason from mixed notes
                                return notes.includes('| Cancelled:') 
                                  ? notes.split('| Cancelled:')[1]?.trim() || 'No reason provided'
                                  : notes
                              })()}
                            </span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
              </div>
            </div>
          )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
            <div className="space-y-8 p-1">
              {/* Adjustment Overview - Simplified without card */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 border-b border-gray-200 pb-1">
                  <AlertTriangle className="h-5 w-5" />
                  Adjustment Overview
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-gray-600 font-bold w-40">Reference</span>
                      <span className="text-gray-900">: {displayAdjustment.reference_id}</span>
                    </div>
                    {displayAdjustment.external_reference && (
                      <div className="flex items-center">
                        <span className="text-gray-600 font-bold w-40">External Reference</span>
                        <span className="text-gray-900">: {displayAdjustment.external_reference}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <span className="text-gray-600 font-bold w-40">Warehouse</span>
                      <span className="text-gray-900">: {displayAdjustment.warehouse_name || 'Unknown'}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-gray-600 font-bold w-40">Processed By</span>
                      <span className="text-gray-900">: {displayAdjustment.processed_by}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-600 font-bold w-40">Processed Date</span>
                      <span className="text-gray-900">: {formatDate(displayAdjustment.processed_date)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-600 font-bold w-40">Status</span>
                      <span className="text-gray-900">: {displayAdjustment.status === 'cancelled' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Adjustment Items - Enhanced visibility */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  <AlertTriangle className="h-5 w-5" />
                  Adjustment Items ({displayAdjustment.items?.length || 0})
                </div>
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
                  <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm overflow-x-auto">
                    <Table className="min-w-full">
                      <TableHeader className="bg-gray-100">
                        <TableRow className="border-b border-gray-300">
                          <TableHead className="font-semibold text-gray-900 text-left py-3 px-4 text-sm">Product Name</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-left py-3 px-4 text-sm">SKU</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-center py-3 px-4 text-sm">Quantity</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-right py-3 px-4 text-sm">Cost Price</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-left py-3 px-4 text-sm">Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayAdjustment.items
                          .filter(item => item != null)
                          .map((item, index) => (
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
                              <TableCell className={`py-3 px-4 text-sm text-center font-semibold ${item.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {item.quantity > 0 ? '+' : ''}{item.quantity}
                              </TableCell>
                              <TableCell className="py-3 px-4 text-sm text-right font-mono text-gray-900">₱{item.cost_price.toFixed(2)}</TableCell>
                              <TableCell className="py-3 px-4 text-sm text-gray-700">{item.reason}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Notes Section - Simple text under the table */}
              {displayAdjustment.notes && (
                <div className="mt-2">
                  <span className="text-red-600 font-semibold text-sm">NOTE:</span>
                  <span className="text-gray-700 text-sm ml-2">
                    {(() => {
                      const notes = displayAdjustment.notes
                      // For cancelled adjustments, extract original notes if they contain cancellation info
                      if (displayAdjustment.status === 'cancelled' && notes.includes('| Cancelled:')) {
                        return notes.split('| Cancelled:')[0].trim()
                      }
                      return notes
                    })()}
                  </span>
                </div>
              )}

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

