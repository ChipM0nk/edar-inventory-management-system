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
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                {...form.register('sku')}
                placeholder="Product SKU"
              />
              {form.formState.errors.sku && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.sku.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="Product name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Product description"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category_id">Category *</Label>
              <Select 
                value={form.watch('category_id')} 
                onValueChange={(value) => form.setValue('category_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.category_id && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.category_id.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="supplier_id">Supplier *</Label>
              <Select 
                value={form.watch('supplier_id')} 
                onValueChange={(value) => form.setValue('supplier_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.supplier_id && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.supplier_id.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="unit_price">Unit Price (₱) *</Label>
            <Input
              id="unit_price"
              type="number"
              step="0.01"
              min="0"
              {...form.register('unit_price', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {form.formState.errors.unit_price && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.unit_price.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="min_stock_level">Minimum Stock Level *</Label>
            <Input
              id="min_stock_level"
              type="number"
              min="0"
              {...form.register('min_stock_level', { valueAsNumber: true })}
              placeholder="0"
            />
            {form.formState.errors.min_stock_level && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.min_stock_level.message}
              </p>
            )}
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
