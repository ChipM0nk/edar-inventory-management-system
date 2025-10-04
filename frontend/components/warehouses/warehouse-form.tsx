import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import * as z from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Warehouse name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location *</FormLabel>
                    <FormControl>
                      <Input placeholder="City, State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Full address" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contact_person"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input placeholder="Contact person name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
        </Form>
      </DialogContent>
    </Dialog>
  )
}
