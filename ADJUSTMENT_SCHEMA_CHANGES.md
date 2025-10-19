# Adjustment Schema Changes Summary

## Overview
The warehouse field has been moved from the adjustment items to the adjustment record itself. This change makes sense because all items in a single adjustment should belong to the same warehouse.

## Changes Made

### 1. Database Migration
**Files Created:**
- `backend/migrations/000026_move_warehouse_to_adjustments.up.sql`
- `backend/migrations/000026_move_warehouse_to_adjustments.down.sql`

**Changes:**
- Added `warehouse_id` column to the `adjustments` table with a foreign key reference to `warehouses(id)`
- Removed `warehouse_id` column from the `adjustment_items` table
- Added index on `adjustments.warehouse_id` for better query performance
- Migration includes data migration to preserve existing warehouse associations

### 2. Backend Models
**File:** `backend/internal/models/adjustment.go`

**Changes to `Adjustment` struct:**
- Added `WarehouseID uuid.UUID` field
- Added `WarehouseName *string` field (joined field for display)

**Changes to `AdjustmentItem` struct:**
- Removed `WarehouseID uuid.UUID` field
- Removed `WarehouseName *string` field

**Changes to `CreateAdjustmentRequest` struct:**
- Added `WarehouseID uuid.UUID` field (required)

**Changes to `CreateAdjustmentItemRequest` struct:**
- Removed `WarehouseID uuid.UUID` field

### 3. SQL Queries
**File:** `backend/internal/database/queries/adjustments.sql`

**Updated Queries:**
- `CreateAdjustment`: Added `warehouse_id` parameter
- `GetAdjustment`: Added warehouse join to fetch warehouse name
- `ListAdjustments`: Added warehouse join to fetch warehouse name
- `ListAdjustmentsWithFilter`: Added warehouse join to fetch warehouse name
- `UpdateAdjustment`: Added `warehouse_id` parameter
- `GetAdjustmentByReferenceNumber`: Added warehouse join to fetch warehouse name
- `CreateAdjustmentItem`: Removed `warehouse_id` parameter
- `GetAdjustmentItems`: Removed warehouse join (no longer needed)
- `UpdateAdjustmentItem`: Removed `warehouse_id` parameter

### 4. Service Layer
**File:** `backend/internal/services/adjustment_service.go`

**Changes:**
- Updated `CreateAdjustment` to use `req.WarehouseID` for the adjustment and stock movements
- Updated `GetAdjustment` to remove warehouse info from item mapping
- Updated `CancelAdjustment` to get warehouse from adjustment record
- Updated all conversion functions to include warehouse at adjustment level

### 5. Frontend - Main Page
**File:** `frontend/app/inventory/adjustments/page.tsx`

**Interface Changes:**
- `AdjustmentItem`: Removed `warehouse_id` and `warehouse_name` fields
- `Adjustment`: Added `warehouse_id` and `warehouse_name` fields

**Functional Changes:**
- Warehouse is now selected once for the entire adjustment
- All items are added to the same warehouse
- Validation ensures warehouse is selected before creating adjustment
- Payload now includes `warehouse_id` at adjustment level, not on items

### 6. Frontend - Details Dialog
**File:** `frontend/components/adjustments/adjustment-details-dialog.tsx`

**Changes:**
- Updated interfaces to move warehouse to adjustment level
- Display warehouse information in the adjustment overview section
- Removed warehouse column from items table
- Updated data mapping to get warehouse from adjustment, not items

### 7. Frontend - Review Dialog
**File:** `frontend/components/adjustments/adjustment-review-dialog.tsx`

**Changes:**
- Updated `AdjustmentItem` interface to remove warehouse fields
- Warehouse is now passed as a separate prop and displayed at adjustment level

## Migration Instructions

### Running the Migration
To apply these changes to your database:

```bash
cd backend
# Run migrations
make migrate-up
# Or if using another migration tool, run migration 000026
```

### Rolling Back
If you need to rollback:

```bash
cd backend
make migrate-down
# This will restore warehouse_id to adjustment_items
```

## API Changes

### Creating an Adjustment
**Before:**
```json
{
  "reference_number": "ADJ-2024-001",
  "adjustment_date": "2024-01-01",
  "items": [
    {
      "product_id": "...",
      "warehouse_id": "...",  // <-- Was here
      "quantity": 10,
      "cost_price": 100.00
    }
  ]
}
```

**After:**
```json
{
  "reference_number": "ADJ-2024-001",
  "adjustment_date": "2024-01-01",
  "warehouse_id": "...",  // <-- Now here
  "items": [
    {
      "product_id": "...",
      "quantity": 10,
      "cost_price": 100.00
    }
  ]
}
```

### Adjustment Response
**Before:**
```json
{
  "id": "...",
  "reference_number": "ADJ-2024-001",
  "items": [
    {
      "product_id": "...",
      "warehouse_id": "...",
      "warehouse_name": "Main Warehouse"
    }
  ]
}
```

**After:**
```json
{
  "id": "...",
  "reference_number": "ADJ-2024-001",
  "warehouse_id": "...",
  "warehouse_name": "Main Warehouse",
  "items": [
    {
      "product_id": "...",
      // No warehouse fields here
    }
  ]
}
```

## Benefits

1. **Data Integrity**: Ensures all items in an adjustment belong to the same warehouse
2. **Simplified UI**: Users select warehouse once for the entire adjustment
3. **Better Performance**: Reduced data redundancy and smaller payload sizes
4. **Clearer Business Logic**: Makes it explicit that adjustments are warehouse-specific

## Testing Recommendations

1. Create new adjustments and verify they save correctly
2. View existing adjustments and verify warehouse information displays correctly
3. Test adjustment cancellation to ensure stock movements are reversed correctly
4. Verify that filters and searches work with the new schema
5. Test the migration on a copy of production data before deploying

## Notes

- Existing adjustments will be automatically migrated during the up migration
- The migration populates the adjustment's warehouse_id from the first item's warehouse_id
- All frontend validation ensures that users must select a warehouse before adding items
- Stock movements continue to work as before, using the adjustment's warehouse

