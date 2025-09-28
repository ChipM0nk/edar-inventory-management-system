'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import api from '@/lib/api'
import { Product, Category, Supplier, SortField, SortOrder, ProductFormData } from '@/lib/types'
import { ProductForm } from '@/components/products/product-form'
import { ProductTable } from '@/components/products/product-table'
import { ProductFilters } from '@/components/products/product-filters'
import { Pagination } from '@/components/products/pagination'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'

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
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [totalProducts, setTotalProducts] = useState(0)


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
        setCurrentPage(1) // Reset to first page when filters change
        loadProducts()
      }, 300)
      
      return () => clearTimeout(timeoutId)
    }
  }, [searchTerm, selectedCategory, selectedSupplier, sortField, sortOrder, user])

  // Reload products when page changes
  useEffect(() => {
    if (user) {
      loadProducts()
    }
  }, [currentPage, user])

  // Pagination logic
  const totalPages = Math.ceil(totalProducts / itemsPerPage)

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
      params.append('page', currentPage.toString())
      params.append('limit', itemsPerPage.toString())
      
      const response = await api.get(`/products/with-stock?${params.toString()}`)
      setProducts(response.data.products || [])
      setTotalProducts(response.data.total || 0)
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleCreate = async (data: ProductFormData) => {
    try {
      const createData = {
        sku: data.sku,
        name: data.name,
        description: data.description && data.description.trim() ? data.description : null,
        category_id: data.category_id,
        supplier_id: data.supplier_id,
        unit_price: data.unit_price,
        min_stock_level: data.min_stock_level,
      }
      
      await api.post('/products', createData)
      setIsCreateOpen(false)
      loadProducts()
    } catch (error) {
      console.error('Error creating product:', error)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setIsEditOpen(true)
  }

  const handleUpdate = async (data: ProductFormData) => {
    if (!editingProduct) return
    
    try {
      const updateData = {
        sku: data.sku,
        name: data.name,
        description: data.description && data.description.trim() ? data.description : null,
        category_id: data.category_id,
        supplier_id: data.supplier_id,
        unit_price: data.unit_price,
        min_stock_level: data.min_stock_level,
      }
      
      await api.put(`/products/${editingProduct.id}`, updateData)
      setIsEditOpen(false)
      setEditingProduct(null)
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
                <h1 className="text-3xl font-bold text-gray-900">Products</h1>
                <p className="mt-2 text-gray-600">Manage your inventory products</p>
              </div>
              <Button 
                className="flex items-center gap-2"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
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
                <ProductFilters
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  selectedSupplier={selectedSupplier}
                  onSupplierChange={setSelectedSupplier}
                  categories={categories}
                  suppliers={suppliers}
                />

                {/* Table */}
                {isLoadingData ? (
                  <LoadingSpinner text="Loading products..." />
                ) : products.length === 0 ? (
                  <EmptyState 
                    title={
                      searchTerm || (selectedCategory && selectedCategory !== 'all') || (selectedSupplier && selectedSupplier !== 'all')
                        ? 'No products found matching your filters' 
                        : 'No products found'
                    }
                    description={
                      searchTerm || (selectedCategory && selectedCategory !== 'all') || (selectedSupplier && selectedSupplier !== 'all')
                        ? 'Try adjusting your search terms or filters' 
                        : 'Get started by adding your first product'
                    }
                  />
                ) : (
                  <>
                    <ProductTable
                      products={products}
                      sortField={sortField}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalProducts}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Create Product Form */}
            <ProductForm
              key="create"
              isOpen={isCreateOpen}
              onOpenChange={setIsCreateOpen}
              onSubmit={handleCreate}
              onCancel={() => setIsCreateOpen(false)}
              categories={categories}
              suppliers={suppliers}
              title="Create New Product"
              description="Add a new product to your inventory system."
              submitText="Create Product"
            />

            {/* Edit Product Form */}
            <ProductForm
              key={editingProduct?.id || 'create'}
              isOpen={isEditOpen}
              onOpenChange={setIsEditOpen}
              onSubmit={handleUpdate}
              onCancel={() => {
                setIsEditOpen(false)
                setEditingProduct(null)
              }}
              categories={categories}
              suppliers={suppliers}
              title="Edit Product"
              description="Update the product information."
              submitText="Update Product"
              defaultValues={editingProduct ? {
                sku: editingProduct.sku,
                name: editingProduct.name,
                description: editingProduct.description || '',
                category_id: editingProduct.category_id,
                supplier_id: editingProduct.supplier_id,
                unit_price: editingProduct.unit_price,
                min_stock_level: editingProduct.min_stock_level || 0,
              } : undefined}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}