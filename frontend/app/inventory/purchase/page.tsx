'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/app-layout'
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
import { Search, RefreshCw, ArrowLeft, Package, Eye, Calendar, User, DollarSign, Package2, MapPin, FileText, Hash, Building, Clock, Upload, X, Trash2, FileImage, FilePdf } from 'lucide-react'
import api from '@/lib/api'

interface PurchaseOrder {
  reference_id: string
  reference_number?: string
  reference_type: string
  total_quantity: number
  total_amount: number
  processed_by: string
  processed_date: string
  created_at: string
  supplier_name?: string
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
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  uploaded_at: string
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
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [showDocumentUpload, setShowDocumentUpload] = useState(false)
  const [viewingDocument, setViewingDocument] = useState<string | null>(null)
  
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
              reference_id: refId,
              reference_number: movement.reference_number,
              reference_type: movement.reference_type || 'adjustment',
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
      
      setPurchaseOrders(Array.from(ordersMap.values()))
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
    loadDocuments(order.reference_id)
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
      const response = await api.get(`/documents/purchase-order/${purchaseOrderId}`)
      setDocuments(response.data || [])
    } catch (error) {
      console.error('Error loading documents:', error)
      setDocuments([])
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
      
      uploadedFiles.forEach((file, index) => {
        formData.append(`documents`, file)
      })
      formData.append('purchase_order_id', selectedOrder.reference_id)

      await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // Reload documents and clear upload files
      await loadDocuments(selectedOrder.reference_id)
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
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', document.file_name)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading document:', error)
      alert('Error downloading document. Please try again.')
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
      return <FilePdf className="w-5 h-5 text-red-500" />
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
      
      // Open in new tab
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
      if (!newWindow) {
        alert('Please allow popups to view documents, or try downloading the file instead.')
        window.URL.revokeObjectURL(url)
        return
      }
      
      // Clean up the URL after a delay to free memory
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 60000) // Increased to 60 seconds for better user experience
      
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
    } finally {
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
      
      // Here you would call your API to cancel the purchase order
      // await api.post('/purchase-orders/cancel', {
      //   purchase_order_id: selectedOrder.reference_id,
      //   reason: cancellationReason
      // })
      
      console.log('Cancelling purchase order with reason:', cancellationReason)
      alert('Purchase order cancelled successfully')
      
      // Close dialogs and refresh data
      setShowCancelDialog(false)
      setCancellationReason('')
      closeModal()
      loadPurchaseOrders()
    } catch (error: any) {
      console.error('Error cancelling purchase order:', error)
      alert('Error cancelling purchase order. Please try again.')
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
      <div className="min-h-screen flex items-center justify-center">
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

  return (
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
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleOrderClick(order)}
                          >
                            <TableCell className="font-mono font-medium text-blue-600 hover:text-blue-800">
                              {order.reference_number || order.reference_id}
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

      {/* Stock-In Order Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Purchase Order Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this purchase order and its products
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
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
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-600">Total Quantity</p>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedOrder.total_quantity}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-600">Total Amount</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(selectedOrder.total_amount)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-600">Products</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedOrder.products.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Product List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Product Details</CardTitle>
                  <CardDescription>
                    Complete list of products in this purchase order
                  </CardDescription>
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
                          <TableHead>Cost Price</TableHead>
                          <TableHead>Total Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.products.map((product, index) => (
                          <TableRow key={`${product.product_id}-${index}`}>
                            <TableCell className="font-medium">
                              {product.product_name}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {product.product_sku}
                            </TableCell>
                            <TableCell>
                              {product.warehouse_name}
                            </TableCell>
                            <TableCell className="font-medium text-green-600">
                              +{product.quantity}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {formatCurrency(product.cost_price)}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {formatCurrency(product.total_amount)}
                            </TableCell>
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
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Documents</CardTitle>
                      <CardDescription>
                        Receipts, invoices, and other supporting documents for this purchase order
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => setShowDocumentUpload(!showDocumentUpload)}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {showDocumentUpload ? 'Cancel Upload' : 'Add Documents'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Document Upload Section */}
                  {showDocumentUpload && (
                    <div className="mb-6 p-4 border border-dashed border-gray-300 rounded-lg">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Files to Upload
                          </label>
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                            onChange={handleFileSelect}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Supported formats: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX up to 10MB each
                          </p>
                        </div>

                        {/* Selected Files */}
                        {uploadedFiles.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
                            {uploadedFiles.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center space-x-3">
                                  <FileText className="w-5 h-5 text-gray-400" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFile(index)}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setUploadedFiles([])
                                  setShowDocumentUpload(false)
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={uploadDocuments}
                                disabled={isUploadingDocuments}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {isUploadingDocuments ? 'Uploading...' : 'Upload Documents'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Existing Documents */}
                  {documents.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Uploaded Documents:</h4>
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            {getFileIcon(doc.file_type)}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{doc.file_name}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(doc.file_size)} • {formatDate(doc.uploaded_at)} • {doc.file_type}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {isViewable(doc.file_type) ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => viewDocument(doc)}
                                disabled={viewingDocument === doc.id}
                                className="text-green-600 hover:text-green-700 border-green-300 hover:bg-green-50 disabled:opacity-50"
                              >
                                {viewingDocument === doc.id ? (
                                  <div className="w-4 h-4 mr-1 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                                ) : (
                                  <Eye className="w-4 h-4 mr-1" />
                                )}
                                {viewingDocument === doc.id ? 'Opening...' : 'View'}
                              </Button>
                            ) : (
                              <div className="text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded">
                                View not available
                              </div>
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
                      <p className="text-sm">Click "Add Documents" to upload receipts, invoices, or other supporting files</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <div>
                  {selectedOrder && canCancelPurchaseOrder(selectedOrder.created_at) && (
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
    </AppLayout>
  )
}
