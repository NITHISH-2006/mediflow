package seed

import (
	"log"

	"mediflow/config"
	"mediflow/models"

	"golang.org/x/crypto/bcrypt"
)

// Run inserts demo data if the users table is empty.
func Run() {
	var count int64
	config.DB.Model(&models.User{}).Count(&count)
	if count > 0 {
		log.Println("ℹ️   Seed skipped – data already exists")
		return
	}

	log.Println("🌱  Seeding demo data...")

	// ── Users ─────────────────────────────────────────────────────────────
	hash := func(pw string) string {
		b, _ := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
		return string(b)
	}

	admin := models.User{Name: "Admin User", Email: "admin@mediflow.com", Password: hash("admin123"), Role: models.RoleAdmin}
	docUser := models.User{Name: "Dr. Sarah Connor", Email: "sarah@mediflow.com", Password: hash("doctor123"), Role: models.RoleDoctor}
	recUser := models.User{Name: "Receptionist Joe", Email: "joe@mediflow.com", Password: hash("recep123"), Role: models.RoleReceptionist}

	config.DB.Create(&admin)
	config.DB.Create(&docUser)
	config.DB.Create(&recUser)

	// ── Doctor profile ────────────────────────────────────────────────────
	doctor := models.Doctor{Name: "Dr. Sarah Connor", Specialization: "Cardiology", Phone: "555-0100", UserID: docUser.ID}
	config.DB.Create(&doctor)

	// ── Patients ──────────────────────────────────────────────────────────
	p1 := models.Patient{Name: "John Doe", Age: 45, Gender: "Male", Phone: "555-0201", Address: "123 Main St"}
	p2 := models.Patient{Name: "Jane Smith", Age: 32, Gender: "Female", Phone: "555-0202", Address: "456 Oak Ave"}
	config.DB.Create(&p1)
	config.DB.Create(&p2)

	// ── Appointments ──────────────────────────────────────────────────────
	appt := models.Appointment{
		PatientID: p1.ID,
		DoctorID:  doctor.ID,
		Date:      "2026-08-10",
		Time:      "10:00",
		Status:    models.StatusScheduled,
		Reason:    "Routine checkup",
	}
	config.DB.Create(&appt)

	// ── Bill ──────────────────────────────────────────────────────────────
	bill := models.Bill{
		PatientID:     p1.ID,
		AppointmentID: appt.ID,
		Amount:        150.00,
		Status:        models.BillPending,
		PaymentMethod: "Cash",
	}
	config.DB.Create(&bill)

	log.Println("✅  Seed complete")
	log.Println("   📧  admin@mediflow.com  / admin123")
	log.Println("   📧  sarah@mediflow.com  / doctor123")
	log.Println("   📧  joe@mediflow.com    / recep123")
}
