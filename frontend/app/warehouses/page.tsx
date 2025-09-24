'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import api from '@/lib/api'

const warehouseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().min(1, 'Location is required'),
  address: z.string().optional(),
  contact_person: z.string().optional(),
  contact_phone: z.string().optional(),
})

type WarehouseForm = z.infer<typeof warehouseSchema>

interface Warehouse {
  id: string
  name: string
  location: string
  address?: string
  contact_person?: string
  contact_phone?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

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

  // Form setup
  const form = useForm<WarehouseForm>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: '',
      location: '',
      address: '',
      contact_person: '',
      contact_phone: '',
    },
  })

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

  const handleCreate = async (data: WarehouseForm) => {
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
      form.reset()
      loadWarehouses() // Reload data
    } catch (error) {
      console.error('Error creating warehouse:', error)
    }
  }

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse)
    setIsEditOpen(true)
    // Reset form with warehouse data after dialog opens
    setTimeout(() => {
      form.reset({
        name: warehouse.name,
        location: warehouse.location,
        address: warehouse.address || '',
        contact_person: warehouse.contact_person || '',
        contact_phone: warehouse.contact_phone || '',
      })
    }, 0)
  }

  const handleUpdate = async (data: WarehouseForm) => {
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
      form.reset()
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
                <h1 className="text-3xl font-bold text-gray-900">Warehouses</h1>
                <p className="mt-2 text-gray-600">Manage your storage locations</p>
              </div>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Warehouse
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Warehouse</DialogTitle>
                    <DialogDescription>
                      Add a new warehouse to your inventory system.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          {...form.register('name')}
                          placeholder="Warehouse name"
                        />
                        {form.formState.errors.name && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.name.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="location">Location *</Label>
                        <Input
                          id="location"
                          {...form.register('location')}
                          placeholder="City, State"
                        />
                        {form.formState.errors.location && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.location.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        {...form.register('address')}
                        placeholder="Full address"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contact_person">Contact Person</Label>
                        <Input
                          id="contact_person"
                          {...form.register('contact_person')}
                          placeholder="Contact person name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact_phone">Contact Phone</Label>
                        <Input
                          id="contact_phone"
                          {...form.register('contact_phone')}
                          placeholder="Phone number"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        Create Warehouse
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Edit Dialog */}
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Warehouse</DialogTitle>
                    <DialogDescription>
                      Update the warehouse information.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-name">Name *</Label>
                        <Input
                          id="edit-name"
                          {...form.register('name')}
                          placeholder="Warehouse name"
                        />
                        {form.formState.errors.name && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.name.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="edit-location">Location *</Label>
                        <Input
                          id="edit-location"
                          {...form.register('location')}
                          placeholder="City, State"
                        />
                        {form.formState.errors.location && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.location.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit-address">Address</Label>
                      <Textarea
                        id="edit-address"
                        {...form.register('address')}
                        placeholder="Full address"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-contact_person">Contact Person</Label>
                        <Input
                          id="edit-contact_person"
                          {...form.register('contact_person')}
                          placeholder="Contact person name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-contact_phone">Contact Phone</Label>
                        <Input
                          id="edit-contact_phone"
                          {...form.register('contact_phone')}
                          placeholder="Phone number"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditOpen(false)
                          setEditingWarehouse(null)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        Update Warehouse
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
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
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search warehouses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Table */}
                {isLoadingData ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading warehouses...</p>
                  </div>
                ) : warehouses.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {searchTerm ? 'No warehouses found matching your search' : 'No warehouses found'}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first warehouse'}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {warehouses.map((warehouse) => (
                        <TableRow key={warehouse.id}>
                          <TableCell className="font-medium">{warehouse.name}</TableCell>
                          <TableCell>{warehouse.location}</TableCell>
                          <TableCell>{warehouse.address || '-'}</TableCell>
                          <TableCell>
                            <div>
                              {warehouse.contact_person && (
                                <div className="font-medium">{warehouse.contact_person}</div>
                              )}
                              {warehouse.contact_phone && (
                                <div className="text-sm text-gray-500">{warehouse.contact_phone}</div>
                              )}
                              {!warehouse.contact_person && !warehouse.contact_phone && '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              warehouse.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {warehouse.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(warehouse.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(warehouse)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(warehouse)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
