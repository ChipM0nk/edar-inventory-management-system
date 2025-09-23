FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git curl

# Install sqlc
RUN curl -L https://github.com/sqlc-dev/sqlc/releases/download/v1.25.0/sqlc_1.25.0_linux_amd64.tar.gz | tar -xz -C /usr/local/bin

# Copy go mod file first
COPY go.mod ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Generate database code and go.sum, then build the application
RUN sqlc generate && go mod tidy && CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

FROM alpine:latest

RUN apk --no-cache add ca-certificates curl

WORKDIR /root/

# Install sqlc for runtime
RUN curl -L https://github.com/sqlc-dev/sqlc/releases/download/v1.25.0/sqlc_1.25.0_linux_amd64.tar.gz | tar -xz -C /usr/local/bin

# Copy the binary from builder stage
COPY --from=builder /app/main .

# Copy migration files
COPY --from=builder /app/migrations ./migrations

# Copy sqlc configuration and queries
COPY --from=builder /app/sqlc.yaml ./
COPY --from=builder /app/internal/database/queries ./internal/database/queries

# Expose port
EXPOSE 8080

# Run the binary
CMD ["./main"]
