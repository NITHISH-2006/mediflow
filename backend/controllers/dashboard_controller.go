package controllers

import (
	"net/http"
	"time"

	"mediflow/config"
	"mediflow/models"
	"mediflow/utils"

	"github.com/gin-gonic/gin"
)

// DashboardStats returns high-level hospital statistics.
// GET /api/dashboard/stats
func DashboardStats(c *gin.Context) {
	var totalPatients int64
	var totalDoctors int64
	var todayAppointments int64
	var pendingBills int64
	var completedAppointmentsToday int64
	var revenue float64

	todayStr := time.Now().Format("2006-01-02")

	// Total patients
	config.DB.Model(&models.Patient{}).Count(&totalPatients)

	// Total doctors
	config.DB.Model(&models.Doctor{}).Count(&totalDoctors)

	// Today's appointments (all statuses scheduled for today)
	config.DB.Model(&models.Appointment{}).Where("date = ?", todayStr).Count(&todayAppointments)

	// Pending bills
	config.DB.Model(&models.Bill{}).Where("status = ?", models.BillPending).Count(&pendingBills)

	// Completed appointments today
	config.DB.Model(&models.Appointment{}).Where("date = ? AND status = ?", todayStr, models.StatusCompleted).Count(&completedAppointmentsToday)

	// Revenue (sum of paid bills)
	config.DB.Model(&models.Bill{}).Where("status = ?", models.BillPaid).Select("COALESCE(SUM(amount), 0)").Scan(&revenue)

	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"total_patients":               totalPatients,
		"total_doctors":                totalDoctors,
		"today_appointments":           todayAppointments,
		"pending_bills":                pendingBills,
		"completed_appointments_today": completedAppointmentsToday,
		"revenue":                      revenue,
	})
}
