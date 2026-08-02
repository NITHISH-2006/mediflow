package models

import "time"

// BillStatus represents whether a bill has been settled.
type BillStatus string

const (
	BillPending BillStatus = "Pending"
	BillPaid    BillStatus = "Paid"
)

// Bill stores financial records for patient appointments.
type Bill struct {
	ID            uint        `gorm:"primaryKey;autoIncrement" json:"id"`
	PatientID     uint        `gorm:"not null;index" json:"patient_id"`
	Patient       Patient     `gorm:"foreignKey:PatientID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"patient,omitempty"`
	AppointmentID uint        `gorm:"not null;index" json:"appointment_id"`
	Appointment   Appointment `gorm:"foreignKey:AppointmentID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"appointment,omitempty"`
	Amount        float64     `gorm:"type:numeric(10,2);not null" json:"amount"`
	Status        BillStatus  `gorm:"type:varchar(10);not null;default:'Pending'" json:"status"`
	PaymentMethod string      `gorm:"type:varchar(50)" json:"payment_method"`
	CreatedAt     time.Time   `json:"created_at"`
}
