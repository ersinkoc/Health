/**
 * @oxog/health - Aggregator
 *
 * Aggregate check results into overall health status with scoring.
 * @packageDocumentation
 */

import type {
  CheckResult,
  CheckStatus,
  HealthStatus,
  ThresholdConfig,
} from '../types.js';
import type { RunResult } from './check-runner.js';

// ============================================================================
// Default Thresholds
// ============================================================================

const DEFAULT_THRESHOLDS: Required<ThresholdConfig> = {
  healthy: 80,
  degraded: 50,
};

// ============================================================================
// Aggregator Class
// ============================================================================

/**
 * Aggregates check results into an overall health status.
 *
 * @example
 * ```typescript
 * const aggregator = new Aggregator({ thresholds: { healthy: 80, degraded: 50 } });
 * const status = aggregator.aggregate(results);
 * ```
 */
export class Aggregator {
  private thresholds: Required<ThresholdConfig>;

  /**
   * Create a new aggregator with custom thresholds.
   *
   * @param options - Threshold configuration
   */
  constructor(options: ThresholdConfig = {}) {
    this.thresholds = {
      healthy: options.healthy ?? DEFAULT_THRESHOLDS.healthy,
      degraded: options.degraded ?? DEFAULT_THRESHOLDS.degraded,
    };
  }

  /**
   * Aggregate check results into a health status.
   *
   * @param results - Map of check names to results
   * @param uptime - Server uptime in seconds
   * @returns Aggregated health status
   *
   * @example
   * ```typescript
   * const results = new Map([
   *   ['database', { status: 'healthy', latency: 5 }],
   *   ['redis', { status: 'unhealthy', error: 'Connection refused' }]
   * ]);
   * const status = aggregator.aggregate(results, 3600);
   * ```
   */
  aggregate(
    results: Map<string, RunResult>,
    uptime: number
  ): HealthStatus {
    if (results.size === 0) {
      return this.createEmptyStatus(uptime);
    }

    const checkStatuses: Record<string, CheckStatus> = {};
    let totalWeight = 0;
    let weightedScore = 0;
    let hasCriticalFailure = false;
    let allCriticalHealthy = true;

    for (const [name, runResult] of results) {
      const result = runResult.result;
      const weight = result.weight ?? this.getDefaultWeight(results.size);

      // Check if this is a critical check that failed
      if (result.critical && result.status === 'unhealthy') {
        hasCriticalFailure = true;
        allCriticalHealthy = false;
      } else if (result.critical && result.status === 'healthy') {
        // Critical check passed, continue
      }

      // Calculate score for this check
      const checkScore = this.calculateCheckScore(result);
      weightedScore += (checkScore * weight) / 100;
      totalWeight += weight;

      // Create check status
      checkStatuses[name] = this.createCheckStatus(result, runResult.duration);
    }

    // Calculate overall score
    const overallScore = totalWeight > 0
      ? Math.round((weightedScore / totalWeight) * 100)
      : 100;

    // Determine overall status
    const status = this.determineStatus(overallScore, hasCriticalFailure);

    return {
      status,
      score: overallScore,
      uptime,
      timestamp: new Date().toISOString(),
      checks: checkStatuses,
    };
  }

  /**
   * Aggregate simple check results (without timing info).
   *
   * @param results - Map of check names to results
   * @param uptime - Server uptime in seconds
   * @returns Aggregated health status
   */
  aggregateSimple(
    results: Map<string, CheckResult>,
    uptime: number
  ): HealthStatus {
    if (results.size === 0) {
      return this.createEmptyStatus(uptime);
    }

    const checkStatuses: Record<string, CheckStatus> = {};
    let totalWeight = 0;
    let weightedScore = 0;
    let hasCriticalFailure = false;

    for (const [name, result] of results) {
      const weight = result.weight ?? this.getDefaultWeight(results.size);

      if (result.critical && result.status === 'unhealthy') {
        hasCriticalFailure = true;
      }

      const checkScore = this.calculateCheckScore(result);
      weightedScore += (checkScore * weight) / 100;
      totalWeight += weight;

      checkStatuses[name] = this.createSimpleCheckStatus(result);
    }

    const overallScore = totalWeight > 0
      ? Math.round((weightedScore / totalWeight) * 100)
      : 100;

    const status = this.determineStatus(overallScore, hasCriticalFailure);

    return {
      status,
      score: overallScore,
      uptime,
      timestamp: new Date().toISOString(),
      checks: checkStatuses,
    };
  }

  /**
   * Calculate a score for a single check result.
   */
  private calculateCheckScore(result: CheckResult): number {
    switch (result.status) {
      case 'healthy':
        return 100;
      case 'degraded':
        return 50;
      case 'unhealthy':
        return 0;
      default:
        return 0;
    }
  }

  /**
   * Determine overall status based on score and critical failures.
   */
  private determineStatus(
    score: number,
    hasCriticalFailure: boolean
  ): 'healthy' | 'degraded' | 'unhealthy' {
    // If any critical check failed, status is unhealthy
    if (hasCriticalFailure) {
      return 'unhealthy';
    }

    // Use score thresholds
    if (score >= this.thresholds.healthy) {
      return 'healthy';
    }

    if (score >= this.thresholds.degraded) {
      return 'degraded';
    }

    return 'unhealthy';
  }

  /**
   * Get default weight for a check.
   */
  private getDefaultWeight(totalChecks: number): number {
    return Math.floor(100 / totalChecks);
  }

  /**
   * Create a check status from a run result.
   */
  private createCheckStatus(
    result: CheckResult,
    duration: number
  ): CheckStatus {
    return {
      status: result.status,
      latency: result.latency ?? duration,
      lastCheck: new Date().toISOString(),
      error: result.error,
      metadata: result.metadata,
    };
  }

  /**
   * Create a simple check status.
   */
  private createSimpleCheckStatus(result: CheckResult): CheckStatus {
    return {
      status: result.status,
      latency: result.latency ?? 0,
      lastCheck: new Date().toISOString(),
      error: result.error,
      metadata: result.metadata,
    };
  }

  /**
   * Create an empty status when no checks are registered.
   */
  private createEmptyStatus(uptime: number): HealthStatus {
    return {
      status: 'healthy',
      score: 100,
      uptime,
      timestamp: new Date().toISOString(),
      checks: {},
    };
  }

  /**
   * Get the current thresholds.
   */
  getThresholds(): Readonly<Required<ThresholdConfig>> {
    return { ...this.thresholds };
  }

  /**
   * Update thresholds dynamically.
   */
  setThresholds(thresholds: ThresholdConfig): void {
    this.thresholds.healthy = thresholds.healthy ?? DEFAULT_THRESHOLDS.healthy;
    this.thresholds.degraded = thresholds.degraded ?? DEFAULT_THRESHOLDS.degraded;
  }

  /**
   * Calculate what the status would be for a given score.
   */
  predictStatus(score: number): 'healthy' | 'degraded' | 'unhealthy' {
    return this.determineStatus(score, false);
  }

  /**
   * Calculate what score is needed for healthy status.
   */
  getHealthyThreshold(): number {
    return this.thresholds.healthy;
  }

  /**
   * Calculate what score is needed for degraded status.
   */
  getDegradedThreshold(): number {
    return this.thresholds.degraded;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new aggregator with custom thresholds.
 *
 * @example
 * ```typescript
 * const aggregator = createAggregator({ healthy: 80, degraded: 50 });
 * ```
 */
export function createAggregator(options?: ThresholdConfig): Aggregator {
  return new Aggregator(options);
}
