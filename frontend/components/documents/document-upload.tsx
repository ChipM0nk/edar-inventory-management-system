'use client'

import { useState, useRef, useEffect } from 'react'
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
  const chooseFilesRef = useRef<HTMLLabelElement>(null)

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

  // Focus on "Choose files" button when upload section becomes visible
  useEffect(() => {
    if (showUploadSection && chooseFilesRef.current) {
      // Small delay to ensure the element is rendered
      setTimeout(() => {
        chooseFilesRef.current?.focus()
      }, 100)
    }
  }, [showUploadSection])

  return (
    <div className={`space-y-1 pt-1 pb-1 ${className}`}>
      {/* Upload Section - All in one row when expanded */}
      {showUploadSection ? (
        <div className="p-2">
          {/* Error Message */}
          {error && (
            <div className="text-xs text-red-600 bg-red-50 p-1 rounded mb-1">
              {error}
            </div>
          )}
          
          {/* Main row: Choose files with max info, selected files with action buttons */}
          <div className="flex items-center gap-2">
            {/* Max Info and Choose Files */}
            <div className="flex items-center gap-2">
              {/* Max info - Two lines to the left of Choose Files */}
              <div className="text-xs text-gray-500 leading-tight" style={{ fontSize: '0.65rem' }}>
                <div>Max {maxFiles} files</div>
                <div>Max {formatFileSize(maxFileSize)}</div>
              </div>
              
              <input
                type="file"
                multiple
                accept={accept}
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label
                ref={chooseFilesRef}
                htmlFor="file-input"
                className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded cursor-pointer hover:bg-blue-100 border border-blue-200"
                tabIndex={0}
              >
                Choose files
              </label>
            </div>
            
            {/* Selected Files and Action Buttons */}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Selected Files Display */}
                {uploadedFiles.length === 0 ? (
                  <span className="text-xs text-gray-600">No file chosen</span>
                ) : (
                  uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-1 text-xs text-gray-600 bg-white px-2 py-1 rounded border">
                      <FileText className="w-3 h-3" />
                      <span className="max-w-32 truncate">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-4 w-4 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))
                )}
                
                {/* Action Buttons beside document names */}
                <div className="flex gap-1">
                  {uploadedFiles.length > 0 && (
                    <Button
                      onClick={onUpload}
                      disabled={isUploading}
                      size="sm"
                      className="h-7 px-3 text-xs"
                    >
                      {isUploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      onToggleUpload(false)
                      onFilesChange([])
                      setError(null)
                    }}
                    size="sm"
                    className="h-7 px-3 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Add Documents Button when collapsed */
        <Button
          onClick={() => onToggleUpload(!showUploadSection)}
          className="bg-blue-600 hover:bg-blue-700 text-white border-0 px-3 py-1 text-xs font-medium mt-2 mb-2"
          tabIndex={11}
        >
          <Upload className="w-3 h-3 mr-1" />
          Add Documents
        </Button>
      )}
    </div>
  )
}
