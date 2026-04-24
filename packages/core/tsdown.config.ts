import { defineConfig } from 'tsdown'

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts'],
  external: ['better-sqlite3', 'sqlite-vec', '@xenova/transformers', 'squatter', 'cmpstr'],
  format: 'esm',
})
