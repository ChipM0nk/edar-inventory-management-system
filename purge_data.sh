#!/bin/bash

# Purge Stock Movements Data Script
# This script will purge all stock movements and related data

echo "⚠️  WARNING: This will permanently delete all stock movements data!"
echo "📊 Tables that will be affected:"
echo "   - stock_movements"
echo "   - purchase_orders"
echo "   - sales_orders (if any)"
echo "   - stock_levels"
echo "   - adjustments"
echo "   - adjustment_items"
echo "   - transfers"
echo "   - transfer_items"
echo ""

read -p "Are you sure you want to continue? (yes/no): " confirm

if [[ $confirm != "yes" ]]; then
    echo "❌ Operation cancelled."
    exit 1
fi

echo ""
echo "🔍 Checking database connection..."

# Check if PostgreSQL is accessible
if command -v psql >/dev/null 2>&1; then
    # Try different connection methods
    if psql -h localhost -U inventory_user -d inventory_db -c '\q' 2>/dev/null; then
        echo "✅ Connected to database using inventory_user"
        DB_CMD="psql -h localhost -U inventory_user -d inventory_db"
    elif psql -U $(whoami) -d inventory_db -c '\q' 2>/dev/null; then
        echo "✅ Connected to database using system user"
        DB_CMD="psql -U $(whoami) -d inventory_db"
    else
        echo "❌ Cannot connect to database. Please ensure PostgreSQL is running."
        echo "💡 Try: brew services start postgresql@15"
        exit 1
    fi
else
    echo "❌ psql command not found. Please install PostgreSQL client tools."
    exit 1
fi

echo ""
echo "🗑️  Purging stock movements data..."

# Run the purge script
if $DB_CMD -f purge_stock_movements.sql; then
echo ""
echo "✅ All stock movements, purchase orders, stock levels, adjustments, and transfers purged successfully!"
    echo "📊 Current table counts:"
    $DB_CMD -c "
        SELECT 'Stock Movements' as table_name, COUNT(*) as count FROM stock_movements
        UNION ALL
        SELECT 'Purchase Orders', COUNT(*) FROM purchase_orders
        UNION ALL
        SELECT 'Sales Orders', COUNT(*) FROM sales_orders
        UNION ALL
        SELECT 'Stock Levels', COUNT(*) FROM stock_levels
        UNION ALL
        SELECT 'Adjustments', COUNT(*) FROM adjustments
        UNION ALL
        SELECT 'Adjustment Items', COUNT(*) FROM adjustment_items
        UNION ALL
        SELECT 'Transfers', COUNT(*) FROM transfers
        UNION ALL
        SELECT 'Transfer Items', COUNT(*) FROM transfer_items;
    "
else
    echo "❌ Failed to purge data. Please check the database connection and permissions."
    exit 1
fi

echo ""
echo "🎉 Purge operation completed!"
