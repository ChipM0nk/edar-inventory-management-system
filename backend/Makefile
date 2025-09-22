.PHONY: migrate-up migrate-down migrate-create migrate-force

# Database connection string
DB_URL=postgres://inventory_user:inventory_password@localhost:5432/inventory_db?sslmode=disable

# Migration commands
migrate-up:
	migrate -path ./migrations -database "$(DB_URL)" up

migrate-down:
	migrate -path ./migrations -database "$(DB_URL)" down

migrate-force:
	migrate -path ./migrations -database "$(DB_URL)" force $(VERSION)

migrate-create:
	migrate create -ext sql -dir ./migrations -seq $(NAME)

# Generate sqlc code
sqlc-generate:
	sqlc generate

# Run the application
run:
	go run main.go

# Build the application
build:
	go build -o bin/main main.go

# Install dependencies
deps:
	go mod tidy
	go mod download

# Run tests
test:
	go test ./...

# Run with hot reload (requires air)
dev:
	air

