package models

import (
	"time"

	"gorm.io/gorm"
)

// Role enumerates the allowed user roles.
type Role string

const (
	RoleAdmin        Role = "Admin"
	RoleDoctor       Role = "Doctor"
	RoleReceptionist Role = "Receptionist"
)

// User represents an authenticated system user.
type User struct {
	ID        uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string         `gorm:"type:varchar(150);not null" json:"name"`
	Email     string         `gorm:"type:varchar(200);uniqueIndex;not null" json:"email"`
	Password  string         `gorm:"type:varchar(255);not null" json:"-"` // never serialised
	Role      Role           `gorm:"type:varchar(20);not null;default:'Receptionist'" json:"role"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
