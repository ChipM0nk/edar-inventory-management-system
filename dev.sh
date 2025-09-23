#!/bin/bash

# Development script for running Frontend and Backend independently
# Usage: ./dev.sh [backend|frontend|both|setup]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if PostgreSQL is running
check_postgres() {
    if command_exists psql; then
        # Try connecting with inventory_user first
        if psql -h localhost -U inventory_user -d inventory_db -c '\q' 2>/dev/null; then
            return 0
        fi
        # On macOS with Homebrew, try with system username
        local system_user=$(whoami)
        if psql -U "$system_user" -d inventory_db -c '\q' 2>/dev/null; then
            return 0
        fi
    fi
    return 1
}

# Function to setup development environment
setup_dev() {
    print_status "Setting up development environment..."
    
    # Check if required tools are installed
    local missing_tools=()
    
    if ! command_exists go; then
        missing_tools+=("Go (https://golang.org/dl/)")
    fi
    
    if ! command_exists node; then
        missing_tools+=("Node.js (https://nodejs.org/)")
    fi
    
    if ! command_exists psql; then
        missing_tools+=("PostgreSQL (https://www.postgresql.org/download/)")
    fi
    
    if ! command_exists sqlc; then
        missing_tools+=("sqlc (https://docs.sqlc.dev/en/latest/overview/install.html)")
    fi
    
    if ! command_exists migrate; then
        missing_tools+=("golang-migrate (https://github.com/golang-migrate/migrate)")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools:"
        for tool in "${missing_tools[@]}"; do
            echo "  - $tool"
        done
        echo ""
        print_status "Please install the missing tools and run this script again."
        exit 1
    fi
    
    print_success "All required tools are installed!"
    
    # Check PostgreSQL connection
    if ! check_postgres; then
        print_warning "PostgreSQL is not running or not accessible."
        print_status "Please start PostgreSQL and ensure the database 'inventory_db' exists with user 'inventory_user'."
        print_status ""
        print_status "For macOS with Homebrew:"
        echo "  brew services start postgresql@15"
        echo "  psql -U \$(whoami) -d postgres -c \"CREATE DATABASE inventory_db;\""
        echo "  psql -U \$(whoami) -d postgres -c \"CREATE USER inventory_user WITH PASSWORD 'inventory_password';\""
        echo "  psql -U \$(whoami) -d postgres -c \"GRANT ALL PRIVILEGES ON DATABASE inventory_db TO inventory_user;\""
        print_status ""
        print_status "Or use Docker to run PostgreSQL:"
        echo "  docker run --name postgres-dev -e POSTGRES_DB=inventory_db -e POSTGRES_USER=inventory_user -e POSTGRES_PASSWORD=inventory_password -p 5432:5432 -d postgres:15-alpine"
        echo ""
    else
        print_success "PostgreSQL is running and accessible!"
    fi
    
    # Install backend dependencies
    print_status "Installing backend dependencies..."
    cd backend
    go mod tidy
    go mod download
    print_success "Backend dependencies installed!"
    
    # Generate sqlc code
    print_status "Generating sqlc code..."
    sqlc generate
    print_success "sqlc code generated!"
    
    # Run database migrations
    print_status "Running database migrations..."
    if check_postgres; then
        make migrate-up
        print_success "Database migrations completed!"
    else
        print_warning "Skipping migrations - PostgreSQL not accessible"
    fi
    
    cd ..
    
    # Install frontend dependencies
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    print_success "Frontend dependencies installed!"
    
    cd ..
    
    print_success "Development environment setup complete!"
    print_status "You can now run:"
    echo "  ./dev.sh backend    - Start backend only"
    echo "  ./dev.sh frontend   - Start frontend only"
    echo "  ./dev.sh both       - Start both backend and frontend"
}

# Function to start backend
start_backend() {
    print_status "Starting backend server..."
    
    if ! check_postgres; then
        print_error "PostgreSQL is not running. Please start PostgreSQL first."
        exit 1
    fi
    
    cd backend
    
    # Set environment variables
    export DB_HOST=localhost
    export DB_PORT=5432
    export DB_USER=inventory_user
    export DB_PASSWORD=inventory_password
    export DB_NAME=inventory_db
    export JWT_SECRET=your-super-secret-jwt-key-change-in-production
    export JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
    export SERVER_PORT=8080
    export SERVER_HOST=0.0.0.0
    
    print_status "Backend server starting on http://localhost:8080"
    print_status "API endpoints available at http://localhost:8080/api/v1"
    
    # Run the backend
    go run main.go
}

# Function to start frontend
start_frontend() {
    print_status "Starting frontend development server..."
    
    cd frontend
    
    # Set environment variables
    export NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
    
    print_status "Frontend server starting on http://localhost:3000"
    
    # Run the frontend
    npm run dev
}

# Function to start both
start_both() {
    print_status "Starting both backend and frontend..."
    
    # Start backend in background
    start_backend &
    BACKEND_PID=$!
    
    # Wait a moment for backend to start
    sleep 3
    
    # Start frontend in background
    start_frontend &
    FRONTEND_PID=$!
    
    print_success "Both servers started!"
    print_status "Backend: http://localhost:8080"
    print_status "Frontend: http://localhost:3000"
    print_status "Press Ctrl+C to stop both servers"
    
    # Wait for user to stop
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
    wait
}

# Main script logic
case "${1:-both}" in
    "setup")
        setup_dev
        ;;
    "backend")
        start_backend
        ;;
    "frontend")
        start_frontend
        ;;
    "both")
        start_both
        ;;
    *)
        echo "Usage: $0 [setup|backend|frontend|both]"
        echo ""
        echo "Commands:"
        echo "  setup     - Setup development environment"
        echo "  backend   - Start backend server only"
        echo "  frontend  - Start frontend server only"
        echo "  both      - Start both servers (default)"
        echo ""
        echo "Examples:"
        echo "  $0 setup"
        echo "  $0 backend"
        echo "  $0 frontend"
        echo "  $0 both"
        exit 1
        ;;
esac
