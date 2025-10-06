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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {Icon}
            {options.title}
          </DialogTitle>
          {options.description && (
            <DialogDescription>{options.description}</DialogDescription>
          )}
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleClose(false)}>
            {options.cancelText}
          </Button>
          <Button className={confirmButtonClass} onClick={() => handleClose(true)}>
            {options.confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  return [element, confirm]
}

export default useConfirm


