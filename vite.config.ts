import solid from '@solidjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  // A relative base lets dist/ open from any folder of any static host, a project page included.
  base: './',
  // data/ and sample/ are fetched at run time, never bundled: tools/build-data.ts copies data/ into dist/,
  // and sample/ stays out of dist/ because it is made up.
  publicDir: false,
  build: { outDir: 'dist', emptyOutDir: true, target: 'es2023' },
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
});
