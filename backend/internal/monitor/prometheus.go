package monitor

import (
	"net/http"
	"strconv"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	HttpRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "path", "status"},
	)
	HttpRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "HTTP request duration in seconds",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "path"},
	)
	ActiveDeployments = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "cloudops_active_deployments",
			Help: "Number of currently active deployments",
		},
	)
	SecurityVulnerabilities = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "cloudops_security_vulnerabilities_total",
			Help: "Total open security vulnerabilities by severity",
		},
		[]string{"severity"},
	)
)

func init() {
	prometheus.MustRegister(HttpRequestsTotal)
	prometheus.MustRegister(HttpRequestDuration)
	prometheus.MustRegister(ActiveDeployments)
	prometheus.MustRegister(SecurityVulnerabilities)
}

// PrometheusMiddleware instruments every HTTP request.
type statusWriter struct {
	http.ResponseWriter
	statusCode int
}

func (sw *statusWriter) WriteHeader(code int) {
	sw.statusCode = code
	sw.ResponseWriter.WriteHeader(code)
}

func PrometheusMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Don't instrument the metrics endpoint itself
		if r.URL.Path == "/metrics" {
			next.ServeHTTP(w, r)
			return
		}

		timer := prometheus.NewTimer(HttpRequestDuration.WithLabelValues(r.Method, r.URL.Path))
		sw := &statusWriter{ResponseWriter: w, statusCode: http.StatusOK}
		next.ServeHTTP(sw, r)
		timer.ObserveDuration()
		HttpRequestsTotal.WithLabelValues(r.Method, r.URL.Path, strconv.Itoa(sw.statusCode)).Inc()
	})
}

// MetricsHandler returns the Prometheus metrics handler.
func MetricsHandler() http.Handler {
	return promhttp.Handler()
}
