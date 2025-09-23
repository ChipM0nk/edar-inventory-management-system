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

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
})

type CategoryForm = z.infer<typeof categorySchema>

interface Category {
  id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function CategoriesPage() {
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
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
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

  
  const { data: categoriesData, isLoading, isFetching, error } = useQuery({
    queryKey: ['categories', searchTerm, showInactive, currentPage, pageSize, sortField, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append('name', searchTerm)
      if (showInactive) params.append('is_active', 'false')
      params.append('page', currentPage.toString())
      params.append('limit', pageSize.toString())
      params.append('sort_by', sortField)
      params.append('sort_order', sortOrder)
      
      const response = await api.get(`/categories?${params.toString()}`)
      return response.data
    },
  })

  
  // Memoize table data to prevent unnecessary re-renders
  const tableData = useMemo(() => {
    return {
      categories: categoriesData?.categories || [],
      totalPages: categoriesData?.pages || 1,
      total: categoriesData?.total || 0,
      isLoading,
      isFetching
    }
  }, [categoriesData, isLoading, isFetching])


  // Focus search input after data loads
  useEffect(() => {
    if (!isLoading && tableData.categories.length >= 0) {
      const timer = setTimeout(() => {
        focusSearchInput()
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [isLoading, tableData.categories.length, focusSearchInput])

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
    mutationFn: async (data: CategoryForm) => {
      const response = await api.post('/categories', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'], exact: false })
      setIsCreateOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CategoryForm & { is_active?: boolean } }) => {
      const response = await api.put(`/categories/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'], exact: false })
      setIsEditOpen(false)
      setEditingCategory(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categories/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'], exact: false })
    },
  })

  const createForm = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const editForm = useForm<CategoryForm & { is_active: boolean }>({
    resolver: zodResolver(categorySchema.extend({ is_active: z.boolean() })),
    defaultValues: {
      name: '',
      description: '',
      is_active: true,
    },
  })

  const handleCreate = (data: CategoryForm) => {
    createMutation.mutate(data)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    editForm.reset({
      name: category.name,
      description: category.description || '',
      is_active: category.is_active,
    })
    setIsEditOpen(true)
  }

  const handleUpdate = (data: CategoryForm & { is_active: boolean }) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data })
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleToggleActive = (category: Category) => {
    updateMutation.mutate({
      id: category.id,
      data: {
        name: category.name,
        description: category.description || '',
        is_active: !category.is_active,
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
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Manage product categories</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Category Management</CardTitle>
                <CardDescription>
                  Create, edit, and manage product categories
                </CardDescription>
              </div>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Category</DialogTitle>
                    <DialogDescription>
                      Add a new product category to organize your inventory.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        {...createForm.register('name')}
                        placeholder="Category name"
                      />
                      {createForm.formState.errors.name && (
                        <p className="text-sm text-red-600 mt-1">
                          {createForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        {...createForm.register('description')}
                        placeholder="Category description"
                        rows={3}
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
                        {createMutation.isPending ? 'Creating...' : 'Create Category'}
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
                      placeholder="Search categories..."
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
                Error loading categories: {error.message}
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
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('created_at')}
                      className="flex items-center space-x-1 hover:text-gray-600"
                    >
                      <span>Created</span>
                      {sortField === 'created_at' && (
                        sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.categories?.map((category: Category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={category.is_active ? 'default' : 'secondary'}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(category.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(category)}
                        >
                          {category.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
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
                <>Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, tableData.total)} of {tableData.total} categories</>
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update the category information.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  {...editForm.register('name')}
                  placeholder="Category name"
                />
                {editForm.formState.errors.name && (
                  <p className="text-sm text-red-600 mt-1">
                    {editForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  {...editForm.register('description')}
                  placeholder="Category description"
                  rows={3}
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
                  {updateMutation.isPending ? 'Updating...' : 'Update Category'}
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