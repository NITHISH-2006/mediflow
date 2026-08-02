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
	Name           string `json:"name"           binding:"required"`
	Specialization string `json:"specialization" binding:"required"`
	Phone          string `json:"phone"`
	UserID         uint   `json:"user_id"        binding:"required"`
}

// GetDoctors returns a searchable list of all doctors with their linked user.
//
//	GET /api/doctors?search=cardio&page=1&limit=10
func GetDoctors(c *gin.Context) {
	page, limit := parsePage(c)
	offset := (page - 1) * limit

	search := c.Query("search") // matches name OR specialization

	query := config.DB.Model(&models.Doctor{}).Preload("User")

	if search != "" {
		like := "%" + search + "%"
		query = query.Where("name ILIKE ? OR specialization ILIKE ?", like, like)
	}

	var total int64
	query.Count(&total)

	var doctors []models.Doctor
	query.Order("created_at desc").Limit(limit).Offset(offset).Find(&doctors)

	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"data":        doctors,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": (int(total) + limit - 1) / limit,
	})
}

// GetDoctor returns a single doctor with their linked user.
//
//	GET /api/doctors/:id
func GetDoctor(c *gin.Context) {
	var doctor models.Doctor
	if err := config.DB.Preload("User").First(&doctor, c.Param("id")).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Doctor not found")
		return
	}
	utils.RespondSuccess(c, http.StatusOK, doctor)
}

// CreateDoctor creates a new doctor profile (Admin only — enforced in router).
//
//	POST /api/doctors
func CreateDoctor(c *gin.Context) {
	var input DoctorInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Verify the linked user exists and has the Doctor role
	var user models.User
	if err := config.DB.First(&user, input.UserID).Error; err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Linked user not found")
		return
	}

	// Prevent duplicate doctor profiles for the same user
	var existing models.Doctor
	if config.DB.Where("user_id = ?", input.UserID).First(&existing).Error == nil {
		utils.RespondError(c, http.StatusConflict, "A doctor profile already exists for this user")
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

	// Preload user before returning
	config.DB.Preload("User").First(&doctor, doctor.ID)
	utils.RespondSuccess(c, http.StatusCreated, doctor)
}

// UpdateDoctor updates a doctor's profile (Admin only — enforced in router).
//
//	PUT /api/doctors/:id
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

	updates := map[string]interface{}{
		"name":           input.Name,
		"specialization": input.Specialization,
		"phone":          input.Phone,
	}

	if err := config.DB.Model(&doctor).Updates(updates).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update doctor")
		return
	}

	// Reload with preloaded user to return fresh data
	config.DB.Preload("User").First(&doctor, doctor.ID)
	utils.RespondSuccess(c, http.StatusOK, doctor)
}

// DeleteDoctor removes a doctor profile (Admin only — enforced in router).
//
//	DELETE /api/doctors/:id
func DeleteDoctor(c *gin.Context) {
	var doctor models.Doctor
	if err := config.DB.First(&doctor, c.Param("id")).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Doctor not found")
		return
	}

	if err := config.DB.Delete(&doctor).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to delete doctor")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Doctor deleted successfully", "id": doctor.ID})
}
