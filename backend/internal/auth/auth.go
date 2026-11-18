package auth

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type key int

const (
	userKey key = iota
)

// defaultJWTSecret is a deliberately obvious, local-development-only fallback.
// A real deployment must set JWT_SECRET in the environment.
const defaultJWTSecret = "local-dev-only-secret-change-me-before-production"

// jwtSecret is resolved once at package init from the environment so local
// development and the Docker Compose stack can override it without rebuilding.
var jwtSecret = loadJWTSecret()

// loadJWTSecret reads the signing key from JWT_SECRET. In production (APP_ENV
// not equal to "dev"/"local") a missing or weak secret is a hard failure so the
// service can never start with the well-known development key.
func loadJWTSecret() []byte {
	secret := strings.TrimSpace(os.Getenv("JWT_SECRET"))
	if secret != "" {
		if env := strings.ToLower(strings.TrimSpace(os.Getenv("APP_ENV"))); env != "dev" && env != "local" && env != "" && len(secret) < 32 {
			panic("JWT_SECRET must be at least 32 characters in non-development environments")
		}
		return []byte(secret)
	}

	env := strings.ToLower(strings.TrimSpace(os.Getenv("APP_ENV")))
	if env == "dev" || env == "local" || env == "" {
		return []byte(defaultJWTSecret)
	}
	panic("JWT_SECRET must be set in production (APP_ENV=" + env + ")")
}

// JWTSecret exposes a copy of the active signing key (useful for tooling/tests).
func JWTSecret() []byte {
	out := make([]byte, len(jwtSecret))
	copy(out, jwtSecret)
	return out
}

type Claims struct {
	UserID string `json:"sub"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// GenerateToken creates a JWT for a given user ID and role.
func GenerateToken(userID, role string) (string, error) {
	claims := Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// Middleware validates JWT and injects user info into request context.
func Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "missing auth token", http.StatusUnauthorized)
			return
		}
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			http.Error(w, "invalid auth header", http.StatusUnauthorized)
			return
		}
		tokenStr := strings.TrimSpace(parts[1])
		token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
			// Only HMAC-SHA256 is accepted; prevents algorithm confusion attacks.
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
			}
			return jwtSecret, nil
		})
		if err != nil || !token.Valid {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}
		claims, ok := token.Claims.(*Claims)
		if !ok {
			http.Error(w, "invalid claims", http.StatusUnauthorized)
			return
		}
		ctx := context.WithValue(r.Context(), userKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireRole returns middleware that gates a route by the role stored in the
// verified JWT. The built-in "admin" role always passes; every other role must
// appear in the explicit allow-list. This is the RBAC counterpart of an AWS
// IAM policy Allow statement attached to a principal.
func RequireRole(allowed ...string) func(http.Handler) http.Handler {
	allow := make(map[string]struct{}, len(allowed))
	for _, role := range allowed {
		allow[strings.ToLower(strings.TrimSpace(role))] = struct{}{}
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := FromContext(r.Context())
			if !ok {
				http.Error(w, "not authenticated", http.StatusUnauthorized)
				return
			}
			role := strings.ToLower(strings.TrimSpace(claims.Role))
			if role == "admin" {
				next.ServeHTTP(w, r)
				return
			}
			if _, ok := allow[role]; ok {
				next.ServeHTTP(w, r)
				return
			}
			http.Error(w, "forbidden: role "+claims.Role+" is not permitted for this action", http.StatusForbidden)
		})
	}
}

// RequireMutate is the role gate for state-changing endpoints (POST/PUT/DELETE).
// Admins and editors may write; viewers are read-only.
func RequireMutate() func(http.Handler) http.Handler {
	return RequireRole("editor")
}

// FromContext extracts Claims from request context.
func FromContext(ctx context.Context) (*Claims, bool) {
	claims, ok := ctx.Value(userKey).(*Claims)
	return claims, ok
}
