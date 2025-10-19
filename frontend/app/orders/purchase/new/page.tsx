'use client'

import { useState, useEffect, useRef } from 'react'
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Plus, Package, Search, X, FileText } from 'lucide-react'
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
  reference_number: z.string().min(1, 'PO Reference Number is required'),
  po_date: z.string().min(1, 'PO Date is required'),
  documents: z.array(z.any()).optional(),
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
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<StockInForm | null>(null)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productQuantity, setProductQuantity] = useState(0)
  const [productCost, setProductCost] = useState(0)
  const [productCostDisplay, setProductCostDisplay] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [createdPurchaseOrderId, setCreatedPurchaseOrderId] = useState<string>('')
  const [createdPurchaseOrderNumber, setCreatedPurchaseOrderNumber] = useState<string>('')
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [errorTitle, setErrorTitle] = useState('')
  const [showCloseWarning, setShowCloseWarning] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  // Refs
  const poReferenceInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Form setup
  const form = useForm<StockInForm>({
    resolver: zodResolver(stockInSchema),
    defaultValues: {
      supplier_id: '',
      warehouse_id: '',
      received_date: '',
      processed_by: user ? user.id : '',
      reference_number: '',
      po_date: '',
      notes: '',
    },
  })

  const watchedSupplier = form.watch('supplier_id')

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Handle browser beforeunload event (back button, close tab, etc.)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return 'You have unsaved changes. Are you sure you want to leave?'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [stockInItems, uploadedDocuments, form])

  // Update processed_by when user loads
  useEffect(() => {
    if (user) {
      form.setValue('processed_by', user.id)
    }
  }, [user, form])

  // Load initial data
  useEffect(() => {
    if (user) {
      loadSuppliers()
      loadWarehouses()
    }
  }, [user])

  // Auto-focus on PO Reference input when component mounts
  useEffect(() => {
    if (user && !isLoading) {
      // Small delay to ensure the input is rendered
      const timer = setTimeout(() => {
        if (poReferenceInputRef.current) {
          poReferenceInputRef.current.focus()
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [user, isLoading])

  // Auto-focus on search input when product dialog opens
  useEffect(() => {
    if (isProductDialogOpen) {
      // Small delay to ensure the dialog and input are rendered
      const timer = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [isProductDialogOpen])

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

  // Document upload functions
  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newFiles = Array.from(files)
      setUploadedDocuments(prev => [...prev, ...newFiles])
    }
  }

  const removeDocument = (index: number) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    const formValues = form.getValues()
    const hasFormData = formValues.reference_number || formValues.supplier_id || formValues.po_date || formValues.received_date || formValues.notes
    const hasSelectedItems = stockInItems.some(item => item.selected && item.quantity > 0)
    const hasUploadedDocs = uploadedDocuments.length > 0
    
    return hasFormData || hasSelectedItems || hasUploadedDocs
  }

  // Check if purchase order can be cancelled (within 30 days)
  const canCancelPurchaseOrder = (createdDate: string) => {
    const created = new Date(createdDate)
    const now = new Date()
    const daysDifference = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
    return daysDifference <= 30
  }


  // Handle view document
  const handleViewDocument = (file: File) => {
    const url = URL.createObjectURL(file)
    window.open(url, '_blank')
  }

  // Handle form submission
  const handleSubmit = async (data: StockInForm) => {
    const selectedItems = stockInItems.filter(item => item.selected && item.quantity > 0)
    
    if (selectedItems.length === 0) {
      alert('Please select at least one product with quantity greater than 0')
      return
    }

    console.log('Form data warehouse_id:', data.warehouse_id)
    console.log('Available warehouses:', warehouses)
    console.log('Selected warehouse:', warehouses.find(w => w.id === data.warehouse_id))

    // Show confirmation dialog first
    setPendingFormData(data)
    setShowConfirmationDialog(true)
  }

  // Handle actual submission after confirmation
  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return

    const data = pendingFormData
    const selectedItems = stockInItems.filter(item => item.selected && item.quantity > 0)

    try {
      setIsSubmitting(true)
      
      // Get supplier details
      const selectedSupplierData = suppliers.find(s => s.id === data.supplier_id)
      if (!selectedSupplierData) {
        throw new Error('Selected supplier not found')
      }

      // Create purchase order first
      const purchaseOrderData = {
        po_number: data.reference_number,
        supplier_name: selectedSupplierData.name,
        supplier_contact: selectedSupplierData.email,
        order_date: new Date(data.po_date).toISOString(),
        expected_delivery_date: null, // Not available in this form
        notes: data.notes || '',
        created_by: user?.id || '',
        warehouse_id: data.warehouse_id, // Include warehouse_id
      }

      console.log('Creating purchase order:', purchaseOrderData)
      const purchaseOrderResponse = await api.post('/purchase-orders', purchaseOrderData)
      const purchaseOrderId = purchaseOrderResponse.data.id

      // Upload documents if any
      if (uploadedDocuments.length > 0) {
        const formData = new FormData()
        uploadedDocuments.forEach((file, index) => {
          formData.append(`documents`, file)
        })
        formData.append('purchase_order_id', purchaseOrderId)

        console.log('Uploading documents for purchase order:', purchaseOrderId)
        await api.post('/documents/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      }

      // Create purchase order
      const bulkRequest = {
        supplier_id: data.supplier_id,
        reference_number: data.reference_number || undefined,
        processed_by: user?.id || data.processed_by,
        processed_date: new Date(data.received_date).toISOString(),
        purchase_order_id: purchaseOrderId, // Pass the purchase order ID
        items: selectedItems.map(item => ({
          product_id: item.product_id,
          warehouse_id: item.warehouse_id,
          quantity: item.quantity,
          cost_price: item.cost_price > 0 ? item.cost_price : undefined,
          reason: item.reason || undefined,
        }))
      }

      console.log('Sending bulk request:', bulkRequest)
      await api.post('/stock-movements/bulk', bulkRequest)
      
      // Update purchase order status to 'received' since stock has been processed
      try {
        await api.put(`/purchase-orders/${purchaseOrderId}`, {
          supplier_name: selectedSupplierData.name,
          supplier_contact: selectedSupplierData.email,
          status: 'received',
          expected_delivery_date: null,
          received_date: new Date(data.received_date).toISOString(),
          notes: data.notes || '',
        })
        console.log('Purchase order status updated to received')
      } catch (error) {
        console.error('Failed to update purchase order status:', error)
        // Don't fail the entire process if status update fails
      }
      
      // Reset form and show success dialog
      form.reset()
      setStockInItems([])
      setUploadedDocuments([])
      setShowConfirmationDialog(false)
      setPendingFormData(null)
      setCreatedPurchaseOrderId(purchaseOrderId)
      setCreatedPurchaseOrderNumber(data.reference_number)
      setShowSuccessDialog(true)
    } catch (error: any) {
      console.error('Error creating purchase order:', error)
      
      let errorMessage = 'An error occurred while creating the purchase order. Please try again.'
      let errorTitle = 'Purchase Order Creation Failed'
      
      if (error.response?.data?.error) {
        const backendError = error.response.data.error
        
        // Handle specific error types with user-friendly messages
        if (backendError.includes('duplicate key value violates unique constraint') || 
            backendError.includes('Purchase Order number already exists') ||
            backendError.includes('purchase_orders_po_number_key') ||
            backendError.includes('SQLSTATE 23505')) {
          errorTitle = 'Duplicate Purchase Order Number'
          errorMessage = 'The Purchase Order number you entered already exists. Please use a different reference number.'
        } else if (backendError.includes('violates foreign key constraint')) {
          errorTitle = 'Invalid Selection'
          errorMessage = 'One or more of your selections are invalid. Please check your supplier, warehouse, or product selections.'
        } else if (error.response?.status === 409) {
          errorTitle = 'Duplicate Purchase Order Number'
          errorMessage = 'The Purchase Order number you entered already exists. Please use a different reference number.'
        } else {
          errorMessage = backendError
        }
      } else if (error.response?.status === 400) {
        errorTitle = 'Invalid Information'
        errorMessage = 'Please check all required fields and ensure your information is correct.'
      } else if (error.response?.status === 401) {
        errorTitle = 'Authentication Required'
        errorMessage = 'Your session has expired. Please log in again to continue.'
      } else if (error.response?.status === 500) {
        errorTitle = 'System Error'
        errorMessage = 'A system error occurred. Please try again later or contact support if the problem persists.'
      } else if (!error.response) {
        errorTitle = 'Connection Error'
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.'
      }
      
      // Show error dialog instead of alert
      setErrorMessage(errorMessage)
      setErrorTitle(errorTitle)
      setShowErrorDialog(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle success dialog actions
  const handleViewPurchaseOrder = () => {
    setShowSuccessDialog(false)
    handleNavigation('/orders/purchase')
  }

  const handleCreateAnother = () => {
    setShowSuccessDialog(false)
    setCreatedPurchaseOrderId('')
    setCreatedPurchaseOrderNumber('')
    // Form is already reset, just focus on PO reference
    setTimeout(() => {
      if (poReferenceInputRef.current) {
        poReferenceInputRef.current.focus()
      }
    }, 100)
  }

  // Handle close warning dialog
  const handleCloseWarning = (confirmed: boolean) => {
    setShowCloseWarning(false)
    if (confirmed && pendingNavigation) {
      router.push(pendingNavigation)
    }
    setPendingNavigation(null)
  }

  // Handle navigation with warning
  const handleNavigation = (path: string) => {
    if (hasUnsavedChanges()) {
      setPendingNavigation(path)
      setShowCloseWarning(true)
    } else {
      router.push(path)
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
        <div className="max-w-7xl mx-auto py-4 sm:px-6 lg:px-8">
          <div className="px-4 py-4 sm:px-0">
            <div className="mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">New Purchase Order</h1>
                  <p className="mt-1 text-gray-600">Add new purchase order to your inventory</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Processed By</p>
                  <p className="font-medium text-gray-900">
                    {user ? `${user.first_name} ${user.last_name}` : 'Unknown User'}
                  </p>
                </div>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {/* Basic Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Purchase Order Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Main Form Fields */}
                    <div className="space-y-6">
                      {/* First Row: PO Reference, Supplier, PO Date, Received Date */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FormField
                          control={form.control}
                          name="reference_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-gray-800 mb-3 block">PO Reference Number *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="PO-12345"
                                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  {...field}
                                  ref={poReferenceInputRef}
                                  onChange={(e) => {
                                    const upperValue = e.target.value.toUpperCase()
                                    field.onChange(upperValue)
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="supplier_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-gray-800 mb-3 block">Supplier *</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={(value) => {
                                  field.onChange(value)
                                  handleSupplierChange(value)
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                                    <SelectValue placeholder="Select a supplier" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {suppliers.map((supplier) => (
                                    <SelectItem key={supplier.id} value={supplier.id}>
                                      {supplier.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="po_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-gray-800 mb-3 block">PO Date *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                                  style={{ width: '100%' }}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="received_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-gray-800 mb-3 block">Received Date *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  style={{ width: '100%' }}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Second Row: Warehouse */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-1">
                          <FormField
                            control={form.control}
                            name="warehouse_id"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-gray-800 mb-3 block">Warehouse *</FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                                      <SelectValue placeholder="Select a warehouse" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {warehouses.map((warehouse) => (
                                      <SelectItem key={warehouse.id} value={warehouse.id}>
                                        {warehouse.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                </CardContent>
              </Card>

              {/* Products Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Products</CardTitle>
                  <CardDescription>
                    Add products to this purchase order
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!watchedSupplier ? (
                    <div className="text-center py-4">
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
                            <div className="text-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
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
                                    ref={searchInputRef}
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
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleAddProduct()
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
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleAddProduct()
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
                                    Add to Purchase Order
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
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Selected Products</CardTitle>
                    <CardDescription>
                      Review and manage the products in this purchase order
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

              {/* Notes Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional notes..."
                            rows={3}
                            className="mt-1 resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Document Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>
                    Upload receipts, invoices, and other supporting documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* File Upload Input */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                        onChange={handleDocumentUpload}
                        className="hidden"
                        id="document-upload"
                      />
                      <label
                        htmlFor="document-upload"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <span className="text-sm font-medium text-gray-600">
                          Click to upload documents
                        </span>
                        <span className="text-xs text-gray-500">
                          PDF, JPG, PNG, DOC, DOCX, XLS, XLSX up to 10MB each
                        </span>
                      </label>
                    </div>

                    {/* Uploaded Documents List */}
                    {uploadedDocuments.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Uploaded Documents:</h4>
                        {uploadedDocuments.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <svg
                                className="w-5 h-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleViewDocument(file)}
                                className="text-blue-500 hover:text-blue-700 transition-colors"
                                title="View document"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => removeDocument(index)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                                title="Remove document"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <svg className="w-5 h-5 text-amber-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <div>
                            <h4 className="text-sm font-medium text-amber-800">No documents uploaded</h4>
                            <p className="text-sm text-amber-700 mt-1">
                              Consider uploading receipts, invoices, or other supporting documents for this purchase order. 
                              This helps with record keeping and audit trails.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Success Message */}
              {showSuccessMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-green-800">Product added successfully!</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting || selectedItems.length === 0}
                  className="px-8"
                >
                  {isSubmitting ? 'Creating...' : 'Create Purchase Order'}
                </Button>
              </div>
              </form>
            </Form>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <DialogContent className="w-[95vw] max-w-5xl max-h-[85vh] overflow-hidden flex flex-col [&>button]:hidden">
          <DialogHeader className="sticky top-0 bg-white z-50 border-b border-gray-300 pb-2 mb-2 shadow-sm flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <div className="w-6 h-6 bg-amber-100 rounded-md flex items-center justify-center">
                    <Package className="h-4 w-4 text-amber-600" />
                  </div>
                  Confirm Purchase Order
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-1 text-sm">
                  Review the details below before creating your purchase order
                </DialogDescription>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-amber-800 text-sm font-medium">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  Review Mode
                </div>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
            <div className="space-y-6 p-1">
              {/* Order Overview - Simplified without card */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 border-b border-gray-200 pb-1">
                  <Package className="h-5 w-5" />
                  Purchase Order Summary
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-gray-600 font-bold w-32">PO Reference</span>
                      <span className="text-gray-900 font-mono">: {pendingFormData?.reference_number || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-600 font-bold w-32">PO Date</span>
                      <span className="text-gray-900">: {pendingFormData?.po_date || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-600 font-bold w-32">Received Date</span>
                      <span className="text-gray-900">: {pendingFormData?.received_date || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-600 font-bold w-32">Total Products</span>
                      <span className="text-gray-900">: {selectedItems.filter(item => item.selected && item.quantity > 0).length}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-gray-600 font-bold w-32">Supplier</span>
                      <span className="text-gray-900">: {pendingFormData?.supplier_id 
                        ? suppliers.find(s => s.id === pendingFormData.supplier_id)?.name || 'Unknown Supplier'
                        : 'Not specified'
                      }</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-600 font-bold w-32">Warehouse</span>
                      <span className="text-gray-900">: {pendingFormData?.warehouse_id 
                        ? warehouses.find(w => w.id === pendingFormData.warehouse_id)?.name || 'Unknown Warehouse'
                        : 'Not specified'
                      }</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Table - Enhanced visibility */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 border-b border-gray-200 pb-1">
                  <Package className="h-5 w-5" />
                  Products ({selectedItems.filter(item => item.selected && item.quantity > 0).length})
                </div>
                <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader className="bg-gray-100">
                      <TableRow className="border-b border-gray-300">
                        <TableHead className="font-semibold text-gray-900 text-left py-2 px-3 text-xs">Product Name</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-left py-2 px-3 text-xs">SKU</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-center py-2 px-3 text-xs">Qty</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-right py-2 px-3 text-xs">Unit Price</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-right py-2 px-3 text-xs">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedItems.filter(item => item.selected && item.quantity > 0).length > 0 ? (
                        selectedItems.filter(item => item.selected && item.quantity > 0).map((item, index) => (
                          <TableRow 
                            key={index} 
                            className={`border-b border-gray-200 ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            }`}
                          >
                            <TableCell className="py-2 px-3 text-sm">
                              <span className="font-medium text-gray-900">
                                {item.product_name}
                              </span>
                            </TableCell>
                            <TableCell className="py-2 px-3 text-sm">
                              <span className="font-mono text-gray-600 text-xs">
                                {item.product_sku}
                              </span>
                            </TableCell>
                            <TableCell className="py-2 px-3 text-center text-sm">
                              <span className="font-medium text-gray-900">
                                {item.quantity}
                              </span>
                            </TableCell>
                            <TableCell className="py-2 px-3 text-right text-sm">
                              <span className="font-mono text-gray-900 text-xs">
                                ${item.cost_price.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell className="py-2 px-3 text-right text-sm">
                              <span className="font-mono font-semibold text-gray-900 text-xs">
                                ${(item.quantity * item.cost_price).toFixed(2)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-16 text-center text-sm text-gray-500">
                            No products selected for this purchase order.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  
                  {/* Total Amount - Inline */}
                  {selectedItems.filter(item => item.selected && item.quantity > 0).length > 0 && (
                    <div className="bg-white border-t border-gray-300 px-3 py-2">
                      <div className="flex justify-end">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600">Total:</span>
                          <span className="text-base font-bold text-gray-900">
                            ${selectedItems
                              .filter(item => item.selected && item.quantity > 0)
                              .reduce((sum, item) => sum + (item.quantity * item.cost_price), 0)
                              .toFixed(2)
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes Section - Simple text below table */}
              <div className="flex items-center gap-2 text-sm mt-1">
                <span className="text-red-600 font-semibold">NOTE:</span>
                <span className="text-gray-700">
                  {pendingFormData?.notes || 'No notes provided'}
                </span>
              </div>

              {/* Documents Section - Compact with Actions */}
              {uploadedDocuments.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-base font-semibold text-gray-900 border-b border-gray-200 pb-1">
                    <FileText className="h-4 w-4" />
                    Documents ({uploadedDocuments.length})
                  </div>
                  <div className="space-y-0.5">
                    {uploadedDocuments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2 flex-1">
                          <FileText className="h-4 w-4 text-green-500" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons - Report Style */}
              <div className="flex justify-center items-center pt-4 border-t border-gray-300 bg-gray-50 -mx-6 px-6 py-3">
                <div className="flex gap-3">
                  <Button 
                    onClick={() => {
                      setShowConfirmationDialog(false)
                      setPendingFormData(null)
                    }}
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow hover:shadow-md transition-all duration-200 flex items-center gap-2 text-sm"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleConfirmSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow hover:shadow-md transition-all duration-200 flex items-center gap-2 text-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </>
                    ) : (
                      'Confirm & Create PO'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">Purchase Order Created!</DialogTitle>
            <DialogDescription className="text-gray-600">
              Your purchase order has been successfully created and processed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Purchase Order Reference:</span>
            </div>
            <p className="text-sm text-green-700 font-mono mt-1">{createdPurchaseOrderNumber}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCreateAnother}
              className="flex-1"
            >
              Create Another
            </Button>
            <Button
              type="button"
              onClick={handleViewPurchaseOrder}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              View Purchase Orders
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">{errorTitle}</DialogTitle>
            <DialogDescription className="text-gray-600">
              {errorMessage}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center mt-6">
            <Button
              type="button"
              onClick={() => setShowErrorDialog(false)}
              className="px-8 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Warning Dialog */}
      <Dialog open={showCloseWarning} onOpenChange={() => setShowCloseWarning(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">Unsaved Changes</DialogTitle>
            <DialogDescription className="text-gray-600">
              You have unsaved changes that will be lost if you leave this page. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleCloseWarning(false)}
              className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg"
            >
              Stay on Page
            </Button>
            <Button
              type="button"
              onClick={() => handleCloseWarning(true)}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg"
            >
              Leave Anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </AppLayout>
  )
}