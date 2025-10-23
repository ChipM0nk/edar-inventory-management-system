'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, User, FileText, X } from 'lucide-react'
import { UnifiedDocumentUpload } from '@/components/documents/unified-document-upload'
import { AdjustmentReviewDialog } from './adjustment-review-dialog'
import { useConfirm } from '@/hooks/use-confirm'
import { useNotice } from '@/hooks/use-notice'
import api from '@/lib/api'

interface Product {
  id: string
  name: string
  sku: string
  unit_price: number
}

interface Warehouse {
  id: string
  name: string
  location: string
}

interface AdjustmentItem {
  product_id: string
  product_name: string
  product_sku: string
  quantity: number
  cost_price: number
  reason: string
}

interface User {
  id: string
  first_name: string
  last_name: string
}

interface AdjustmentCreateDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user: User | null
  warehouses: Warehouse[]
  products: Product[]
}

export function AdjustmentCreateDialog({
  isOpen,
  onClose,
  onSuccess,
  user,
  warehouses,
  products
}: AdjustmentCreateDialogProps) {
  const [ConfirmDialog, confirm] = useConfirm()
  const [NoticeDialog, notice] = useNotice()
  
  // Form state
  const [adjustmentItems, setAdjustmentItems] = useState<AdjustmentItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('')
  const [adjustmentCostPrice, setAdjustmentCostPrice] = useState('')
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [adjustmentReasonOther, setAdjustmentReasonOther] = useState('')
  const [adjustmentDate, setAdjustmentDate] = useState(new Date().toISOString().split('T')[0])
  const [currentStockLevel, setCurrentStockLevel] = useState<number | null>(null)
  const [isCheckingStock, setIsCheckingStock] = useState(false)
  const [generatedReferenceNumber, setGeneratedReferenceNumber] = useState<string | null>(null)
  
  // Product search state
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1)
  
  // Document upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [adjustmentNotes, setAdjustmentNotes] = useState('')
  
  // Reference fields
  const [externalReference, setExternalReference] = useState<string>('')
  
  // Review dialog state
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  
  // Close warning state
  const [showCloseWarning, setShowCloseWarning] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  
  // Refs for form inputs
  const productSearchInputRef = useRef<HTMLInputElement>(null)
  const addRadioRef = useRef<HTMLInputElement>(null)
  const subtractRadioRef = useRef<HTMLInputElement>(null)
  const warehouseSelectRef = useRef<HTMLButtonElement>(null)

  // Filter products based on search term
  useEffect(() => {
    if (productSearchTerm.trim() === '') {
      setFilteredProducts(products)
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(productSearchTerm.toLowerCase())
      )
      setFilteredProducts(filtered)
    }
  }, [productSearchTerm, products])

  // Fetch current stock when both product and warehouse are selected
  useEffect(() => {
    if (selectedProduct && selectedWarehouse && currentStockLevel === null) {
      const fetchStock = async () => {
        setIsCheckingStock(true)
        try {
          const currentStock = await checkStockLevel(selectedProduct.id, selectedWarehouse.id)
          setCurrentStockLevel(currentStock)
        } catch (error) {
          console.error('Error checking stock:', error)
          setCurrentStockLevel(0)
        } finally {
          setIsCheckingStock(false)
        }
      }
      fetchStock()
    }
  }, [selectedProduct, selectedWarehouse, currentStockLevel])

  // Check stock level when quantity changes for subtraction validation
  useEffect(() => {
    const quantity = parseInt(adjustmentQuantity)
    if (adjustmentType === 'subtract' && selectedProduct && selectedWarehouse && adjustmentQuantity.trim() && quantity > 0) {
      const checkStock = async () => {
        setIsCheckingStock(true)
        try {
          const currentStock = await checkStockLevel(selectedProduct.id, selectedWarehouse.id)
          setCurrentStockLevel(currentStock)
        } catch (error) {
          console.error('Error checking stock:', error)
          setCurrentStockLevel(null)
        } finally {
          setIsCheckingStock(false)
        }
      }
      checkStock()
    }
  }, [adjustmentType, selectedProduct, selectedWarehouse, adjustmentQuantity])

  // Auto-focus on warehouse field when dialog opens
  useEffect(() => {
    if (isOpen) {
      const focusTimeout = setTimeout(() => {
        if (warehouseSelectRef.current) {
          warehouseSelectRef.current.focus()
        }
      }, 500)
      
      return () => clearTimeout(focusTimeout)
    }
  }, [isOpen])

  const generateReferenceNumber = (): string => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    
    return `ADJ-${year}${month}${day}-${hours}${minutes}${seconds}`
  }

  const resetForm = () => {
    setAdjustmentItems([])
    setAdjustmentQuantity('')
    setAdjustmentCostPrice('')
    setAdjustmentType('add')
    setAdjustmentReason('')
    setAdjustmentReasonOther('')
    setAdjustmentDate(new Date().toISOString().split('T')[0])
    setSelectedProduct(null)
    setSelectedWarehouse(null)
    setCurrentStockLevel(null)
    setGeneratedReferenceNumber(null)
    setAdjustmentNotes('')
    setUploadedFiles([])
    setExternalReference('')
    setProductSearchTerm('')
    setShowProductDropdown(false)
    setIsReviewOpen(false)
    setShowCloseWarning(false)
    setPendingNavigation(null)
  }

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    const hasFormData = selectedWarehouse || selectedProduct || adjustmentQuantity || adjustmentCostPrice || adjustmentNotes
    const hasAdjustmentItems = adjustmentItems.length > 0
    const hasUploadedDocs = uploadedFiles.length > 0
    const hasExternalRef = externalReference.trim() !== ''
    
    return hasFormData || hasAdjustmentItems || hasUploadedDocs || hasExternalRef
  }

  const handleCloseWarning = (confirmed: boolean) => {
    setShowCloseWarning(false)
    if (confirmed) {
      if (pendingNavigation) {
        // Navigation was requested
        // Note: Navigation would be handled by parent component
        onClose()
      } else {
        // Dialog closing was requested
        resetForm()
        onClose()
      }
    }
    setPendingNavigation(null)
  }

  const checkStockLevel = async (productId: string, warehouseId: string): Promise<number> => {
    try {
      setIsCheckingStock(true)
      const response = await api.get(`/stock-levels/${productId}/${warehouseId}`)
      const data = response.data || {}
      const qty = typeof data.quantity === 'number' ? data.quantity : (typeof data.available_quantity === 'number' ? data.available_quantity : 0)
      return qty
    } catch (error) {
      console.error('Error checking stock level:', error)
      return 0
    } finally {
      setIsCheckingStock(false)
    }
  }

  const handleAddItem = async () => {
    const quantity = parseInt(adjustmentQuantity)
    const costPrice = parseFloat(adjustmentCostPrice)
    const finalReason = adjustmentReason === 'Other' ? adjustmentReasonOther.trim() : adjustmentReason
    
    if (!selectedProduct || !selectedWarehouse || !adjustmentQuantity.trim() || quantity <= 0 || !adjustmentCostPrice.trim() || costPrice < 0 || !finalReason) {
      await notice({
        title: 'Invalid fields',
        description: 'Please fill in all required fields with valid values',
        variant: 'warning',
      })
      return
    }

    // Check stock level for subtraction adjustments
    if (adjustmentType === 'subtract') {
      setIsCheckingStock(true)
      try {
        const currentStock = await checkStockLevel(selectedProduct.id, selectedWarehouse.id)
        setCurrentStockLevel(currentStock)
        
        if (currentStock < quantity) {
          await notice({
            title: 'Insufficient stock',
            description: `Current stock: ${currentStock}, trying to subtract: ${quantity}`,
            variant: 'warning',
          })
          setIsCheckingStock(false)
          return
        }
      } catch (error) {
        console.error('Error checking stock:', error)
        await notice({
          title: 'Check failed',
          description: 'Error checking stock level. Please try again.',
          variant: 'warning',
        })
        setIsCheckingStock(false)
        return
      }
      setIsCheckingStock(false)
    }

    const finalQuantity = adjustmentType === 'add' ? quantity : -quantity

    const newItem: AdjustmentItem = {
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      product_sku: selectedProduct.sku,
      quantity: finalQuantity,
      cost_price: costPrice,
      reason: finalReason
    }

    setAdjustmentItems([...adjustmentItems, newItem])
    
    // Reset form (but keep warehouse selected)
    setSelectedProduct(null)
    setAdjustmentQuantity('')
    setAdjustmentCostPrice('')
    setAdjustmentType('add')
    setAdjustmentReason('')
    setAdjustmentReasonOther('')
    setCurrentStockLevel(null)
    setProductSearchTerm('')
    setShowProductDropdown(false)
    
    // Focus back to product search input
    setTimeout(() => {
      if (productSearchInputRef.current) {
        productSearchInputRef.current.focus()
      }
    }, 100)
  }

  const handleRemoveItem = (index: number) => {
    setAdjustmentItems(adjustmentItems.filter((_, i) => i !== index))
  }

  const handleCreateAdjustment = async () => {
    if (adjustmentItems.length === 0) {
      await notice({
        title: 'No items',
        description: 'Please add at least one item to the adjustment',
        variant: 'info',
      })
      return
    }
      
    if (!user) {
      await notice({
        title: 'Not authenticated',
        description: 'User not authenticated',
        variant: 'warning',
      })
      return
    }

    try {
      // Generate reference number
      const generatedRef = generateReferenceNumber()
      setGeneratedReferenceNumber(generatedRef)

      // Calculate total quantity
      const totalQuantity = adjustmentItems.reduce((sum, item) => sum + Math.abs(item.quantity), 0)

      // Ensure warehouse is selected
      if (!selectedWarehouse) {
        await notice({
          title: 'No warehouse selected',
          description: 'Please select a warehouse for the adjustment',
          variant: 'warning',
        })
        return
      }

      // Create adjustment using backend API
      const adjustmentPayload = {
        reference_number: generatedRef,
        adjustment_date: new Date(adjustmentDate).toISOString(),
        warehouse_id: selectedWarehouse.id,
        total_quantity: totalQuantity,
        reason: 'Inventory adjustment',
        status: 'completed',
        created_by: user.id,
        notes: adjustmentNotes || null,
        external_reference: externalReference || null,
        items: adjustmentItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          cost_price: item.cost_price,
          reason: item.reason,
        }))
      }

      const adjustmentResponse = await api.post('/adjustments', adjustmentPayload)
      const createdAdjustmentId = adjustmentResponse.data?.id

      // Upload documents if any
      if (uploadedFiles.length > 0 && createdAdjustmentId) {
        try {
          const formData = new FormData()
          uploadedFiles.forEach((file) => {
            formData.append('documents', file)
          })
          formData.append('reference_type', 'adjustment')
          formData.append('reference_id', createdAdjustmentId)

          await api.post('/documents/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
        } catch (documentError) {
          console.error('Error uploading documents:', documentError)
          await notice({
            title: 'Partial success',
            description: 'Adjustment created, but some documents failed to upload. You can try uploading them later.',
            variant: 'warning',
          })
        }
      }

      // Reset form and close modal
      resetForm()
      onClose()
      
      // Notify parent of success
      onSuccess()
      
      await notice({
        title: 'Adjustment created',
        description: uploadedFiles.length > 0 
          ? `Reference Number: ${generatedRef}\n\nDocuments uploaded: ${uploadedFiles.length}`
          : `Reference Number: ${generatedRef}`,
        variant: 'success',
        okText: 'OK',
      })
    } catch (error: any) {
      console.error('Error creating adjustment:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred'
      await notice({
        title: 'Failed to create adjustment',
        description: errorMessage,
        variant: 'warning',
      })
      setGeneratedReferenceNumber(null)
    }
  }

  const handleClose = () => {
    // Check for unsaved changes before closing
    if (hasUnsavedChanges()) {
      setPendingNavigation(null) // No navigation, just closing dialog
      setShowCloseWarning(true)
      return // Don't close the dialog yet
    }
    resetForm()
    onClose()
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Plus className="h-5 w-5" />
                  Create New Adjustment
                </DialogTitle>
                <DialogDescription>
                  Add inventory adjustments to correct stock levels
                </DialogDescription>
              </div>
              {/* Processed By - Right side of modal header */}
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Processed by:</span>
                <span className="text-sm font-medium text-gray-900">
                  {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
                </span>
              </div>
            </div>
          </DialogHeader>
          
          {/* Success Message with Reference Number */}
          {generatedReferenceNumber && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-green-800">Adjustment Created Successfully!</h3>
                  <p className="text-sm text-green-700">
                    Reference Number: <span className="font-semibold">{generatedReferenceNumber}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            {/* Header Info - Compact */}
            <div className="p-4 bg-gray-50 rounded-lg">
              {/* Main form fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="adjustment-date" className="text-xs font-medium text-gray-600">Adjustment Date *</Label>
                  <Input
                    id="adjustment-date"
                    type="date"
                    value={adjustmentDate}
                    onChange={(e) => setAdjustmentDate(e.target.value)}
                    className="mt-1"
                    tabIndex={1}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Warehouse *</Label>
                  <Select value={selectedWarehouse?.id || ''} onValueChange={async (value) => {
                    const warehouse = warehouses.find(w => w.id === value)
                    if (warehouse && selectedWarehouse && warehouse.id !== selectedWarehouse.id) {
                      // Show warning before switching warehouse
                      if (adjustmentItems.length > 0) {
                        const confirmed = await confirm({
                          title: 'Change warehouse?',
                          description: 'Changing warehouse will clear all current adjustment items.',
                          confirmText: 'Change Warehouse',
                          cancelText: 'Keep Current',
                          variant: 'warning',
                        })
                        if (confirmed) {
                          setSelectedWarehouse(warehouse)
                          setAdjustmentItems([]) // Clear all items
                          setSelectedProduct(null)
                          setCurrentStockLevel(null)
                          setProductSearchTerm('')
                          setShowProductDropdown(false)
                          setAdjustmentQuantity('')
                          setAdjustmentCostPrice('')
                          setAdjustmentType('add')
                          setAdjustmentReason('')
                          setAdjustmentReasonOther('')
                          setAdjustmentNotes('')
                          setUploadedFiles([])
                        }
                      } else {
                        setSelectedWarehouse(warehouse)
                        setSelectedProduct(null)
                        setCurrentStockLevel(null)
                        setProductSearchTerm('')
                        setShowProductDropdown(false)
                        setAdjustmentQuantity('')
                        setAdjustmentCostPrice('')
                        setAdjustmentType('add')
                        setAdjustmentReason('')
                        setAdjustmentReasonOther('')
                        setAdjustmentNotes('')
                        setUploadedFiles([])
                      }
                    } else {
                      setSelectedWarehouse(warehouse || null)
                      setSelectedProduct(null)
                      setCurrentStockLevel(null)
                      setProductSearchTerm('')
                      setShowProductDropdown(false)
                      setAdjustmentQuantity('')
                      setAdjustmentCostPrice('')
                      setAdjustmentType('add')
                      setAdjustmentReason('')
                      setAdjustmentReasonOther('')
                      setAdjustmentNotes('')
                      setUploadedFiles([])
                    }
                  }}>
                    <SelectTrigger 
                      ref={warehouseSelectRef} 
                      className="mt-1" 
                      tabIndex={2}
                      autoFocus={isOpen}
                    >
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
                </div>
                <div>
                  <Label htmlFor="reference" className="text-xs font-medium text-gray-600">External Reference</Label>
                  <Input
                    id="reference"
                    value={externalReference}
                    onChange={(e) => setExternalReference(e.target.value.toUpperCase())}
                    placeholder="PO, Sales, Transfer, etc."
                    className="mt-1"
                    tabIndex={3}
                  />
                </div>
              </div>
            </div>

            {/* Add Item Form - Compact */}
            {selectedWarehouse && (
              <Card className="border-2 border-dashed border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Item to {selectedWarehouse.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Product Selection */}
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Product *</Label>
                    <div className="relative mt-1">
                      <Input
                        ref={productSearchInputRef}
                        value={selectedProduct ? `${selectedProduct.name} (${selectedProduct.sku})` : productSearchTerm}
                        tabIndex={3}
                        onChange={(e) => {
                          const value = e.target.value
                          setProductSearchTerm(value)
                          setSelectedProduct(null)
                          setShowProductDropdown(true)
                          setCurrentStockLevel(null)
                          setSelectedProductIndex(-1)
                        }}
                        onKeyDown={(e) => {
                          if (!showProductDropdown || filteredProducts.length === 0) return

                          switch (e.key) {
                            case 'ArrowDown':
                              e.preventDefault()
                              setSelectedProductIndex(prev => {
                                const newIndex = prev < filteredProducts.length - 1 ? prev + 1 : 0
                                // Auto-scroll to keep selected item visible
                                setTimeout(() => {
                                  const dropdown = document.querySelector('.absolute.z-50')
                                  const selectedItem = dropdown?.querySelector(`[data-index="${newIndex}"]`)
                                  if (selectedItem) {
                                    selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
                                  }
                                }, 0)
                                return newIndex
                              })
                              break
                            case 'ArrowUp':
                              e.preventDefault()
                              setSelectedProductIndex(prev => {
                                const newIndex = prev > 0 ? prev - 1 : filteredProducts.length - 1
                                // Auto-scroll to keep selected item visible
                                setTimeout(() => {
                                  const dropdown = document.querySelector('.absolute.z-50')
                                  const selectedItem = dropdown?.querySelector(`[data-index="${newIndex}"]`)
                                  if (selectedItem) {
                                    selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
                                  }
                                }, 0)
                                return newIndex
                              })
                              break
                            case 'Enter':
                              e.preventDefault()
                              if (selectedProductIndex >= 0 && selectedProductIndex < filteredProducts.length) {
                                const product = filteredProducts[selectedProductIndex]
                                setSelectedProduct(product)
                                setProductSearchTerm('')
                                setShowProductDropdown(false)
                                setSelectedProductIndex(-1)
                                
                                setTimeout(() => {
                                  if (addRadioRef.current) {
                                    addRadioRef.current.focus()
                                  }
                                }, 100)
                              }
                              break
                            case 'Escape':
                              setShowProductDropdown(false)
                              setSelectedProductIndex(-1)
                              break
                          }
                        }}
                        onFocus={() => {
                          setShowProductDropdown(true)
                          setSelectedProductIndex(-1)
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowProductDropdown(false), 200)
                        }}
                        placeholder="Search products by name or SKU..."
                        className="pr-8"
                      />
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      
                      {/* Dropdown with filtered products */}
                      {showProductDropdown && filteredProducts.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {filteredProducts.map((product, index) => (
                            <div
                              key={product.id}
                              data-index={index}
                              className={`px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                                index === selectedProductIndex 
                                  ? 'bg-blue-100 text-blue-900' 
                                  : 'hover:bg-gray-50'
                              }`}
                              tabIndex={-1}
                              onClick={() => {
                                setSelectedProduct(product)
                                setProductSearchTerm('')
                                setShowProductDropdown(false)
                                setSelectedProductIndex(-1)
                                
                                setTimeout(() => {
                                  if (addRadioRef.current) {
                                    addRadioRef.current.focus()
                                  }
                                }, 100)
                              }}
                            >
                              <div className="font-medium text-sm">{product.name}</div>
                              <div className="text-xs opacity-75">SKU: {product.sku}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* No results message */}
                      {showProductDropdown && productSearchTerm && filteredProducts.length === 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3">
                          <div className="text-sm text-gray-500 text-center">
                            No products found matching "{productSearchTerm}"
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                
                  {/* Current Stock and Adjustment Type - Compact */}
                  {selectedProduct && selectedWarehouse && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Current Stock:</span>
                        {isCheckingStock ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500"></div>
                            <span className="text-xs text-gray-500">Loading...</span>
                          </div>
                        ) : (
                          <span className="text-sm font-semibold text-gray-900">
                            {currentStockLevel !== null ? currentStockLevel : 'N/A'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mb-3">
                        {selectedProduct.name} in {selectedWarehouse.name}
                      </div>
                      
                      {/* Adjustment Type - Inline */}
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-medium text-gray-600">Type:</span>
                        <div className="flex gap-3">
                          <label className="flex items-center space-x-1">
                            <input
                              ref={addRadioRef}
                              type="radio"
                              name="adjustmentType"
                              value="add"
                              checked={adjustmentType === 'add'}
                              onChange={(e) => setAdjustmentType(e.target.value as 'add' | 'subtract')}
                              className="text-green-600"
                              tabIndex={4}
                            />
                            <span className="text-green-600 text-sm font-medium">Add</span>
                          </label>
                          <label className="flex items-center space-x-1">
                            <input
                              ref={subtractRadioRef}
                              type="radio"
                              name="adjustmentType"
                              value="subtract"
                              checked={adjustmentType === 'subtract'}
                              onChange={(e) => setAdjustmentType(e.target.value as 'add' | 'subtract')}
                              className="text-red-600"
                              tabIndex={5}
                            />
                            <span className="text-red-600 text-sm font-medium">Subtract</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quantity, Cost Price, and Reason - Compact */}
                  {selectedProduct && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="quantity" className="text-xs font-medium text-gray-600">Quantity *</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={adjustmentQuantity}
                          onChange={(e) => {
                            const value = e.target.value
                            const cleanValue = value.replace(/^0+/, '') || ''
                            if (cleanValue === '' || (parseInt(cleanValue) > 0 && cleanValue === parseInt(cleanValue).toString())) {
                              setAdjustmentQuantity(cleanValue)
                            }
                          }}
                          placeholder="Enter quantity"
                          className="mt-1"
                          tabIndex={6}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="cost_price" className="text-xs font-medium text-gray-600">
                          Cost Price *
                          {selectedProduct && (
                            <span className="ml-2 text-gray-500 font-normal">
                              (Unit Price: ₱{selectedProduct.unit_price.toFixed(2)})
                            </span>
                          )}
                        </Label>
                        <Input
                          id="cost_price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={adjustmentCostPrice}
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                              setAdjustmentCostPrice(value)
                            }
                          }}
                          placeholder="Enter cost price"
                          className="mt-1"
                          tabIndex={7}
                        />
                        {selectedProduct && adjustmentCostPrice && parseFloat(adjustmentCostPrice) >= selectedProduct.unit_price && (
                          <p className="text-red-500 text-xs mt-1">
                            ⚠️ Cost price should be less than unit price.
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="reason" className="text-xs font-medium text-gray-600">Reason *</Label>
                        <Select value={adjustmentReason} onValueChange={setAdjustmentReason}>
                          <SelectTrigger className="mt-1" tabIndex={8}>
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Damaged Goods">Damaged Goods</SelectItem>
                            <SelectItem value="Expired Products">Expired Products</SelectItem>
                            <SelectItem value="Lost Inventory">Lost Inventory</SelectItem>
                            <SelectItem value="Found Inventory">Found Inventory</SelectItem>
                            <SelectItem value="Supplier Return">Supplier Return</SelectItem>
                            <SelectItem value="Customer Return">Customer Return</SelectItem>
                            <SelectItem value="Quality Issues">Quality Issues</SelectItem>
                            <SelectItem value="Theft">Theft</SelectItem>
                            <SelectItem value="Cycle Count Adjustment">Cycle Count Adjustment</SelectItem>
                            <SelectItem value="Transfer Error">Transfer Error</SelectItem>
                            <SelectItem value="System Error">System Error</SelectItem>
                            <SelectItem value="Receiving Discrepancy">Receiving Discrepancy</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {/* Other reason text field */}
                        {adjustmentReason === 'Other' && (
                          <Input
                            value={adjustmentReasonOther}
                            onChange={(e) => setAdjustmentReasonOther(e.target.value)}
                            placeholder="Please specify the reason"
                            className="mt-2"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Preview and Add Button - Compact */}
                  {adjustmentQuantity.trim() && parseInt(adjustmentQuantity) > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          {adjustmentType === 'add' ? (
                            <span className="text-green-600 font-medium">+{adjustmentQuantity} (Add)</span>
                          ) : (
                            <span className="text-red-600 font-medium">-{adjustmentQuantity} (Subtract)</span>
                          )}
                          {adjustmentCostPrice.trim() && (
                            <span className="ml-2 text-gray-600">@ ₱{parseFloat(adjustmentCostPrice).toFixed(2)} each</span>
                          )}
                        </div>
                        {adjustmentCostPrice.trim() && adjustmentQuantity.trim() && (
                          <div className="text-sm font-semibold text-gray-700">
                            ₱{(parseFloat(adjustmentCostPrice) * parseInt(adjustmentQuantity)).toFixed(2)}
                          </div>
                        )}
                      </div>
                      {adjustmentType === 'subtract' && currentStockLevel !== null && (
                        <div className="text-xs text-gray-600 mt-1">
                          Current stock: {currentStockLevel}
                          {currentStockLevel < parseFloat(adjustmentQuantity) && (
                            <span className="text-red-600 font-medium ml-2">⚠️ Insufficient stock!</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleAddItem} 
                    disabled={isCheckingStock || (adjustmentType === 'subtract' && currentStockLevel !== null && currentStockLevel < parseInt(adjustmentQuantity))}
                    className="w-full bg-[#52a852] hover:bg-[#4a964a] text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                    tabIndex={9}
                  >
                    {isCheckingStock ? 'Checking Stock...' : 'Add Item'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Items List - Compact */}
            {adjustmentItems.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                      {adjustmentItems.length}
                    </span>
                    Adjustment Items
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Items to be adjusted in {selectedWarehouse?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[30%]">Product</TableHead>
                          <TableHead className="w-[15%]">SKU</TableHead>
                          <TableHead className="w-[15%]">Quantity</TableHead>
                          <TableHead className="w-[15%]">Unit Price</TableHead>
                          <TableHead className="w-[15%]">Total</TableHead>
                          <TableHead className="w-[10%]">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {adjustmentItems.map((item, index) => (
                          <TableRow key={`${item.product_id}-${index}`}>
                            <TableCell>
                              <div>
                                <div className="font-medium text-sm text-gray-900">
                                  {item.product_name}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  Reason: {item.reason}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-sm text-gray-600">
                                {item.product_sku}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`font-medium text-sm ${item.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {item.quantity > 0 ? '+' : ''}{item.quantity}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-900">
                                ₱{item.cost_price.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-sm text-gray-900">
                                ₱{(Math.abs(item.quantity) * item.cost_price).toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
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

            {/* Notes Section - Separate */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <h3 className="text-base font-semibold text-gray-900">Notes (Optional)</h3>
              </div>
              <textarea
                id="adjustment-notes"
                value={adjustmentNotes}
                onChange={(e) => setAdjustmentNotes(e.target.value)}
                placeholder="Add any additional notes or comments for this adjustment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none focus:border-blue-500"
                rows={3}
                tabIndex={10}
                autoFocus={false}
              />
            </div>

            {/* Document Upload Section - Unified Component */}
            <UnifiedDocumentUpload
              referenceType="adjustment"
              referenceId=""
              title="Supporting Documents (Optional)"
              showDownload={false}
              showDelete={false}
              onFilesChange={setUploadedFiles}
              tabIndex={11}
            />

            {/* Action Buttons - Compact */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-600">
                {adjustmentItems.length > 0 && (
                  <span>
                    {adjustmentItems.length} item{adjustmentItems.length !== 1 ? 's' : ''} ready to adjust
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Continue
                </Button>
                <Button 
                  onClick={() => setIsReviewOpen(true)}
                  disabled={adjustmentItems.length === 0}
                  className="bg-[#52a852] hover:bg-[#4a964a] text-white"
                  tabIndex={12}
                >
                  Review & Confirm
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review & Confirm Dialog */}
      <AdjustmentReviewDialog
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onConfirm={() => { 
          setIsReviewOpen(false)
          handleCreateAdjustment()
        }}
        items={adjustmentItems}
        adjustmentDate={adjustmentDate}
        selectedWarehouse={selectedWarehouse}
        processedBy={user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
        notes={adjustmentNotes}
        uploadedFiles={uploadedFiles}
        externalReference={externalReference}
      />

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
              You have unsaved changes. Are you sure you want to close without saving?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => handleCloseWarning(false)}
              className="px-6"
            >
              Continue
            </Button>
            <Button 
              onClick={() => handleCloseWarning(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-6"
            >
              Close Without Saving
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Global Dialogs */}
      {ConfirmDialog}
      {NoticeDialog}
    </>
  )
}
