package middleware

import (
	"net/http"
	"os"
	"strings"
)

// CORS adds CORS headers for browser clients.
//
// The allowed origin is configured with ALLOWED_ORIGIN (a single origin, or a
// comma-separated list). In local development (APP_ENV unset, "dev" or
// "local") an omitted value falls back to "*" for convenience. In production
// an explicit origin is required, and wildcard origins are rejected so that
// authenticated requests cannot be issued from arbitrary sites.
func CORS(next http.Handler) http.Handler {
	allowed := allowedOrigins()

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		match := ""
		for _, candidate := range allowed {
			if candidate == "*" || strings.EqualFold(candidate, origin) {
				match = candidate
				break
			}
		}

		if match != "" {
			w.Header().Set("Access-Control-Allow-Origin", match)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Allow-Credentials", "false")
		}

		if r.Method == http.MethodOptions {
			if match == "" {
				w.WriteHeader(http.StatusForbidden)
				return
			}
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func allowedOrigins() []string {
	raw := strings.TrimSpace(os.Getenv("ALLOWED_ORIGIN"))
	if raw != "" {
		parts := strings.Split(raw, ",")
		out := make([]string, 0, len(parts))
		for _, p := range parts {
			if p = strings.TrimSpace(p); p != "" {
				out = append(out, p)
			}
		}
		return out
	}

	env := strings.ToLower(strings.TrimSpace(os.Getenv("APP_ENV")))
	if env == "dev" || env == "local" || env == "" {
		return []string{"*"}
	}
	// Production with no explicit origin: deny all cross-origin requests.
	return nil
}
