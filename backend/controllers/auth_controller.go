package controllers

import (
	"net/http"

	"mediflow/config"
	"mediflow/models"
	"mediflow/utils"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// RegisterInput is the request body for user registration.
type RegisterInput struct {
	Name     string      `json:"name" binding:"required"`
	Email    string      `json:"email" binding:"required,email"`
	Password string      `json:"password" binding:"required,min=6"`
	Role     models.Role `json:"role"`
}

// LoginInput is the request body for authentication.
type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Register creates a new user account.
// POST /api/auth/register
func Register(c *gin.Context) {
	var input RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Default role
	if input.Role == "" {
		input.Role = models.RoleReceptionist
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	user := models.User{
		Name:     input.Name,
		Email:    input.Email,
		Password: string(hash),
		Role:     input.Role,
	}

	if err := config.DB.Create(&user).Error; err != nil {
		utils.RespondError(c, http.StatusConflict, "Email already registered")
		return
	}

	token, err := utils.GenerateToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	utils.RespondSuccess(c, http.StatusCreated, gin.H{
		"token": token,
		"user": gin.H{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

// Login authenticates a user and returns a JWT.
// POST /api/auth/login
func Login(c *gin.Context) {
	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	var user models.User
	if err := config.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	token, err := utils.GenerateToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

// Me returns the profile of the currently authenticated user.
// GET /api/auth/me
func Me(c *gin.Context) {
	userID, _ := c.Get("userID")

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "User not found")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"id":         user.ID,
		"name":       user.Name,
		"email":      user.Email,
		"role":       user.Role,
		"created_at": user.CreatedAt,
	})
}
