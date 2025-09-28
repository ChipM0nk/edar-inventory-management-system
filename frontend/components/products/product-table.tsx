import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Product, SortField, SortOrder } from '@/lib/types'
import { StatusBadge } from '@/components/shared/status-badge'

interface ProductTableProps {
  products: Product[]
  sortField: SortField
  sortOrder: SortOrder
  onSort: (field: SortField) => void
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export function ProductTable({ 
  products, 
  sortField, 
  sortOrder, 
  onSort, 
  onEdit, 
  onDelete 
}: ProductTableProps) {
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>SKU</TableHead>
          <TableHead>
            <Button
              variant="ghost"
              onClick={() => onSort('name')}
              className="flex items-center gap-2 p-0 h-auto font-semibold"
            >
              Name {getSortIcon('name')}
            </Button>
          </TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>
            <Button
              variant="ghost"
              onClick={() => onSort('unit_price')}
              className="flex items-center gap-2 p-0 h-auto font-semibold"
            >
              Unit Price {getSortIcon('unit_price')}
            </Button>
          </TableHead>
          <TableHead>Min Stock</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-mono text-sm">{product.sku}</TableCell>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell className="max-w-[200px] truncate">
              {product.description || '-'}
            </TableCell>
            <TableCell>{product.category || '-'}</TableCell>
            <TableCell>{product.supplier || '-'}</TableCell>
            <TableCell className="font-mono">
              ₱{product.unit_price.toFixed(2)}
            </TableCell>
            <TableCell className="font-mono text-center">
              {product.min_stock_level || 0}
            </TableCell>
            <TableCell>
              <StatusBadge status={product.is_active ? 'active' : 'inactive'} />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(product)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(product)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
