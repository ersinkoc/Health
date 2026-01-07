# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-01-08

### Changed

- Improved test coverage from 93% to 98%+
- Added 72 test files with 741 total tests
- Updated coverage thresholds: 98% lines, 98% functions, 95% branches

### Added

- New test files for comprehensive coverage:
  - `check-runner-concurrency-limit.test.ts` - Concurrency limit tests
  - `history-plugin-event.test.ts` - History plugin event handling
  - `router-no-match.test.ts` - Router no-match scenarios
  - `serve-function.test.ts` - serve() function integration tests
  - `history-trends-edge.test.ts` - History trends edge cases
  - `server-json-metrics.test.ts` - JSON metrics format tests
  - `http-plugin-request-health.test.ts` - HTTP plugin events
  - `kernel-logger-debug.test.ts` - Kernel logger debug method
  - `aggregator-plugin-methods.test.ts` - Aggregator plugin methods
  - `runner-plugin-run-method.test.ts` - Runner plugin run method
  - `metrics-plugin-formats.test.ts` - Metrics plugin formats
  - `kernel-logger-error-data.test.ts` - Logger error with data
  - `aggregator-edge-coverage.test.ts` - Aggregator edge cases
  - `interval-parser-invalid.test.ts` - Invalid interval parsing
  - `router-middleware-end.test.ts` - Router middleware response
  - `server-interval-coverage.test.ts` - Server interval checks
  - `check-runner-timeout-in-retry.test.ts` - Timeout in retry
  - `http-utils-edge.test.ts` - HTTP utils edge cases
  - `promise-retry-exhaust.test.ts` - Promise retry exhaustion
  - `time-relative-singular.test.ts` - Time relative singular forms
  - `thresholds-reset.test.ts` - Thresholds reset functionality

### Fixed

- Improved test coverage for edge cases in aggregator, router, and server modules
- Enhanced coverage for utility functions (http, promise, time)
- Better testing of plugin lifecycle and event handling

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
