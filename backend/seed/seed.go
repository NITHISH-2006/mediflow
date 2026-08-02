package seed

import (
	"fmt"
	"log"
	"time"

	"mediflow/config"
	"mediflow/models"

	"golang.org/x/crypto/bcrypt"
)

// Run inserts mock data for testing and demonstration if the database has no users.
func Run() {
	var count int64
	config.DB.Model(&models.User{}).Count(&count)
	if count > 0 {
		log.Println("ℹ️   Seed skipped – data already exists")
		return
	}

	log.Println("🌱  Seeding demo database with full dataset...")

	// Helper function to hash passwords
	hash := func(pw string) string {
		b, _ := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
		return string(b)
	}

	// ── 1. Create Users ───────────────────────────────────────────────────
	adminUser := models.User{Name: "System Admin", Email: "admin@mediflow.com", Password: hash("admin123"), Role: models.RoleAdmin}
	config.DB.Create(&adminUser)

	recep1 := models.User{Name: "Receptionist Joe", Email: "joe@mediflow.com", Password: hash("recep123"), Role: models.RoleReceptionist}
	recep2 := models.User{Name: "Receptionist Mary", Email: "mary@mediflow.com", Password: hash("recep123"), Role: models.RoleReceptionist}
	config.DB.Create(&recep1)
	config.DB.Create(&recep2)

	docU1 := models.User{Name: "Dr. Sarah Connor", Email: "sarah@mediflow.com", Password: hash("doctor123"), Role: models.RoleDoctor}
	docU2 := models.User{Name: "Dr. Gregory House", Email: "gregory@mediflow.com", Password: hash("doctor123"), Role: models.RoleDoctor}
	docU3 := models.User{Name: "Dr. Stephen Strange", Email: "stephen@mediflow.com", Password: hash("doctor123"), Role: models.RoleDoctor}
	docU4 := models.User{Name: "Dr. John Watson", Email: "john@mediflow.com", Password: hash("doctor123"), Role: models.RoleDoctor}
	config.DB.Create(&docU1)
	config.DB.Create(&docU2)
	config.DB.Create(&docU3)
	config.DB.Create(&docU4)

	// ── 2. Create Doctor Profiles ─────────────────────────────────────────
	d1 := models.Doctor{Name: docU1.Name, Specialization: "Cardiology", Phone: "555-0101", UserID: docU1.ID}
	d2 := models.Doctor{Name: docU2.Name, Specialization: "Nephrology", Phone: "555-0102", UserID: docU2.ID}
	d3 := models.Doctor{Name: docU3.Name, Specialization: "Neurosurgery", Phone: "555-0103", UserID: docU3.ID}
	d4 := models.Doctor{Name: docU4.Name, Specialization: "General Medicine", Phone: "555-0104", UserID: docU4.ID}
	config.DB.Create(&d1)
	config.DB.Create(&d2)
	config.DB.Create(&d3)
	config.DB.Create(&d4)

	// ── 3. Create Patients (10) ───────────────────────────────────────────
	patients := []models.Patient{
		{Name: "John Doe", Age: 45, Gender: "Male", Phone: "555-0201", Address: "123 Main St"},
		{Name: "Jane Smith", Age: 32, Gender: "Female", Phone: "555-0202", Address: "456 Oak Ave"},
		{Name: "Robert Paulson", Age: 50, Gender: "Male", Phone: "555-0203", Address: "789 Pine Rd"},
		{Name: "Alice Cooper", Age: 71, Gender: "Female", Phone: "555-0204", Address: "111 Rock St"},
		{Name: "Bob Dylan", Age: 80, Gender: "Male", Phone: "555-0205", Address: "222 Folk Rd"},
		{Name: "Carol Danvers", Age: 29, Gender: "Female", Phone: "555-0206", Address: "333 Space Way"},
		{Name: "David Banner", Age: 42, Gender: "Male", Phone: "555-0207", Address: "444 Gamma Blvd"},
		{Name: "Emma Watson", Age: 31, Gender: "Female", Phone: "555-0208", Address: "555 Magic Ln"},
		{Name: "Frank Castle", Age: 39, Gender: "Male", Phone: "555-0209", Address: "666 Punisher Dr"},
		{Name: "Grace Hopper", Age: 85, Gender: "Female", Phone: "555-0210", Address: "777 Cobol Way"},
	}
	for i := range patients {
		config.DB.Create(&patients[i])
	}

	// ── 4. Create Appointments (15) ───────────────────────────────────────
	today := time.Now().Format("2006-01-02")
	yesterday := time.Now().AddDate(0, 0, -1).Format("2006-01-02")
	tomorrow := time.Now().AddDate(0, 0, 1).Format("2006-01-02")

	appts := []models.Appointment{
		// Today's appointments (Scheduled)
		{PatientID: patients[0].ID, DoctorID: d1.ID, Date: today, Time: "09:00", Status: models.StatusScheduled, Reason: "Follow-up Cardiology check"},
		{PatientID: patients[1].ID, DoctorID: d2.ID, Date: today, Time: "10:30", Status: models.StatusScheduled, Reason: "Kidney pain Consultation"},
		{PatientID: patients[2].ID, DoctorID: d4.ID, Date: today, Time: "11:00", Status: models.StatusScheduled, Reason: "Flu symptoms"},
		// Today's appointments (Completed)
		{PatientID: patients[3].ID, DoctorID: d3.ID, Date: today, Time: "08:30", Status: models.StatusCompleted, Reason: "Post-surgery evaluation"},
		{PatientID: patients[4].ID, DoctorID: d4.ID, Date: today, Time: "13:00", Status: models.StatusCompleted, Reason: "Annual wellness checkup"},
		// Today's appointments (Cancelled)
		{PatientID: patients[5].ID, DoctorID: d1.ID, Date: today, Time: "15:00", Status: models.StatusCancelled, Reason: "Schedule conflict"},

		// Past Appointments (Completed / Cancelled)
		{PatientID: patients[6].ID, DoctorID: d4.ID, Date: yesterday, Time: "10:00", Status: models.StatusCompleted, Reason: "Mild hypertension management"},
		{PatientID: patients[7].ID, DoctorID: d2.ID, Date: yesterday, Time: "11:30", Status: models.StatusCompleted, Reason: "Urinary tract concern"},
		{PatientID: patients[8].ID, DoctorID: d3.ID, Date: yesterday, Time: "14:00", Status: models.StatusCancelled, Reason: "No-show"},

		// Future Appointments (Scheduled)
		{PatientID: patients[9].ID, DoctorID: d1.ID, Date: tomorrow, Time: "09:30", Status: models.StatusScheduled, Reason: "Cardiac arrhythmia review"},
		{PatientID: patients[0].ID, DoctorID: d2.ID, Date: tomorrow, Time: "10:00", Status: models.StatusScheduled, Reason: "Regular dialysis planning"},
		{PatientID: patients[1].ID, DoctorID: d3.ID, Date: tomorrow, Time: "11:00", Status: models.StatusScheduled, Reason: "Migraine consultation"},
		{PatientID: patients[2].ID, DoctorID: d4.ID, Date: tomorrow, Time: "12:00", Status: models.StatusScheduled, Reason: "Prescription renewal"},
		{PatientID: patients[3].ID, DoctorID: d1.ID, Date: tomorrow, Time: "14:00", Status: models.StatusScheduled, Reason: "Preventative Cardiology"},
		{PatientID: patients[4].ID, DoctorID: d2.ID, Date: tomorrow, Time: "15:30", Status: models.StatusScheduled, Reason: "Renal profile review"},
	}
	for i := range appts {
		config.DB.Create(&appts[i])
	}

	// ── 5. Create EMR Notes ───────────────────────────────────────────────
	emrs := []models.EMRNote{
		{
			PatientID:     patients[3].ID, // Alice Cooper
			DoctorID:      d3.ID,          // Strange
			AppointmentID: appts[3].ID,    // Completed checkup
			Notes:         "Surgical incision has healed cleanly. Reflexes are normal.",
			Diagnosis:     "Successful post-craniotomy recovery",
			Prescription:  "Continue regular physical therapy, pain medication as needed.",
		},
		{
			PatientID:     patients[4].ID, // Bob Dylan
			DoctorID:      d4.ID,          // Watson
			AppointmentID: appts[4].ID,    // Completed wellness check
			Notes:         "General health is good for patient age. Clear lungs and stable heart rate.",
			Diagnosis:     "Age-appropriate healthy status",
			Prescription:  "Daily multivitamin, low-sodium diet, regular light walking.",
		},
		{
			PatientID:     patients[6].ID, // David Banner
			DoctorID:      d4.ID,          // Watson
			AppointmentID: appts[6].ID,    // Yesterday completed
			Notes:         "Blood pressure slightly elevated at 145/90. Recommended lifestyle modifications.",
			Diagnosis:     "Stage 1 Essential Hypertension",
			Prescription:  "Lisinopril 10mg once daily in the morning.",
		},
		{
			PatientID:     patients[7].ID, // Emma Watson
			DoctorID:      d2.ID,          // House
			AppointmentID: appts[7].ID,    // Yesterday completed
			Notes:         "Patient presented with dysuria and frequent urination.",
			Diagnosis:     "Acute Cystitis (UTI)",
			Prescription:  "Ciprofloxacin 500mg twice daily for 5 days. Increase fluid intake.",
		},
	}
	for i := range emrs {
		config.DB.Create(&emrs[i])
	}

	// ── 6. Create Bills (Pending & Paid) ──────────────────────────────────
	bills := []models.Bill{
		{PatientID: patients[3].ID, AppointmentID: appts[3].ID, Amount: 450.00, Status: models.BillPaid, PaymentMethod: "Insurance"},
		{PatientID: patients[4].ID, AppointmentID: appts[4].ID, Amount: 120.00, Status: models.BillPaid, PaymentMethod: "Credit Card"},
		{PatientID: patients[6].ID, AppointmentID: appts[6].ID, Amount: 85.00, Status: models.BillPaid, PaymentMethod: "Cash"},
		{PatientID: patients[7].ID, AppointmentID: appts[7].ID, Amount: 190.00, Status: models.BillPending, PaymentMethod: ""},

		// Pending bills for today's scheduled visits (unsettled)
		{PatientID: patients[0].ID, AppointmentID: appts[0].ID, Amount: 200.00, Status: models.BillPending, PaymentMethod: ""},
		{PatientID: patients[1].ID, AppointmentID: appts[1].ID, Amount: 350.00, Status: models.BillPending, PaymentMethod: ""},
		{PatientID: patients[2].ID, AppointmentID: appts[2].ID, Amount: 95.00, Status: models.BillPending, PaymentMethod: ""},
	}
	for i := range bills {
		config.DB.Create(&bills[i])
	}

	log.Println("✅  Database seeding completed successfully.")
	log.Printf("   Seeded: 7 Users, 4 Doctor Profiles, 10 Patients, 15 Appointments, 4 EMR Notes, 7 Bills.")
	fmt.Println("\n🏥  MediFlow Demo Accounts:")
	fmt.Println("   - Admin:         admin@mediflow.com  / admin123")
	fmt.Println("   - Receptionist:  joe@mediflow.com    / recep123")
	fmt.Println("   - Doctor:        sarah@mediflow.com  / doctor123")
	fmt.Println()
}
