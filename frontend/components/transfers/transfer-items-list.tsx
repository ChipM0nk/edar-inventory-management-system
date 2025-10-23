'use client'

import { useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface TransferItem {
  product_id: string
  product_name: string
  product_sku: string
  quantity: number
}

interface Warehouse {
  id: string
  name: string
  location: string
}

interface TransferItemsListProps {
  transferItems: TransferItem[]
  fromWarehouse: Warehouse | null
  toWarehouse: Warehouse | null
  onRemoveItem: (index: number) => void
}

export function TransferItemsList({
  transferItems,
  fromWarehouse,
  toWarehouse,
  onRemoveItem
}: TransferItemsListProps) {
  const transferItemsRef = useRef<HTMLDivElement>(null)

  if (transferItems.length === 0) {
    return null
  }

  return (
    <Card ref={transferItemsRef}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Products in Transfer ({transferItems.length})</CardTitle>
        <CardDescription className="text-sm">
          From: <span className="font-semibold">{fromWarehouse?.name}</span> → To: <span className="font-semibold">{toWarehouse?.name}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="h-8">
                <TableHead className="py-2 text-xs font-medium">Product</TableHead>
                <TableHead className="py-2 text-xs font-medium">SKU</TableHead>
                <TableHead className="py-2 text-xs font-medium">Quantity</TableHead>
                <TableHead className="py-2 text-xs font-medium">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transferItems.map((item, index) => (
                <TableRow key={`${item.product_id}-${index}`} className="h-8">
                  <TableCell className="py-1 font-medium text-sm">
                    {item.product_name}
                  </TableCell>
                  <TableCell className="py-1 font-mono text-xs text-gray-600">
                    {item.product_sku}
                  </TableCell>
                  <TableCell className="py-1 font-medium text-sm text-blue-600">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="py-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(index)}
                      className="text-red-600 hover:text-red-800 h-6 px-2 text-xs"
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
