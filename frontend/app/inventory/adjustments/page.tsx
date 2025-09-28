'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, RefreshCw, ArrowLeft, Package, Eye, Calendar, User, DollarSign, FileText, Hash, AlertTriangle } from 'lucide-react'
import api from '@/lib/api'

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
}

export default function AdjustmentsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
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
  const [adjustmentDate, setAdjustmentDate] = useState(new Date().toISOString().split('T')[0])
  const [currentStockLevel, setCurrentStockLevel] = useState<number | null>(null)
  const [isCheckingStock, setIsCheckingStock] = useState(false)
  const [generatedReferenceNumber, setGeneratedReferenceNumber] = useState<string | null>(null)

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
    }
  }, [user])

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
      
      // Convert backend adjustments to frontend format
      const convertedAdjustments = adjustments.map((adj: any) => ({
        id: adj.id,
        reference_id: adj.reference_number,
        total_quantity: adj.total_quantity,
        processed_by: adj.processed_by_first_name && adj.processed_by_last_name 
          ? `${adj.processed_by_first_name} ${adj.processed_by_last_name}`
          : adj.created_by_first_name && adj.created_by_last_name
          ? `${adj.created_by_first_name} ${adj.created_by_last_name}`
          : 'Unknown',
        processed_date: adj.processed_date || adj.created_at,
        created_at: adj.created_at,
        items: [] // Items will be loaded separately if needed
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
    setAdjustmentDate(new Date().toISOString().split('T')[0])
    setSelectedProduct(null)
    setSelectedWarehouse(null)
    setCurrentStockLevel(null)
    setGeneratedReferenceNumber(null)
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
      return response.data.quantity || 0
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
    if (!selectedProduct || !selectedWarehouse || !adjustmentQuantity.trim() || quantity <= 0 || !adjustmentCostPrice.trim() || costPrice < 0 || !adjustmentReason.trim()) {
      alert('Please fill in all required fields with valid values')
      return
    }

    // Check stock level for subtraction adjustments
    if (adjustmentType === 'subtract') {
      setIsCheckingStock(true)
      try {
        const currentStock = await checkStockLevel(selectedProduct.id, selectedWarehouse.id)
        setCurrentStockLevel(currentStock)
        
        if (currentStock < quantity) {
          alert(`Insufficient stock! Current stock: ${currentStock}, trying to subtract: ${quantity}`)
          setIsCheckingStock(false)
          return
        }
      } catch (error) {
        console.error('Error checking stock:', error)
        alert('Error checking stock level. Please try again.')
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
      warehouse_id: selectedWarehouse.id,
      warehouse_name: selectedWarehouse.name,
      quantity: finalQuantity,
      cost_price: costPrice,
      reason: adjustmentReason
    }

    setAdjustmentItems([...adjustmentItems, newItem])
    
    // Reset form
    setSelectedProduct(null)
    setSelectedWarehouse(null)
    setAdjustmentQuantity('')
    setAdjustmentCostPrice('')
    setAdjustmentType('add')
    setAdjustmentReason('')
    setCurrentStockLevel(null)
  }

  const handleRemoveItem = (index: number) => {
    setAdjustmentItems(adjustmentItems.filter((_, i) => i !== index))
  }

  const handleCreateAdjustment = async () => {
    if (adjustmentItems.length === 0) {
      alert('Please add at least one item to the adjustment')
      return
    }

    if (!user) {
      alert('User not authenticated')
      return
    }

    try {
      // Generate reference number
      const referenceNumber = generateReferenceNumber()
      setGeneratedReferenceNumber(referenceNumber)

      // Calculate total quantity
      const totalQuantity = adjustmentItems.reduce((sum, item) => sum + Math.abs(item.quantity), 0)

      // Create adjustment using backend API
      const adjustmentPayload = {
        reference_number: referenceNumber,
        adjustment_date: new Date(adjustmentDate).toISOString(),
        total_quantity: totalQuantity,
        reason: 'Inventory adjustment',
        status: 'completed',
        created_by: user.id,
        items: adjustmentItems.map(item => ({
          product_id: item.product_id,
          warehouse_id: item.warehouse_id,
          quantity: item.quantity,
          cost_price: item.cost_price,
          reason: item.reason
        }))
      }

      console.log('Sending adjustment payload:', adjustmentPayload)
      
      await api.post('/adjustments', adjustmentPayload)

      // Reset form and close modal
      resetForm()
      setIsCreateModalOpen(false)
      
      // Reload adjustments
      await loadAdjustments()
      
      alert(`Adjustment created successfully!\nReference Number: ${referenceNumber}`)
    } catch (error: any) {
      console.error('Error creating adjustment:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred'
      alert(`Failed to create adjustment: ${errorMessage}`)
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
                          <TableHead>Type</TableHead>
                          <TableHead>Total Quantity</TableHead>
                          <TableHead>Processed By</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Actions</TableHead>
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
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                Adjustment
                              </span>
                            </TableCell>
                            <TableCell className="font-medium">
                              {adjustment.total_quantity}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {adjustment.processed_by}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {formatDate(adjustment.processed_date)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {adjustment.items.length} item{adjustment.items.length !== 1 ? 's' : ''}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAdjustmentClick(adjustment)
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
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
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Adjustment Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this inventory adjustment
            </DialogDescription>
          </DialogHeader>
          
          {selectedAdjustment && (
            <div className="space-y-6">
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
                        <p className="text-sm text-gray-600 font-mono">{selectedAdjustment.reference_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Adjustment
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Processed Date</p>
                        <p className="text-sm text-gray-600">{formatDate(selectedAdjustment.processed_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Processed By</p>
                        <p className="text-sm text-gray-600">{selectedAdjustment.processed_by}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Adjustment Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Adjustment Items</CardTitle>
                  <CardDescription>
                    Complete list of items in this adjustment
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
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedAdjustment.items.map((item, index) => (
                          <TableRow key={`${item.product_id}-${index}`}>
                            <TableCell className="font-medium">
                              {item.product_name}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {item.product_sku}
                            </TableCell>
                            <TableCell>
                              {item.warehouse_name}
                            </TableCell>
                            <TableCell className={`font-medium ${item.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.quantity > 0 ? '+' : ''}{item.quantity}
                            </TableCell>
                            <TableCell className="text-sm">
                              {item.reason}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={closeModal}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Adjustment Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
        setIsCreateModalOpen(open)
        if (!open) {
          resetForm() // Clear form and success message when modal is closed
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Adjustment
            </DialogTitle>
            <DialogDescription>
              Add inventory adjustments to correct stock levels
            </DialogDescription>
          </DialogHeader>
          
          {/* Success Message with Reference Number */}
          {generatedReferenceNumber && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-green-800">Adjustment Created Successfully!</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Reference Number: <span className="font-mono font-semibold">{generatedReferenceNumber}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            {/* Adjustment Date and Processed By */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adjustment-date">Adjustment Date *</Label>
                <Input
                  id="adjustment-date"
                  type="date"
                  value={adjustmentDate}
                  onChange={(e) => setAdjustmentDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Processed By</Label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">
                    {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
                  </span>
                </div>
              </div>
            </div>

            {/* Add Item Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Adjustment Item</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Warehouse *</Label>
                    <Select value={selectedWarehouse?.id || ''} onValueChange={(value) => {
                      const warehouse = warehouses.find(w => w.id === value)
                      setSelectedWarehouse(warehouse || null)
                      setSelectedProduct(null) // Reset product when warehouse changes
                      setCurrentStockLevel(null) // Reset current stock when warehouse changes
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a warehouse" />
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
                  
                  <div className="space-y-2">
                    <Label>Product *</Label>
                    <Select 
                      value={selectedProduct?.id || ''} 
                      onValueChange={(value) => {
                        const product = products.find(p => p.id === value)
                        setSelectedProduct(product || null)
                        // Stock will be fetched automatically by useEffect when both product and warehouse are selected
                      }}
                      disabled={!selectedWarehouse}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedWarehouse ? "Select a product" : "Select warehouse first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!selectedWarehouse && (
                      <p className="text-sm text-gray-500">Please select a warehouse first</p>
                    )}
                  </div>
                </div>
                
                {/* Current Stock Display */}
                {selectedProduct && selectedWarehouse && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Current Stock:</span>
                      {isCheckingStock ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                          <span className="text-sm text-gray-500">Loading...</span>
                        </div>
                      ) : (
                        <span className="text-sm font-semibold text-gray-900">
                          {currentStockLevel !== null ? currentStockLevel : 'N/A'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {selectedProduct.name} in {selectedWarehouse.name}
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Adjustment Type *</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="adjustmentType"
                          value="add"
                          checked={adjustmentType === 'add'}
                          onChange={(e) => setAdjustmentType(e.target.value as 'add' | 'subtract')}
                          className="text-green-600"
                        />
                        <span className="text-green-600 font-medium">Add to Inventory</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="adjustmentType"
                          value="subtract"
                          checked={adjustmentType === 'subtract'}
                          onChange={(e) => setAdjustmentType(e.target.value as 'add' | 'subtract')}
                          className="text-red-600"
                        />
                        <span className="text-red-600 font-medium">Subtract from Inventory</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity *</Label>
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
                      placeholder="Enter quantity amount"
                    />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cost_price">Cost Price *</Label>
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
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason *</Label>
                      <Input
                        id="reason"
                        value={adjustmentReason}
                        onChange={(e) => setAdjustmentReason(e.target.value)}
                        placeholder="Reason for adjustment"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                {adjustmentQuantity.trim() && parseInt(adjustmentQuantity) > 0 && (
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-sm font-medium text-gray-700">Preview:</p>
                    <div className="text-sm text-gray-600 space-y-1">
                      {adjustmentType === 'add' ? (
                        <div>
                          <span className="text-green-600">+{adjustmentQuantity} (Add to inventory)</span>
                          {adjustmentCostPrice.trim() && (
                            <span className="ml-2 text-gray-500">@ ${parseFloat(adjustmentCostPrice).toFixed(2)} each</span>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div>
                            <span className="text-red-600">-{adjustmentQuantity} (Subtract from inventory)</span>
                            {adjustmentCostPrice.trim() && (
                              <span className="ml-2 text-gray-500">@ ${parseFloat(adjustmentCostPrice).toFixed(2)} each</span>
                            )}
                          </div>
                          {isCheckingStock ? (
                            <div className="text-xs text-gray-500 flex items-center">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500 mr-2"></div>
                              Checking stock level...
                            </div>
                          ) : currentStockLevel !== null ? (
                            <div className="text-xs text-gray-500">
                              Current stock: {currentStockLevel}
                              {currentStockLevel < adjustmentQuantity && (
                                <span className="text-red-600 font-medium ml-2">⚠️ Insufficient stock!</span>
                              )}
                            </div>
                          ) : null}
                        </div>
                      )}
                      {adjustmentCostPrice.trim() && adjustmentQuantity.trim() && (
                        <div className="text-xs text-gray-500">
                          Total Value: ${(parseFloat(adjustmentCostPrice) * parseInt(adjustmentQuantity)).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={handleAddItem} 
                  disabled={isCheckingStock || (adjustmentType === 'subtract' && currentStockLevel !== null && currentStockLevel < parseInt(adjustmentQuantity))}
                  className="w-full bg-[#52a852] hover:bg-[#4a964a] text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isCheckingStock ? 'Checking Stock...' : 'Add Item'}
                </Button>
              </CardContent>
            </Card>

            {/* Items List */}
            {adjustmentItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Adjustment Items ({adjustmentItems.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Warehouse</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Cost Price</TableHead>
                          <TableHead>Total Value</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {adjustmentItems.map((item, index) => (
                          <TableRow key={`${item.product_id}-${item.warehouse_id}-${index}`}>
                            <TableCell className="font-medium">
                              {item.product_name}
                            </TableCell>
                            <TableCell>{item.warehouse_name}</TableCell>
                            <TableCell className={`font-medium ${item.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.quantity > 0 ? '+' : ''}{item.quantity}
                            </TableCell>
                            <TableCell className="font-medium">
                              ${item.cost_price.toFixed(2)}
                            </TableCell>
                            <TableCell className="font-medium">
                              ${(Math.abs(item.quantity) * item.cost_price).toFixed(2)}
                            </TableCell>
                            <TableCell>{item.reason}</TableCell>
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
                resetForm()
                setIsCreateModalOpen(false)
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateAdjustment}
                disabled={adjustmentItems.length === 0}
                className="bg-[#52a852] hover:bg-[#4a964a] text-white"
              >
                Create Adjustment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
