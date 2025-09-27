# Manual Setup Guide

If you don't have Docker or prefer to run the services manually, follow this guide.

## Prerequisites

- Go 1.21+ installed
- Node.js 18+ installed
- PostgreSQL 15+ installed

## Step 1: Database Setup

1. **Install PostgreSQL** (if not already installed):
   - macOS: `brew install postgresql`
   - Ubuntu/Debian: `sudo apt-get install postgresql postgresql-contrib`
   - Windows: Download from https://www.postgresql.org/download/

2. **Start PostgreSQL service**:
   ```bash
   # macOS with Homebrew
   brew services start postgresql
   
   # Linux
   sudo systemctl start postgresql
   ```

3. **Create database and user**:
   ```bash
   # Connect to PostgreSQL
   psql postgres
   
   # Create database and user
   CREATE DATABASE inventory_db;
   CREATE USER inventory_user WITH PASSWORD 'inventory_password';
   GRANT ALL PRIVILEGES ON DATABASE inventory_db TO inventory_user;
   \q
   ```

## Step 2: Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install Go dependencies**:
   ```bash
   go mod tidy
   ```

3. **Create environment file**:
   ```bash
   cat > .env << EOF
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=inventory_user
   DB_PASSWORD=inventory_password
   DB_NAME=inventory_db
   DB_SSLMODE=disable
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
   JWT_ACCESS_EXPIRY=15
   JWT_REFRESH_EXPIRY=7
   SERVER_PORT=8080
   SERVER_HOST=0.0.0.0
   EOF
   ```

4. **Install golang-migrate** (if not installed):
   ```bash
   # macOS
   brew install golang-migrate
   
   # Linux
   curl -L https://github.com/golang-migrate/migrate/releases/download/v4.16.2/migrate.linux-amd64.tar.gz | tar xvz
   sudo mv migrate /usr/local/bin/
   
   # Or download from: https://github.com/golang-migrate/migrate/releases
   ```

5. **Run database migrations**:
   ```bash
   make migrate-up
   ```

6. **Start the backend server**:
   ```bash
   go run main.go
   ```

The backend will be available at `http://localhost:8080`

## Step 3: Frontend Setup

1. **Open a new terminal and navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Create environment file**:
   ```bash
   cat > .env.local << EOF
   NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
   EOF
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`

## Step 4: Create First User

Since there's no user registration endpoint yet, you'll need to create a user directly in the database:

```bash
# Connect to PostgreSQL
psql -U inventory_user -d inventory_db

# Insert a test user (password is 'password123' hashed)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active) 
VALUES (
  gen_random_uuid(),
  'admin@example.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Admin',
  'User',
  'admin',
  true
);

\q
```

## Troubleshooting

### Backend Issues

- **Database connection error**: Make sure PostgreSQL is running and credentials are correct
- **Migration errors**: Check that the database exists and user has proper permissions
- **Port already in use**: Change `SERVER_PORT` in `.env` file

### Frontend Issues

- **NPM install errors**: Try deleting `node_modules` and `package-lock.json`, then run `npm install` again
- **API connection errors**: Make sure the backend is running on the correct port
- **Build errors**: Check that all dependencies are properly installed

### Database Issues

- **Permission denied**: Make sure the `inventory_user` has proper permissions
- **Database doesn't exist**: Create it manually or check the connection string
- **Migration fails**: Check that the database is empty or drop and recreate it

## Next Steps

1. Visit `http://localhost:3000` to access the application
2. Login with `admin@example.com` / `password123`
3. Start managing your inventory!

## Development Commands

### Backend
```bash
# Run migrations
make migrate-up

# Rollback migrations
make migrate-down

# Create new migration
make migrate-create name=add_new_table

# Run tests
go test ./...

# Build
go build -o bin/main main.go
```

### Frontend
```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Lint
npm run lint
```






