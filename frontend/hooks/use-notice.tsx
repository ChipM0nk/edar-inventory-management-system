'use client'

import { useCallback, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Info, CheckCircle2, AlertTriangle } from 'lucide-react'

type NoticeVariant = 'info' | 'success' | 'warning'

type NoticeOptions = {
  title?: string
  description?: string
  okText?: string
  variant?: NoticeVariant
}

type NoticeFn = (options?: NoticeOptions) => Promise<void>

export function useNotice(): [JSX.Element, NoticeFn] {
  const [open, setOpen] = useState(false)
  const [resolver, setResolver] = useState<(() => void) | null>(null)
  const [options, setOptions] = useState<Required<NoticeOptions>>({
    title: 'Notice',
    description: '',
    okText: 'OK',
    variant: 'info',
  })

  const notice = useCallback<NoticeFn>((opts) => {
    return new Promise<void>((resolve) => {
      setOptions((prev) => ({ ...prev, ...(opts || {}) }))
      setResolver(() => resolve)
      setOpen(true)
    })
  }, [])

  const handleClose = useCallback(() => {
    if (resolver) resolver()
    setOpen(false)
    setResolver(null)
  }, [resolver])

  const Icon = useMemo(() => {
    switch (options.variant) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }, [options.variant])

  const okButtonClass = useMemo(() => {
    switch (options.variant) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white'
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white'
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  }, [options.variant])

  const element = (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {Icon}
            {options.title}
          </DialogTitle>
          {options.description && (
            <DialogDescription className="space-y-3">
              {options.description.split('\n').map((line, index) => {
                // Make reference number more prominent
                if (line.includes('Reference Number:')) {
                  const parts = line.split(': ')
                  return (
                    <div key={index} className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">{parts[0]}:</div>
                      <div className="text-xl font-bold text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded border">
                        {parts[1]}
                      </div>
                    </div>
                  )
                }
                return (
                  <div key={index} className="text-sm text-gray-600 mt-2">
                    {line}
                  </div>
                )
              })}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="flex justify-end">
          <Button className={okButtonClass} onClick={handleClose}>
            {options.okText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  return [element, notice]
}

export default useNotice


