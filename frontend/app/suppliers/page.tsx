'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'
import { AppLayout } from '@/components/app-layout'
import { Supplier, SupplierFormData } from '@/lib/types'
import { SupplierForm, SupplierTable, SupplierFilters, SupplierPagination } from '@/components/suppliers'
import { LoadingSpinner, EmptyState } from '@/components/shared'

export default function SuppliersPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [sortField, setSortField] = useState<'name' | 'created_at'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  // Ref for search input to handle auto-focus
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput])

  // Reset page when search term changes (but not on every keystroke)
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Function to focus search input
  const focusSearchInput = useCallback(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
      const length = searchInputRef.current.value.length
      searchInputRef.current.setSelectionRange(length, length)
    }
  }, [])

  // Auto-focus search input after filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      focusSearchInput()
    }, 100)

    return () => clearTimeout(timer)
  }, [showInactive, sortField, sortOrder, focusSearchInput])

  // Auto-focus search input after page changes
  useEffect(() => {
    const timer = setTimeout(() => {
      focusSearchInput()
    }, 50)

    return () => clearTimeout(timer)
  }, [currentPage, focusSearchInput])

  const queryClient = useQueryClient()

  const { data: suppliersData, isLoading, isFetching, error } = useQuery({
    queryKey: ['suppliers', searchTerm, showInactive, currentPage, pageSize, sortField, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append('name', searchTerm)
      if (showInactive) params.append('is_active', 'false')
      params.append('page', currentPage.toString())
      params.append('limit', pageSize.toString())
      params.append('sort_by', sortField)
      params.append('sort_order', sortOrder)
      
      const response = await api.get(`/suppliers?${params.toString()}`)
      
      // Focused logging for API results
      
      return response.data
    },
  })

  // Memoize table data to prevent unnecessary re-renders
  const tableData = useMemo(() => {
    return {
      suppliers: suppliersData?.suppliers || [],
      totalPages: suppliersData?.pages || 1,
      total: suppliersData?.total || 0,
      isLoading,
      isFetching
    }
  }, [suppliersData, isLoading, isFetching])

  // Focus search input after data loads
  useEffect(() => {
    if (!isLoading && tableData.suppliers.length >= 0) {
      const timer = setTimeout(() => {
        focusSearchInput()
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [isLoading, tableData.suppliers.length, focusSearchInput])

  // Focus search input on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      focusSearchInput()
    }, 500)
    return () => clearTimeout(timer)
  }, [focusSearchInput])

  const handleSort = useCallback((field: 'name' | 'created_at') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }, [sortField, sortOrder])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
  }, [])

  const handleShowInactiveToggle = useCallback(() => {
    setShowInactive(!showInactive)
    setCurrentPage(1)
  }, [showInactive])

  const createMutation = useMutation({
    mutationFn: async (data: SupplierFormData) => {
      const response = await api.post('/suppliers', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'], exact: false })
      setIsCreateOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SupplierFormData }) => {
      const response = await api.put(`/suppliers/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'], exact: false })
      setIsEditOpen(false)
      setEditingSupplier(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/suppliers/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'], exact: false })
    },
  })


  const handleCreate = (data: SupplierFormData) => {
    createMutation.mutate(data)
  }

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setIsEditOpen(true)
  }

  const handleUpdate = (data: SupplierFormData) => {
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data })
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleToggleActive = (supplier: Supplier) => {
    updateMutation.mutate({
      id: supplier.id,
      data: {
        name: supplier.name,
        contact_person: supplier.contact_person || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        state: supplier.state || '',
        country: supplier.country || '',
        postal_code: supplier.postal_code || '',
        is_active: !supplier.is_active,
      },
    })
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600">Manage product suppliers</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Supplier Management</CardTitle>
                <CardDescription>
                  Create, edit, and manage product suppliers
                </CardDescription>
              </div>
              <Button 
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                    Add Supplier
                  </Button>
            </div>
          </CardHeader>
          <CardContent>
            <SupplierFilters
              searchInput={searchInput}
              onSearchChange={handleSearchChange}
              showInactive={showInactive}
              onToggleInactive={handleShowInactiveToggle}
              isFetching={tableData.isFetching}
              onClearSearch={() => setSearchInput('')}
              searchInputRef={searchInputRef}
              onFocusSearch={focusSearchInput}
            />

            {error && (
              <div className="text-red-500 p-4">
                Error loading suppliers: {error.message}
              </div>
            )}

            {searchTerm && (
              <div className="text-blue-600 p-2 bg-blue-50 rounded">
                Searching for: "{searchTerm}" - Found {tableData.total} results
              </div>
            )}

            {tableData.suppliers?.length === 0 ? (
              <EmptyState 
                title="No suppliers found"
                description="Get started by adding your first supplier"
              />
            ) : (
              <SupplierTable
                suppliers={tableData.suppliers}
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
              />
            )}
          </CardContent>
          
          {/* Pagination */}
          <SupplierPagination
            currentPage={currentPage}
            totalPages={tableData.totalPages}
            totalItems={tableData.total}
            pageSize={pageSize}
            searchTerm={searchTerm}
            onPageChange={setCurrentPage}
          />
        </Card>

        {/* Create Supplier Form */}
        <SupplierForm
          isOpen={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
          title="Create New Supplier"
          description="Add a new supplier to your inventory system."
          submitText="Create Supplier"
          isSubmitting={createMutation.isPending}
        />

        {/* Edit Supplier Form */}
        <SupplierForm
          isOpen={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSubmit={handleUpdate}
          onCancel={() => {
            setIsEditOpen(false)
            setEditingSupplier(null)
          }}
          title="Edit Supplier"
          description="Update the supplier information."
          submitText="Update Supplier"
          isSubmitting={updateMutation.isPending}
          showActiveToggle={true}
          defaultValues={editingSupplier ? {
            name: editingSupplier.name,
            contact_person: editingSupplier.contact_person || '',
            email: editingSupplier.email || '',
            phone: editingSupplier.phone || '',
            address: editingSupplier.address || '',
            city: editingSupplier.city || '',
            state: editingSupplier.state || '',
            country: editingSupplier.country || '',
            postal_code: editingSupplier.postal_code || '',
            is_active: editingSupplier.is_active,
          } : undefined}
        />
      </div>
    </div>
    </AppLayout>
  )
}