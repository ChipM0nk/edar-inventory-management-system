import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import * as z from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Supplier } from '@/lib/types'

const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contact_person: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
})

type SupplierForm = z.infer<typeof supplierSchema>

interface SupplierFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: SupplierForm) => void
  onCancel: () => void
  title: string
  description: string
  submitText: string
  isSubmitting?: boolean
  defaultValues?: Partial<SupplierForm & { is_active?: boolean }>
  showActiveToggle?: boolean
}

export function SupplierForm({
  isOpen,
  onOpenChange,
  onSubmit,
  onCancel,
  title,
  description,
  submitText,
  isSubmitting = false,
  defaultValues,
  showActiveToggle = false
}: SupplierFormProps) {
  const form = useForm<SupplierForm & { is_active?: boolean }>({
    resolver: zodResolver(supplierSchema.extend({ 
      is_active: z.boolean().optional() 
    })),
    defaultValues: {
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      is_active: true,
      ...defaultValues
    },
  })

  // Reset form when defaultValues change (for edit mode)
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        name: defaultValues.name || '',
        contact_person: defaultValues.contact_person || '',
        email: defaultValues.email || '',
        phone: defaultValues.phone || '',
        address: defaultValues.address || '',
        city: defaultValues.city || '',
        state: defaultValues.state || '',
        country: defaultValues.country || '',
        postal_code: defaultValues.postal_code || '',
        is_active: defaultValues.is_active ?? true,
      })
    }
  }, [defaultValues, form])

  const handleSubmit = (data: SupplierForm & { is_active?: boolean }) => {
    onSubmit(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
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
                placeholder="Supplier name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                {...form.register('contact_person')}
                placeholder="Contact person name"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="supplier@example.com"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...form.register('phone')}
                placeholder="Phone number"
              />
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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                {...form.register('city')}
                placeholder="City"
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                {...form.register('state')}
                placeholder="State"
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                {...form.register('country')}
                placeholder="Country"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="postal_code">Postal Code</Label>
            <Input
              id="postal_code"
              {...form.register('postal_code')}
              placeholder="Postal code"
            />
          </div>
          {showActiveToggle && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                {...form.register('is_active')}
                className="rounded"
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : submitText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
