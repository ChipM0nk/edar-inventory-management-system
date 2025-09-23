# Development Script Usage

This project includes a development script (`dev.sh`) that makes it easy to run the frontend and backend independently without Docker.

## Quick Start

1. **Setup development environment**:
   ```bash
   ./dev.sh setup
   ```

2. **Start both frontend and backend**:
   ```bash
   ./dev.sh both
   ```

## Available Commands

- `./dev.sh setup` - Setup development environment (install dependencies, run migrations)
- `./dev.sh backend` - Start backend server only (http://localhost:8080)
- `./dev.sh frontend` - Start frontend server only (http://localhost:3000)
- `./dev.sh both` - Start both servers (default)

## Prerequisites

Before running the script, make sure you have installed:

- **Go** 1.23+ (for backend)
- **Node.js** 18+ (for frontend)
- **PostgreSQL** 15+ (for database)
- **sqlc** (for database code generation)
- **golang-migrate** (for database migrations)

The script will check for these dependencies and guide you through installation if any are missing.

## What the Script Does

### Setup (`./dev.sh setup`)
- Checks if all required tools are installed
- Installs backend Go dependencies
- Generates database code with sqlc
- Runs database migrations
- Installs frontend Node.js dependencies

### Backend (`./dev.sh backend`)
- Sets up environment variables
- Starts the Go backend server on port 8080
- Provides API endpoints at http://localhost:8080/api/v1

### Frontend (`./dev.sh frontend`)
- Sets up environment variables
- Starts the Next.js development server on port 3000
- Provides the web interface at http://localhost:3000

### Both (`./dev.sh both`)
- Starts both backend and frontend servers
- Backend runs in the background
- Frontend runs in the foreground
- Press Ctrl+C to stop both servers

## Environment Variables

The script automatically sets the following environment variables:

**Backend:**
- `DB_HOST=localhost`
- `DB_PORT=5432`
- `DB_USER=inventory_user`
- `DB_PASSWORD=inventory_password`
- `DB_NAME=inventory_db`
- `JWT_SECRET=your-super-secret-jwt-key-change-in-production`
- `JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production`
- `SERVER_PORT=8080`
- `SERVER_HOST=0.0.0.0`

**Frontend:**
- `NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1`

## Troubleshooting

If you encounter issues:

1. **Missing tools**: The script will tell you which tools are missing and how to install them
2. **Database connection**: Make sure PostgreSQL is running and accessible
3. **Port conflicts**: The script uses ports 3000 (frontend) and 8080 (backend)
4. **Dependencies**: Run `./dev.sh setup` to reinstall dependencies

## Manual Setup

If you prefer to set up manually, see `DEVELOPMENT_SETUP.md` for detailed instructions.

## Database

The script expects a PostgreSQL database with:
- Database name: `inventory_db`
- Username: `inventory_user`
- Password: `inventory_password`
- Host: `localhost`
- Port: `5432`

You can create this using Docker:
```bash
docker run --name postgres-dev -e POSTGRES_DB=inventory_db -e POSTGRES_USER=inventory_user -e POSTGRES_PASSWORD=inventory_password -p 5432:5432 -d postgres:15-alpine
```
