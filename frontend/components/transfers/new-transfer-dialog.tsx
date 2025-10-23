'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, AlertCircle } from 'lucide-react'
import { TransferForm } from './transfer-form'
import { TransferItemsList } from './transfer-items-list'
import { TransferReviewDialog } from './transfer-review-dialog'
import { TransferNotesSection } from './transfer-notes-section'
import { TransferDocumentsSection } from './transfer-documents-section'

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

interface User {
  first_name: string
  last_name: string
}

interface NewTransferDialogProps {
  isOpen: boolean
  onClose: () => void
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
  transferItems: TransferItem[]
  uploadedFiles: File[]
  user: User | null
  onTransferDateChange: (date: string) => void
  onTransferReasonChange: (reason: string) => void
  onTransferNotesChange: (notes: string) => void
  onTransferQuantityChange: (quantity: string) => void
  onProductSelect: (product: Product | null) => void
  onFromWarehouseChange: (type: 'from' | 'to', value: string) => void
  onToWarehouseChange: (type: 'from' | 'to', value: string) => void
  onAddItem: () => void
  onRemoveItem: (index: number) => void
  onFilesChange: (files: File[]) => void
  onShowWarehouseChangeWarning: () => void
  onShowReviewDialog: () => void
  hasUnsavedChanges: () => boolean
  onResetForm: () => void
}

export function NewTransferDialog({
  isOpen,
  onClose,
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
  transferItems,
  uploadedFiles,
  user,
  onTransferDateChange,
  onTransferReasonChange,
  onTransferNotesChange,
  onTransferQuantityChange,
  onProductSelect,
  onFromWarehouseChange,
  onToWarehouseChange,
  onAddItem,
  onRemoveItem,
  onFilesChange,
  onShowWarehouseChangeWarning,
  onShowReviewDialog,
  hasUnsavedChanges,
  onResetForm
}: NewTransferDialogProps) {
  const [showCloseWarning, setShowCloseWarning] = useState(false)

  const handleClose = () => {
    if (hasUnsavedChanges()) {
      setShowCloseWarning(true)
      return
    }
    onResetForm()
    onClose()
  }

  const handleCloseWarning = (confirmed: boolean) => {
    setShowCloseWarning(false)
    if (confirmed) {
      onResetForm()
      onClose()
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Transfer
            </DialogTitle>
            <DialogDescription>
              Transfer inventory between warehouses
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <TransferForm
              warehouses={warehouses}
              availableProducts={availableProducts}
              currentStock={currentStock}
              quantityError={quantityError}
              warehousesLocked={warehousesLocked}
              transferDate={transferDate}
              transferReason={transferReason}
              transferNotes={transferNotes}
              transferQuantity={transferQuantity}
              selectedProduct={selectedProduct}
              fromWarehouse={fromWarehouse}
              toWarehouse={toWarehouse}
              uploadedFiles={uploadedFiles}
              onTransferDateChange={onTransferDateChange}
              onTransferReasonChange={onTransferReasonChange}
              onTransferNotesChange={onTransferNotesChange}
              onTransferQuantityChange={onTransferQuantityChange}
              onProductSelect={onProductSelect}
              onFromWarehouseChange={onFromWarehouseChange}
              onToWarehouseChange={onToWarehouseChange}
              onAddItem={onAddItem}
              onFilesChange={onFilesChange}
              onShowWarehouseChangeWarning={onShowWarehouseChangeWarning}
            />

            <TransferItemsList
              transferItems={transferItems}
              fromWarehouse={fromWarehouse}
              toWarehouse={toWarehouse}
              onRemoveItem={onRemoveItem}
            />

            <TransferNotesSection
              transferNotes={transferNotes}
              onTransferNotesChange={onTransferNotesChange}
            />

            <TransferDocumentsSection
              uploadedFiles={uploadedFiles}
              onFilesChange={onFilesChange}
            />

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={onShowReviewDialog}
                disabled={transferItems.length === 0}
                className="bg-[#52a852] hover:bg-[#4a964a] text-white"
                tabIndex={10}
              >
                Review and Confirm
              </Button>
            </div>
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
              You have unsaved changes that will be lost if you close this dialog. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleCloseWarning(false)}
              className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg"
            >
              Keep Editing
            </Button>
            <Button
              type="button"
              onClick={() => handleCloseWarning(true)}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg"
            >
              Close Anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
