package models

import "time"

// EMRNote is an Electronic Medical Record note tied to a patient visit.
type EMRNote struct {
	ID            uint        `gorm:"primaryKey;autoIncrement" json:"id"`
	PatientID     uint        `gorm:"not null;index" json:"patient_id"`
	Patient       Patient     `gorm:"foreignKey:PatientID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"patient,omitempty"`
	DoctorID      uint        `gorm:"not null;index" json:"doctor_id"`
	Doctor        Doctor      `gorm:"foreignKey:DoctorID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"doctor,omitempty"`
	AppointmentID uint        `gorm:"not null;index" json:"appointment_id"`
	Appointment   Appointment `gorm:"foreignKey:AppointmentID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"appointment,omitempty"`
	Notes         string      `gorm:"type:text" json:"notes"`
	Diagnosis     string      `gorm:"type:text" json:"diagnosis"`
	Prescription  string      `gorm:"type:text" json:"prescription"`
	CreatedAt     time.Time   `json:"created_at"`
}
