package utils

import (
	"math"
	"math/big"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// Helper functions to convert between pgx types and Go types
func PgxUUIDToUUID(pgxUUID pgtype.UUID) uuid.UUID {
	return uuid.UUID(pgxUUID.Bytes)
}

func UUIDToPgxUUID(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{Bytes: id, Valid: true}
}

func PgxNumericToFloat64(numeric pgtype.Numeric) float64 {
	if !numeric.Valid {
		return 0
	}
	return float64(numeric.Int.Int64()) / math.Pow(10, float64(-numeric.Exp))
}

func Float64ToPgxNumeric(value float64) pgtype.Numeric {
	// Convert to cents to avoid floating point precision issues
	cents := int64(value * 100)
	return pgtype.Numeric{Int: big.NewInt(cents), Exp: -2, Valid: true}
}

func PgxTimestamptzToTime(ts pgtype.Timestamptz) time.Time {
	return ts.Time
}

func TimeToPgxTimestamptz(t time.Time) pgtype.Timestamptz {
	return pgtype.Timestamptz{Time: t, Valid: true}
}

// Helper function to convert optional boolean pointer to pgtype.Bool
func OptionalBoolToPgxBool(b *bool) pgtype.Bool {
	if b == nil {
		return pgtype.Bool{Valid: false}
	}
	return pgtype.Bool{Bool: *b, Valid: true}
}

// Helper function to convert optional UUID pointer to pgtype.UUID
func OptionalUUIDToPgxUUID(id *uuid.UUID) pgtype.UUID {
	if id == nil {
		return pgtype.UUID{Valid: false}
	}
	return UUIDToPgxUUID(*id)
}

// Helper function to convert optional pgtype.UUID to UUID pointer
func OptionalPgxUUIDToUUID(pgxUUID pgtype.UUID) *uuid.UUID {
	if !pgxUUID.Valid {
		return nil
	}
	id := PgxUUIDToUUID(pgxUUID)
	return &id
}

// Helper function to convert optional float64 pointer to pgtype.Numeric
func OptionalFloat64ToPgxNumeric(value *float64) pgtype.Numeric {
	if value == nil {
		return pgtype.Numeric{Valid: false}
	}
	return Float64ToPgxNumeric(*value)
}

// Helper function to convert optional pgtype.Timestamptz to time pointer
func OptionalPgxTimestamptzToTimePtr(ts pgtype.Timestamptz) *time.Time {
	if !ts.Valid {
		return nil
	}
	return &ts.Time
}

// Helper function to convert optional pgtype.Numeric to float64 pointer
func OptionalPgxNumericToFloat64Ptr(numeric pgtype.Numeric) *float64 {
	if !numeric.Valid {
		return nil
	}
	val := PgxNumericToFloat64(numeric)
	return &val
}

// Helper function to convert optional pgtype.Text to string pointer
func OptionalPgxStringToStringPtr(s pgtype.Text) *string {
	if !s.Valid {
		return nil
	}
	return &s.String
}

// Helper function to convert optional string to string
func OptionalStringToString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// Helper function to convert optional string to string pointer
func OptionalStringToStringPtr(s *string) *string {
	if s == nil {
		return nil
	}
	return s
}

// Helper function to convert optional int pointer to int32 pointer
func OptionalIntToInt32Ptr(value *int) *int32 {
	if value == nil {
		return nil
	}
	val := int32(*value)
	return &val
}

// Helper function to convert optional int pointer to int32
func OptionalIntToInt32(value *int) int32 {
	if value == nil {
		return 0
	}
	return int32(*value)
}

// Helper function to convert optional int32 pointer to int pointer
func OptionalInt32PtrToInt(value *int32) *int {
	if value == nil {
		return nil
	}
	val := int(*value)
	return &val
}

// Helper function to convert int32 to int pointer
func Int32ToIntPtr(value int32) *int {
	val := int(value)
	return &val
}
