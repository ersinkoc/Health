# Kubernetes Integration

## probes.ts

Run the health server configured for Kubernetes probes.

```bash
npx tsx examples/03-kubernetes/probes.ts
```

## deployment.yaml

Example Kubernetes Deployment with liveness and readiness probes.

```bash
kubectl apply -f examples/03-kubernetes/deployment.yaml
```

### Endpoints

- `GET /live` - Liveness probe (returns 200 if container is alive)
- `GET /ready` - Readiness probe (returns 200 if service is ready)
- `GET /health` - Full health status with all checks
