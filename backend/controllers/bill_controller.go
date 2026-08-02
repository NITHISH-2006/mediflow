package controllers

import (
	"net/http"

	"mediflow/config"
	"mediflow/models"
	"mediflow/utils"

	"github.com/gin-gonic/gin"
)

// BillInput is the request body for creating a bill.
type BillInput struct {
	PatientID     uint              `json:"patient_id" binding:"required"`
	AppointmentID uint              `json:"appointment_id" binding:"required"`
	Amount        float64           `json:"amount" binding:"required,min=0"`
	Status        models.BillStatus `json:"status" binding:"omitempty,oneof=Pending Paid"`
	PaymentMethod string            `json:"payment_method"`
}

// BillStatusUpdateInput is the request body for updating status only.
type BillStatusUpdateInput struct {
	Status        models.BillStatus `json:"status" binding:"required,oneof=Pending Paid"`
	PaymentMethod string            `json:"payment_method"`
}

// GetBills lists all bills with optional pagination.
// GET /api/bills
func GetBills(c *gin.Context) {
	page, limit := parsePage(c)
	offset := (page - 1) * limit

	var total int64
	config.DB.Model(&models.Bill{}).Count(&total)

	var bills []models.Bill
	config.DB.Preload("Patient").Preload("Appointment").
		Order("created_at desc").Limit(limit).Offset(offset).Find(&bills)

	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"data":        bills,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": (int(total) + limit - 1) / limit,
	})
}

// GetBill returns a single bill by ID.
// GET /api/bills/:id
func GetBill(c *gin.Context) {
	var bill models.Bill
	if err := config.DB.Preload("Patient").Preload("Appointment").First(&bill, c.Param("id")).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Bill not found")
		return
	}
	utils.RespondSuccess(c, http.StatusOK, bill)
}

// CreateBill creates a new bill.
// POST /api/bills (Receptionist/Admin only)
func CreateBill(c *gin.Context) {
	var input BillInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// 1. Verify Patient exists
	var patient models.Patient
	if err := config.DB.First(&patient, input.PatientID).Error; err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Patient not found")
		return
	}

	// 2. Verify Appointment exists
	var appt models.Appointment
	if err := config.DB.First(&appt, input.AppointmentID).Error; err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Appointment not found")
		return
	}

	// 3. Verify Appointment belongs to the Patient
	if appt.PatientID != input.PatientID {
		utils.RespondError(c, http.StatusBadRequest, "Appointment does not belong to this patient")
		return
	}

	status := input.Status
	if status == "" {
		status = models.BillPending
	}

	bill := models.Bill{
		PatientID:     input.PatientID,
		AppointmentID: input.AppointmentID,
		Amount:        input.Amount,
		Status:        status,
		PaymentMethod: input.PaymentMethod,
	}

	if err := config.DB.Create(&bill).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to create bill")
		return
	}

	// Return preloaded bill
	config.DB.Preload("Patient").Preload("Appointment").First(&bill, bill.ID)
	utils.RespondSuccess(c, http.StatusCreated, bill)
}

// UpdateBillStatus updates payment status of a bill.
// PUT /api/bills/:id/status (Receptionist/Admin only)
func UpdateBillStatus(c *gin.Context) {
	var bill models.Bill
	if err := config.DB.First(&bill, c.Param("id")).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Bill not found")
		return
	}

	var input BillStatusUpdateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	updates := map[string]interface{}{
		"status": input.Status,
	}
	if input.PaymentMethod != "" {
		updates["payment_method"] = input.PaymentMethod
	}

	if err := config.DB.Model(&bill).Updates(updates).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update bill status")
		return
	}

	config.DB.Preload("Patient").Preload("Appointment").First(&bill, bill.ID)
	utils.RespondSuccess(c, http.StatusOK, bill)
}

// GetBillsByPatient lists bills for a specific patient.
// GET /api/bills/patient/:patient_id
func GetBillsByPatient(c *gin.Context) {
	patientID := c.Param("patient_id")

	// Verify Patient exists
	var patient models.Patient
	if err := config.DB.First(&patient, patientID).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Patient not found")
		return
	}

	page, limit := parsePage(c)
	offset := (page - 1) * limit

	var total int64
	config.DB.Model(&models.Bill{}).Where("patient_id = ?", patientID).Count(&total)

	var bills []models.Bill
	config.DB.Preload("Patient").Preload("Appointment").
		Where("patient_id = ?", patientID).
		Order("created_at desc").Limit(limit).Offset(offset).Find(&bills)

	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"data":        bills,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": (int(total) + limit - 1) / limit,
	})
}

// DeleteBill removes a bill record (Admin only).
// DELETE /api/bills/:id
func DeleteBill(c *gin.Context) {
	var bill models.Bill
	if err := config.DB.First(&bill, c.Param("id")).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Bill not found")
		return
	}

	if err := config.DB.Delete(&bill).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to delete bill")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Bill deleted successfully", "id": bill.ID})
}
