import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Filter } from 'lucide-react'

interface SupplierFiltersProps {
  searchInput: string
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  showInactive: boolean
  onToggleInactive: () => void
  isFetching: boolean
  onClearSearch: () => void
  searchInputRef: React.RefObject<HTMLInputElement>
  onFocusSearch: () => void
}

export function SupplierFilters({
  searchInput,
  onSearchChange,
  showInactive,
  onToggleInactive,
  isFetching,
  onClearSearch,
  searchInputRef,
  onFocusSearch
}: SupplierFiltersProps) {
  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-1">
        <div 
          className="relative cursor-text"
          onClick={onFocusSearch}
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            ref={searchInputRef}
            placeholder="Search suppliers..."
            value={searchInput}
            onChange={onSearchChange}
            className="pl-10 pr-10"
            disabled={isFetching}
          />
          {isFetching && searchInput ? (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            </div>
          ) : searchInput ? (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>
      <Button
        variant="outline"
        onClick={onToggleInactive}
        className="flex items-center"
      >
        <Filter className="h-4 w-4 mr-2" />
        {showInactive ? 'Hide Inactive' : 'Show Inactive'}
      </Button>
    </div>
  )
}
