'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Edit, Trash2, Search, Filter, ChevronUp, ChevronDown } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import api from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'
import { AppLayout } from '@/components/app-layout'

const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contact_person: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
})

type SupplierForm = z.infer<typeof supplierSchema>

interface Supplier {
  id: string
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

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
    mutationFn: async (data: SupplierForm) => {
      const response = await api.post('/suppliers', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'], exact: false })
      setIsCreateOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SupplierForm & { is_active?: boolean } }) => {
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

  const createForm = useForm<SupplierForm>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
    },
  })

  const editForm = useForm<SupplierForm & { is_active: boolean }>({
    resolver: zodResolver(supplierSchema.extend({ is_active: z.boolean() })),
    defaultValues: {
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      is_active: true,
    },
  })

  const handleCreate = (data: SupplierForm) => {
    createMutation.mutate(data)
  }

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    editForm.reset({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      city: supplier.city || '',
      state: supplier.state || '',
      country: supplier.country || '',
      postal_code: supplier.postal_code || '',
      is_active: supplier.is_active,
    })
    setIsEditOpen(true)
  }

  const handleUpdate = (data: SupplierForm & { is_active: boolean }) => {
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
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Supplier
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Supplier</DialogTitle>
                    <DialogDescription>
                      Add a new supplier to your inventory system.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          {...createForm.register('name')}
                          placeholder="Supplier name"
                        />
                        {createForm.formState.errors.name && (
                          <p className="text-sm text-red-600 mt-1">
                            {createForm.formState.errors.name.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="contact_person">Contact Person</Label>
                        <Input
                          id="contact_person"
                          {...createForm.register('contact_person')}
                          placeholder="Contact person name"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          {...createForm.register('email')}
                          placeholder="supplier@example.com"
                        />
                        {createForm.formState.errors.email && (
                          <p className="text-sm text-red-600 mt-1">
                            {createForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          {...createForm.register('phone')}
                          placeholder="Phone number"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        {...createForm.register('address')}
                        placeholder="Full address"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          {...createForm.register('city')}
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          {...createForm.register('state')}
                          placeholder="State"
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          {...createForm.register('country')}
                          placeholder="Country"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="postal_code">Postal Code</Label>
                      <Input
                        id="postal_code"
                        {...createForm.register('postal_code')}
                        placeholder="Postal code"
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createMutation.isPending}>
                        {createMutation.isPending ? 'Creating...' : 'Create Supplier'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div 
                  className="relative cursor-text"
                  onClick={() => focusSearchInput()}
                >
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      ref={searchInputRef}
                      placeholder="Search suppliers..."
                      value={searchInput}
                      onChange={handleSearchChange}
                      className="pl-10 pr-10"
                      disabled={tableData.isFetching}
                    />
                  {tableData.isFetching && searchInput ? (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                    </div>
                  ) : searchInput ? (
                    <button
                      type="button"
                      onClick={() => setSearchInput('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  ) : null}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleShowInactiveToggle}
                className="flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showInactive ? 'Hide Inactive' : 'Show Inactive'}
              </Button>
            </div>

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

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center space-x-1 hover:text-gray-600"
                    >
                      <span>Name</span>
                      {sortField === 'name' && (
                        sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.suppliers?.map((supplier: Supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.contact_person || '-'}</TableCell>
                    <TableCell>{supplier.email || '-'}</TableCell>
                    <TableCell>{supplier.phone || '-'}</TableCell>
                    <TableCell>
                      {supplier.city && supplier.state 
                        ? `${supplier.city}, ${supplier.state}` 
                        : supplier.city || supplier.state || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                        {supplier.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(supplier)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(supplier)}
                        >
                          {supplier.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(supplier.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          
          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-gray-500">
              {searchTerm ? (
                <>Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, tableData.total)} of {tableData.total} results for "{searchTerm}"</>
              ) : (
                <>Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, tableData.total)} of {tableData.total} suppliers</>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, tableData.totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, tableData.totalPages))}
                disabled={currentPage === tableData.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Supplier</DialogTitle>
              <DialogDescription>
                Update the supplier information.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    {...editForm.register('name')}
                    placeholder="Supplier name"
                  />
                  {editForm.formState.errors.name && (
                    <p className="text-sm text-red-600 mt-1">
                      {editForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-contact_person">Contact Person</Label>
                  <Input
                    id="edit-contact_person"
                    {...editForm.register('contact_person')}
                    placeholder="Contact person name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    {...editForm.register('email')}
                    placeholder="supplier@example.com"
                  />
                  {editForm.formState.errors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {editForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    {...editForm.register('phone')}
                    placeholder="Phone number"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-address">Address</Label>
                <Textarea
                  id="edit-address"
                  {...editForm.register('address')}
                  placeholder="Full address"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-city">City</Label>
                  <Input
                    id="edit-city"
                    {...editForm.register('city')}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-state">State</Label>
                  <Input
                    id="edit-state"
                    {...editForm.register('state')}
                    placeholder="State"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-country">Country</Label>
                  <Input
                    id="edit-country"
                    {...editForm.register('country')}
                    placeholder="Country"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-postal_code">Postal Code</Label>
                <Input
                  id="edit-postal_code"
                  {...editForm.register('postal_code')}
                  placeholder="Postal code"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  {...editForm.register('is_active')}
                  className="rounded"
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Updating...' : 'Update Supplier'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </AppLayout>
  )
}