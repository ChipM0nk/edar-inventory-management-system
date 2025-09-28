import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Supplier } from '@/lib/types'

interface SupplierTableProps {
  suppliers: Supplier[]
  sortField: 'name' | 'created_at'
  sortOrder: 'asc' | 'desc'
  onSort: (field: 'name' | 'created_at') => void
  onEdit: (supplier: Supplier) => void
  onDelete: (id: string) => void
  onToggleActive: (supplier: Supplier) => void
}

export function SupplierTable({ 
  suppliers, 
  sortField, 
  sortOrder, 
  onSort, 
  onEdit, 
  onDelete, 
  onToggleActive 
}: SupplierTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <button
              onClick={() => onSort('name')}
              className="flex items-center space-x-1 hover:text-gray-600"
            >
              <span>Name</span>
              {sortField === 'name' && (
                sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </TableHead>
          <TableHead>Contact Person</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {suppliers.map((supplier) => (
          <TableRow key={supplier.id}>
            <TableCell className="font-medium">{supplier.name}</TableCell>
            <TableCell>{supplier.contact_person || '-'}</TableCell>
            <TableCell>{supplier.email || '-'}</TableCell>
            <TableCell>{supplier.phone || '-'}</TableCell>
            <TableCell>
              {supplier.city && supplier.state 
                ? `${supplier.city}, ${supplier.state}` 
                : supplier.city || supplier.state || '-'}
            </TableCell>
            <TableCell>
              <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                {supplier.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(supplier)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleActive(supplier)}
                >
                  {supplier.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(supplier.id)}
                  className="text-red-600 hover:text-red-700"
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
