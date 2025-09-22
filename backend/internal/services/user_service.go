package services

import (
	"context"
	"errors"
	"inventory-system/internal/database"
	sqlc "inventory-system/internal/database/sqlc"
	"inventory-system/internal/models"
	"inventory-system/internal/utils"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	db *database.DB
}

func NewUserService(db *database.DB) *UserService {
	return &UserService{db: db}
}

func (s *UserService) CreateUser(ctx context.Context, req models.CreateUserRequest) (*models.User, error) {
	// Check if user already exists
	existingUser, err := s.db.GetUserByEmail(ctx, req.Email)
	if err == nil && existingUser != nil {
		return nil, errors.New("user with this email already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Create user
	user, err := s.db.CreateUser(ctx, &sqlc.CreateUserParams{
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Role:         req.Role,
	})
	if err != nil {
		return nil, err
	}

	return &models.User{
		ID:        utils.PgxUUIDToUUID(user.ID),
		Email:     user.Email,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Role:      user.Role,
		IsActive:  *user.IsActive,
		CreatedAt: utils.PgxTimestamptzToTime(user.CreatedAt),
		UpdatedAt: utils.PgxTimestamptzToTime(user.UpdatedAt),
	}, nil
}

func (s *UserService) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	user, err := s.db.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, err
	}

	return &models.User{
		ID:           utils.PgxUUIDToUUID(user.ID),
		Email:        user.Email,
		PasswordHash: user.PasswordHash,
		FirstName:    user.FirstName,
		LastName:     user.LastName,
		Role:         user.Role,
		IsActive:     *user.IsActive,
		CreatedAt:    utils.PgxTimestamptzToTime(user.CreatedAt),
		UpdatedAt:    utils.PgxTimestamptzToTime(user.UpdatedAt),
	}, nil
}

func (s *UserService) GetUserByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	user, err := s.db.GetUser(ctx, utils.UUIDToPgxUUID(id))
	if err != nil {
		return nil, err
	}

	return &models.User{
		ID:        utils.PgxUUIDToUUID(user.ID),
		Email:     user.Email,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Role:      user.Role,
		IsActive:  *user.IsActive,
		CreatedAt: utils.PgxTimestamptzToTime(user.CreatedAt),
		UpdatedAt: utils.PgxTimestamptzToTime(user.UpdatedAt),
	}, nil
}

func (s *UserService) ValidatePassword(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

func (s *UserService) ListUsers(ctx context.Context) ([]models.User, error) {
	users, err := s.db.ListUsers(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]models.User, len(users))
	for i, user := range users {
		result[i] = models.User{
			ID:        utils.PgxUUIDToUUID(user.ID),
			Email:     user.Email,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			Role:      user.Role,
			IsActive:  *user.IsActive,
			CreatedAt: utils.PgxTimestamptzToTime(user.CreatedAt),
			UpdatedAt: utils.PgxTimestamptzToTime(user.UpdatedAt),
		}
	}

	return result, nil
}

func (s *UserService) UpdateUser(ctx context.Context, id uuid.UUID, req models.UpdateUserRequest) (*models.User, error) {
	user, err := s.db.UpdateUser(ctx, &sqlc.UpdateUserParams{
		ID:        utils.UUIDToPgxUUID(id),
		Email:     req.Email,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Role:      req.Role,
	})
	if err != nil {
		return nil, err
	}

	return &models.User{
		ID:        utils.PgxUUIDToUUID(user.ID),
		Email:     user.Email,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Role:      user.Role,
		IsActive:  *user.IsActive,
		CreatedAt: utils.PgxTimestamptzToTime(user.CreatedAt),
		UpdatedAt: utils.PgxTimestamptzToTime(user.UpdatedAt),
	}, nil
}

func (s *UserService) DeleteUser(ctx context.Context, id uuid.UUID) error {
	return s.db.DeleteUser(ctx, utils.UUIDToPgxUUID(id))
}
