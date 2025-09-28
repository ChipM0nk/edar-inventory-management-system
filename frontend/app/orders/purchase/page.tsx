'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import api from '@/lib/api'
import { PurchaseOrder, Document } from '@/lib/types'
import { PurchaseOrderCard } from '@/components/purchase-orders/purchase-order-card'
import { DocumentsDialog } from '@/components/purchase-orders/documents-dialog'
import { DocumentViewerDialog } from '@/components/purchase-orders/document-viewer-dialog'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'

export default function PurchaseOrdersPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [selectedDocumentUrl, setSelectedDocumentUrl] = useState<string | null>(null)
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

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (selectedDocumentUrl) {
        window.URL.revokeObjectURL(selectedDocumentUrl)
      }
    }
  }, [selectedDocumentUrl])

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


  const handleViewDocument = async (document: Document) => {
    try {
      setSelectedDocument(document)
      
      console.log('Fetching document:', document.id)
      
      // Fetch the document as blob and create URL
      const response = await api.get(`/documents/${document.id}/download`, {
        responseType: 'blob'
      })
      
      console.log('Document response received:', response.status)
      
      if (response.status === 200) {
        const url = window.URL.createObjectURL(new Blob([response.data]))
        setSelectedDocumentUrl(url)
        setIsDocumentModalOpen(true)
      } else {
        throw new Error(`Unexpected response status: ${response.status}`)
      }
    } catch (error: any) {
      console.error('Error loading document:', error)
      console.error('Error details:', error.response?.data)
      alert(`Failed to load document: ${error.response?.data?.error || error.message}`)
    }
  }

  const handleDownloadDocument = async (document: Document) => {
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
    }
  }

  const openDocumentInNewTab = async (document: Document) => {
    try {
      const response = await api.get(`/documents/${document.id}/download`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      window.open(url, '_blank')
      
      // Clean up the blob URL after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 10000)
    } catch (error) {
      console.error('Error opening document:', error)
      alert('Failed to open document. Please try downloading it instead.')
    }
  }

  const handleValidateDocument = async (document: Document, poNumber: string, orderDate: string) => {
    try {
      await validateDocument(document.id, poNumber, orderDate)
    } catch (error) {
      alert('Failed to validate document. Please try again.')
    }
  }

  const handleDeleteDocument = async (document: Document) => {
    if (!confirm(`Are you sure you want to delete "${document.file_name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await api.delete(`/documents/${document.id}`)
      
      // Remove the document from the current documents list
      setDocuments(prev => prev.filter(doc => doc.id !== document.id))
      
      // Show success message
      alert('Document deleted successfully')
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document. Please try again.')
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
              <LoadingSpinner text="Loading purchase orders..." />
            ) : purchaseOrders.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Orders</CardTitle>
                  <CardDescription>
                    View and manage all purchase orders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmptyState 
                    title="No purchase orders found"
                    description="Purchase orders will appear here once created"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {purchaseOrders.map((order) => (
                  <PurchaseOrderCard
                    key={order.id}
                    order={order}
                    documents={documents}
                    isLoadingDocs={isLoadingDocs}
                    isValidating={isValidating === order.id}
                    onViewDocuments={(order) => {
                      setSelectedOrder(order)
                      loadDocuments(order.id)
                    }}
                    onValidateDocument={handleValidateDocument}
                    onViewDocument={handleViewDocument}
                    onDownloadDocument={handleDownloadDocument}
                    onOpenDocumentInNewTab={openDocumentInNewTab}
                    onDeleteDocument={handleDeleteDocument}
                  />
                ))}
              </div>
            )}

            {/* Document View Modal */}
            <DocumentViewerDialog
              isOpen={isDocumentModalOpen}
              onOpenChange={(open) => {
                setIsDocumentModalOpen(open)
                if (!open && selectedDocumentUrl) {
                  window.URL.revokeObjectURL(selectedDocumentUrl)
                  setSelectedDocumentUrl(null)
                }
              }}
              document={selectedDocument}
              documentUrl={selectedDocumentUrl}
              onDownload={handleDownloadDocument}
            />

          </div>
        </div>
      </div>
    </AppLayout>
  )
}