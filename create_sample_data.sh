#!/bin/bash

# Script to create sample purchase orders and cancellations for testing

echo "Creating sample purchase orders and cancellations..."

# Check if database is running
if ! docker ps | grep -q "edar-db"; then
    echo "Starting database..."
    docker-compose up -d db
    sleep 10
fi

# Run the SQL script
echo "Executing sample data creation script..."
docker exec -i edar-db psql -U inventory_user -d inventory_db < create_sample_purchase_orders.sql

echo "Sample data creation completed!"
echo ""
echo "Summary of created purchase orders:"
docker exec -i edar-db psql -U inventory_user -d inventory_db -c "
SELECT 
    status,
    COUNT(*) as count,
    MIN(order_date) as earliest_date,
    MAX(order_date) as latest_date
FROM purchase_orders 
WHERE po_number LIKE 'PO-2024-%' OR po_number LIKE 'PO-CANCEL-%'
GROUP BY status
ORDER BY status;
"

echo ""
echo "You can now test the adjustments page to see:"
echo "1. Only non-cancelled purchase orders in the dropdown"
echo "2. Pagination with 10 items per page"
echo "3. Load more functionality"


