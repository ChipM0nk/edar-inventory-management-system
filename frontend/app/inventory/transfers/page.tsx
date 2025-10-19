'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { AppLayout } from '@/components/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, RefreshCw, ArrowLeft, Package, Eye, Calendar, User, DollarSign, FileText, Hash, ArrowRightLeft, CheckCircle, AlertCircle } from 'lucide-react'
import api from '@/lib/api'

interface Product {
  id: string
  name: string
  sku: string
  unit_price: number
}

interface StockLevel {
  id: string
  product_id: string
  warehouse_id: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
  product_name?: string
  product_sku?: string
}

interface Warehouse {
  id: string
  name: string
  location: string
}

interface TransferItem {
  product_id: string
  product_name: string
  product_sku: string
  quantity: number
}

interface Transfer {
  id: string
  reference_id: string
  total_quantity: number
  processed_by: string
  processed_date: string
  created_at: string
  status: string
  from_warehouse_name: string
  to_warehouse_name: string
  reason: string
  items: TransferItem[]
}

export default function TransfersPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const transferItemsRef = useRef<HTMLDivElement>(null)
  const productSelectRef = useRef<HTMLButtonElement>(null)
  
  // State management
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredTransfers, setFilteredTransfers] = useState<Transfer[]>([])
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  // Create transfer form state
  const [transferItems, setTransferItems] = useState<TransferItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [fromWarehouse, setFromWarehouse] = useState<Warehouse | null>(null)
  const [toWarehouse, setToWarehouse] = useState<Warehouse | null>(null)
  const [transferQuantity, setTransferQuantity] = useState('')
  const [transferReason, setTransferReason] = useState('')
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0])
  const [availableProducts, setAvailableProducts] = useState<StockLevel[]>([])
  const [currentStock, setCurrentStock] = useState<number | null>(null)
  const [quantityError, setQuantityError] = useState<string>('')
  const [warehousesLocked, setWarehousesLocked] = useState(false)
  const [showWarehouseChangeWarning, setShowWarehouseChangeWarning] = useState(false)
  const [pendingWarehouseChange, setPendingWarehouseChange] = useState<{type: 'from' | 'to', value: string} | null>(null)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [createdTransferRef, setCreatedTransferRef] = useState<string>('')
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [previewReferenceNumber, setPreviewReferenceNumber] = useState<string>('')
  const [generatedReferenceNumber, setGeneratedReferenceNumber] = useState<string>('')
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Load data when user is available
  useEffect(() => {
    if (user) {
      loadTransfers()
      loadProducts()
      loadWarehouses()
    }
  }, [user])

  // Filter transfers based on search term
  useEffect(() => {
    let filtered = transfers

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (transfer) =>
          transfer.reference_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transfer.processed_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transfer.items.some(item => 
            item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.product_sku.toLowerCase().includes(searchTerm.toLowerCase())
          )
      )
    }

    setFilteredTransfers(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }, [searchTerm, transfers])

  // Pagination logic
  const totalPages = Math.ceil(filteredTransfers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTransfers = filteredTransfers.slice(startIndex, endIndex)

  const loadTransfers = async () => {
    try {
      setIsLoadingData(true)
      const response = await api.get('/transfers?limit=100')
      const transfersData = response.data.transfers || []
      
      // Convert the API response to our Transfer interface
      const transfers: Transfer[] = transfersData.map((transfer: any) => ({
        id: transfer.id,
        reference_id: transfer.reference_number,
        total_quantity: transfer.total_quantity,
        processed_by: transfer.processed_by_name || transfer.created_by_name || 'Unknown',
        processed_date: transfer.processed_date || transfer.created_at,
        created_at: transfer.created_at,
        status: transfer.status || 'completed',
        from_warehouse_name: transfer.from_warehouse_name || 'Unknown',
        to_warehouse_name: transfer.to_warehouse_name || 'Unknown',
        reason: transfer.reason || '',
        items: transfer.items || []
      }))
      
      setTransfers(transfers)
    } catch (error) {
      console.error('Error loading transfers:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await api.get('/products?limit=100')
      setProducts(response.data.products || [])
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const loadWarehouses = async () => {
    try {
      const response = await api.get('/warehouses')
      setWarehouses(response.data.warehouses || [])
    } catch (error) {
      console.error('Error loading warehouses:', error)
    }
  }

  const loadProductsWithStock = async (warehouseId: string) => {
    try {
      const response = await api.get(`/stock-levels?warehouse_id=${warehouseId}&limit=100`)
      const stockLevels = response.data.stock_levels || []
      // Filter only products with available quantity > 0
      const productsWithStock = stockLevels.filter((sl: StockLevel) => sl.available_quantity > 0)
      setAvailableProducts(productsWithStock)
    } catch (error) {
      console.error('Error loading products with stock:', error)
      setAvailableProducts([])
    }
  }

  const loadStockLevel = async (productId: string, warehouseId: string) => {
    try {
      const response = await api.get(`/stock-levels/${productId}/${warehouseId}`)
      setCurrentStock(response.data.available_quantity)
      setQuantityError('')
    } catch (error) {
      console.error('Error loading stock level:', error)
      setCurrentStock(0)
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

  const handleTransferClick = (transfer: Transfer) => {
    setSelectedTransfer(transfer)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedTransfer(null)
  }

  const showError = (message: string) => {
    setErrorMessage(message)
    setShowErrorDialog(true)
  }

  const closeErrorDialog = () => {
    setShowErrorDialog(false)
    // Focus back to product selection when error dialog closes
    setTimeout(() => {
      console.log('Attempting to focus product select after error dialog closes')
      
      // Try multiple methods to ensure focus works
      const productSelect = document.getElementById('product-select') as HTMLElement
      if (productSelect) {
        console.log('Found product select by ID, attempting focus')
        productSelect.focus()
        // Also try clicking to ensure it's properly activated
        productSelect.click()
      } else {
        console.log('Product select not found by ID, trying ref')
        if (productSelectRef.current) {
          productSelectRef.current.focus()
          productSelectRef.current.click()
        } else {
          console.log('Product select not found by ref, trying tabIndex')
          // Final fallback: find by tabIndex
          const productSelectByTab = document.querySelector('[tabindex="5"]') as HTMLElement
          if (productSelectByTab) {
            productSelectByTab.focus()
            productSelectByTab.click()
          }
        }
      }
    }, 500) // Increased timeout further
  }

  const handleCancelTransfer = () => {
    setShowCancelDialog(true)
  }

  const confirmCancelTransfer = async () => {
    if (!selectedTransfer) return

    try {
      setIsCancelling(true)
      await api.put(`/transfers/${selectedTransfer.id}/status`, {
        status: 'cancelled'
      })
      
      // Reload transfers to get updated data
      await loadTransfers()
      
      // Update the selected transfer to show cancelled status
      setSelectedTransfer({
        ...selectedTransfer,
        status: 'cancelled'
      })
      
      setShowCancelDialog(false)
    } catch (error) {
      console.error('Error cancelling transfer:', error)
      showError('Failed to cancel transfer. Please try again.')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleAddItem = () => {
    const quantity = parseInt(transferQuantity) || 0
    
    if (!selectedProduct || !fromWarehouse || !toWarehouse || quantity <= 0) {
      showError('Please fill in all required fields')
      return
    }

    if (fromWarehouse.id === toWarehouse.id) {
      showError('From and To warehouses must be different')
      return
    }

    // Validate against current stock
    if (currentStock !== null && quantity > currentStock) {
      setQuantityError(`Quantity cannot exceed available stock (${currentStock})`)
      return
    }

    // Check if product already exists in items
    const existingItem = transferItems.find(item => item.product_id === selectedProduct.id)
    if (existingItem) {
      showError('This product is already in the transfer list. Please remove it first or update the quantity.')
      return
    }

    const newItem: TransferItem = {
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      product_sku: selectedProduct.sku,
      quantity: quantity
    }

    setTransferItems([...transferItems, newItem])
    
    // Lock warehouses after first item
    setWarehousesLocked(true)
    
    // Reset only the product selection form (not warehouse selection)
    setSelectedProduct(null)
    setTransferQuantity('')
    setCurrentStock(null)
    setQuantityError('')
    
    // Focus back to product selection for quick adding
    setTimeout(() => {
      if (productSelectRef.current) {
        productSelectRef.current.focus()
      } else {
        // Fallback: find the product select by ID
        const productSelect = document.getElementById('product-select') as HTMLElement
        if (productSelect) {
          productSelect.focus()
        }
      }
    }, 100)
  }

  const handleRemoveItem = (index: number) => {
    const newItems = transferItems.filter((_, i) => i !== index)
    setTransferItems(newItems)
    // Unlock warehouses if no items left
    if (newItems.length === 0) {
      setWarehousesLocked(false)
    }
  }

  const handleWarehouseChange = (type: 'from' | 'to', value: string) => {
    // Check if there are existing items or if warehouses are locked
    if (transferItems.length > 0 || warehousesLocked) {
      setPendingWarehouseChange({ type, value })
      setShowWarehouseChangeWarning(true)
      return
    }

    // If no items, proceed with change
    applyWarehouseChange(type, value)
  }

  const applyWarehouseChange = (type: 'from' | 'to', value: string) => {
    if (type === 'from') {
      const warehouse = warehouses.find(w => w.id === value)
      setFromWarehouse(warehouse || null)
      setSelectedProduct(null)
      setCurrentStock(null)
      setQuantityError('')
      if (value) {
        loadProductsWithStock(value)
      } else {
        setAvailableProducts([])
      }
    } else {
      const warehouse = warehouses.find(w => w.id === value)
      setToWarehouse(warehouse || null)
    }
  }

  const confirmWarehouseChange = () => {
    if (pendingWarehouseChange) {
      // Clear form details when warehouse changes
      setTransferItems([])
      setSelectedProduct(null)
      setCurrentStock(null)
      setQuantityError('')
      setAvailableProducts([])
      setWarehousesLocked(false)
      setTransferQuantity('') // Clear quantity field
      
      // Apply the warehouse change
      applyWarehouseChange(pendingWarehouseChange.type, pendingWarehouseChange.value)
      
      // Clear pending change
      setPendingWarehouseChange(null)
      setShowWarehouseChangeWarning(false)
    }
  }

  const cancelWarehouseChange = () => {
    setPendingWarehouseChange(null)
    setShowWarehouseChangeWarning(false)
  }

  const handleCreateTransfer = () => {
    if (transferItems.length === 0) {
      showError('Please add at least one item to the transfer')
      return
    }

    if (!fromWarehouse || !toWarehouse) {
      showError('Please select both warehouses')
      return
    }

    if (!transferReason.trim()) {
      showError('Please provide a reason for the transfer')
      return
    }

    // Generate preview reference number
    const date = new Date(transferDate)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear()).slice(-2)
    const timestamp = Date.now().toString().slice(-4)
    const referenceNumber = `TRNSFR_${day}${month}${year}_${timestamp}`
    setPreviewReferenceNumber(referenceNumber)
    setGeneratedReferenceNumber(referenceNumber)

    // Show review dialog
    setShowReviewDialog(true)
  }

  const confirmCreateTransfer = async () => {
    try {
      // Use the pre-generated reference number
      const referenceNumber = generatedReferenceNumber

      // Create transfer using the new API
      const transferData = {
        reference_number: referenceNumber,
        from_warehouse_id: fromWarehouse!.id,
        to_warehouse_id: toWarehouse!.id,
        reason: transferReason,
        transfer_date: transferDate,
        items: transferItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))
      }

      await api.post('/transfers', transferData)

      // Reset form and close modal
      setTransferItems([])
      setSelectedProduct(null)
      setFromWarehouse(null)
      setToWarehouse(null)
      setTransferQuantity('')
      setTransferReason('')
      setTransferDate(new Date().toISOString().split('T')[0])
      setAvailableProducts([])
      setCurrentStock(null)
      setQuantityError('')
      setWarehousesLocked(false)
      setShowWarehouseChangeWarning(false)
      setPendingWarehouseChange(null)
      setIsCreateModalOpen(false)
      setShowReviewDialog(false)
      
      // Reload transfers
      await loadTransfers()
      
      // Show success dialog
      setCreatedTransferRef(referenceNumber)
      setShowSuccessDialog(true)
    } catch (error) {
      console.error('Error creating transfer:', error)
      setShowReviewDialog(false)
      showError('Failed to create transfer. Please try again.')
    }
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
                <h1 className="text-3xl font-bold text-gray-900">Stock Transfers</h1>
                <p className="mt-2 text-gray-600">Manage inventory transfers between warehouses</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={loadTransfers}
                  disabled={isLoadingData}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button 
                  className="flex items-center gap-2 bg-[#52a852] hover:bg-[#4a964a] text-white"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  New Transfer
                </Button>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Stock Transfers</CardTitle>
                <CardDescription>
                  View and manage all warehouse transfers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by reference number, processed by, or product..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Transfers Table */}
                {isLoadingData ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading transfers...</p>
                  </div>
                ) : currentTransfers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {searchTerm 
                        ? 'No transfers found matching your search' 
                        : 'No transfers available'
                      }
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      {searchTerm
                        ? 'Try adjusting your search terms' 
                        : 'Transfers will appear here once created'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reference Number</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Total Quantity</TableHead>
                          <TableHead>Processed By</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Items</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentTransfers.map((transfer) => (
                          <TableRow 
                            key={transfer.reference_id}
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleTransferClick(transfer)}
                          >
                            <TableCell className="font-mono font-medium text-blue-600 hover:text-blue-800">
                              {transfer.reference_id}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                transfer.status === 'cancelled' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {transfer.status === 'cancelled' ? 'Cancelled' : 'Transfer'}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium">
                              {transfer.total_quantity}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {transfer.processed_by}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {formatDate(transfer.processed_date)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {transfer.items.length} item{transfer.items.length !== 1 ? 's' : ''}
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
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredTransfers.length)} of {filteredTransfers.length} results
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

      {/* Transfer Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Transfer Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this warehouse transfer
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransfer && (
            <div className="space-y-6">
              {/* Cancellation Banner */}
              {selectedTransfer.status === 'cancelled' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <h3 className="text-sm font-semibold text-red-800">This transfer has been cancelled</h3>
                      <p className="text-sm text-red-600 mt-1">No further actions can be taken on this transfer.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Transfer Overview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Transfer Overview</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-gray-700">Reference: </span>
                        <span className="text-sm text-gray-900">{selectedTransfer.reference_id}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-gray-700">Date: </span>
                        <span className="text-sm text-gray-900">{formatDate(selectedTransfer.processed_date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-gray-700">Processed By: </span>
                        <span className="text-sm text-gray-900">{selectedTransfer.processed_by}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-gray-700">Reason: </span>
                        <span className="text-sm text-gray-900">{selectedTransfer.reason || 'No reason provided'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:col-span-2">
                      <Package className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-gray-700">From: </span>
                        <span className="text-sm text-gray-900">{selectedTransfer.from_warehouse_name}</span>
                        <span className="mx-2 text-gray-400">→</span>
                        <span className="text-sm font-medium text-gray-700">To: </span>
                        <span className="text-sm text-gray-900">{selectedTransfer.to_warehouse_name}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transfer Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Transfer Items</CardTitle>
                  <CardDescription>
                    Complete list of items in this transfer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Quantity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedTransfer.items.map((item, index) => (
                          <TableRow key={`${item.product_id}-${index}`}>
                            <TableCell className="font-medium">
                              {item.product_name}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {item.product_sku}
                            </TableCell>
                            <TableCell className="font-medium text-blue-600">
                              {item.quantity}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-between gap-3">
                {selectedTransfer.status !== 'cancelled' && (
                  <Button 
                    variant="destructive" 
                    onClick={handleCancelTransfer}
                    className="flex items-center gap-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Cancel Transfer
                  </Button>
                )}
                <div className="flex gap-3 ml-auto">
                  <Button variant="outline" onClick={closeModal}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Transfer Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
        setIsCreateModalOpen(open)
        if (!open) {
          // Reset form state when closing
          setTransferItems([])
          setSelectedProduct(null)
          setFromWarehouse(null)
          setToWarehouse(null)
          setTransferQuantity('')
          setTransferReason('')
          setTransferDate(new Date().toISOString().split('T')[0])
          setAvailableProducts([])
          setCurrentStock(null)
          setQuantityError('')
          setWarehousesLocked(false)
          setShowWarehouseChangeWarning(false)
          setPendingWarehouseChange(null)
          setShowReviewDialog(false)
          setShowSuccessDialog(false)
          setShowErrorDialog(false)
          setPreviewReferenceNumber('')
          setGeneratedReferenceNumber('')
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Transfer
            </DialogTitle>
            <DialogDescription>
              Transfer inventory between warehouses
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Transfer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transfer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transfer-date">Transfer Date *</Label>
                    <Input
                      id="transfer-date"
                      type="date"
                      value={transferDate}
                      onChange={(e) => setTransferDate(e.target.value)}
                      tabIndex={1}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>From Warehouse *</Label>
                    <Select 
                      value={fromWarehouse?.id || ''} 
                      onValueChange={(value) => handleWarehouseChange('from', value)}
                      disabled={warehousesLocked}
                    >
                      <SelectTrigger tabIndex={2}>
                        <SelectValue placeholder="Select source warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name} - {warehouse.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {warehousesLocked && (
                      <p className="text-xs text-gray-500">Remove all items to change warehouse</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>To Warehouse *</Label>
                    <Select 
                      value={toWarehouse?.id || ''} 
                      onValueChange={(value) => handleWarehouseChange('to', value)}
                      disabled={warehousesLocked}
                    >
                      <SelectTrigger tabIndex={3}>
                        <SelectValue placeholder="Select destination warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses
                          .filter(warehouse => warehouse.id !== fromWarehouse?.id) // Exclude selected From warehouse
                          .map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.name} - {warehouse.location}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {warehousesLocked && (
                      <p className="text-xs text-gray-500">Remove all items to change warehouse</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Transfer *</Label>
                  <Input
                    id="reason"
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    placeholder="e.g., Stock rebalancing, Customer request, etc."
                    tabIndex={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Add Item Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Products to Transfer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Product *</Label>
                    <Select 
                      value={selectedProduct?.id || ''} 
                      onValueChange={(value) => {
                        const stockLevel = availableProducts.find(p => p.product_id === value)
                        if (stockLevel) {
                          const product: Product = {
                            id: stockLevel.product_id,
                            name: stockLevel.product_name || '',
                            sku: stockLevel.product_sku || '',
                            unit_price: 0
                          }
                          setSelectedProduct(product)
                          if (fromWarehouse) {
                            loadStockLevel(stockLevel.product_id, fromWarehouse.id)
                          }
                        } else {
                          setSelectedProduct(null)
                          setCurrentStock(null)
                        }
                        setQuantityError('')
                      }}
                      disabled={!fromWarehouse}
                    >
                      <SelectTrigger 
                        ref={productSelectRef} 
                        tabIndex={5}
                        id="product-select"
                      >
                        <SelectValue placeholder={fromWarehouse ? "Select a product" : "Select warehouse first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProducts.map((stockLevel) => (
                          <SelectItem key={stockLevel.product_id} value={stockLevel.product_id}>
                            {stockLevel.product_name} ({stockLevel.product_sku}) - Stock: {stockLevel.available_quantity}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {currentStock !== null && (
                      <p className="text-sm text-gray-600">
                        Available stock: <span className="font-semibold text-blue-600">{currentStock}</span>
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={transferQuantity}
                      onChange={(e) => {
                        const value = e.target.value
                        setTransferQuantity(value)
                        
                        // Parse the value for validation
                        const numericValue = parseInt(value) || 0
                        
                        // Validate quantity against current stock
                        if (value && currentStock !== null && numericValue > currentStock) {
                          setQuantityError(`Quantity cannot exceed available stock (${currentStock})`)
                        } else {
                          setQuantityError('')
                        }
                      }}
                      placeholder="Enter quantity"
                      className={quantityError ? 'border-red-500' : ''}
                      tabIndex={6}
                    />
                    {quantityError && (
                      <p className="text-sm text-red-600">{quantityError}</p>
                    )}
                  </div>
                </div>
                
                <Button 
                  type="button"
                  onClick={handleAddItem} 
                  className="w-full bg-[#52a852] hover:bg-[#4a964a] text-white"
                  tabIndex={7}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product to Transfer
                </Button>
              </CardContent>
            </Card>

            {/* Items List */}
            {transferItems.length > 0 && (
              <Card ref={transferItemsRef}>
                <CardHeader>
                  <CardTitle className="text-lg">Products in Transfer ({transferItems.length})</CardTitle>
                  <CardDescription>
                    From: <span className="font-semibold">{fromWarehouse?.name}</span> → To: <span className="font-semibold">{toWarehouse?.name}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transferItems.map((item, index) => (
                          <TableRow key={`${item.product_id}-${index}`}>
                            <TableCell className="font-medium">
                              {item.product_name}
                            </TableCell>
                            <TableCell className="font-mono text-sm text-gray-600">
                              {item.product_sku}
                            </TableCell>
                            <TableCell className="font-medium text-blue-600">
                              {item.quantity}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => {
                setIsCreateModalOpen(false)
                // Reset form state
                setTransferItems([])
                setSelectedProduct(null)
                setFromWarehouse(null)
                setToWarehouse(null)
                setTransferQuantity('')
                setTransferReason('')
                setTransferDate(new Date().toISOString().split('T')[0])
                setAvailableProducts([])
                setCurrentStock(null)
                setQuantityError('')
                setWarehousesLocked(false)
                setShowWarehouseChangeWarning(false)
                setPendingWarehouseChange(null)
                setShowReviewDialog(false)
                setShowSuccessDialog(false)
                setShowErrorDialog(false)
                setPreviewReferenceNumber('')
          setGeneratedReferenceNumber('')
              }}>
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={handleCreateTransfer}
                disabled={transferItems.length === 0}
                className="bg-[#52a852] hover:bg-[#4a964a] text-white"
                tabIndex={8}
              >
                Create Transfer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Warehouse Change Warning Dialog */}
      <Dialog open={showWarehouseChangeWarning} onOpenChange={setShowWarehouseChangeWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Warehouse?</DialogTitle>
            <DialogDescription>
              Changing the warehouse will clear all transfer data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All products in the transfer list</li>
                <li>Selected product and quantity</li>
                <li>Current stock information</li>
              </ul>
              The warehouse selection will be updated and you can start adding products again.
              <br />
              <br />
              Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelWarehouseChange}>
              Cancel
            </Button>
            <Button onClick={confirmWarehouseChange} className="bg-red-600 hover:bg-red-700 text-white">
              Clear Data and Change Warehouse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Transfer Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Review Transfer
            </DialogTitle>
            <DialogDescription>
              Please review the transfer details before creating
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transfer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Transfer Date</p>
                    <p className="text-sm">{new Date(transferDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Reference Number</p>
                    <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {previewReferenceNumber}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">From Warehouse</p>
                  <p className="text-sm font-semibold">{fromWarehouse?.name} - {fromWarehouse?.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">To Warehouse</p>
                  <p className="text-sm font-semibold">{toWarehouse?.name} - {toWarehouse?.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Reason</p>
                  <p className="text-sm">{transferReason}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Products to Transfer ({transferItems.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {transferItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-gray-600">SKU: {item.product_sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Items:</span>
                    <span className="font-semibold">{transferItems.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Quantity:</span>
                    <span className="font-semibold text-blue-600">
                      {transferItems.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmCreateTransfer} className="bg-[#52a852] hover:bg-[#4a964a] text-white">
              Create Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Transfer Created Successfully!
            </DialogTitle>
            <DialogDescription>
              Your transfer has been processed and stock movements have been recorded.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-800">Reference Number:</p>
              <p className="text-lg font-bold text-green-900">{createdTransferRef}</p>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>• Stock has been deducted from {fromWarehouse?.name}</p>
              <p>• Stock has been added to {toWarehouse?.name}</p>
              <p>• Transfer details have been saved to the system</p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={(open) => {
        setShowErrorDialog(open)
        if (!open) {
          // Focus back to product selection when error dialog closes
          setTimeout(() => {
            console.log('Attempting to focus product select after error dialog closes')
            
            // Try multiple methods to ensure focus works
            const productSelect = document.getElementById('product-select') as HTMLElement
            if (productSelect) {
              console.log('Found product select by ID, attempting focus')
              productSelect.focus()
              // Also try clicking to ensure it's properly activated
              productSelect.click()
            } else {
              console.log('Product select not found by ID, trying ref')
              if (productSelectRef.current) {
                productSelectRef.current.focus()
                productSelectRef.current.click()
              } else {
                console.log('Product select not found by ref, trying tabIndex')
                // Final fallback: find by tabIndex
                const productSelectByTab = document.querySelector('[tabindex="5"]') as HTMLElement
                if (productSelectByTab) {
                  productSelectByTab.focus()
                  productSelectByTab.click()
                }
              }
            }
          }, 500) // Increased timeout further
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Error
            </DialogTitle>
            <DialogDescription>
              An error occurred while processing your request.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>

          <DialogFooter>
            <Button onClick={closeErrorDialog} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Transfer Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Cancel Transfer
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this transfer? This action will:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <ul className="text-sm text-red-800 space-y-2">
                <li>• Reverse all stock movements</li>
                <li>• Return items to source warehouse</li>
                <li>• Remove items from destination warehouse</li>
                <li>• Mark transfer as cancelled</li>
              </ul>
            </div>
            
            <div className="text-sm text-gray-600">
              <p><strong>Transfer:</strong> {selectedTransfer?.reference_id}</p>
              <p><strong>Items:</strong> {selectedTransfer?.items.length} product{selectedTransfer?.items.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={isCancelling}>
              Keep Transfer
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmCancelTransfer}
              disabled={isCancelling}
              className="flex items-center gap-2"
            >
              {isCancelling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Cancelling...
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4" />
                  Cancel Transfer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}


