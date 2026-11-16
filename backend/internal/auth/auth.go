package auth

import (
    "context"
    "net/http"
    "strings"
    "time"

    "github.com/golang-jwt/jwt/v5"
)

type key int

const (
    userKey key = iota
)

type Claims struct {
    UserID string `json:"sub"`
    Role   string `json:"role"`
    jwt.RegisteredClaims
}

var jwtSecret = []byte("ReplaceWithStrongSecret")

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
        tokenStr := parts[1]
        token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
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

// FromContext extracts Claims from request context.
func FromContext(ctx context.Context) (*Claims, bool) {
    claims, ok := ctx.Value(userKey).(*Claims)
    return claims, ok
}
