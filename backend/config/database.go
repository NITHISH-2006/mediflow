package config

import (
	"fmt"
	"log"
	"os"

	"mediflow/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// ConnectDB initialises the PostgreSQL connection and auto-migrates all models.
func ConnectDB() {
	var dsn string
	if url := os.Getenv("DATABASE_URL"); url != "" {
		dsn = url
	} else if url := os.Getenv("INTERNAL_DB_URL"); url != "" {
		dsn = url
	} else {
		dsn = fmt.Sprintf(
			"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC",
			os.Getenv("DB_HOST"),
			os.Getenv("DB_USER"),
			os.Getenv("DB_PASSWORD"),
			os.Getenv("DB_NAME"),
			os.Getenv("DB_PORT"),
		)
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("❌  Failed to connect to database: %v", err)
	}

	log.Println("✅  Database connection established")

	// Auto-migrate all models in dependency order
	err = db.AutoMigrate(
		&models.User{},
		&models.Patient{},
		&models.Doctor{},
		&models.Appointment{},
		&models.EMRNote{},
		&models.Bill{},
	)
	if err != nil {
		log.Fatalf("❌  AutoMigrate failed: %v", err)
	}

	log.Println("✅  Database migrated successfully")
	DB = db
}
