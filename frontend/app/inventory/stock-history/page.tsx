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
import { Search, RefreshCw, ArrowLeft, Package, Eye, Calendar, User, DollarSign, Package2, MapPin } from 'lucide-react'
import api from '@/lib/api'

interface StockMovement {
  id: string
  product_id: string
  warehouse_id: string
  movement_type: string
  quantity: number
  cost_price?: number
  total_amount?: number
  reference_type?: string
  reference_id?: string
  reason?: string
  user_id?: string
  processed_by?: string
  processed_date?: string
  created_at: string
  product_name: string
  product_sku: string
  warehouse_name: string
  user_name?: string
  processed_by_name?: string
}

export default function StockHistoryPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
  // State management
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredMovements, setFilteredMovements] = useState<StockMovement[]>([])
  const [selectedMovementType, setSelectedMovementType] = useState('all')
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Load stock movements when user is available
  useEffect(() => {
    if (user) {
      loadStockMovements()
    }
  }, [user])

  // Filter stock movements based on search term and movement type
  useEffect(() => {
    let filtered = stockMovements

    // Filter by movement type
    if (selectedMovementType !== 'all') {
      filtered = filtered.filter(movement => movement.movement_type === selectedMovementType)
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (movement) =>
          movement.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          movement.product_sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          movement.warehouse_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          movement.reason?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredMovements(filtered)
  }, [searchTerm, selectedMovementType, stockMovements])

  const loadStockMovements = async () => {
    try {
      setIsLoadingData(true)
      const response = await api.get('/stock-movements?limit=100')
      setStockMovements(response.data.stock_movements || [])
    } catch (error) {
      console.error('Error loading stock movements:', error)
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

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'in':
        return 'bg-green-100 text-green-800'
      case 'out':
        return 'bg-red-100 text-red-800'
      case 'transfer':
        return 'bg-blue-100 text-blue-800'
      case 'adjustment':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'in':
        return 'Stock In'
      case 'out':
        return 'Stock Out'
      case 'transfer':
        return 'Transfer'
      case 'adjustment':
        return 'Adjustment'
      default:
        return type
    }
  }

  const handleRowClick = (movement: StockMovement) => {
    setSelectedMovement(movement)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedMovement(null)
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Stock History</h1>
                <p className="mt-2 text-gray-600">View all stock movements and transactions</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={loadStockMovements}
                  disabled={isLoadingData}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => router.push('/inventory/movements/new')}
                >
                  <Package className="h-4 w-4" />
                  Add Stock
                </Button>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Stock Movements</CardTitle>
                <CardDescription>
                  Complete history of all stock movements across warehouses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Filter Bar */}
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by product name, SKU, warehouse, or reason..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="min-w-[150px]">
                    <select
                      value={selectedMovementType}
                      onChange={(e) => setSelectedMovementType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Types</option>
                      <option value="in">Stock In</option>
                      <option value="out">Stock Out</option>
                      <option value="transfer">Transfer</option>
                      <option value="adjustment">Adjustment</option>
                    </select>
                  </div>
                </div>

                {/* Stock Movements Table */}
                {isLoadingData ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading stock movements...</p>
                  </div>
                ) : filteredMovements.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {searchTerm || selectedMovementType !== 'all' 
                        ? 'No stock movements found matching your filters' 
                        : 'No stock movements available'
                      }
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      {searchTerm || selectedMovementType !== 'all'
                        ? 'Try adjusting your search terms or filters' 
                        : 'Stock movements will appear here once inventory transactions are recorded'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Warehouse</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Cost Price</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Processed By</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMovements.map((movement) => (
                          <TableRow 
                            key={movement.id}
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleRowClick(movement)}
                          >
                            <TableCell className="text-sm text-gray-500">
                              {formatDate(movement.created_at)}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMovementTypeColor(movement.movement_type)}`}>
                                {getMovementTypeLabel(movement.movement_type)}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium">
                              {movement.product_name}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {movement.product_sku}
                            </TableCell>
                            <TableCell>
                              {movement.warehouse_name}
                            </TableCell>
                            <TableCell className={`font-medium ${movement.movement_type === 'in' ? 'text-green-600' : movement.movement_type === 'out' ? 'text-red-600' : ''}`}>
                              {movement.movement_type === 'in' ? '+' : movement.movement_type === 'out' ? '-' : ''}{movement.quantity}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {movement.cost_price ? `₱${movement.cost_price.toFixed(2)}` : '-'}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {movement.total_amount ? `₱${movement.total_amount.toFixed(2)}` : '-'}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {movement.reason || '-'}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {movement.processed_by_name || movement.user_name || '-'}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRowClick(movement)
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
      </div>

      {/* Stock Movement Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package2 className="h-5 w-5" />
              Stock Movement Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this stock movement transaction
            </DialogDescription>
          </DialogHeader>
          
          {selectedMovement && (
            <div className="space-y-6">
              {/* Movement Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Movement Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Date & Time</p>
                        <p className="text-sm text-gray-600">{formatDate(selectedMovement.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMovementTypeColor(selectedMovement.movement_type)}`}>
                        {getMovementTypeLabel(selectedMovement.movement_type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Package2 className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Product</p>
                        <p className="text-sm text-gray-600">{selectedMovement.product_name}</p>
                        <p className="text-xs text-gray-500 font-mono">{selectedMovement.product_sku}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Warehouse</p>
                        <p className="text-sm text-gray-600">{selectedMovement.warehouse_name}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quantity and Financial Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quantity & Financial Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-600">Quantity</p>
                      <p className={`text-2xl font-bold ${selectedMovement.movement_type === 'in' ? 'text-green-600' : selectedMovement.movement_type === 'out' ? 'text-red-600' : 'text-blue-600'}`}>
                        {selectedMovement.movement_type === 'in' ? '+' : selectedMovement.movement_type === 'out' ? '-' : ''}{selectedMovement.quantity}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-600">Cost Price</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedMovement.cost_price ? `₱${selectedMovement.cost_price.toFixed(2)}` : 'N/A'}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-600">Total Amount</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedMovement.total_amount ? `₱${selectedMovement.total_amount.toFixed(2)}` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reference and Processing Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Reference & Processing Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Reference Type</p>
                      <p className="text-sm text-gray-900 capitalize">{selectedMovement.reference_type || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Reference ID</p>
                      <p className="text-sm text-gray-900 font-mono">{selectedMovement.reference_id || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Reason</p>
                      <p className="text-sm text-gray-900">{selectedMovement.reason || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Processed By</p>
                      <p className="text-sm text-gray-900">{selectedMovement.processed_by_name || selectedMovement.user_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Processed Date</p>
                      <p className="text-sm text-gray-900">{selectedMovement.processed_date ? formatDate(selectedMovement.processed_date) : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Movement ID</p>
                      <p className="text-sm text-gray-900 font-mono">{selectedMovement.id}</p>
                    </div>
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