import { describe, it, expect } from 'vitest';
import { formatPrometheusMetrics, formatJsonMetrics } from '../../src/plugins/optional/metrics.js';

describe('metrics.ts - Prometheus Formatting', () => {
  const mockStatus = {
    status: 'healthy',
    score: 85,
    uptime: 3600,
    timestamp: new Date().toISOString(),
    checks: {
      database: {
        status: 'healthy',
        latency: 5,
        lastCheck: new Date().toISOString(),
      },
      cache: {
        status: 'healthy',
        latency: 1,
        lastCheck: new Date().toISOString(),
      },
      api: {
        status: 'degraded',
        latency: 150,
        lastCheck: new Date().toISOString(),
        error: 'high latency',
      },
    },
  };

  describe('formatPrometheusMetrics', () => {
    it('should format health check status metrics', () => {
      const output = formatPrometheusMetrics(mockStatus as any);
      expect(output).toContain('# HELP health_check_status');
      expect(output).toContain('# TYPE health_check_status gauge');
      expect(output).toContain('health_check_status{name="database"} 1');
      expect(output).toContain('health_check_status{name="cache"} 1');
      expect(output).toContain('health_check_status{name="api"} 0.5');
    });

    it('should format latency metrics', () => {
      const output = formatPrometheusMetrics(mockStatus as any);
      expect(output).toContain('# HELP health_check_latency_ms');
      expect(output).toContain('# TYPE health_check_latency_ms gauge');
      expect(output).toContain('health_check_latency_ms{name="database"} 5');
    });

    it('should format health score', () => {
      const output = formatPrometheusMetrics(mockStatus as any);
      expect(output).toContain('# HELP health_score');
      expect(output).toContain('# TYPE health_score gauge');
      expect(output).toContain('health_score 85');
    });

    it('should format uptime', () => {
      const output = formatPrometheusMetrics(mockStatus as any);
      expect(output).toContain('# HELP health_uptime_seconds');
      expect(output).toContain('# TYPE health_uptime_seconds counter');
      expect(output).toContain('health_uptime_seconds 3600');
    });
  });

  describe('formatJsonMetrics', () => {
    it('should format metrics as JSON object', () => {
      const output = formatJsonMetrics(mockStatus as any);
      expect(output).toEqual({
        uptime: 3600,
        score: 85,
        status: 'healthy',
        timestamp: mockStatus.timestamp,
        checks: {
          database: {
            status: 'healthy',
            latency: 5,
            lastCheck: mockStatus.checks.database.lastCheck,
            error: undefined,
          },
          cache: {
            status: 'healthy',
            latency: 1,
            lastCheck: mockStatus.checks.cache.lastCheck,
            error: undefined,
          },
          api: {
            status: 'degraded',
            latency: 150,
            lastCheck: mockStatus.checks.api.lastCheck,
            error: 'high latency',
          },
        },
      });
    });
  });
});
