package governance

import (
	"cloudops-sentinel/internal/db"
)

// LogAudit inserts an audit log entry.
func LogAudit(userID int, action, resourceType, resourceID, details string) {
	db.DB.Exec(
		"INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES ($1,$2,$3,$4,$5)",
		userID, action, resourceType, resourceID, details,
	)
}
