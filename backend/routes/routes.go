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
		appts := protected.Group("appointments")
		{
			appts.GET("", controllers.GetAppointments)
			appts.GET(":id", controllers.GetAppointment)
			appts.POST("", controllers.CreateAppointment)
			appts.PUT(":id", controllers.UpdateAppointment)
			appts.DELETE(":id", middleware.RoleRequired("Admin", "Receptionist"), controllers.DeleteAppointment)
		}

		// EMR Notes – Doctor and Admin
		emr := protected.Group("emr")
		{
			emr.GET("", controllers.GetEMRNotes)
			emr.GET("patient/:patient_id", controllers.GetEMRNotesByPatient)
			emr.GET(":id", controllers.GetEMRNote)
			emr.POST("", middleware.RoleRequired("Admin", "Doctor"), controllers.CreateEMRNote)
			emr.PUT(":id", middleware.RoleRequired("Admin", "Doctor"), controllers.UpdateEMRNote)
			emr.DELETE(":id", middleware.RoleRequired("Admin"), controllers.DeleteEMRNote)
		}

		// Billing
		bills := protected.Group("bills")
		{
			bills.GET("", controllers.GetBills)
			bills.GET(":id", controllers.GetBill)
			bills.POST("", middleware.RoleRequired("Admin", "Receptionist"), controllers.CreateBill)
			bills.PUT(":id", middleware.RoleRequired("Admin", "Receptionist"), controllers.UpdateBill)
			bills.DELETE(":id", middleware.RoleRequired("Admin"), controllers.DeleteBill)
		}
	}
}
