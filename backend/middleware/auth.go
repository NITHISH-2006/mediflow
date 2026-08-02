package middleware

import (
	"strings"

	"mediflow/utils"

	"github.com/gin-gonic/gin"
)

// AuthRequired validates the Bearer JWT in the Authorization header.
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			utils.RespondError(c, 401, "Authorization header missing or malformed")
			return
		}

		tokenStr := strings.TrimPrefix(header, "Bearer ")
		claims, err := utils.ParseToken(tokenStr)
		if err != nil {
			utils.RespondError(c, 401, "Invalid or expired token")
			return
		}

		// Store claims in context for downstream handlers
		c.Set("userID", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)
		c.Next()
	}
}

// RoleRequired ensures the authenticated user has one of the allowed roles.
func RoleRequired(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			utils.RespondError(c, 403, "Forbidden: no role found")
			return
		}

		roleStr, _ := role.(string)
		for _, r := range roles {
			if roleStr == r {
				c.Next()
				return
			}
		}

		utils.RespondError(c, 403, "Forbidden: insufficient permissions")
	}
}
