package utils

import "github.com/gin-gonic/gin"

// RespondSuccess sends a 200-range JSON response.
func RespondSuccess(c *gin.Context, code int, data interface{}) {
	c.JSON(code, gin.H{"success": true, "data": data})
}

// RespondError sends an error JSON response.
func RespondError(c *gin.Context, code int, message string) {
	c.AbortWithStatusJSON(code, gin.H{"success": false, "error": message})
}
