#!/bin/bash

# @oxog/health - CLI Check Examples

# Check health endpoint (default table format)
npx @oxog/health check http://localhost:9000/health

# Check with JSON output
npx @oxog/health check http://localhost:9000/health --format json

# Check with minimal output
npx @oxog/health check http://localhost:9000/health --format minimal

# Quiet mode (exit code only)
npx @oxog/health check http://localhost:9000/health --quiet

# Custom timeout
npx @oxog/health check http://localhost:9000/health --timeout 10000

# Exit codes:
# 0 = healthy
# 1 = degraded
# 2 = unhealthy
# 3 = error
