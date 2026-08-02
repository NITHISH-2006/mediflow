package models

import "time"

// AppointmentStatus represents the lifecycle state of an appointment.
type AppointmentStatus string

const (
	StatusScheduled  AppointmentStatus = "Scheduled"
	StatusCompleted  AppointmentStatus = "Completed"
	StatusCancelled  AppointmentStatus = "Cancelled"
)

// Appointment links a Patient and a Doctor for a scheduled visit.
type Appointment struct {
	ID        uint              `gorm:"primaryKey;autoIncrement" json:"id"`
	PatientID uint              `gorm:"not null;index" json:"patient_id"`
	Patient   Patient           `gorm:"foreignKey:PatientID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"patient,omitempty"`
	DoctorID  uint              `gorm:"not null;index" json:"doctor_id"`
	Doctor    Doctor            `gorm:"foreignKey:DoctorID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"doctor,omitempty"`
	Date      string            `gorm:"type:date;not null" json:"date"`   // YYYY-MM-DD
	Time      string            `gorm:"type:varchar(10);not null" json:"time"` // HH:MM
	Status    AppointmentStatus `gorm:"type:varchar(20);not null;default:'Scheduled'" json:"status"`
	Reason    string            `gorm:"type:text" json:"reason"`
	CreatedAt time.Time         `json:"created_at"`
}
