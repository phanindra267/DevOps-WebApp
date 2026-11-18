FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /cloudops-backend ./cmd/server/main.go

# Runtime base image is already available locally. The static Go binary needs
# no extra packages, so we avoid `apk add` to keep rebuilds fully offline.
FROM alpine:latest
WORKDIR /app
COPY --from=builder /cloudops-backend .
EXPOSE 8080
CMD ["./cloudops-backend"]
