'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import api from '@/lib/api'
import { PurchaseOrder } from '@/lib/types'
import { PurchaseOrderCard } from '@/components/purchase-orders/purchase-order-card'
import { PurchaseOrderDetailsDialog } from '@/components/purchase-orders/purchase-order-details-dialog'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'

export default function PurchaseOrdersPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      loadPurchaseOrders()
    }
  }, [user])


  const loadPurchaseOrders = async () => {
    try {
      setIsLoadingData(true)
      const response = await api.get('/purchase-orders?limit=100')
      setPurchaseOrders(response.data || [])
    } catch (error) {
      console.error('Error loading purchase orders:', error)
    } finally {
      setIsLoadingData(false)
    }
  }


  const handleViewDetails = async (order: PurchaseOrder) => {
    try {
      console.log('🔍 Fetching individual PO for ID:', order.id)
      console.log('🔍 Current order status:', order.status)
      
      // Fetch fresh data for the individual purchase order
      const response = await api.get(`/purchase-orders/${order.id}`)
      console.log('✅ Individual PO fetch response:', response.data)
      console.log('✅ Response cancelled_at:', response.data.cancelled_at)
      console.log('✅ Response cancelled_by_first_name:', response.data.cancelled_by_first_name)
      console.log('✅ Response cancelled_by_last_name:', response.data.cancelled_by_last_name)
      console.log('✅ Response cancellation_reason:', response.data.cancellation_reason)
      
      console.log('🔍 About to set selectedOrder and open modal')
      setSelectedOrder(response.data)
      setIsDetailsModalOpen(true)
      console.log('🔍 Modal should now be open')
    } catch (error) {
      console.error('❌ Error fetching purchase order details:', error)
      // Fallback to using the existing order data
      setSelectedOrder(order)
      setIsDetailsModalOpen(true)
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
                <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
                <p className="mt-2 text-gray-600">Manage incoming purchase orders and their documents</p>
              </div>
              <Button 
                className="flex items-center gap-2"
                onClick={() => {
                  // TODO: Add purchase order creation functionality
                  alert('Purchase order creation feature coming soon!')
                }}
              >
                <Plus className="h-4 w-4" />
                New Purchase Order
              </Button>
            </div>
            
            {isLoadingData ? (
              <LoadingSpinner text="Loading purchase orders..." />
            ) : purchaseOrders.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Orders</CardTitle>
                  <CardDescription>
                    View and manage all purchase orders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmptyState 
                    title="No purchase orders found"
                    description="Purchase orders will appear here once created"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {purchaseOrders.map((order) => (
                  <PurchaseOrderCard
                    key={order.id}
                    order={order}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}


            {/* Purchase Order Details Modal */}
            <PurchaseOrderDetailsDialog
              order={selectedOrder}
              isOpen={isDetailsModalOpen}
              onClose={() => setIsDetailsModalOpen(false)}
            />

          </div>
        </div>
      </div>
    </AppLayout>
  )
}