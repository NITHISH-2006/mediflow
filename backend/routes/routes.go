package routes

import (
	"mediflow/controllers"
	"mediflow/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRoutes registers all API routes on the given Gin engine.
func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api")

	// ─── Public routes ───────────────────────────────────────────────────────
	auth := api.Group("/auth")
	{
		auth.POST("/register", controllers.Register)
		auth.POST("/login", controllers.Login)
	}

	// ─── Protected routes (JWT required) ─────────────────────────────────────
	protected := api.Group("/")
	protected.Use(middleware.AuthRequired())
	{
		// Current user profile
		protected.GET("auth/me", controllers.Me)

		// Dashboard
		protected.GET("dashboard", controllers.DashboardStats)

		// Patients
		// GET  – any authenticated role (Admin, Doctor, Receptionist)
		// POST/PUT – Admin or Receptionist
		// DELETE   – Admin only
		patients := protected.Group("patients")
		{
			patients.GET("", controllers.GetPatients)
			patients.GET(":id", controllers.GetPatient)
			patients.POST("", middleware.RoleRequired("Admin", "Receptionist"), controllers.CreatePatient)
			patients.PUT(":id", middleware.RoleRequired("Admin", "Receptionist"), controllers.UpdatePatient)
			patients.DELETE(":id", middleware.RoleRequired("Admin"), controllers.DeletePatient)
		}

		// Doctors – Admin only for mutating operations
		doctors := protected.Group("doctors")
		{
			doctors.GET("", controllers.GetDoctors)
			doctors.GET(":id", controllers.GetDoctor)
			doctors.POST("", middleware.RoleRequired("Admin"), controllers.CreateDoctor)
			doctors.PUT(":id", middleware.RoleRequired("Admin"), controllers.UpdateDoctor)
			doctors.DELETE(":id", middleware.RoleRequired("Admin"), controllers.DeleteDoctor)
		}

		// Appointments
		// POST            – Admin / Receptionist only
		// GET (list/single/by-doctor/by-patient) – any authenticated role
		// PUT /:id/status – Admin, Receptionist, or Doctor (own only)
		// PUT /:id/cancel – Admin, Receptionist, or Doctor (own only)
		// DELETE          – Admin / Receptionist only
		appts := protected.Group("appointments")
		{
			appts.GET("", controllers.GetAppointments)
			appts.GET("doctor/:doctor_id", controllers.GetAppointmentsByDoctor)
			appts.GET("patient/:patient_id", controllers.GetAppointmentsByPatient)
			appts.GET(":id", controllers.GetAppointment)
			appts.POST("", middleware.RoleRequired("Admin", "Receptionist"), controllers.CreateAppointment)
			appts.PUT(":id/status", middleware.RoleRequired("Admin", "Receptionist", "Doctor"), controllers.UpdateStatus)
			appts.PUT(":id/cancel", middleware.RoleRequired("Admin", "Receptionist", "Doctor"), controllers.CancelAppointment)
			appts.DELETE(":id", middleware.RoleRequired("Admin", "Receptionist"), controllers.DeleteAppointment)
		}

		// EMR Notes
		// POST /api/emr          → Create EMR note (Doctor only)
		// GET  /api/emr/patient/:patient_id → Get all notes of a patient
		// GET  /api/emr/appointment/:appointment_id → Get note of an appointment
		// GET  /api/emr/:id      → Get single note
		emr := protected.Group("emr")
		{
			emr.GET("", controllers.GetEMRNotes)
			emr.GET("patient/:patient_id", controllers.GetEMRNotesByPatient)
			emr.GET("appointment/:appointment_id", controllers.GetEMRNoteByAppointment)
			emr.GET(":id", controllers.GetEMRNote)
			emr.POST("", middleware.RoleRequired("Doctor"), controllers.CreateEMRNote)
			emr.PUT(":id", middleware.RoleRequired("Doctor"), controllers.UpdateEMRNote)
			emr.DELETE(":id", middleware.RoleRequired("Admin"), controllers.DeleteEMRNote)
		}

		// Billing
		// POST /api/bills                    → Create bill (Receptionist / Admin)
		// GET  /api/bills                    → List all bills
		// GET  /api/bills/:id                → Get single bill
		// PUT  /api/bills/:id/status         → Update status (Receptionist / Admin)
		// GET  /api/bills/patient/:patient_id → Bills of a patient
		bills := protected.Group("bills")
		{
			bills.GET("", controllers.GetBills)
			bills.GET("patient/:patient_id", controllers.GetBillsByPatient)
			bills.GET(":id", controllers.GetBill)
			bills.POST("", middleware.RoleRequired("Admin", "Receptionist"), controllers.CreateBill)
			bills.PUT(":id/status", middleware.RoleRequired("Admin", "Receptionist"), controllers.UpdateBillStatus)
			bills.DELETE(":id", middleware.RoleRequired("Admin"), controllers.DeleteBill)
		}
	}
}
