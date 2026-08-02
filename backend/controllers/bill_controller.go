package controllers

import (
	"net/http"

	"mediflow/config"
	"mediflow/models"
	"mediflow/utils"

	"github.com/gin-gonic/gin"
)

// BillInput is the request body for creating/updating a bill.
type BillInput struct {
	PatientID     uint              `json:"patient_id" binding:"required"`
	AppointmentID uint              `json:"appointment_id" binding:"required"`
	Amount        float64           `json:"amount" binding:"required,min=0"`
	Status        models.BillStatus `json:"status"`
	PaymentMethod string            `json:"payment_method"`
}

// GetBills lists all bills.
// GET /api/bills
func GetBills(c *gin.Context) {
	var bills []models.Bill
	config.DB.Preload("Patient").Preload("Appointment").Order("created_at desc").Find(&bills)
	utils.RespondSuccess(c, http.StatusOK, bills)
}

// GetBill returns a single bill.
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
// POST /api/bills
func CreateBill(c *gin.Context) {
	var input BillInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
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

	utils.RespondSuccess(c, http.StatusCreated, bill)
}

// UpdateBill updates bill details (e.g. mark as paid).
// PUT /api/bills/:id
func UpdateBill(c *gin.Context) {
	var bill models.Bill
	if err := config.DB.First(&bill, c.Param("id")).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Bill not found")
		return
	}

	var input BillInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	config.DB.Model(&bill).Updates(map[string]interface{}{
		"amount":         input.Amount,
		"status":         input.Status,
		"payment_method": input.PaymentMethod,
	})

	utils.RespondSuccess(c, http.StatusOK, bill)
}

// DeleteBill removes a bill record.
// DELETE /api/bills/:id
func DeleteBill(c *gin.Context) {
	var bill models.Bill
	if err := config.DB.First(&bill, c.Param("id")).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Bill not found")
		return
	}

	config.DB.Delete(&bill)
	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Bill deleted"})
}
