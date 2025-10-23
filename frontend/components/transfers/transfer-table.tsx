'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface TransferItem {
  product_id: string
  product_name: string
  product_sku: string
  quantity: number
}

interface Transfer {
  id: string
  reference_id: string
  total_quantity: number
  processed_by: string
  processed_date: string
  created_at: string
  status: string
  from_warehouse_name: string
  to_warehouse_name: string
  reason: string
  items: TransferItem[]
}

interface TransferTableProps {
  transfers: Transfer[]
  isLoading: boolean
  searchTerm: string
  onSearchChange: (term: string) => void
  onTransferClick: (transfer: Transfer) => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  itemsPerPage: number
  totalItems: number
}

export function TransferTable({
  transfers,
  isLoading,
  searchTerm,
  onSearchChange,
  onTransferClick,
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems
}: TransferTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTransfers = transfers.slice(startIndex, endIndex)

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading transfers...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by reference number, processed by, or product..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Transfers Table */}
      {currentTransfers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {searchTerm 
              ? 'No transfers found matching your search' 
              : 'No transfers available'
            }
          </p>
          <p className="text-sm text-gray-400 mt-2">
            {searchTerm
              ? 'Try adjusting your search terms' 
              : 'Transfers will appear here once created'
            }
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Total Quantity</TableHead>
                <TableHead>Processed By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTransfers.map((transfer) => (
                <TableRow 
                  key={transfer.reference_id}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => onTransferClick(transfer)}
                >
                  <TableCell className="font-mono font-medium text-blue-600 hover:text-blue-800">
                    {transfer.reference_id}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      transfer.status === 'cancelled' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {transfer.status === 'cancelled' ? 'Cancelled' : 'Transfer'}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {transfer.total_quantity}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {transfer.processed_by}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(transfer.processed_date)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {transfer.items.length} item{transfer.items.length !== 1 ? 's' : ''}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  className={currentPage === page ? "bg-[#52a852] hover:bg-[#4a964a] text-white" : ""}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
