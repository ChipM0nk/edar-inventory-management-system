import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import { Warehouse } from '@/lib/types'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/utils'

interface WarehouseTableProps {
  warehouses: Warehouse[]
  onEdit: (warehouse: Warehouse) => void
  onDelete: (warehouse: Warehouse) => void
}

export function WarehouseTable({ 
  warehouses, 
  onEdit, 
  onDelete 
}: WarehouseTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {warehouses.map((warehouse) => (
          <TableRow key={warehouse.id}>
            <TableCell className="font-medium">{warehouse.name}</TableCell>
            <TableCell>{warehouse.location}</TableCell>
            <TableCell>{warehouse.address || '-'}</TableCell>
            <TableCell>
              <div>
                {warehouse.contact_person && (
                  <div className="font-medium">{warehouse.contact_person}</div>
                )}
                {warehouse.contact_phone && (
                  <div className="text-sm text-gray-500">{warehouse.contact_phone}</div>
                )}
                {!warehouse.contact_person && !warehouse.contact_phone && '-'}
              </div>
            </TableCell>
            <TableCell>
              <StatusBadge status={warehouse.is_active ? 'active' : 'inactive'} />
            </TableCell>
            <TableCell>
              {formatDate(warehouse.created_at)}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(warehouse)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(warehouse)}
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
