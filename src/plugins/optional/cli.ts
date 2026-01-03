/**
 * @oxog/health - CLI Plugin
 *
 * Optional plugin that provides command-line interface.
 * @packageDocumentation
 */

import type { Plugin, HealthContext, CliArgs, HealthStatus, CheckConfig, CheckHandler } from '../../types.js';
import { serve } from '../../core/server.js';
import { json, text } from '../../utils/http.js';

// ============================================================================
// Plugin
// ============================================================================

/**
 * CLI plugin that provides command-line interface.
 *
 * This plugin is responsible for:
 * - Parsing command-line arguments
 * - Implementing 'serve' command
 * - Implementing 'check' command
 * - Handling output formatting
 *
 * @example
 * ```typescript
 * const kernel = createHealthKernel({});
 * kernel.use(cliPlugin);
 * ```
 */
export const cliPlugin: Plugin<HealthContext> = {
  name: 'cli',
  version: '1.0.0',
  dependencies: [],

  install(kernel) {
    kernel.emit('cli:installed', { parseArgs });
  },
};

/**
 * Parse command-line arguments.
 *
 * @example
 * ```typescript
 * const args = parseArgs(['serve', '--port', '9000']);
 * // { command: 'serve', port: 9000 }
 * ```
 */
export function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {
    command: 'serve',
    port: 9000,
    host: '0.0.0.0',
    format: 'table',
    quiet: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i] as string;

    if (arg === 'serve' || arg === 'check') {
      result.command = arg;
    } else if (arg === '-p' || arg === '--port') {
      const nextArg = args[++i];
      if (nextArg !== undefined) {
        result.port = parseInt(nextArg, 10);
      }
    } else if (arg === '-h' || arg === '--host') {
      const nextArg = args[++i];
      if (nextArg !== undefined) {
        result.host = nextArg;
      }
    } else if (arg === '-i' || arg === '--interval') {
      const nextArg = args[++i];
      if (nextArg !== undefined) {
        result.interval = nextArg;
      }
    } else if (arg === '-t' || arg === '--timeout') {
      const nextArg = args[++i];
      if (nextArg !== undefined) {
        result.timeout = parseInt(nextArg, 10);
      }
    } else if (arg === '-c' || arg === '--config') {
      const nextArg = args[++i];
      if (nextArg !== undefined) {
        result.config = nextArg;
      }
    } else if (arg === '-f' || arg === '--format') {
      const nextArg = args[++i];
      if (nextArg !== undefined) {
        result.format = nextArg as 'json' | 'table' | 'minimal';
      }
    } else if (arg === '-q' || arg === '--quiet') {
      result.quiet = true;
    } else if (arg === '--check-db') {
      result.checkDb = true;
    } else if (arg === '--check-redis') {
      result.checkRedis = true;
    } else if (arg === '--help' || arg === '-?') {
      result.help = true;
    } else if (arg === '--version' || arg === '-V') {
      result.version = true;
    } else if (arg === '--url') {
      const nextArg = args[++i];
      if (nextArg !== undefined) {
        result.url = nextArg;
      }
    } else if (!arg.startsWith('-')) {
      if (!result.url && result.command === 'check') {
        result.url = arg;
      }
    }

    i++;
  }

  return result;
}

// ============================================================================
// CLI Commands
// ============================================================================

/**
 * Run the serve command.
 *
 * @example
 * ```typescript
 * await serveCommand({
 *   port: 9000,
 *   host: '0.0.0.0'
 * });
 * ```
 */
export async function serveCommand(options: {
  port: number;
  host?: string;
  interval?: string;
  timeout?: number;
  checks?: Record<string, CheckConfig | CheckHandler>;
}): Promise<void> {
  const server = await serve({
    port: options.port,
    host: options.host,
    interval: options.interval,
    timeout: options.timeout,
    checks: options.checks as Record<string, CheckConfig> | undefined,
  });

  console.log(`Health server listening on http://${options.host || '0.0.0.0'}:${server.port}`);
  console.log('Endpoints:');
  console.log('  GET /health - Full health status');
  console.log('  GET /ready  - Readiness probe');
  console.log('  GET /live   - Liveness probe');
  console.log('  GET /metrics - Prometheus metrics');
  console.log('');
  console.log('Press Ctrl+C to stop');

  // Keep the process running
  await new Promise<void>((resolve) => {
    process.on('SIGINT', () => {
      server.close().then(resolve);
    });
    process.on('SIGTERM', () => {
      server.close().then(resolve);
    });
  });
}

/**
 * Run the check command.
 *
 * @example
 * ```typescript
 * await checkCommand('http://localhost:9000/health', 'json');
 * ```
 */
export async function checkCommand(
  url: string,
  format: 'json' | 'table' | 'minimal' = 'table'
): Promise<void> {
  try {
    const response = await fetch(url);
    const data = await response.json() as HealthStatus;

    switch (format) {
      case 'json':
        console.log(JSON.stringify(data, null, 2));
        break;

      case 'table':
        console.log(`Status: ${data.status}`);
        console.log(`Score: ${data.score}`);
        console.log(`Uptime: ${data.uptime}s`);
        console.log('');
        console.log('Checks:');
        for (const [name, check] of Object.entries(data.checks)) {
          const icon = check.status === 'healthy' ? '✓' : check.status === 'degraded' ? '!' : '✗';
          console.log(`  ${icon} ${name}: ${check.status}${check.error ? ` (${check.error})` : ''}`);
        }
        break;

      case 'minimal':
        console.log(data.status);
        break;
    }

    // Set exit code based on status
    process.exitCode = data.status === 'healthy' ? 0 : data.status === 'degraded' ? 1 : 2;
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exitCode = 3;
  }
}

/**
 * Display help message.
 */
export function displayHelp(): void {
  console.log(`
@oxog/health - Zero-dependency health check server

USAGE:
  npx @oxog/health <command> [options]

COMMANDS:
  serve              Start the health check server
  check <url>        Check a remote health endpoint

OPTIONS:
  -p, --port <n>     Port to listen on (default: 9000)
  -h, --host <s>     Host to bind to (default: 0.0.0.0)
  -i, --interval <s> Check interval (default: 30s)
  -t, --timeout <n>  Check timeout in ms (default: 5000)
  --check-db         Enable database check (uses DATABASE_URL)
  --check-redis      Enable Redis check (uses REDIS_URL)
  -c, --config <f>   Config file path
  -f, --format <t>   Output format: json | table | minimal
  -q, --quiet        Only output status
  --help             Show this help message
  --version          Show version information

EXAMPLES:
  npx @oxog/health serve --port 9000
  npx @oxog/health serve --port 8080 --host 127.0.0.1
  npx @oxog/health check http://localhost:9000/health
  npx @oxog/health check http://localhost:9000/health --format json

EXIT CODES:
  0 = healthy
  1 = degraded
  2 = unhealthy
  3 = error
`);
}

/**
 * Display version information.
 */
export function displayVersion(): void {
  console.log('@oxog/health v1.0.0');
}

// ============================================================================
// Plugin Factory
// ============================================================================

/**
 * Create a CLI plugin instance.
 *
 * @example
 * ```typescript
 * const myCliPlugin = cliPluginWithOptions();
 * kernel.use(myCliPlugin);
 * ```
 */
export function cliPluginWithOptions(): Plugin<HealthContext> {
  return {
    name: 'cli',
    version: '1.0.0',
    dependencies: [],

    install(kernel) {
      kernel.emit('cli:installed', { parseArgs });
    },
  };
}

// ============================================================================
// Main Entry Point (for CLI binary)
// ============================================================================

/**
 * Main entry point for CLI.
 */
export async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  if (args.help) {
    displayHelp();
    return;
  }

  if (args.version) {
    displayVersion();
    return;
  }

  if (args.command === 'serve') {
    await serveCommand({
      port: args.port ?? 9000,
      host: args.host,
      interval: args.interval,
      timeout: args.timeout,
    });
  } else if (args.command === 'check' && args.url) {
    await checkCommand(args.url, args.format);
  } else {
    displayHelp();
  }
}

// ============================================================================
// Exports
// ============================================================================
