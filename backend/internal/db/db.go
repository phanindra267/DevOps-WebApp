package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func Init() error {
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	if port == "" {
		port = "5432"
	}
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")

	// sslmode is configurable so RDS deployments can require TLS. Local
	// development keeps the permissive default.
	sslMode := os.Getenv("DB_SSLMODE")
	if sslMode == "" {
		sslMode = "disable"
	}
	if strings.EqualFold(os.Getenv("APP_ENV"), "prod") && sslMode == "disable" {
		log.Printf("WARNING: DB_SSLMODE=disable in production; set DB_SSLMODE=require for RDS")
	}

	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, dbname, sslMode,
	)

	var err error
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		return fmt.Errorf("sql open: %w", err)
	}
	DB.SetMaxOpenConns(25)
	DB.SetMaxIdleConns(5)

	if err = DB.Ping(); err != nil {
		return fmt.Errorf("db ping: %w", err)
	}
	log.Println("Connected to PostgreSQL")

	if err = RunMigrations(DB); err != nil {
		return fmt.Errorf("migrations: %w", err)
	}
	log.Println("Database migrations complete")
	return nil
}
