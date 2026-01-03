# Graceful Degradation Examples

## critical-checks.ts

Demonstrate critical vs non-critical checks.

```bash
npx tsx examples/05-degradation/critical-checks.ts
```

## health-score.ts

Demonstrate weighted health scoring.

```bash
npx tsx examples/05-degradation/health-score.ts
```

### Key Concepts

**Critical Checks:**
- Mark essential dependencies with `critical: true`
- Failure causes entire service to be marked unhealthy
- Used for: databases, primary caches, core APIs

**Non-Critical Checks:**
- Mark optional dependencies with `critical: false` (default)
- Failure only affects the health score
- Used for: logging, analytics, secondary services

**Health Score:**
- Calculated based on check weights and status
- healthy = 100 points
- degraded = 50 points
- unhealthy = 0 points

**Thresholds:**
- healthy: Score >= 80 = healthy status
- degraded: Score >= 50 = degraded status
- Score < 50 = unhealthy status
