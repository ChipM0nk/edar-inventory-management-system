'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Eye, Download, FileText, Calendar, User, Building2, ExternalLink, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'

interface PurchaseOrder {
  id: string
  po_number: string
  supplier_name: string
  supplier_contact?: string
  total_amount: number
  status: 'pending' | 'approved' | 'received' | 'cancelled'
  order_date: string
  expected_delivery_date?: string
  received_date?: string
  notes?: string
  first_name: string
  last_name: string
  created_at: string
  updated_at: string
}

interface Document {
  id: string
  purchase_order_id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  uploaded_at: string
  has_po_reference?: boolean
  has_matching_date?: boolean
  validation_status?: string
  validation_notes?: string
}

export default function PurchaseOrdersPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false)
  const [isValidating, setIsValidating] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      loadPurchaseOrders()
    }
  }, [user])

  const loadPurchaseOrders = async () => {
    try {
      setIsLoadingData(true)
      const response = await api.get('/purchase-orders?limit=100')
      setPurchaseOrders(response.data || [])
    } catch (error) {
      console.error('Error loading purchase orders:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const loadDocuments = async (purchaseOrderId: string) => {
    try {
      setIsLoadingDocs(true)
      const response = await api.get(`/documents/purchase-order/${purchaseOrderId}`)
      setDocuments(response.data || [])
    } catch (error) {
      console.error('Error loading documents:', error)
      setDocuments([])
    } finally {
      setIsLoadingDocs(false)
    }
  }

  const validateDocument = async (documentId: string, poNumber: string, orderDate: string) => {
    try {
      setIsValidating(documentId)
      const response = await api.post(`/documents/${documentId}/validate`, null, {
        params: {
          po_number: poNumber,
          order_date: orderDate
        }
      })
      
      // Reload documents to get updated validation status
      if (selectedOrder) {
        await loadDocuments(selectedOrder.id)
      }
      
      return response.data
    } catch (error) {
      console.error('Error validating document:', error)
      throw error
    } finally {
      setIsValidating(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-blue-100 text-blue-800'
      case 'received':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getValidationStatusColor = (status?: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'skipped':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getValidationIcon = (status?: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'failed':
      case 'error':
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document)
    setIsDocumentModalOpen(true)
  }

  const handleDownloadDocument = async (document: Document) => {
    try {
      const response = await api.get(`/documents/${document.id}/download`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', document.file_name)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading document:', error)
    }
  }

  const openDocumentInNewTab = (document: Document) => {
    const url = `${api.defaults.baseURL}/documents/${document.id}/download`
    window.open(url, '_blank')
  }

  const handleValidateDocument = async (document: Document, poNumber: string, orderDate: string) => {
    try {
      await validateDocument(document.id, poNumber, orderDate)
    } catch (error) {
      alert('Failed to validate document. Please try again.')
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
                <p className="mt-2 text-gray-600">Manage incoming purchase orders and their documents</p>
              </div>
              <Button 
                className="flex items-center gap-2"
                onClick={() => {
                  // TODO: Add purchase order creation functionality
                  alert('Purchase order creation feature coming soon!')
                }}
              >
                <Plus className="h-4 w-4" />
                New Purchase Order
              </Button>
            </div>
            
            {isLoadingData ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading purchase orders...</p>
              </div>
            ) : purchaseOrders.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Orders</CardTitle>
                  <CardDescription>
                    View and manage all purchase orders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-500">No purchase orders found</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Purchase orders will appear here once created
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {purchaseOrders.map((order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {order.po_number}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {order.supplier_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(order.order_date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {order.first_name} {order.last_name}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                          <span className="text-lg font-semibold text-gray-900">
                            ${order.total_amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          {order.supplier_contact && (
                            <p>Contact: {order.supplier_contact}</p>
                          )}
                          {order.expected_delivery_date && (
                            <p>Expected Delivery: {formatDate(order.expected_delivery_date)}</p>
                          )}
                          {order.notes && (
                            <p className="mt-1">Notes: {order.notes}</p>
                          )}
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setSelectedOrder(order)
                                loadDocuments(order.id)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Documents
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Documents for {order.po_number}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              {isLoadingDocs ? (
                                <div className="text-center py-4">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                                  <p className="mt-2 text-sm text-gray-600">Loading documents...</p>
                                </div>
                              ) : documents.length === 0 ? (
                                <div className="text-center py-8">
                                  <p className="text-gray-500">No documents found for this purchase order</p>
                                </div>
                              ) : (
                                <div className="grid gap-4">
                                  {documents.map((doc) => (
                                    <Card key={doc.id} className="p-4">
                                      <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                              <h4 className="font-medium text-gray-900">{doc.file_name}</h4>
                                              {doc.validation_status && (
                                                <Badge className={`${getValidationStatusColor(doc.validation_status)} flex items-center gap-1`}>
                                                  {getValidationIcon(doc.validation_status)}
                                                  {doc.validation_status}
                                                </Badge>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                              <span>{doc.file_type}</span>
                                              <span>{formatFileSize(doc.file_size)}</span>
                                              <span>{formatDate(doc.uploaded_at)}</span>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* Validation Status and Warnings */}
                                        {doc.validation_status && doc.validation_status !== 'pending' && (
                                          <div className="space-y-2">
                                            {doc.validation_status === 'warning' && (
                                              <Alert>
                                                <AlertTriangle className="h-4 w-4" />
                                                <AlertDescription>
                                                  <strong>Warning:</strong> {doc.validation_notes}
                                                </AlertDescription>
                                              </Alert>
                                            )}
                                            {doc.validation_status === 'failed' && (
                                              <Alert>
                                                <XCircle className="h-4 w-4" />
                                                <AlertDescription>
                                                  <strong>Validation Failed:</strong> {doc.validation_notes}
                                                </AlertDescription>
                                              </Alert>
                                            )}
                                            {doc.validation_status === 'valid' && (
                                              <Alert>
                                                <CheckCircle className="h-4 w-4" />
                                                <AlertDescription>
                                                  <strong>Validated:</strong> {doc.validation_notes}
                                                </AlertDescription>
                                              </Alert>
                                            )}
                                          </div>
                                        )}
                                        
                                        <div className="flex items-center gap-2">
                                          {doc.validation_status === 'pending' && (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleValidateDocument(doc, order.po_number, order.order_date)}
                                              disabled={isValidating === doc.id}
                                            >
                                              {isValidating === doc.id ? (
                                                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                              ) : (
                                                <RefreshCw className="h-4 w-4 mr-1" />
                                              )}
                                              Validate
                                            </Button>
                                          )}
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleViewDocument(doc)}
                                          >
                                            <Eye className="h-4 w-4 mr-1" />
                                            View
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openDocumentInNewTab(doc)}
                                          >
                                            <ExternalLink className="h-4 w-4 mr-1" />
                                            Open
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDownloadDocument(doc)}
                                          >
                                            <Download className="h-4 w-4 mr-1" />
                                            Download
                                          </Button>
                                        </div>
                                      </div>
                                    </Card>
                                  ))}
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Document View Modal */}
            <Dialog open={isDocumentModalOpen} onOpenChange={setIsDocumentModalOpen}>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>{selectedDocument?.file_name}</DialogTitle>
                </DialogHeader>
                {selectedDocument && (
                  <div className="flex-1 overflow-hidden">
                    {selectedDocument.file_type.startsWith('image/') ? (
                      <div className="flex justify-center items-center h-full min-h-[400px]">
                        <img
                          src={`${api.defaults.baseURL}/documents/${selectedDocument.id}/download`}
                          alt={selectedDocument.file_name}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML = `
                                <div class="text-center text-gray-500">
                                  <p>Failed to load image</p>
                                  <p class="text-sm mt-2">Please try downloading the file instead</p>
                                </div>
                              `
                            }
                          }}
                        />
                      </div>
                    ) : selectedDocument.file_type === 'application/pdf' ? (
                      <div className="h-full min-h-[500px]">
                        <iframe
                          src={`${api.defaults.baseURL}/documents/${selectedDocument.id}/download`}
                          className="w-full h-full border-0"
                          title={selectedDocument.file_name}
                          onError={() => {
                            alert('Failed to load PDF. Please try downloading the file instead.')
                          }}
                        />
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Preview not available for this file type</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Please download the file to view it
                        </p>
                        <Button 
                          className="mt-4"
                          onClick={() => handleDownloadDocument(selectedDocument)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download File
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}