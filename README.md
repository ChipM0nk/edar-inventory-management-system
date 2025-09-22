# SME Inventory System

A comprehensive inventory management system built with Go (Gin) + PostgreSQL + Next.js for small and medium enterprises.

## 🚀 Quick Start

### Option 1: Docker Setup (Recommended)

The easiest way to get started is using our setup script:

```bash
./setup.sh
```

This will:
- Install all dependencies
- Start all services with Docker Compose
- Run database migrations
- Set up the development environment

**If Docker is not running:**
```bash
# On macOS
./start-docker.sh

# Then run setup
./setup.sh
```

### Option 2: Manual Setup

If you prefer to run services manually or don't have Docker:

```bash
# Follow the detailed manual setup guide
cat MANUAL_SETUP.md
```

**Quick manual setup:**
1. Install PostgreSQL and create database
2. Start backend: `cd backend && go run main.go`
3. Start frontend: `cd frontend && npm run dev`

## 🏗️ Architecture

### Backend (Go + Gin)
- **Framework**: Gin web framework
- **Database**: PostgreSQL with connection pooling
- **Query Builder**: sqlc for type-safe database queries
- **Migrations**: golang-migrate for schema management
- **Authentication**: JWT with access/refresh token pattern
- **Authorization**: Role-based access control (admin, manager, staff)

### Frontend (Next.js + React)
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for type safety
- **UI Components**: shadcn/ui with Radix UI primitives
- **State Management**: TanStack Query for server state
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with custom design system

### Database Schema
- **Products**: SKU, name, description, pricing, categories
- **Warehouses**: Location, contact information, status
- **Stock Levels**: Real-time inventory tracking per product/warehouse
- **Stock Movements**: Complete audit trail of all inventory changes
- **Purchase Orders**: Supplier order management
- **Sales Orders**: Customer order management
- **Users**: Authentication and role management

## ✨ Features

### Core Inventory Management
- ✅ **Product Management**: Create, update, and manage product catalog
- ✅ **Warehouse Management**: Multi-location inventory tracking
- ✅ **Stock Level Monitoring**: Real-time inventory levels with low-stock alerts
- ✅ **Stock Movement Tracking**: Complete audit trail of all inventory changes
- ✅ **Transaction Safety**: All stock changes are atomic and create movement records

### Order Management
- ✅ **Purchase Orders**: Supplier order creation and tracking
- ✅ **Sales Orders**: Customer order management and fulfillment
- ✅ **Order Status Tracking**: Pending, confirmed, shipped, delivered states

### Reporting & Analytics
- ✅ **Stock on Hand (SOH) Reports**: Comprehensive inventory reports
- ✅ **Movement History**: Detailed transaction logs
- ✅ **Low Stock Alerts**: Automated notifications for reorder points

### User Experience
- ✅ **Responsive Design**: Works on desktop, tablet, and mobile
- ✅ **Real-time Updates**: Live data synchronization
- ✅ **Form Validation**: Client and server-side validation
- ✅ **Search & Filtering**: Advanced filtering capabilities
- ✅ **Pagination**: Efficient data loading for large datasets

### Security & Access Control
- ✅ **JWT Authentication**: Secure token-based authentication
- ✅ **Role-based Access**: Admin, manager, and staff roles
- ✅ **API Security**: Protected endpoints with middleware
- ✅ **Data Validation**: Input sanitization and validation

## 🛠️ Development Setup

### Prerequisites
- Docker and Docker Compose
- Go 1.21+ (for local backend development)
- Node.js 18+ (for local frontend development)

### Manual Setup

1. **Clone and setup environment**:
   ```bash
   git clone <repository-url>
   cd edar
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

2. **Start database**:
   ```bash
   docker-compose up -d db
   ```

3. **Setup backend**:
   ```bash
   cd backend
   go mod tidy
   make migrate-up
   go run main.go
   ```

4. **Setup frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Environment Variables

#### Backend (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=inventory_user
DB_PASSWORD=inventory_password
DB_NAME=inventory_db
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

## 📚 API Documentation

### Authentication
All API endpoints (except auth) require a Bearer token in the Authorization header.

**Login**: `POST /api/v1/auth/login`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Refresh Token**: `POST /api/v1/auth/refresh`
```json
{
  "refresh_token": "your-refresh-token"
}
```

### Core Endpoints

#### Products
- `GET /api/v1/products` - List products with pagination and filtering
- `POST /api/v1/products` - Create new product
- `GET /api/v1/products/:id` - Get product details
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Soft delete product

#### Warehouses
- `GET /api/v1/warehouses` - List all warehouses
- `POST /api/v1/warehouses` - Create new warehouse
- `GET /api/v1/warehouses/:id` - Get warehouse details
- `PUT /api/v1/warehouses/:id` - Update warehouse
- `DELETE /api/v1/warehouses/:id` - Soft delete warehouse

#### Stock Management
- `GET /api/v1/stock-levels` - List stock levels with filtering
- `GET /api/v1/stock-levels/:product_id/:warehouse_id` - Get specific stock level
- `GET /api/v1/stock-movements` - List stock movements with filtering
- `POST /api/v1/stock-movements` - Create stock movement

#### Reports
- `GET /api/v1/reports/soh` - Stock on Hand report

## 🗄️ Database Schema

The system uses PostgreSQL with the following key tables:

- **users**: User accounts and authentication
- **products**: Product catalog and pricing
- **warehouses**: Warehouse locations and details
- **stock_levels**: Current inventory levels per product/warehouse
- **stock_movements**: Complete audit trail of inventory changes
- **purchase_orders**: Supplier orders and receipts
- **sales_orders**: Customer orders and shipments

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Update all secrets and configuration
2. **Database**: Use managed PostgreSQL service (AWS RDS, Google Cloud SQL, etc.)
3. **Security**: Enable HTTPS, configure CORS, set up rate limiting
4. **Monitoring**: Add logging, metrics, and health checks
5. **Backup**: Set up automated database backups

### Docker Production Build

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔧 Troubleshooting

### Common Issues

**Docker not running:**
```bash
# On macOS
./start-docker.sh

# On Linux
sudo systemctl start docker

# On Windows
# Start Docker Desktop application
```

**NPM package errors:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Database connection errors:**
- Make sure PostgreSQL is running
- Check credentials in `.env` file
- Verify database exists: `psql -U inventory_user -d inventory_db`

**Port already in use:**
- Backend: Change `SERVER_PORT` in `backend/.env`
- Frontend: Change port in `frontend/package.json` scripts

**Migration errors:**
```bash
cd backend
make migrate-down  # Rollback
make migrate-up    # Try again
```

### Getting Help

For support and questions:
- Check this troubleshooting section
- Review the manual setup guide: `MANUAL_SETUP.md`
- Create an issue in the repository
- Check the API documentation above

## 🔄 Roadmap

- [ ] CSV import/export functionality
- [ ] Advanced reporting and analytics
- [ ] Mobile app (React Native)
- [ ] Barcode scanning integration
- [ ] Multi-tenant support
- [ ] Advanced user permissions
- [ ] Email notifications
- [ ] API rate limiting
- [ ] Audit logging
- [ ] Data backup/restore tools
