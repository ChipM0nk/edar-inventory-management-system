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
import { Search, RefreshCw, ArrowLeft, Package, Eye, Calendar, User, DollarSign, Package2, MapPin, FileText, Hash } from 'lucide-react'
import api from '@/lib/api'

interface StockInOrder {
  reference_id: string
  reference_type: string
  total_quantity: number
  total_amount: number
  processed_by: string
  processed_date: string
  created_at: string
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

export default function StockInPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
  // State management
  const [stockInOrders, setStockInOrders] = useState<StockInOrder[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredOrders, setFilteredOrders] = useState<StockInOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<StockInOrder | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Load stock-in orders when user is available
  useEffect(() => {
    if (user) {
      loadStockInOrders()
    }
  }, [user])

  // Filter stock-in orders based on search term
  useEffect(() => {
    let filtered = stockInOrders

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (order) =>
          order.reference_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.processed_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.products.some(p => 
            p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.product_sku.toLowerCase().includes(searchTerm.toLowerCase())
          )
      )
    }

    setFilteredOrders(filtered)
  }, [searchTerm, stockInOrders])

  const loadStockInOrders = async () => {
    try {
      setIsLoadingData(true)
      const response = await api.get('/stock-movements?limit=100')
      const movements = response.data.stock_movements || []
      
      // Group movements by reference_id for stock-in orders
      const ordersMap = new Map<string, StockInOrder>()
      
      movements
        .filter((movement: any) => movement.movement_type === 'in')
        .forEach((movement: any) => {
          const refId = movement.reference_id
          if (!refId) return
          
          if (!ordersMap.has(refId)) {
            ordersMap.set(refId, {
              reference_id: refId,
              reference_type: movement.reference_type || 'adjustment',
              total_quantity: 0,
              total_amount: 0,
              processed_by: movement.processed_by_name || movement.user_name || 'Unknown',
              processed_date: movement.processed_date || movement.created_at,
              created_at: movement.created_at,
              products: []
            })
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
      
      setStockInOrders(Array.from(ordersMap.values()))
    } catch (error) {
      console.error('Error loading stock-in orders:', error)
    } finally {
      setIsLoadingData(false)
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const getTypeDisplay = (referenceType: string) => {
    switch (referenceType) {
      case 'purchase_order':
        return 'Purchase Order'
      case 'adjustment':
        return 'Adjustment'
      case 'transfer':
        return 'Transfer'
      default:
        return referenceType.replace('_', ' ').toUpperCase()
    }
  }

  const getTypeColor = (referenceType: string) => {
    switch (referenceType) {
      case 'purchase_order':
        return 'bg-blue-100 text-blue-800'
      case 'adjustment':
        return 'bg-orange-100 text-orange-800'
      case 'transfer':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-green-100 text-green-800'
    }
  }

  const handleOrderClick = (order: StockInOrder) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedOrder(null)
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
                  <h1 className="text-3xl font-bold text-gray-900">Stock-In Orders</h1>
                  <p className="mt-2 text-gray-600">View all stock-in orders and their details</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={loadStockInOrders}
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
                  Add Stock
                </Button>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Stock-In Orders</CardTitle>
                <CardDescription>
                  Complete list of all stock-in orders with reference numbers
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

                {/* Stock-In Orders Table */}
                {isLoadingData ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading stock-in orders...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {searchTerm 
                        ? 'No stock-in orders found matching your search' 
                        : 'No stock-in orders available'
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
                          <TableHead>Type</TableHead>
                          <TableHead>Total Quantity</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Processed By</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Products</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order) => (
                          <TableRow 
                            key={order.reference_id}
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleOrderClick(order)}
                          >
                            <TableCell className="font-mono font-medium text-blue-600 hover:text-blue-800">
                              {order.reference_id}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(order.reference_type)}`}>
                                {getTypeDisplay(order.reference_type)}
                              </span>
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
                              {order.products.length} item{order.products.length !== 1 ? 's' : ''}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOrderClick(order)
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

      {/* Stock-In Order Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Stock-In Order Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this stock-in order and its products
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
                        <p className="text-sm font-medium">Reference Number</p>
                        <p className="text-sm text-gray-600 font-mono">{selectedOrder.reference_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(selectedOrder.reference_type)}`}>
                        {getTypeDisplay(selectedOrder.reference_type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Processed Date</p>
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
                    Complete list of products in this stock-in order
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
    </AppLayout>
  )
}
