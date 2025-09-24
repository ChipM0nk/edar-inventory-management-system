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
import { Plus, Search, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import api from '@/lib/api'

const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category_id: z.string().min(1, 'Category is required'),
  supplier_id: z.string().min(1, 'Supplier is required'),
  unit_price: z.number().min(0, 'Unit price must be greater than or equal to 0'),
})

type ProductForm = z.infer<typeof productSchema>

interface Product {
  id: string
  sku: string
  name: string
  description?: string
  category_id: string
  supplier_id: string
  category?: string
  supplier?: string
  unit_price: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Category {
  id: string
  name: string
  description: string
  is_active: boolean
}

interface Supplier {
  id: string
  name: string
  contact_person: string
  email: string
  phone: string
  is_active: boolean
}

type SortField = 'name' | 'unit_price' | 'created_at'
type SortOrder = 'asc' | 'desc'

export default function ProductsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
  // State management
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSupplier, setSelectedSupplier] = useState('all')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [isLoadingData, setIsLoadingData] = useState(false)

  // Form setup
  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      category_id: '',
      supplier_id: '',
      unit_price: 0,
    },
  })

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Load data
  useEffect(() => {
    if (user) {
      loadCategories()
      loadSuppliers()
      loadProducts()
    }
  }, [user])

  // Reload products when filters change
  useEffect(() => {
    if (user) {
      const timeoutId = setTimeout(() => {
        loadProducts()
      }, 300)
      
      return () => clearTimeout(timeoutId)
    }
  }, [searchTerm, selectedCategory, selectedSupplier, sortField, sortOrder, user])

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories')
      setCategories(response.data.categories || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadSuppliers = async () => {
    try {
      const response = await api.get('/suppliers')
      setSuppliers(response.data.suppliers || [])
    } catch (error) {
      console.error('Error loading suppliers:', error)
    }
  }

  const loadProducts = async () => {
    try {
      setIsLoadingData(true)
      const params = new URLSearchParams()
      
      if (searchTerm.trim()) {
        params.append('name', searchTerm.trim())
      }
      if (selectedCategory && selectedCategory !== 'all') {
        params.append('category_id', selectedCategory)
      }
      if (selectedSupplier && selectedSupplier !== 'all') {
        params.append('supplier_id', selectedSupplier)
      }
      params.append('sort_by', sortField)
      params.append('sort_order', sortOrder)
      params.append('limit', '50') // Load more items for better UX
      
      const response = await api.get(`/products?${params.toString()}`)
      setProducts(response.data.products || [])
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleCreate = async (data: ProductForm) => {
    try {
      const createData = {
        sku: data.sku,
        name: data.name,
        description: data.description && data.description.trim() ? data.description : null,
        category_id: data.category_id,
        supplier_id: data.supplier_id,
        unit_price: data.unit_price,
      }
      
      await api.post('/products', createData)
      setIsCreateOpen(false)
      form.reset()
      loadProducts()
    } catch (error) {
      console.error('Error creating product:', error)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setIsEditOpen(true)
    setTimeout(() => {
      form.reset({
        sku: product.sku,
        name: product.name,
        description: product.description || '',
        category_id: product.category_id,
        supplier_id: product.supplier_id,
        unit_price: product.unit_price,
      })
    }, 0)
  }

  const handleUpdate = async (data: ProductForm) => {
    if (!editingProduct) return
    
    try {
      const updateData = {
        sku: data.sku,
        name: data.name,
        description: data.description && data.description.trim() ? data.description : null,
        category_id: data.category_id,
        supplier_id: data.supplier_id,
        unit_price: data.unit_price,
      }
      
      await api.put(`/products/${editingProduct.id}`, updateData)
      setIsEditOpen(false)
      setEditingProduct(null)
      form.reset()
      loadProducts()
    } catch (error) {
      console.error('Error updating product:', error)
    }
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return
    }
    
    try {
      await api.delete(`/products/${product.id}`)
      loadProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
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
                <h1 className="text-3xl font-bold text-gray-900">Products</h1>
                <p className="mt-2 text-gray-600">Manage your inventory products</p>
              </div>
              <Dialog open={isCreateOpen} onOpenChange={(open) => {
                setIsCreateOpen(open)
                if (open) {
                  form.reset({
                    sku: '',
                    name: '',
                    description: '',
                    category_id: '',
                    supplier_id: '',
                    unit_price: 0,
                  })
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Product</DialogTitle>
                    <DialogDescription>
                      Add a new product to your inventory system.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sku">SKU *</Label>
                        <Input
                          id="sku"
                          {...form.register('sku')}
                          placeholder="Product SKU"
                        />
                        {form.formState.errors.sku && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.sku.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          {...form.register('name')}
                          placeholder="Product name"
                        />
                        {form.formState.errors.name && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.name.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        {...form.register('description')}
                        placeholder="Product description"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category_id">Category *</Label>
                        <Select onValueChange={(value) => form.setValue('category_id', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.category_id && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.category_id.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="supplier_id">Supplier *</Label>
                        <Select onValueChange={(value) => form.setValue('supplier_id', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.supplier_id && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.supplier_id.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="unit_price">Unit Price (₱) *</Label>
                      <Input
                        id="unit_price"
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register('unit_price', { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                      {form.formState.errors.unit_price && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.unit_price.message}
                        </p>
                      )}
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
                        Create Product
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Edit Dialog */}
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Edit Product</DialogTitle>
                    <DialogDescription>
                      Update the product information.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-sku">SKU *</Label>
                        <Input
                          id="edit-sku"
                          {...form.register('sku')}
                          placeholder="Product SKU"
                        />
                        {form.formState.errors.sku && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.sku.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="edit-name">Name *</Label>
                        <Input
                          id="edit-name"
                          {...form.register('name')}
                          placeholder="Product name"
                        />
                        {form.formState.errors.name && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.name.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        {...form.register('description')}
                        placeholder="Product description"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-category_id">Category *</Label>
                        <Select onValueChange={(value) => form.setValue('category_id', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.category_id && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.category_id.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="edit-supplier_id">Supplier *</Label>
                        <Select onValueChange={(value) => form.setValue('supplier_id', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.supplier_id && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.supplier_id.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit-unit_price">Unit Price (₱) *</Label>
                      <Input
                        id="edit-unit_price"
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register('unit_price', { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                      {form.formState.errors.unit_price && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.unit_price.message}
                        </p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditOpen(false)
                          setEditingProduct(null)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        Update Product
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Product List</CardTitle>
                <CardDescription>
                  View and manage all your products
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="mb-6 space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search products..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="min-w-[150px]">
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-[150px]">
                      <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Suppliers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Suppliers</SelectItem>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Table */}
                {isLoadingData ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading products...</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {searchTerm || (selectedCategory && selectedCategory !== 'all') || (selectedSupplier && selectedSupplier !== 'all')
                        ? 'No products found matching your filters' 
                        : 'No products found'}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      {searchTerm || (selectedCategory && selectedCategory !== 'all') || (selectedSupplier && selectedSupplier !== 'all')
                        ? 'Try adjusting your search terms or filters' 
                        : 'Get started by adding your first product'}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort('name')}
                            className="flex items-center gap-2 p-0 h-auto font-semibold"
                          >
                            Name {getSortIcon('name')}
                          </Button>
                        </TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort('unit_price')}
                            className="flex items-center gap-2 p-0 h-auto font-semibold"
                          >
                            Unit Price {getSortIcon('unit_price')}
                          </Button>
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {product.description || '-'}
                          </TableCell>
                          <TableCell>{product.category || '-'}</TableCell>
                          <TableCell>{product.supplier || '-'}</TableCell>
                          <TableCell className="font-mono">
                            ₱{product.unit_price.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              product.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {product.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(product)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(product)}
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