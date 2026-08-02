package controllers

import (
	"net/http"

	"mediflow/config"
	"mediflow/models"
	"mediflow/utils"

	"github.com/gin-gonic/gin"
)

// AppointmentInput is the request body for creating/updating an appointment.
type AppointmentInput struct {
	PatientID uint                    `json:"patient_id" binding:"required"`
	DoctorID  uint                    `json:"doctor_id" binding:"required"`
	Date      string                  `json:"date" binding:"required"`
	Time      string                  `json:"time" binding:"required"`
	Status    models.AppointmentStatus `json:"status"`
	Reason    string                  `json:"reason"`
}

// GetAppointments lists all appointments with patient and doctor details.
// GET /api/appointments
func GetAppointments(c *gin.Context) {
	var appointments []models.Appointment
	config.DB.Preload("Patient").Preload("Doctor").Order("created_at desc").Find(&appointments)
	utils.RespondSuccess(c, http.StatusOK, appointments)
}

// GetAppointment returns a single appointment.
// GET /api/appointments/:id
func GetAppointment(c *gin.Context) {
	var appointment models.Appointment
	if err := config.DB.Preload("Patient").Preload("Doctor").First(&appointment, c.Param("id")).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Appointment not found")
		return
	}
	utils.RespondSuccess(c, http.StatusOK, appointment)
}

// CreateAppointment books a new appointment.
// POST /api/appointments
func CreateAppointment(c *gin.Context) {
	var input AppointmentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	status := input.Status
	if status == "" {
		status = models.StatusScheduled
	}

	appt := models.Appointment{
		PatientID: input.PatientID,
		DoctorID:  input.DoctorID,
		Date:      input.Date,
		Time:      input.Time,
		Status:    status,
		Reason:    input.Reason,
	}

	if err := config.DB.Create(&appt).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to create appointment")
		return
	}

	utils.RespondSuccess(c, http.StatusCreated, appt)
}

// UpdateAppointment updates appointment details or status.
// PUT /api/appointments/:id
func UpdateAppointment(c *gin.Context) {
	var appt models.Appointment
	if err := config.DB.First(&appt, c.Param("id")).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Appointment not found")
		return
	}

	var input AppointmentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	config.DB.Model(&appt).Updates(map[string]interface{}{
		"patient_id": input.PatientID,
		"doctor_id":  input.DoctorID,
		"date":       input.Date,
		"time":       input.Time,
		"status":     input.Status,
		"reason":     input.Reason,
	})

	utils.RespondSuccess(c, http.StatusOK, appt)
}

// DeleteAppointment cancels and removes an appointment.
// DELETE /api/appointments/:id
func DeleteAppointment(c *gin.Context) {
	var appt models.Appointment
	if err := config.DB.First(&appt, c.Param("id")).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Appointment not found")
		return
	}

	config.DB.Delete(&appt)
	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Appointment deleted"})
}
