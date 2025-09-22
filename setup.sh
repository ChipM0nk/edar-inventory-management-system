#!/bin/bash

# SME Inventory System Setup Script

echo "🚀 Setting up SME Inventory System..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if Docker daemon is running
if ! docker ps &> /dev/null; then
    echo "❌ Docker daemon is not running. Please start Docker first."
    echo "   On macOS: Open Docker Desktop application"
    echo "   On Linux: sudo systemctl start docker"
    echo "   On Windows: Start Docker Desktop"
    exit 1
fi

# Create environment files if they don't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend environment file..."
    cat > backend/.env << EOF
# Database Configuration
DB_HOST=db
DB_PORT=5432
DB_USER=inventory_user
DB_PASSWORD=inventory_password
DB_NAME=inventory_db
DB_SSLMODE=disable

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_ACCESS_EXPIRY=15
JWT_REFRESH_EXPIRY=7

# Server Configuration
SERVER_PORT=8080
SERVER_HOST=0.0.0.0
EOF
fi

if [ ! -f frontend/.env.local ]; then
    echo "📝 Creating frontend environment file..."
    cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
EOF
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
go mod tidy
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Start the services
echo "🐳 Starting services with Docker Compose..."
if docker-compose -f docker-compose.dev.yml up -d; then
    # Wait for database to be ready
    echo "⏳ Waiting for database to be ready..."
    sleep 10

    # Run database migrations
    echo "🗄️ Running database migrations..."
    cd backend
    # Note: Migrations will be handled by the API container
    cd ..
else
    echo "❌ Failed to start services with Docker Compose"
    echo "💡 Try running manually:"
    echo "   1. Start Docker Desktop"
    echo "   2. Run: docker-compose -f docker-compose.dev.yml up -d"
    echo "   3. Or follow manual setup: MANUAL_SETUP.md"
    exit 1
fi

echo "✅ Setup complete!"
echo ""
echo "🌐 Services are running:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8080"
echo "   - Database: localhost:5432"
echo ""
echo "📚 Next steps:"
echo "   1. Visit http://localhost:3000 to access the application"
echo "   2. Create your first user account"
echo "   3. Start managing your inventory!"
echo ""
echo "🛠️ Useful commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop services: docker-compose down"
echo "   - Restart services: docker-compose restart"
