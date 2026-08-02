package controllers

import (
	"net/http"

	"mediflow/config"
	"mediflow/models"
	"mediflow/utils"

	"github.com/gin-gonic/gin"
)

// DoctorInput is the request body for creating/updating a doctor.
type DoctorInput struct {
	Name           string `json:"name" binding:"required"`
	Specialization string `json:"specialization"`
	Phone          string `json:"phone"`
	UserID         uint   `json:"user_id" binding:"required"`
}

// GetDoctors returns all doctors.
// GET /api/doctors
func GetDoctors(c *gin.Context) {
	var doctors []models.Doctor
	config.DB.Preload("User").Order("created_at desc").Find(&doctors)
	utils.RespondSuccess(c, http.StatusOK, doctors)
}

// GetDoctor returns a single doctor.
// GET /api/doctors/:id
func GetDoctor(c *gin.Context) {
	var doctor models.Doctor
	if err := config.DB.Preload("User").First(&doctor, c.Param("id")).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Doctor not found")
		return
	}
	utils.RespondSuccess(c, http.StatusOK, doctor)
}

// CreateDoctor creates a new doctor profile.
// POST /api/doctors
func CreateDoctor(c *gin.Context) {
	var input DoctorInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	doctor := models.Doctor{
		Name:           input.Name,
		Specialization: input.Specialization,
		Phone:          input.Phone,
		UserID:         input.UserID,
	}

	if err := config.DB.Create(&doctor).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to create doctor")
		return
	}

	utils.RespondSuccess(c, http.StatusCreated, doctor)
}

// UpdateDoctor updates a doctor profile.
// PUT /api/doctors/:id
func UpdateDoctor(c *gin.Context) {
	var doctor models.Doctor
	if err := config.DB.First(&doctor, c.Param("id")).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Doctor not found")
		return
	}

	var input DoctorInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	config.DB.Model(&doctor).Updates(map[string]interface{}{
		"name":           input.Name,
		"specialization": input.Specialization,
		"phone":          input.Phone,
	})

	utils.RespondSuccess(c, http.StatusOK, doctor)
}

// DeleteDoctor removes a doctor profile.
// DELETE /api/doctors/:id
func DeleteDoctor(c *gin.Context) {
	var doctor models.Doctor
	if err := config.DB.First(&doctor, c.Param("id")).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Doctor not found")
		return
	}

	config.DB.Delete(&doctor)
	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Doctor deleted"})
}
