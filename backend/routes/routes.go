package routes

import (
	"net/http"

	"mediflow/controllers"
	"mediflow/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRoutes registers all API routes on the given Gin engine.
func SetupRoutes(r *gin.Engine) {
	// Base API Group
	api := r.Group("/api")

	// ─── Public Routes ───────────────────────────────────────────────────────
	
	// Health Check: GET /api/health
	api.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "MediFlow Hospital Management API",
			"time":    http.TimeFormat,
		})
	})

	// Auth Group (Register/Login)
	auth := api.Group("/auth")
	{
		auth.POST("/register", controllers.Register)
		auth.POST("/login", controllers.Login)
	}

	// ─── Protected Routes (JWT Authentication Required) ──────────────────────
	protected := api.Group("/")
	protected.Use(middleware.AuthRequired())
	{
		// Current Auth User: GET /api/auth/me
		protected.GET("auth/me", controllers.Me)

		// Dashboard Stats: GET /api/dashboard/stats (All authenticated users can view stats)
		protected.GET("dashboard/stats", controllers.DashboardStats)

		// ─── Patient Management ───
		// GET  /api/patients          → List all patients (All auth users)
		// GET  /api/patients/:id      → Get single patient (All auth users)
		// POST /api/patients          → Create patient (Receptionist + Admin)
		// PUT  /api/patients/:id      → Update patient (Receptionist + Admin)
		// DELETE /api/patients/:id    → Delete patient (Admin only)
		patients := protected.Group("patients")
		{
			patients.GET("", controllers.GetPatients)
			patients.GET("/:id", controllers.GetPatient)
			patients.POST("", middleware.RoleRequired("Admin", "Receptionist"), controllers.CreatePatient)
			patients.PUT("/:id", middleware.RoleRequired("Admin", "Receptionist"), controllers.UpdatePatient)
			patients.DELETE("/:id", middleware.RoleRequired("Admin"), controllers.DeletePatient)
		}

		// ─── Doctor Management ───
		// GET  /api/doctors           → List all doctors (All auth users)
		// GET  /api/doctors/:id       → Get single doctor (All auth users)
		// POST /api/doctors           → Create doctor (Admin only)
		// PUT  /api/doctors/:id       → Update doctor (Admin only)
		// DELETE /api/doctors/:id     → Delete doctor (Admin only)
		doctors := protected.Group("doctors")
		{
			doctors.GET("", controllers.GetDoctors)
			doctors.GET("/:id", controllers.GetDoctor)
			doctors.POST("", middleware.RoleRequired("Admin"), controllers.CreateDoctor)
			doctors.PUT("/:id", middleware.RoleRequired("Admin"), controllers.UpdateDoctor)
			doctors.DELETE("/:id", middleware.RoleRequired("Admin"), controllers.DeleteDoctor)
		}

		// ─── Appointment Management ───
		// GET  /api/appointments                    → List all appointments with filters
		// GET  /api/appointments/:id                → Get single appointment
		// GET  /api/appointments/doctor/:doctor_id  → Get appointments of a doctor
		// GET  /api/appointments/patient/:patient_id → Get appointments of a patient
		// POST /api/appointments                    → Create appointment (Receptionist + Admin)
		// PUT  /api/appointments/:id/status         → Update status (Admin, Receptionist, or Doctor for own appointment)
		// PUT  /api/appointments/:id/cancel         → Cancel appointment (Admin, Receptionist, or Doctor for own appointment)
		// DELETE /api/appointments/:id              → Delete appointment (Receptionist + Admin)
		appts := protected.Group("appointments")
		{
			appts.GET("", controllers.GetAppointments)
			appts.GET("/doctor/:doctor_id", controllers.GetAppointmentsByDoctor)
			appts.GET("/patient/:patient_id", controllers.GetAppointmentsByPatient)
			appts.GET("/:id", controllers.GetAppointment)
			appts.POST("", middleware.RoleRequired("Admin", "Receptionist"), controllers.CreateAppointment)
			appts.PUT("/:id/status", middleware.RoleRequired("Admin", "Receptionist", "Doctor"), controllers.UpdateStatus)
			appts.PUT("/:id/cancel", middleware.RoleRequired("Admin", "Receptionist", "Doctor"), controllers.CancelAppointment)
			appts.DELETE("/:id", middleware.RoleRequired("Admin", "Receptionist"), controllers.DeleteAppointment)
		}

		// ─── EMR Notes ───
		// POST /api/emr                            → Create EMR note (Doctor only)
		// GET  /api/emr/patient/:patient_id        → Get all notes of a patient (All auth users)
		// GET  /api/emr/appointment/:appointment_id → Get note of an appointment (All auth users)
		// GET  /api/emr/:id                        → Get single note (All auth users)
		emr := protected.Group("emr")
		{
			emr.GET("", controllers.GetEMRNotes)
			emr.GET("/patient/:patient_id", controllers.GetEMRNotesByPatient)
			emr.GET("/appointment/:appointment_id", controllers.GetEMRNoteByAppointment)
			emr.GET("/:id", controllers.GetEMRNote)
			emr.POST("", middleware.RoleRequired("Doctor"), controllers.CreateEMRNote)
			emr.PUT("/:id", middleware.RoleRequired("Doctor"), controllers.UpdateEMRNote)
			emr.DELETE("/:id", middleware.RoleRequired("Admin"), controllers.DeleteEMRNote)
		}

		// ─── Billing Management ───
		// POST /api/bills                    → Create bill (Receptionist / Admin)
		// GET  /api/bills                    → List all bills (All auth users)
		// GET  /api/bills/:id                → Get single bill (All auth users)
		// PUT  /api/bills/:id/status         → Update payment status (Receptionist / Admin)
		// GET  /api/bills/patient/:patient_id → Bills of a patient (All auth users)
		bills := protected.Group("bills")
		{
			bills.GET("", controllers.GetBills)
			bills.GET("/patient/:patient_id", controllers.GetBillsByPatient)
			bills.GET("/:id", controllers.GetBill)
			bills.POST("", middleware.RoleRequired("Admin", "Receptionist"), controllers.CreateBill)
			bills.PUT("/:id/status", middleware.RoleRequired("Admin", "Receptionist"), controllers.UpdateBillStatus)
			bills.DELETE("/:id", middleware.RoleRequired("Admin"), controllers.DeleteBill)
		}
	}
}
