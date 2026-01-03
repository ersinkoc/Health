import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts', 'src/plugins/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    entry: ['src/index.ts', 'src/cli.ts', 'src/plugins/index.ts'],
    resolve: true,
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: ['@oxog/health'],
  platform: 'node',
});
