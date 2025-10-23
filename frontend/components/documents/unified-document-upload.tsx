'use client'

import { useState, useEffect } from 'react'
import { Upload, FileText } from 'lucide-react'
import { useNotice } from '@/hooks/use-notice'
import api from '@/lib/api'

interface UnifiedDocumentUploadProps {
  referenceType: string
  referenceId: string
  title?: string
  showDownload?: boolean
  showDelete?: boolean
  className?: string
  onFilesChange?: (files: File[]) => void
  tabIndex?: number
}

interface Document {
  id: string
  file_name: string
  file_type: string
  file_size: number
  uploaded_at: string
}

export function UnifiedDocumentUpload({
  referenceType,
  referenceId,
  title = "Documents",
  showDownload = true,
  showDelete = true,
  className = "",
  onFilesChange,
  tabIndex
}: UnifiedDocumentUploadProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [NoticeDialog, notice] = useNotice()

  // Format file size helper
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Load documents when component mounts or reference changes
  const loadDocuments = async () => {
    if (!referenceId) return
    
    try {
      setIsLoadingDocuments(true)
      const response = await api.get(`/documents/by-reference/${referenceType}/${referenceId}`)
      setDocuments(response.data || [])
    } catch (error) {
      console.error('Error loading documents:', error)
      setDocuments([])
    } finally {
      setIsLoadingDocuments(false)
    }
  }

  // Handle file upload - upload immediately if referenceId exists, otherwise prepare files
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const newFiles = Array.from(files)
      
      // If we have a valid referenceId, upload immediately
      if (referenceId && referenceId !== '') {
        try {
          setIsUploadingDocuments(true)
          const formData = new FormData()
          
          newFiles.forEach((file) => {
            formData.append('documents', file)
          })
          formData.append('reference_type', referenceType)
          formData.append('reference_id', referenceId)

          await api.post('/documents/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })

          // Reload documents to show the newly uploaded ones
          await loadDocuments()
          
          await notice({
            title: 'Upload complete',
            description: `${newFiles.length} document(s) uploaded successfully!`,
            variant: 'success',
          })
        } catch (error) {
          console.error('Error uploading documents:', error)
          await notice({
            title: 'Upload failed',
            description: 'Error uploading documents. Please try again.',
            variant: 'warning',
          })
        } finally {
          setIsUploadingDocuments(false)
        }
      } else {
        // For new items without referenceId, prepare files for later upload
        setUploadedFiles(prev => [...prev, ...newFiles])
        await notice({
          title: 'Files prepared',
          description: `${newFiles.length} file(s) ready for upload`,
          variant: 'success',
        })
      }
    }
  }


  // View document
  const viewDocument = async (document: Document) => {
    try {
      const viewableTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'text/html', 'text/css', 'text/javascript']
      if (!viewableTypes.includes(document.file_type.toLowerCase())) {
        await notice({
          title: 'Cannot preview file',
          description: `This file type (${document.file_type}) cannot be viewed in the browser. Please download it instead.`,
          variant: 'info',
        })
        return
      }
      
      const response = await api.get(`/documents/${document.id}/download`, {
        responseType: 'blob'
      })
      
      const blob = new Blob([response.data], { type: document.file_type })
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      
    } catch (error: any) {
      console.error('Error viewing document:', error)
      await notice({
        title: 'View failed',
        description: 'Error viewing document. Please try again or download the file instead.',
        variant: 'warning',
      })
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
      await notice({
        title: 'Download failed',
        description: 'Error downloading document. Please try again.',
        variant: 'warning',
      })
    }
  }

  // Delete document
  const deleteDocument = async (document: Document) => {
    try {
      await api.delete(`/documents/${document.id}`)
      setDocuments(prev => prev.filter(doc => doc.id !== document.id))
      await notice({
        title: 'Document deleted',
        description: 'Document deleted successfully',
        variant: 'success',
      })
    } catch (error) {
      console.error('Error deleting document:', error)
      await notice({
        title: 'Delete failed',
        description: 'Failed to delete document. Please try again.',
        variant: 'warning',
      })
    }
  }

  // Load documents on mount
  useEffect(() => {
    loadDocuments()
  }, [referenceId])

  // Notify parent when files change
  useEffect(() => {
    if (onFilesChange) {
      onFilesChange(uploadedFiles)
    }
  }, [uploadedFiles, onFilesChange])

  return (
    <>
      <div className={`space-y-2 ${className}`}>
        {title && (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          </div>
        )}
        
        {/* Compact Upload Area */}
        <div className="border-2 border-dashed border-blue-400 bg-blue-50 rounded-md p-3 hover:border-blue-500 hover:bg-blue-100 transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 focus-within:border-blue-600 focus-within:bg-blue-100">
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
            onChange={handleDocumentUpload}
            className="sr-only focus:outline-none"
            id="document-upload"
            tabIndex={tabIndex}
          />
          <label
            htmlFor="document-upload"
            className="cursor-pointer flex items-center gap-3 focus:outline-none"
          >
            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
              <Upload className="w-4 h-4 text-blue-700" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                {isUploadingDocuments ? 'Uploading documents...' : 'Click to upload documents'}
              </p>
              <p className="text-xs text-blue-600">PDF, JPG, PNG, DOC, DOCX, XLS, XLSX up to 10MB each</p>
            </div>
          </label>
        </div>

        {/* Prepared Files List (for new items without referenceId) */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-1">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-1.5 bg-gray-50 rounded text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium text-gray-900 truncate max-w-40">{file.name}</span>
                  <span className="text-gray-500">({formatFileSize(file.size)})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const url = URL.createObjectURL(file)
                      window.open(url, '_blank')
                    }}
                    className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedFiles(prev => prev.filter((_, i) => i !== index))
                    }}
                    className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Existing Documents List */}
        {documents.length > 0 && (
          <div className="space-y-1">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between p-1.5 bg-gray-50 rounded text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium text-gray-900 truncate max-w-40">{document.file_name}</span>
                  <span className="text-gray-500">({formatFileSize(document.file_size)})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => viewDocument(document)}
                    className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
                  >
                    View
                  </button>
                  {showDownload && (
                    <button
                      type="button"
                      onClick={() => downloadDocument(document)}
                      className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded"
                    >
                      Download
                    </button>
                  )}
                  {showDelete && (
                    <button
                      type="button"
                      onClick={() => deleteDocument(document)}
                      className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notice Dialog */}
      {NoticeDialog}
    </>
  )
}
