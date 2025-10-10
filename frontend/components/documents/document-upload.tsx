'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, X, FileText } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'

interface DocumentUploadProps {
  uploadedFiles: File[]
  onFilesChange: (files: File[]) => void
  onUpload: () => void
  isUploading: boolean
  showUploadSection: boolean
  onToggleUpload: (show: boolean) => void
  accept?: string
  maxFiles?: number
  maxFileSize?: number // in bytes
  className?: string
}

export function DocumentUpload({
  uploadedFiles,
  onFilesChange,
  onUpload,
  isUploading,
  showUploadSection,
  onToggleUpload,
  accept = ".pdf,.png,.jpg,.jpeg",
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  className = ""
}: DocumentUploadProps) {
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setError(null)
    
    // Validate file count
    if (uploadedFiles.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`)
      return
    }
    
    // Validate file sizes
    const oversizedFiles = files.filter(file => file.size > maxFileSize)
    if (oversizedFiles.length > 0) {
      setError(`File size must be less than ${formatFileSize(maxFileSize)}`)
      return
    }
    
    onFilesChange([...uploadedFiles, ...files])
    // Reset input
    event.target.value = ''
  }

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    onFilesChange(newFiles)
    setError(null)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Button */}
      <div className="flex items-center gap-2">
        <Button
          onClick={() => onToggleUpload(!showUploadSection)}
          variant="outline"
          size="sm"
        >
          <Upload className="w-4 h-4 mr-2" />
          Add Documents
        </Button>
        {uploadedFiles.length > 0 && (
          <span className="text-sm text-gray-600">
            {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} selected
          </span>
        )}
      </div>
      
      {/* Upload Section */}
      {showUploadSection && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select documents to upload
              </label>
              <input
                type="file"
                multiple
                accept={accept}
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Max {maxFiles} files, {formatFileSize(maxFileSize)} per file
              </p>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}
            
            {/* Selected Files */}
            {uploadedFiles.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Selected files:</p>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-sm text-gray-600 bg-white p-2 rounded border">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>{file.name} ({formatFileSize(file.size)})</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Upload Actions */}
            <div className="flex gap-2">
              <Button
                onClick={onUpload}
                disabled={uploadedFiles.length === 0 || isUploading}
                size="sm"
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onToggleUpload(false)
                  onFilesChange([])
                  setError(null)
                }}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
