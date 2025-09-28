'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import api from '@/lib/api'
import { StockLevel } from '@/lib/types'
import { StockTable } from '@/components/stock/stock-table'
import { SearchBar } from '@/components/shared/search-bar'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'

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
        <LoadingSpinner size="lg" text="Loading..." />
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
                  <SearchBar
                    placeholder="Search by product name, SKU, or warehouse..."
                    value={searchTerm}
                    onChange={setSearchTerm}
                  />
                </div>

                {/* Stock Levels Table */}
                {isLoadingData ? (
                  <LoadingSpinner text="Loading stock levels..." />
                ) : filteredStockLevels.length === 0 ? (
                  <EmptyState 
                    title={
                      searchTerm ? 'No stock levels found matching your search' : 'No stock data available'
                    }
                    description={
                      searchTerm 
                        ? 'Try adjusting your search terms' 
                        : 'Stock levels will appear here once products are added to warehouses'
                    }
                  />
                ) : (
                  <StockTable stockLevels={filteredStockLevels} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}