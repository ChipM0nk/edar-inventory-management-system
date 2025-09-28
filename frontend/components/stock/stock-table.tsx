import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StockLevel } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface StockTableProps {
  stockLevels: StockLevel[]
}

export function StockTable({ stockLevels }: StockTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Reserved</TableHead>
            <TableHead>Available</TableHead>
            <TableHead>Min Level</TableHead>
            <TableHead>Last Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stockLevels.map((stock) => (
            <TableRow key={stock.id}>
              <TableCell className="font-medium">
                {stock.product_name}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {stock.product_sku}
              </TableCell>
              <TableCell>
                {stock.warehouse_name}
              </TableCell>
              <TableCell className="font-medium">
                {stock.quantity}
              </TableCell>
              <TableCell>
                {stock.reserved_quantity}
              </TableCell>
              <TableCell className="font-medium">
                {stock.available_quantity}
              </TableCell>
              <TableCell>
                {stock.min_stock_level}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {formatDate(stock.last_updated)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
