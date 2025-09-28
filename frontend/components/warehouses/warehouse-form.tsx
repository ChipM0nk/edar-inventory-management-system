import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import * as z from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Warehouse } from '@/lib/types'

const warehouseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().min(1, 'Location is required'),
  address: z.string().optional(),
  contact_person: z.string().optional(),
  contact_phone: z.string().optional(),
})

type WarehouseForm = z.infer<typeof warehouseSchema>

interface WarehouseFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: WarehouseForm) => void
  onCancel: () => void
  title: string
  description: string
  submitText: string
  defaultValues?: Partial<WarehouseForm>
}

export function WarehouseForm({
  isOpen,
  onOpenChange,
  onSubmit,
  onCancel,
  title,
  description,
  submitText,
  defaultValues
}: WarehouseFormProps) {
  const form = useForm<WarehouseForm>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: '',
      location: '',
      address: '',
      contact_person: '',
      contact_phone: '',
      ...defaultValues
    },
  })

  // Reset form when defaultValues change (for edit mode)
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        name: defaultValues.name || '',
        location: defaultValues.location || '',
        address: defaultValues.address || '',
        contact_person: defaultValues.contact_person || '',
        contact_phone: defaultValues.contact_phone || '',
      })
    }
  }, [defaultValues, form])

  const handleSubmit = (data: WarehouseForm) => {
    onSubmit(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="Warehouse name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                {...form.register('location')}
                placeholder="City, State"
              />
              {form.formState.errors.location && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.location.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              {...form.register('address')}
              placeholder="Full address"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                {...form.register('contact_person')}
                placeholder="Contact person name"
              />
            </div>
            <div>
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                {...form.register('contact_phone')}
                placeholder="Phone number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button type="submit">
              {submitText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
