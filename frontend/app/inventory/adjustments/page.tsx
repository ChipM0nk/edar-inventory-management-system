'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { AppLayout } from '@/components/app-layout'
import { AdjustmentDetailsDialog, AdjustmentReviewDialog } from '@/components/adjustments'
import { DocumentUpload } from '@/components/documents'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Search, RefreshCw, ArrowLeft, Package, Calendar, User, DollarSign, FileText, Hash, AlertTriangle, Upload, X } from 'lucide-react'
import api from '@/lib/api'
import { useConfirm } from '@/hooks/use-confirm'
import { useNotice } from '@/hooks/use-notice'

interface Product {
  id: string
  name: string
  sku: string
  unit_price: number
}

interface Warehouse {
  id: string
  name: string
  location: string
}

interface StockLevel {
  id: string
  product_id: string
  warehouse_id: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
  min_stock_level: number
  max_stock_level?: number
  last_updated: string
  product_name: string
  product_sku: string
  warehouse_name: string
}

interface AdjustmentItem {
  product_id: string
  product_name: string
  product_sku: string
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
  warehouse_id: string
  warehouse_name?: string
  total_quantity: number
  processed_by: string
  processed_date: string
  created_at: string
  items: AdjustmentItem[]
  status?: string
  notes?: string | null
}

export default function AdjustmentsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [ConfirmDialog, confirm] = useConfirm()
  const [NoticeDialog, notice] = useNotice()
  
  // State management
  const [adjustments, setAdjustments] = useState<Adjustment[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredAdjustments, setFilteredAdjustments] = useState<Adjustment[]>([])
  const [selectedAdjustment, setSelectedAdjustment] = useState<Adjustment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  // Create adjustment form state
  const [adjustmentItems, setAdjustmentItems] = useState<AdjustmentItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('')
  const [adjustmentCostPrice, setAdjustmentCostPrice] = useState('')
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [adjustmentReasonOther, setAdjustmentReasonOther] = useState('')
  const [adjustmentDate, setAdjustmentDate] = useState(new Date().toISOString().split('T')[0])
  const [currentStockLevel, setCurrentStockLevel] = useState<number | null>(null)
  const [isCheckingStock, setIsCheckingStock] = useState(false)
  const [generatedReferenceNumber, setGeneratedReferenceNumber] = useState<string | null>(null)
  
  // Product search state
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1)
  
  // Document upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false)
  const [showDocumentUpload, setShowDocumentUpload] = useState(true)
  const [adjustmentNotes, setAdjustmentNotes] = useState('')
  
  // Close warning state
  const [showCloseWarning, setShowCloseWarning] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  
  // Refs for form inputs
  const productSearchInputRef = useRef<HTMLInputElement>(null)
  const addRadioRef = useRef<HTMLInputElement>(null)
  const subtractRadioRef = useRef<HTMLInputElement>(null)
  
  
  // Reference fields for PO/SO connections
  const [referenceType, setReferenceType] = useState<string>('')
  const [referenceId, setReferenceId] = useState<string>('')
  const [externalReference, setExternalReference] = useState<string>('')
  const [adjustmentReasonType, setAdjustmentReasonType] = useState<string>('')
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [salesOrders, setSalesOrders] = useState<any[]>([])
  // Review dialog state
  const [isReviewOpen, setIsReviewOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Load data when user is available
  useEffect(() => {
    if (user) {
      loadAdjustments()
      loadProducts()
      loadWarehouses()
      loadPurchaseOrders()
      loadSalesOrders()
    }
  }, [user])

  // Handle browser beforeunload event (back button, close tab, etc.)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return 'You have unsaved changes. Are you sure you want to leave?'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [adjustmentItems, uploadedFiles, selectedWarehouse, selectedProduct, adjustmentQuantity, adjustmentCostPrice, adjustmentNotes])

  // Filter products based on search term
  useEffect(() => {
    if (productSearchTerm.trim() === '') {
      setFilteredProducts(products)
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(productSearchTerm.toLowerCase())
      )
      setFilteredProducts(filtered)
    }
  }, [productSearchTerm, products])

  // Fetch current stock when both product and warehouse are selected
  useEffect(() => {
    if (selectedProduct && selectedWarehouse && currentStockLevel === null) {
      const fetchStock = async () => {
        setIsCheckingStock(true)
        try {
          const currentStock = await checkStockLevel(selectedProduct.id, selectedWarehouse.id)
          setCurrentStockLevel(currentStock)
        } catch (error) {
          console.error('Error checking stock:', error)
          setCurrentStockLevel(0)
        } finally {
          setIsCheckingStock(false)
        }
      }
      fetchStock()
    }
  }, [selectedProduct, selectedWarehouse, currentStockLevel])

  // Check stock level when quantity changes for subtraction validation
  useEffect(() => {
    const quantity = parseInt(adjustmentQuantity)
    if (adjustmentType === 'subtract' && selectedProduct && selectedWarehouse && adjustmentQuantity.trim() && quantity > 0) {
      const checkStock = async () => {
        setIsCheckingStock(true)
        try {
          const currentStock = await checkStockLevel(selectedProduct.id, selectedWarehouse.id)
          setCurrentStockLevel(currentStock)
        } catch (error) {
          console.error('Error checking stock:', error)
          setCurrentStockLevel(null)
        } finally {
          setIsCheckingStock(false)
        }
      }
      checkStock()
    }
    // Don't reset currentStockLevel when switching adjustment types
    // Only reset when product or warehouse changes (handled in their respective onChange handlers)
  }, [adjustmentType, selectedProduct, selectedWarehouse, adjustmentQuantity])

  // Filter adjustments based on search term
  useEffect(() => {
    let filtered = adjustments

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (adjustment) =>
          adjustment.reference_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          adjustment.processed_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
          adjustment.items.some(item => 
            item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.product_sku.toLowerCase().includes(searchTerm.toLowerCase())
          )
      )
    }

    setFilteredAdjustments(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }, [searchTerm, adjustments])

  // Pagination logic
  const totalPages = Math.ceil(filteredAdjustments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentAdjustments = filteredAdjustments.slice(startIndex, endIndex)

  const loadAdjustments = async () => {
    try {
      setIsLoadingData(true)
      const response = await api.get('/adjustments?limit=100')
      const adjustments = response.data.adjustments || []
      
      console.log('Adjustments from API:', adjustments)
      
      // Convert backend adjustments to frontend format and load item counts
      const convertedAdjustments = await Promise.all(adjustments.map(async (adj: any) => {
        // Load item count for each adjustment
        let itemCount = 0
        try {
          const itemResponse = await api.get(`/adjustments/${adj.id}`)
          itemCount = itemResponse.data.items ? itemResponse.data.items.length : 0
        } catch (error) {
          console.warn(`Failed to load items for adjustment ${adj.id}:`, error)
        }

        return {
          id: adj.id,
          reference_id: adj.reference_number,
          warehouse_id: adj.warehouse_id,
          warehouse_name: adj.warehouse_name || 'N/A',
          total_quantity: adj.total_quantity,
          processed_by: adj.processed_by_first_name && adj.processed_by_last_name 
            ? `${adj.processed_by_first_name} ${adj.processed_by_last_name}`
            : adj.created_by_first_name && adj.created_by_last_name
            ? `${adj.created_by_first_name} ${adj.created_by_last_name}`
            : 'Unknown',
          processed_date: adj.processed_date || adj.created_at,
          created_at: adj.created_at,
          items: [], // Will be loaded when adjustment details are opened
          status: adj.status,
          notes: adj.notes
        }
      }))
      
      console.log('Converted adjustments:', convertedAdjustments)
      setAdjustments(convertedAdjustments)
    } catch (error) {
      console.error('Error loading adjustments:', error)
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

  const loadPurchaseOrders = async () => {
    try {
      console.log('Loading purchase orders...')
      const response = await api.get('/purchase-orders?limit=100')
      console.log('Purchase orders API response:', response)
      console.log('Response data:', response.data)
      console.log('Response status:', response.status)
      
      const purchaseOrders = response.data || []
      console.log('Loaded purchase orders for adjustments:', purchaseOrders)
      console.log('Number of purchase orders:', purchaseOrders.length)
      
      setPurchaseOrders(purchaseOrders)
    } catch (error: any) {
      console.error('Error loading purchase orders:', error)
      console.error('Error details:', error.response?.data)
      console.error('Error status:', error.response?.status)
    }
  }

  const loadSalesOrders = async () => {
    try {
      // Placeholder for sales orders - implement when sales order API is available
      setSalesOrders([])
    } catch (error) {
      console.error('Error loading sales orders:', error)
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

  const generateReferenceNumber = (): string => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    
    return `ADJ-${year}${month}${day}-${hours}${minutes}${seconds}`
  }

  const resetForm = () => {
    setAdjustmentItems([])
    setAdjustmentQuantity('')
    setAdjustmentCostPrice('')
    setAdjustmentType('add')
    setAdjustmentReason('')
    setAdjustmentReasonOther('')
    setAdjustmentDate(new Date().toISOString().split('T')[0])
    setSelectedProduct(null)
    setSelectedWarehouse(null)
    setCurrentStockLevel(null)
    setGeneratedReferenceNumber(null)
    setAdjustmentNotes('')
    setUploadedFiles([])
    setShowDocumentUpload(false)
    // Reset reference fields
    setReferenceType('')
    setReferenceId('')
    setExternalReference('')
    setAdjustmentReasonType('')
    // Reset product search
    setProductSearchTerm('')
    setShowProductDropdown(false)
    // Reset document upload
    setUploadedFiles([])
    setIsUploadingDocuments(false)
  }

  const handleAdjustmentClick = (adjustment: Adjustment) => {
    setSelectedAdjustment(adjustment)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedAdjustment(null)
  }

  const checkStockLevel = async (productId: string, warehouseId: string): Promise<number> => {
    try {
      setIsCheckingStock(true)
      const response = await api.get(`/stock-levels/${productId}/${warehouseId}`)
      const data = response.data || {}
      const qty = typeof data.quantity === 'number' ? data.quantity : (typeof data.available_quantity === 'number' ? data.available_quantity : 0)
      console.log('checkStockLevel', { productId, warehouseId, data, qty })
      return qty
    } catch (error) {
      console.error('Error checking stock level:', error)
      return 0
    } finally {
      setIsCheckingStock(false)
    }
  }

  const handleAddItem = async () => {
    const quantity = parseInt(adjustmentQuantity)
    const costPrice = parseFloat(adjustmentCostPrice)
    const finalReason = adjustmentReason === 'Other' ? adjustmentReasonOther.trim() : adjustmentReason
    
    if (!selectedProduct || !selectedWarehouse || !adjustmentQuantity.trim() || quantity <= 0 || !adjustmentCostPrice.trim() || costPrice < 0 || !finalReason) {
      await notice({
        title: 'Invalid fields',
        description: 'Please fill in all required fields with valid values',
        variant: 'warning',
      })
      return
    }

    // Check stock level for subtraction adjustments
    if (adjustmentType === 'subtract') {
      setIsCheckingStock(true)
      try {
        const currentStock = await checkStockLevel(selectedProduct.id, selectedWarehouse.id)
        setCurrentStockLevel(currentStock)
        
        if (currentStock < quantity) {
          await notice({
            title: 'Insufficient stock',
            description: `Current stock: ${currentStock}, trying to subtract: ${quantity}`,
            variant: 'warning',
          })
          setIsCheckingStock(false)
          return
        }
      } catch (error) {
        console.error('Error checking stock:', error)
        await notice({
          title: 'Check failed',
          description: 'Error checking stock level. Please try again.',
          variant: 'warning',
        })
        setIsCheckingStock(false)
        return
      }
      setIsCheckingStock(false)
    }

    const finalQuantity = adjustmentType === 'add' ? quantity : -quantity

    const newItem: AdjustmentItem = {
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      product_sku: selectedProduct.sku,
      quantity: finalQuantity,
      cost_price: costPrice,
      reason: finalReason
    }

    setAdjustmentItems([...adjustmentItems, newItem])
    
    // Reset form (but keep warehouse selected)
    setSelectedProduct(null)
    setAdjustmentQuantity('')
    setAdjustmentCostPrice('')
    setAdjustmentType('add')
    setAdjustmentReason('')
    setAdjustmentReasonOther('')
    setCurrentStockLevel(null)
    setProductSearchTerm('')
    setShowProductDropdown(false)
    
    // Focus back to product search input
    setTimeout(() => {
      if (productSearchInputRef.current) {
        productSearchInputRef.current.focus()
      }
    }, 100)
  }

  const handleRemoveItem = (index: number) => {
    setAdjustmentItems(adjustmentItems.filter((_, i) => i !== index))
  }

  const handleDocumentUpload = async () => {
    if (uploadedFiles.length === 0) {
      await notice({
        title: 'No files',
        description: 'Please select files to upload',
        variant: 'warning',
      })
      return
    }

    try {
      setIsUploadingDocuments(true)
      // For adjustment creation, we keep files in state until adjustment is created
      // This simulates upload success
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate upload delay
      
      await notice({
        title: 'Files ready',
        description: `${uploadedFiles.length} file(s) ready for upload with adjustment`,
        variant: 'success',
      })
      
      // Hide the upload section after "upload"
      setShowDocumentUpload(false)
    } catch (error) {
      console.error('Upload error:', error)
      await notice({
        title: 'Upload failed',
        description: 'Failed to prepare files for upload',
        variant: 'warning',
      })
    } finally {
      setIsUploadingDocuments(false)
    }
  }

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    const hasFormData = selectedWarehouse || selectedProduct || adjustmentQuantity || adjustmentCostPrice || adjustmentNotes
    const hasAdjustmentItems = adjustmentItems.length > 0
    const hasUploadedDocs = uploadedFiles.length > 0
    
    return hasFormData || hasAdjustmentItems || hasUploadedDocs
  }

  // Document helper functions
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }



  // Handle close warning dialog
  const handleCloseWarning = (confirmed: boolean) => {
    setShowCloseWarning(false)
    if (confirmed) {
      if (pendingNavigation) {
        // Navigation was requested
        router.push(pendingNavigation)
      } else {
        // Dialog closing was requested
        setIsCreateModalOpen(false)
        resetForm()
      }
    }
    setPendingNavigation(null)
  }

  // Handle navigation with warning
  const handleNavigation = (path: string) => {
    if (hasUnsavedChanges()) {
      setPendingNavigation(path)
      setShowCloseWarning(true)
    } else {
      router.push(path)
    }
  }

  const handleCreateAdjustment = async () => {
    if (adjustmentItems.length === 0) {
      await notice({
        title: 'No items',
        description: 'Please add at least one item to the adjustment',
        variant: 'info',
      })
        return
      }
      
    if (!user) {
      await notice({
        title: 'Not authenticated',
        description: 'User not authenticated',
        variant: 'warning',
      })
      return
    }

    try {
      // Generate reference number
      const generatedRef = generateReferenceNumber()
      setGeneratedReferenceNumber(generatedRef)

      // Calculate total quantity
      const totalQuantity = adjustmentItems.reduce((sum, item) => sum + Math.abs(item.quantity), 0)

      // Ensure warehouse is selected
      if (!selectedWarehouse) {
        await notice({
          title: 'No warehouse selected',
          description: 'Please select a warehouse for the adjustment',
          variant: 'warning',
        })
        return
      }

      // Create adjustment using backend API
      const adjustmentPayload = {
        reference_number: generatedRef,
        adjustment_date: new Date(adjustmentDate).toISOString(),
        warehouse_id: selectedWarehouse.id,
        total_quantity: totalQuantity,
        reason: 'Inventory adjustment',
        status: 'completed',
        created_by: user.id,
        notes: adjustmentNotes || null,
        external_reference: externalReference || null,
        // Reference fields for PO/SO connections
        reference_type: referenceType || null,
        reference_id: referenceId || null,
        adjustment_reason: adjustmentReasonType || null,
        items: adjustmentItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          cost_price: item.cost_price,
          reason: item.reason,
        }))
      }

      console.log('Sending adjustment payload:', adjustmentPayload)
      
      const adjustmentResponse = await api.post('/adjustments', adjustmentPayload)
      const createdAdjustmentId = adjustmentResponse.data?.id

      // Upload documents if any
      if (uploadedFiles.length > 0 && createdAdjustmentId) {
        try {
          setIsUploadingDocuments(true)
          
          const formData = new FormData()
          uploadedFiles.forEach((file) => {
            formData.append('documents', file)
          })
          formData.append('reference_type', 'adjustment')
          formData.append('reference_id', createdAdjustmentId)

          await api.post('/documents/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
          
          console.log('Documents uploaded successfully')
        } catch (documentError) {
          console.error('Error uploading documents:', documentError)
          // Don't fail the entire adjustment creation if document upload fails
          await notice({
            title: 'Partial success',
            description: 'Adjustment created, but some documents failed to upload. You can try uploading them later.',
            variant: 'warning',
          })
        } finally {
          setIsUploadingDocuments(false)
        }
      }

      // Reset form and close modal
      resetForm()
      setIsCreateModalOpen(false)
      
      // Reload adjustments
      await loadAdjustments()
      
      await notice({
        title: 'Adjustment created',
        description: `Reference Number: ${externalReference || generatedReferenceNumber}${uploadedFiles.length > 0 ? `\nDocuments uploaded: ${uploadedFiles.length}` : ''}`,
        variant: 'success',
        okText: 'OK',
      })
    } catch (error: any) {
      console.error('Error creating adjustment:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred'
      await notice({
        title: 'Failed to create adjustment',
        description: errorMessage,
        variant: 'warning',
      })
      setGeneratedReferenceNumber(null) // Reset reference number on error
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
                <h1 className="text-3xl font-bold text-gray-900">Stock Adjustments</h1>
                <p className="mt-2 text-gray-600">Manage inventory adjustments and corrections</p>
              </div>
              <div className="flex items-center gap-4">
                {/* Processed By - Right side of header */}
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Processed by:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={loadAdjustments}
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
                    New Adjustment
                  </Button>
                </div>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Stock Adjustments</CardTitle>
                <CardDescription>
                  View and manage all inventory adjustments
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

                {/* Adjustments Table */}
                {isLoadingData ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading adjustments...</p>
                  </div>
                ) : currentAdjustments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {searchTerm 
                        ? 'No adjustments found matching your search' 
                        : 'No adjustments available'
                      }
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      {searchTerm
                        ? 'Try adjusting your search terms' 
                        : 'Adjustments will appear here once created'
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
                          <TableHead>Warehouse</TableHead>
                          <TableHead>Processed At</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentAdjustments.map((adjustment) => (
                          <TableRow 
                            key={adjustment.reference_id}
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleAdjustmentClick(adjustment)}
                          >
                            <TableCell className="font-mono font-medium text-blue-600 hover:text-blue-800">
                              {adjustment.reference_id}
                            </TableCell>
                            <TableCell>
                              {adjustment.status === 'cancelled' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Cancelled</span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {adjustment.warehouse_name || 'N/A'}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {adjustment.processed_by}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {formatDate(adjustment.processed_date)}
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
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredAdjustments.length)} of {filteredAdjustments.length} results
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

      {/* Adjustment Detail Modal */}
        <AdjustmentDetailsDialog
          adjustment={selectedAdjustment}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onOrderUpdated={loadAdjustments}
        />

      {/* Create Adjustment Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
        if (!open) {
          // Check for unsaved changes before closing
          if (hasUnsavedChanges()) {
            setPendingNavigation(null) // No navigation, just closing dialog
            setShowCloseWarning(true)
            return // Don't close the dialog yet
          }
          resetForm() // Clear form and success message when modal is closed
        }
        setIsCreateModalOpen(open)
      }}>
        {ConfirmDialog}
        {NoticeDialog}
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Plus className="h-5 w-5" />
                  Create New Adjustment
                </DialogTitle>
                <DialogDescription>
                  Add inventory adjustments to correct stock levels
                </DialogDescription>
              </div>
              {/* Processed By - Right side of modal header */}
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Processed by:</span>
                <span className="text-sm font-medium text-gray-900">
                  {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
                </span>
              </div>
            </div>
          </DialogHeader>
          
          {/* Success Message with Reference Number */}
          {generatedReferenceNumber && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-green-800">Adjustment Created Successfully!</h3>
                  <p className="text-sm text-green-700">
                    Reference Number: <span className="font-semibold">{generatedReferenceNumber}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            {/* Header Info - Compact */}
            <div className="p-4 bg-gray-50 rounded-lg">
              {/* Main form fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="adjustment-date" className="text-xs font-medium text-gray-600">Adjustment Date *</Label>
                  <Input
                    id="adjustment-date"
                    type="date"
                    value={adjustmentDate}
                    onChange={(e) => setAdjustmentDate(e.target.value)}
                    className="mt-1"
                    tabIndex={1}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Warehouse *</Label>
                  <Select value={selectedWarehouse?.id || ''} onValueChange={async (value) => {
                    const warehouse = warehouses.find(w => w.id === value)
                    if (warehouse && selectedWarehouse && warehouse.id !== selectedWarehouse.id) {
                      // Show warning before switching warehouse
                      if (adjustmentItems.length > 0) {
                        const confirmed = await confirm({
                          title: 'Change warehouse?',
                          description: 'Changing warehouse will clear all current adjustment items.',
                          confirmText: 'Change Warehouse',
                          cancelText: 'Keep Current',
                          variant: 'warning',
                        })
                        if (confirmed) {
                          setSelectedWarehouse(warehouse)
                          setAdjustmentItems([]) // Clear all items
                          setSelectedProduct(null)
                          setCurrentStockLevel(null)
                          setProductSearchTerm('')
                          setShowProductDropdown(false)
                          // Clear add-item inputs and preview state
                          setAdjustmentQuantity('')
                          setAdjustmentCostPrice('')
                          setAdjustmentType('add')
                          setAdjustmentReason('')
                          setAdjustmentReasonOther('')
                          setAdjustmentNotes('')
                          setUploadedFiles([])
                          setShowDocumentUpload(false)
                        }
                      } else {
                        setSelectedWarehouse(warehouse)
                        setSelectedProduct(null)
                        setCurrentStockLevel(null)
                        setProductSearchTerm('')
                        setShowProductDropdown(false)
                        // Clear add-item inputs and preview state
                        setAdjustmentQuantity('')
                        setAdjustmentCostPrice('')
                        setAdjustmentType('add')
                        setAdjustmentReason('')
                        setAdjustmentReasonOther('')
                        setAdjustmentNotes('')
                        setUploadedFiles([])
                        setShowDocumentUpload(false)
                      }
                    } else {
                      setSelectedWarehouse(warehouse || null)
                      setSelectedProduct(null)
                      setCurrentStockLevel(null)
                      setProductSearchTerm('')
                      setShowProductDropdown(false)
                      // Clear add-item inputs and preview state
                      setAdjustmentQuantity('')
                      setAdjustmentCostPrice('')
                      setAdjustmentType('add')
                      setAdjustmentReason('')
                      setAdjustmentReasonOther('')
                      setAdjustmentNotes('')
                      setUploadedFiles([])
                      setShowDocumentUpload(false)
                    }
                  }}>
                    <SelectTrigger className="mt-1" tabIndex={2}>
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name} - {warehouse.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="reference" className="text-xs font-medium text-gray-600">External Reference</Label>
                  <Input
                    id="reference"
                    value={externalReference}
                    onChange={(e) => setExternalReference(e.target.value)}
                    placeholder="PO, Sales, Transfer, etc."
                    className="mt-1"
                    tabIndex={3}
                  />
                </div>
              </div>
            </div>

            {/* Add Item Form - Compact */}
            {selectedWarehouse && (
              <Card className="border-2 border-dashed border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Item to {selectedWarehouse.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Product Selection */}
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Product *</Label>
                    <div className="relative mt-1">
                      <Input
                        ref={productSearchInputRef}
                        value={selectedProduct ? `${selectedProduct.name} (${selectedProduct.sku})` : productSearchTerm}
                        tabIndex={3}
                        onChange={(e) => {
                          const value = e.target.value
                          setProductSearchTerm(value)
                          setSelectedProduct(null)
                          setShowProductDropdown(true)
                          setCurrentStockLevel(null)
                          setSelectedProductIndex(-1)
                        }}
                        onKeyDown={(e) => {
                          if (!showProductDropdown || filteredProducts.length === 0) return

                          switch (e.key) {
                            case 'ArrowDown':
                              e.preventDefault()
                              setSelectedProductIndex(prev => 
                                prev < filteredProducts.length - 1 ? prev + 1 : 0
                              )
                              break
                            case 'ArrowUp':
                              e.preventDefault()
                              setSelectedProductIndex(prev => 
                                prev > 0 ? prev - 1 : filteredProducts.length - 1
                              )
                              break
                            case 'Enter':
                              e.preventDefault()
                              if (selectedProductIndex >= 0 && selectedProductIndex < filteredProducts.length) {
                                const product = filteredProducts[selectedProductIndex]
                                setSelectedProduct(product)
                                setProductSearchTerm('')
                                setShowProductDropdown(false)
                                setSelectedProductIndex(-1)
                                
                                // Focus on the Add radio button after product selection
                                setTimeout(() => {
                                  if (addRadioRef.current) {
                                    addRadioRef.current.focus()
                                  }
                                }, 100)
                              }
                              break
                            case 'Escape':
                              setShowProductDropdown(false)
                              setSelectedProductIndex(-1)
                              break
                          }
                        }}
                        onFocus={() => {
                          setShowProductDropdown(true)
                          setSelectedProductIndex(-1)
                        }}
                        onBlur={() => {
                          // Delay hiding dropdown to allow for selection
                          setTimeout(() => setShowProductDropdown(false), 200)
                        }}
                        placeholder="Search products by name or SKU..."
                        className="pr-8"
                      />
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      
                      {/* Dropdown with filtered products */}
                      {showProductDropdown && filteredProducts.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {filteredProducts.map((product, index) => (
                            <div
                              key={product.id}
                              className={`px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                                index === selectedProductIndex 
                                  ? 'bg-blue-100 text-blue-900' 
                                  : 'hover:bg-gray-50'
                              }`}
                              tabIndex={-1}
                              onClick={() => {
                                setSelectedProduct(product)
                                setProductSearchTerm('')
                                setShowProductDropdown(false)
                                setSelectedProductIndex(-1)
                                
                                // Focus on the Add radio button after product selection
                                setTimeout(() => {
                                  if (addRadioRef.current) {
                                    addRadioRef.current.focus()
                                  }
                                }, 100)
                              }}
                            >
                              <div className="font-medium text-sm">{product.name}</div>
                              <div className="text-xs opacity-75">SKU: {product.sku}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* No results message */}
                      {showProductDropdown && productSearchTerm && filteredProducts.length === 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3">
                          <div className="text-sm text-gray-500 text-center">
                            No products found matching "{productSearchTerm}"
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                
                  {/* Current Stock and Adjustment Type - Compact */}
                  {selectedProduct && selectedWarehouse && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Current Stock:</span>
                        {isCheckingStock ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500"></div>
                            <span className="text-xs text-gray-500">Loading...</span>
                          </div>
                        ) : (
                          <span className="text-sm font-semibold text-gray-900">
                            {currentStockLevel !== null ? currentStockLevel : 'N/A'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mb-3">
                        {selectedProduct.name} in {selectedWarehouse.name}
                      </div>
                      
                      {/* Adjustment Type - Inline */}
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-medium text-gray-600">Type:</span>
                        <div className="flex gap-3">
                          <label className="flex items-center space-x-1">
                            <input
                              ref={addRadioRef}
                              type="radio"
                              name="adjustmentType"
                              value="add"
                              checked={adjustmentType === 'add'}
                              onChange={(e) => setAdjustmentType(e.target.value as 'add' | 'subtract')}
                              className="text-green-600"
                              tabIndex={4}
                            />
                            <span className="text-green-600 text-sm font-medium">Add</span>
                          </label>
                          <label className="flex items-center space-x-1">
                            <input
                              ref={subtractRadioRef}
                              type="radio"
                              name="adjustmentType"
                              value="subtract"
                              checked={adjustmentType === 'subtract'}
                              onChange={(e) => setAdjustmentType(e.target.value as 'add' | 'subtract')}
                              className="text-red-600"
                              tabIndex={5}
                            />
                            <span className="text-red-600 text-sm font-medium">Subtract</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quantity, Cost Price, and Reason - Compact */}
                  {selectedProduct && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="quantity" className="text-xs font-medium text-gray-600">Quantity *</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={adjustmentQuantity}
                          onChange={(e) => {
                            const value = e.target.value
                            // Remove leading zeros and prevent negative numbers
                            const cleanValue = value.replace(/^0+/, '') || ''
                            if (cleanValue === '' || (parseInt(cleanValue) > 0 && cleanValue === parseInt(cleanValue).toString())) {
                              setAdjustmentQuantity(cleanValue)
                            }
                          }}
                          placeholder="Enter quantity"
                          className="mt-1"
                          tabIndex={6}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="cost_price" className="text-xs font-medium text-gray-600">
                          Cost Price *
                          {selectedProduct && (
                            <span className="ml-2 text-gray-500 font-normal">
                              (Unit Price: ₱{selectedProduct.unit_price.toFixed(2)})
                            </span>
                          )}
                        </Label>
                        <Input
                          id="cost_price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={adjustmentCostPrice}
                          onChange={(e) => {
                            const value = e.target.value
                            // Allow decimal numbers and prevent negative numbers
                            if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                              setAdjustmentCostPrice(value)
                            }
                          }}
                          placeholder="Enter cost price"
                          className="mt-1"
                          tabIndex={7}
                        />
                        {selectedProduct && adjustmentCostPrice && parseFloat(adjustmentCostPrice) >= selectedProduct.unit_price && (
                          <p className="text-red-500 text-xs mt-1">
                            ⚠️ Cost price should be less than unit price.
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="reason" className="text-xs font-medium text-gray-600">Reason *</Label>
                        <Select value={adjustmentReason} onValueChange={setAdjustmentReason}>
                          <SelectTrigger className="mt-1" tabIndex={8}>
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Damaged Goods">Damaged Goods</SelectItem>
                            <SelectItem value="Expired Products">Expired Products</SelectItem>
                            <SelectItem value="Lost Inventory">Lost Inventory</SelectItem>
                            <SelectItem value="Found Inventory">Found Inventory</SelectItem>
                            <SelectItem value="Supplier Return">Supplier Return</SelectItem>
                            <SelectItem value="Customer Return">Customer Return</SelectItem>
                            <SelectItem value="Quality Issues">Quality Issues</SelectItem>
                            <SelectItem value="Theft">Theft</SelectItem>
                            <SelectItem value="Cycle Count Adjustment">Cycle Count Adjustment</SelectItem>
                            <SelectItem value="Transfer Error">Transfer Error</SelectItem>
                            <SelectItem value="System Error">System Error</SelectItem>
                            <SelectItem value="Receiving Discrepancy">Receiving Discrepancy</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {/* Other reason text field */}
                        {adjustmentReason === 'Other' && (
                          <Input
                            value={adjustmentReasonOther}
                            onChange={(e) => setAdjustmentReasonOther(e.target.value)}
                            placeholder="Please specify the reason"
                            className="mt-2"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Preview and Add Button - Compact */}
                  {adjustmentQuantity.trim() && parseInt(adjustmentQuantity) > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          {adjustmentType === 'add' ? (
                            <span className="text-green-600 font-medium">+{adjustmentQuantity} (Add)</span>
                          ) : (
                            <span className="text-red-600 font-medium">-{adjustmentQuantity} (Subtract)</span>
                          )}
                          {adjustmentCostPrice.trim() && (
                            <span className="ml-2 text-gray-600">@ ₱{parseFloat(adjustmentCostPrice).toFixed(2)} each</span>
                          )}
                        </div>
                        {adjustmentCostPrice.trim() && adjustmentQuantity.trim() && (
                          <div className="text-sm font-semibold text-gray-700">
                            ₱{(parseFloat(adjustmentCostPrice) * parseInt(adjustmentQuantity)).toFixed(2)}
                          </div>
                        )}
                      </div>
                      {adjustmentType === 'subtract' && currentStockLevel !== null && (
                        <div className="text-xs text-gray-600 mt-1">
                          Current stock: {currentStockLevel}
                          {currentStockLevel < parseFloat(adjustmentQuantity) && (
                            <span className="text-red-600 font-medium ml-2">⚠️ Insufficient stock!</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleAddItem} 
                    disabled={isCheckingStock || (adjustmentType === 'subtract' && currentStockLevel !== null && currentStockLevel < parseInt(adjustmentQuantity))}
                    className="w-full bg-[#52a852] hover:bg-[#4a964a] text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                    tabIndex={9}
                  >
                    {isCheckingStock ? 'Checking Stock...' : 'Add Item'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Items List - Compact */}
            {adjustmentItems.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                      {adjustmentItems.length}
                    </span>
                    Adjustment Items
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Items to be adjusted in {selectedWarehouse?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[30%]">Product</TableHead>
                          <TableHead className="w-[15%]">SKU</TableHead>
                          <TableHead className="w-[15%]">Quantity</TableHead>
                          <TableHead className="w-[15%]">Unit Price</TableHead>
                          <TableHead className="w-[15%]">Total</TableHead>
                          <TableHead className="w-[10%]">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {adjustmentItems.map((item, index) => (
                          <TableRow key={`${item.product_id}-${index}`}>
                            <TableCell>
                              <div>
                                <div className="font-medium text-sm text-gray-900">
                                  {item.product_name}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  Reason: {item.reason}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-sm text-gray-600">
                                {item.product_sku}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`font-medium text-sm ${item.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {item.quantity > 0 ? '+' : ''}{item.quantity}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-900">
                                ₱{item.cost_price.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-sm text-gray-900">
                                ₱{(Math.abs(item.quantity) * item.cost_price).toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
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

            {/* Notes Section - Separate */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <h3 className="text-base font-semibold text-gray-900">Notes (Optional)</h3>
              </div>
              <textarea
                id="adjustment-notes"
                value={adjustmentNotes}
                onChange={(e) => setAdjustmentNotes(e.target.value)}
                placeholder="Add any additional notes or comments for this adjustment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none focus:border-blue-500"
                rows={3}
                tabIndex={10}
                autoFocus={false}
              />
            </div>

            {/* Document Upload Section - Using Shared Component */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Supporting Documents (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <DocumentUpload
                  uploadedFiles={uploadedFiles}
                  onFilesChange={(files) => {
                    console.log('Files changed:', files)
                    setUploadedFiles(files)
                  }}
                  onUpload={handleDocumentUpload}
                  isUploading={isUploadingDocuments}
                  showUploadSection={showDocumentUpload}
                  onToggleUpload={(show) => {
                    console.log('Toggle upload section:', show)
                    setShowDocumentUpload(show)
                  }}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  maxFiles={10}
                  maxFileSize={10 * 1024 * 1024} // 10MB
                />
              </CardContent>
            </Card>

            {/* Action Buttons - Compact */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-600">
                {adjustmentItems.length > 0 && (
                  <span>
                    {adjustmentItems.length} item{adjustmentItems.length !== 1 ? 's' : ''} ready to adjust
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => {
                  // Check for unsaved changes before closing
                  if (hasUnsavedChanges()) {
                    setPendingNavigation(null) // No navigation, just closing dialog
                    setShowCloseWarning(true)
                    return // Don't close the dialog yet
                  }
                  resetForm()
                  setIsCreateModalOpen(false)
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => setIsReviewOpen(true)}
                  disabled={adjustmentItems.length === 0 || isUploadingDocuments}
                  className="bg-[#52a852] hover:bg-[#4a964a] text-white"
                >
                  {isUploadingDocuments ? 'Uploading...' : 'Review & Confirm'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review & Confirm Dialog */}
      <AdjustmentReviewDialog
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onConfirm={() => { setIsReviewOpen(false); handleCreateAdjustment() }}
        items={adjustmentItems}
        processedBy={user ? `${user.first_name} ${user.last_name}` : ''}
        adjustmentDate={adjustmentDate}
        warehouseName={selectedWarehouse?.name || ''}
        reference={externalReference}
        notes={adjustmentNotes}
        documents={uploadedFiles.map((file, index) => ({
          id: `file-${index}`,
          name: file.name,
          size: file.size,
          type: file.type
        }))}
      />

      {/* Close Warning Dialog */}
      <Dialog open={showCloseWarning} onOpenChange={() => setShowCloseWarning(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">Unsaved Changes</DialogTitle>
            <DialogDescription className="text-gray-600">
              You have unsaved changes that will be lost if you close this dialog. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleCloseWarning(false)}
              className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg"
            >
              Keep Editing
            </Button>
            <Button
              type="button"
              onClick={() => handleCloseWarning(true)}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg"
            >
              Close Anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </AppLayout>
  )
}
