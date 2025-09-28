import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { Document } from '@/lib/types'

interface DocumentViewerDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  document: Document | null
  documentUrl: string | null
  onDownload: (document: Document) => void
}

export function DocumentViewerDialog({ 
  isOpen, 
  onOpenChange, 
  document, 
  documentUrl, 
  onDownload 
}: DocumentViewerDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{document?.file_name}</DialogTitle>
        </DialogHeader>
        {document && documentUrl && (
          <div className="flex-1 overflow-hidden">
            {document.file_type.startsWith('image/') ? (
              <div className="flex justify-center items-center h-full min-h-[400px]">
                <img
                  src={documentUrl}
                  alt={document.file_name}
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
            ) : document.file_type === 'application/pdf' ? (
              <div className="h-full min-h-[500px]">
                <iframe
                  src={documentUrl}
                  className="w-full h-full border-0"
                  title={document.file_name}
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
                  onClick={() => onDownload(document)}
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
  )
}
