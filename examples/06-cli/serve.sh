#!/bin/bash

# @oxog/health - CLI Serve Examples

# Start health server on default port (9000)
npx @oxog/health serve

# Start on custom port
npx @oxog/health serve --port 8080

# Start on custom host and port
npx @oxog/health serve --port 8080 --host 127.0.0.1

# Custom check interval
npx @oxog/health serve --port 9000 --interval 10s

# Custom timeout
npx @oxog/health serve --port 9000 --timeout 10000

# With config file
npx @oxog/health serve --config health.config.js

# Enable database check
npx @oxog/health serve --port 9000 --check-db

# Enable Redis check
npx @oxog/health serve --port 9000 --check-redis

# Help
npx @oxog/health --help
