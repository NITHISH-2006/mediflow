package controllers

import (
	"net/http"
	"strconv"

	"mediflow/config"
	"mediflow/models"
	"mediflow/utils"

	"github.com/gin-gonic/gin"
)

// PatientInput is the request body for creating/updating a patient.
type PatientInput struct {
	Name    string `json:"name"   binding:"required"`
	Age     int    `json:"age"    binding:"required,min=0,max=150"`
	Gender  string `json:"gender" binding:"required,oneof=Male Female Other"`
	Phone   string `json:"phone"`
	Address string `json:"address"`
	UserID  *uint  `json:"user_id"`
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// parsePage extracts page/limit from query params with safe defaults.
func parsePage(c *gin.Context) (int, int) {
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if err != nil || limit < 1 || limit > 100 {
		limit = 10
	}
	return page, limit
}

// ─── Handlers ────────────────────────────────────────────────────────────────

// GetPatients returns a paginated, searchable list of patients.
//
//	GET /api/patients?page=1&limit=10&search=john&gender=Male
func GetPatients(c *gin.Context) {
	page, limit := parsePage(c)
	offset := (page - 1) * limit

	search := c.Query("search")  // matches name OR phone
	gender := c.Query("gender")  // optional gender filter

	query := config.DB.Model(&models.Patient{})

	if search != "" {
		like := "%" + search + "%"
		query = query.Where("name ILIKE ? OR phone ILIKE ?", like, like)
	}
	if gender != "" {
		query = query.Where("gender = ?", gender)
	}

	var total int64
	query.Count(&total)

	var patients []models.Patient
	query.Order("created_at desc").Limit(limit).Offset(offset).Find(&patients)

	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"data":        patients,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": (int(total) + limit - 1) / limit,
	})
}

// GetPatient returns a single patient by ID.
//
//	GET /api/patients/:id
func GetPatient(c *gin.Context) {
	var patient models.Patient
	if err := config.DB.First(&patient, c.Param("id")).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Patient not found")
		return
	}
	utils.RespondSuccess(c, http.StatusOK, patient)
}

// CreatePatient creates a new patient record.
//
//	POST /api/patients
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
//
//	PUT /api/patients/:id
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

	// Use map so zero-value Age (0) is still saved correctly
	updates := map[string]interface{}{
		"name":    input.Name,
		"age":     input.Age,
		"gender":  input.Gender,
		"phone":   input.Phone,
		"address": input.Address,
	}
	if err := config.DB.Model(&patient).Updates(updates).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update patient")
		return
	}

	// Reload to return fresh data
	config.DB.First(&patient, patient.ID)
	utils.RespondSuccess(c, http.StatusOK, patient)
}

// DeletePatient hard-deletes a patient record (Admin only — enforced in router).
//
//	DELETE /api/patients/:id
func DeletePatient(c *gin.Context) {
	var patient models.Patient
	if err := config.DB.First(&patient, c.Param("id")).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Patient not found")
		return
	}

	if err := config.DB.Delete(&patient).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to delete patient")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Patient deleted successfully", "id": patient.ID})
}
