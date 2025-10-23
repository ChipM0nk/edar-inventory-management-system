'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { AppLayout } from '@/components/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import api from '@/lib/api'
import { 
  TransferTable, 
  TransferDetailsDialog, 
  NewTransferDialog, 
  TransferReviewDialog 
} from '@/components/transfers'

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
  const [transferNotes, setTransferNotes] = useState('')
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
  const [successFromWarehouse, setSuccessFromWarehouse] = useState<string>('')
  const [successToWarehouse, setSuccessToWarehouse] = useState<string>('')
  
  // Document upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

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
  }


  // Reset form function
  const resetForm = () => {
    setTransferItems([])
    setSelectedProduct(null)
    setFromWarehouse(null)
    setToWarehouse(null)
    setTransferQuantity('')
    setTransferReason('')
    setTransferNotes('')
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
    setUploadedFiles([])
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
        notes: transferNotes || null,
        transfer_date: transferDate,
        items: transferItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))
      }

      const response = await api.post('/transfers', transferData)
      const createdTransfer = response.data

      // Upload prepared documents if any
      if (uploadedFiles.length > 0) {
        try {
          const formData = new FormData()
          uploadedFiles.forEach((file) => {
            formData.append('documents', file)
          })
          formData.append('reference_type', 'transfer')
          formData.append('reference_id', createdTransfer.id)

          await api.post('/documents/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
        } catch (error) {
          console.error('Error uploading documents:', error)
          // Don't fail the entire operation if document upload fails
        }
      }

      // Store warehouse names for success dialog before resetting
      setSuccessFromWarehouse(fromWarehouse?.name || '')
      setSuccessToWarehouse(toWarehouse?.name || '')
      
      // Reset form and close modal
      setTransferItems([])
      setSelectedProduct(null)
      setFromWarehouse(null)
      setToWarehouse(null)
      setTransferQuantity('')
      setTransferReason('')
      setTransferNotes('')
      setTransferDate(new Date().toISOString().split('T')[0])
      setAvailableProducts([])
      setCurrentStock(null)
      setQuantityError('')
      setWarehousesLocked(false)
      setShowWarehouseChangeWarning(false)
      setPendingWarehouseChange(null)
      setIsCreateModalOpen(false)
      setShowReviewDialog(false)
      setUploadedFiles([])
      
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
                <TransferTable
                  transfers={filteredTransfers}
                  isLoading={isLoadingData}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onTransferClick={handleTransferClick}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredTransfers.length}
                />
              </CardContent>
            </Card>
          </div>
        </div>

      {/* Transfer Detail Modal */}
      <TransferDetailsDialog
        isOpen={isModalOpen}
        onClose={closeModal}
        transfer={selectedTransfer}
        onTransferUpdate={loadTransfers}
      />

      {/* Create Transfer Modal */}
      <NewTransferDialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        warehouses={warehouses}
        availableProducts={availableProducts}
        currentStock={currentStock}
        quantityError={quantityError}
        warehousesLocked={warehousesLocked}
        transferDate={transferDate}
        transferReason={transferReason}
        transferNotes={transferNotes}
        transferQuantity={transferQuantity}
        selectedProduct={selectedProduct}
        fromWarehouse={fromWarehouse}
        toWarehouse={toWarehouse}
        transferItems={transferItems}
        uploadedFiles={uploadedFiles}
        user={user}
        onTransferDateChange={setTransferDate}
        onTransferReasonChange={setTransferReason}
        onTransferNotesChange={setTransferNotes}
        onTransferQuantityChange={setTransferQuantity}
        onProductSelect={(product: Product | null) => {
          setSelectedProduct(product)
          if (product && fromWarehouse) {
            loadStockLevel(product.id, fromWarehouse.id)
          }
        }}
        onFromWarehouseChange={handleWarehouseChange}
        onToWarehouseChange={handleWarehouseChange}
        onAddItem={handleAddItem}
        onRemoveItem={handleRemoveItem}
        onFilesChange={setUploadedFiles}
        onShowWarehouseChangeWarning={() => setShowWarehouseChangeWarning(true)}
        onShowReviewDialog={() => setShowReviewDialog(true)}
        hasUnsavedChanges={() => {
          const hasFormData = !!(fromWarehouse || toWarehouse || transferReason || transferNotes || transferDate !== new Date().toISOString().split('T')[0])
          const hasTransferItems = transferItems.length > 0
          const hasSelectedProduct = !!(selectedProduct || transferQuantity)
          const hasUploadedDocs = uploadedFiles.length > 0
          
          return hasFormData || hasTransferItems || hasSelectedProduct || hasUploadedDocs
        }}
        onResetForm={resetForm}
      />

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
      <TransferReviewDialog
        isOpen={showReviewDialog}
        onClose={() => setShowReviewDialog(false)}
        onConfirm={confirmCreateTransfer}
        transferItems={transferItems}
        fromWarehouse={fromWarehouse}
        toWarehouse={toWarehouse}
        transferDate={transferDate}
        transferReason={transferReason}
        transferNotes={transferNotes}
        uploadedFiles={uploadedFiles}
        user={user}
      />

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
              <p>• Stock has been deducted from {successFromWarehouse || 'source warehouse'}</p>
              <p>• Stock has been added to {successToWarehouse || 'destination warehouse'}</p>
              <p>• Transfer details have been saved to the system</p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => {
              setShowSuccessDialog(false)
              setSuccessFromWarehouse('')
              setSuccessToWarehouse('')
            }} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
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

    </AppLayout>
  )
}


