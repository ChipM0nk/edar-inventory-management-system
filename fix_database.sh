#!/bin/bash

# Fix Database Schema Script
# This script will add the missing reference_number column to the stock_movements table

echo "🔧 Fixing database schema..."

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
echo "🗄️  Adding reference_number column to stock_movements table..."

# Run the fix
if $DB_CMD -f fix_database.sql; then
    echo ""
    echo "✅ Database schema fixed successfully!"
    echo "📊 The reference_number column has been added to stock_movements table"
else
    echo "❌ Failed to fix database schema. Please check the database connection and permissions."
    exit 1
fi

echo ""
echo "🎉 Database fix completed! You can now use the New Purchase Order form."
