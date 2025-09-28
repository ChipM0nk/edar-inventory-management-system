import { Button } from '@/components/ui/button'

interface SupplierPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  searchTerm: string
  onPageChange: (page: number) => void
}

export function SupplierPagination({ 
  currentPage, 
  totalPages, 
  totalItems, 
  pageSize, 
  searchTerm,
  onPageChange 
}: SupplierPaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t">
      <div className="text-sm text-gray-500">
        {searchTerm ? (
          <>Showing {startItem} to {endItem} of {totalItems} results for "{searchTerm}"</>
        ) : (
          <>Showing {startItem} to {endItem} of {totalItems} suppliers</>
        )}
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
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + 1
            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            )
          })}
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
  )
}
