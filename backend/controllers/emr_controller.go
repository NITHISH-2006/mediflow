package controllers

import (
	"net/http"

	"mediflow/config"
	"mediflow/models"
	"mediflow/utils"

	"github.com/gin-gonic/gin"
)

// EMRNoteInput is the request body for creating an EMR note.
type EMRNoteInput struct {
	PatientID     uint   `json:"patient_id" binding:"required"`
	DoctorID      uint   `json:"doctor_id" binding:"required"`
	AppointmentID uint   `json:"appointment_id" binding:"required"`
	Notes         string `json:"notes"`
	Diagnosis     string `json:"diagnosis"`
	Prescription  string `json:"prescription"`
}

// GetEMRNotes lists all EMR notes (optional pagination).
// GET /api/emr
func GetEMRNotes(c *gin.Context) {
	page, limit := parsePage(c)
	offset := (page - 1) * limit

	var total int64
	config.DB.Model(&models.EMRNote{}).Count(&total)

	var notes []models.EMRNote
	config.DB.Preload("Patient").Preload("Doctor").Preload("Appointment").
		Order("created_at desc").Limit(limit).Offset(offset).Find(&notes)

	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"data":        notes,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": (int(total) + limit - 1) / limit,
	})
}

// GetEMRNotesByPatient lists EMR notes for a specific patient.
// GET /api/emr/patient/:patient_id
func GetEMRNotesByPatient(c *gin.Context) {
	patientID := c.Param("patient_id")

	// Verify patient exists
	var patient models.Patient
	if err := config.DB.First(&patient, patientID).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Patient not found")
		return
	}

	page, limit := parsePage(c)
	offset := (page - 1) * limit

	var total int64
	config.DB.Model(&models.EMRNote{}).Where("patient_id = ?", patientID).Count(&total)

	var notes []models.EMRNote
	config.DB.Preload("Patient").Preload("Doctor").Preload("Appointment").
		Where("patient_id = ?", patientID).
		Order("created_at desc").Limit(limit).Offset(offset).Find(&notes)

	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"data":        notes,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": (int(total) + limit - 1) / limit,
	})
}

// GetEMRNoteByAppointment returns the EMR note for a specific appointment.
// GET /api/emr/appointment/:appointment_id
func GetEMRNoteByAppointment(c *gin.Context) {
	apptID := c.Param("appointment_id")

	// Verify appointment exists
	var appt models.Appointment
	if err := config.DB.First(&appt, apptID).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Appointment not found")
		return
	}

	var note models.EMRNote
	if err := config.DB.Preload("Patient").Preload("Doctor").Preload("Appointment").
		Where("appointment_id = ?", apptID).First(&note).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "EMR note not found for this appointment")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, note)
}

// GetEMRNote returns a single EMR note by ID.
// GET /api/emr/:id
func GetEMRNote(c *gin.Context) {
	var note models.EMRNote
	if err := config.DB.Preload("Patient").Preload("Doctor").Preload("Appointment").
		First(&note, c.Param("id")).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "EMR note not found")
		return
	}
	utils.RespondSuccess(c, http.StatusOK, note)
}

// CreateEMRNote creates a new EMR note.
// Rules: Doctor only. Doctor can only create EMR for their appointments.
// POST /api/emr
func CreateEMRNote(c *gin.Context) {
	var input EMRNoteInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// 1. Get logged-in user ID
	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondError(c, http.StatusUnauthorized, "Unauthorized: user info missing")
		return
	}

	// 2. Find the doctor record corresponding to the logged-in User
	var loggedInDoc models.Doctor
	if err := config.DB.Where("user_id = ?", userID).First(&loggedInDoc).Error; err != nil {
		utils.RespondError(c, http.StatusForbidden, "Forbidden: logged-in user does not have a Doctor profile")
		return
	}

	// 3. Ensure the doctor ID in the input matches the logged-in doctor's ID
	if input.DoctorID != loggedInDoc.ID {
		utils.RespondError(c, http.StatusForbidden, "Forbidden: you can only create EMR notes under your own Doctor profile")
		return
	}

	// 4. Verify the appointment exists
	var appt models.Appointment
	if err := config.DB.First(&appt, input.AppointmentID).Error; err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid appointment ID")
		return
	}

	// 5. Verify the appointment belongs to the logged-in doctor
	if appt.DoctorID != loggedInDoc.ID {
		utils.RespondError(c, http.StatusForbidden, "Forbidden: you can only create EMR notes for your own appointments")
		return
	}

	// 6. Verify the patient matches the appointment patient
	if appt.PatientID != input.PatientID {
		utils.RespondError(c, http.StatusBadRequest, "Patient ID mismatch with appointment patient")
		return
	}

	// 7. Prevent duplicate EMR notes for the same appointment (optional but good practice)
	var existingNote models.EMRNote
	if err := config.DB.Where("appointment_id = ?", input.AppointmentID).First(&existingNote).Error; err == nil {
		utils.RespondError(c, http.StatusConflict, "An EMR note already exists for this appointment")
		return
	}

	note := models.EMRNote{
		PatientID:     input.PatientID,
		DoctorID:      input.DoctorID,
		AppointmentID: input.AppointmentID,
		Notes:         input.Notes,
		Diagnosis:     input.Diagnosis,
		Prescription:  input.Prescription,
	}

	if err := config.DB.Create(&note).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to create EMR note")
		return
	}

	// Preload relations before returning
	config.DB.Preload("Patient").Preload("Doctor").Preload("Appointment").First(&note, note.ID)
	utils.RespondSuccess(c, http.StatusCreated, note)
}

// UpdateEMRNote updates an existing EMR note (Doctor only, owner only).
// PUT /api/emr/:id
func UpdateEMRNote(c *gin.Context) {
	var note models.EMRNote
	if err := config.DB.First(&note, c.Param("id")).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "EMR note not found")
		return
	}

	// Get logged-in user ID
	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondError(c, http.StatusUnauthorized, "Unauthorized: user info missing")
		return
	}

	// Find the doctor record corresponding to the logged-in User
	var loggedInDoc models.Doctor
	if err := config.DB.Where("user_id = ?", userID).First(&loggedInDoc).Error; err != nil {
		utils.RespondError(c, http.StatusForbidden, "Forbidden: logged-in user does not have a Doctor profile")
		return
	}

	// Ensure the doctor owns this EMR note
	if note.DoctorID != loggedInDoc.ID {
		utils.RespondError(c, http.StatusForbidden, "Forbidden: you can only update your own EMR notes")
		return
	}

	var input EMRNoteInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	updates := map[string]interface{}{
		"notes":        input.Notes,
		"diagnosis":    input.Diagnosis,
		"prescription": input.Prescription,
	}

	if err := config.DB.Model(&note).Updates(updates).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update EMR note")
		return
	}

	config.DB.Preload("Patient").Preload("Doctor").Preload("Appointment").First(&note, note.ID)
	utils.RespondSuccess(c, http.StatusOK, note)
}

// DeleteEMRNote deletes an EMR note (Admin only).
// DELETE /api/emr/:id
func DeleteEMRNote(c *gin.Context) {
	var note models.EMRNote
	if err := config.DB.First(&note, c.Param("id")).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "EMR note not found")
		return
	}

	if err := config.DB.Delete(&note).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to delete EMR note")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "EMR note deleted successfully", "id": note.ID})
}
