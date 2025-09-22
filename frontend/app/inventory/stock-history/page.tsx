'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Search, Filter, Calendar, User, Package, TrendingUp } from 'lucide-react'
import api from '@/lib/api'

interface StockMovement {
  id: string
  product_name: string
  product_sku: string
  warehouse_name: string
  movement_type: string
  quantity: number
  cost_price?: number
  total_amount?: number
  reason?: string
  user_first_name?: string
  user_last_name?: string
  processed_by_first_name?: string
  processed_by_last_name?: string
  processed_date?: string
  created_at: string
}

interface Product {
  id: string
  name: string
  sku: string
}

interface Warehouse {
  id: string
  name: string
  location: string
}

export default function StockHistoryPage() {
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedWarehouse, setSelectedWarehouse] = useState('')
  const [movementType, setMovementType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput)
      setPage(1) // Reset to first page when searching
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput])

  const { data: stockMovements, isLoading } = useQuery({
    queryKey: ['stock-movements', searchTerm, selectedProduct, selectedWarehouse, movementType, dateFrom, dateTo, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedProduct) params.append('product_id', selectedProduct)
      if (selectedWarehouse) params.append('warehouse_id', selectedWarehouse)
      if (movementType) params.append('movement_type', movementType)
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      
      const response = await api.get(`/stock-movements?${params.toString()}`)
      return response.data
    },
  })

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/products')
      return response.data.products || []
    },
  })

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get('/warehouses')
      return response.data.warehouses || []
    },
  })

  const getMovementTypeBadge = (type: string) => {
    const variants = {
      'in': 'default',
      'out': 'destructive',
      'transfer': 'secondary',
      'adjustment': 'outline',
    } as const

    return (
      <Badge variant={variants[type as keyof typeof variants] || 'outline'}>
        {type.toUpperCase()}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleSearch = () => {
    setPage(1)
  }

  const handleClearFilters = () => {
    setSearchInput('')
    setSearchTerm('')
    setSelectedProduct('')
    setSelectedWarehouse('')
    setMovementType('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const totalPages = stockMovements ? Math.ceil(stockMovements.total / limit) : 0

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Stock History</h1>
          <p className="text-gray-600">View all stock movements and transactions</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Stock Movement History
            </CardTitle>
            <CardDescription>
              Track all inventory movements and transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => setSearchInput('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Product</label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="All products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All products</SelectItem>
                    {products?.map((product: Product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Warehouse</label>
                <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                  <SelectTrigger>
                    <SelectValue placeholder="All warehouses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All warehouses</SelectItem>
                    {warehouses?.map((warehouse: Warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} - {warehouse.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Movement Type</label>
                <Select value={movementType} onValueChange={setMovementType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="in">IN</SelectItem>
                    <SelectItem value="out">OUT</SelectItem>
                    <SelectItem value="transfer">TRANSFER</SelectItem>
                    <SelectItem value="adjustment">ADJUSTMENT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium">Date From</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date To</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="flex items-end space-x-2">
                <Button onClick={handleSearch} className="flex-1">
                  <Filter className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear
                </Button>
              </div>
            </div>

            {/* Results Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Cost Price</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Processed By</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockMovements?.stock_movements?.map((movement: StockMovement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{movement.product_name}</div>
                          <div className="text-sm text-gray-500">SKU: {movement.product_sku}</div>
                        </div>
                      </TableCell>
                      <TableCell>{movement.warehouse_name}</TableCell>
                      <TableCell>{getMovementTypeBadge(movement.movement_type)}</TableCell>
                      <TableCell className="text-right">
                        <span className={movement.movement_type === 'in' ? 'text-green-600' : 'text-red-600'}>
                          {movement.movement_type === 'in' ? '+' : '-'}{movement.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {movement.cost_price ? `$${movement.cost_price.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {movement.total_amount ? `$${movement.total_amount.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>{movement.reason || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <User className="h-4 w-4 mr-1 text-gray-400" />
                          {movement.processed_by_first_name && movement.processed_by_last_name
                            ? `${movement.processed_by_first_name} ${movement.processed_by_last_name}`
                            : movement.user_first_name && movement.user_last_name
                            ? `${movement.user_first_name} ${movement.user_last_name}`
                            : 'Unknown'
                          }
                        </div>
                        {movement.processed_date && (
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(movement.processed_date)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(movement.created_at)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, stockMovements?.total || 0)} of {stockMovements?.total || 0} results
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
