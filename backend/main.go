package main

import (
	"log"
	"os"
	"time"

	"mediflow/config"
	"mediflow/routes"
	"mediflow/seed"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from .env (ignored in production if not present)
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️   No .env file found – using system environment")
	}

	// Connect to PostgreSQL and auto-migrate models
	config.ConnectDB()

	// Seed demo data (only runs when DB is empty)
	seed.Run()

	// Set Gin mode based on environment
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// ── CORS ─────────────────────────────────────────────────────────────────
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173", "http://localhost:5174"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))


	// ── API routes ────────────────────────────────────────────────────────────
	routes.SetupRoutes(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🏥  MediFlow Backend running on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("❌  Server failed to start: %v", err)
	}
}
