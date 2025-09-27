# Stock Data Purge Scripts

## Overview
These scripts will completely purge all inventory-related data from the database.

## Files Created

### 1. `purge_stock_movements.sql`
**What it deletes:**
- ✅ Stock movements (all inventory transactions)
- ✅ Purchase orders (created from stock movements)
- ✅ Sales orders (if any exist)
- ✅ Stock levels (current inventory quantities)

**What it preserves:**
- ✅ Products (product catalog)
- ✅ Warehouses (warehouse locations)
- ✅ Categories (product categories)
- ✅ Suppliers (supplier information)
- ✅ Users (user accounts)

### 2. `purge_data.sh`
Interactive shell script that:
- Asks for confirmation before deleting
- Checks database connectivity
- Runs the SQL purge script
- Shows remaining counts after purge

### 3. `purge_all_inventory.sql`
Alternative comprehensive purge script (same as above but with different organization)

## Usage

### Option 1: Interactive Script (Recommended)
```bash
./purge_data.sh
```

### Option 2: Direct SQL
```bash
psql -h localhost -U inventory_user -d inventory_db -f purge_stock_movements.sql
```

### Option 3: Manual SQL Commands
```sql
DELETE FROM stock_movements;
DELETE FROM purchase_orders;
DELETE FROM sales_orders;
DELETE FROM stock_levels;
```

## After Purging

After running the purge script:
- **Stock Levels page** will be empty (no current inventory)
- **Stock History page** will be empty (no movement history)
- **Stock-In Orders page** will be empty (no purchase orders)
- **Products, Warehouses, Suppliers** will remain intact

## Restarting with Clean Data

After purging, you can:
1. Create new stock movements through the UI
2. Stock levels will be automatically created as you add inventory
3. Purchase orders will be automatically created when you do stock-in operations

## ⚠️ WARNING

This operation is **IRREVERSIBLE**. All inventory data will be permanently deleted.
Make sure you have backups if needed.
