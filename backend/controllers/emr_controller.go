package controllers

import (
	"net/http"

	"mediflow/config"
	"mediflow/models"
	"mediflow/utils"

	"github.com/gin-gonic/gin"
)

// EMRNoteInput is the request body for creating/updating an EMR note.
type EMRNoteInput struct {
	PatientID     uint   `json:"patient_id" binding:"required"`
	DoctorID      uint   `json:"doctor_id" binding:"required"`
	AppointmentID uint   `json:"appointment_id" binding:"required"`
	Notes         string `json:"notes"`
	Diagnosis     string `json:"diagnosis"`
	Prescription  string `json:"prescription"`
}

// GetEMRNotes lists all EMR notes.
// GET /api/emr
func GetEMRNotes(c *gin.Context) {
	var notes []models.EMRNote
	config.DB.Preload("Patient").Preload("Doctor").Preload("Appointment").
		Order("created_at desc").Find(&notes)
	utils.RespondSuccess(c, http.StatusOK, notes)
}

// GetEMRNotesByPatient lists EMR notes for a specific patient.
// GET /api/emr/patient/:patient_id
func GetEMRNotesByPatient(c *gin.Context) {
	var notes []models.EMRNote
	config.DB.Preload("Doctor").Preload("Appointment").
		Where("patient_id = ?", c.Param("patient_id")).
		Order("created_at desc").Find(&notes)
	utils.RespondSuccess(c, http.StatusOK, notes)
}

// GetEMRNote returns a single EMR note.
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
// POST /api/emr
func CreateEMRNote(c *gin.Context) {
	var input EMRNoteInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
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

	utils.RespondSuccess(c, http.StatusCreated, note)
}

// UpdateEMRNote updates an existing EMR note.
// PUT /api/emr/:id
func UpdateEMRNote(c *gin.Context) {
	var note models.EMRNote
	if err := config.DB.First(&note, c.Param("id")).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "EMR note not found")
		return
	}

	var input EMRNoteInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	config.DB.Model(&note).Updates(map[string]interface{}{
		"notes":        input.Notes,
		"diagnosis":    input.Diagnosis,
		"prescription": input.Prescription,
	})

	utils.RespondSuccess(c, http.StatusOK, note)
}

// DeleteEMRNote removes an EMR note.
// DELETE /api/emr/:id
func DeleteEMRNote(c *gin.Context) {
	var note models.EMRNote
	if err := config.DB.First(&note, c.Param("id")).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "EMR note not found")
		return
	}

	config.DB.Delete(&note)
	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "EMR note deleted"})
}
