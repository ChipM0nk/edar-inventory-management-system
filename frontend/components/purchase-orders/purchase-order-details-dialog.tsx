'use client'

import { useState } from 'react'
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
  Eye, 
  Calendar, 
  User, 
  DollarSign, 
  Package2, 
  MapPin, 
  FileText, 
  Hash, 
  Building, 
  Clock, 
  Upload, 
  X, 
  Trash2, 
  FileImage, 
  File 
} from 'lucide-react'
import { getStatusDisplayText } from '@/lib/utils'
import api from '@/lib/api'
import { DocumentViewerDialog } from './document-viewer-dialog'

interface PurchaseOrderProduct {
  product_id: string
  product_name: string
  product_sku: string
  quantity: number
  cost_price: number
  total_amount: number
  warehouse_name: string
}

interface PurchaseOrder {
  id?: string
  reference_id: string
  reference_number?: string
  reference_type: string
  status?: 'received' | 'cancelled'
  total_quantity: number
  total_amount: number
  processed_by: string
  processed_date: string
  created_at: string
  supplier_name?: string
  cancelled_by?: string
  cancelled_by_first_name?: string
  cancelled_by_last_name?: string
  cancelled_at?: string
  cancellation_reason?: string
  products: PurchaseOrderProduct[]
}

interface Document {
  id: string
  purchase_order_id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  uploaded_at: string
  has_po_reference?: boolean
  has_matching_date?: boolean
  validation_status?: string
  validation_notes?: string
}

interface PurchaseOrderDetailsDialogProps {
  order: PurchaseOrder | null
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
  // Document-related state
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [showDocumentUpload, setShowDocumentUpload] = useState(false)
  const [viewingDocument, setViewingDocument] = useState<string | null>(null)
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  
  // Cancel confirmation state
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  // Load documents when dialog opens
  useState(() => {
    if (isOpen && order?.id) {
      loadDocuments(order.id)
    }
  })

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
      return <File className="w-5 h-5 text-red-500" />
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

  // Load documents for a purchase order
  const loadDocuments = async (purchaseOrderId: string) => {
    try {
      setIsLoadingDocuments(true)
      const response = await api.get(`/documents/purchase-order/${purchaseOrderId}`)
      setDocuments(response.data || [])
    } catch (error) {
      console.error('Error loading documents:', error)
      setDocuments([])
    } finally {
      setIsLoadingDocuments(false)
    }
  }

  // Handle file selection for upload
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setUploadedFiles(prev => [...prev, ...files])
  }

  // Remove file from upload list
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Upload documents
  const uploadDocuments = async () => {
    if (!order || uploadedFiles.length === 0) return

    try {
      setIsUploadingDocuments(true)
      const formData = new FormData()
      
      uploadedFiles.forEach((file) => {
        formData.append(`documents`, file)
      })
      formData.append('purchase_order_id', order.id!)

      await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // Reload documents and clear upload files
      await loadDocuments(order.id!)
      setUploadedFiles([])
      setShowDocumentUpload(false)
      
      alert('Documents uploaded successfully!')
    } catch (error) {
      console.error('Error uploading documents:', error)
      alert('Error uploading documents. Please try again.')
    } finally {
      setIsUploadingDocuments(false)
    }
  }

  // Download document
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
      alert('Error downloading document. Please try again.')
    }
  }

  // Delete document
  const deleteDocument = async (document: Document) => {
    if (!confirm(`Are you sure you want to delete "${document.file_name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await api.delete(`/documents/${document.id}`)
      setDocuments(prev => prev.filter(doc => doc.id !== document.id))
      alert('Document deleted successfully')
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document. Please try again.')
    }
  }

  // View document
  const viewDocument = async (document: Document) => {
    try {
      setViewingDocument(document.id)
      
      const viewableTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'text/html', 'text/css', 'text/javascript']
      if (!viewableTypes.includes(document.file_type.toLowerCase())) {
        alert(`This file type (${document.file_type}) cannot be viewed in the browser. Please download it instead.`)
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
      if (error.response?.status === 404) {
        alert('Document not found. It may have been deleted.')
      } else if (error.response?.status === 403) {
        alert('You do not have permission to view this document.')
      } else if (error.response?.status === 500) {
        alert('Server error while retrieving document. Please try again later.')
      } else {
        alert('Error viewing document. Please try again or download the file instead.')
      }
      setViewingDocument(null)
    }
  }

  // Handle cancel purchase order
  const handleCancelPurchaseOrder = async () => {
    if (!order || !cancellationReason.trim()) {
      alert('Please provide a reason for cancellation')
      return
    }

    try {
      setIsCancelling(true)
      
      await api.post(`/purchase-orders/${order.reference_id}/cancel`, {
        reason: cancellationReason
      })
      
      alert('Purchase order cancelled successfully')
      
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
      alert(`Error cancelling purchase order: ${errorMessage}`)
    } finally {
      setIsCancelling(false)
    }
  }

  const handleClose = () => {
    setDocuments([])
    setUploadedFiles([])
    setShowDocumentUpload(false)
    setShowCancelDialog(false)
    setCancellationReason('')
    setViewingDocument(null)
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
              {order.status === 'cancelled' && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  CANCELLED
                </span>
              )}
              {order.status === 'received' && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  COMPLETED
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
                        <p className="text-sm text-gray-600 font-mono">{order.reference_number || order.reference_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 flex items-center justify-center">
                        <div className={`w-3 h-3 rounded-full ${
                          order.status === 'cancelled' 
                            ? 'bg-red-500' 
                            : order.status === 'received'
                            ? 'bg-green-500'
                            : 'bg-gray-500'
                        }`}></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        <p className="text-sm text-gray-600 capitalize">
                          {getStatusDisplayText(order.status)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Purchase Date</p>
                        <p className="text-sm text-gray-600">{formatDate(order.processed_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Processed By</p>
                        <p className="text-sm text-gray-600">{order.processed_by}</p>
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
                        <Package className="h-5 w-5 text-blue-500" />
                        <p className="text-sm font-medium text-gray-600">Total Quantity</p>
                      </div>
                      <p className="text-2xl font-bold text-green-600">{order.total_quantity}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-green-500" />
                        <p className="text-sm font-medium text-gray-600">Total Amount</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(order.total_amount)}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Package2 className="h-5 w-5 text-purple-500" />
                        <p className="text-sm font-medium text-gray-600">Products</p>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">{order.products.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Products Table */}
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
                          <TableHead>Warehouse</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.products.map((product, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{product.product_name}</TableCell>
                            <TableCell className="font-mono text-sm">{product.product_sku}</TableCell>
                            <TableCell className="text-sm">{product.warehouse_name}</TableCell>
                            <TableCell className="font-medium">{product.quantity}</TableCell>
                            <TableCell className="font-mono text-sm">{formatCurrency(product.cost_price)}</TableCell>
                            <TableCell className="font-mono text-sm font-medium">{formatCurrency(product.total_amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
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
                    {order.status !== 'cancelled' && (
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
                    )}
                    
                    {showDocumentUpload && order.status !== 'cancelled' && (
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
                            {order.status !== 'cancelled' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteDocument(doc)}
                                className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No documents uploaded yet</p>
                      {order.status === 'cancelled' ? (
                        <p className="text-sm">Documents cannot be added to cancelled purchase orders</p>
                      ) : (
                        <p className="text-sm">Click "Add Documents" to upload receipts, invoices, or other supporting files</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

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

      {/* Document Viewer Dialog */}
      <DocumentViewerDialog
        isOpen={viewingDocument !== null}
        onOpenChange={(open) => {
          if (!open) {
            setViewingDocument(null)
            if (documentUrl) {
              window.URL.revokeObjectURL(documentUrl)
              setDocumentUrl(null)
            }
          }
        }}
        document={documents.find(doc => doc.id === viewingDocument) || null}
        documentUrl={documentUrl}
        onDownload={downloadDocument}
      />
    </>
  )
}
