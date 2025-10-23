'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, AlertCircle } from 'lucide-react'
import { UnifiedDocumentUpload } from '@/components/documents/unified-document-upload'

interface Product {
  id: string
  name: string
  sku: string
  unit_price: number
}

interface StockLevel {
  id: string
  product_id: string
  warehouse_id: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
  product_name?: string
  product_sku?: string
}

interface Warehouse {
  id: string
  name: string
  location: string
}

interface TransferItem {
  product_id: string
  product_name: string
  product_sku: string
  quantity: number
}

interface TransferFormProps {
  warehouses: Warehouse[]
  availableProducts: StockLevel[]
  currentStock: number | null
  quantityError: string
  warehousesLocked: boolean
  transferDate: string
  transferReason: string
  transferNotes: string
  transferQuantity: string
  selectedProduct: Product | null
  fromWarehouse: Warehouse | null
  toWarehouse: Warehouse | null
  uploadedFiles: File[]
  onTransferDateChange: (date: string) => void
  onTransferReasonChange: (reason: string) => void
  onTransferNotesChange: (notes: string) => void
  onTransferQuantityChange: (quantity: string) => void
  onProductSelect: (product: Product | null) => void
  onFromWarehouseChange: (type: 'from' | 'to', value: string) => void
  onToWarehouseChange: (type: 'from' | 'to', value: string) => void
  onAddItem: () => void
  onFilesChange: (files: File[]) => void
  onShowWarehouseChangeWarning: () => void
}

export function TransferForm({
  warehouses,
  availableProducts,
  currentStock,
  quantityError,
  warehousesLocked,
  transferDate,
  transferReason,
  transferNotes,
  transferQuantity,
  selectedProduct,
  fromWarehouse,
  toWarehouse,
  uploadedFiles,
  onTransferDateChange,
  onTransferReasonChange,
  onTransferNotesChange,
  onTransferQuantityChange,
  onProductSelect,
  onFromWarehouseChange,
  onToWarehouseChange,
  onAddItem,
  onFilesChange,
  onShowWarehouseChangeWarning
}: TransferFormProps) {
  const addProductsRef = useRef<HTMLDivElement>(null)
  const productSelectRef = useRef<HTMLButtonElement>(null)
  const fromWarehouseRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="space-y-6">
      {/* Transfer Information */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Transfer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transfer-date" className="text-sm font-medium">Transfer Date *</Label>
              <Input
                id="transfer-date"
                type="date"
                value={transferDate}
                onChange={(e) => onTransferDateChange(e.target.value)}
                tabIndex={-1}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">From Warehouse *</Label>
              <Select 
                value={fromWarehouse?.id || ''} 
                onValueChange={(value) => onFromWarehouseChange('from', value)}
                disabled={warehousesLocked}
              >
                <SelectTrigger 
                  ref={fromWarehouseRef}
                  tabIndex={1}
                >
                  <SelectValue placeholder="Select source warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} - {warehouse.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {warehousesLocked && (
                <p className="text-xs text-gray-500">Remove all items to change warehouse</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">To Warehouse *</Label>
              <Select 
                value={toWarehouse?.id || ''} 
                onValueChange={(value) => onToWarehouseChange('to', value)}
                disabled={warehousesLocked}
              >
                <SelectTrigger tabIndex={2}>
                  <SelectValue placeholder="Select destination warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses
                    .filter(warehouse => warehouse.id !== fromWarehouse?.id)
                    .map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} - {warehouse.location}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {warehousesLocked && (
                <p className="text-xs text-gray-500">Remove all items to change warehouse</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">Reason for Transfer *</Label>
            <Input
              id="reason"
              value={transferReason}
              onChange={(e) => onTransferReasonChange(e.target.value)}
              placeholder="e.g., Stock rebalancing, Customer request, etc."
              tabIndex={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Add Item Form */}
      <Card ref={addProductsRef}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Add Products to Transfer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Product *</Label>
              <Select 
                value={selectedProduct?.id || ''} 
                onValueChange={(value) => {
                  const stockLevel = availableProducts.find(p => p.product_id === value)
                  if (stockLevel) {
                    const product: Product = {
                      id: stockLevel.product_id,
                      name: stockLevel.product_name || '',
                      sku: stockLevel.product_sku || '',
                      unit_price: 0
                    }
                    onProductSelect(product)
                  } else {
                    onProductSelect(null)
                  }
                }}
                disabled={!fromWarehouse}
              >
                <SelectTrigger 
                  ref={productSelectRef} 
                  tabIndex={6}
                  id="product-select"
                  onFocus={() => {
                    if (addProductsRef.current) {
                      addProductsRef.current.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start',
                        inline: 'nearest'
                      })
                    }
                  }}
                >
                  <SelectValue placeholder={fromWarehouse ? "Select a product" : "Select warehouse first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map((stockLevel) => (
                    <SelectItem key={stockLevel.product_id} value={stockLevel.product_id}>
                      {stockLevel.product_name} ({stockLevel.product_sku}) - Stock: {stockLevel.available_quantity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentStock !== null && (
                <p className="text-sm text-gray-600">
                  Available stock: <span className="font-semibold text-blue-600">{currentStock}</span>
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-medium">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={transferQuantity}
                onChange={(e) => onTransferQuantityChange(e.target.value)}
                placeholder="Enter quantity"
                className={quantityError ? 'border-red-500' : ''}
                tabIndex={7}
              />
              {quantityError && (
                <p className="text-sm text-red-600">{quantityError}</p>
              )}
            </div>
          </div>
          
          <Button 
            type="button"
            onClick={onAddItem} 
            className="w-full bg-[#52a852] hover:bg-[#4a964a] text-white"
            tabIndex={8}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product to Transfer
          </Button>
        </CardContent>
      </Card>

    </div>
  )
}
