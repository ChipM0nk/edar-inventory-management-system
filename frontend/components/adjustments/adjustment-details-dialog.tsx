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
  Upload,
  X,
  Eye,
  File,
  FileImage,
  Trash2
} from 'lucide-react'
import api from '@/lib/api'
import { useNotice } from '@/hooks/use-notice'

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

interface Document {
  id: string
  reference_type: string
  reference_id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  uploaded_at: string
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
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false)
  const [showDocumentUpload, setShowDocumentUpload] = useState(false)
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  
  // Cancel functionality state
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  // Load adjustment details when dialog opens
  useEffect(() => {
    if (isOpen && adjustment) {
      loadAdjustmentDetails()
      loadDocuments()
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

  const loadDocuments = async () => {
    if (!adjustment) return
    
    try {
      setIsLoadingDocuments(true)
      const response = await api.get(`/documents/by-reference/adjustment/${adjustment.id}`)
      setDocuments(response.data || [])
    } catch (error) {
      console.error('Error loading documents:', error)
      setDocuments([])
    } finally {
      setIsLoadingDocuments(false)
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase()
    if (type.includes('image')) {
      return <FileImage className="w-5 h-5 text-green-500" />
    } else if (type.includes('pdf')) {
      return <File className="w-5 h-5 text-red-500" />
    } else {
      return <FileText className="w-5 h-5 text-gray-400" />
    }
  }

  const isViewable = (fileType: string) => {
    const viewableTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    return viewableTypes.includes(fileType.toLowerCase())
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setUploadedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadDocuments = async () => {
    if (!adjustment || uploadedFiles.length === 0) return

    try {
      setIsUploadingDocuments(true)
      const formData = new FormData()
      
      uploadedFiles.forEach((file) => {
        formData.append('documents', file)
      })
      formData.append('reference_type', 'adjustment')
      formData.append('reference_id', adjustment.id)

      await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      await loadDocuments()
      setUploadedFiles([])
      setShowDocumentUpload(false)
      
      await notice({
        title: 'Upload complete',
        description: 'Documents uploaded successfully!',
        variant: 'success',
      })
    } catch (error) {
      console.error('Error uploading documents:', error)
      await notice({
        title: 'Upload failed',
        description: 'Error uploading documents. Please try again.',
        variant: 'warning',
      })
    } finally {
      setIsUploadingDocuments(false)
    }
  }

  const viewDocument = async (document: Document) => {
    try {
      if (!isViewable(document.file_type)) {
        await notice({
          title: 'Cannot preview file',
          description: `This file type (${document.file_type}) cannot be viewed in the browser. Please download it instead.`,
          variant: 'info',
        })
        return
      }
      
      const response = await api.get(`/documents/${document.id}/download`, {
        responseType: 'blob'
      })
      
      const blob = new Blob([response.data], { type: document.file_type })
      const url = window.URL.createObjectURL(blob)
      setDocumentUrl(url)
    } catch (error: any) {
      console.error('Error viewing document:', error)
      await notice({
        title: 'View failed',
        description: 'Error viewing document. Please try again.',
        variant: 'warning',
      })
    }
  }

  const downloadDocument = async (document: Document) => {
    try {
      const response = await api.get(`/documents/${document.id}/download`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = window.document.createElement('a')
      link.href = url
      link.setAttribute('download', document.file_name)
      window.document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading document:', error)
      await notice({
        title: 'Download failed',
        description: 'Error downloading document. Please try again.',
        variant: 'warning',
      })
    }
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
    setDocuments([])
    setUploadedFiles([])
    setShowDocumentUpload(false)
    setDocumentUrl(null)
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

            {/* Documents Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Upload Documents */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Button
                      onClick={() => setShowDocumentUpload(!showDocumentUpload)}
                      variant="outline"
                      size="sm"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Add Documents
                    </Button>
                  </div>
                  
                  {showDocumentUpload && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select documents to upload
                          </label>
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={handleFileSelect}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                        </div>
                        
                        {uploadedFiles.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Selected files:</p>
                            <ul className="space-y-1">
                              {uploadedFiles.map((file, index) => (
                                <li key={index} className="flex items-center justify-between text-sm text-gray-600 bg-white p-2 rounded">
                                  <span>{file.name} ({formatFileSize(file.size)})</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(index)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={uploadDocuments}
                            disabled={uploadedFiles.length === 0 || isUploadingDocuments}
                            size="sm"
                          >
                            {isUploadingDocuments ? 'Uploading...' : 'Upload'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowDocumentUpload(false)
                              setUploadedFiles([])
                            }}
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Existing Documents */}
                {isLoadingDocuments ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading documents...</p>
                  </div>
                ) : documents.length > 0 ? (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          {getFileIcon(doc.file_type)}
                          <div>
                            <p className="font-medium text-sm">{doc.file_name}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(doc.file_size)} • Uploaded {formatDateTime(doc.uploaded_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isViewable(doc.file_type) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewDocument(doc)}
                              className="text-green-600 hover:text-green-700 border-green-300 hover:bg-green-50"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadDocument(doc)}
                            className="text-blue-600 hover:text-blue-700 border-blue-300 hover:bg-blue-50"
                          >
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No documents uploaded yet</p>
                    <p className="text-sm">Click "Add Documents" to upload supporting files</p>
                  </div>
                )}
              </CardContent>
            </Card>

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

      {/* Document Viewer Dialog */}
      <Dialog open={!!documentUrl} onOpenChange={() => setDocumentUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Document Viewer</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {documentUrl && (
              <iframe
                src={documentUrl}
                className="w-full h-[70vh] border-0"
                title="Document Viewer"
              />
            )}
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

