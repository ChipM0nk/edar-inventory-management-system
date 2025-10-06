'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, RefreshCw, ArrowLeft, Package, Eye, Calendar, User, DollarSign, FileText, Hash, AlertTriangle, Upload, X, File, FileImage } from 'lucide-react'
import api from '@/lib/api'
import { useConfirm } from '@/hooks/use-confirm'
import { useNotice } from '@/hooks/use-notice'

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

interface StockLevel {
  id: string
  product_id: string
  warehouse_id: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
  min_stock_level: number
  max_stock_level?: number
  last_updated: string
  product_name: string
  product_sku: string
  warehouse_name: string
}

interface AdjustmentItem {
  product_id: string
  product_name: string
  product_sku: string
  warehouse_id: string
  warehouse_name: string
  quantity: number
  cost_price: number
  reason: string
}

interface Document {
  id: string
  reference_type: string
  reference_id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  uploaded_at: string
}

interface Adjustment {
  id: string
  reference_id: string
  total_quantity: number
  processed_by: string
  processed_date: string
  created_at: string
  items: AdjustmentItem[]
  status?: string
  notes?: string | null
}

export default function AdjustmentsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [ConfirmDialog, confirm] = useConfirm()
  const [NoticeDialog, notice] = useNotice()
  
  // State management
  const [adjustments, setAdjustments] = useState<Adjustment[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredAdjustments, setFilteredAdjustments] = useState<Adjustment[]>([])
  const [selectedAdjustment, setSelectedAdjustment] = useState<Adjustment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoadingAdjustmentDetails, setIsLoadingAdjustmentDetails] = useState(false)
  const [adjustmentDetailsError, setAdjustmentDetailsError] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  // Create adjustment form state
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
  
  // Document upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false)
  
  // Document display state
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [viewingDocument, setViewingDocument] = useState<string | null>(null)
  const [documentViewerUrl, setDocumentViewerUrl] = useState<string | null>(null)
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  
  // Document upload state for details modal
  const [showDocumentUpload, setShowDocumentUpload] = useState(false)
  const [uploadedFilesDetails, setUploadedFilesDetails] = useState<File[]>([])
  const [isUploadingDocumentsDetails, setIsUploadingDocumentsDetails] = useState(false)
  
  // Reference fields for PO/SO connections
  const [referenceType, setReferenceType] = useState<string>('')
  const [referenceId, setReferenceId] = useState<string>('')
  const [referenceNumber, setReferenceNumber] = useState<string>('')
  const [adjustmentReasonType, setAdjustmentReasonType] = useState<string>('')
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [salesOrders, setSalesOrders] = useState<any[]>([])
  // Review dialog state
  const [isReviewOpen, setIsReviewOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Load data when user is available
  useEffect(() => {
    if (user) {
      loadAdjustments()
      loadProducts()
      loadWarehouses()
      loadPurchaseOrders()
      loadSalesOrders()
    }
  }, [user])

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
    // Don't reset currentStockLevel when switching adjustment types
    // Only reset when product or warehouse changes (handled in their respective onChange handlers)
  }, [adjustmentType, selectedProduct, selectedWarehouse, adjustmentQuantity])

  // Filter adjustments based on search term
  useEffect(() => {
    let filtered = adjustments

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (adjustment) =>
          adjustment.reference_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          adjustment.processed_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
          adjustment.items.some(item => 
            item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.product_sku.toLowerCase().includes(searchTerm.toLowerCase())
          )
      )
    }

    setFilteredAdjustments(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }, [searchTerm, adjustments])

  // Pagination logic
  const totalPages = Math.ceil(filteredAdjustments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentAdjustments = filteredAdjustments.slice(startIndex, endIndex)

  const loadAdjustments = async () => {
    try {
      setIsLoadingData(true)
      const response = await api.get('/adjustments?limit=100')
      const adjustments = response.data.adjustments || []
      
      console.log('Adjustments from API:', adjustments)
      
      // Convert backend adjustments to frontend format and load item counts
      const convertedAdjustments = await Promise.all(adjustments.map(async (adj: any) => {
        // Load item count for each adjustment
        let itemCount = 0
        try {
          const itemResponse = await api.get(`/adjustments/${adj.id}`)
          itemCount = itemResponse.data.items ? itemResponse.data.items.length : 0
        } catch (error) {
          console.warn(`Failed to load items for adjustment ${adj.id}:`, error)
        }

        return {
          id: adj.id,
          reference_id: adj.reference_number,
          total_quantity: adj.total_quantity,
          processed_by: adj.processed_by_first_name && adj.processed_by_last_name 
            ? `${adj.processed_by_first_name} ${adj.processed_by_last_name}`
            : adj.created_by_first_name && adj.created_by_last_name
            ? `${adj.created_by_first_name} ${adj.created_by_last_name}`
            : 'Unknown',
          processed_date: adj.processed_date || adj.created_at,
          created_at: adj.created_at,
          items: Array(itemCount).fill(null), // Create array with correct length for display
          status: adj.status,
          notes: adj.notes
        }
      }))
      
      console.log('Converted adjustments:', convertedAdjustments)
      setAdjustments(convertedAdjustments)
    } catch (error) {
      console.error('Error loading adjustments:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await api.get('/products?limit=100')
      setProducts(response.data.products || [])
    } catch (error) {
      console.error('Error loading products:', error)
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

  const loadPurchaseOrders = async () => {
    try {
      console.log('Loading purchase orders...')
      const response = await api.get('/purchase-orders?limit=100')
      console.log('Purchase orders API response:', response)
      console.log('Response data:', response.data)
      console.log('Response status:', response.status)
      
      const purchaseOrders = response.data || []
      console.log('Loaded purchase orders for adjustments:', purchaseOrders)
      console.log('Number of purchase orders:', purchaseOrders.length)
      
      setPurchaseOrders(purchaseOrders)
    } catch (error: any) {
      console.error('Error loading purchase orders:', error)
      console.error('Error details:', error.response?.data)
      console.error('Error status:', error.response?.status)
    }
  }

  const loadSalesOrders = async () => {
    try {
      // Placeholder for sales orders - implement when sales order API is available
      setSalesOrders([])
    } catch (error) {
      console.error('Error loading sales orders:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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
    // Reset reference fields
    setReferenceType('')
    setReferenceId('')
    setReferenceNumber('')
    setAdjustmentReasonType('')
    // Reset product search
    setProductSearchTerm('')
    setShowProductDropdown(false)
    // Reset document upload
    setUploadedFiles([])
    setIsUploadingDocuments(false)
  }

  const handleAdjustmentClick = async (adjustment: Adjustment) => {
    setSelectedAdjustment(adjustment)
    setIsModalOpen(true)
    setIsLoadingAdjustmentDetails(true)
    setAdjustmentDetailsError(null)
    
    // Load documents for this adjustment
    loadDocuments(adjustment.id)
    
    // Fetch detailed adjustment data including items
    try {
      const response = await api.get(`/adjustments/${adjustment.id}`)
      const detailedAdjustment = response.data
      
      // Convert backend adjustment to frontend format with items
      const convertedAdjustment: Adjustment = {
        id: detailedAdjustment.id,
        reference_id: detailedAdjustment.reference_number,
        total_quantity: detailedAdjustment.total_quantity,
        processed_by: detailedAdjustment.processed_by_first_name && detailedAdjustment.processed_by_last_name 
          ? `${detailedAdjustment.processed_by_first_name} ${detailedAdjustment.processed_by_last_name}`
          : detailedAdjustment.created_by_first_name && detailedAdjustment.created_by_last_name
          ? `${detailedAdjustment.created_by_first_name} ${detailedAdjustment.created_by_last_name}`
          : 'Unknown',
        processed_date: detailedAdjustment.processed_date || detailedAdjustment.created_at,
        created_at: detailedAdjustment.created_at,
        status: detailedAdjustment.status,
        notes: detailedAdjustment.notes,
        items: detailedAdjustment.items?.map((item: any) => ({
          product_id: item.product_id,
          product_name: item.product_name || 'Unknown Product',
          product_sku: item.product_sku || 'N/A',
          warehouse_id: item.warehouse_id,
          warehouse_name: item.warehouse_name || 'Unknown Warehouse',
          quantity: item.quantity,
          cost_price: item.cost_price || 0,
          reason: item.reason || 'N/A'
        })) || []
      }
      
      setSelectedAdjustment(convertedAdjustment)
    } catch (error: any) {
      console.error('Error fetching adjustment details:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load adjustment details'
      setAdjustmentDetailsError(errorMessage)
      // Keep the original adjustment data if fetch fails
    } finally {
      setIsLoadingAdjustmentDetails(false)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedAdjustment(null)
    setAdjustmentDetailsError(null)
    setDocuments([])
    setDocumentUrl(null)
    setShowDocumentUpload(false)
    setUploadedFilesDetails([])
  }

  const checkStockLevel = async (productId: string, warehouseId: string): Promise<number> => {
    try {
      setIsCheckingStock(true)
      const response = await api.get(`/stock-levels/${productId}/${warehouseId}`)
      const data = response.data || {}
      const qty = typeof data.quantity === 'number' ? data.quantity : (typeof data.available_quantity === 'number' ? data.available_quantity : 0)
      console.log('checkStockLevel', { productId, warehouseId, data, qty })
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
      alert('Please fill in all required fields with valid values')
      return
    }

    // Check stock level for subtraction adjustments
    if (adjustmentType === 'subtract') {
      setIsCheckingStock(true)
      try {
        const currentStock = await checkStockLevel(selectedProduct.id, selectedWarehouse.id)
        setCurrentStockLevel(currentStock)
        
        if (currentStock < quantity) {
          alert(`Insufficient stock! Current stock: ${currentStock}, trying to subtract: ${quantity}`)
          setIsCheckingStock(false)
          return
        }
      } catch (error) {
        console.error('Error checking stock:', error)
        alert('Error checking stock level. Please try again.')
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
      warehouse_id: selectedWarehouse.id,
      warehouse_name: selectedWarehouse.name,
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
  }

  const handleRemoveItem = (index: number) => {
    setAdjustmentItems(adjustmentItems.filter((_, i) => i !== index))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newFiles = Array.from(files)
      setUploadedFiles(prev => [...prev, ...newFiles])
    }
  }

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Document helper functions
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get file type icon
  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase()
    if (type.includes('image')) {
      return <FileImage className="w-5 h-5 text-green-500" />
    } else if (type.includes('pdf')) {
      return <File className="w-5 h-5 text-red-500" />
    } else {
      return <FileText className="w-5 h-5 text-gray-400" />
    }
  }

  // Check if file is viewable
  const isViewable = (fileType: string) => {
    const viewableTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'text/html', 'text/css', 'text/javascript']
    return viewableTypes.includes(fileType.toLowerCase())
  }

  // Load documents for an adjustment
  const loadDocuments = async (adjustmentId: string) => {
    try {
      setIsLoadingDocuments(true)
      console.log('Loading documents for adjustment ID:', adjustmentId)
      const response = await api.get(`/documents/by-reference/adjustment/${adjustmentId}`)
      console.log('Documents response:', response.data)
      setDocuments(response.data || [])
    } catch (error) {
      console.error('Error loading documents:', error)
      console.error('Error details:', (error as any).response?.data)
      setDocuments([])
    } finally {
      setIsLoadingDocuments(false)
    }
  }

  // Download document
  const downloadDocument = async (document: Document) => {
    try {
      const response = await api.get(`/documents/${document.id}/download`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = window.document.createElement('a')
      link.href = url
      link.setAttribute('download', document.file_name)
      window.document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading document:', error)
      alert('Error downloading document. Please try again.')
    }
  }

  // View document in new tab
  const viewDocument = async (document: Document) => {
    try {
      setViewingDocument(document.id)
      
      // Check if file type is viewable in browser
      const viewableTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'text/html', 'text/css', 'text/javascript']
      if (!viewableTypes.includes(document.file_type.toLowerCase())) {
        alert(`This file type (${document.file_type}) cannot be viewed in the browser. Please download it instead.`)
        return
      }
      
      const response = await api.get(`/documents/${document.id}/download`, {
        responseType: 'blob'
      })
      
      // Create blob URL with the correct MIME type
      const blob = new Blob([response.data], { type: document.file_type })
      const url = window.URL.createObjectURL(blob)
      
      // Set the document URL for the viewer dialog
      setDocumentUrl(url)
      
    } catch (error: any) {
      console.error('Error viewing document:', error)
      if (error.response?.status === 404) {
        alert('Document not found. It may have been deleted.')
      } else if (error.response?.status === 403) {
        alert('You do not have permission to view this document.')
      } else {
        alert('Error viewing document. Please try again.')
      }
    } finally {
      setViewingDocument(null)
    }
  }

  // Delete document
  const deleteDocument = async (document: Document) => {
    const confirmed = await confirm({
      title: 'Delete document?',
      description: `"${document.file_name}" will be permanently deleted. This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    })
    if (!confirmed) return

    try {
      await api.delete(`/documents/${document.id}`)
      
      // Remove the document from the current documents list
      setDocuments(prev => prev.filter(doc => doc.id !== document.id))
      
      // Show success message
      await notice({
        title: 'Document deleted',
        description: 'Document deleted successfully.',
        okText: 'OK',
        variant: 'success',
      })
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document. Please try again.')
    }
  }

  // Document upload functions for details modal
  const handleFileSelectDetails = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setUploadedFilesDetails(prev => [...prev, ...files])
  }

  const removeFileDetails = (index: number) => {
    setUploadedFilesDetails(prev => prev.filter((_, i) => i !== index))
  }

  const uploadDocumentsDetails = async () => {
    if (!selectedAdjustment || uploadedFilesDetails.length === 0) return

    try {
      setIsUploadingDocumentsDetails(true)
      const formData = new FormData()
      
      uploadedFilesDetails.forEach((file) => {
        formData.append('documents', file)
      })
      formData.append('reference_type', 'adjustment')
      formData.append('reference_id', selectedAdjustment.id)

      await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      // Reload documents and clear upload files
      await loadDocuments(selectedAdjustment.id)
      setUploadedFilesDetails([])
      setShowDocumentUpload(false)
      
      alert('Documents uploaded successfully!')
    } catch (error) {
      console.error('Error uploading documents:', error)
      alert('Error uploading documents. Please try again.')
    } finally {
      setIsUploadingDocumentsDetails(false)
    }
  }

  const handleCreateAdjustment = async () => {
    if (adjustmentItems.length === 0) {
      alert('Please add at least one item to the adjustment')
      return
    }

    if (!user) {
      alert('User not authenticated')
      return
    }

    try {
      // Generate reference number
      const referenceNumber = generateReferenceNumber()
      setGeneratedReferenceNumber(referenceNumber)

      // Calculate total quantity
      const totalQuantity = adjustmentItems.reduce((sum, item) => sum + Math.abs(item.quantity), 0)

      // Create adjustment using backend API
      const adjustmentPayload = {
        reference_number: referenceNumber,
        adjustment_date: new Date(adjustmentDate).toISOString(),
        total_quantity: totalQuantity,
        reason: 'Inventory adjustment',
        status: 'completed',
        created_by: user.id,
        // Reference fields for PO/SO connections
        reference_type: referenceType || null,
        reference_id: referenceId || null,
        adjustment_reason: adjustmentReasonType || null,
        items: adjustmentItems.map(item => ({
          product_id: item.product_id,
          warehouse_id: item.warehouse_id,
          quantity: item.quantity,
          cost_price: item.cost_price,
          reason: item.reason,
          // Reference fields for item-level tracking
          reference_type: referenceType || null,
          reference_id: referenceId || null,
          reference_number: referenceNumber || null,
          adjustment_reason: adjustmentReasonType || null
        }))
      }

      console.log('Sending adjustment payload:', adjustmentPayload)
      
      const adjustmentResponse = await api.post('/adjustments', adjustmentPayload)
      const createdAdjustmentId = adjustmentResponse.data?.id

      // Upload documents if any
      if (uploadedFiles.length > 0 && createdAdjustmentId) {
        try {
          setIsUploadingDocuments(true)
          
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
          
          console.log('Documents uploaded successfully')
        } catch (documentError) {
          console.error('Error uploading documents:', documentError)
          // Don't fail the entire adjustment creation if document upload fails
          alert('Adjustment created successfully, but some documents failed to upload. You can try uploading them later.')
        } finally {
          setIsUploadingDocuments(false)
        }
      }

      // Reset form and close modal
      resetForm()
      setIsCreateModalOpen(false)
      
      // Reload adjustments
      await loadAdjustments()
      
      await notice({
        title: 'Adjustment created',
        description: `Reference Number: ${referenceNumber}${uploadedFiles.length > 0 ? `\nDocuments uploaded: ${uploadedFiles.length}` : ''}`,
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
      setGeneratedReferenceNumber(null) // Reset reference number on error
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
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Stock Adjustments</h1>
                <p className="mt-2 text-gray-600">Manage inventory adjustments and corrections</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={loadAdjustments}
                  disabled={isLoadingData}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button 
                  className="flex items-center gap-2 bg-[#52a852] hover:bg-[#4a964a] text-white"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  New Adjustment
                </Button>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Stock Adjustments</CardTitle>
                <CardDescription>
                  View and manage all inventory adjustments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by reference number, processed by, or product..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Adjustments Table */}
                {isLoadingData ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading adjustments...</p>
                  </div>
                ) : currentAdjustments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {searchTerm 
                        ? 'No adjustments found matching your search' 
                        : 'No adjustments available'
                      }
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      {searchTerm
                        ? 'Try adjusting your search terms' 
                        : 'Adjustments will appear here once created'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reference Number</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Processed By</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Items</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentAdjustments.map((adjustment) => (
                          <TableRow 
                            key={adjustment.reference_id}
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleAdjustmentClick(adjustment)}
                          >
                            <TableCell className="font-mono font-medium text-blue-600 hover:text-blue-800">
                              {adjustment.reference_id}
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                Adjustment
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {adjustment.processed_by}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {formatDate(adjustment.processed_date)}
                            </TableCell>
                            <TableCell>
                              {adjustment.status === 'cancelled' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Cancelled</span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {adjustment.items ? adjustment.items.length : 0} item{(adjustment.items ? adjustment.items.length : 0) !== 1 ? 's' : ''}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredAdjustments.length)} of {filteredAdjustments.length} results
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
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={currentPage === page ? "bg-[#52a852] hover:bg-[#4a964a] text-white" : ""}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Adjustment Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Adjustment Details
              {selectedAdjustment?.status === 'cancelled' && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Cancelled
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Complete information about this inventory adjustment
            </DialogDescription>
          </DialogHeader>
          
          {selectedAdjustment && (
            <div className="space-y-6">
              {/* Cancelled Banner */}
              {selectedAdjustment.status === 'cancelled' && (
                <div className="border border-red-200 bg-red-50 text-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <svg className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l6.518 11.59c.75 1.335-.213 2.986-1.742 2.986H3.48c-1.53 0-2.492-1.651-1.742-2.986l6.518-11.59zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V7a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                    </div>
                    <div>
                      <p className="font-semibold">This adjustment has been cancelled</p>
                      <p className="text-sm opacity-90">No further actions can be taken on this adjustment.</p>
                    </div>
                  </div>
                </div>
              )}
              {/* Adjustment Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Adjustment Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Hash className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Reference Number</p>
                        <p className="text-sm text-gray-600 font-mono">{selectedAdjustment.reference_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {selectedAdjustment.status === 'cancelled' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Adjustment
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Processed Date</p>
                        <p className="text-sm text-gray-600">{formatDate(selectedAdjustment.processed_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Processed By</p>
                        <p className="text-sm text-gray-600">{selectedAdjustment.processed_by}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cancellation Info */}
              {selectedAdjustment.status === 'cancelled' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cancellation</CardTitle>
                    <CardDescription>
                      Details of the cancellation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedAdjustment.notes && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Reason: </span>
                        {selectedAdjustment.notes}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">Cancelled at: {formatDate(selectedAdjustment.processed_date)}</div>
                    <div className="text-xs text-gray-500">Cancelled by: {selectedAdjustment.processed_by}</div>
                  </CardContent>
                </Card>
              )}

              {/* Adjustment Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Adjustment Items</CardTitle>
                  <CardDescription>
                    Complete list of items in this adjustment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingAdjustmentDetails ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading adjustment details...</p>
                    </div>
                  ) : adjustmentDetailsError ? (
                    <div className="text-center py-8">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                          <h3 className="text-sm font-medium text-red-800">Error Loading Details</h3>
                        </div>
                        <p className="text-sm text-red-700">{adjustmentDetailsError}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAdjustmentClick(selectedAdjustment!)}
                          className="mt-3 text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  ) : selectedAdjustment.items.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No items found for this adjustment</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Warehouse</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Cost Price</TableHead>
                            <TableHead>Reason</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedAdjustment.items.map((item, index) => (
                            <TableRow key={`${item.product_id}-${index}`}>
                              <TableCell className="font-medium">
                                {item.product_name}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {item.product_sku}
                              </TableCell>
                              <TableCell>
                                {item.warehouse_name}
                              </TableCell>
                              <TableCell className={`font-medium ${item.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {item.quantity > 0 ? '+' : ''}{item.quantity}
                              </TableCell>
                              <TableCell className="font-medium">
                                ₱{item.cost_price.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-sm">
                                {item.reason}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Documents Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Upload Documents */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Button
                        onClick={() => setShowDocumentUpload(!showDocumentUpload)}
                        variant="outline"
                        size="sm"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Add Documents
                      </Button>
                    </div>
                    
                    {showDocumentUpload && (
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Select documents to upload
                            </label>
                            <input
                              type="file"
                              multiple
                              accept=".pdf,.png,.jpg,.jpeg"
                              onChange={handleFileSelectDetails}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                          </div>
                          
                          {uploadedFilesDetails.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Selected files:</p>
                              <ul className="space-y-1">
                                {uploadedFilesDetails.map((file, index) => (
                                  <li key={index} className="flex items-center justify-between text-sm text-gray-600 bg-white p-2 rounded">
                                    <span>{file.name} ({formatFileSize(file.size)})</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeFileDetails(index)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <Button
                              onClick={uploadDocumentsDetails}
                              disabled={uploadedFilesDetails.length === 0 || isUploadingDocumentsDetails}
                              size="sm"
                            >
                              {isUploadingDocumentsDetails ? 'Uploading...' : 'Upload'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowDocumentUpload(false)
                                setUploadedFilesDetails([])
                              }}
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {isLoadingDocuments ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading documents...</p>
                    </div>
                  ) : documents.length > 0 ? (
                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            {getFileIcon(doc.file_type)}
                            <div>
                              <p className="font-medium text-sm">{doc.file_name}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(doc.file_size)} • Uploaded {formatDateTime(doc.uploaded_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isViewable(doc.file_type) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => viewDocument(doc)}
                                className="text-green-600 hover:text-green-700 border-green-300 hover:bg-green-50"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadDocument(doc)}
                              className="text-blue-600 hover:text-blue-700 border-blue-300 hover:bg-blue-50"
                            >
                              Download
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteDocument(doc)}
                              className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No documents attached to this adjustment</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={closeModal}>
                  Close
                </Button>
                {/* Cancel adjustment action */}
                {selectedAdjustment.status !== 'cancelled' && (
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (!selectedAdjustment) return
                      const proceed = await confirm({
                        title: 'Cancel adjustment?',
                        description: 'This will reverse stock movements for all items. This action cannot be undone.',
                        confirmText: 'Cancel Adjustment',
                        cancelText: 'Keep Adjustment',
                        variant: 'danger',
                      })
                      if (!proceed) return
                      try {
                        await api.post(`/adjustments/${selectedAdjustment.id}/cancel`, { reason: 'User cancelled from UI' })
                        await notice({
                          title: 'Adjustment cancelled',
                          description: 'The adjustment was cancelled and stock was updated.',
                          variant: 'success',
                        })
                        closeModal()
                        await loadAdjustments()
                      } catch (e: any) {
                        await notice({
                          title: 'Cancellation failed',
                          description: e?.response?.data?.error || 'An error occurred while cancelling the adjustment.',
                          variant: 'warning',
                        })
                      }
                    }}
                  >
                    Cancel Adjustment
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Adjustment Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
        setIsCreateModalOpen(open)
        if (!open) {
          resetForm() // Clear form and success message when modal is closed
        }
      }}>
        {ConfirmDialog}
        {NoticeDialog}
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Plus className="h-5 w-5" />
              Create New Adjustment
            </DialogTitle>
            <DialogDescription>
              Add inventory adjustments to correct stock levels
            </DialogDescription>
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
                    Reference Number: <span className="font-mono font-semibold">{generatedReferenceNumber}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            {/* Header Info - Compact */}
            <div className="p-4 bg-gray-50 rounded-lg">
              {/* Processed By - Small at top */}
              <div className="flex items-center gap-2 mb-3 p-2 bg-white rounded border w-fit">
                <User className="h-3 w-3 text-gray-500" />
                <span className="text-xs text-gray-600">Processed by:</span>
                <span className="text-xs font-medium text-gray-900">
                  {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
                </span>
              </div>
              
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
                          // Clear add-item inputs and preview state
                          setAdjustmentQuantity('')
                          setAdjustmentCostPrice('')
                          setAdjustmentType('add')
                          setAdjustmentReason('')
                          setAdjustmentReasonOther('')
                        }
                      } else {
                        setSelectedWarehouse(warehouse)
                        setSelectedProduct(null)
                        setCurrentStockLevel(null)
                        setProductSearchTerm('')
                        setShowProductDropdown(false)
                        // Clear add-item inputs and preview state
                        setAdjustmentQuantity('')
                        setAdjustmentCostPrice('')
                        setAdjustmentType('add')
                        setAdjustmentReason('')
                        setAdjustmentReasonOther('')
                      }
                    } else {
                      setSelectedWarehouse(warehouse || null)
                      setSelectedProduct(null)
                      setCurrentStockLevel(null)
                      setProductSearchTerm('')
                      setShowProductDropdown(false)
                      // Clear add-item inputs and preview state
                      setAdjustmentQuantity('')
                      setAdjustmentCostPrice('')
                      setAdjustmentType('add')
                      setAdjustmentReason('')
                      setAdjustmentReasonOther('')
                    }
                  }}>
                    <SelectTrigger className="mt-1">
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
                  <Label htmlFor="reference" className="text-xs font-medium text-gray-600">Reference</Label>
                  <Input
                    id="reference"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="PO, Sales, Transfer, etc."
                    className="mt-1"
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
                        value={selectedProduct ? `${selectedProduct.name} (${selectedProduct.sku})` : productSearchTerm}
                        onChange={(e) => {
                          const value = e.target.value
                          setProductSearchTerm(value)
                          setSelectedProduct(null)
                          setShowProductDropdown(true)
                          setCurrentStockLevel(null)
                        }}
                        onFocus={() => {
                          setShowProductDropdown(true)
                        }}
                        onBlur={() => {
                          // Delay hiding dropdown to allow for selection
                          setTimeout(() => setShowProductDropdown(false), 200)
                        }}
                        placeholder="Search products by name or SKU..."
                        className="pr-8"
                      />
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      
                      {/* Dropdown with filtered products */}
                      {showProductDropdown && filteredProducts.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {filteredProducts.map((product) => (
                            <div
                              key={product.id}
                              className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => {
                                setSelectedProduct(product)
                                setProductSearchTerm('')
                                setShowProductDropdown(false)
                              }}
                            >
                              <div className="font-medium text-gray-900 text-sm">{product.name}</div>
                              <div className="text-xs text-gray-500">SKU: {product.sku}</div>
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
                              type="radio"
                              name="adjustmentType"
                              value="add"
                              checked={adjustmentType === 'add'}
                              onChange={(e) => setAdjustmentType(e.target.value as 'add' | 'subtract')}
                              className="text-green-600"
                            />
                            <span className="text-green-600 text-sm font-medium">Add</span>
                          </label>
                          <label className="flex items-center space-x-1">
                            <input
                              type="radio"
                              name="adjustmentType"
                              value="subtract"
                              checked={adjustmentType === 'subtract'}
                              onChange={(e) => setAdjustmentType(e.target.value as 'add' | 'subtract')}
                              className="text-red-600"
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
                            // Remove leading zeros and prevent negative numbers
                            const cleanValue = value.replace(/^0+/, '') || ''
                            if (cleanValue === '' || (parseInt(cleanValue) > 0 && cleanValue === parseInt(cleanValue).toString())) {
                              setAdjustmentQuantity(cleanValue)
                            }
                          }}
                          placeholder="Enter quantity"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="cost_price" className="text-xs font-medium text-gray-600">Cost Price *</Label>
                        <Input
                          id="cost_price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={adjustmentCostPrice}
                          onChange={(e) => {
                            const value = e.target.value
                            // Allow decimal numbers and prevent negative numbers
                            if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                              setAdjustmentCostPrice(value)
                            }
                          }}
                          placeholder="Enter cost price"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="reason" className="text-xs font-medium text-gray-600">Reason *</Label>
                        <Select value={adjustmentReason} onValueChange={setAdjustmentReason}>
                          <SelectTrigger className="mt-1">
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
                  <div className="space-y-2">
                    {adjustmentItems.map((item, index) => (
                      <div key={`${item.product_id}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900 truncate">
                                {item.product_name}
                              </div>
                              <div className="text-xs text-gray-500 font-mono">
                                SKU: {item.product_sku}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className={`font-medium ${item.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {item.quantity > 0 ? '+' : ''}{item.quantity}
                              </div>
                              <div className="text-gray-600">
                                ₱{item.cost_price.toFixed(2)}
                              </div>
                              <div className="font-semibold text-gray-900">
                                ₱{(Math.abs(item.quantity) * item.cost_price).toFixed(2)}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Reason: {item.reason}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 ml-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Document Upload Section - Compact */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Supporting Documents (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="document-upload"
                  />
                  <label htmlFor="document-upload" className="cursor-pointer">
                    <Upload className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-600">Click to upload documents</p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, Images, Word, Excel (Max 10MB each)
                    </p>
                  </label>
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <Label className="text-xs font-medium text-gray-600">Uploaded Files ({uploadedFiles.length})</Label>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <File className="h-3 w-3 text-gray-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFile(index)}
                            className="text-red-600 hover:text-red-800 h-6 w-6 p-0 flex-shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

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
                <Button variant="outline" onClick={() => {
                  resetForm()
                  setIsCreateModalOpen(false)
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => setIsReviewOpen(true)}
                  disabled={adjustmentItems.length === 0 || isUploadingDocuments}
                  className="bg-[#52a852] hover:bg-[#4a964a] text-white"
                >
                  {isUploadingDocuments ? 'Uploading...' : 'Review & Confirm'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review & Confirm Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review Adjustment</DialogTitle>
            <DialogDescription>Confirm the details below before creating the transaction.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-gray-500">Processed By</div>
                <div className="font-medium">{user ? `${user.first_name} ${user.last_name}` : ''}</div>
              </div>
              <div>
                <div className="text-gray-500">Adjustment Date</div>
                <div className="font-medium">{adjustmentDate}</div>
              </div>
              <div>
                <div className="text-gray-500">Warehouse</div>
                <div className="font-medium">{selectedWarehouse?.name || '—'}</div>
              </div>
            </div>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustmentItems.map((item, idx) => (
                    <TableRow key={`${item.product_id}-${idx}`}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell className="font-mono text-sm">{item.product_sku}</TableCell>
                      <TableCell className="text-right {item.quantity>0?'text-green-600':'text-red-600'}">{item.quantity}</TableCell>
                      <TableCell className="text-right">₱{item.cost_price.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">₱{(Math.abs(item.quantity) * item.cost_price).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end gap-6 text-sm">
              <div>
                <div className="text-gray-500">Items</div>
                <div className="font-medium text-right">{adjustmentItems.length}</div>
              </div>
              <div>
                <div className="text-gray-500">Total Quantity</div>
                <div className="font-medium text-right">{adjustmentItems.reduce((s,i)=> s + Math.abs(i.quantity), 0)}</div>
              </div>
              <div>
                <div className="text-gray-500">Total Amount</div>
                <div className="font-semibold text-right">₱{adjustmentItems.reduce((s,i)=> s + Math.abs(i.quantity)*i.cost_price, 0).toFixed(2)}</div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={()=>setIsReviewOpen(false)}>Back</Button>
              <Button className="bg-[#52a852] hover:bg-[#4a964a] text-white" onClick={() => { setIsReviewOpen(false); handleCreateAdjustment() }}>Confirm & Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Dialog */}
      <Dialog open={!!documentUrl} onOpenChange={() => setDocumentUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Document Viewer</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {documentUrl && (
              <iframe
                src={documentUrl}
                className="w-full h-[70vh] border-0"
                title="Document Viewer"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
