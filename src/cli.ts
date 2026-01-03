#!/usr/bin/env node

/**
 * @oxog/health - CLI Entry Point
 *
 * Command-line interface for the health check server.
 *
 * @packageDocumentation
 */

import { main } from './plugins/optional/cli.js';

// Run CLI
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
