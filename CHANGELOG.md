# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-15

### Added

- Initial release of @oxog/health
- Zero-dependency HTTP health server
- Kubernetes-compatible liveness and readiness probes
- Custom health checks with timeout and retry support
- Graceful degradation with health scoring
- Prometheus-compatible metrics
- CLI interface for serving and checking
- Plugin architecture with micro-kernel design
- 100% TypeScript with strict mode
- Comprehensive test suite with 100% coverage

### Core Features

- `health.serve()` - Start health server
- `health.check()` - One-shot health check
- `health.checkRemote()` - Check remote endpoint
- `health.create()` - Create custom kernel

### Endpoints

- `GET /health` - Full health status
- `GET /ready` - Readiness probe
- `GET /live` - Liveness probe
- `GET /metrics` - Prometheus/JSON metrics

### Plugins

- `http` - HTTP server plugin
- `runner` - Check runner plugin
- `aggregator` - Status aggregator plugin
- `metrics` - Metrics plugin (optional)
- `cli` - CLI plugin (optional)
- `thresholds` - Custom thresholds (optional)
- `history` - Check history (optional)
