# @oxog/health Implementation Tasks

## Phase 1: Configuration Setup

### Task 1.1: Create package.json
- [ ] Create `package.json` with all required fields
- [ ] Configure exports for dual ESM/CJS support
- [ ] Add bin entry for CLI
- [ ] Set keywords, author, license
- [ ] Configure scripts (build, test, lint, format, typecheck)

**File:** `package.json`

**Dependencies:** None (devDependencies only)

---

### Task 1.2: Create tsconfig.json
- [ ] Configure TypeScript strict mode
- [ ] Set target to ES2022
- [ ] Enable declaration and declarationMap
- [ ] Configure moduleResolution to "bundler"

**File:** `tsconfig.json`

---

### Task 1.3: Create vitest.config.ts
- [ ] Configure test environment as 'node'
- [ ] Set up v8 coverage provider
- [ ] Configure reporters (text, json, html)
- [ ] Set coverage thresholds to 100%
- [ ] Configure include paths

**File:** `vitest.config.ts`

---

### Task 1.4: Create tsup.config.ts
- [ ] Configure entry points (index.ts, plugins/index.ts)
- [ ] Set format to ['cjs', 'esm']
- [ ] Enable dts generation
- [ ] Configure sourcemap and treeshake
- [ ] Set clean: true

**File:** `tsup.config.ts`

---

### Task 1.5: Create .gitignore
- [ ] Ignore node_modules
- [ ] Ignore dist folder
- [ ] Ignore coverage folder
- [ ] Ignore .env files
- [ ] Ignore IDE-specific folders

**File:** `.gitignore`

---

## Phase 2: Core Types and Errors

### Task 2.1: Create src/types.ts
- [ ] Define `CheckHandler` type
- [ ] Define `CheckResult` interface
- [ ] Define `CheckConfig` interface
- [ ] Define `ServeOptions` interface
- [ ] Define `ThresholdConfig` interface
- [ ] Define `HealthServer` interface
- [ ] Define `HealthStatus` interface
- [ ] Define `CheckStatus` interface
- [ ] Define `Plugin` interface
- [ ] Define `HealthContext` interface
- [ ] Define `HealthKernel` interface
- [ ] Define `Metrics` interface
- [ ] Export all types

**File:** `src/types.ts`

**Dependencies:** None

---

### Task 2.2: Create src/errors.ts
- [ ] Define `HealthError` class
- [ ] Define error code constants
- [ ] Create `createError` helper function
- [ ] Export error classes and helpers

**File:** `src/errors.ts`

**Dependencies:**
- `src/types.ts`

---

## Phase 3: Utility Functions

### Task 3.1: Create src/utils/http.ts
- [ ] `parseUrl()` - Parse URL string into components
- [ ] `getHeader()` - Get request header by name
- [ ] `setStatus()` - Set HTTP status code
- [ ] `json()` - Send JSON response
- [ ] `text()` - Send text response
- [ ] `parseQuery()` - Parse query string parameters
- [ ] Export all functions

**File:** `src/utils/http.ts`

**Dependencies:** None (uses Node.js built-ins)

---

### Task 3.2: Create src/utils/time.ts
- [ ] `formatDuration()` - Format milliseconds to readable string
- [ ] `parseIsoDate()` - Parse ISO date string
- [ ] `now()` - Get current ISO timestamp
- [ ] `msToSeconds()` - Convert milliseconds to seconds
- [ ] `secondsToMs()` - Convert seconds to milliseconds
- [ ] Export all functions

**File:** `src/utils/time.ts`

**Dependencies:** None

---

### Task 3.3: Create src/utils/promise.ts
- [ ] `timeout()` - Add timeout to promise
- [ ] `retry()` - Retry function with exponential backoff
- [ ] `sleep()` - Promise-based delay
- [ ] `race()` - Race multiple promises
- [ ] `allSettled()` - Wait for all promises (polyfill if needed)
- [ ] Export all functions

**File:** `src/utils/promise.ts`

**Dependencies:** None

---

## Phase 4: Core Modules

### Task 4.1: Create src/core/interval-parser.ts
- [ ] `parse()` - Parse interval string to milliseconds
- [ ] `format()` - Format milliseconds to string
- [ ] Support formats: 's', 'm', 'h', 'd'
- [ ] Support numeric input (milliseconds)
- [ ] Add error handling for invalid formats

**File:** `src/core/interval-parser.ts`

**Dependencies:** None

**Tests:** `tests/unit/interval-parser.test.ts`

---

### Task 4.2: Create src/core/router.ts
- [ ] `Route` interface with pattern and handler
- [ ] `Router` class with methods:
  - [ ] `get()` - Register GET route
  - [ ] `post()` - Register POST route
  - [ ] `match()` - Match route by method and path
  - [ ] Named parameter extraction
- [ ] Return 404 for unmatched routes

**File:** `src/core/router.ts`

**Dependencies:**
- `src/utils/http.ts`

**Tests:** `tests/unit/router.test.ts`

---

### Task 4.3: Create src/core/check-runner.ts
- [ ] `CheckResult` interface
- [ ] `CheckRunner` class with methods:
  - [ ] `run()` - Execute single check with timeout
  - [ ] `runAll()` - Execute multiple checks in parallel
  - [ ] `runWithRetry()` - Execute with retry logic
  - [ ] `setTimeout()` - Set default timeout
  - [ ] `setRetries()` - Set default retry count
- [ ] Handle timeout errors
- [ ] Track execution time (latency)

**File:** `src/core/check-runner.ts`

**Dependencies:**
- `src/utils/promise.ts`
- `src/utils/time.ts`
- `src/types.ts`
- `src/errors.ts`

**Tests:** `tests/unit/check-runner.test.ts`

---

### Task 4.4: Create src/core/aggregator.ts
- [ ] `Aggregator` class with methods:
  - [ ] `aggregate()` - Aggregate check results
  - [ ] `calculateScore()` - Calculate health score
  - [ ] `determineStatus()` - Determine overall status
  - [ ] `addThreshold()` - Add custom threshold
- [ ] Weighted scoring based on check weights
- [ ] Configurable healthy/degraded thresholds
- [ ] Return detailed status for each check

**File:** `src/core/aggregator.ts`

**Dependencies:**
- `src/types.ts`

**Tests:** `tests/unit/aggregator.test.ts`

---

### Task 4.5: Create src/core/server.ts
- [ ] `ServerOptions` interface
- [ ] `HealthServer` class with methods:
  - [ ] `constructor()` - Initialize server
  - [ ] `listen()` - Start listening
  - [ ] `close()` - Graceful shutdown
  - [ ] `register()` - Register health check
  - [ ] `unregister()` - Remove health check
  - [ ] `list()` - List registered checks
  - [ ] `status()` - Get current status
- [ ] Handle HTTP requests
- [ ] Support keep-alive connections

**File:** `src/core/server.ts`

**Dependencies:**
- `src/core/router.ts`
- `src/core/check-runner.ts`
- `src/core/aggregator.ts`
- `src/core/interval-parser.ts`
- `src/types.ts`
- `src/errors.ts`

**Tests:** `tests/unit/server.test.ts`

---

## Phase 5: Micro-Kernel

### Task 5.1: Create src/kernel.ts
- [ ] `HealthKernel` class with methods:
  - [ ] `constructor()` - Initialize kernel
  - [ ] `use()` - Register plugin
  - [ ] `getContext()` - Get shared context
  - [ ] `getPlugin()` - Get plugin by name
  - [ ] `listPlugins()` - List all plugins
  - [ ] `init()` - Initialize all plugins
  - [ ] `destroy()` - Destroy all plugins
- [ ] Dependency resolution
- [ ] Plugin lifecycle management
- [ ] Event bus for inter-plugin communication

**File:** `src/kernel.ts`

**Dependencies:**
- `src/types.ts`
- `src/errors.ts`

**Tests:** `tests/unit/kernel.test.ts`

---

## Phase 6: Core Plugins

### Task 6.1: Create src/plugins/core/http.ts
- [ ] `HttpPlugin` class
- [ ] Implement Plugin interface
- [ ] Install HTTP server
- [ ] Register routes for /health, /ready, /live, /metrics
- [ ] Handle request/response cycle

**File:** `src/plugins/core/http.ts`

**Dependencies:**
- `src/kernel.ts`
- `src/core/server.ts`
- `src/types.ts`

**Tests:** `tests/unit/plugins/http.test.ts`

---

### Task 6.2: Create src/plugins/core/runner.ts
- [ ] `RunnerPlugin` class
- [ ] Implement Plugin interface
- [ ] Register check runner in context
- [ ] Execute checks on interval
- [ ] Update check results

**File:** `src/plugins/core/runner.ts`

**Dependencies:**
- `src/kernel.ts`
- `src/core/check-runner.ts`
- `src/types.ts`

**Tests:** `tests/unit/plugins/runner.test.ts`

---

### Task 6.3: Create src/plugins/core/aggregator.ts
- [ ] `AggregatorPlugin` class
- [ ] Implement Plugin interface
- [ ] Register aggregator in context
- [ ] Calculate health status
- [ ] Provide status to other plugins

**File:** `src/plugins/core/aggregator.ts`

**Dependencies:**
- `src/kernel.ts`
- `src/core/aggregator.ts`
- `src/types.ts`

**Tests:** `tests/unit/plugins/aggregator.test.ts`

---

## Phase 7: Optional Plugins

### Task 7.1: Create src/plugins/optional/metrics.ts
- [ ] `MetricsPlugin` class
- [ ] Implement Plugin interface
- [ ] Collect metrics from checks
- [ ] Generate Prometheus format
- [ ] Generate JSON format
- [ ] Register /metrics endpoint

**File:** `src/plugins/optional/metrics.ts`

**Dependencies:**
- `src/kernel.ts`
- `src/types.ts`

**Tests:** `tests/unit/plugins/metrics.test.ts`

---

### Task 7.2: Create src/plugins/optional/cli.ts
- [ ] `CliPlugin` class
- [ ] Implement Plugin interface
- [ ] Parse command-line arguments
- [ ] Implement 'serve' command
- [ ] Implement 'check' command
- [ ] Handle output formatting (json, table, minimal)

**File:** `src/plugins/optional/cli.ts`

**Dependencies:**
- `src/kernel.ts`
- `src/types.ts`

**Tests:** `tests/unit/plugins/cli.test.ts`

---

### Task 7.3: Create src/plugins/optional/thresholds.ts
- [ ] `ThresholdsPlugin` class
- [ ] Implement Plugin interface
- [ ] Allow custom threshold configuration
- [ ] Validate threshold values
- [ ] Provide threshold defaults

**File:** `src/plugins/optional/thresholds.ts`

**Dependencies:**
- `src/kernel.ts`
- `src/types.ts`

**Tests:** `tests/unit/plugins/thresholds.test.ts`

---

### Task 7.4: Create src/plugins/optional/history.ts
- [ ] `HistoryPlugin` class
- [ ] Implement Plugin interface
- [ ] Store check history
- [ ] Limit history size
- [ ] Provide trend data

**File:** `src/plugins/optional/history.ts`

**Dependencies:**
- `src/kernel.ts`
- `src/types.ts`

**Tests:** `tests/unit/plugins/history.test.ts`

---

### Task 7.5: Create src/plugins/index.ts
- [ ] Export all core plugins
- [ ] Export all optional plugins
- [ ] Export plugin factory functions
- [ ] Export Plugin type

**File:** `src/plugins/index.ts`

**Dependencies:**
- `src/plugins/core/http.ts`
- `src/plugins/core/runner.ts`
- `src/plugins/core/aggregator.ts`
- `src/plugins/optional/metrics.ts`
- `src/plugins/optional/cli.ts`
- `src/plugins/optional/thresholds.ts`
- `src/plugins/optional/history.ts`

---

## Phase 8: Main Entry Point

### Task 8.1: Create src/index.ts
- [ ] `health` object export with methods:
  - [ ] `serve()` - Start health server
  - [ ] `check()` - One-shot health check
  - [ ] `checkRemote()` - Check remote endpoint
  - [ ] `create()` - Create custom kernel
- [ ] Export all types
- [ ] Export all errors
- [ ] Export plugins

**File:** `src/index.ts`

**Dependencies:**
- `src/kernel.ts`
- `src/types.ts`
- `src/errors.ts`
- `src/core/server.ts`
- `src/core/check-runner.ts`
- `src/plugins/index.ts`

---

## Phase 9: Tests

### Task 9.1: Create tests/unit/kernel.test.ts
- [ ] Test plugin registration
- [ ] Test dependency resolution
- [ ] Test plugin lifecycle
- [ ] Test context sharing
- [ ] Test error handling

**File:** `tests/unit/kernel.test.ts`

---

### Task 9.2: Create tests/unit/server.test.ts
- [ ] Test server creation
- [ ] Test port binding
- [ ] Test route registration
- [ ] Test request handling
- [ ] Test graceful shutdown

**File:** `tests/unit/server.test.ts`

---

### Task 9.3: Create tests/unit/check-runner.test.ts
- [ ] Test single check execution
- [ ] Test timeout handling
- [ ] Test retry logic
- [ ] Test parallel execution
- [ ] Test error handling

**File:** `tests/unit/check-runner.test.ts`

---

### Task 9.4: Create tests/unit/aggregator.test.ts
- [ ] Test score calculation
- [ ] Test threshold determination
- [ ] Test weight distribution
- [ ] Test status aggregation
- [ ] Test empty checks

**File:** `tests/unit/aggregator.test.ts`

---

### Task 9.5: Create tests/unit/router.test.ts
- [ ] Test route matching
- [ ] Test parameter extraction
- [ ] Test 404 handling
- [ ] Test method-specific routes
- [ ] Test route ordering

**File:** `tests/unit/router.test.ts`

---

### Task 9.6: Create tests/unit/interval-parser.test.ts
- [ ] Test seconds parsing
- [ ] Test minutes parsing
- [ ] Test hours parsing
- [ ] Test numeric input
- [ ] Test invalid format handling

**File:** `tests/unit/interval-parser.test.ts`

---

### Task 9.7: Create tests/integration/serve.test.ts
- [ ] Test /health endpoint
- [ ] Test /ready endpoint
- [ ] Test /live endpoint
- [ ] Test custom checks integration
- [ ] Test timeout handling

**File:** `tests/integration/serve.test.ts`

---

### Task 9.8: Create tests/integration/probes.test.ts
- [ ] Test Kubernetes liveness probe
- [ ] Test Kubernetes readiness probe
- [ ] Test probe response formats
- [ ] Test probe failure scenarios

**File:** `tests/integration/probes.test.ts`

---

### Task 9.9: Create tests/integration/metrics.test.ts
- [ ] Test /metrics endpoint
- [ ] Test Prometheus format
- [ ] Test JSON format
- [ ] Test metrics content negotiation

**File:** `tests/integration/metrics.test.ts`

---

### Task 9.10: Create tests/integration/cli.test.ts
- [ ] Test serve command
- [ ] Test check command
- [ ] Test argument parsing
- [ ] Test output formatting
- [ ] Test exit codes

**File:** `tests/integration/cli.test.ts`

---

### Task 9.11: Create test fixtures
- [ ] `tests/fixtures/checks.ts` - Mock health checks
- [ ] Create mock database check
- [ ] Create mock Redis check
- [ ] Create mock HTTP API check
- [ ] Create mock failing check

**File:** `tests/fixtures/checks.ts`

---

## Phase 10: Examples

### Task 10.1: Create examples/01-basic/
- [ ] `minimal.ts` - Minimal working example
- [ ] `with-checks.ts` - Multiple checks example
- [ ] `README.md` - Documentation

**File:** `examples/01-basic/minimal.ts`

---

### Task 10.2: Create examples/02-checks/
- [ ] `database.ts` - Database health check
- [ ] `redis.ts` - Redis health check
- [ ] `http-api.ts` - External API check
- [ ] `custom.ts` - Custom check logic
- [ ] `README.md` - Documentation

**File:** `examples/02-checks/database.ts`

---

### Task 10.3: Create examples/03-kubernetes/
- [ ] `deployment.yaml` - K8s deployment example
- [ ] `probes.ts` - Probe configuration
- [ ] `README.md` - Documentation

**File:** `examples/03-kubernetes/deployment.yaml`

---

### Task 10.4: Create examples/04-metrics/
- [ ] `prometheus.ts` - Prometheus integration
- [ ] `grafana-dashboard.json` - Grafana dashboard
- [ ] `README.md` - Documentation

**File:** `examples/04-metrics/prometheus.ts`

---

### Task 10.5: Create examples/05-degradation/
- [ ] `critical-checks.ts` - Critical vs non-critical
- [ ] `health-score.ts` - Health scoring
- [ ] `README.md` - Documentation

**File:** `examples/05-degradation/critical-checks.ts`

---

### Task 10.6: Create examples/06-cli/
- [ ] `serve.sh` - CLI serve examples
- [ ] `check.sh` - CLI check examples
- [ ] `README.md` - Documentation

**File:** `examples/06-cli/serve.sh`

---

### Task 10.7: Create examples/07-advanced/
- [ ] `custom-plugin.ts` - Writing plugins
- [ ] `middleware.ts` - Request middleware
- [ ] `clustering.ts` - Multi-process
- [ ] `README.md` - Documentation

**File:** `examples/07-advanced/custom-plugin.ts`

---

## Phase 11: LLM-Native Files

### Task 11.1: Create llms.txt
- [ ] Package overview
- [ ] Installation instructions
- [ ] Basic usage example
- [ ] API summary
- [ ] Common patterns
- [ ] Error reference
- [ ] Links section
- [ ] Keep under 2000 tokens

**File:** `llms.txt`

---

### Task 11.2: Create README.md
- [ ] Package description
- [ ] Features list
- [ ] Installation
- [ ] Quick start
- [ ] API reference
- [ ] Examples
- [ ] CLI documentation
- [ ] Contributing guidelines

**File:** `README.md`

---

### Task 11.3: Update package.json keywords
- [ ] health
- [ ] health-check
- [ ] kubernetes
- [ ] k8s
- [ ] probes
- [ ] liveness
- [ ] readiness
- [ ] prometheus
- [ ] metrics
- [ ] zero-dependency

**File:** `package.json` (already created in Task 1.1)

---

## Phase 12: Website

### Task 12.1: Create website structure
- [ ] `website/package.json`
- [ ] `website/vite.config.ts`
- [ ] `website/tsconfig.json`
- [ ] `website/.gitignore`
- [ ] `website/public/CNAME` - health.oxog.dev
- [ ] `website/public/llms.txt`

**File:** `website/package.json`

---

### Task 12.2: Create website source files
- [ ] `website/src/main.tsx` - Entry point
- [ ] `website/src/App.tsx` - Main app component
- [ ] `website/src/App.css` - Global styles
- [ ] `website/src/index.css` - Tailwind imports
- [ ] `website/tailwind.config.js` - Tailwind config

**File:** `website/src/main.tsx`

---

### Task 12.3: Create website components
- [ ] `website/src/components/Navbar.tsx`
- [ ] `website/src/components/Footer.tsx`
- [ ] `website/src/components/CodeBlock.tsx` - IDE-style code blocks
- [ ] `website/src/components/ThemeToggle.tsx`

**File:** `website/src/components/Navbar.tsx`

---

### Task 12.4: Create website pages
- [ ] `website/src/pages/Home.tsx`
- [ ] `website/src/pages/GettingStarted.tsx`
- [ ] `website/src/pages/APIReference.tsx`
- [ ] `website/src/pages/Examples.tsx`
- [ ] `website/src/pages/Plugins.tsx`
- [ ] `website/src/pages/Kubernetes.tsx`

**File:** `website/src/pages/Home.tsx`

---

### Task 12.5: Configure website build
- [ ] Run `npm install` in website directory
- [ ] Configure Vite for static build
- [ ] Test website locally
- [ ] Build production version

**File:** `website/dist/` (generated)

---

## Phase 13: CI/CD

### Task 13.1: Create GitHub Actions workflow
- [ ] `.github/workflows/deploy.yml`
- [ ] Configure Node.js setup
- [ ] Run tests with coverage
- [ ] Build package
- [ ] Build website
- [ ] Deploy to GitHub Pages

**File:** `.github/workflows/deploy.yml`

---

## Phase 14: Final Verification

### Task 14.1: Run all tests
- [ ] Run `npm run test`
- [ ] Verify 100% coverage
- [ ] Fix any failing tests

**Command:** `npm run test`

---

### Task 14.2: Type checking
- [ ] Run `npm run typecheck`
- [ ] Fix any TypeScript errors

**Command:** `npm run typecheck`

---

### Task 14.3: Build package
- [ ] Run `npm run build`
- [ ] Verify ESM and CJS outputs
- [ ] Verify type definitions

**Command:** `npm run build`

---

### Task 14.4: Linting
- [ ] Run `npm run lint`
- [ ] Fix any linting issues

**Command:** `npm run lint`

---

### Task 14.5: Formatting
- [ ] Run `npm run format`
- [ ] Verify code formatting

**Command:** `npm run format`

---

### Task 14.6: Test examples
- [ ] Run each example
- [ ] Verify expected behavior
- [ ] Fix any issues

**Command:** `npx tsx examples/01-basic/minimal.ts`

---

### Task 14.7: Final documentation review
- [ ] Review README.md
- [ ] Review llms.txt
- [ ] Review all JSDoc comments
- [ ] Verify @example tags

---

## Completion Checklist

- [ ] All tasks completed
- [ ] All tests passing (100%)
- [ ] 100% code coverage
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Package builds successfully
- [ ] Website builds successfully
- [ ] All examples working
- [ ] Documentation complete
- [ ] llms.txt created and accurate
