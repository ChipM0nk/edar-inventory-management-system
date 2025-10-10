'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, Download, ExternalLink, RefreshCw, AlertTriangle, CheckCircle, XCircle, Trash2, FileImage, File } from 'lucide-react'
import { formatDate, formatFileSize } from '@/lib/utils'

export interface Document {
  id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  uploaded_at: string
  validation_status?: string
  validation_notes?: string
}

interface DocumentCardProps {
  document: Document
  isValidating?: boolean
  showValidation?: boolean
  onValidate?: (document: Document) => void
  onView: (document: Document) => void
  onDownload: (document: Document) => void
  onOpenInNewTab?: (document: Document) => void
  onDelete: (document: Document) => void
  className?: string
}

export function DocumentCard({ 
  document, 
  isValidating = false,
  showValidation = false,
  onValidate,
  onView, 
  onDownload, 
  onOpenInNewTab,
  onDelete,
  className = ""
}: DocumentCardProps) {
  const getValidationStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getValidationIconComponent = (status?: string) => {
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

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase()
    if (type.includes('image')) {
      return <FileImage className="h-5 w-5 text-green-500" />
    } else if (type.includes('pdf')) {
      return <File className="h-5 w-5 text-red-500" />
    } else {
      return <File className="h-5 w-5 text-gray-400" />
    }
  }

  return (
    <div className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors ${className}`}>
      <div className="flex items-center gap-3 flex-1">
        {getFileIcon(document.file_type)}
        <div className="flex-1">
          <p className="font-medium text-gray-900">{document.file_name}</p>
          <p className="text-sm text-gray-500">
            {formatFileSize(document.file_size)} • Uploaded {formatDate(document.uploaded_at)}
          </p>
          {showValidation && document.validation_status && (
            <Badge className={`${getValidationStatusColor(document.validation_status)} flex items-center gap-1 mt-1 w-fit`}>
              {getValidationIconComponent(document.validation_status)}
              {document.validation_status}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {showValidation && document.validation_status === 'pending' && onValidate && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onValidate(document)}
            disabled={isValidating}
            className="text-blue-600 hover:text-blue-700 border-blue-300 hover:bg-blue-50"
          >
            {isValidating ? (
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
          onClick={() => onView(document)}
          className="text-green-600 hover:text-green-700 border-green-300 hover:bg-green-50"
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDownload(document)}
          className="text-blue-600 hover:text-blue-700 border-blue-300 hover:bg-blue-50"
        >
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
        {onOpenInNewTab && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenInNewTab(document)}
            className="text-purple-600 hover:text-purple-700 border-purple-300 hover:bg-purple-50"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Open
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDelete(document)}
          className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>
      
      {/* Validation Status and Warnings - Show as tooltip or separate alert */}
      {showValidation && document.validation_status && document.validation_status !== 'pending' && document.validation_notes && (
        <div className="absolute top-full left-0 right-0 mt-2 z-10">
          {document.validation_status === 'warning' && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Warning:</strong> {document.validation_notes}
              </AlertDescription>
            </Alert>
          )}
          {document.validation_status === 'failed' && (
            <Alert className="bg-red-50 border-red-200">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Validation Failed:</strong> {document.validation_notes}
              </AlertDescription>
            </Alert>
          )}
          {document.validation_status === 'valid' && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Validated:</strong> {document.validation_notes}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  )
}
