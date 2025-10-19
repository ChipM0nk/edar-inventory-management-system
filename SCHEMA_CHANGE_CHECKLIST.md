# Adjustment Schema Change - Checklist

## ✅ Completed Changes

### Database Layer
- [x] Created migration 000026 to add `warehouse_id` to adjustments table
- [x] Created migration to remove `warehouse_id` from adjustment_items table
- [x] Added proper indexes for performance
- [x] Included data migration to preserve existing warehouse associations
- [x] Created rollback migration (down.sql)

### Backend - Models
- [x] Updated `Adjustment` struct to include `warehouse_id` and `warehouse_name`
- [x] Updated `AdjustmentItem` struct to remove `warehouse_id` and `warehouse_name`
- [x] Updated `CreateAdjustmentRequest` to require `warehouse_id`
- [x] Updated `CreateAdjustmentItemRequest` to remove `warehouse_id`

### Backend - SQL Queries
- [x] Updated `CreateAdjustment` query
- [x] Updated `GetAdjustment` query (added warehouse join)
- [x] Updated `ListAdjustments` query (added warehouse join)
- [x] Updated `ListAdjustmentsWithFilter` query (added warehouse join)
- [x] Updated `UpdateAdjustment` query
- [x] Updated `GetAdjustmentByReferenceNumber` query (added warehouse join)
- [x] Updated `CreateAdjustmentItem` query
- [x] Updated `GetAdjustmentItems` query (removed warehouse join)
- [x] Updated `UpdateAdjustmentItem` query
- [x] Regenerated SQLC code (all generated structs are correct)

### Backend - Service Layer
- [x] Updated `CreateAdjustment` to use warehouse from adjustment
- [x] Updated stock movement creation to use adjustment's warehouse
- [x] Updated `GetAdjustment` item mapping (removed warehouse fields)
- [x] Updated `CancelAdjustment` to use adjustment's warehouse for reversals
- [x] Updated all conversion functions (`convertToAdjustmentModel`, `convertToAdjustmentModelFromAdjustment`, `convertToAdjustmentModelFromListRow`)

### Frontend - Main Page
- [x] Updated `AdjustmentItem` interface (removed warehouse fields)
- [x] Updated `Adjustment` interface (added warehouse fields)
- [x] Updated `handleAddItem` to not include warehouse in items
- [x] Updated `handleCreateAdjustment` to include warehouse_id in payload
- [x] Added warehouse validation before creating adjustment
- [x] Removed warehouse_id from items payload mapping

### Frontend - Components
- [x] Updated `adjustment-details-dialog.tsx` interfaces
- [x] Updated details dialog to show warehouse at adjustment level
- [x] Removed warehouse column from items table in details dialog
- [x] Updated data mapping in details dialog
- [x] Updated `adjustment-review-dialog.tsx` interface
- [x] Review dialog already displays warehouse at adjustment level

### Documentation
- [x] Created comprehensive change summary (ADJUSTMENT_SCHEMA_CHANGES.md)
- [x] Created checklist (this file)
- [x] Documented API changes
- [x] Documented migration instructions

## 🧪 Testing Checklist

### Before Deployment
- [ ] Run migrations on a test database copy
- [ ] Verify migration preserves existing data correctly
- [ ] Test migration rollback works correctly

### Backend Testing
- [ ] Create a new adjustment via API
- [ ] Verify warehouse_id is required in request
- [ ] Verify items no longer have warehouse_id
- [ ] Retrieve an adjustment and verify warehouse is included
- [ ] List adjustments and verify warehouse names appear
- [ ] Test adjustment cancellation
- [ ] Verify stock movements use correct warehouse

### Frontend Testing
- [ ] Create a new adjustment
- [ ] Verify warehouse must be selected before adding items
- [ ] Verify items table doesn't show warehouse column during creation
- [ ] View existing adjustments
- [ ] Verify warehouse appears in adjustment overview
- [ ] Verify items table doesn't show warehouse column in details
- [ ] Test adjustment filtering and search
- [ ] Test document upload with adjustments

### Integration Testing
- [ ] Test full flow: create → view → cancel
- [ ] Verify stock levels update correctly
- [ ] Verify stock movements have correct warehouse_id
- [ ] Test with multiple warehouses to ensure data integrity

## 📝 Deployment Notes

1. **Backup Database**: Always backup production database before running migrations
2. **Run Migration**: Execute `000026_move_warehouse_to_adjustments.up.sql`
3. **Verify Migration**: Check that data was migrated correctly
4. **Deploy Backend**: Deploy updated backend code
5. **Deploy Frontend**: Deploy updated frontend code
6. **Monitor**: Watch for any errors in logs

## 🚨 Rollback Plan

If issues arise:
1. Deploy previous frontend version
2. Deploy previous backend version
3. Run down migration: `000026_move_warehouse_to_adjustments.down.sql`
4. Verify data is restored

## 📊 Expected Impact

### Performance
- **Improved**: Smaller payload sizes for adjustments
- **Improved**: Reduced data redundancy
- **Improved**: Better query performance with proper indexing

### User Experience
- **Improved**: Simpler UI - select warehouse once
- **Improved**: Clearer intent - adjustments are warehouse-specific
- **No Breaking Change**: Existing data is preserved

### Data Integrity
- **Improved**: Enforces single warehouse per adjustment
- **Maintained**: All existing adjustments retain their warehouse associations

