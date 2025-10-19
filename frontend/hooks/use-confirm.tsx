'use client'

import { useCallback, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react'

type ConfirmVariant = 'info' | 'warning' | 'danger'

type ConfirmOptions = {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
}

type ConfirmFn = (options?: ConfirmOptions) => Promise<boolean>

export function useConfirm(): [JSX.Element, ConfirmFn] {
  const [open, setOpen] = useState(false)
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null)
  const [options, setOptions] = useState<Required<ConfirmOptions>>({
    title: 'Are you sure?',
    description: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    variant: 'warning',
  })

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>((resolve) => {
      console.log('Confirm dialog options:', opts)
      setOptions((prev) => ({ ...prev, ...(opts || {}) }))
      setResolver(() => resolve)
      setOpen(true)
    })
  }, [])

  const handleClose = useCallback((result: boolean) => {
    if (resolver) resolver(result)
    setOpen(false)
    setResolver(null)
  }, [resolver])

  const Icon = useMemo(() => {
    switch (options.variant) {
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
      case 'danger':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
    }
  }, [options.variant])

  const confirmButtonClass = useMemo(() => {
    switch (options.variant) {
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 text-white'
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white'
      default:
        return 'bg-amber-600 hover:bg-amber-700 text-white'
    }
  }, [options.variant])

  const element = (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose(false)}>
      <DialogContent className="max-w-md min-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {Icon}
            {options.title}
          </DialogTitle>
          {options.description && (
            <DialogDescription>{options.description}</DialogDescription>
          )}
        </DialogHeader>
        <div className="flex gap-3">
          <button 
            onClick={() => handleClose(false)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
            style={{ minWidth: '120px' }}
          >
            {options.cancelText}
          </button>
          <button 
            onClick={() => handleClose(true)}
            className="flex-1 px-4 py-2 rounded-md text-white"
            style={{ 
              minWidth: '120px',
              backgroundColor: options.variant === 'danger' ? '#dc2626' : options.variant === 'info' ? '#2563eb' : '#d97706'
            }}
          >
            {options.confirmText}
          </button>
        </div>
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-100 rounded">
            Debug: cancelText="{options.cancelText}", confirmText="{options.confirmText}"<br/>
            Buttons rendered: 2 (Cancel + Confirm)
          </div>
        )}
      </DialogContent>
    </Dialog>
  )

  return [element, confirm]
}

export default useConfirm


