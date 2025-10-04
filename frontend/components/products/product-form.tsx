import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import * as z from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Category, Supplier } from '@/lib/types'

const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category_id: z.string().min(1, 'Category is required'),
  supplier_id: z.string().min(1, 'Supplier is required'),
  unit_price: z.number().min(0, 'Unit price must be greater than or equal to 0'),
  min_stock_level: z.number().min(0, 'Minimum stock level must be greater than or equal to 0'),
})

type ProductForm = z.infer<typeof productSchema>

interface ProductFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ProductForm) => void
  onCancel: () => void
  categories: Category[]
  suppliers: Supplier[]
  title: string
  description: string
  submitText: string
  defaultValues?: Partial<ProductForm>
}

export function ProductForm({
  isOpen,
  onOpenChange,
  onSubmit,
  onCancel,
  categories,
  suppliers,
  title,
  description,
  submitText,
  defaultValues
}: ProductFormProps) {
  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      category_id: '',
      supplier_id: '',
      unit_price: 0,
      min_stock_level: 0,
      ...defaultValues
    },
  })

  // Reset form when defaultValues change (for edit mode)
  useEffect(() => {
    if (defaultValues) {
      // Use setTimeout to ensure the form resets after the component is fully mounted
      setTimeout(() => {
        form.reset({
          sku: defaultValues.sku || '',
          name: defaultValues.name || '',
          description: defaultValues.description || '',
          category_id: defaultValues.category_id || '',
          supplier_id: defaultValues.supplier_id || '',
          unit_price: defaultValues.unit_price || 0,
          min_stock_level: defaultValues.min_stock_level || 0,
        })
      }, 0)
    }
  }, [defaultValues, form])

  const handleSubmit = (data: ProductForm) => {
    onSubmit(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU *</FormLabel>
                    <FormControl>
                      <Input placeholder="Product SKU" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Product description" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supplier_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="unit_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Price (₱) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="min_stock_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Stock Level *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
