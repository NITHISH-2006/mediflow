package controllers

import (
	"net/http"

	"mediflow/config"
	"mediflow/models"
	"mediflow/utils"

	"github.com/gin-gonic/gin"
)

// DashboardStats returns high-level counts for the admin dashboard.
// GET /api/dashboard
func DashboardStats(c *gin.Context) {
	var totalPatients, totalDoctors, totalAppointments, pendingBills int64

	config.DB.Model(&models.Patient{}).Count(&totalPatients)
	config.DB.Model(&models.Doctor{}).Count(&totalDoctors)
	config.DB.Model(&models.Appointment{}).Count(&totalAppointments)
	config.DB.Model(&models.Bill{}).Where("status = ?", models.BillPending).Count(&pendingBills)

	// Latest 5 appointments
	var recentAppointments []models.Appointment
	config.DB.Preload("Patient").Preload("Doctor").
		Order("created_at desc").Limit(5).Find(&recentAppointments)

	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"total_patients":      totalPatients,
		"total_doctors":       totalDoctors,
		"total_appointments":  totalAppointments,
		"pending_bills":       pendingBills,
		"recent_appointments": recentAppointments,
	})
}
