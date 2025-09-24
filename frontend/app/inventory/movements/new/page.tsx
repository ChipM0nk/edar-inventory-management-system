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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ArrowLeft, Plus, Minus, Save, Upload, Package } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import api from '@/lib/api'

const stockInSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier is required'),
  warehouse_id: z.string().min(1, 'Warehouse is required'),
  received_date: z.string().min(1, 'Received date is required'),
  order_reference: z.string().min(1, 'Order reference is required'),
  notes: z.string().optional(),
})

type StockInForm = z.infer<typeof stockInSchema>

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

interface Warehouse {
  id: string
  name: string
  location: string
  is_active: boolean
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
  const [productQuantity, setProductQuantity] = useState(1)
  const [productCost, setProductCost] = useState(0)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form setup
  const form = useForm<StockInForm>({
    resolver: zodResolver(stockInSchema),
    defaultValues: {
      supplier_id: '',
      warehouse_id: '',
      received_date: new Date().toISOString().split('T')[0],
      order_reference: '',
      notes: '',
    },
  })

  const watchedSupplier = form.watch('supplier_id')

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Load initial data
  useEffect(() => {
    if (user) {
      loadSuppliers()
      loadWarehouses()
    }
  }, [user])

  // Update selected supplier when form changes
  useEffect(() => {
    if (watchedSupplier) {
      setSelectedSupplier(watchedSupplier)
    }
  }, [watchedSupplier])

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products)
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredProducts(filtered)
    }
  }, [searchTerm, products])


  const loadSuppliers = async () => {
    try {
      const response = await api.get('/suppliers')
      setSuppliers(response.data.suppliers || [])
    } catch (error) {
      console.error('Error loading suppliers:', error)
    }
  }

  const loadWarehouses = async () => {
    try {
      const response = await api.get('/warehouses')
      setWarehouses(response.data.warehouses || [])
    } catch (error) {
      console.error('Error loading warehouses:', error)
    }
  }

  const loadProducts = async () => {
    if (!selectedSupplier) return
    
    try {
      setIsLoadingData(true)
      const params = new URLSearchParams()
      params.append('supplier_id', selectedSupplier)
      params.append('limit', '100')
      
      const response = await api.get(`/products?${params.toString()}`)
      const fetchedProducts = response.data.products || []
      setProducts(fetchedProducts)
      setFilteredProducts(fetchedProducts)
      
      // Initialize stock-in items
      const initialItems: StockInItem[] = fetchedProducts.map((product: Product) => ({
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        warehouse_id: form.getValues('warehouse_id') || '',
        quantity: 0,
        cost_price: 0,
        reason: '',
        selected: false,
      }))
      setStockInItems(initialItems)
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleItemSelect = (productId: string, selected: boolean) => {
    setStockInItems(prev => prev.map(item => 
      item.product_id === productId ? { ...item, selected } : item
    ))
  }

  const handleQuantityChange = (productId: string, quantity: number) => {
    setStockInItems(prev => prev.map(item => 
      item.product_id === productId ? { ...item, quantity: Math.max(0, quantity) } : item
    ))
  }

  const handleCostPriceChange = (productId: string, costPrice: number) => {
    setStockInItems(prev => prev.map(item => 
      item.product_id === productId ? { ...item, cost_price: Math.max(0, costPrice) } : item
    ))
  }

  const handleReasonChange = (productId: string, reason: string) => {
    setStockInItems(prev => prev.map(item => 
      item.product_id === productId ? { ...item, reason } : item
    ))
  }

  const handleWarehouseChange = (warehouseId: string) => {
    setStockInItems(prev => prev.map(item => ({ ...item, warehouse_id: warehouseId })))
  }

  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setReceiptFile(file)
    }
  }

  const handleOpenProductDialog = () => {
    if (!selectedSupplier) {
      alert('Please select a supplier first')
      return
    }
    loadProducts()
    setIsProductDialogOpen(true)
    // Reset form state
    setSearchTerm('')
    setSelectedProduct(null)
    setProductQuantity(1)
    setProductCost(0)
  }

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product)
    setProductCost(0) // Empty by default
    setSearchTerm(product.name) // Show selected product in search
  }

  const handleAddProduct = () => {
    if (!selectedProduct || productQuantity <= 0 || productCost <= 0) {
      alert('Please select a product and enter valid quantity and cost price')
      return
    }

    // Check if product already exists in stockInItems
    const existingItemIndex = stockInItems.findIndex(item => item.product_id === selectedProduct.id)
    
    if (existingItemIndex >= 0) {
      // Update existing item
      setStockInItems(prev => prev.map((item, index) => 
        index === existingItemIndex 
          ? { 
              ...item, 
              quantity: item.quantity + productQuantity,
              cost_price: productCost,
              selected: true
            }
          : item
      ))
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
      setStockInItems(prev => [...prev, newItem])
    }

    // Reset form and close dialog
    setSelectedProduct(null)
    setProductQuantity(1)
    setProductCost(0)
    setSearchTerm('')
    setIsProductDialogOpen(false)
    
    // Show success message
    setShowSuccessMessage(true)
    setTimeout(() => setShowSuccessMessage(false), 3000)
  }

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
      router.push('/inventory/stock')
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

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex items-center mb-6">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Stock In</h1>
                <p className="mt-2 text-gray-600">Record incoming inventory</p>
              </div>
            </div>
            
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Stock In Information</CardTitle>
                  <CardDescription>
                    Select supplier and add products to record incoming inventory
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    
                    <div>
                      <Label htmlFor="order_reference">Order Reference *</Label>
                      <Input
                        id="order_reference"
                        placeholder="e.g., PO-2024-001"
                        {...form.register('order_reference')}
                      />
                      {form.formState.errors.order_reference && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.order_reference.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="warehouse_id">Warehouse *</Label>
                      <Select onValueChange={(value) => {
                        form.setValue('warehouse_id', value)
                        handleWarehouseChange(value)
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.name} - {warehouse.location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.warehouse_id && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.warehouse_id.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="received_date">Received Date *</Label>
                      <Input
                        id="received_date"
                        type="date"
                        {...form.register('received_date')}
                      />
                      {form.formState.errors.received_date && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.received_date.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="received_by">Received By</Label>
                      <Input
                        id="received_by"
                        value={`${user.first_name} ${user.last_name}`}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      {...form.register('notes')}
                      placeholder="Additional notes about this stock in..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="receipt">Receipt Upload</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="receipt"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleReceiptUpload}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {receiptFile && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Upload className="h-4 w-4" />
                          {receiptFile.name}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Upload supplier receipt (PDF, JPG, PNG)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Product Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Products</CardTitle>
                  <CardDescription>
                    {!watchedSupplier 
                      ? 'Please select a supplier first'
                      : `Selected items: ${selectedItems.length}`
                    }
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
                            onClick={handleOpenProductDialog}
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
                                <Label htmlFor="product-search">Search Product</Label>
                                <Input
                                  id="product-search"
                                  placeholder="Type product name or SKU..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  className="mt-1"
                                />
                                
                                {/* Search Results */}
                                {searchTerm && filteredProducts.length > 0 && (
                                  <div className="mt-2 max-h-48 overflow-y-auto border-2 border-blue-300 rounded-lg shadow-lg bg-white">
                                    {filteredProducts.map((product) => (
                                      <div
                                        key={product.id}
                                        className={`p-3 cursor-pointer transition-colors duration-150 border-b last:border-b-0 ${
                                          selectedProduct?.id === product.id 
                                            ? 'bg-blue-100 border-blue-300 shadow-sm' 
                                            : 'hover:bg-blue-50 hover:border-blue-200'
                                        }`}
                                        onClick={() => handleProductSelect(product)}
                                      >
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <p className="font-medium text-gray-900">{product.name}</p>
                                            <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                                          </div>
                                          <p className="text-sm font-mono text-blue-600 font-semibold">₱{product.unit_price.toFixed(2)}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {searchTerm && filteredProducts.length === 0 && (
                                  <div className="mt-2 p-3 text-center text-gray-500 border rounded-md">
                                    No products found matching "{searchTerm}"
                                  </div>
                                )}
                              </div>

                              {/* Selected Product Details */}
                              {selectedProduct && (
                                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                                  <h3 className="font-medium">Selected Product</h3>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Product Name</Label>
                                      <Input value={selectedProduct.name} readOnly className="bg-white" />
                                    </div>
                                    <div>
                                      <Label>SKU</Label>
                                      <Input value={selectedProduct.sku} readOnly className="bg-white" />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Category</Label>
                                      <Input 
                                        value={selectedProduct.category || 'N/A'} 
                                        readOnly 
                                        className="bg-white" 
                                      />
                                    </div>
                                    <div>
                                      <Label>Unit Price</Label>
                                      <Input 
                                        value={`₱${selectedProduct.unit_price.toFixed(2)}`} 
                                        readOnly 
                                        className="bg-white" 
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <Label>Description</Label>
                                    <Textarea 
                                      value={selectedProduct.description || 'No description available'} 
                                      readOnly 
                                      className="bg-white" 
                                      rows={2}
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor="quantity">Quantity *</Label>
                                      <Input
                                        id="quantity"
                                        type="number"
                                        min="1"
                                        value={productQuantity}
                                        onChange={(e) => setProductQuantity(parseInt(e.target.value) || 1)}
                                        className="mt-1"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="cost">Cost Price (₱) *</Label>
                                      <Input
                                        id="cost"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={productCost || ''}
                                        onChange={(e) => setProductCost(parseFloat(e.target.value) || 0)}
                                        placeholder="Enter cost price"
                                        className="mt-1"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Dialog Actions */}
                              <div className="flex justify-end gap-2">
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  onClick={() => setIsProductDialogOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  type="button" 
                                  onClick={handleAddProduct}
                                  disabled={!selectedProduct || productQuantity <= 0 || productCost <= 0}
                                >
                                  Add Product
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Success Message */}
              {showSuccessMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-green-700 font-medium">Product added successfully!</p>
                </div>
              )}

              {/* Selected Products Table */}
              {selectedItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Selected Products</CardTitle>
                    <CardDescription>
                      Review and manage selected products for stock in
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>SKU</TableHead>
                            <TableHead>Product Name</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Cost Price (₱)</TableHead>
                            <TableHead>Total (₱)</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedItems.map((item) => (
                            <TableRow key={item.product_id}>
                              <TableCell className="font-mono text-sm">
                                {item.product_sku}
                              </TableCell>
                              <TableCell className="font-medium">
                                {item.product_name}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="w-12 text-center">{item.quantity}</span>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono">
                                ₱{item.cost_price.toFixed(2)}
                              </TableCell>
                              <TableCell className="font-mono font-medium">
                                ₱{(item.quantity * item.cost_price).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleItemSelect(item.product_id, false)}
                                  className="text-red-600 hover:text-red-700"
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

              {/* Submit Button */}
              {selectedItems.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">
                          Ready to process {selectedItems.length} item(s)
                        </p>
                        <p className="text-xs text-gray-500">
                          Total quantity: {selectedItems.reduce((sum, item) => sum + item.quantity, 0)}
                        </p>
                      </div>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {isSubmitting ? 'Processing...' : 'Process Stock In'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}