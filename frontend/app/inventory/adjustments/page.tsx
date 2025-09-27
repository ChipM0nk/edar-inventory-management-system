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

interface AdjustmentItem {
  product_id: string
  product_name: string
  product_sku: string
  warehouse_id: string
  warehouse_name: string
  quantity: number
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
  
  // Create adjustment form state
  const [adjustmentItems, setAdjustmentItems] = useState<AdjustmentItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(1)
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [adjustmentDate, setAdjustmentDate] = useState(new Date().toISOString().split('T')[0])

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
  }, [searchTerm, adjustments])

  const loadAdjustments = async () => {
    try {
      setIsLoadingData(true)
      const response = await api.get('/stock-movements?limit=100')
      const movements = response.data.stock_movements || []
      
      // Filter and group movements by reference_id for adjustments
      const adjustmentsMap = new Map<string, Adjustment>()
      
      movements
        .filter((movement: any) => movement.reference_type === 'adjustment')
        .forEach((movement: any) => {
          const refId = movement.reference_id
          if (!refId) return
          
          if (!adjustmentsMap.has(refId)) {
            adjustmentsMap.set(refId, {
              id: movement.id,
              reference_id: refId,
              total_quantity: 0,
              processed_by: movement.processed_by_name || movement.user_name || 'Unknown',
              processed_date: movement.processed_date || movement.created_at,
              created_at: movement.created_at,
              items: []
            })
          }
          
          const adjustment = adjustmentsMap.get(refId)!
          adjustment.total_quantity += Math.abs(movement.quantity)
          adjustment.items.push({
            product_id: movement.product_id,
            product_name: movement.product_name,
            product_sku: movement.product_sku,
            warehouse_id: movement.warehouse_id,
            warehouse_name: movement.warehouse_name,
            quantity: movement.quantity,
            reason: movement.reason || 'No reason provided'
          })
        })
      
      setAdjustments(Array.from(adjustmentsMap.values()))
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

  const handleAdjustmentClick = (adjustment: Adjustment) => {
    setSelectedAdjustment(adjustment)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedAdjustment(null)
  }

  const handleAddItem = () => {
    if (!selectedProduct || !selectedWarehouse || adjustmentQuantity === 0 || !adjustmentReason.trim()) {
      alert('Please fill in all required fields')
      return
    }

    const newItem: AdjustmentItem = {
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      product_sku: selectedProduct.sku,
      warehouse_id: selectedWarehouse.id,
      warehouse_name: selectedWarehouse.name,
      quantity: adjustmentQuantity,
      reason: adjustmentReason
    }

    setAdjustmentItems([...adjustmentItems, newItem])
    
    // Reset form
    setSelectedProduct(null)
    setSelectedWarehouse(null)
    setAdjustmentQuantity(1)
    setAdjustmentReason('')
  }

  const handleRemoveItem = (index: number) => {
    setAdjustmentItems(adjustmentItems.filter((_, i) => i !== index))
  }

  const handleCreateAdjustment = async () => {
    if (adjustmentItems.length === 0) {
      alert('Please add at least one item to the adjustment')
      return
    }

    try {
      // Create stock movements for each item
      for (const item of adjustmentItems) {
        await api.post('/stock-movements', {
          product_id: item.product_id,
          warehouse_id: item.warehouse_id,
          movement_type: item.quantity > 0 ? 'in' : 'out',
          quantity: Math.abs(item.quantity),
          reference_type: 'adjustment',
          reason: item.reason,
          processed_date: adjustmentDate
        })
      }

      // Reset form and close modal
      setAdjustmentItems([])
      setAdjustmentDate(new Date().toISOString().split('T')[0])
      setIsCreateModalOpen(false)
      
      // Reload adjustments
      await loadAdjustments()
      
      alert('Adjustment created successfully!')
    } catch (error) {
      console.error('Error creating adjustment:', error)
      alert('Failed to create adjustment. Please try again.')
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
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.back()}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Stock Adjustments</h1>
                  <p className="mt-2 text-gray-600">Manage inventory adjustments and corrections</p>
                </div>
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
                ) : filteredAdjustments.length === 0 ? (
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
                        {filteredAdjustments.map((adjustment) => (
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
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
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
          
          <div className="space-y-6">
            {/* Adjustment Date */}
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
            </div>

            {/* Add Item Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Adjustment Item</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Product *</Label>
                    <Select value={selectedProduct?.id || ''} onValueChange={(value) => {
                      const product = products.find(p => p.id === value)
                      setSelectedProduct(product || null)
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Warehouse *</Label>
                    <Select value={selectedWarehouse?.id || ''} onValueChange={(value) => {
                      const warehouse = warehouses.find(w => w.id === value)
                      setSelectedWarehouse(warehouse || null)
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
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={adjustmentQuantity}
                      onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value) || 0)}
                      placeholder="Positive for increase, negative for decrease"
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
                
                <Button onClick={handleAddItem} className="w-full bg-[#52a852] hover:bg-[#4a964a] text-white">
                  Add Item
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
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
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
