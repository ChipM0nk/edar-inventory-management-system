'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getStatusDisplayText } from '@/lib/utils'
import { AppLayout } from '@/components/app-layout'
import { PurchaseOrderDetailsDialog } from '@/components/purchase-orders'
import { PurchaseOrder as GlobalPurchaseOrder } from '@/lib/types'
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
import { Search, RefreshCw, Package } from 'lucide-react'
import api from '@/lib/api'

interface PurchaseOrder {
  id?: string // Purchase order ID from database
  reference_id: string
  reference_number?: string
  reference_type: string
  status?: 'received' | 'cancelled'
  total_amount: number
  processed_by: string
  processed_date: string
  received_date?: string
  created_at: string
  supplier_name?: string
  cancelled_by?: string
  cancelled_by_first_name?: string
  cancelled_by_last_name?: string
  cancelled_at?: string
  cancellation_reason?: string
  products: {
    product_id: string
    product_name: string
    product_sku: string
    quantity: number
    cost_price: number
    total_amount: number
    warehouse_name: string
  }[]
  warehouse_id?: string
  warehouse_name?: string
}

export default function PurchaseOrdersPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  // State management
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<GlobalPurchaseOrder | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedSupplier, setSelectedSupplier] = useState<string>('')
  const [suppliers, setSuppliers] = useState<Array<{id: string, name: string}>>([])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Load purchase orders and suppliers when user is available
  useEffect(() => {
    if (user) {
      loadPurchaseOrders()
      loadSuppliers()
    }
  }, [user])

  // Refresh data when navigating to this page (handles navigation back from creating a new PO)
  useEffect(() => {
    if (user && pathname === '/orders/purchase') {
      loadPurchaseOrders(true) // Force refresh to prevent stale data
    }
  }, [pathname, user])

  // Also refresh when window regains focus (additional safety net)
  useEffect(() => {
    const handleFocus = () => {
      if (user && pathname === '/orders/purchase') {
        loadPurchaseOrders(true)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user, pathname])

  // Load suppliers
  const loadSuppliers = async () => {
    try {
      const response = await api.get('/suppliers')
      setSuppliers(response.data.suppliers || [])
    } catch (error) {
      console.error('Error loading suppliers:', error)
    }
  }

  // Filter purchase orders based on search term, year, month, and supplier
  useEffect(() => {
    let filtered = purchaseOrders

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (order) =>
          order.reference_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.reference_number && order.reference_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
          order.processed_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.supplier_name && order.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          order.products.some(p => 
            p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.product_sku.toLowerCase().includes(searchTerm.toLowerCase())
          )
      )
    }

    // Filter by year and month (based on Purchase Date)
    filtered = filtered.filter(order => {
      const orderDate = new Date(order.processed_date)
      return orderDate.getFullYear() === selectedYear && 
             orderDate.getMonth() + 1 === selectedMonth
    })

    // Filter by supplier
    if (selectedSupplier) {
      filtered = filtered.filter(order => 
        order.supplier_name === suppliers.find(s => s.id === selectedSupplier)?.name
      )
    }

    setFilteredOrders(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }, [purchaseOrders, searchTerm, selectedYear, selectedMonth, selectedSupplier, suppliers])

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentOrders = filteredOrders.slice(startIndex, endIndex)

  const loadPurchaseOrders = async (forceRefresh = false) => {
    try {
      setIsLoadingData(true)
      // Add timestamp to prevent caching issues
      const timestamp = forceRefresh ? `&_t=${Date.now()}` : ''
      const response = await api.get(`/purchase-orders?limit=100${timestamp}`)
      const orders = response.data || []
      
      // Transform the data to match our interface
      const transformedOrders: PurchaseOrder[] = orders.map((order: any) => ({
        id: order.id,
        reference_id: order.id,
        reference_number: order.po_number,
        reference_type: 'purchase_order',
        status: order.status,
        total_amount: order.total_amount || 0,
        processed_by: order.created_by_first_name && order.created_by_last_name 
          ? `${order.created_by_first_name} ${order.created_by_last_name}`
          : 'Unknown',
        processed_date: order.order_date || order.created_at,
        received_date: order.received_date,
        created_at: order.created_at,
        supplier_name: order.supplier_name,
        cancelled_by: order.cancelled_by,
        cancelled_by_first_name: order.cancelled_by_first_name,
        cancelled_by_last_name: order.cancelled_by_last_name,
        cancelled_at: order.cancelled_at,
        cancellation_reason: order.cancellation_reason,
        products: [], // Will be loaded separately if needed
        warehouse_id: order.warehouse_id,
        warehouse_name: order.warehouse_name
      }))
      
      setPurchaseOrders(transformedOrders)
    } catch (error) {
      console.error('Error loading purchase orders:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleOrderClick = async (order: PurchaseOrder) => {
    // Fetch full purchase order details with items
    if (!order.id) {
      console.error('Order ID is missing')
      return
    }
    
    try {
      const response = await api.get(`/purchase-orders/${order.id}`)
      setSelectedOrder(response.data)
      setIsModalOpen(true)
    } catch (error) {
      console.error('Failed to fetch purchase order details:', error)
      // Show error to user
      alert('Failed to load purchase order details. Please check if you are logged in.')
    }
  }

  const closeModal = () => {
    setSelectedOrder(null)
    setIsModalOpen(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
      </AppLayout>
    )
  }

  return (
    <>
    <AppLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
                <p className="mt-2 text-gray-600">Manage incoming purchase orders and their documents</p>
              </div>
              <div className="flex items-center gap-3">
              <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => loadPurchaseOrders(true)}
                  disabled={isLoadingData}
                className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button 
                  className="flex items-center gap-2 bg-[#52a852] hover:bg-[#4a964a] text-white"
                  onClick={() => router.push('/orders/purchase/new')}
                >
                  <Package className="h-4 w-4" />
                  New PO
              </Button>
              </div>
            </div>
            
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Orders</CardTitle>
                  <CardDescription>
                  Complete list of all purchase orders with reference numbers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by reference number, processed by, supplier, or product..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Filter Controls */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#52a852] focus:border-transparent"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Month</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#52a852] focus:border-transparent"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>
                          {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <select
                      value={selectedSupplier}
                      onChange={(e) => setSelectedSupplier(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#52a852] focus:border-transparent"
                    >
                      <option value="">All Suppliers</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button
                      onClick={() => {
                        setSearchTerm('')
                        setSelectedSupplier('')
                        setSelectedYear(new Date().getFullYear())
                        setSelectedMonth(new Date().getMonth() + 1)
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>

                {/* Purchase Orders Table */}
                {isLoadingData ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading purchase orders...</p>
                  </div>
                ) : currentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {searchTerm 
                        ? 'No purchase orders found matching your search' 
                        : 'No purchase orders available'
                      }
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      {searchTerm
                        ? 'Try adjusting your search terms' 
                        : 'Purchase orders will appear here once created'
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
                          <TableHead>Supplier</TableHead>
                          <TableHead>Warehouse</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Processed By</TableHead>
                          <TableHead>Purchase Date</TableHead>
                          <TableHead>Received Date</TableHead>
                          <TableHead>Created At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentOrders.map((order) => (
                          <TableRow 
                            key={order.reference_id}
                            className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                              order.status === 'cancelled' ? 'bg-red-50 hover:bg-red-100' : ''
                            }`}
                            onClick={() => handleOrderClick(order)}
                          >
                            <TableCell className="font-mono font-medium text-blue-600 hover:text-blue-800">
                              {order.reference_number || order.reference_id}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                order.status === 'cancelled' 
                                  ? 'bg-red-100 text-red-800' 
                                  : order.status === 'received'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {getStatusDisplayText(order.status)}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {order.supplier_name || 'Not specified'}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {order.warehouse_name || 'Not specified'}
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
                              {order.received_date ? formatDate(order.received_date) : '-'}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {formatDateTime(order.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
              </div>
            )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-700">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} results
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
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
    </AppLayout>

    {/* Purchase Order Details Dialog */}
    {selectedOrder && (
      <PurchaseOrderDetailsDialog
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={closeModal}
        onOrderUpdated={() => loadPurchaseOrders(true)}
      />
    )}
    </>
  )
}

