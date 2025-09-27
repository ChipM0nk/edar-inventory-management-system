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
import { Search, RefreshCw } from 'lucide-react'
import api from '@/lib/api'

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

export default function StockPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
  // State management
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredStockLevels, setFilteredStockLevels] = useState<StockLevel[]>([])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Load stock levels when user is available
  useEffect(() => {
    if (user) {
      loadStockLevels()
    }
  }, [user])

  // Filter stock levels based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredStockLevels(stockLevels)
    } else {
      const filtered = stockLevels.filter(
        (stock) =>
          stock.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stock.product_sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stock.warehouse_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredStockLevels(filtered)
    }
  }, [searchTerm, stockLevels])

  const loadStockLevels = async () => {
    try {
      setIsLoadingData(true)
      const response = await api.get('/stock-levels?limit=100')
      setStockLevels(response.data.stock_levels || [])
    } catch (error) {
      console.error('Error loading stock levels:', error)
    } finally {
      setIsLoadingData(false)
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Stock Levels</h1>
                <p className="mt-2 text-gray-600">Monitor current inventory levels</p>
              </div>
              <Button 
                variant="outline"
                size="sm"
                onClick={loadStockLevels}
                disabled={isLoadingData}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Current Stock</CardTitle>
                <CardDescription>
                  View current stock levels across all warehouses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by product name, SKU, or warehouse..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Stock Levels Table */}
                {isLoadingData ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading stock levels...</p>
                  </div>
                ) : filteredStockLevels.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {searchTerm ? 'No stock levels found matching your search' : 'No stock data available'}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      {searchTerm 
                        ? 'Try adjusting your search terms' 
                        : 'Stock levels will appear here once products are added to warehouses'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Warehouse</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Reserved</TableHead>
                          <TableHead>Available</TableHead>
                          <TableHead>Min Level</TableHead>
                          <TableHead>Last Updated</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStockLevels.map((stock) => (
                          <TableRow key={stock.id}>
                            <TableCell className="font-medium">
                              {stock.product_name}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {stock.product_sku}
                            </TableCell>
                            <TableCell>
                              {stock.warehouse_name}
                            </TableCell>
                            <TableCell className="font-medium">
                              {stock.quantity}
                            </TableCell>
                            <TableCell>
                              {stock.reserved_quantity}
                            </TableCell>
                            <TableCell className="font-medium">
                              {stock.available_quantity}
                            </TableCell>
                            <TableCell>
                              {stock.min_stock_level}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {new Date(stock.last_updated).toLocaleDateString()}
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
    </AppLayout>
  )
}