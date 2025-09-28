'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import api from '@/lib/api'
import { Warehouse, WarehouseFormData } from '@/lib/types'
import { WarehouseForm, WarehouseTable } from '@/components/warehouses'
import { SearchBar, LoadingSpinner, EmptyState } from '@/components/shared'

export default function WarehousesPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
  // State management
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoadingData, setIsLoadingData] = useState(false)


  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Load warehouses data
  useEffect(() => {
    if (user) {
      loadWarehouses()
    }
  }, [user])

  // Reload warehouses when search term changes (with debounce)
  useEffect(() => {
    if (user) {
      const timeoutId = setTimeout(() => {
        loadWarehouses()
      }, 300) // 300ms debounce
      
      return () => clearTimeout(timeoutId)
    }
  }, [searchTerm, user])

  const loadWarehouses = async () => {
    try {
      setIsLoadingData(true)
      const params = new URLSearchParams()
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim())
      }
      params.append('is_active', 'true') // Show active warehouses by default
      
      const response = await api.get(`/warehouses?${params.toString()}`)
      setWarehouses(response.data.warehouses || [])
    } catch (error) {
      console.error('Error loading warehouses:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleCreate = async (data: WarehouseFormData) => {
    try {
      const createData = {
        name: data.name,
        location: data.location,
        address: data.address && data.address.trim() ? data.address : null,
        contact_person: data.contact_person && data.contact_person.trim() ? data.contact_person : null,
        contact_phone: data.contact_phone && data.contact_phone.trim() ? data.contact_phone : null,
      }
      
      await api.post('/warehouses', createData)
      setIsCreateOpen(false)
      loadWarehouses() // Reload data
    } catch (error) {
      console.error('Error creating warehouse:', error)
    }
  }

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse)
    setIsEditOpen(true)
  }

  const handleUpdate = async (data: WarehouseFormData) => {
    if (!editingWarehouse) return
    
    try {
      const updateData = {
        name: data.name,
        location: data.location,
        address: data.address && data.address.trim() ? data.address : null,
        contact_person: data.contact_person && data.contact_person.trim() ? data.contact_person : null,
        contact_phone: data.contact_phone && data.contact_phone.trim() ? data.contact_phone : null,
        is_active: editingWarehouse.is_active,
      }
      
      await api.put(`/warehouses/${editingWarehouse.id}`, updateData)
      setIsEditOpen(false)
      setEditingWarehouse(null)
      loadWarehouses() // Reload data
    } catch (error) {
      console.error('Error updating warehouse:', error)
    }
  }

  const handleDelete = async (warehouse: Warehouse) => {
    if (!confirm(`Are you sure you want to delete "${warehouse.name}"?`)) {
      return
    }
    
    try {
      await api.delete(`/warehouses/${warehouse.id}`)
      loadWarehouses() // Reload data
    } catch (error) {
      console.error('Error deleting warehouse:', error)
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
                <h1 className="text-3xl font-bold text-gray-900">Warehouses</h1>
                <p className="mt-2 text-gray-600">Manage your storage locations</p>
              </div>
              <Button 
                className="flex items-center gap-2"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Warehouse
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Warehouse List</CardTitle>
                <CardDescription>
                  View and manage all your warehouses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search Bar */}
                <div className="mb-6">
                  <SearchBar
                    placeholder="Search warehouses..."
                    value={searchTerm}
                    onChange={setSearchTerm}
                  />
                </div>

                {/* Table */}
                {isLoadingData ? (
                  <LoadingSpinner text="Loading warehouses..." />
                ) : warehouses.length === 0 ? (
                  <EmptyState 
                    title={
                      searchTerm ? 'No warehouses found matching your search' : 'No warehouses found'
                    }
                    description={
                      searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first warehouse'
                    }
                  />
                ) : (
                  <WarehouseTable
                    warehouses={warehouses}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                )}
              </CardContent>
            </Card>

            {/* Create Warehouse Form */}
            <WarehouseForm
              isOpen={isCreateOpen}
              onOpenChange={setIsCreateOpen}
              onSubmit={handleCreate}
              onCancel={() => setIsCreateOpen(false)}
              title="Create New Warehouse"
              description="Add a new warehouse to your inventory system."
              submitText="Create Warehouse"
            />

            {/* Edit Warehouse Form */}
            <WarehouseForm
              isOpen={isEditOpen}
              onOpenChange={setIsEditOpen}
              onSubmit={handleUpdate}
              onCancel={() => {
                setIsEditOpen(false)
                setEditingWarehouse(null)
              }}
              title="Edit Warehouse"
              description="Update the warehouse information."
              submitText="Update Warehouse"
              defaultValues={editingWarehouse ? {
                name: editingWarehouse.name,
                location: editingWarehouse.location,
                address: editingWarehouse.address || '',
                contact_person: editingWarehouse.contact_person || '',
                contact_phone: editingWarehouse.contact_phone || '',
              } : undefined}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
