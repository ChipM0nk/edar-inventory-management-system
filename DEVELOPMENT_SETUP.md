# Development Setup Guide

This guide will help you set up the EDAR inventory management system for local development without Docker.

## Prerequisites

You need to install the following tools on your system:

### 1. Go (Backend)
- **Version**: Go 1.23 or later
- **Installation**: 
  - Download from [https://golang.org/dl/](https://golang.org/dl/)
  - Or use package manager:
    - **macOS**: `brew install go`
    - **Ubuntu/Debian**: `sudo apt install golang-go`
    - **Windows**: Download from official site

### 2. Node.js (Frontend)
- **Version**: Node.js 18 or later
- **Installation**:
  - Download from [https://nodejs.org/](https://nodejs.org/)
  - Or use package manager:
    - **macOS**: `brew install node`
    - **Ubuntu/Debian**: `sudo apt install nodejs npm`
    - **Windows**: Download from official site

### 3. PostgreSQL (Database)
- **Version**: PostgreSQL 15 or later
- **Installation**:
  - **macOS**: `brew install postgresql@15`
  - **Ubuntu/Debian**: `sudo apt install postgresql-15`
  - **Windows**: Download from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
  - **Docker Alternative**: `docker run --name postgres-dev -e POSTGRES_DB=inventory_db -e POSTGRES_USER=inventory_user -e POSTGRES_PASSWORD=inventory_password -p 5432:5432 -d postgres:15-alpine`

### 4. sqlc (Database Code Generator)
- **Installation**:
  - **macOS**: `brew install sqlc`
  - **Linux**: `go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest`
  - **Windows**: Download from [https://github.com/sqlc-dev/sqlc/releases](https://github.com/sqlc-dev/sqlc/releases)

### 5. golang-migrate (Database Migrations)
- **Installation**:
  - **macOS**: `brew install golang-migrate`
  - **Linux**: `go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest`
  - **Windows**: Download from [https://github.com/golang-migrate/migrate/releases](https://github.com/golang-migrate/migrate/releases)

## Quick Setup

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd edar
   ```

2. **Run the setup script**:
   ```bash
   ./dev.sh setup
   ```

   This will:
   - Check if all required tools are installed
   - Install backend dependencies
   - Generate database code with sqlc
   - Run database migrations
   - Install frontend dependencies

## Manual Setup

If you prefer to set up manually or the script fails:

### 1. Database Setup

Start PostgreSQL and create the database:

```bash
# Start PostgreSQL (method depends on your installation)
# macOS with Homebrew:
brew services start postgresql@15

# Ubuntu/Debian:
sudo systemctl start postgresql

# Or using Docker:
docker run --name postgres-dev -e POSTGRES_DB=inventory_db -e POSTGRES_USER=inventory_user -e POSTGRES_PASSWORD=inventory_password -p 5432:5432 -d postgres:15-alpine
```

Create the database and user:
```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database and user
CREATE DATABASE inventory_db;
CREATE USER inventory_user WITH PASSWORD 'inventory_password';
GRANT ALL PRIVILEGES ON DATABASE inventory_db TO inventory_user;
\q
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
go mod tidy
go mod download

# Generate database code
sqlc generate

# Run migrations
make migrate-up

# Set environment variables (optional, defaults are provided)
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=inventory_user
export DB_PASSWORD=inventory_password
export DB_NAME=inventory_db
export JWT_SECRET=your-super-secret-jwt-key-change-in-production
export JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set environment variables (optional, defaults are provided)
export NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

## Running the Application

### Using the Development Script

The easiest way to run the application:

```bash
# Start both backend and frontend
./dev.sh both

# Start only backend
./dev.sh backend

# Start only frontend
./dev.sh frontend

# Setup development environment
./dev.sh setup
```

### Manual Execution

**Backend**:
```bash
cd backend
go run main.go
```
Backend will be available at: http://localhost:8080

**Frontend**:
```bash
cd frontend
npm run dev
```
Frontend will be available at: http://localhost:3000

## Environment Variables

### Backend Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | Database host |
| `DB_PORT` | `5432` | Database port |
| `DB_USER` | `inventory_user` | Database username |
| `DB_PASSWORD` | `inventory_password` | Database password |
| `DB_NAME` | `inventory_db` | Database name |
| `JWT_SECRET` | `your-super-secret-jwt-key` | JWT secret key |
| `JWT_REFRESH_SECRET` | `your-super-secret-refresh-key` | JWT refresh secret key |
| `SERVER_PORT` | `8080` | Server port |
| `SERVER_HOST` | `0.0.0.0` | Server host |

### Frontend Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api/v1` | Backend API URL |

## Available Scripts

### Backend Scripts (in `backend/` directory)

```bash
make run              # Run the application
make build            # Build the application
make deps             # Install dependencies
make test             # Run tests
make migrate-up       # Run database migrations
make migrate-down     # Rollback database migrations
make sqlc-generate    # Generate database code
```

### Frontend Scripts (in `frontend/` directory)

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run ESLint
npm run test          # Run tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## Troubleshooting

### Common Issues

1. **PostgreSQL connection failed**:
   - Ensure PostgreSQL is running
   - Check if the database and user exist
   - Verify connection details in environment variables

2. **sqlc command not found**:
   - Install sqlc: `go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest`
   - Add Go bin directory to PATH: `export PATH=$PATH:$(go env GOPATH)/bin`

3. **migrate command not found**:
   - Install golang-migrate: `go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest`
   - Add Go bin directory to PATH: `export PATH=$PATH:$(go env GOPATH)/bin`

4. **Port already in use**:
   - Backend (8080): Change `SERVER_PORT` environment variable
   - Frontend (3000): Next.js will automatically use the next available port

5. **Module not found errors**:
   - Backend: Run `go mod tidy` in the backend directory
   - Frontend: Run `npm install` in the frontend directory

### Database Issues

If you need to reset the database:

```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS inventory_db;"
psql -U postgres -c "CREATE DATABASE inventory_db;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE inventory_db TO inventory_user;"

# Run migrations
cd backend
make migrate-up
```

## Development Workflow

1. **Start the development environment**:
   ```bash
   ./dev.sh both
   ```

2. **Make changes** to the code

3. **Backend changes** are automatically reloaded (if using `go run main.go`)

4. **Frontend changes** are automatically reloaded by Next.js

5. **Database changes**:
   - Create new migration: `make migrate-create NAME=your_migration_name`
   - Run migrations: `make migrate-up`
   - Generate new code: `make sqlc-generate`

## API Endpoints

The backend provides the following API endpoints:

- **Authentication**: `/api/v1/auth/*`
- **Products**: `/api/v1/products/*`
- **Categories**: `/api/v1/categories/*`
- **Suppliers**: `/api/v1/suppliers/*`
- **Warehouses**: `/api/v1/warehouses/*`
- **Stock Management**: `/api/v1/stock-levels/*`, `/api/v1/stock-movements/*`

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Ensure all prerequisites are installed correctly
3. Verify environment variables are set properly
4. Check the logs for specific error messages
