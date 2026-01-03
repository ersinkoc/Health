# CLI Examples

## serve.sh

Start the health check server.

```bash
# Make executable
chmod +x examples/06-cli/serve.sh

# Run examples
./examples/06-cli/serve.sh
```

## check.sh

Check a remote health endpoint.

```bash
# Make executable
chmod +x examples/06-cli/check.sh

# Run examples
./examples/06-cli/check.sh
```

### Commands

**serve** - Start the health server
```
npx @oxog/health serve [options]

Options:
  -p, --port <n>     Port to listen on (default: 9000)
  -h, --host <s>     Host to bind to (default: 0.0.0.0)
  -i, --interval <s> Check interval (default: 30s)
  -t, --timeout <n>  Check timeout in ms (default: 5000)
  --check-db         Enable database check (uses DATABASE_URL)
  --check-redis      Enable Redis check (uses REDIS_URL)
  -c, --config <f>   Config file path
  --help             Show help
```

**check** - Check remote endpoint
```
npx @oxog/health check <url> [options]

Options:
  -f, --format <t>  Output format: json | table | minimal
  -q, --quiet       Only output exit code
  --timeout <n>     Request timeout in ms (default: 5000)
  --help            Show help
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | healthy |
| 1 | degraded |
| 2 | unhealthy |
| 3 | error (connection failed, timeout, etc.) |
