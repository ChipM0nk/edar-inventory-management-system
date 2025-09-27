'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Package, Search, X } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import api from '@/lib/api'
import { AppLayout } from '@/components/app-layout'

// Types
interface Supplier {
  id: string
  name: string
  email: string
  phone: string
}

interface Warehouse {
  id: string
  name: string
  location: string
}

interface Product {
  id: string
  name: string
  sku: string
  description?: string
  unit_price: number
  min_stock_level: number
}

interface StockInItem {
  product_id: string
  product_name: string
  product_sku: string
  warehouse_id: string
  quantity: number
  cost_price: number
  reason?: string
  selected: boolean
}

// Form schema
const stockInSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier is required'),
  warehouse_id: z.string().min(1, 'Warehouse is required'),
  received_date: z.string().min(1, 'Received date is required'),
  processed_by: z.string().min(1, 'Processed by is required'),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
})

type StockInForm = z.infer<typeof stockInSchema>

export default function NewStockMovementPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
  // State management
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [stockInItems, setStockInItems] = useState<StockInItem[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<string>('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productQuantity, setProductQuantity] = useState(0)
  const [productCost, setProductCost] = useState(0)
  const [productCostDisplay, setProductCostDisplay] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  // Form setup
  const form = useForm<StockInForm>({
    resolver: zodResolver(stockInSchema),
    defaultValues: {
      supplier_id: '',
      warehouse_id: '',
      received_date: new Date().toISOString().split('T')[0],
      processed_by: user ? `${user.first_name} ${user.last_name}` : '',
      reference_number: '',
      notes: '',
    },
  })

  const watchedSupplier = form.watch('supplier_id')

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Update processed_by when user loads
  useEffect(() => {
    if (user) {
      form.setValue('processed_by', `${user.first_name} ${user.last_name}`)
    }
  }, [user, form])

  // Load initial data
  useEffect(() => {
    if (user) {
      loadSuppliers()
      loadWarehouses()
    }
  }, [user])

  // Load suppliers
  const loadSuppliers = async () => {
    try {
      const response = await api.get('/suppliers')
      setSuppliers(response.data.suppliers || [])
    } catch (error) {
      console.error('Error loading suppliers:', error)
    }
  }

  // Load warehouses
  const loadWarehouses = async () => {
    try {
      const response = await api.get('/warehouses')
      setWarehouses(response.data.warehouses || [])
    } catch (error) {
      console.error('Error loading warehouses:', error)
    }
  }

  // Load products for selected supplier
  const loadProducts = async () => {
    if (!selectedSupplier) {
      console.log('No supplier selected, cannot load products')
      return
    }
    
    try {
      console.log('Loading products for supplier:', selectedSupplier)
      setIsLoadingData(true)
      const params = new URLSearchParams()
      params.append('supplier_id', selectedSupplier)
      params.append('limit', '100')
      
      console.log('API call:', `/products?${params.toString()}`)
      const response = await api.get(`/products?${params.toString()}`)
      console.log('API response:', response.data)
      
      const fetchedProducts = response.data.products || []
      console.log('Fetched products:', fetchedProducts)
      
      setProducts(fetchedProducts)
      setFilteredProducts(fetchedProducts)
    } catch (error) {
      console.error('Error loading products:', error)
      alert('Error loading products: ' + (error as any)?.response?.data?.error || error)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Handle supplier change
  const handleSupplierChange = (supplierId: string) => {
    setSelectedSupplier(supplierId)
    setStockInItems([])
    setProducts([])
    setFilteredProducts([])
  }

  // Handle product search
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    if (value.trim() === '') {
      setFilteredProducts(products)
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(value.toLowerCase()) ||
        product.sku.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredProducts(filtered)
    }
  }

  // Currency formatting functions
  const formatCurrency = (value: string): string => {
    // Remove all non-numeric characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, '')
    
    // Handle empty input
    if (!cleanValue) return ''
    
    // Handle just a decimal point
    if (cleanValue === '.') return '0.'
    
    // Handle multiple decimal points - keep only the first one
    const parts = cleanValue.split('.')
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('')
    }
    
    // If it has a decimal point, limit to 2 decimal places
    if (parts.length === 2) {
      return parts[0] + '.' + parts[1].slice(0, 2)
    }
    
    // Return the clean value as is (no decimal formatting during typing)
    return cleanValue
  }

  const parseCurrency = (value: string): number => {
    const cleanValue = value.replace(/[^\d.]/g, '')
    return parseFloat(cleanValue) || 0
  }

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product)
    setProductQuantity(0)
    setProductCost(0)
    setProductCostDisplay('')
    // Focus on quantity field after product selection
    setTimeout(() => {
      const quantityInput = document.querySelector('input[type="number"]') as HTMLInputElement
      if (quantityInput) {
        quantityInput.focus()
      }
    }, 100)
  }

  // Handle add product
  const handleAddProduct = () => {
    if (!selectedProduct || productQuantity <= 0 || productCost <= 0) {
      alert('Please select a product and enter valid quantity and cost price')
      return
    }

    // Validate cost price is lower than unit price
    if (productCost >= selectedProduct.unit_price) {
      alert(`Cost price ($${productCost.toFixed(2)}) must be lower than unit price ($${selectedProduct.unit_price.toFixed(2)})`)
      return
    }

    console.log('Adding product:', selectedProduct.name, 'Quantity:', productQuantity, 'Cost:', productCost)
    console.log('Current stockInItems before add:', stockInItems)

    // Check if product already exists in stockInItems
    const existingItemIndex = stockInItems.findIndex(item => item.product_id === selectedProduct.id)
    
    if (existingItemIndex >= 0) {
      // Update existing item
      setStockInItems(prev => {
        const updated = prev.map((item, index) => 
          index === existingItemIndex 
            ? { 
                ...item, 
                quantity: item.quantity + productQuantity,
                cost_price: productCost,
                selected: true
              }
            : item
        )
        console.log('Updated existing item:', updated)
        return updated
      })
    } else {
      // Add new item
      const newItem: StockInItem = {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        product_sku: selectedProduct.sku,
        warehouse_id: form.getValues('warehouse_id') || '',
        quantity: productQuantity,
        cost_price: productCost,
        reason: '',
        selected: true,
      }
      setStockInItems(prev => {
        const updated = [...prev, newItem]
        console.log('Added new item:', updated)
        return updated
      })
    }

    // Reset form and close dialog
    setSelectedProduct(null)
    setProductQuantity(0)
    setProductCost(0)
    setProductCostDisplay('')
    setSearchTerm('')
    setIsProductDialogOpen(false)
    
    // Show success message
    setShowSuccessMessage(true)
    setTimeout(() => setShowSuccessMessage(false), 3000)
  }

  // Handle form submission
  const handleSubmit = async (data: StockInForm) => {
    const selectedItems = stockInItems.filter(item => item.selected && item.quantity > 0)
    
    if (selectedItems.length === 0) {
      alert('Please select at least one product with quantity greater than 0')
      return
    }

    try {
      setIsSubmitting(true)
      
      const bulkRequest = {
        supplier_id: data.supplier_id,
        processed_date: new Date(data.received_date).toISOString(),
        items: selectedItems.map(item => ({
          product_id: item.product_id,
          warehouse_id: item.warehouse_id,
          quantity: item.quantity,
          cost_price: item.cost_price > 0 ? item.cost_price : undefined,
          reason: item.reason || undefined,
        }))
      }

      await api.post('/stock-movements/bulk', bulkRequest)
      
      // Reset form and redirect
      form.reset()
      setStockInItems([])
      router.push('/inventory/stock-in')
    } catch (error: any) {
      console.error('Error creating stock movement:', error)
      
      let errorMessage = 'Error creating stock movement. Please try again.'
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid data provided. Please check your inputs.'
      } else if (error.response?.status === 401) {
        errorMessage = 'You are not authorized. Please log in again.'
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.'
      }
      
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
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

  const selectedItems = stockInItems.filter(item => item.selected && item.quantity > 0)
  
  // Debug logging
  console.log('stockInItems:', stockInItems)
  console.log('selectedItems:', selectedItems)

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">New Stock Movement</h1>
              <p className="mt-2 text-gray-600">Add new stock-in movement to your inventory</p>
            </div>

            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Stock In Information</CardTitle>
                  <CardDescription>
                    Enter the basic information for this stock movement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="supplier_id">Supplier *</Label>
                      <Select
                        value={form.watch('supplier_id')}
                        onValueChange={(value) => {
                          form.setValue('supplier_id', value)
                          handleSupplierChange(value)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a supplier" />
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
                        <p className="text-red-500 text-sm mt-1">
                          {form.formState.errors.supplier_id.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="warehouse_id">Warehouse *</Label>
                      <Select
                        value={form.watch('warehouse_id')}
                        onValueChange={(value) => {
                          form.setValue('warehouse_id', value)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.warehouse_id && (
                        <p className="text-red-500 text-sm mt-1">
                          {form.formState.errors.warehouse_id.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="received_date">Received Date *</Label>
                      <Input
                        type="date"
                        {...form.register('received_date')}
                        className={form.formState.errors.received_date ? 'border-red-500' : ''}
                      />
                      {form.formState.errors.received_date && (
                        <p className="text-red-500 text-sm mt-1">
                          {form.formState.errors.received_date.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="processed_by">Processed By *</Label>
                      <Input
                        {...form.register('processed_by')}
                        placeholder="Enter processor name"
                        className={form.formState.errors.processed_by ? 'border-red-500' : ''}
                      />
                      {form.formState.errors.processed_by && (
                        <p className="text-red-500 text-sm mt-1">
                          {form.formState.errors.processed_by.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="reference_number">Reference Number</Label>
                      <Input
                        {...form.register('reference_number')}
                        placeholder="PO-12345"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        {...form.register('notes')}
                        placeholder="Additional notes..."
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Products Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Products</CardTitle>
                  <CardDescription>
                    Add products to this stock movement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!watchedSupplier ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Select a supplier to add products</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {selectedItems.length} products selected
                        </span>
                      </div>
                      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            type="button" 
                            onClick={() => {
                              if (!selectedSupplier) {
                                alert('Please select a supplier first')
                                return
                              }
                              loadProducts()
                              setIsProductDialogOpen(true)
                            }}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add Product
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Add Product</DialogTitle>
                            <DialogDescription>
                              Search and add a product from {suppliers.find(s => s.id === selectedSupplier)?.name}
                            </DialogDescription>
                          </DialogHeader>
                          {isLoadingData ? (
                            <div className="text-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                              <p className="mt-2 text-gray-600">Loading products...</p>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {/* Product Search */}
                              <div>
                                <Label htmlFor="search">Search Products</Label>
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <Input
                                    id="search"
                                    placeholder="Search by name or SKU..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="pl-10"
                                  />
                                </div>
                              </div>

                              {/* Product List */}
                              <div className="max-h-96 overflow-y-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Product</TableHead>
                                      <TableHead>SKU</TableHead>
                                      <TableHead>Unit Price</TableHead>
                                      <TableHead>Action</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {filteredProducts.map((product) => (
                                      <TableRow key={product.id}>
                                        <TableCell>
                                          <div>
                                            <div className="font-medium">{product.name}</div>
                                            {product.description && (
                                              <div className="text-sm text-gray-500">
                                                {product.description}
                                              </div>
                                            )}
                                          </div>
                                        </TableCell>
                                        <TableCell className="font-mono">{product.sku}</TableCell>
                                        <TableCell>${product.unit_price.toFixed(2)}</TableCell>
                                        <TableCell>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleProductSelect(product)}
                                          >
                                            Select
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>

                              {/* Selected Product Details */}
                              {selectedProduct && (
                                <div className="border rounded-lg p-4 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium">Selected Product</h4>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedProduct(null)
                                        setProductQuantity(0)
                                        setProductCost(0)
                                        setProductCostDisplay('')
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor="quantity">Quantity</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        value={productQuantity || ''}
                                        onChange={(e) => {
                                          const value = e.target.value
                                          if (value === '') {
                                            setProductQuantity(0)
                                          } else {
                                            const numValue = parseInt(value)
                                            setProductQuantity(isNaN(numValue) ? 0 : numValue)
                                          }
                                        }}
                                        onBlur={(e) => {
                                          if (productQuantity <= 0) {
                                            setProductQuantity(0)
                                          }
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="cost_price">Cost Price</Label>
                                      <Input
                                        type="text"
                                        placeholder="0.00"
                                        value={productCostDisplay}
                                        onChange={(e) => {
                                          const formattedValue = formatCurrency(e.target.value)
                                          setProductCostDisplay(formattedValue)
                                          setProductCost(parseCurrency(formattedValue))
                                        }}
                                        onBlur={(e) => {
                                          if (e.target.value && parseCurrency(e.target.value) === 0) {
                                            setProductCostDisplay('')
                                            setProductCost(0)
                                          }
                                        }}
                                        className={
                                          selectedProduct && productCost > 0 && productCost >= selectedProduct.unit_price
                                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                            : ''
                                        }
                                      />
                                      {selectedProduct && (
                                        <div className="mt-1 text-sm text-gray-600">
                                          Unit Price: ${selectedProduct.unit_price.toFixed(2)}
                                        </div>
                                      )}
                                      {selectedProduct && productCost > 0 && productCost >= selectedProduct.unit_price && (
                                        <div className="mt-1 text-sm text-red-600">
                                          Cost price must be lower than unit price (${selectedProduct.unit_price.toFixed(2)})
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    onClick={handleAddProduct}
                                    className="w-full"
                                    disabled={
                                      !selectedProduct || 
                                      productQuantity <= 0 || 
                                      productCost <= 0 || 
                                      (selectedProduct && productCost >= selectedProduct.unit_price)
                                    }
                                  >
                                    Add to Stock Movement
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Selected Products Table */}
              {selectedItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Selected Products</CardTitle>
                    <CardDescription>
                      Review and manage the products in this stock movement
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Cost Price</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedItems.map((item, index) => (
                            <TableRow key={`${item.product_id}-${index}`}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{item.product_name}</div>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono">{item.product_sku}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>${item.cost_price.toFixed(2)}</TableCell>
                              <TableCell>${(item.quantity * item.cost_price).toFixed(2)}</TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setStockInItems(prev => 
                                      prev.filter((_, i) => i !== index)
                                    )
                                  }}
                                >
                                  Remove
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Success Message */}
              {showSuccessMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-green-800">Product added successfully!</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting || selectedItems.length === 0}
                  className="px-8"
                >
                  {isSubmitting ? 'Creating...' : 'Create Stock Movement'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}