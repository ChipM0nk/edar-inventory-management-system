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
import { Plus, Search, RefreshCw, ArrowLeft, Package, Eye, Calendar, User, DollarSign, FileText, Hash, ArrowRightLeft } from 'lucide-react'
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

interface TransferItem {
  product_id: string
  product_name: string
  product_sku: string
  from_warehouse_id: string
  from_warehouse_name: string
  to_warehouse_id: string
  to_warehouse_name: string
  quantity: number
  reason: string
}

interface Transfer {
  id: string
  reference_id: string
  total_quantity: number
  processed_by: string
  processed_date: string
  created_at: string
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
  
  // Create transfer form state
  const [transferItems, setTransferItems] = useState<TransferItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [fromWarehouse, setFromWarehouse] = useState<Warehouse | null>(null)
  const [toWarehouse, setToWarehouse] = useState<Warehouse | null>(null)
  const [transferQuantity, setTransferQuantity] = useState(1)
  const [transferReason, setTransferReason] = useState('')
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0])

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
  }, [searchTerm, transfers])

  const loadTransfers = async () => {
    try {
      setIsLoadingData(true)
      const response = await api.get('/stock-movements?limit=100')
      const movements = response.data.stock_movements || []
      
      // Filter and group movements by reference_id for transfers
      const transfersMap = new Map<string, Transfer>()
      
      movements
        .filter((movement: any) => movement.reference_type === 'transfer')
        .forEach((movement: any) => {
          const refId = movement.reference_id
          if (!refId) return
          
          if (!transfersMap.has(refId)) {
            transfersMap.set(refId, {
              id: movement.id,
              reference_id: refId,
              total_quantity: 0,
              processed_by: movement.processed_by_name || movement.user_name || 'Unknown',
              processed_date: movement.processed_date || movement.created_at,
              created_at: movement.created_at,
              items: []
            })
          }
          
          const transfer = transfersMap.get(refId)!
          transfer.total_quantity += movement.quantity
          transfer.items.push({
            product_id: movement.product_id,
            product_name: movement.product_name,
            product_sku: movement.product_sku,
            from_warehouse_id: movement.warehouse_id, // This would need to be determined from the transfer logic
            from_warehouse_name: movement.warehouse_name,
            to_warehouse_id: movement.warehouse_id, // This would need to be determined from the transfer logic
            to_warehouse_name: movement.warehouse_name,
            quantity: movement.quantity,
            reason: movement.reason || 'No reason provided'
          })
        })
      
      setTransfers(Array.from(transfersMap.values()))
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

  const handleAddItem = () => {
    if (!selectedProduct || !fromWarehouse || !toWarehouse || transferQuantity <= 0 || !transferReason.trim()) {
      alert('Please fill in all required fields')
      return
    }

    if (fromWarehouse.id === toWarehouse.id) {
      alert('From and To warehouses must be different')
      return
    }

    const newItem: TransferItem = {
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      product_sku: selectedProduct.sku,
      from_warehouse_id: fromWarehouse.id,
      from_warehouse_name: fromWarehouse.name,
      to_warehouse_id: toWarehouse.id,
      to_warehouse_name: toWarehouse.name,
      quantity: transferQuantity,
      reason: transferReason
    }

    setTransferItems([...transferItems, newItem])
    
    // Reset form
    setSelectedProduct(null)
    setFromWarehouse(null)
    setToWarehouse(null)
    setTransferQuantity(1)
    setTransferReason('')
  }

  const handleRemoveItem = (index: number) => {
    setTransferItems(transferItems.filter((_, i) => i !== index))
  }

  const handleCreateTransfer = async () => {
    if (transferItems.length === 0) {
      alert('Please add at least one item to the transfer')
      return
    }

    try {
      // Create stock movements for each item (out from source, in to destination)
      for (const item of transferItems) {
        // Create outgoing movement from source warehouse
        await api.post('/stock-movements', {
          product_id: item.product_id,
          warehouse_id: item.from_warehouse_id,
          movement_type: 'out',
          quantity: item.quantity,
          reference_type: 'transfer',
          reason: item.reason,
          processed_date: transferDate
        })

        // Create incoming movement to destination warehouse
        await api.post('/stock-movements', {
          product_id: item.product_id,
          warehouse_id: item.to_warehouse_id,
          movement_type: 'in',
          quantity: item.quantity,
          reference_type: 'transfer',
          reason: item.reason,
          processed_date: transferDate
        })
      }

      // Reset form and close modal
      setTransferItems([])
      setTransferDate(new Date().toISOString().split('T')[0])
      setIsCreateModalOpen(false)
      
      // Reload transfers
      await loadTransfers()
      
      alert('Transfer created successfully!')
    } catch (error) {
      console.error('Error creating transfer:', error)
      alert('Failed to create transfer. Please try again.')
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
                  <h1 className="text-3xl font-bold text-gray-900">Stock Transfers</h1>
                  <p className="mt-2 text-gray-600">Manage inventory transfers between warehouses</p>
                </div>
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
                ) : filteredTransfers.length === 0 ? (
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
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransfers.map((transfer) => (
                          <TableRow 
                            key={transfer.reference_id}
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleTransferClick(transfer)}
                          >
                            <TableCell className="font-mono font-medium text-blue-600 hover:text-blue-800">
                              {transfer.reference_id}
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Transfer
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
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleTransferClick(transfer)
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
              {/* Transfer Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Transfer Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Hash className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Reference Number</p>
                        <p className="text-sm text-gray-600 font-mono">{selectedTransfer.reference_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Transfer
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Processed Date</p>
                        <p className="text-sm text-gray-600">{formatDate(selectedTransfer.processed_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Processed By</p>
                        <p className="text-sm text-gray-600">{selectedTransfer.processed_by}</p>
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
                          <TableHead>From Warehouse</TableHead>
                          <TableHead>To Warehouse</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Reason</TableHead>
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
                            <TableCell>
                              {item.from_warehouse_name}
                            </TableCell>
                            <TableCell>
                              {item.to_warehouse_name}
                            </TableCell>
                            <TableCell className="font-medium text-blue-600">
                              {item.quantity}
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

      {/* Create Transfer Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
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
            {/* Transfer Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transfer-date">Transfer Date *</Label>
                <Input
                  id="transfer-date"
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                />
              </div>
            </div>

            {/* Add Item Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Transfer Item</CardTitle>
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
                    <Label>From Warehouse *</Label>
                    <Select value={fromWarehouse?.id || ''} onValueChange={(value) => {
                      const warehouse = warehouses.find(w => w.id === value)
                      setFromWarehouse(warehouse || null)
                    }}>
                      <SelectTrigger>
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
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>To Warehouse *</Label>
                    <Select value={toWarehouse?.id || ''} onValueChange={(value) => {
                      const warehouse = warehouses.find(w => w.id === value)
                      setToWarehouse(warehouse || null)
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination warehouse" />
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
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={transferQuantity}
                      onChange={(e) => setTransferQuantity(parseInt(e.target.value) || 0)}
                      placeholder="Quantity to transfer"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason *</Label>
                  <Input
                    id="reason"
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    placeholder="Reason for transfer"
                  />
                </div>
                
                <Button onClick={handleAddItem} className="w-full bg-[#52a852] hover:bg-[#4a964a] text-white">
                  Add Item
                </Button>
              </CardContent>
            </Card>

            {/* Items List */}
            {transferItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Transfer Items ({transferItems.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transferItems.map((item, index) => (
                          <TableRow key={`${item.product_id}-${item.from_warehouse_id}-${item.to_warehouse_id}-${index}`}>
                            <TableCell className="font-medium">
                              {item.product_name}
                            </TableCell>
                            <TableCell>{item.from_warehouse_name}</TableCell>
                            <TableCell>{item.to_warehouse_name}</TableCell>
                            <TableCell className="font-medium text-blue-600">
                              {item.quantity}
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
                onClick={handleCreateTransfer}
                disabled={transferItems.length === 0}
                className="bg-[#52a852] hover:bg-[#4a964a] text-white"
              >
                Create Transfer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
