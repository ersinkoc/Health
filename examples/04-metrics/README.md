# Metrics Examples

## prometheus.ts

Expose Prometheus-compatible metrics.

```bash
npx tsx examples/04-metrics/prometheus.ts
```

## grafana-dashboard.json

Example Grafana dashboard configuration.

### Prometheus Metrics Format

```
# HELP health_check_status Current health check status (1=healthy, 0=unhealthy)
# TYPE health_check_status gauge
health_check_status{name="database"} 1
health_check_status{name="redis"} 0

# HELP health_check_latency_ms Health check latency in milliseconds
# TYPE health_check_latency_ms gauge
health_check_latency_ms{name="database"} 5

# HELP health_score Current health score (0-100)
# TYPE health_score gauge
health_score 70

# HELP health_uptime_seconds Server uptime in seconds
# TYPE health_uptime_seconds counter
health_uptime_seconds 3600
```
