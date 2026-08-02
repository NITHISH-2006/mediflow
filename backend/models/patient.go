package models

import "time"

// Patient stores core patient demographic information.
type Patient struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string    `gorm:"type:varchar(150);not null" json:"name"`
	Age       int       `gorm:"not null" json:"age"`
	Gender    string    `gorm:"type:varchar(10);not null" json:"gender"`
	Phone     string    `gorm:"type:varchar(20)" json:"phone"`
	Address   string    `gorm:"type:text" json:"address"`
	UserID    *uint     `gorm:"index" json:"user_id,omitempty"` // optional link to a user account
	User      *User     `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"user,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}
