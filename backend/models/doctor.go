package models

import "time"

// Doctor stores doctor profile information linked to a User account.
type Doctor struct {
	ID             uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name           string    `gorm:"type:varchar(150);not null" json:"name"`
	Specialization string    `gorm:"type:varchar(100)" json:"specialization"`
	Phone          string    `gorm:"type:varchar(20)" json:"phone"`
	UserID         uint      `gorm:"not null;uniqueIndex" json:"user_id"`
	User           User      `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}
