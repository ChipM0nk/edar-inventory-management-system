'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getStatusColor, getStatusDisplayText } from '@/lib/utils'
import { AppLayout } from '@/components/app-layout'
import { DocumentViewerDialog } from '@/components/purchase-orders/document-viewer-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, RefreshCw, ArrowLeft, Package, Eye, Calendar, User, DollarSign, Package2, MapPin, FileText, Hash, Building, Clock, Upload, X, Trash2, FileImage, File } from 'lucide-react'
import api from '@/lib/api'

interface PurchaseOrder {
  id?: string // Purchase order ID from database
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
  cancellation_reason?: string
  products: {
    product_id: string
    product_name: string
    product_sku: string
    quantity: number
    cost_price: number
    total_amount: number
    warehouse_name: string
  }[]
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

export default function PurchasePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
  // State management
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  // Document-related state
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [showDocumentUpload, setShowDocumentUpload] = useState(false)
  const [viewingDocument, setViewingDocument] = useState<string | null>(null)
  const [documentViewerUrl, setDocumentViewerUrl] = useState<string | null>(null)
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  
  // Cancel confirmation state
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedSupplier, setSelectedSupplier] = useState<string>('')
  const [suppliers, setSuppliers] = useState<Array<{id: string, name: string}>>([])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Load purchase orders and suppliers when user is available
  useEffect(() => {
    if (user) {
      loadPurchaseOrders()
      loadSuppliers()
    }
  }, [user])

  // Load suppliers
  const loadSuppliers = async () => {
    try {
      const response = await api.get('/suppliers')
      setSuppliers(response.data.suppliers || [])
    } catch (error) {
      console.error('Error loading suppliers:', error)
    }
  }

  // Filter purchase orders based on search term, year, month, and supplier
  useEffect(() => {
    let filtered = purchaseOrders

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (order) =>
          order.reference_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.reference_number && order.reference_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
          order.processed_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.supplier_name && order.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          order.products.some(p => 
            p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.product_sku.toLowerCase().includes(searchTerm.toLowerCase())
          )
      )
    }

    // Filter by year and month (based on Purchase Date)
    filtered = filtered.filter(order => {
      const orderDate = new Date(order.processed_date)
      return orderDate.getFullYear() === selectedYear && 
             orderDate.getMonth() + 1 === selectedMonth
    })

    // Filter by supplier
    if (selectedSupplier) {
      filtered = filtered.filter(order => 
        order.supplier_name === suppliers.find(s => s.id === selectedSupplier)?.name
      )
    }

    setFilteredOrders(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }, [purchaseOrders, searchTerm, selectedYear, selectedMonth, selectedSupplier, suppliers])

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentOrders = filteredOrders.slice(startIndex, endIndex)

  const loadPurchaseOrders = async () => {
    try {
      setIsLoadingData(true)
      const response = await api.get('/stock-movements?limit=100&movement_type=in')
      const movements = response.data.stock_movements || []
      
      // Debug: Log the first movement to see what fields are available
      if (movements.length > 0) {
        console.log('First movement data:', movements[0])
        console.log('Supplier name from movement:', movements[0].supplier_name)
      }
      
      // Group movements by reference_id for purchase orders
      const ordersMap = new Map<string, PurchaseOrder>()
      
      movements.forEach((movement: any) => {
          const refId = movement.reference_id
          if (!refId) return
          
          if (!ordersMap.has(refId)) {
            ordersMap.set(refId, {
              id: refId, // Use reference_id as the purchase order ID since it now contains the actual PO ID
              reference_id: refId,
              reference_number: movement.reference_number,
              reference_type: movement.reference_type || 'adjustment',
              status: 'received', // Default status for stock movements (they represent received items)
              total_quantity: 0,
              total_amount: 0,
              processed_by: movement.processed_by_first_name && movement.processed_by_last_name 
                ? `${movement.processed_by_first_name} ${movement.processed_by_last_name}`
                : movement.user_first_name && movement.user_last_name 
                ? `${movement.user_first_name} ${movement.user_last_name}`
                : 'Unknown',
              processed_date: movement.processed_date || movement.created_at,
              created_at: movement.created_at,
              supplier_name: movement.supplier_name,
              products: []
            })
            
            // Debug: Log the created order to see if reference_number and supplier_name are set
            console.log('Created order:', ordersMap.get(refId))
            console.log('Supplier name in order:', ordersMap.get(refId)?.supplier_name)
          }
          
          const order = ordersMap.get(refId)!
          order.total_quantity += movement.quantity
          order.total_amount += movement.total_amount || 0
          order.products.push({
            product_id: movement.product_id,
            product_name: movement.product_name,
            product_sku: movement.product_sku,
            quantity: movement.quantity,
            cost_price: movement.cost_price || 0,
            total_amount: movement.total_amount || 0,
            warehouse_name: movement.warehouse_name
          })
        })
      
      const orders = Array.from(ordersMap.values())
      
      // Check the actual status of each purchase order and get cancellation details
      for (const order of orders) {
        try {
          const response = await api.get(`/purchase-orders/${order.reference_id}`)
          console.log(`Status for PO ${order.reference_id}:`, response.data?.status)
          if (response.data) {
            // Update status and cancellation fields
            if (response.data.status) {
              order.status = response.data.status
            }
            if (response.data.cancelled_by) {
              order.cancelled_by = response.data.cancelled_by
            }
            if (response.data.cancelled_by_first_name) {
              order.cancelled_by_first_name = response.data.cancelled_by_first_name
            }
            if (response.data.cancelled_by_last_name) {
              order.cancelled_by_last_name = response.data.cancelled_by_last_name
            }
            if (response.data.cancellation_reason) {
              order.cancellation_reason = response.data.cancellation_reason
            }
          }
        } catch (error) {
          // If we can't get the purchase order, keep the default status
          console.warn(`Could not get status for purchase order ${order.reference_id}:`, error)
        }
      }
      
      setPurchaseOrders(orders)
    } catch (error) {
      console.error('Error loading purchase orders:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

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


  const handleOrderClick = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
    loadDocuments(order.id!)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedOrder(null)
    setDocuments([])
    setUploadedFiles([])
    setShowDocumentUpload(false)
    setShowCancelDialog(false)
    setCancellationReason('')
    setViewingDocument(null)
  }

  // Load documents for a purchase order
  const loadDocuments = async (purchaseOrderId: string) => {
    try {
      setIsLoadingDocuments(true)
      console.log('Loading documents for purchase order ID:', purchaseOrderId)
      const response = await api.get(`/documents/purchase-order/${purchaseOrderId}`)
      console.log('Documents response:', response.data)
      setDocuments(response.data || [])
    } catch (error) {
      console.error('Error loading documents:', error)
      console.error('Error details:', (error as any).response?.data)
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
    if (!selectedOrder || uploadedFiles.length === 0) return

    try {
      setIsUploadingDocuments(true)
      const formData = new FormData()
      
      // Debug: Log the selected order and files
      console.log('Selected order for upload:', selectedOrder)
      console.log('Upload files:', uploadedFiles)
      console.log('Purchase order ID being sent:', selectedOrder.id)
      
      uploadedFiles.forEach((file, index) => {
        formData.append(`documents`, file)
      })
      formData.append('purchase_order_id', selectedOrder.id!)

      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      console.log('Upload response:', response.data)

      // Reload documents and clear upload files
      await loadDocuments(selectedOrder.id!)
      setUploadedFiles([])
      setShowDocumentUpload(false)
      
      alert('Documents uploaded successfully!')
    } catch (error) {
      console.error('Error uploading documents:', error)
      console.error('Error details:', (error as any).response?.data)
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
      
      // Remove the document from the current documents list
      setDocuments(prev => prev.filter(doc => doc.id !== document.id))
      
      // Show success message
      alert('Document deleted successfully')
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document. Please try again.')
    }
  }

  // Format file size
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

  // View document in new tab
  const viewDocument = async (document: Document) => {
    try {
      setViewingDocument(document.id)
      
      // Check if file type is viewable in browser
      const viewableTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'text/html', 'text/css', 'text/javascript']
      if (!viewableTypes.includes(document.file_type.toLowerCase())) {
        alert(`This file type (${document.file_type}) cannot be viewed in the browser. Please download it instead.`)
        return
      }
      
      const response = await api.get(`/documents/${document.id}/download`, {
        responseType: 'blob'
      })
      
      // Create blob URL with the correct MIME type
      const blob = new Blob([response.data], { type: document.file_type })
      const url = window.URL.createObjectURL(blob)
      
      // Set the document URL for the viewer dialog
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
    if (!selectedOrder || !cancellationReason.trim()) {
      alert('Please provide a reason for cancellation')
      return
    }

    try {
      setIsCancelling(true)
      
      // Debug: Log the data being sent
      console.log('Cancelling purchase order with ID:', selectedOrder.reference_id)
      console.log('Reason:', cancellationReason)
      console.log('Full selectedOrder:', selectedOrder)
      
      // Call the API to cancel the purchase order
      // Use the reference_id as it should be the purchase order ID
      await api.post(`/purchase-orders/${selectedOrder.reference_id}/cancel`, {
        reason: cancellationReason
      })
      
      alert('Purchase order cancelled successfully')
      
      // Close dialogs and refresh data
      setShowCancelDialog(false)
      setCancellationReason('')
      closeModal()
      
      // Refresh purchase orders to update status
      await loadPurchaseOrders()
    } catch (error: any) {
      console.error('Error cancelling purchase order:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred'
      alert(`Error cancelling purchase order: ${errorMessage}`)
    } finally {
      setIsCancelling(false)
    }
  }

  // Check if purchase order can be cancelled (within 30 days)
  const canCancelPurchaseOrder = (createdDate: string) => {
    const created = new Date(createdDate)
    const now = new Date()
    const daysDifference = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
    return daysDifference <= 30
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Show loading screen when data is being loaded
  if (isLoadingData && purchaseOrders.length === 0) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <h2 className="mt-6 text-xl font-semibold text-gray-900">Loading Purchase Orders</h2>
            <p className="mt-2 text-gray-600">Please wait while we fetch your data...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <>
    <AppLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
                <p className="mt-2 text-gray-600">View all purchase orders and their details</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={loadPurchaseOrders}
                  disabled={isLoadingData}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button 
                  className="flex items-center gap-2 bg-[#52a852] hover:bg-[#4a964a] text-white"
                  onClick={() => router.push('/inventory/movements/new')}
                >
                  <Package className="h-4 w-4" />
                  New PO
                </Button>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Purchase Orders</CardTitle>
                <CardDescription>
                  Complete list of all purchase orders with reference numbers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by reference number, processed by, supplier, or product..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Filter Controls */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#52a852] focus:border-transparent"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Month</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#52a852] focus:border-transparent"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>
                          {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <select
                      value={selectedSupplier}
                      onChange={(e) => setSelectedSupplier(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#52a852] focus:border-transparent"
                    >
                      <option value="">All Suppliers</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button
                      onClick={() => {
                        setSearchTerm('')
                        setSelectedSupplier('')
                        setSelectedYear(new Date().getFullYear())
                        setSelectedMonth(new Date().getMonth() + 1)
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>

                {/* Purchase Orders Table */}
                {isLoadingData ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading purchase orders...</p>
                  </div>
                ) : currentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {searchTerm 
                        ? 'No purchase orders found matching your search' 
                        : 'No purchase orders available'
                      }
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      {searchTerm
                        ? 'Try adjusting your search terms' 
                        : 'Stock-in orders will appear here once inventory is received'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reference Number</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Total Quantity</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Processed By</TableHead>
                          <TableHead>Purchase Date</TableHead>
                          <TableHead>Created At</TableHead>
                          <TableHead>Products</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentOrders.map((order) => (
                          <TableRow 
                            key={order.reference_id}
                            className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                              order.status === 'cancelled' ? 'bg-red-50 hover:bg-red-100' : ''
                            }`}
                            onClick={() => handleOrderClick(order)}
                          >
                            <TableCell className="font-mono font-medium text-blue-600 hover:text-blue-800">
                              {order.reference_number || order.reference_id}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                order.status === 'cancelled' 
                                  ? 'bg-red-100 text-red-800' 
                                  : order.status === 'received'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {getStatusDisplayText(order.status)}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {order.supplier_name || 'Not specified'}
                            </TableCell>
                            <TableCell className="font-medium">
                              {order.total_quantity}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {formatCurrency(order.total_amount)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {order.processed_by}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {formatDate(order.processed_date)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {formatDateTime(order.created_at)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {order.products.length} item{order.products.length !== 1 ? 's' : ''}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={currentPage === page ? "bg-[#52a852] hover:bg-[#4a964a] text-white" : ""}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>


    </AppLayout>

    {/* Dialogs rendered outside AppLayout for proper positioning */}
    {/* Stock-In Order Detail Modal */}
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="w-[90vw] max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="sticky top-0 bg-white z-50 border-b pb-4 mb-4 shadow-sm flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Purchase Order Details
            {selectedOrder?.status === 'cancelled' && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                CANCELLED
              </span>
            )}
            {selectedOrder?.status === 'received' && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                COMPLETED
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Complete information about this purchase order and its products
          </DialogDescription>
          
          {/* Status Warning - Moved into header */}
          {selectedOrder?.status === 'cancelled' && (
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
                  {(selectedOrder.cancelled_by_first_name || selectedOrder.cancelled_by_last_name || selectedOrder.cancellation_reason) && (
                    <div className="mt-3 pt-3 border-t border-red-200">
                      {(selectedOrder.cancelled_by_first_name || selectedOrder.cancelled_by_last_name) && (
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-red-500" />
                          <span className="text-xs text-red-600">
                            <span className="font-medium">Cancelled by:</span>{' '}
                            {selectedOrder.cancelled_by_first_name || ''} {selectedOrder.cancelled_by_last_name || ''}
                          </span>
                        </div>
                      )}
                      {selectedOrder.cancellation_reason && (
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-red-600">
                            <span className="font-medium">Reason:</span>{' '}
                            <span className="italic">{selectedOrder.cancellation_reason}</span>
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
        
        {selectedOrder && (
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
                      <p className="text-sm text-gray-600 font-mono">{selectedOrder.reference_number || selectedOrder.reference_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 flex items-center justify-center">
                      <div className={`w-3 h-3 rounded-full ${
                        selectedOrder.status === 'cancelled' 
                          ? 'bg-red-500' 
                          : selectedOrder.status === 'received'
                          ? 'bg-green-500'
                          : 'bg-gray-500'
                      }`}></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <p className="text-sm text-gray-600 capitalize">
                        {getStatusDisplayText(selectedOrder.status)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Purchase Date</p>
                      <p className="text-sm text-gray-600">{formatDate(selectedOrder.processed_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Processed By</p>
                      <p className="text-sm text-gray-600">{selectedOrder.processed_by}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Created At</p>
                      <p className="text-sm text-gray-600">{formatDateTime(selectedOrder.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Supplier</p>
                      <p className="text-sm text-gray-600">{selectedOrder.supplier_name || 'Not specified'}</p>
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
                    <p className="text-2xl font-bold text-green-600">{selectedOrder.total_quantity}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <p className="text-sm font-medium text-gray-600">Total Amount</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(selectedOrder.total_amount)}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Package2 className="h-5 w-5 text-purple-500" />
                      <p className="text-sm font-medium text-gray-600">Products</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{selectedOrder.products.length}</p>
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
                      {selectedOrder.products.map((product, index) => (
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
                  {selectedOrder?.status !== 'cancelled' && (
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
                  
                  {showDocumentUpload && selectedOrder?.status !== 'cancelled' && (
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
                          {selectedOrder?.status !== 'cancelled' && (
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
                    {selectedOrder?.status === 'cancelled' ? (
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
                {selectedOrder && canCancelPurchaseOrder(selectedOrder.created_at) && selectedOrder.status !== 'cancelled' && (
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
                <Button variant="outline" onClick={closeModal}>
                  Close
                </Button>
              </div>
            </div>
            </div>
          )}
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
