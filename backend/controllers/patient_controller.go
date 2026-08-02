package controllers

import (
	"net/http"

	"mediflow/config"
	"mediflow/models"
	"mediflow/utils"

	"github.com/gin-gonic/gin"
)

// PatientInput is the request body for creating/updating a patient.
type PatientInput struct {
	Name    string `json:"name" binding:"required"`
	Age     int    `json:"age" binding:"required,min=0,max=150"`
	Gender  string `json:"gender" binding:"required"`
	Phone   string `json:"phone"`
	Address string `json:"address"`
	UserID  *uint  `json:"user_id"`
}

// GetPatients returns a paginated list of all patients.
// GET /api/patients
func GetPatients(c *gin.Context) {
	var patients []models.Patient
	config.DB.Order("created_at desc").Find(&patients)
	utils.RespondSuccess(c, http.StatusOK, patients)
}

// GetPatient returns a single patient by ID.
// GET /api/patients/:id
func GetPatient(c *gin.Context) {
	var patient models.Patient
	if err := config.DB.First(&patient, c.Param("id")).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Patient not found")
		return
	}
	utils.RespondSuccess(c, http.StatusOK, patient)
}

// CreatePatient creates a new patient record.
// POST /api/patients
func CreatePatient(c *gin.Context) {
	var input PatientInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	patient := models.Patient{
		Name:    input.Name,
		Age:     input.Age,
		Gender:  input.Gender,
		Phone:   input.Phone,
		Address: input.Address,
		UserID:  input.UserID,
	}

	if err := config.DB.Create(&patient).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to create patient")
		return
	}

	utils.RespondSuccess(c, http.StatusCreated, patient)
}

// UpdatePatient updates an existing patient record.
// PUT /api/patients/:id
func UpdatePatient(c *gin.Context) {
	var patient models.Patient
	if err := config.DB.First(&patient, c.Param("id")).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Patient not found")
		return
	}

	var input PatientInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	config.DB.Model(&patient).Updates(models.Patient{
		Name:    input.Name,
		Age:     input.Age,
		Gender:  input.Gender,
		Phone:   input.Phone,
		Address: input.Address,
	})

	utils.RespondSuccess(c, http.StatusOK, patient)
}

// DeletePatient removes a patient record.
// DELETE /api/patients/:id
func DeletePatient(c *gin.Context) {
	var patient models.Patient
	if err := config.DB.First(&patient, c.Param("id")).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Patient not found")
		return
	}

	config.DB.Delete(&patient)
	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Patient deleted"})
}
