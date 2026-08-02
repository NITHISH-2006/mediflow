package controllers

import (
	"fmt"
	"net/http"

	"mediflow/config"
	"mediflow/models"
	"mediflow/utils"

	"github.com/gin-gonic/gin"
)

// ─── Input types ──────────────────────────────────────────────────────────────

// AppointmentInput is the request body for creating an appointment.
type AppointmentInput struct {
	PatientID uint   `json:"patient_id" binding:"required"`
	DoctorID  uint   `json:"doctor_id"  binding:"required"`
	Date      string `json:"date"       binding:"required"` // YYYY-MM-DD
	Time      string `json:"time"       binding:"required"` // HH:MM
	Reason    string `json:"reason"`
}

// StatusInput is the request body for changing appointment status.
type StatusInput struct {
	Status models.AppointmentStatus `json:"status" binding:"required,oneof=Scheduled Completed Cancelled"`
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// apptWithRelations returns an appointment by ID with Patient and Doctor preloaded.
func apptWithRelations(id string) (models.Appointment, error) {
	var appt models.Appointment
	err := config.DB.Preload("Patient").Preload("Doctor").First(&appt, id).Error
	return appt, err
}

// doctorOwnedByUser returns the Doctor record for a given user ID, or an error.
func doctorOwnedByUser(userID interface{}) (models.Doctor, error) {
	var doc models.Doctor
	err := config.DB.Where("user_id = ?", userID).First(&doc).Error
	return doc, err
}

// ─── GET /api/appointments ────────────────────────────────────────────────────

// GetAppointments lists appointments with optional filters and pagination.
//
//	GET /api/appointments?doctor_id=1&patient_id=2&status=Scheduled&date=2026-08-10&page=1&limit=10
func GetAppointments(c *gin.Context) {
	page, limit := parsePage(c)
	offset := (page - 1) * limit

	query := config.DB.Model(&models.Appointment{}).Preload("Patient").Preload("Doctor")

	if v := c.Query("doctor_id"); v != "" {
		query = query.Where("doctor_id = ?", v)
	}
	if v := c.Query("patient_id"); v != "" {
		query = query.Where("patient_id = ?", v)
	}
	if v := c.Query("status"); v != "" {
		query = query.Where("status = ?", v)
	}
	if v := c.Query("date"); v != "" {
		query = query.Where("date = ?", v)
	}

	var total int64
	query.Count(&total)

	var appointments []models.Appointment
	query.Order("date asc, time asc").Limit(limit).Offset(offset).Find(&appointments)

	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"data":        appointments,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": (int(total) + limit - 1) / limit,
	})
}

// ─── GET /api/appointments/:id ────────────────────────────────────────────────

// GetAppointment returns a single appointment with preloaded patient and doctor.
func GetAppointment(c *gin.Context) {
	appt, err := apptWithRelations(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Appointment not found")
		return
	}
	utils.RespondSuccess(c, http.StatusOK, appt)
}

// ─── POST /api/appointments ───────────────────────────────────────────────────

// CreateAppointment books a new appointment.
// Guards: patient exists, doctor exists, no double-booking (same doctor + date + time).
// Role: Admin / Receptionist only (enforced in router).
func CreateAppointment(c *gin.Context) {
	var input AppointmentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Validate patient
	var patient models.Patient
	if err := config.DB.First(&patient, input.PatientID).Error; err != nil {
		utils.RespondError(c, http.StatusBadRequest, fmt.Sprintf("Patient %d not found", input.PatientID))
		return
	}

	// Validate doctor
	var doctor models.Doctor
	if err := config.DB.First(&doctor, input.DoctorID).Error; err != nil {
		utils.RespondError(c, http.StatusBadRequest, fmt.Sprintf("Doctor %d not found", input.DoctorID))
		return
	}

	// Double-booking guard: same doctor, same date, same time, not cancelled
	var conflict models.Appointment
	if config.DB.Where(
		"doctor_id = ? AND date = ? AND time = ? AND status != ?",
		input.DoctorID, input.Date, input.Time, models.StatusCancelled,
	).First(&conflict).Error == nil {
		utils.RespondError(c, http.StatusConflict,
			fmt.Sprintf("Dr. %s already has an appointment on %s at %s", doctor.Name, input.Date, input.Time))
		return
	}

	appt := models.Appointment{
		PatientID: input.PatientID,
		DoctorID:  input.DoctorID,
		Date:      input.Date,
		Time:      input.Time,
		Status:    models.StatusScheduled,
		Reason:    input.Reason,
	}

	if err := config.DB.Create(&appt).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to create appointment")
		return
	}

	// Return with relations preloaded
	config.DB.Preload("Patient").Preload("Doctor").First(&appt, appt.ID)
	utils.RespondSuccess(c, http.StatusCreated, appt)
}

// ─── PUT /api/appointments/:id/status ────────────────────────────────────────

// UpdateStatus changes the status of an appointment.
//   - Admin / Receptionist: may update any appointment.
//   - Doctor: may only update their own appointments.
func UpdateStatus(c *gin.Context) {
	var appt models.Appointment
	if err := config.DB.First(&appt, c.Param("id")).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Appointment not found")
		return
	}

	// Cancelled appointments are immutable
	if appt.Status == models.StatusCancelled {
		utils.RespondError(c, http.StatusConflict, "Cannot change status of a cancelled appointment")
		return
	}

	// Doctors may only update their own appointments
	role, _ := c.Get("role")
	if role == "Doctor" {
		userID, _ := c.Get("userID")
		doc, err := doctorOwnedByUser(userID)
		if err != nil || doc.ID != appt.DoctorID {
			utils.RespondError(c, http.StatusForbidden, "You can only update your own appointments")
			return
		}
	}

	var input StatusInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := config.DB.Model(&appt).Update("status", input.Status).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update status")
		return
	}

	config.DB.Preload("Patient").Preload("Doctor").First(&appt, appt.ID)
	utils.RespondSuccess(c, http.StatusOK, appt)
}

// ─── PUT /api/appointments/:id/cancel ────────────────────────────────────────

// CancelAppointment marks an appointment as Cancelled.
//   - Cannot cancel an already-cancelled or completed appointment.
//   - Doctors may only cancel their own appointments.
func CancelAppointment(c *gin.Context) {
	var appt models.Appointment
	if err := config.DB.First(&appt, c.Param("id")).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Appointment not found")
		return
	}

	switch appt.Status {
	case models.StatusCancelled:
		utils.RespondError(c, http.StatusConflict, "Appointment is already cancelled")
		return
	case models.StatusCompleted:
		utils.RespondError(c, http.StatusConflict, "Cannot cancel a completed appointment")
		return
	}

	// Doctors may only cancel their own
	role, _ := c.Get("role")
	if role == "Doctor" {
		userID, _ := c.Get("userID")
		doc, err := doctorOwnedByUser(userID)
		if err != nil || doc.ID != appt.DoctorID {
			utils.RespondError(c, http.StatusForbidden, "You can only cancel your own appointments")
			return
		}
	}

	if err := config.DB.Model(&appt).Update("status", models.StatusCancelled).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to cancel appointment")
		return
	}

	config.DB.Preload("Patient").Preload("Doctor").First(&appt, appt.ID)
	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"message":     "Appointment cancelled successfully",
		"appointment": appt,
	})
}

// ─── GET /api/appointments/doctor/:doctor_id ─────────────────────────────────

// GetAppointmentsByDoctor returns paginated appointments for a specific doctor.
//
//	GET /api/appointments/doctor/:doctor_id?status=Scheduled&date=2026-08-10&page=1&limit=10
func GetAppointmentsByDoctor(c *gin.Context) {
	doctorID := c.Param("doctor_id")

	var doctor models.Doctor
	if err := config.DB.First(&doctor, doctorID).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Doctor not found")
		return
	}

	page, limit := parsePage(c)
	offset := (page - 1) * limit

	query := config.DB.Model(&models.Appointment{}).
		Preload("Patient").Preload("Doctor").
		Where("doctor_id = ?", doctorID)

	if v := c.Query("status"); v != "" {
		query = query.Where("status = ?", v)
	}
	if v := c.Query("date"); v != "" {
		query = query.Where("date = ?", v)
	}

	var total int64
	query.Count(&total)

	var appointments []models.Appointment
	query.Order("date asc, time asc").Limit(limit).Offset(offset).Find(&appointments)

	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"doctor":      doctor,
		"data":        appointments,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": (int(total) + limit - 1) / limit,
	})
}

// ─── GET /api/appointments/patient/:patient_id ────────────────────────────────

// GetAppointmentsByPatient returns paginated appointments for a specific patient.
//
//	GET /api/appointments/patient/:patient_id?status=Scheduled&page=1&limit=10
func GetAppointmentsByPatient(c *gin.Context) {
	patientID := c.Param("patient_id")

	var patient models.Patient
	if err := config.DB.First(&patient, patientID).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Patient not found")
		return
	}

	page, limit := parsePage(c)
	offset := (page - 1) * limit

	query := config.DB.Model(&models.Appointment{}).
		Preload("Patient").Preload("Doctor").
		Where("patient_id = ?", patientID)

	if v := c.Query("status"); v != "" {
		query = query.Where("status = ?", v)
	}

	var total int64
	query.Count(&total)

	var appointments []models.Appointment
	query.Order("date desc, time asc").Limit(limit).Offset(offset).Find(&appointments)

	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"patient":     patient,
		"data":        appointments,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": (int(total) + limit - 1) / limit,
	})
}

// ─── DELETE /api/appointments/:id ────────────────────────────────────────────

// DeleteAppointment permanently removes an appointment.
// Role: Admin / Receptionist only (enforced in router).
func DeleteAppointment(c *gin.Context) {
	var appt models.Appointment
	if err := config.DB.First(&appt, c.Param("id")).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Appointment not found")
		return
	}

	if err := config.DB.Delete(&appt).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to delete appointment")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Appointment deleted successfully", "id": appt.ID})
}
